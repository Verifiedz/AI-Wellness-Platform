-- Database/AuthSchema.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "Username" VARCHAR(50) UNIQUE NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "Email" VARCHAR(255) UNIQUE NOT NULL,
    "Phone" VARCHAR(20) UNIQUE,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "IsEmailVerified" BOOLEAN DEFAULT FALSE,
    "IsPhoneVerified" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT now(),
    "UpdatedAt" TIMESTAMPTZ DEFAULT now(),
    "LastLoginAt" TIMESTAMPTZ,
    "FailedLoginAttempts" INTEGER DEFAULT 0,
    "LockedUntil" TIMESTAMPTZ
);

-- LOGIN ATTEMPTS table (for security logging)
CREATE TABLE IF NOT EXISTS "LoginAttempts" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "UserId" UUID REFERENCES "Users" ("Id") ON DELETE SET NULL,
    "IpAddress" VARCHAR(45) NOT NULL,
    "UserAgent" TEXT,
    "IsSuccessful" BOOLEAN DEFAULT FALSE,
    "FailureReason" VARCHAR(100),
    "AttemptedAt" TIMESTAMPTZ DEFAULT now()
);

-- VERIFICATION CODES table
CREATE TABLE IF NOT EXISTS "VerificationCodes" (
    "CodeId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE CASCADE,
    "Code" VARCHAR(10) NOT NULL,
    "Type" VARCHAR(20) NOT NULL, -- 'email_verify', 'phone_verify', 'password_reset'
    "ExpiresAt" TIMESTAMPTZ NOT NULL,
    "IsUsed" BOOLEAN DEFAULT FALSE,
    "CodeCreated" TIMESTAMPTZ DEFAULT now(),
    "IpAddress" VARCHAR(45),
    "Attempts" INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users" ("Email");

CREATE INDEX IF NOT EXISTS idx_users_username ON "Users" ("Username");

CREATE INDEX IF NOT EXISTS idx_users_phone ON "Users" ("Phone");

CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON "LoginAttempts" ("UserId");

CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON "VerificationCodes" ("UserId");