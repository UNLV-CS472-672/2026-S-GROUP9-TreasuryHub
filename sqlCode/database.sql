-- TreasuryHub Database Schema

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
