DROP PROCEDURE IF EXISTS public.session_update_name_storeprocedure(uuid, varchar);

CREATE OR REPLACE PROCEDURE public.session_update_name_storeprocedure(
    IN _sessionid uuid,
    IN _sessionname varchar
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE session SET sessionname = _sessionname WHERE sessionid = _sessionid;
END;
$$;
