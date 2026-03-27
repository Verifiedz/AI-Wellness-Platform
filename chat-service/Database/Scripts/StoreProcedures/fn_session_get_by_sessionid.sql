CREATE OR REPLACE FUNCTION public.session_select_fuction(
    p_session_id UUID
)
RETURNS TABLE(
    session_id UUID,
    user_id UUID,
    created_date TIMESTAMPTZ,
    is_bookmarked BOOLEAN,
    session_name VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT s.sessionid, s.externaluserid, s.createddate, s.isbookmarked, s.sessionname
    FROM public."session" s
    WHERE s.sessionid = p_session_id;
END;
$$;
