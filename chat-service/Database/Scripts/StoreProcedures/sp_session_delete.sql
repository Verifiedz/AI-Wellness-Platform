DROP PROCEDURE IF EXISTS public.session_delete_storeprocedure(uuid);

CREATE OR REPLACE PROCEDURE public.session_delete_storeprocedure(IN _sessionid uuid)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM chat WHERE sessionid = _sessionid;
    DELETE FROM session WHERE sessionid = _sessionid;
END;
$$;
