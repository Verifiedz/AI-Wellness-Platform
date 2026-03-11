DROP PROCEDURE IF EXISTS public.session_set_bookmark_storeprocedure(uuid, boolean);

CREATE OR REPLACE PROCEDURE public.session_set_bookmark_storeprocedure(
    IN p_session_id uuid,
    IN p_isbookmarked boolean
)
LANGUAGE plpgsql
AS $procedure$
BEGIN
    UPDATE public."session"
    SET isbookmarked = p_isbookmarked
    WHERE sessionid = p_session_id;
END;
$procedure$;
