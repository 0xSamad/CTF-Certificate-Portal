-- Run in Supabase SQL Editor or through the Supabase CLI before deploying.
create type public.certificate_type as enum ('PARTICIPANT', 'TOP_5');

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null unique check (char_length(full_name) between 2 and 140),
  email text null,
  certificate_type public.certificate_type not null,
  rank integer null check (rank is null or rank > 0),
  image_url text not null,
  file_name text not null unique,
  issued_at timestamptz not null default now(),
  constraint top_5_requires_rank check (
    (certificate_type = 'PARTICIPANT' and rank is null) or
    (certificate_type = 'TOP_5' and rank between 1 and 5)
  )
);

create index certificates_issued_at_idx on public.certificates (issued_at desc);

-- The Next.js server uses the service-role key, so keep client access closed.
alter table public.certificates enable row level security;

-- Images are intentionally public: the home page is a public certificate gallery.
insert into storage.buckets (id, name, public) values
  ('certificate-images', 'certificate-images', true),
  ('certificate-templates', 'certificate-templates', false)
on conflict (id) do update set public = excluded.public;
