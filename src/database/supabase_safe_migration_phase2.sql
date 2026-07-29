BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'BookOpen',
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS research_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  research_item_id UUID NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  topics TEXT[] NOT NULL DEFAULT '{}',
  action_items TEXT[] NOT NULL DEFAULT '{}',
  people_mentioned TEXT[] NOT NULL DEFAULT '{}',
  dates_mentioned TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  suggested_workspace VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  processing_status VARCHAR(32) NOT NULL DEFAULT 'completed',
  original_file_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  related_documents UUID[] NOT NULL DEFAULT '{}',
  extracted_text TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  extracted_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE areas
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'BookOpen',
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS area_id UUID,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE research_items
  ADD COLUMN IF NOT EXISTS topic_id UUID,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS research_item_id UUID,
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS role VARCHAR(20),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE knowledge_cards
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS action_items TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS people_mentioned TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dates_mentioned TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS suggested_workspace VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS processing_status VARCHAR(32) DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS original_file_path TEXT,
  ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS related_documents UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS extracted_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE areas
  ALTER COLUMN icon SET DEFAULT 'BookOpen',
  ALTER COLUMN color SET DEFAULT '#3b82f6',
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE topics
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE research_items
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE attachments
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE conversations
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE messages
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE knowledge_cards
  ALTER COLUMN keywords SET DEFAULT '{}',
  ALTER COLUMN topics SET DEFAULT '{}',
  ALTER COLUMN action_items SET DEFAULT '{}',
  ALTER COLUMN people_mentioned SET DEFAULT '{}',
  ALTER COLUMN dates_mentioned SET DEFAULT '{}',
  ALTER COLUMN tags SET DEFAULT '{}',
  ALTER COLUMN processing_status SET DEFAULT 'completed',
  ALTER COLUMN upload_date SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN related_documents SET DEFAULT '{}',
  ALTER COLUMN extracted_metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

UPDATE knowledge_cards
SET
  keywords = COALESCE(keywords, '{}'),
  topics = COALESCE(topics, '{}'),
  action_items = COALESCE(action_items, '{}'),
  people_mentioned = COALESCE(people_mentioned, '{}'),
  dates_mentioned = COALESCE(dates_mentioned, '{}'),
  tags = COALESCE(tags, '{}'),
  suggested_workspace = COALESCE(NULLIF(TRIM(suggested_workspace), ''), 'Research'),
  source_type = COALESCE(NULLIF(TRIM(source_type), ''), 'other'),
  processing_status = COALESCE(NULLIF(TRIM(processing_status), ''), 'completed'),
  original_file_path = COALESCE(NULLIF(TRIM(original_file_path), ''), CONCAT('legacy/', id::text)),
  upload_date = COALESCE(upload_date, created_at, CURRENT_TIMESTAMP),
  related_documents = COALESCE(related_documents, '{}'),
  extracted_text = COALESCE(extracted_text, summary, title, ''),
  file_name = COALESCE(NULLIF(TRIM(file_name), ''), CONCAT(id::text, '.txt')),
  extracted_metadata = COALESCE(extracted_metadata, '{}'::jsonb),
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE
  keywords IS NULL
  OR topics IS NULL
  OR action_items IS NULL
  OR people_mentioned IS NULL
  OR dates_mentioned IS NULL
  OR tags IS NULL
  OR suggested_workspace IS NULL
  OR BTRIM(suggested_workspace) = ''
  OR source_type IS NULL
  OR BTRIM(source_type) = ''
  OR processing_status IS NULL
  OR BTRIM(processing_status) = ''
  OR original_file_path IS NULL
  OR BTRIM(original_file_path) = ''
  OR upload_date IS NULL
  OR related_documents IS NULL
  OR extracted_text IS NULL
  OR file_name IS NULL
  OR BTRIM(file_name) = ''
  OR extracted_metadata IS NULL
  OR created_at IS NULL
  OR updated_at IS NULL;

UPDATE users
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

UPDATE areas
SET
  icon = COALESCE(icon, 'BookOpen'),
  color = COALESCE(color, '#3b82f6'),
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE icon IS NULL OR color IS NULL OR created_at IS NULL OR updated_at IS NULL;

UPDATE topics
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

UPDATE research_items
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

UPDATE attachments
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

UPDATE conversations
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

UPDATE messages
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'areas_user_id_fkey'
      AND conrelid = 'areas'::regclass
  ) THEN
    ALTER TABLE areas
      ADD CONSTRAINT areas_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'topics_area_id_fkey'
      AND conrelid = 'topics'::regclass
  ) THEN
    ALTER TABLE topics
      ADD CONSTRAINT topics_area_id_fkey
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'research_items_topic_id_fkey'
      AND conrelid = 'research_items'::regclass
  ) THEN
    ALTER TABLE research_items
      ADD CONSTRAINT research_items_topic_id_fkey
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'attachments_research_item_id_fkey'
      AND conrelid = 'attachments'::regclass
  ) THEN
    ALTER TABLE attachments
      ADD CONSTRAINT attachments_research_item_id_fkey
      FOREIGN KEY (research_item_id) REFERENCES research_items(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_user_id_fkey'
      AND conrelid = 'conversations'::regclass
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_conversation_id_fkey'
      AND conrelid = 'messages'::regclass
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_user_id_fkey'
      AND conrelid = 'messages'::regclass
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'knowledge_cards_user_id_fkey'
      AND conrelid = 'knowledge_cards'::regclass
  ) THEN
    ALTER TABLE knowledge_cards
      ADD CONSTRAINT knowledge_cards_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_role_check'
      AND conrelid = 'messages'::regclass
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_role_check
      CHECK (role IN ('user', 'assistant')) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_areas_user_id ON areas(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_area_id ON topics(area_id);
CREATE INDEX IF NOT EXISTS idx_research_items_topic_id ON research_items(topic_id);
CREATE INDEX IF NOT EXISTS idx_attachments_research_id ON attachments(research_item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_user_id ON knowledge_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_source_type ON knowledge_cards(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_processing_status ON knowledge_cards(processing_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_upload_date ON knowledge_cards(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_keywords_gin ON knowledge_cards USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_topics_gin ON knowledge_cards USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_tags_gin ON knowledge_cards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_people_gin ON knowledge_cards USING GIN(people_mentioned);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_dates_gin ON knowledge_cards USING GIN(dates_mentioned);

DROP TRIGGER IF EXISTS update_users_timestamp ON users;
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_areas_timestamp ON areas;
CREATE TRIGGER update_areas_timestamp
BEFORE UPDATE ON areas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_topics_timestamp ON topics;
CREATE TRIGGER update_topics_timestamp
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_research_items_timestamp ON research_items;
CREATE TRIGGER update_research_items_timestamp
BEFORE UPDATE ON research_items
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_attachments_timestamp ON attachments;
CREATE TRIGGER update_attachments_timestamp
BEFORE UPDATE ON attachments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_conversations_timestamp ON conversations;
CREATE TRIGGER update_conversations_timestamp
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_messages_timestamp ON messages;
CREATE TRIGGER update_messages_timestamp
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_knowledge_cards_timestamp ON knowledge_cards;
CREATE TRIGGER update_knowledge_cards_timestamp
BEFORE UPDATE ON knowledge_cards
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

COMMIT;