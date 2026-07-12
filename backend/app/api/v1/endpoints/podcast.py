from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any

from app.api import deps
from app.db.models.podcast import Podcast
from app.workers.tasks import generate_podcast_task

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def list_podcasts(
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Lists all generated study podcasts.
    """
    result = await db.execute(select(Podcast).where(Podcast.user_id == current_user["id"]))
    pods = result.scalars().all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "host_a": p.host_a,
            "host_b": p.host_b,
            "script": p.script,
            "audio_url": p.audio_url,
            "duration": p.duration,
            "created_at": p.created_at
        } for p in pods
    ]

@router.post("/generate", response_model=Dict[str, Any])
async def generate_podcast(
    title: str,
    topic: str,
    host_a: str = "Host (Conversational)",
    host_b: str = "Expert (Technical)",
    current_user: Dict[str, Any] = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Creates a podcast model record and schedules Celery synthesizers in the background.
    """
    new_pod = Podcast(
        user_id=current_user["id"],
        title=title,
        host_a=host_a,
        host_b=host_b,
        script=[]
    )
    db.add(new_pod)
    await db.commit()
    await db.refresh(new_pod)

    # Schedule worker execution tasks
    try:
        generate_podcast_task.delay(new_pod.id, current_user["id"], topic)
    except Exception:
        # Fallback to direct synchronous execution if Redis is not running locally
        import asyncio
        from app.workers.tasks import _async_generate_podcast
        asyncio.create_task(_async_generate_podcast(new_pod.id, current_user["id"], topic))

    return {
        "status": "processing",
        "message": "Podcast script generation and voice synthesis scheduled.",
        "podcast_id": new_pod.id
    }
