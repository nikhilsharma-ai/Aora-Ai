import asyncio
import sys
import os

# Add parent directory to path so app can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from app.db.base import Base

async def init_models():
    print("Connecting to database and creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All database tables created successfully in PostgreSQL!")

if __name__ == "__main__":
    asyncio.run(init_models())
