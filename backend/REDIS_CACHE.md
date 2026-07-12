# Redis Caching & In-Memory Storage Strategy

Aora AI uses Redis 7+ as a high-speed cache, Celery job broker, and rate limiter. This spec documents our cache patterns and configurations.

---

## 1. Key Naming & TTL Configurations

We adopt a structured namespace format `module:submodule:identifier` to ensure clean lookups and avoid key collisions.

| Cache Key Pattern | Data Structure | TTL | Eviction Policy | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `user:profile:{user_id}` | String (JSON) | `86400` (24 Hours) | `volatile-lru` | Eliminates Postgres lookup on authenticated requests. |
| `chat:history:{chat_id}` | List (JSON strings) | `3600` (1 Hour) | `volatile-lru` | Speeds up loading of recent workspace messages. |
| `rate:limit:{user_id}:{endpoint}` | String (Counter) | `60` (1 Minute) | `volatile-lru` | Enforces client request thresholds. |
| `doc:outline:cache:{doc_id}` | Hash | `604800` (7 Days) | `allkeys-lru` | Prevents repeating heavy summary generation calls. |

---

## 2. Rate Limiting Implementation

Enforced at the FastAPI API gateway layer using Redis transaction pipelines:

```python
import time
from redis import Redis

redis_client = Redis(host="localhost", port=6379, db=0)

def is_rate_limited(user_id: str, limit: int = 60, window: int = 60) -> bool:
    """
    Implements a rolling window rate limiter using Redis sorted sets.
    """
    now = time.time()
    key = f"rate:limit:{user_id}"
    clear_before = now - window

    pipe = redis_client.pipeline()
    # Remove logs older than rolling window limit
    pipe.zremrangebyscore(key, 0, clear_before)
    # Count messages logged in active window
    pipe.zcard(key)
    # Log current query
    pipe.zadd(key, {str(now): now})
    # Reset expire window
    pipe.expire(key, window)
    
    _, count, _, _ = pipe.execute()
    return count > limit
```

---

## 3. Eviction Policy

For caching performance, our Redis configurations (`redis.conf`) set:

```text
maxmemory 4gb
maxmemory-policy volatile-lru
```

- **`volatile-lru`**: Redis evicts keys with an expire set using the Least Recently Used algorithm first, ensuring session data and limits aren't dropped prematurely.
