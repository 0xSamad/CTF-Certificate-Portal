-- Run this only if you previously ran 001_certificates.sql from an older version.
alter table public.certificates drop constraint if exists certificates_email_key;
alter table public.certificates alter column email drop not null;

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'certificates' and column_name = 'pdf_url') then
    alter table public.certificates rename column pdf_url to image_url;
  end if;
end $$;

alter table public.certificates add column if not exists file_name text;
update public.certificates
set file_name = regexp_replace(lower(full_name), '[^a-z0-9]+', '-', 'g') || '.jpg'
where file_name is null;
alter table public.certificates alter column image_url set not null;
alter table public.certificates alter column file_name set not null;
alter table public.certificates add constraint certificates_full_name_key unique (full_name);
alter table public.certificates add constraint certificates_file_name_key unique (file_name);

insert into storage.buckets (id, name, public) values ('certificate-images', 'certificate-images', true)
on conflict (id) do update set public = true;
