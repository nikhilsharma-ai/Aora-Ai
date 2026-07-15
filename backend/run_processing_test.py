import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.workers.tasks import _async_process_document

async def main():
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # We will test document ID 38 (YouTube video) or 31 (PDF file)
    doc_id = 33
    user_id = "user_mock_123"
    print(f"Starting manual run of _async_process_document for ID {doc_id}...")
    try:
        await _async_process_document(doc_id, user_id)
        print("Completed successfully!")
    except Exception as e:
        import traceback
        print(f"Error occurred: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
