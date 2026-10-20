"""link projects to the experience they were made at

Revision ID: 0009
Revises: 0008
Create Date: 2026-10-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0009'
down_revision: Union[str, Sequence[str], None] = '0008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('project', sa.Column('experience_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_project_experience_id'), 'project', ['experience_id'], unique=False)
    op.create_foreign_key(
        op.f('fk_project_experience_id_experience'), 'project', 'experience', ['experience_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(op.f('fk_project_experience_id_experience'), 'project', type_='foreignkey')
    op.drop_index(op.f('ix_project_experience_id'), table_name='project')
    op.drop_column('project', 'experience_id')
