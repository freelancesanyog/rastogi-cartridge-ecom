import sys

# Python 3.14 compatibility patch for Django template context copying (copy(super()) issue)
if sys.version_info >= (3, 14):
    import django.template.context as _context_module

    def _patched_base_context_copy(self):
        duplicate = object.__new__(self.__class__)
        duplicate.__dict__.update(self.__dict__)
        duplicate.dicts = self.dicts[:]
        return duplicate

    _context_module.BaseContext.__copy__ = _patched_base_context_copy

from .celery import app as celery_app

__all__ = ("celery_app",)

