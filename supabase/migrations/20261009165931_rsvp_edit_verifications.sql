-- Verification codes for securely editing an existing RSVP.
create table public.rsvp_edit_verifications (
  id uuid primary key default gen_random_uuid(),
  rsvp_id uuid not null references public.rsvp(id) on delete cascade,
  email text not null,
  code_hash text not null,
  code_expires_at timestamptz not null,
  attempt_count smallint not null default 0 check (attempt_count between 0 and 5),
  requested_at timestamptz not null default now(),
  verified_at timestamptz,
  access_token_hash text,
  access_expires_at timestamptz,
  used_at timestamptz,
  check (
    (access_token_hash is null and access_expires_at is null)
    or (access_token_hash is not null and access_expires_at is not null)
  )
);

create index rsvp_edit_verifications_email_requested_idx
  on public.rsvp_edit_verifications (email, requested_at desc);

create index rsvp_edit_verifications_access_token_idx
  on public.rsvp_edit_verifications (access_token_hash)
  where used_at is null;

alter table public.rsvp_edit_verifications enable row level security;

revoke all on table public.rsvp_edit_verifications from anon, authenticated;
grant select, insert, update on table public.rsvp_edit_verifications to service_role;

create policy "service_role_manage_rsvp_edit_verifications"
on public.rsvp_edit_verifications
for all
to service_role
using (true)
with check (true);
