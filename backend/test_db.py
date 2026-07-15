import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, SessionLocal
from app.db.models.document import Document
from sqlalchemy.future import select

async def main():
    print(f"Engine: {engine}")
    print(f"Pool: {engine.pool}")
    
    async with SessionLocal() as db:
        print("Executing first query...")
        result = await db.execute(select(Document).limit(1))
        doc = result.scalar_one_or_none()
        print(f"First query succeeded: {doc.name if doc else 'No document'}")
        
        print("Sleeping for 5 seconds...")
        await asyncio.sleep(5)
        
        print("Executing second query...")
        try:
            result = await db.execute(select(Document).limit(1))
            doc = result.scalar_one_or_none()
            print(f"Second query succeeded: {doc.name if doc else 'No document'}")
        except Exception as e:
            print(f"Second query failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
