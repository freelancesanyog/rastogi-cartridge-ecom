import sys

from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

if env("EMAIL_HOST_USER", default=""):  # noqa: F405
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Control whether local development uses Redis or in-memory fallback.
# Set USE_REDIS_CACHE=True in .env if a local Redis server is running or when testing Redis.
USE_REDIS_CACHE = env.bool("USE_REDIS_CACHE", default=False)  # noqa: F405

if not USE_REDIS_CACHE or "pytest" in sys.modules or "test" in sys.argv:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

# Use SQLite in-memory database during pytest execution
if "pytest" in sys.modules or "test" in sys.argv:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

