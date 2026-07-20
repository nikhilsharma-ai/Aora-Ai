import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional

from app.api import deps
from app.db.models.document import Document
from app.services.llm import llm_service

router = APIRouter()


@router.get("/", response_model=List[Dict[str, Any]])
async def list_podcasts(
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """Lists all AI-generated podcasts for the current user."""
    # Podcasts are stored client-side for now; return empty list as placeholder
    return []


@router.post("/generate", response_model=Dict[str, Any])
async def generate_podcast(
    document_id: int,
    title: Optional[str] = "AI Podcast",
    host_a: Optional[str] = "Alex",
    host_b: Optional[str] = "Jordan",
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Generates a two-host conversational podcast script from a document.
    Uses the LLM service to create a structured dialogue between two AI personas.
    """
    doc_res = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user["id"]
        )
    )
    doc = doc_res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    content = doc.summary or doc.name

    prompt = (
        f"Create an engaging podcast conversation between two hosts named {host_a} and {host_b} "
        f"discussing the following content. Make it conversational, educational, and interesting.\n\n"
        f"Document Title: {doc.name}\n\nContent:\n{content}\n\n"
        "Return a valid JSON array of dialogue turns. Format:\n"
        '[{"speaker": "Alex", "text": "Welcome to the show..."}, {"speaker": "Jordan", "text": "..."}]\n'
        "Include at least 6 turns. Do NOT include markdown or extra text."
    )

    raw = await llm_service.generate_text(
        prompt=prompt,
        system_prompt=(
            "You are a professional podcast script writer. "
            "Return only valid JSON arrays of dialogue turns."
        ),
        provider="gemini"
    )

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        script = json.loads(cleaned)
        if not isinstance(script, list):
            raise ValueError("Not a list")
    except Exception:
        script = [
            {"speaker": host_a, "text": f"Welcome to today's episode! We're covering: {doc.name}."},
            {"speaker": host_b, "text": "That's right! Let's dive right in."},
            {"speaker": host_a, "text": f"The key insight from this material is that {content[:200]}..."},
            {"speaker": host_b, "text": "Fascinating! Could you elaborate on the main concepts?"},
            {"speaker": host_a, "text": "Of course. The core principles revolve around understanding and applying these ideas practically."},
            {"speaker": host_b, "text": "Great summary. Thanks for listening everyone!"},
        ]

    return {
        "status": "success",
        "podcast": {
            "title": title,
            "host_a": host_a,
            "host_b": host_b,
            "document_id": document_id,
            "script": script,
            "duration": f"{len(script) * 30}s",
        }
    }
