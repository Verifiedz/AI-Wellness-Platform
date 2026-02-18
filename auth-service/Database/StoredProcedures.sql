-- Database/StoredProcedures.sql - COMPLETE FIXED VERSION
-- DROP ALL EXISTING FUNCTIONS/PROCEDURES FIRST
DROP FUNCTION IF EXISTS get_user_by_email (VARCHAR);

DROP FUNCTION IF EXISTS get_user_by_username (VARCHAR);

DROP FUNCTION IF EXISTS verify_code (UUID, VARCHAR, VARCHAR);

DROP FUNCTION IF EXISTS is_account_locked (UUID);

DROP FUNCTION IF EXISTS create_user (
    UUID,
    VARCHAR,
    TEXT,
    VARCHAR,
    VARCHAR,
    BOOLEAN,
    BOOLEAN
);

-- 1. USER MANAGEMENT FUNCTIONS
CREATE OR REPLACE FUNCTION create_user(
    p_id UUID,
    p_username VARCHAR(50),
    p_passwordhash TEXT,
    p_email VARCHAR(255),
    p_phone VARCHAR(20),
    p_isactive BOOLEAN,
    p_isemailverified BOOLEAN
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO users (id, username, passwordhash, email, phone, isactive, isemailverified, createdat, updatedat)
    VALUES (p_id, p_username, p_passwordhash, p_email, p_phone, p_isactive, p_isemailverified, NOW(), NOW())
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_by_email(p_email VARCHAR(255))
RETURNS TABLE(
    id UUID,
    username VARCHAR(50),
    passwordhash TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    isactive BOOLEAN,
    isemailverified BOOLEAN,
    createdat TIMESTAMPTZ,
    updatedat TIMESTAMPTZ,
    lastloginat TIMESTAMPTZ,
    failedloginattempts INTEGER,
    lockeduntil TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT u.* FROM users u WHERE u.email = p_email;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_by_username(p_username VARCHAR(50))
RETURNS TABLE(
    id UUID,
    username VARCHAR(50),
    passwordhash TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    isactive BOOLEAN,
    isemailverified BOOLEAN,
    createdat TIMESTAMPTZ,
    updatedat TIMESTAMPTZ,
    lastloginat TIMESTAMPTZ,
    failedloginattempts INTEGER,
    lockeduntil TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT u.* FROM users u WHERE u.username = p_username;
END;
$$;

-- 2. STORED PROCEDURES
CREATE OR REPLACE PROCEDURE update_user_last_login(p_user_id UUID)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users 
    SET lastloginat = NOW(), 
        updatedat = NOW(),
        failedloginattempts = 0,
        lockeduntil = NULL
    WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE PROCEDURE increment_failed_login(p_user_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempts INTEGER;
    v_lock_minutes INTEGER := 15;
BEGIN
    SELECT failedloginattempts INTO v_attempts 
    FROM users WHERE id = p_user_id;
    
    v_attempts := COALESCE(v_attempts, 0) + 1;
    
    UPDATE users 
    SET failedloginattempts = v_attempts,
        updatedat = NOW(),
        lockeduntil = CASE 
            WHEN v_attempts >= 5 THEN NOW() + (v_lock_minutes * interval '1 minute')
            ELSE lockeduntil 
        END
    WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE PROCEDURE log_login_attempt(
    p_user_id UUID,
    p_ipaddress VARCHAR(45),
    p_useragent TEXT,
    p_issuccessful BOOLEAN,
    p_failurereason VARCHAR(100)
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO loginattempts (userid, ipaddress, useragent, issuccessful, failurereason, attemptedat)
    VALUES (p_user_id, p_ipaddress, p_useragent, p_issuccessful, p_failurereason, NOW());
END;
$$;

CREATE OR REPLACE PROCEDURE create_verification_code(
    p_user_id UUID,
    p_code VARCHAR(10),
    p_type VARCHAR(20),
    p_ipaddress VARCHAR(45)
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE verificationcodes 
    SET isused = TRUE 
    WHERE userid = p_user_id AND type = p_type AND isused = FALSE;
    
    INSERT INTO verificationcodes (userid, code, type, expiresat, ipaddress)
    VALUES (p_user_id, p_code, p_type, NOW() + interval '15 minutes', p_ipaddress);
END;
$$;

CREATE OR REPLACE FUNCTION verify_code(
    p_user_id UUID,
    p_code VARCHAR(10),
    p_type VARCHAR(20)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_code_record verificationcodes%ROWTYPE;
BEGIN
    SELECT * INTO v_code_record 
    FROM verificationcodes 
    WHERE userid = p_user_id 
        AND code = p_code 
        AND type = p_type 
        AND isused = FALSE 
        AND expiresat > NOW()
    ORDER BY codecreated DESC 
    LIMIT 1;
    
    IF v_code_record.codeid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    UPDATE verificationcodes 
    SET isused = TRUE 
    WHERE codeid = v_code_record.codeid;
    
    IF p_type = 'email_verify' THEN
        UPDATE users 
        SET isemailverified = TRUE,
            updatedat = NOW()
        WHERE id = p_user_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE PROCEDURE update_user_password(
    p_user_id UUID,
    p_new_password_hash TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users 
    SET passwordhash = p_new_password_hash,
        updatedat = NOW(),
        failedloginattempts = 0,
        lockeduntil = NULL
    WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION is_account_locked(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_locked_until TIMESTAMPTZ;
BEGIN
    SELECT lockeduntil INTO v_locked_until 
    FROM users 
    WHERE id = p_user_id;
    
    RETURN COALESCE(v_locked_until > NOW(), FALSE);
END;
$$;

CREATE OR REPLACE PROCEDURE cleanup_expired_codes()
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM verificationcodes 
    WHERE expiresat < NOW() - interval '1 day';
END;
$$;