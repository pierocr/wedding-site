alter table public.rsvp
  add column if not exists companion_status text not null default 'no',
  add column if not exists is_companion boolean not null default false,
  add column if not exists companion_of_rsvp_id uuid;

update public.rsvp
set
  companion_status = coalesce(nullif(btrim(companion_status), ''), 'no'),
  is_companion = coalesce(is_companion, false);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_companion_status_check'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_companion_status_check
      check (companion_status in ('no', 'yes', 'later'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_companion_parent_fk'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_companion_parent_fk
      foreign key (companion_of_rsvp_id)
      references public.rsvp(id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_companion_relationship_check'
      and conrelid = 'public.rsvp'::regclass
  ) then
    alter table public.rsvp
      add constraint rsvp_companion_relationship_check
      check (
        (is_companion = true and companion_of_rsvp_id is not null and companion_status = 'no')
        or
        (is_companion = false and companion_of_rsvp_id is null)
      );
  end if;
end $$;

create unique index if not exists rsvp_one_companion_per_guest_idx
  on public.rsvp (companion_of_rsvp_id)
  where is_companion = true;

create index if not exists rsvp_companion_of_rsvp_id_idx
  on public.rsvp (companion_of_rsvp_id)
  where companion_of_rsvp_id is not null;

create index if not exists rsvp_is_companion_idx
  on public.rsvp (is_companion);

grant select, insert, update, delete on table public.rsvp to service_role;
