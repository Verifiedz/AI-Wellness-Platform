DROP PROCEDURE IF EXISTS public.chat_delete_storeprocedure(uuid);

CREATE OR REPLACE PROCEDURE public.chat_delete_storeprocedure(IN _chatreferenceid uuid)
 LANGUAGE plpgsql
AS $procedure$
BEGIN
    DELETE FROM chat WHERE chatreferenceid = _chatreferenceid;
END;
$procedure$;
