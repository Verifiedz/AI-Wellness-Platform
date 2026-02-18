
DROP TABLE IF EXISTS session CASCADE;

CREATE TABLE session (
    sessionId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    externalUserId UUID NOT NULL, 
    isBookmarked BOOLEAN DEFAULT false,
    createdDate TIMESTAMPTZ DEFAULT now()
);
