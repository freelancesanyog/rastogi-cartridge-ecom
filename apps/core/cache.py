import logging
from typing import Any

from django.core.cache import caches

logger = logging.getLogger(__name__)


def get_cache_backend(alias: str = "default"):
    """
    Returns the underlying Django cache backend instance.
    """
    return caches[alias]


def delete_cache_pattern(pattern: str, alias: str = "default") -> int:
    """
    Deletes all cache keys matching the given pattern (e.g. 'catalog_cache_list_*')
    without clearing unrelated cache entries (like user sessions or health checks).
    Supports both Django's native RedisCache and LocMemCache.
    """
    count = 0
    try:
        backend = get_cache_backend(alias)

        # 1. Native RedisCache backend (Django 4.0+)
        if hasattr(backend, "_cache") and hasattr(backend._cache, "get_client"):
            client = backend._cache.get_client()
            search_pattern = backend.make_key(pattern)
            keys = list(client.scan_iter(match=search_pattern))
            if keys:
                client.delete(*keys)
                count = len(keys)

        # 2. Third-party cache backends supporting delete_pattern (e.g. django-redis)
        elif hasattr(backend, "delete_pattern"):
            count = backend.delete_pattern(pattern)

        # 3. LocMemCache fallback for local development / testing
        elif hasattr(backend, "_cache") and hasattr(backend, "_delete"):
            raw_pattern = pattern.replace("*", "")
            with backend._lock:
                keys_to_delete = [
                    k for k in backend._cache.keys() if raw_pattern in str(k)
                ]
                for k in keys_to_delete:
                    backend._delete(k)
                    count += 1

        logger.debug("Successfully deleted %d cache keys matching pattern: %s", count, pattern)
    except Exception as exc:
        logger.error("Failed to delete cache pattern '%s': %s", pattern, exc)

    return count


def delete_cache_keys(*keys: str, alias: str = "default") -> None:
    """
    Deletes specific cache keys.
    """
    if not keys:
        return
    try:
        backend = get_cache_backend(alias)
        backend.delete_many(keys)
    except Exception as exc:
        logger.error("Failed to delete cache keys %s: %s", keys, exc)


def safe_cache_get(key: str, default: Any = None, alias: str = "default") -> Any:
    """
    Safely retrieves a value from the cache. Returns default on error.
    """
    try:
        backend = get_cache_backend(alias)
        return backend.get(key, default)
    except Exception as exc:
        logger.error("Cache get error for key '%s': %s", key, exc)
        return default


def safe_cache_set(key: str, value: Any, timeout: int = None, alias: str = "default") -> bool:
    """
    Safely sets a value in the cache. Returns True on success, False on error.
    """
    try:
        backend = get_cache_backend(alias)
        backend.set(key, value, timeout=timeout)
        return True
    except Exception as exc:
        logger.error("Cache set error for key '%s': %s", key, exc)
        return False
