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

-- Roles Table
