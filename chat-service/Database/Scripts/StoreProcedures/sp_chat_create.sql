DROP PROCEDURE IF EXISTS public.chat_create_storeprocedure(uuid, uuid, character varying, uuid, character varying, boolean, timestamp with time zone);

CREATE OR REPLACE PROCEDURE public.chat_create_storeprocedure(
    IN chatuserid uuid, 
    IN chatreferenceid uuid, 
    IN message character varying,
    IN sessionid uuid, 
    IN status character varying, 
    IN isbookmarked boolean, 
    IN createddate timestamp with time zone
)
 LANGUAGE plpgsql
AS $procedure$
BEGIN
    INSERT INTO chat(chatuserid, chatreferenceid, message, sessionid, status, isbookmarked, createddate)
    VALUES (chatuserid, chatreferenceid, message, sessionid, status, isbookmarked, createddate);
END;
$procedure$;
