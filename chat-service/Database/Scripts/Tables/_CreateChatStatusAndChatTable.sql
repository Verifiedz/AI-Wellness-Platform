DROP TABLE IF EXISTS public.chat;
DROP TABLE IF EXISTS public.chatstatus;

CREATE TABLE public.chatstatus (
	status_name varchar(50) NOT NULL,
	CONSTRAINT chatstatus_pkey PRIMARY KEY (status_name)
);

INSERT INTO public.chatstatus (status_name) 
VALUES ('dummy1'), ('Sent'), ('Failed');

CREATE TABLE public.chat (
    chatreferenceid uuid NOT NULL,       
	chatuserid uuid NOT NULL,            
	sessionid uuid NOT NULL,             
	message varchar(250) NULL,
	status varchar(50) DEFAULT 'dummy1'::character varying NULL,
	isbookmarked bool DEFAULT false NULL,
	createddate timestamptz DEFAULT now() NULL, 
	
    CONSTRAINT chat_pkey PRIMARY KEY (chatreferenceid), 
	CONSTRAINT fk_status FOREIGN KEY (status) REFERENCES public.chatstatus(status_name)
);
