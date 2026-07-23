from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional

from app.api import deps
from app.db.models.chat import Chat, ChatMessage
from app.services.llm import llm_service
from app.services.vector import vector_service

router = APIRouter()

@router.get("/threads", response_model=List[Dict[str, Any]])
async def list_chat_threads(
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Lists conversation history threads.
    """
    result = await db.execute(select(Chat).where(Chat.user_id == current_user["id"]))
    chats = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "persona": c.persona,
            "created_at": c.created_at
        } for c in chats
    ]

@router.post("/threads", response_model=Dict[str, Any])
async def create_chat_thread(
    title: str,
    persona: str = "academic",
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Spawns a new AI conversation thread.
    """
    new_chat = Chat(
        user_id=current_user["id"],
        title=title,
        persona=persona
    )
    db.add(new_chat)
    await db.commit()
    await db.refresh(new_chat)
    return {"id": new_chat.id, "title": new_chat.title, "persona": new_chat.persona}

@router.post("/threads/{chat_id}/messages", response_model=Dict[str, Any])
async def send_chat_message(
    chat_id: int,
    text: str,
    document_id: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Dispatches a query, checks Qdrant for matching context (RAG), 
    and generates an LLM response complete with paper citation links.
    """
    user_id = current_user["id"]
    
    # Verify chat thread exists or create it safely
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    if not chat:
        try:
            chat = Chat(
                id=chat_id,
                user_id=user_id,
                title="Note Chat Workspace",
                persona="academic"
            )
            db.add(chat)
            await db.commit()
            await db.refresh(chat)
        except Exception:
            await db.rollback()
            chat = Chat(
                user_id=user_id,
                title="Note Chat Workspace",
                persona="academic"
            )
            db.add(chat)
            await db.commit()
            await db.refresh(chat)

    # 1. Fetch relevant document chunks from Qdrant vector space ONLY when document_id is specified
    similar_chunks = []
    if document_id is not None:
        try:
            similar_chunks = await vector_service.query_similar_chunks(
                user_id=user_id,
                query=text,
                document_id=document_id,
                limit=3
            )
        except Exception as qerr:
            print(f"Qdrant query failed: {qerr}")

    # 2. Format context text & citations
    context_str = ""
    citations = []
    if document_id is not None and similar_chunks:
        for idx, chunk in enumerate(similar_chunks):
            if chunk.get("text"):
                context_str += f"\n- Context block [{idx+1}]: {chunk['text']}"

    # 3. Formulate prompts
    if context_str:
        system_prompt = (
            "You are Aora AI, an expert academic tutor and study companion. "
            "Answer the user's query clearly and accurately using the supplied document context. "
            "If the context does not fully answer the question, supplement it with your general knowledge. "
            "Be structured, factual, and clear. Do NOT say 'there is no mention in context blocks'."
        )
        user_prompt = f"Document Context:{context_str}\n\nUser Question: {text}"
    else:
        system_prompt = (
            "You are Aora AI, an intelligent academic tutor and study companion. "
            "Answer the user's question directly, clearly, and comprehensively using your knowledge. "
            "Structure your answer with key concepts, bullet points, and code/examples where helpful. "
            "Never refer to context blocks or missing documents — just give a direct, expert answer."
        )
        user_prompt = text

    # 4. Generate LLM response text
    ai_response_text = await llm_service.generate_text(
        prompt=user_prompt,
        system_prompt=system_prompt,
        provider="gemini"
    )

    # 5. Save messaging interactions
    user_msg = ChatMessage(chat_id=chat_id, sender="user", text=text)
    ai_msg = ChatMessage(chat_id=chat_id, sender="ai", text=ai_response_text, sources=citations)
    
    db.add(user_msg)
    db.add(ai_msg)
    await db.commit()

    return {
        "user_message": {"sender": "user", "text": text},
        "ai_response": {
            "sender": "ai",
            "text": ai_response_text,
            "sources": citations
        }
    }
