"""cv experience details and education certification flag

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-16 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0007'
down_revision: Union[str, Sequence[str], None] = '0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('education', sa.Column('certification', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('experience', sa.Column('cv_company', sa.String(length=200), nullable=True))
    op.add_column('experience', sa.Column('cv_points', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('experience', 'cv_points')
    op.drop_column('experience', 'cv_company')
    op.drop_column('education', 'certification')
