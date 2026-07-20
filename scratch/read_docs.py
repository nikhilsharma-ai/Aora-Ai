import asyncio
import os
import sys

# Load env variables from backend/.env
from dotenv import load_dotenv
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
load_dotenv(os.path.join(backend_dir, ".env"))

sys.path.append(backend_dir)

from app.db.session import SessionLocal
from app.db.models.document import Document
from sqlalchemy.future import select

async def main():
    async with SessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == 53))
        doc = result.scalar_one_or_none()
        if doc:
            out_file = os.path.join(os.path.dirname(__file__), "doc_53_summary.html")
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(doc.summary or "")
            print(f"Successfully wrote document {doc.id} summary ({len(doc.summary or '')} characters) to {out_file}")
        else:
            print("Document 53 not found!")

if __name__ == "__main__":
    asyncio.run(main())
