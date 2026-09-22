import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

from app import api, github, kofi, supporters
from app.admin import setup_admin
from app.config import SUPPORTERS_CORS_ORIGINS, UPLOAD_DIR

logging.basicConfig(level=logging.INFO)


class PathCORSMiddleware:
    """CORSMiddleware applied only to paths under `prefix`, so the rest of the API stays same-origin."""

    def __init__(self, app: ASGIApp, prefix: str, **cors_options) -> None:
        self.app = app
        self.prefix = prefix
        self.cors = CORSMiddleware(app, **cors_options)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["path"].startswith(self.prefix):
            await self.cors(scope, receive, send)
        else:
            await self.app(scope, receive, send)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(github.refresh_loop())
    yield
    task.cancel()


app = FastAPI(
    title="stella-profile API",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)
app.add_middleware(
    PathCORSMiddleware,
    prefix="/api/supporters/",
    allow_origins=SUPPORTERS_CORS_ORIGINS,
    allow_methods=["GET"],
    allow_credentials=False,
)

app.include_router(api.router)
app.include_router(supporters.router)
app.include_router(kofi.router)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
setup_admin(app)
