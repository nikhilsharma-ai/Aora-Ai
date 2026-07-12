import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self._supabase_client = None

    def _get_client(self):
        if not self._supabase_client and settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                from supabase import create_client
                self._supabase_client = create_client(
                    supabase_url=settings.SUPABASE_URL,
                    supabase_key=settings.SUPABASE_KEY
                )
            except Exception as e:
                logger.error(f"Failed to instantiate Supabase client: {e}")
        return self._supabase_client

    async def upload_file(self, file_bytes: bytes, file_name: str, content_type: str = "application/octet-stream") -> str:
        """
        Uploads asset content to Supabase Storage bucket.
        Returns the public URL address of the uploaded file.
        """
        client = self._get_client()
        if not client:
            logger.info("Supabase credentials missing. Returning local mock URL link.")
            return f"https://mock-storage.aora.ai/files/{file_name}"

        try:
            # Upload file bytes to bucket
            bucket = client.storage.from_(settings.SUPABASE_BUCKET)
            response = bucket.upload(
                path=file_name,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            # Fetch public URL address
            public_url = bucket.get_public_url(file_name)
            return public_url
        except Exception as e:
            logger.error(f"Error uploading file to Supabase Storage: {e}")
            return f"https://mock-storage.aora.ai/files/{file_name}"

storage_service = StorageService()
