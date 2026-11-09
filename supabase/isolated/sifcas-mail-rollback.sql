-- Aplicar somente na homologação descartável, caso seja necessário reverter.
begin;
drop table if exists public.sifcas_mail_deliveries;
drop table if exists public.sifcas_mail_campaigns;
drop table if exists public.sifcas_mail_connections;
commit;
