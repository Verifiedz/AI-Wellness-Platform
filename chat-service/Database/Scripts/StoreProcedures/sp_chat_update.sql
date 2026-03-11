DROP PROCEDURE IF EXISTS public.chat_update_storeprocedure(uuid, uuid, text, uuid, character varying, boolean, timestamp with time zone);

CREATE OR REPLACE PROCEDURE public.chat_update_storeprocedure(
    IN p_chatuserid uuid,
    IN p_chatreferenceid uuid,
    IN p_message text,
    IN p_sessionid uuid,
    IN p_status character varying,
    IN p_isbookmarked boolean,
    IN p_createddate timestamp with time zone
)
LANGUAGE plpgsql
AS $procedure$
BEGIN
    UPDATE public.chat
    SET
        chatuserid = p_chatuserid,
        message = p_message,
        sessionid = p_sessionid,
        status = p_status,
        isbookmarked = p_isbookmarked,
        createddate = p_createddate
    WHERE chatreferenceid = p_chatreferenceid;
END;
$procedure$;
