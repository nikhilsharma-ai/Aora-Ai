import asyncio
import sys
import os

# Add backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.models.document import Document
from sqlalchemy.future import select

async def main():
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    async with SessionLocal() as db:
        result = await db.execute(select(Document).order_by(Document.id.desc()))
        docs = result.scalars().all()
        print(f"Total documents found: {len(docs)}")
        for doc in docs[:10]:  # Let's print the 10 most recent
            summary_len = len(doc.summary) if doc.summary else 0
            print(f"ID: {doc.id} | Name: {doc.name} | Status: {doc.status} | UserID: {doc.user_id} | URL: {doc.file_url}")

if __name__ == "__main__":
    asyncio.run(main())
