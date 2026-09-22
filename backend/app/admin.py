import hmac
import logging
import secrets

from fastapi import FastAPI
from markupsafe import Markup, escape
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request

from app.config import ADMIN_PASSWORD, ADMIN_USERNAME, SECRET_KEY
from app.db import engine
from app.models import (
    Activity,
    Decoration,
    Education,
    Experience,
    Hobby,
    Language,
    Media,
    Personal,
    Project,
    RatedSkill,
    SkillTag,
    SocialLink,
    Supporter,
    SupporterSource,
)

log = logging.getLogger(__name__)


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        if not (ADMIN_USERNAME and ADMIN_PASSWORD):
            log.error("ADMIN_USERNAME / ADMIN_PASSWORD are not set; admin login is disabled")
            return False
        form = await request.form()
        user_ok = hmac.compare_digest(str(form.get("username", "")).encode(), ADMIN_USERNAME.encode())
        pass_ok = hmac.compare_digest(str(form.get("password", "")).encode(), ADMIN_PASSWORD.encode())
        if user_ok and pass_ok:
            request.session["admin"] = True
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return bool(request.session.get("admin"))


class OrderedView(ModelView):
    """List models: shown in site order, lower `position` first."""

    column_default_sort = [("position", False), ("id", False)]
    page_size = 50


class PersonalAdmin(ModelView, model=Personal):
    name = "Personal"
    name_plural = "Personal"
    icon = "fa-solid fa-user"
    can_create = False
    can_delete = False
    column_list = [Personal.name, Personal.tagline, Personal.email]


class SocialLinkAdmin(OrderedView, model=SocialLink):
    icon = "fa-solid fa-link"
    column_list = [SocialLink.position, SocialLink.key, SocialLink.label, SocialLink.href]


class EducationAdmin(OrderedView, model=Education):
    name_plural = "Education"
    icon = "fa-solid fa-graduation-cap"
    column_list = [Education.position, Education.years, Education.org, Education.degree]


class ExperienceAdmin(OrderedView, model=Experience):
    name_plural = "Experience"
    icon = "fa-solid fa-briefcase"
    column_list = [Experience.position, Experience.year, Experience.role, Experience.company]


class ActivityAdmin(OrderedView, model=Activity):
    name_plural = "Activities"
    icon = "fa-solid fa-hand-holding-heart"
    column_list = [Activity.position, Activity.year, Activity.event, Activity.role]


class SkillTagAdmin(OrderedView, model=SkillTag):
    name = "Skill tag"
    icon = "fa-solid fa-tags"
    column_default_sort = [("category", False), ("position", False), ("id", False)]
    column_list = [SkillTag.category, SkillTag.position, SkillTag.name]


class RatedSkillAdmin(OrderedView, model=RatedSkill):
    name = "Rated skill"
    icon = "fa-solid fa-chart-bar"
    column_default_sort = [("category", False), ("position", False), ("id", False)]
    column_list = [RatedSkill.category, RatedSkill.position, RatedSkill.name, RatedSkill.level, RatedSkill.percent]


class LanguageAdmin(OrderedView, model=Language):
    icon = "fa-solid fa-language"
    column_list = [Language.position, Language.name, Language.level]


class HobbyAdmin(OrderedView, model=Hobby):
    name_plural = "Hobbies"
    icon = "fa-solid fa-cat"
    column_list = [Hobby.position, Hobby.icon, Hobby.label]


class ProjectAdmin(OrderedView, model=Project):
    icon = "fa-solid fa-diagram-project"
    column_list = [Project.position, Project.title, Project.year, Project.secret, Project.tags]
    column_searchable_list = [Project.title]
    form_args = {
        "images": {"description": "Image paths or URLs, e.g. /projects/foo.png or an uploaded /uploads/... URL"},
        "secret": {"description": "Confidential: hidden from the featured list and no Visit link"},
    }


class DecorationAdmin(OrderedView, model=Decoration):
    icon = "fa-solid fa-star"
    column_default_sort = [("page", False), ("position", False), ("id", False)]
    column_list = [Decoration.page, Decoration.position, Decoration.src, Decoration.x, Decoration.y,
                   Decoration.rotate, Decoration.scale]
    form_args = {
        "x": {"description": "Percent of page width (0 = left, 100 = right)"},
        "y": {"description": "Percent of page height (0 = top, 100 = bottom)"},
        "rotate": {"description": "Degrees; negative = counter-clockwise"},
        "scale": {"description": "1 = normal size"},
    }


class SupporterAdmin(ModelView, model=Supporter):
    icon = "fa-solid fa-mug-hot"
    column_default_sort = [("created_at", True)]
    column_list = [Supporter.name, Supporter.source, Supporter.type, Supporter.amount, Supporter.currency,
                   Supporter.is_public, Supporter.hidden, Supporter.created_at]
    column_searchable_list = [Supporter.name]
    # Ko-fi data is read-only here; only the display bits are editable.
    form_columns = [Supporter.name, Supporter.message, Supporter.hidden]
    form_args = {"hidden": {"description": "Hide from the site and the public supporter endpoints"}}

    async def on_model_change(self, data: dict, model: Supporter, is_created: bool, request: Request) -> None:
        if is_created:
            model.source = SupporterSource.manual


def _media_link(model: Media, _attr) -> Markup:
    url = escape(model.url)
    return Markup(
        f'<a href="{url}" target="_blank"><img src="{url}" style="max-height:48px;max-width:96px;'
        f'vertical-align:middle;margin-right:8px">{url}</a>'
    )


class MediaAdmin(ModelView, model=Media):
    name_plural = "Media"
    icon = "fa-solid fa-image"
    can_edit = False
    column_default_sort = [("uploaded_at", True)]
    column_list = [Media.id, Media.file, Media.uploaded_at]
    column_labels = {Media.file: "URL (paste into image fields)"}
    column_formatters = {Media.file: _media_link}
    column_formatters_detail = {Media.file: _media_link}
    form_columns = [Media.file]

    async def after_model_delete(self, model: Media, request: Request) -> None:
        try:
            model.file.delete()
        except OSError:
            log.warning("Could not delete uploaded file %s", model.file)


def setup_admin(app: FastAPI) -> Admin:
    secret = SECRET_KEY
    if not secret:
        log.warning("SECRET_KEY is not set; using a random key, admin sessions reset on restart")
        secret = secrets.token_urlsafe(32)

    admin = Admin(
        app,
        engine,
        base_url="/admin",
        title="stella-profile admin",
        authentication_backend=AdminAuth(secret_key=secret, https_only=False, same_site="lax"),
    )
    for view in (
        PersonalAdmin, SocialLinkAdmin, EducationAdmin, ExperienceAdmin, ActivityAdmin, SkillTagAdmin,
        RatedSkillAdmin, LanguageAdmin, HobbyAdmin, ProjectAdmin, DecorationAdmin, SupporterAdmin, MediaAdmin,
    ):
        admin.add_view(view)
    return admin
