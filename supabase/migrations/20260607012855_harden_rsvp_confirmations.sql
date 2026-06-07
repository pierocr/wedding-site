create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.rsvp
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_submitted_at timestamptz not null default now(),
  add column if not exists submission_count integer not null default 1,
  add column if not exists ip_address inet,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.rsvp
set
  email = lower(btrim(email)),
  name = btrim(name),
  phone = nullif(btrim(phone), ''),
  diet = nullif(btrim(diet), ''),
  message = nullif(btrim(message), ''),
  source = nullif(btrim(source), ''),
  user_agent = nullif(left(btrim(user_agent), 500), ''),
  updated_at = coalesce(updated_at, created_at, now()),
  last_submitted_at = coalesce(last_submitted_at, created_at, now()),
  submission_count = greatest(coalesce(submission_count, 1), 1),
  metadata = coalesce(metadata, '{}'::jsonb);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_email_normalized_check'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_email_normalized_check
      check (email = lower(btrim(email)) and length(email) <= 254);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_name_length_check'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_name_length_check
      check (length(btrim(name)) between 2 and 120);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_phone_length_check'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_phone_length_check
      check (phone is null or length(phone) <= 30);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_diet_length_check'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_diet_length_check
      check (diet is null or length(diet) <= 500);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_message_length_check'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_message_length_check
      check (message is null or length(message) <= 1000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_submission_count_check'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_submission_count_check
      check (submission_count between 1 and 100);
  end if;
end $$;

drop trigger if exists set_rsvp_updated_at on public.rsvp;
create trigger set_rsvp_updated_at
before update on public.rsvp
for each row
execute function public.set_updated_at();

drop policy if exists "Allow insert from anon" on public.rsvp;
drop policy if exists "rsvp_insert_anon" on public.rsvp;
drop policy if exists "service_role_manage_rsvp" on public.rsvp;

alter table public.rsvp enable row level security;

revoke all on table public.rsvp from anon;
revoke all on table public.rsvp from authenticated;
revoke all on table public.rsvp from service_role;
grant select, insert, update on table public.rsvp to service_role;

create policy "service_role_manage_rsvp"
on public.rsvp
for all
to service_role
using (true)
with check (true);

drop index if exists public.rsvp_email_unique_idx;
