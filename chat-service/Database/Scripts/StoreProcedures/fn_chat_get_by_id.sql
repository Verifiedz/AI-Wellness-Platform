DROP FUNCTION IF EXISTS public.chat_select_function(uuid);

CREATE OR REPLACE FUNCTION public.chat_select_function(_chatreferenceid uuid)
 RETURNS TABLE(
    chatreferenceid uuid, 
    chatuserid uuid, 
    message Text,
    sessionid uuid,
    status character varying, 
    isbookmarked boolean, 
    createddate timestamp with time zone
 )
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.chatreferenceid,
        c.chatuserid,
        c.message,
        c.sessionid,
        c.status,
        c.isbookmarked,
        c.createddate
    FROM chat c
    WHERE c.chatreferenceid = _chatreferenceid;
END;
$function$;
