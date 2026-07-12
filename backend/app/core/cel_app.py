from celery import Celery
from app.core.config import settings

# Initialize Celery app broker using Redis URL
celery_app = Celery(
    "aora_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1800, # 30 mins max execution limits
)

# Auto-discover tasks matching workers directories
celery_app.autodiscover_tasks(["app.workers"])
