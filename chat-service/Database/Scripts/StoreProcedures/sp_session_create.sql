CREATE OR REPLACE PROCEDURE public.session_create_storeprocedure(
    p_session_id UUID,
    p_user_id UUID,        
    p_created_date TIMESTAMPTZ,
    p_is_bookmarked BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public."session" (sessionid, externaluserid, createddate, isbookmarked)
    VALUES (p_session_id, p_user_id, p_created_date, p_is_bookmarked);
END;
$$;
