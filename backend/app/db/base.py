# Import all models for Alembic metadata tracking
from app.db.base_class import Base  # noqa
from app.db.models.user import User  # noqa
from app.db.models.document import Document  # noqa
from app.db.models.chat import Chat, ChatMessage  # noqa
from app.db.models.study import Deck, Flashcard  # noqa
from app.db.models.quiz import Quiz, QuizQuestion  # noqa
from app.db.models.podcast import Podcast  # noqa
