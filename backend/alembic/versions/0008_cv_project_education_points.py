"""cv description for projects and points for education

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-16 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0008'
down_revision: Union[str, Sequence[str], None] = '0007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('education', sa.Column('cv_points', sa.Text(), nullable=True))
    op.add_column('project', sa.Column('cv_description', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('project', 'cv_description')
    op.drop_column('education', 'cv_points')
