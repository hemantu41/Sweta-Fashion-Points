-- ─────────────────────────────────────────────────────────────────────────────
-- Support Tickets System
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Main tickets table
CREATE TABLE IF NOT EXISTS spf_support_tickets (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number        TEXT        UNIQUE NOT NULL,
  subject              TEXT        NOT NULL,
  message              TEXT        NOT NULL,
  category             TEXT        NOT NULL CHECK (category IN ('order','payment','product','delivery','seller','other')),
  priority             TEXT        NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status               TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_on_seller','resolved','closed')),

  -- Who raised it
  raised_by_type       TEXT        NOT NULL CHECK (raised_by_type IN ('admin','seller')),
  raised_by_id         UUID,
  raised_by_name       TEXT        NOT NULL,

  -- Optional context
  related_order_number TEXT,

  -- SLA
  sla_deadline         TIMESTAMPTZ NOT NULL,

  -- Resolution tracking
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Comment / reply thread per ticket
CREATE TABLE IF NOT EXISTS spf_ticket_comments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID        NOT NULL REFERENCES spf_support_tickets(id) ON DELETE CASCADE,
  author_type  TEXT        NOT NULL CHECK (author_type IN ('admin','seller','system')),
  author_id    UUID,
  author_name  TEXT        NOT NULL,
  message      TEXT        NOT NULL,
  is_internal  BOOLEAN     NOT NULL DEFAULT FALSE,  -- TRUE = admin-only note
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_spf_tickets_status     ON spf_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_spf_tickets_created    ON spf_support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spf_tickets_raised_by  ON spf_support_tickets(raised_by_type, raised_by_id);
CREATE INDEX IF NOT EXISTS idx_spf_ticket_comments    ON spf_ticket_comments(ticket_id, created_at);
