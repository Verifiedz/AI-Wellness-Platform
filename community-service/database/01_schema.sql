-- ============================================================================
-- Community Service Database Schema
-- ============================================================================

-- Support groups (seeded, not user-created)
CREATE TABLE IF NOT EXISTS support_groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    icon            VARCHAR(50) NOT NULL DEFAULT 'people-outline',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anonymous identities (one per user per group)
CREATE TABLE IF NOT EXISTS anonymous_identities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    group_id        UUID NOT NULL REFERENCES support_groups(id),
    anonymous_name  VARCHAR(50) NOT NULL,
    avatar_seed     INTEGER NOT NULL,
    UNIQUE (user_id, group_id)
);

-- Posts (threaded: parent_id for replies)
CREATE TABLE IF NOT EXISTS posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES support_groups(id),
    user_id         UUID NOT NULL,
    anonymous_name  VARCHAR(50) NOT NULL,
    content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
    is_flagged      BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
    parent_id       UUID REFERENCES posts(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_group ON posts (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts (parent_id);

-- Reactions
CREATE TABLE IF NOT EXISTS reactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    reaction_type   VARCHAR(20) NOT NULL CHECK (reaction_type IN ('hug', 'heart', 'strength', 'relate')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, user_id, reaction_type)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id),
    reporter_id     UUID NOT NULL,
    reason          VARCHAR(200) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Seed default support groups
-- ============================================================================
INSERT INTO support_groups (name, slug, description, icon) VALUES
    ('Anxiety Support', 'anxiety', 'A safe space for those dealing with anxiety. Share your experiences and support each other.', 'cloud-outline'),
    ('Depression Support', 'depression', 'Connect with others who understand depression. You are not alone.', 'rainy-outline'),
    ('Stress Management', 'stress', 'Share strategies and support for managing daily stress.', 'flash-outline'),
    ('Sleep & Rest', 'sleep', 'Discuss sleep challenges and share tips for better rest.', 'moon-outline'),
    ('Relationships', 'relationships', 'Navigate relationship challenges with peer support.', 'heart-outline'),
    ('Academic Wellness', 'academic', 'Support for academic-related mental health challenges.', 'school-outline')
ON CONFLICT (slug) DO NOTHING;
