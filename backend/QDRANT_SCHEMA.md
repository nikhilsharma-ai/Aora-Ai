# Qdrant Vector Collection Schema Spec

This document details the configuration mapping for the Qdrant collections holding the vector embeddings of text chunks.

---

## 1. Collection Specifications

- **Collection Name**: `aora_chunks`
- **Vector Dimensions**: `1536` (matching standard OpenAI `text-embedding-3-small` or similar embeddings models)
- **Distance Metric**: `Cosine`
- **Segment Size**: Auto-optimized indexing threshold segments.

---

## 2. Point Payload Mappings

Each point in the collection represents a single parsed document chunk:

```json
{
  "id": "uuid-v4-identifier",
  "vector": [0.0125, -0.0543, ..., 0.1238],
  "payload": {
    "tenant_id": "user_123_clerk_or_org_uuid", // Multi-tenant primary identifier
    "workspace_id": "uuid-workspace-abc",       // Workspace context
    "document_id": 45,                          // PostgreSQL document table foreign key
    "chunk_index": 3,                           // Index position of the text chunk
    "text": "Cellular respiration occurs in three main metabolic steps...", // Raw text snippet
    "metadata": {
      "source_page": 4,
      "tokens_count": 128
    }
  }
}
```

---

## 3. Payload Indexes

To optimize query speeds, we configure indexes on key payload fields. This isolates searches within a user's workspaces:

1. **`tenant_id`**: Keyword Index
2. **`workspace_id`**: Keyword Index
3. **`document_id`**: Integer Index

### Qdrant index creation command:

```bash
curl -X PUT "http://localhost:6333/collections/aora_chunks/index" \
     -H "Content-Type: application/json" \
     -d '{
       "field_name": "tenant_id",
       "field_schema": "keyword"
     }'
```

---

## 4. Multi-Tenant Query Filtration

When performing semantic searches, we supply pre-filters so that Qdrant limits the cosine distance checks strictly to the target workspace points:

```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

client = QdrantClient(host="localhost", port=6333)

def search_workspace_rag(workspace_id: str, query_vector: list, limit: int = 4):
    results = client.search(
        collection_name="aora_chunks",
        query_vector=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="workspace_id",
                    match=MatchValue(value=workspace_id)
                )
            ]
        ),
        limit=limit
    )
    return results
```
