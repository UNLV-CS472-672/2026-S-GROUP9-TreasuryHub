-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- TreasuryHub Database Schema

-- Tables:

-- Organizations Table
-- Represents an organization workspace.
-- Each org is isolated; users can only access data within their org.
CREATE TABLE IF NOT EXISTS organizations (
    org_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name    TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users Table
-- Public mirror of auth.users. Auto-populated via trigger on registration.
-- Teammates: query this table to look up users by ID or email.
-- See Supabase auth docs: https://supabase.com/docs/guides/auth/managing-user-data
CREATE TABLE IF NOT EXISTS users (
    user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        TEXT NOT NULL,
    display_name TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Org Members Table
-- Table connecting users to organizations with a role.
-- Role field is subject to change upon addition of the Roles table,
-- which would add more flexibility for creating/managing roles (UC3)
CREATE TABLE IF NOT EXISTS org_members (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    org_id  UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, org_id),
    role    TEXT NOT NULL CHECK (role IN ('member', 'executive', 'advisor', 'treasury_team', 'treasurer'))
);

-- Table: Transactions Table
-- Description: Stores financial transactions
-- Dependencies: organizations (org_id FK)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    date           DATE NOT NULL CHECK (date <= CURRENT_DATE),
    description    TEXT NOT NULL,
    category       TEXT NOT NULL,
    type           TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    notes          TEXT, -- Additional notes not included in description
    -- TODO: Incorporate audit fields
    -- -- Audit Fields
    -- created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- created_by     UUID NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    -- updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    -- updated_by     UUID NOT NULL,
    -- deleted_at     TIMESTAMPTZ, -- if NULL, not deleted
    -- deleted_by     UUID,
    -- TODO: Create views for active records, or have trigger once in audit log for deletion
    -- TODO: Create triggers for updates, deletions
    -- TODO: Create indexes for search
);

-- Files Table
-- Stores metadata for uploaded receipts and documents.
-- Actual files live in the private Supabase Storage bucket named 'files'.
CREATE TABLE IF NOT EXISTS files (
    file_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    file_path      TEXT NOT NULL UNIQUE,
    file_name      TEXT NOT NULL,
    file_type      TEXT NOT NULL CHECK (file_type IN ('receipt', 'document')),
    mime_type      TEXT NOT NULL,
    uploaded_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log Table
--  - audit_id: unique identifier for each log entry
--  - org_id: identifies the organization the entry belongs to
--  - user_id: identifies which user performed the action
--  - action: type of change (CREATE, UPDATE, DELETE)
--  - entity: type of object affected (transactions and files for now)
--  - before_data: JSON snapshot of the object before the change
--  - after_data: JSON snapshot of the object after the change
--  - created_at: timestamp of when the audit entry was created
-- Note: audit logs for an organization must be archived or manually deleted
-- before an organization could be deleted.
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT, 
    user_id        UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    action         TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    entity         TEXT NOT NULL, -- This is for 'transaction', ' file', etc.
    entity_id      UUID NOT NULL, 
    before_data    JSONB,
    after_data     JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles Table
-- Placeholder for future role management feature (UC3)

-- Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
    quotes_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    vendor          TEXT NOT NULL,
    memo            TEXT NOT NULL,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount >0),
    accepted        BOOL NOT NULL DEFAULT false,
    uploaded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


-- RLS Rules:

-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop policies before recreating them
DROP POLICY IF EXISTS "Treasurer can view files" ON files;
CREATE POLICY "Treasurer can view files"
ON files FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

DROP POLICY IF EXISTS "Treasurer can upload files" ON files;
CREATE POLICY "Treasurer can upload files"
ON files FOR INSERT
WITH CHECK (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

DROP POLICY IF EXISTS "Treasurer can delete files" ON files;
CREATE POLICY "Treasurer can delete files"
ON files FOR DELETE
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

DROP POLICY IF EXISTS "Treasurer can view audit logs" ON audit_logs;
CREATE POLICY "Treasurer can view audit logs"
ON audit_logs FOR SELECT 
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

-- Only treasurer can export csv of transactions
DROP POLICY IF EXISTS "Treasurer can export transactions" ON transactions;
CREATE POLICY "Treasurer can export transactions"
ON transactions FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- Trigger: Auto-create a public users row when someone signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger so re-runs don't throw a "trigger already exists" error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- Storage Policies:
-- Same pattern as RLS — drop first since there's no IF NOT EXISTS for policies.

DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'files');

DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'files');

DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'files');

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~