"""Load seed.json (the data formerly in src/data/*.js) into the database.

    python -m app.seed [path/to/seed.json]

Content tables are only filled when the DB has no Personal row yet, so running
this again never duplicates or overwrites admin edits. Supporter names are added
as `manual` entries unless a supporter with that name (case-insensitive) already
exists, so run it *after* `app.kofi_import` to avoid doubling up Ko-fi donors.
"""

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import (
    Activity,
    Decoration,
    DecorationPage,
    Education,
    Experience,
    Hobby,
    HobbyIcon,
    Language,
    Personal,
    Project,
    RatedSkill,
    RatedSkillCategory,
    SkillLevel,
    SkillTag,
    SkillTagCategory,
    SocialKey,
    SocialLink,
    Supporter,
    SupporterSource,
)

DEFAULT_PATH = Path(__file__).resolve().parent.parent / "seed.json"


def seed_content(session: Session, data: dict) -> None:
    p = data["personal"]
    session.add(Personal(
        name=p["name"], tagline=p["tagline"], photo_hero=p["photoHero"], photo_about=p["photoAbout"],
        bio=p["bio"], long_bio=p["longBio"], dob=p["dob"], nationality=p["nationality"],
        location=p["contact"].get("location"), email=p["contact"].get("email"),
        phone=p["contact"].get("phone"),
    ))
    session.add_all(
        SocialLink(position=i, key=SocialKey(s["key"]), href=s["href"], label=s["label"])
        for i, s in enumerate(p["socialLinks"])
    )
    session.add_all(
        Education(position=i, years=e["years"], org=e["org"], degree=e["degree"])
        for i, e in enumerate(data["education"])
    )
    session.add_all(
        Experience(position=i, year=e["year"], role=e["role"], company=e.get("company"), description=e["desc"])
        for i, e in enumerate(data["experience"])
    )
    session.add_all(
        Activity(position=i, year=a["year"], event=a["event"], role=a["role"])
        for i, a in enumerate(data["activities"])
    )

    skills = data["skills"]
    for category in SkillTagCategory:
        session.add_all(
            SkillTag(position=i, category=category, name=name) for i, name in enumerate(skills[category.value])
        )
    for category in RatedSkillCategory:
        session.add_all(
            RatedSkill(position=i, category=category, name=s["name"], level=SkillLevel(s["level"]),
                       percent=s["percent"])
            for i, s in enumerate(skills[category.value])
        )

    session.add_all(
        Language(position=i, name=l["name"], level=l["level"]) for i, l in enumerate(data["languages"])
    )
    session.add_all(
        Hobby(position=i, icon=HobbyIcon(h["icon"]), label=h["label"]) for i, h in enumerate(data["hobbies"])
    )
    session.add_all(
        Project(
            position=i, title=pr["title"], year=pr["year"],
            images=pr.get("images") or ([pr["image"]] if pr.get("image") else []),
            blurb=pr["blurb"], link=pr.get("link"), secret=bool(pr.get("secret")), tags=pr.get("tags", []),
        )
        for i, pr in enumerate(data["allProjects"])
    )
    for page in DecorationPage:
        session.add_all(
            Decoration(position=i, page=page, src=d["src"], x=d["x"], y=d["y"],
                       rotate=d.get("rotate", 0), scale=d.get("scale", 1))
            for i, d in enumerate(data["decorations"].get(page.value, []))
        )


def seed_supporters(session: Session, names: list[str]) -> int:
    existing = set(session.scalars(select(func.lower(func.trim(Supporter.name)))))
    # Spread timestamps slightly so the original list order is kept.
    base = datetime.now(timezone.utc)
    added = 0
    for i, name in enumerate(names):
        if name.strip().lower() in existing:
            continue
        session.add(Supporter(name=name.strip(), source=SupporterSource.manual,
                              created_at=base + timedelta(milliseconds=i)))
        existing.add(name.strip().lower())
        added += 1
    return added


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
    data = json.loads(path.read_text(encoding="utf-8"))

    with SessionLocal() as session, session.begin():
        if session.scalars(select(Personal)).first() is None:
            seed_content(session, data)
            print("Seeded content.")
        else:
            print("Content already present; skipped.")
        added = seed_supporters(session, data.get("supporters", []))
        print(f"Added {added} manual supporter(s).")


if __name__ == "__main__":
    main()
