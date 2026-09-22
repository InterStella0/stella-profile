"""`GET /api/content`: everything the site renders, in the shape src/data/content.js used to export."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import (
    Activity,
    Decoration,
    DecorationPage,
    Education,
    Experience,
    Hobby,
    Language,
    Personal,
    Project,
    RatedSkill,
    RatedSkillCategory,
    SkillTag,
    SkillTagCategory,
    SocialLink,
)
from app.supporters import distinct_visible_names

router = APIRouter(prefix="/api", tags=["content"])


def _ordered(session: Session, model):
    return session.scalars(select(model).order_by(model.position, model.id)).all()


def _project(p: Project) -> dict[str, Any]:
    out: dict[str, Any] = {"title": p.title, "year": p.year}
    images = p.images or []
    if len(images) == 1:
        out["image"] = images[0]
    elif images:
        out["images"] = images
    out["blurb"] = p.blurb
    if p.link:
        out["link"] = p.link
    if p.github and not p.secret:
        out["github"] = p.github
    if p.secret:
        out["secret"] = True
    out["tags"] = p.tags or []
    out["status"] = p.status.value
    out["highlight"] = p.highlight
    if p.github_stars is not None and not p.secret:
        out["stars"] = p.github_stars
    return out


@router.get("/content")
def content(session: Session = Depends(get_session)) -> dict[str, Any]:
    personal = session.scalars(select(Personal).order_by(Personal.id)).first()
    if personal is None:
        raise HTTPException(503, "Content has not been seeded yet")

    contact = {"location": personal.location, "email": personal.email}
    if personal.phone:
        contact["phone"] = personal.phone

    tags = _ordered(session, SkillTag)
    rated = _ordered(session, RatedSkill)
    skills: dict[str, list] = {
        "software": [t.name for t in tags if t.category == SkillTagCategory.software],
        "coding": [
            {"name": r.name, "level": r.level.value, "percent": r.percent}
            for r in rated if r.category == RatedSkillCategory.coding
        ],
        "frameworks": [
            {"name": r.name, "level": r.level.value, "percent": r.percent}
            for r in rated if r.category == RatedSkillCategory.frameworks
        ],
        "design": [t.name for t in tags if t.category == SkillTagCategory.design],
        "traits": [t.name for t in tags if t.category == SkillTagCategory.traits],
    }

    decorations: dict[str, list] = {page.value: [] for page in DecorationPage}
    for d in _ordered(session, Decoration):
        decorations[d.page.value].append(
            {"src": d.src, "x": d.x, "y": d.y, "rotate": d.rotate, "scale": d.scale}
        )

    return {
        "personal": {
            "name": personal.name,
            "tagline": personal.tagline,
            "photoHero": personal.photo_hero,
            "photoAbout": personal.photo_about,
            "bio": personal.bio,
            "longBio": personal.long_bio,
            "dob": personal.dob,
            "nationality": personal.nationality,
            "socialLinks": [
                {"key": s.key.value, "href": s.href, "label": s.label}
                for s in _ordered(session, SocialLink)
            ],
            "contact": contact,
        },
        "education": [
            {"years": e.years, "org": e.org, "degree": e.degree} for e in _ordered(session, Education)
        ],
        "experience": [
            {"year": e.year, "role": e.role, "company": e.company, "desc": e.description}
            for e in _ordered(session, Experience)
        ],
        "activities": [
            {"year": a.year, "event": a.event, "role": a.role} for a in _ordered(session, Activity)
        ],
        "skills": skills,
        "languages": [{"name": l.name, "level": l.level} for l in _ordered(session, Language)],
        "hobbies": [{"icon": h.icon.value, "label": h.label} for h in _ordered(session, Hobby)],
        "allProjects": [_project(p) for p in _ordered(session, Project)],
        "supporters": distinct_visible_names(session),
        "decorations": decorations,
    }
