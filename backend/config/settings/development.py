from .base import *


DEBUG = True

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
]


REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] += [
    "rest_framework.renderers.BrowsableAPIRenderer",
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_URLS_REGEX = r"^/api/.*$"

CORS_ALLOW_CREDENTIALS = False

CORS_EXPOSE_HEADERS = [
    "Content-Disposition",
    "X-Exported-Rows",
]