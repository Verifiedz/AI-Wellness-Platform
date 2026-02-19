DROP FUNCTION IF EXISTS public.chat_select_by_session_function(uuid);

CREATE OR REPLACE FUNCTION public.chat_select_by_session_function(
    p_sessionid uuid
)
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
    FROM public.chat c
    WHERE c.sessionid = p_sessionid
    ORDER BY c.createddate ASC; -- ASC means oldest first (top to bottom reading)
END;
$function$;
