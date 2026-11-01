"""The admin's image gallery field: upload, reorder and remove a project's images right in its form.

Uploads go through `POST /admin/project-images/upload` and are saved as Media rows, so they also show
on the Media page; `GET /admin/project-images/library` lists earlier uploads to pick from.
"""

import asyncio
import hashlib
from pathlib import Path, PurePosixPath

from markupsafe import Markup, escape
from sqladmin import BaseView, expose
from sqladmin.editors import FieldMedia
from sqlalchemy import select
from starlette.datastructures import UploadFile
from starlette.requests import Request
from starlette.responses import JSONResponse
from wtforms import Field

from app.db import SessionLocal
from app.models import Media, storage

ADMIN_BASE_URL = "/admin"
ASSETS_DIR = Path(__file__).resolve().parent / "static" / "admin"
ASSETS_URL = f"{ADMIN_BASE_URL}/assets"
UPLOAD_URL = f"{ADMIN_BASE_URL}/project-images/upload"
LIBRARY_URL = f"{ADMIN_BASE_URL}/project-images/library"

# What the site can show in an <img>; nginx caps request bodies at 20 MB anyway.
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"}
MAX_IMAGE_BYTES = 20 * 1024 * 1024
LIBRARY_LIMIT = 300


def asset_url(name: str) -> str:
    # Content hash in the query so a changed file isn't served stale from the browser cache.
    digest = hashlib.sha1((ASSETS_DIR / name).read_bytes()).hexdigest()[:10]
    return f"{ASSETS_URL}/{name}?v={digest}"


GALLERY_MEDIA = FieldMedia(css=[asset_url("image-gallery.css")], js=[asset_url("image-gallery.js")])


def _item_html(name: str, url: str) -> str:
    """One thumbnail; image-gallery.js clones the empty one from the <template> for new images."""
    src = escape(url)
    label = escape(PurePosixPath(url).name or url)
    return (
        '<li class="img-gallery__item" draggable="true">'
        f'<img src="{src}" alt="" draggable="false" loading="lazy">'
        f'<div class="img-gallery__name" title="{src}">{label}</div>'
        f'<input type="hidden" name="{escape(name)}" value="{src}">'
        '<span class="img-gallery__cover">Cover</span>'
        '<div class="img-gallery__actions">'
        '<button type="button" data-act="left" title="Move earlier" aria-label="Move earlier">&lsaquo;</button>'
        '<button type="button" data-act="right" title="Move later" aria-label="Move later">&rsaquo;</button>'
        '<button type="button" data-act="remove" title="Remove from this project" aria-label="Remove">&times;</button>'
        "</div></li>"
    )


class ImageGalleryWidget:
    def __call__(self, field: "ImageGalleryField", **kwargs) -> Markup:
        items = "".join(_item_html(field.name, url) for url in field.data or [])
        accept = ",".join(sorted(IMAGE_EXTENSIONS)) + ",image/*"
        return Markup(
            f'<div class="img-gallery" data-upload-url="{UPLOAD_URL}" data-library-url="{LIBRARY_URL}" '
            f'data-max-bytes="{MAX_IMAGE_BYTES}">'
            f'<ul class="img-gallery__list">{items}</ul>'
            f'<template class="img-gallery__template">{_item_html(field.name, "")}</template>'
            '<div class="img-gallery__drop">'
            "Drop images or GIFs here, paste from the clipboard, or "
            f'<label class="btn btn-sm" for="{escape(field.id)}">Choose files</label>'
            # No name attribute: the files are uploaded by the script, never sent with the form.
            f'<input type="file" id="{escape(field.id)}" class="img-gallery__file" accept="{accept}" multiple hidden>'
            "</div>"
            '<div class="img-gallery__tools">'
            '<button type="button" class="btn btn-sm" data-act="library">Pick from Media</button>'
            '<input type="text" class="form-control form-control-sm img-gallery__url" '
            'placeholder="or add a path / URL, e.g. /projects/foo.png">'
            '<button type="button" class="btn btn-sm" data-act="add-url">Add</button>'
            "</div>"
            '<div class="img-gallery__library" hidden></div>'
            '<div class="img-gallery__status" role="status"></div>'
            "</div>"
        )


class ImageGalleryField(Field):
    """A list of image URLs (a Postgres ARRAY column), shown as sortable thumbnails with uploads."""

    widget = ImageGalleryWidget()
    media = GALLERY_MEDIA

    def process_formdata(self, valuelist: list) -> None:
        self.data = [v.strip() for v in valuelist if isinstance(v, str) and v.strip()]

    def process_data(self, value: list[str] | None) -> None:
        self.data = list(value or [])


def _error(message: str, status_code: int) -> JSONResponse:
    return JSONResponse({"error": message}, status_code=status_code)


def _safe_filename(filename: str, extension: str) -> str:
    # Clean the name before fastapi-storages sees it: it writes the file under a cleaned name but stores
    # the raw one, so "My Shot.png" would be saved as My_Shot.png with a URL that 404s.
    stem = storage.get_name(PurePosixPath(filename).stem.replace("/", " ").replace("\\", " "))
    return f"{stem or 'image'}{extension}"


def _save_media(upload: UploadFile, filename: str) -> str:
    with SessionLocal() as session:
        media = Media(file=UploadFile(file=upload.file, filename=filename))
        session.add(media)
        session.commit()
        session.refresh(media)  # expire_on_commit is off: reload the saved file name
        return media.url


class ProjectImagesView(BaseView):
    """The gallery field's endpoints (logged-in admins only, via `expose`); not shown in the sidebar."""

    name = "Project images"
    identity = "project-images"

    def is_visible(self, request: Request) -> bool:
        return False

    @expose("/project-images/upload", methods=["POST"])
    async def upload(self, request: Request) -> JSONResponse:
        form = await request.form(max_files=1)
        upload = form.get("file")
        if not isinstance(upload, UploadFile) or not upload.filename:
            return _error("No file sent", 400)
        extension = PurePosixPath(upload.filename).suffix.lower()
        if extension not in IMAGE_EXTENSIONS:
            return _error(f"Not an image ({', '.join(sorted(IMAGE_EXTENSIONS))})", 415)
        if upload.size is not None and upload.size > MAX_IMAGE_BYTES:
            return _error(f"Larger than {MAX_IMAGE_BYTES // (1024 * 1024)} MB", 413)
        if upload.size == 0:
            return _error("The file is empty", 400)
        url = await asyncio.to_thread(_save_media, upload, _safe_filename(upload.filename, extension))
        return JSONResponse({"url": url}, status_code=201)

    @expose("/project-images/library", methods=["GET"])
    async def library(self, request: Request) -> JSONResponse:
        with SessionLocal() as session:
            rows = session.scalars(
                select(Media).order_by(Media.uploaded_at.desc(), Media.id.desc()).limit(LIBRARY_LIMIT)
            ).all()
            urls = [m.url for m in rows if PurePosixPath(m.file.name).suffix.lower() in IMAGE_EXTENSIONS]
        return JSONResponse({"images": [{"url": u} for u in urls]}, headers={"Cache-Control": "no-store"})
