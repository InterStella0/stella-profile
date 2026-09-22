import os
from pathlib import Path


def _required(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Environment variable {name} is required")
    return value


DATABASE_URL = _required("DATABASE_URL")
UPLOAD_DIR = os.environ.get("UPLOAD_DIR") or str(Path(__file__).resolve().parent.parent / "uploads")

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "")

KOFI_VERIFICATION_TOKEN = os.environ.get("KOFI_VERIFICATION_TOKEN", "")
KOFI_CURRENCY = os.environ.get("KOFI_CURRENCY", "").upper()

SUPPORTERS_CORS_ORIGINS = [
    o.strip() for o in os.environ.get("SUPPORTERS_CORS_ORIGINS", "*").split(",") if o.strip()
]
