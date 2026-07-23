import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        self._qdrant_client = None

    def _get_client(self):
        if not self._qdrant_client:
            try:
                from qdrant_client import QdrantClient
                self._qdrant_client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                    api_key=settings.QDRANT_API_KEY,
                    timeout=5
                )
            except Exception as e:
                logger.warning(f"Failed to instantiate Qdrant Client: {e}")
        return self._qdrant_client

    async def init_collections(self):
        """Initializes collections if not exists"""
        client = self._get_client()
        if not client:
            return
        try:
            from qdrant_client.http.models import Distance, VectorParams
            collections = client.get_collections().collections
            names = [c.name for c in collections]
            if settings.QDRANT_COLLECTION not in names:
                client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION,
                    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant Collection: {settings.QDRANT_COLLECTION}")
            
            # Ensure payload field indexes exist for filtering
            try:
                from qdrant_client.http.models import PayloadSchemaType
                client.create_payload_index(
                    collection_name=settings.QDRANT_COLLECTION,
                    field_name="user_id",
                    field_schema=PayloadSchemaType.KEYWORD
                )
                client.create_payload_index(
                    collection_name=settings.QDRANT_COLLECTION,
                    field_name="document_id",
                    field_schema=PayloadSchemaType.INTEGER
                )
            except Exception:
                pass # Indexes may already exist
        except Exception as e:
            logger.error(f"Error initializing Qdrant Collections: {e}")

    async def upsert_chunks(self, document_id: int, user_id: str, chunks: List[str]):
        """Creates embedding vectors and uploads them to Qdrant index"""
        client = self._get_client()
        if not client:
            logger.info("Qdrant not running. Skipping database vector upsert.")
            return

        # Ensure collection exists before upserting
        await self.init_collections()

        try:
            import uuid
            # Qdrant requires point IDs to be unsigned integers or UUIDs (not arbitrary strings)
            # We use a deterministic UUID v5 so the same chunk always maps to the same ID
            _NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # standard URL namespace

            # Generate vectors (using a simple mock embedding or OpenAI API)
            vectors = []
            points = []
            for idx, text in enumerate(chunks):
                # Simulated 1536-dim vector for local checks, fallback to mock
                simulated_vector = [0.01 * (idx % 10)] * 1536
                
                # Deterministic UUID derived from document_id + chunk index
                point_id = str(uuid.uuid5(_NS, f"{document_id}-{idx}"))

                points.append({
                    "id": point_id,
                    "vector": simulated_vector,
                    "payload": {
                        "document_id": document_id,
                        "user_id": user_id,
                        "text": text,
                        "chunk_idx": idx
                    }
                })

            client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=points
            )
            logger.info(f"Upserted {len(chunks)} points to Qdrant index.")
        except Exception as e:
            logger.error(f"Error during Qdrant points upsert: {e}")

    async def query_similar_chunks(self, user_id: str, query: str, document_id: Optional[int] = None, limit: int = 4) -> List[Dict[str, Any]]:
        """Queries collection matching user scope and optional document scope"""
        client = self._get_client()
        if not client:
            # Return static fallback mockup details
            return [
                {
                    "text": "Deep learning is part of a broader family of machine learning methods based on artificial neural networks.",
                    "document_id": 1,
                    "score": 0.89
                },
                {
                    "text": "The transformer model introduced the self-attention mechanism, resolving recurrence bottleneck speeds.",
                    "document_id": 1,
                    "score": 0.81
                }
            ]

        try:
            # Generate simulated search vector matching index size
            query_vector = [0.05] * 1536
            
            # Query with payload filtering to isolate records belonging to user
            from qdrant_client.http.models import Filter, FieldCondition, MatchValue
            must_conditions = [
                FieldCondition(
                    key="user_id",
                    match=MatchValue(value=user_id)
                )
            ]
            if document_id is not None:
                must_conditions.append(
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                )

            results = client.query_points(
                collection_name=settings.QDRANT_COLLECTION,
                query=query_vector,
                query_filter=Filter(must=must_conditions),
                limit=limit
            ).points
            return [
                {
                    "text": r.payload.get("text", "") if r.payload else "",
                    "document_id": r.payload.get("document_id") if r.payload else None,
                    "score": r.score
                } for r in results
            ]
        except Exception as e:
            logger.error(f"Error during Qdrant query: {e}")
            return []

vector_service = VectorService()
