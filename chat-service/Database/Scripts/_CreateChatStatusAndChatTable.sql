CREATE TABLE IF NOT EXISTS ChatStatus (
    status_name VARCHAR(50) PRIMARY KEY
);

-- Optional: seed initial statuses
INSERT INTO ChatStatus (status_name)
VALUES 
    ('dummy1'),
    ('dummy2'),
    ('dummy3')
ON CONFLICT DO NOTHING;  -- avoid duplicates if run multiple times

-- Create Chat table
CREATE TABLE IF NOT EXISTS Chat (
    chatUserId SERIAL PRIMARY KEY,
    chatReferenceId UUID DEFAULT gen_random_uuid(),
    message VARCHAR(250),
    status VARCHAR(50) DEFAULT 'dummy1',
    isBookmarked BOOLEAN DEFAULT FALSE,
    createdDate TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_status FOREIGN KEY (status) REFERENCES ChatStatus(status_name)
);