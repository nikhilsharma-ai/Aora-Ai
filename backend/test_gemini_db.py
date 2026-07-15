import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, SessionLocal
from app.db.models.document import Document
from sqlalchemy.future import select
from app.services.llm import llm_service

async def main():
    async with SessionLocal() as db:
        print("Executing first query...")
        result = await db.execute(select(Document).limit(1))
        doc = result.scalar_one_or_none()
        print(f"First query succeeded: ID {doc.id if doc else 'None'}")
        
        print("Calling Gemini API...")
        try:
            res = await llm_service.generate_text("Say hello", provider="gemini")
            print(f"Gemini API succeeded: {res}")
        except Exception as e:
            print(f"Gemini API failed: {e}")
            
        print("Executing second query...")
        try:
            result = await db.execute(select(Document).limit(1))
            doc = result.scalar_one_or_none()
            print(f"Second query succeeded: ID {doc.id if doc else 'None'}")
        except Exception as e:
            print(f"Second query failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
