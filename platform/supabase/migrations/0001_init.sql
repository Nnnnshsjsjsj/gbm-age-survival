-- GBM Cohort Platform: shared summaries, researcher profiles, dataset discussions, admin review.
-- No raw patient rows are ever stored. Only cohort-level summaries.

create extension if not exists pgcrypto;

-- ---------- roles ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique check (handle ~ '^[a-z0-9_-]{3,32}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  institution text check (char_length(institution) <= 120),
  country text check (char_length(country) <= 60),
  role text not null default 'student' check (role in ('student','researcher','clinician','teacher','other')),
  tags text[] not null default '{}',
  bio text check (char_length(bio) <= 600),
  works_with text check (char_length(works_with) <= 300),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- shared cohort summaries (the only research data that is stored) ----------
create table if not exists public.cohort_summaries (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  cohort_name text not null check (char_length(cohort_name) between 2 and 120),
  country text,
  years_from int check (years_from between 1970 and 2100),
  years_to int check (years_to between 1970 and 2100),
  n int not null check (n >= 10),
  events int not null check (events >= 10 and events <= n),
  median_age numeric(5,1),
  age_iqr numeric(5,1)[],
  age_bands jsonb,                       -- {"<50": 12, "50-59": 18, "60-69": 20, ">=70": null}; null = fewer than 10, suppressed
  median_os numeric(6,2),
  s6 numeric(5,4), s12 numeric(5,4), s24 numeric(5,4),
  models jsonb not null,                 -- [{"covariates": ["age"], "beta": [...], "se": [...], "n": 60, "events": 41}]
  schema_version text not null default 'gbm-summary/1',
  ethics_confirmed boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cohort_summaries_status_idx on public.cohort_summaries(status);

-- guard: a summary must not carry anything that looks like a patient row
create or replace function public.summary_guard() returns trigger language plpgsql as $$
begin
  if jsonb_typeof(new.models) <> 'array' or jsonb_array_length(new.models) = 0 or jsonb_array_length(new.models) > 12 then
    raise exception 'models must be a non-empty array of at most 12 model summaries';
  end if;
  if pg_column_size(new.models) > 20000 or pg_column_size(coalesce(new.age_bands, '{}'::jsonb)) > 2000 then
    raise exception 'summary payload too large';
  end if;
  if new.ethics_confirmed is not true then
    raise exception 'ethics approval or public licence must be confirmed';
  end if;
  return new;
end $$;
drop trigger if exists cohort_summaries_guard on public.cohort_summaries;
create trigger cohort_summaries_guard before insert or update on public.cohort_summaries
  for each row execute function public.summary_guard();

-- ---------- discussion per dataset ----------
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  dataset_key text not null,             -- 'tcga_gbm', 'cgga', 'msk_impact', 'cptac_gbm', or a cohort_summaries.id
  author uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'pending' check (status in ('pending','approved','removed')),
  created_at timestamptz not null default now()
);
create index if not exists threads_dataset_idx on public.threads(dataset_key, status);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  author uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  removed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists replies_thread_idx on public.replies(thread_id);

-- ---------- audit ----------
create table if not exists public.audit_log (
  id bigserial primary key,
  actor uuid,
  action text not null,
  target_table text not null,
  target_id text,
  note text,
  at timestamptz not null default now()
);

-- ---------- row-level security ----------
alter table public.admins enable row level security;
alter table public.profiles enable row level security;
alter table public.cohort_summaries enable row level security;
alter table public.threads enable row level security;
alter table public.replies enable row level security;
alter table public.audit_log enable row level security;

-- admins: readable only by admins (is_admin() is security definer so the check itself works for everyone)
create policy admins_select on public.admins for select using (public.is_admin());

-- profiles: public ones readable by any signed-in user; owner edits own row
create policy profiles_select on public.profiles for select using (is_public or id = auth.uid() or public.is_admin());
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- summaries: approved visible to everyone (including anonymous readers of the pool), own rows to owner, all to admins
create policy summaries_select on public.cohort_summaries for select
  using (status = 'approved' or owner = auth.uid() or public.is_admin());
create policy summaries_insert on public.cohort_summaries for insert with check (owner = auth.uid());
create policy summaries_owner_update on public.cohort_summaries for update
  using (owner = auth.uid() and status = 'pending') with check (owner = auth.uid() and status = 'pending');
create policy summaries_admin_update on public.cohort_summaries for update using (public.is_admin()) with check (public.is_admin());
create policy summaries_owner_delete on public.cohort_summaries for delete using (owner = auth.uid() or public.is_admin());

-- threads: approved visible to signed-in users; author sees own pending; admins see all
create policy threads_select on public.threads for select
  using (auth.uid() is not null and (status = 'approved' or author = auth.uid() or public.is_admin()));
create policy threads_insert on public.threads for insert with check (author = auth.uid() and status = 'pending');
create policy threads_admin_update on public.threads for update using (public.is_admin()) with check (public.is_admin());

-- replies: live immediately on approved threads; admins can remove
create policy replies_select on public.replies for select
  using (auth.uid() is not null and removed = false or public.is_admin());
create policy replies_insert on public.replies for insert
  with check (author = auth.uid() and exists (select 1 from public.threads t where t.id = thread_id and t.status = 'approved'));
create policy replies_admin_update on public.replies for update using (public.is_admin()) with check (public.is_admin());

-- audit: admins read; inserts through the functions below
create policy audit_select on public.audit_log for select using (public.is_admin());

-- ---------- admin actions (security definer so audit rows are written server-side) ----------
create or replace function public.review_summary(p_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;
  if p_status not in ('approved','rejected') then raise exception 'status must be approved or rejected'; end if;
  update public.cohort_summaries set status = p_status, review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
  insert into public.audit_log(actor, action, target_table, target_id, note) values (auth.uid(), 'review_summary:' || p_status, 'cohort_summaries', p_id::text, p_note);
end $$;

create or replace function public.moderate_thread(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;
  if p_status not in ('approved','removed') then raise exception 'status must be approved or removed'; end if;
  update public.threads set status = p_status where id = p_id;
  insert into public.audit_log(actor, action, target_table, target_id) values (auth.uid(), 'moderate_thread:' || p_status, 'threads', p_id::text);
end $$;

create or replace function public.remove_reply(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;
  update public.replies set removed = true where id = p_id;
  insert into public.audit_log(actor, action, target_table, target_id) values (auth.uid(), 'remove_reply', 'replies', p_id::text);
end $$;

-- ---------- public read of the pool without sign-in ----------
grant usage on schema public to anon, authenticated;
grant select on public.cohort_summaries to anon, authenticated;
grant select, insert, update, delete on public.cohort_summaries to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.threads to authenticated;
grant select, insert on public.replies to authenticated;
grant execute on function public.is_admin(), public.review_summary(uuid, text, text), public.moderate_thread(uuid, text), public.remove_reply(uuid) to authenticated;

-- first admin: run once after your first sign-in
-- insert into public.admins(user_id) select id from auth.users where email = 'you@example.com';
