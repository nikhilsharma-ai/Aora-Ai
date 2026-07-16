import asyncio
import threading
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional

from app.api import deps
from app.db.models.document import Document
from app.workers.tasks import process_document_task

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def list_user_documents(
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Lists all uploaded study guides, notes, links, and documents.
    """
    result = await db.execute(select(Document).where(Document.user_id == current_user["id"]))
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "file_url": d.file_url,
            "doc_type": d.doc_type,
            "status": d.status,
            "summary": d.summary,
            "created_at": d.created_at
        } for d in docs
    ]

@router.post("/upload", response_model=Dict[str, Any])
async def upload_document(
    name: str = Form(...),
    doc_type: str = Form(...), # pdf, doc, youtube, mp3, note
    file_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Ingests PDFs, doc files, mp3s, youtube links, or raw note text. 
    Triggers the Celery parser task in the background.
    """
    user_id = current_user["id"]
    
    upload_url = file_url
    if doc_type == "youtube" and upload_url and (not name or name in ("Website link", "YouTube or website link", "YouTube link", "Link", "New Website note", "New YouTube note")):
        try:
            import httpx
            import re
            if "youtube.com" in upload_url or "youtu.be" in upload_url:
                oembed_url = f"https://www.youtube.com/oembed?url={upload_url}&format=json"
                async with httpx.AsyncClient() as client:
                    response = await client.get(oembed_url, timeout=5.0)
                    if response.status_code == 200:
                        data = response.json()
                        resolved_title = data.get("title")
                        if resolved_title:
                            name = resolved_title
            else:
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    response = await client.get(upload_url, timeout=5.0, headers={"User-Agent": "Mozilla/5.0"})
                    if response.status_code == 200:
                        match = re.search(r"<title>(.*?)</title>", response.text, re.IGNORECASE | re.DOTALL)
                        if match:
                            title_text = match.group(1).strip()
                            title_text = re.sub(r"\s+", " ", title_text)
                            name = title_text
        except Exception:
            pass

    import tempfile
    import os
    temp_dir = os.path.join(tempfile.gettempdir(), "aora_uploads")

    if file:
        import shutil
        os.makedirs(temp_dir, exist_ok=True)
        original_filename = file.filename or name or "document"
        safe_name = "".join(c for c in original_filename if c.isalnum() or c in (' ', '_', '-', '.')).rstrip()
        safe_name = safe_name.replace(' ', '_')
        file_path = os.path.join(temp_dir, f"{user_id}_{safe_name}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        upload_url = file_path
        if not name or name in ("Document upload", "Any PDF, DOC, PPT, etc", "document"):
            name = original_filename

    if raw_text:
        os.makedirs(temp_dir, exist_ok=True)
        # Sanitize filename
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).rstrip()
        safe_name = safe_name.replace(' ', '_')
        file_path = os.path.join(temp_dir, f"{safe_name}_{user_id}.txt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(raw_text)
        upload_url = file_path
    
    if not upload_url:
        upload_url = f"https://mock-supabase.aora.ai/files/{name}"

    new_doc = Document(
        user_id=user_id,
        name=name,
        file_url=upload_url,
        doc_type=doc_type,
        status="processing"
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    # Trigger async parsing task on Celery workers
    try:
        process_document_task.delay(new_doc.id, user_id)
    except Exception:
        # Fallback: run directly as an asyncio task on the server's running event loop
        # to avoid event loop conflicts when accessing the database connection pool.
        from app.workers.tasks import _async_process_document
        asyncio.create_task(_async_process_document(new_doc.id, user_id))

    return {
        "status": "processing",
        "message": "File parsing task scheduled successfully.",
        "document_id": new_doc.id
    }

@router.get("/fetch-title", response_model=Dict[str, Any])
async def fetch_url_title(url: str):
    """
    Fetches the title of a YouTube video or website URL.
    """
    import httpx
    import re
    try:
        # Check if it's a YouTube link
        if "youtube.com" in url or "youtu.be" in url:
            # Call YouTube's public oembed endpoint
            oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
            async with httpx.AsyncClient() as client:
                response = await client.get(oembed_url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return {"title": data.get("title", "YouTube Video")}
        
        # Fallback to standard HTTP fetch and title tag parsing for general websites
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(url, timeout=5.0, headers={"User-Agent": "Mozilla/5.0"})
            if response.status_code == 200:
                match = re.search(r"<title>(.*?)</title>", response.text, re.IGNORECASE | re.DOTALL)
                if match:
                    title_text = match.group(1).strip()
                    title_text = re.sub(r"\s+", " ", title_text)
                    return {"title": title_text}
    except Exception:
        pass
        
    return {"title": "Web Resource"}


@router.get("/{document_id}", response_model=Dict[str, Any])
async def get_document_details(
    document_id: int,
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Fetches processed summaries and status flags.
    """
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user["id"])
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document asset not found.")
    
    return {
        "id": doc.id,
        "name": doc.name,
        "status": doc.status,
        "summary": doc.summary,
        "file_url": doc.file_url,
        "doc_type": doc.doc_type
    }

