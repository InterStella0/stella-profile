"""project github link

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-22 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

GITHUB_LINK = r"^https?://(www\.)?github\.com/"


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('project', sa.Column('github', sa.String(length=500), nullable=True))
    # GitHub links used to live in `link`; move them so Visit is free for the live site.
    op.execute(sa.text("UPDATE project SET github = link, link = NULL WHERE link ~* :re").bindparams(re=GITHUB_LINK))


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("UPDATE project SET link = github WHERE link IS NULL AND github IS NOT NULL")
    op.drop_column('project', 'github')
