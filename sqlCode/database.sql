-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- TreasuryHub Database Schema

-- Tables:

-- Organizations Table
-- Represents an organization workspace.
-- Each org is isolated; users can only access data within their org.
CREATE TABLE organizations (
    org_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name    TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users Table
-- Public mirror of auth.users. Auto-populated via trigger on registration.
-- Teammates: query this table to look up users by ID or email.
CREATE TABLE users (
    user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        TEXT NOT NULL,
    display_name TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

-- Org Members Table
-- Added this in with some starting fields, may need
-- to be expanded on further. The role part is subject to change 
-- upon the addition of the Roles table which would add more flexibility for 
-- creating/managing roles
CREATE TABLE org_members (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    org_id  UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, org_id),
    role    TEXT NOT NULL CHECK (role IN ('member', 'executive', 'advisor', 'treasury_team', 'treasurer'))
);

-- Table: Transactions Table
-- Description: Stores financial transactions
-- Dependencies: organizations (org_id FK)
CREATE TABLE transactions (
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
CREATE TABLE files (
    file_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    file_path      TEXT NOT NULL UNIQUE,
    file_name      TEXT NOT NULL,
    file_type      TEXT NOT NULL CHECK (file_type IN ('receipt', 'document')),
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
-- Note: audit logs for an organization must be archived or manually deleted before 
-- an organization could be deleted.
CREATE TABLE audit_logs (
    audit_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT, 
    user_id        UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    action         TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    entity         TEXT NOT NULL, -- This is for 'transaction', ' file', etc.
    entity_id      UUID NOT NULL, 
    before_data    JSONB,
    after_data     JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- Roles Table


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


-- RLS rules: 

-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_log table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only treasurer can view all files in their org
CREATE POLICY "Treasurer can view files"
ON files FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

-- Only treasurer can upload files
CREATE POLICY "Treasurer can upload files"
ON files FOR INSERT
WITH CHECK (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

-- Only treasurer can delete files
CREATE POLICY "Treasurer can delete files"
ON files FOR DELETE
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

-- Only treasurer can view audit logs
CREATE POLICY "Treasurer can view audit logs"
ON audit_logs FOR SELECT 
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'treasurer'
    )
);

-- Automatically create a public users row when someone signs up
-- This trigger fires after every new auth.users insert
-- Populates user_id and email from the auth.users row
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

-- Attach the trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- Storage Policies:

-- Allow authenticated users to upload files to the files bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'files');

-- Allow authenticated users to read/view files from the files bucket
-- This is needed for generating signed URLs in UC8
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'files');

-- Allow authenticated users to delete files from the files bucket
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'files');

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
