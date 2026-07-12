-- =========================================================================
-- PRODUCTION-GRADE DATABASE SCHEMA ARCHITECTURE FOR AORA AI
-- Target DB: PostgreSQL 15+
-- =========================================================================

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Trigram index extensions for fuzzy text match

-- Create utility function to automatically update modified timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================================
-- MODULE 1: MULTI-TENANT USERS & ORGANIZATIONS
-- =========================================================================

CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY, -- Clerk User ID
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    plan_tier VARCHAR(50) DEFAULT 'Free' NOT NULL, -- Free, Premium, Enterprise
    streak_count INTEGER DEFAULT 0 NOT NULL,
    preferences JSONB DEFAULT '{}'::jsonb NOT NULL, -- user specific configs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(128) REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_organizations_modtime BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' NOT NULL, -- owner, admin, member
    permissions TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(organization_id, user_id)
);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_private BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- MODULE 2: PROJECTS & ASSET STORAGE
-- =========================================================================

CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    file_url TEXT,
    doc_type VARCHAR(50) NOT NULL, -- pdf, docx, pptx, youtube, website, mp3, video
    status VARCHAR(50) DEFAULT 'processing' NOT NULL, -- processing, completed, failed
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL, -- file size, word count, tokens
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- MODULE 3: NOTES & KNOWLEDGE EXTRACTORS
-- =========================================================================

CREATE TABLE ai_notes (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    summary TEXT,
    structured_outline JSONB DEFAULT '[]'::jsonb NOT NULL,
    topics TEXT[] DEFAULT '{}'::text[] NOT NULL,
    key_points TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE research_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    findings TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb NOT NULL, -- academic paper links
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- MODULE 4: CHAT SYSTEM & CITATIONS
-- =========================================================================

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    persona VARCHAR(50) DEFAULT 'academic' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Partitioned table on created_at (Monthly Range Partitioning)
CREATE TABLE chat_messages (
    id SERIAL,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- user, ai
    text TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb, -- retrieval chunks, scores, scores
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Pre-create partitions for the current and upcoming periods
CREATE TABLE chat_messages_y2026m07 PARTITION OF chat_messages
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

CREATE TABLE chat_messages_y2026m08 PARTITION OF chat_messages
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

-- =========================================================================
-- MODULE 5: REVISION TOOLS (FLASHCARDS & QUIZZES)
-- =========================================================================

CREATE TABLE decks (
    id SERIAL PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE flashcards (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER REFERENCES decks(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    box INTEGER DEFAULT 1 NOT NULL, -- Spaced repetition (1 to 5)
    next_review TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE flashcard_review_history (
    id SERIAL PRIMARY KEY,
    flashcard_id INTEGER REFERENCES flashcards(id) ON DELETE CASCADE,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    rating VARCHAR(20) NOT NULL, -- easy, medium, hard
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'mcq' NOT NULL, -- mcq, true_false, fill_blank
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- MODULE 6: PODCAST STUDIO & MIND MAPS
-- =========================================================================

CREATE TABLE podcasts (
    id SERIAL PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    script JSONB DEFAULT '[]'::jsonb NOT NULL,
    audio_url TEXT,
    voice_settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    duration VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE mindmaps (
    id SERIAL PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    nodes JSONB DEFAULT '[]'::jsonb NOT NULL,
    connections JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- MODULE 7: BILLING & SUBSCRIPTIONS
-- =========================================================================

CREATE TABLE billing_subscriptions (
    id VARCHAR(255) PRIMARY KEY, -- Stripe subscription ID
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
    plan_tier VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- active, canceled, unpaid
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE billing_invoices (
    id VARCHAR(255) PRIMARY KEY, -- Stripe invoice ID
    subscription_id VARCHAR(255) REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
    amount_paid INTEGER NOT NULL, -- in cents
    invoice_pdf TEXT,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =========================================================================
-- MODULE 8: ANALYTICS & LOGGING
-- =========================================================================

-- Partitioned table on logged_at (Weekly range partitioning)
CREATE TABLE analytics_logs (
    id SERIAL,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- upload, chat, quiz_solve, podcast_play
    payload JSONB DEFAULT '{}'::jsonb,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id, logged_at)
) PARTITION BY RANGE (logged_at);

-- Pre-create first partition for current week
CREATE TABLE analytics_logs_y2026w27 PARTITION OF analytics_logs
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-07-08 00:00:00+00');

-- =========================================================================
-- DATABASE TUNING & INDEXING STRATEGY
-- =========================================================================

-- GIN index for quick JSONB settings searching
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Indexes for workspaces multi-tenant query speeds
CREATE INDEX idx_documents_workspace_scope ON documents (workspace_id);
CREATE INDEX idx_conversations_workspace_scope ON conversations (workspace_id);
CREATE INDEX idx_decks_workspace_scope ON decks (workspace_id);
CREATE INDEX idx_quizzes_workspace_scope ON quizzes (workspace_id);

-- Trigram indexing for fuzzy user searches matching document names
CREATE INDEX idx_documents_name_trgm ON documents USING GIN (name gin_trgm_ops);

-- B-Tree indexing on next Leitner reviews to speed up card select queues
CREATE INDEX idx_flashcards_next_review ON flashcards (deck_id, next_review);
