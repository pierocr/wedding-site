alter table public.rsvp
  add column if not exists pescatarian boolean,
  add column if not exists vegan boolean;

update public.rsvp
set
  pescatarian = coalesce(pescatarian, false),
  vegan = coalesce(vegan, false);

alter table public.rsvp
  alter column pescatarian set default false,
  alter column pescatarian set not null,
  alter column vegan set default false,
  alter column vegan set not null;
