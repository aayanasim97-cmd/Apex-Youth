from .base import *
import os

DEBUG = False

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

ALLOWED_HOSTS = [host for host in os.environ.get('ALLOWED_HOSTS', '').split(',') if host]
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*', '.vercel.app', '.onrender.com', 'localhost', '127.0.0.1']
else:
    if '.vercel.app' not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append('.vercel.app')



# PostgreSQL Production Database Configuration
DB_NAME = os.environ.get("POSTGRES_DB", "apexyouth")
DB_USER = os.environ.get("POSTGRES_USER", "postgres")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "postgres")
DB_HOST = os.environ.get("POSTGRES_HOST", "db")
DB_PORT = os.environ.get("POSTGRES_PORT", "5432")

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
    }
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [origin for origin in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',') if origin]
CORS_ALLOW_CREDENTIALS = True

# Secure Cookie Settings for Production (HTTPS Gated)
AUTH_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Dynamic SameSite cookie configuration. 
# Cross-domain setups (e.g. frontend on vercel, backend on render) require 'None'.
# Same-domain or reverse-proxied setups use 'Lax'.
AUTH_COOKIE_SAME_SITE = os.environ.get('AUTH_COOKIE_SAME_SITE', 'Lax')
SESSION_COOKIE_SAME_SITE = os.environ.get('SESSION_COOKIE_SAME_SITE', 'Lax')
CSRF_COOKIE_SAME_SITE = os.environ.get('CSRF_COOKIE_SAME_SITE', 'Lax')

# Map SimpleJWT signing key to the production secret key
SIMPLE_JWT = {
    **SIMPLE_JWT,
    'SIGNING_KEY': SECRET_KEY,
}
