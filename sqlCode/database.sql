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
-- Added this in with some starting fields, as it will need to be used for 
-- work with uploading/viewing files, as we will need to check users accessing 
-- files and create necessary restrictions. For now, left it with user_id, 
-- this will need to be expanded on further. This links to supabase built 
-- in auth table for users. 
-- See docs on this at https://supabase.com/docs/guides/auth/managing-user-data
-- except we would be using a public users table rather than "profiles"
CREATE TABLE users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Org Members Table
-- Added this in with some starting fields, as it will need to be used for 
-- work with uploading/viewing files, as we will need to check users to ensure 
-- they're part of the org when accessing files, we will need to use it
-- to create necessary restrictions. For now, left it with user_id, org_id, role,
-- with a check to see if the role is part of a specific set. This will need
-- to be expanded on further. The role part is subject to change 
-- upon the addition of the Roles table which would add more flexibility for 
-- creating/managing roles
CREATE TABLE org_members (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    org_id  UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, org_id),
    role    TEXT NOT NULL CHECK (role IN ('member', 'executive', 'advisor', 'treasury_team', 'treasurer'))
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

-- Roles Table

-- Transactions table
-- Added this in with some starting fields, as it will need to be used for 
-- work with uploading/viewing files, as these files should be able to link 
-- to transactions. For now, left it with just transaction_id and org_id, 
-- this will need to be expanded on
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE
);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


-- RLS rules: 

-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

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

-- Automatically create a public users row when someone signs up
-- This trigger fires after every new auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();