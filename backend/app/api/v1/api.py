from fastapi import APIRouter
from app.api.v1.endpoints import auth, documents, chat, study, podcast, research, mindmap, billing

api_router = APIRouter()

# Register sub-routing endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(study.router, prefix="/study", tags=["study"])
api_router.include_router(podcast.router, prefix="/podcast", tags=["podcast"])
api_router.include_router(research.router, prefix="/research", tags=["research"])
api_router.include_router(mindmap.router, prefix="/mindmap", tags=["mindmap"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
