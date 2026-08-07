from .base import *

DEBUG = True

SECRET_KEY = 'django-insecure-dev-key-something-very-long-and-secure-123456789'

ALLOWED_HOSTS = ['*']

# CORS / Cookie Settings for Development
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

AUTH_COOKIE_SECURE = False  # Allow HTTP cookies in local development
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
]
