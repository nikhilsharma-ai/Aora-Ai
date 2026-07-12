import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class Podcast(Base):
    __tablename__ = "podcasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    host_a: Mapped[str] = mapped_column(String, default="Host A")
    host_b: Mapped[str] = mapped_column(String, default="Host B")
    script: Mapped[list] = mapped_column(JSON, default=list, nullable=False) # Dialog script JSON structure
    audio_url: Mapped[str] = mapped_column(String, nullable=True)
    duration: Mapped[str] = mapped_column(String, nullable=True) # formatted "MM:SS"
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
