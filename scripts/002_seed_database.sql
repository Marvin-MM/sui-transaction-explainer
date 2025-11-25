-- Sample webhooks for testing
-- This script is optional and for development only

-- Insert test webhook (Discord)
INSERT INTO public.webhooks (user_id, name, url, integration, is_active)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Discord Notifications',
  'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN',
  'discord',
  true
)
ON CONFLICT DO NOTHING;

-- Enable full-text search on transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (to_tsvector('english', coalesce(summary, ''))) STORED;

CREATE INDEX IF NOT EXISTS transactions_fts_idx ON public.transactions USING gin(fts);
