"""project highlight and status

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-22 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003'
down_revision: Union[str, Sequence[str], None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('project', sa.Column('status', sa.Enum('active', 'archived', 'experiment', name='projectstatus', native_enum=False, length=32), server_default='active', nullable=False))
    op.add_column('project', sa.Column('highlight', sa.Boolean(), server_default='false', nullable=False))
    # Every existing project was on the front page before, so keep it there.
    op.execute("UPDATE project SET highlight = true")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('project', 'highlight')
    op.drop_column('project', 'status')
