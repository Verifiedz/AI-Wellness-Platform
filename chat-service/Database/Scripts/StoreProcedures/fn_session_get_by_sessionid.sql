CREATE OR REPLACE FUNCTION public.session_select_fuction(
    p_session_id UUID
)
RETURNS TABLE(
    session_id UUID,
    user_id UUID,
    created_date TIMESTAMPTZ,
    is_bookmarked BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT s.sessionid, s.externaluserid, s.createddate, s.isbookmarked
    FROM public."session" s
    WHERE s.sessionid = p_session_id;
END;
$$;
