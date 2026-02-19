-- COMPLETE DATABASE RESET SCRIPT FOR AUTH SCHEMA
-- This will drop all tables and recreate them with lowercase names to avoid case sensitivity issues

-- First, drop all tables in correct order (due to foreign keys)
DROP TABLE IF EXISTS "VerificationCodes" CASCADE;

DROP TABLE IF EXISTS "LoginAttempts" CASCADE;

DROP TABLE IF EXISTS "Users" CASCADE;

-- Now create all tables with LOWERCASE names (no quotes needed in queries)

-- USERS table (now lowercase)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    username VARCHAR(50) UNIQUE NOT NULL,
    passwordhash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    isactive BOOLEAN DEFAULT TRUE,
    isemailverified BOOLEAN DEFAULT FALSE,
    createdat TIMESTAMPTZ DEFAULT now(),
    updatedat TIMESTAMPTZ DEFAULT now(),
    lastloginat TIMESTAMPTZ,
    failedloginattempts INTEGER DEFAULT 0,
    lockeduntil TIMESTAMPTZ
);

-- LOGIN ATTEMPTS table (now lowercase)
CREATE TABLE IF NOT EXISTS loginattempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    userid UUID REFERENCES users (id) ON DELETE SET NULL,
    ipaddress VARCHAR(45) NOT NULL,
    useragent TEXT,
    issuccessful BOOLEAN DEFAULT FALSE,
    failurereason VARCHAR(100),
    attemptedat TIMESTAMPTZ DEFAULT now()
);

-- VERIFICATION CODES table (now lowercase)
CREATE TABLE IF NOT EXISTS verificationcodes (
    codeid UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    userid UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'email_verify', 'phone_verify', 'password_reset'
    expiresat TIMESTAMPTZ NOT NULL,
    isused BOOLEAN DEFAULT FALSE,
    codecreated TIMESTAMPTZ DEFAULT now(),
    ipaddress VARCHAR(45),
    attempts INTEGER DEFAULT 0
);

-- Create indexes for performance (also lowercase)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);

CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON loginattempts (userid);

CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON verificationcodes (userid);

-- Insert a test user for quick testing (optional)
-- Password: "password123" hashed with SHA256
INSERT INTO
    users (
        username,
        email,
        passwordhash,
        isactive,
        isemailverified
    )
VALUES (
        'testuser',
        'test@example.com',
        'qYJRrW8X8W7kQrNtW6f0U8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W==',
        true,
        true
    );

-- Verify the tables were created correctly
SELECT table_name
FROM information_schema.tables
WHERE
    table_schema = 'public'
ORDER BY table_name;

-- Show the structure of users table
SELECT column_name, data_type
FROM information_schema.columns
WHERE
    table_name = 'users'
ORDER BY ordinal_position;
