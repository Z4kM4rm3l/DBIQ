BEGIN;

-- Running upgrade 0003 -> 0004

ALTER TABLE clients DROP COLUMN legacy_key;

CREATE INDEX ix_conversations_client_id ON conversations (client_id);

UPDATE alembic_version SET version_num='0004' WHERE alembic_version.version_num = '0003';

COMMIT;
