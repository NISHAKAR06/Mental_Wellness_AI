import os
from dotenv import load_dotenv
from pathlib import Path
import dj_database_url

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production

# SECURITY WARNING: keep the secret key used in production secret!
# Use SECRET_KEY from environment, fallback to development key
SECRET_KEY = os.getenv('SECRET_KEY', os.getenv('DJANGO_SECRET_KEY', 'django-insecure-key-for-development-2025'))

# Gemini API Key for session summarization
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

import urllib.parse

# Allowed hosts from environment
allowed_hosts_env = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,*.up.railway.app')
ALLOWED_HOSTS = []
for host in allowed_hosts_env.split(','):
    host = host.strip()
    if host.startswith(('http://', 'https://')):
        parsed = urllib.parse.urlparse(host)
        ALLOWED_HOSTS.append(parsed.hostname)
    else:
        ALLOWED_HOSTS.append(host)


# Application definition

INSTALLED_APPS = [
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'api',
    'corsheaders',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Added for static files in production
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# CORS settings - configurable for production
# Clean up origins to remove trailing slashes which cause errors
cors_origins_raw = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
CORS_ALLOWED_ORIGINS = [origin.strip().rstrip('/') for origin in cors_origins_raw if origin.strip()]

# For production, allow specific origins or use allow_all for pre-configured domains
if os.getenv('CORS_ALLOW_ALL', 'false').lower() == 'true':
    CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"
ASGI_APPLICATION = "backend.asgi.application"


# Database

# Ensure DATABASE_URL is set, otherwise fallback to SQLite for build process if needed, or raise clear error
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    # Fallback for build process where DB might not be available yet
    DATABASE_URL = "sqlite:///db.sqlite3"
    print("⚠️ WARNING: DATABASE_URL not found, using SQLite fallback.")

DATABASES = {
    'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
}


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# AI Service Integration
FASTAPI_URL = os.getenv("FASTAPI_URL", "http://localhost:8001")
INTERNAL_AI_TOKEN = os.getenv("INTERNAL_AI_TOKEN", "your-secret-token-here")
