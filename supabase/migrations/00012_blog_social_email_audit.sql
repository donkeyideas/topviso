-- Blog posts & guides
CREATE TABLE IF NOT EXISTS public.posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text        NOT NULL DEFAULT 'blog' CHECK (type IN ('blog','guide')),
  title         text        NOT NULL,
  slug          text        UNIQUE NOT NULL,
  excerpt       text,
  content       text        NOT NULL DEFAULT '',
  cover_image   text,
  author_name   text,
  status        text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  tags          jsonb       DEFAULT '[]',
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_type_status ON posts(type, status);
CREATE INDEX idx_posts_slug ON posts(slug);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published posts (for /blog route)
CREATE POLICY "Public can read published posts"
  ON posts FOR SELECT
  USING (status = 'published');

-- Service-role has full access (no restrictive policy needed)
GRANT ALL ON posts TO service_role;
GRANT SELECT ON posts TO anon, authenticated;

-- Social media posts
CREATE TABLE IF NOT EXISTS public.social_media_posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      text        NOT NULL CHECK (platform IN ('TWITTER','LINKEDIN','FACEBOOK','INSTAGRAM','TIKTOK')),
  content       text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','PUBLISHED','FAILED','CANCELLED')),
  hashtags      text[]      DEFAULT '{}',
  image_prompt  text,
  scheduled_at  timestamptz,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON social_media_posts TO service_role;

-- Admin settings (key-value for social credentials, automation config, etc.)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        UNIQUE NOT NULL,
  value       text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON admin_settings TO service_role;

-- Email log
CREATE TABLE IF NOT EXISTS public.email_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id       text,
  recipient_email text        NOT NULL,
  subject         text        NOT NULL,
  email_type      text        NOT NULL,
  status          text        NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  error_message   text,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  delivered_at    timestamptz
);

CREATE INDEX idx_email_log_sent_at ON email_log(sent_at DESC);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON email_log TO service_role;
