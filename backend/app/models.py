import enum
from datetime import datetime, timezone
from decimal import Decimal

from fastapi_storages import FileSystemStorage
from fastapi_storages.integrations.sqlalchemy import FileType
from sqlalchemy import ARRAY, Boolean, DateTime, Enum, Float, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.config import UPLOAD_DIR
from app.db import Base


# ─── Enums ───────────────────────────────────────────────────────────────────
# Stored as plain strings (no native Postgres enum) so adding a value only
# needs a code change, not an ALTER TYPE migration.

class SocialKey(str, enum.Enum):
    github = "github"
    discord = "discord"
    kofi = "kofi"


class SkillTagCategory(str, enum.Enum):
    software = "software"
    design = "design"
    traits = "traits"


class RatedSkillCategory(str, enum.Enum):
    coding = "coding"
    frameworks = "frameworks"


class SkillLevel(str, enum.Enum):
    Beginner = "Beginner"
    Intermediate = "Intermediate"
    Advanced = "Advanced"
    Mastered = "Mastered"


# Must match the icon map in src/components/Resume.jsx.
class HobbyIcon(str, enum.Enum):
    Code = "Code"
    Youtube = "Youtube"
    Palette = "Palette"
    Gamepad2 = "Gamepad2"
    Cat = "Cat"
    Scissors = "Scissors"


class DecorationPage(str, enum.Enum):
    cover = "cover"
    about = "about"
    projects = "projects"
    work = "work"


class ProjectStatus(str, enum.Enum):
    active = "active"
    archived = "archived"
    experiment = "experiment"


class SupporterSource(str, enum.Enum):
    kofi = "kofi"
    manual = "manual"


def _enum(e: type[enum.Enum]) -> Enum:
    return Enum(e, native_enum=False, values_callable=lambda cls: [m.value for m in cls], length=32)


class Positioned:
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0")


# ─── Content ─────────────────────────────────────────────────────────────────

class Personal(Base):
    __tablename__ = "personal"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    tagline: Mapped[str] = mapped_column(String(300))
    photo_hero: Mapped[str] = mapped_column(String(500))
    photo_about: Mapped[str] = mapped_column(String(500))
    bio: Mapped[str] = mapped_column(Text)
    long_bio: Mapped[str] = mapped_column(Text)
    dob: Mapped[str] = mapped_column(String(100))
    nationality: Mapped[str] = mapped_column(String(100))
    location: Mapped[str | None] = mapped_column(String(200))
    email: Mapped[str | None] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(50))

    def __str__(self) -> str:
        return self.name


class SocialLink(Positioned, Base):
    __tablename__ = "social_link"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[SocialKey] = mapped_column(_enum(SocialKey))
    href: Mapped[str] = mapped_column(String(500))
    label: Mapped[str] = mapped_column(String(200))

    def __str__(self) -> str:
        return f"{self.key.value}: {self.label}"


class Education(Positioned, Base):
    __tablename__ = "education"

    id: Mapped[int] = mapped_column(primary_key=True)
    years: Mapped[str] = mapped_column(String(100))
    org: Mapped[str] = mapped_column(String(300))
    degree: Mapped[str] = mapped_column(String(300))

    def __str__(self) -> str:
        return self.degree


class Experience(Positioned, Base):
    __tablename__ = "experience"

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(200))
    company: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)

    def __str__(self) -> str:
        return self.role


class Activity(Positioned, Base):
    __tablename__ = "activity"

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[str] = mapped_column(String(100))
    event: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(300))

    def __str__(self) -> str:
        return self.event


class SkillTag(Positioned, Base):
    __tablename__ = "skill_tag"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[SkillTagCategory] = mapped_column(_enum(SkillTagCategory))
    name: Mapped[str] = mapped_column(String(100))

    def __str__(self) -> str:
        return self.name


class RatedSkill(Positioned, Base):
    __tablename__ = "rated_skill"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[RatedSkillCategory] = mapped_column(_enum(RatedSkillCategory))
    name: Mapped[str] = mapped_column(String(100))
    level: Mapped[SkillLevel] = mapped_column(_enum(SkillLevel))
    percent: Mapped[int] = mapped_column(Integer)

    def __str__(self) -> str:
        return self.name


class Language(Positioned, Base):
    __tablename__ = "language"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    level: Mapped[str] = mapped_column(String(100))

    def __str__(self) -> str:
        return self.name


class Hobby(Positioned, Base):
    __tablename__ = "hobby"

    id: Mapped[int] = mapped_column(primary_key=True)
    icon: Mapped[HobbyIcon] = mapped_column(_enum(HobbyIcon))
    label: Mapped[str] = mapped_column(String(100))

    def __str__(self) -> str:
        return self.label


class Project(Positioned, Base):
    __tablename__ = "project"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    year: Mapped[int] = mapped_column(Integer)
    images: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, server_default="{}")
    blurb: Mapped[str] = mapped_column(Text)
    link: Mapped[str | None] = mapped_column(String(500))
    secret: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, server_default="{}")
    status: Mapped[ProjectStatus] = mapped_column(
        _enum(ProjectStatus), default=ProjectStatus.active, server_default=ProjectStatus.active.value
    )
    # Shown in the front page's "Highlight of my work" section; /projects lists everything.
    highlight: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    # Filled in by app.github for projects linking to a GitHub repo.
    github_stars: Mapped[int | None] = mapped_column(Integer)
    github_stars_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    def __str__(self) -> str:
        return self.title


class Decoration(Positioned, Base):
    __tablename__ = "decoration"

    id: Mapped[int] = mapped_column(primary_key=True)
    page: Mapped[DecorationPage] = mapped_column(_enum(DecorationPage))
    src: Mapped[str] = mapped_column(String(500))
    x: Mapped[float] = mapped_column(Float)
    y: Mapped[float] = mapped_column(Float)
    rotate: Mapped[float] = mapped_column(Float, default=0, server_default="0")
    scale: Mapped[float] = mapped_column(Float, default=1, server_default="1")

    def __str__(self) -> str:
        return f"{self.page.value}: {self.src.rsplit('/', 1)[-1]}"


# ─── Supporters (Ko-fi) ──────────────────────────────────────────────────────

class Supporter(Base):
    __tablename__ = "supporter"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    source: Mapped[SupporterSource] = mapped_column(_enum(SupporterSource))
    kofi_transaction_id: Mapped[str | None] = mapped_column(String(100), unique=True)
    type: Mapped[str | None] = mapped_column(String(50))
    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str | None] = mapped_column(String(8))
    message: Mapped[str | None] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    hidden: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    # Python-side default (not func.now()) so the admin create form can use it.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now(), index=True
    )

    def __str__(self) -> str:
        return self.name


# ─── Uploads ─────────────────────────────────────────────────────────────────

class UniqueFileSystemStorage(FileSystemStorage):
    # Never silently replace another upload that has the same filename.
    OVERWRITE_EXISTING_FILES = False


storage = UniqueFileSystemStorage(path=UPLOAD_DIR)


class Media(Base):
    __tablename__ = "media"

    id: Mapped[int] = mapped_column(primary_key=True)
    file: Mapped[str] = mapped_column(FileType(storage=storage))
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), server_default=func.now()
    )

    @property
    def url(self) -> str:
        return f"/uploads/{self.file.name}"

    def __str__(self) -> str:
        return self.url
