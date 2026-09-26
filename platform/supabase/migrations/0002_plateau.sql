-- plateau: research + family community for glioblastoma cohort data.
-- Lives in its own schema "plateau" inside the shared Supabase project. Uses Supabase Auth (email + password).
-- Security model: row-level security on every table; privileged actions only through security-definer functions.

create schema if not exists plateau;
grant usage on schema plateau to anon, authenticated;

-- ======================================================================= helpers
create table if not exists plateau.admin_emails (email text primary key);
insert into plateau.admin_emails(email) values ('mcnazar008@gmail.com') on conflict do nothing;

create table if not exists plateau.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

create table if not exists plateau.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9_-]{2,23}$'),
  space text not null check (space in ('research','family')),
  role_label text not null default 'student'
    check (role_label in ('student','researcher','clinician','teacher','patient','caregiver','family','other')),
  display_name text check (char_length(display_name) <= 60),
  institution text check (char_length(institution) <= 120),
  country text check (char_length(country) <= 60),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  bio text check (char_length(bio) <= 600),
  works_with text check (char_length(works_with) <= 300),
  is_public boolean not null default true,
  adult_confirmed boolean not null default false,
  rules_accepted_at timestamptz,
  banned boolean not null default false,
  ban_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function plateau.is_admin() returns boolean
language sql stable security definer set search_path = plateau, public as $$
  select exists (select 1 from plateau.admins where user_id = auth.uid())
      or exists (select 1 from plateau.admin_emails where lower(email) = lower(coalesce(auth.jwt() ->> 'email','')));
$$;
create or replace function plateau.my_space() returns text
language sql stable security definer set search_path = plateau, public as $$
  select space from plateau.profiles where id = auth.uid();
$$;
create or replace function plateau.can_post() returns boolean
language sql stable security definer set search_path = plateau, public as $$
  select exists (select 1 from plateau.profiles p where p.id = auth.uid() and not p.banned
                 and p.rules_accepted_at is not null and p.adult_confirmed);
$$;

-- a user may not change their own space, ban state or admin-relevant fields
create or replace function plateau.profile_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and not plateau.is_admin() then
    if new.space <> old.space then raise exception 'space cannot be changed; contact the moderators'; end if;
    if new.banned <> old.banned or coalesce(new.ban_reason,'') <> coalesce(old.ban_reason,'') then raise exception 'not allowed'; end if;
  end if;
  if tg_op = 'INSERT' and not plateau.is_admin() then new.banned := false; new.ban_reason := null; end if;
  if new.space = 'family' and new.role_label not in ('patient','caregiver','family','other') then new.role_label := 'family'; end if;
  if new.space = 'research' and new.role_label in ('patient','caregiver','family') then new.role_label := 'other'; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profile_guard on plateau.profiles;
create trigger profile_guard before insert or update on plateau.profiles for each row execute function plateau.profile_guard();

-- ======================================================================= boards
create table if not exists plateau.boards (
  key text primary key check (key ~ '^[a-z0-9-]{2,40}$'),
  space text not null check (space in ('research','family')),
  kind text not null check (kind in ('dataset','topic','family')),
  title text not null,
  blurb text not null,
  sort int not null default 100
);
insert into plateau.boards(key, space, kind, title, blurb, sort) values
 ('lobby','research','topic','The lobby','Introduce yourself, ask anything about glioblastoma data, find people who work on what you work on.',1),
 ('methods','research','topic','Methods & statistics','Kaplan–Meier, Cox models, proportional hazards, meta-analysis. Bring your output, get a second pair of eyes.',2),
 ('finding-data','research','topic','Finding data','Where the cohorts are, how to get access, what each dataset really contains.',3),
 ('papers','research','topic','Reading group','One paper at a time. Post the link, your summary, and the part you did not understand.',4),
 ('show-your-work','research','topic','Show your work','Posters, theses, preprints, code. Get feedback before a judge or a reviewer sees it.',5),
 ('tcga-gbm','research','dataset','TCGA-GBM','593 patients, diagnosed 1989–2013. Questions and notes about the TCGA glioblastoma data.',10),
 ('cgga','research','dataset','CGGA','218 primary glioblastoma patients from the Chinese Glioma Genome Atlas.',11),
 ('msk-impact','research','dataset','MSK-IMPACT','485 patients sequenced at Memorial Sloan Kettering, 2014–2018.',12),
 ('cptac-gbm','research','dataset','CPTAC-GBM','96 patients with proteogenomic data, 2016–2019.',13),
 ('platform-help','research','topic','Using plateau','Bugs, feature requests and how-to questions about this site.',20),
 ('newly-diagnosed','family','family','Newly diagnosed','The first weeks. What to ask, what the words mean, how others got through them.',1),
 ('caregivers','family','family','Caregivers','For the people doing the driving, the pills, the paperwork and the night shifts.',2),
 ('questions-for-doctors','family','family','Questions for your doctor','Help each other write better questions for the care team. No one here gives medical advice.',3),
 ('everyday-life','family','family','Everyday life','Work, school, money, sleep, food, humour. The parts of life that keep going.',4),
 ('remembrance','family','family','Remembrance','For people we have lost. Posts here are never argued with.',5)
on conflict (key) do update set title = excluded.title, blurb = excluded.blurb, sort = excluded.sort, space = excluded.space, kind = excluded.kind;

-- ======================================================================= threads, replies, votes
create table if not exists plateau.threads (
  id uuid primary key default gen_random_uuid(),
  board_key text not null references plateau.boards(key),
  author uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 140),
  body text not null check (char_length(body) between 1 and 6000),
  status text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  mod_note text,
  reply_count int not null default 0,
  vote_count int not null default 0,
  last_activity timestamptz not null default now(),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists threads_board_idx on plateau.threads(board_key, status, last_activity desc);
create index if not exists threads_author_idx on plateau.threads(author);

create table if not exists plateau.replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references plateau.threads(id) on delete cascade,
  author uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  removed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists replies_thread_idx on plateau.replies(thread_id, created_at);

create table if not exists plateau.votes (
  thread_id uuid not null references plateau.threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists plateau.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('thread','reply','profile','summary')),
  target_id uuid not null,
  reporter uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);

-- ======================================================================= shared cohort summaries
create table if not exists plateau.cohort_summaries (
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
  age_bands jsonb,
  median_os numeric(6,2),
  s6 numeric(5,4), s12 numeric(5,4), s24 numeric(5,4),
  models jsonb not null,
  schema_version text not null default 'gbm-summary/1',
  ethics_confirmed boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists plateau.audit_log (
  id bigserial primary key, actor uuid, action text not null, target text, note text, at timestamptz not null default now()
);

-- ======================================================================= guards and counters
create or replace function plateau.thread_guard() returns trigger language plpgsql security definer set search_path = plateau, public as $$
declare b_space text; n_today int;
begin
  if tg_op = 'INSERT' then
    select space into b_space from plateau.boards where key = new.board_key;
    if b_space is null then raise exception 'unknown board'; end if;
    if not plateau.is_admin() then
      if not plateau.can_post() then raise exception 'finish setting up your account first (rules and 18+ confirmation)'; end if;
      if plateau.my_space() <> b_space then raise exception 'this board belongs to the other space'; end if;
      new.status := 'pending'; new.mod_note := null; new.reviewed_at := null; new.vote_count := 0; new.reply_count := 0;
      select count(*) into n_today from plateau.threads where author = auth.uid() and created_at > now() - interval '24 hours';
      if n_today >= 8 then raise exception 'daily limit of 8 new posts reached'; end if;
    end if;
    new.author := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists thread_guard on plateau.threads;
create trigger thread_guard before insert on plateau.threads for each row execute function plateau.thread_guard();

create or replace function plateau.reply_guard() returns trigger language plpgsql security definer set search_path = plateau, public as $$
declare t record; n_min int;
begin
  select th.status, b.space into t from plateau.threads th join plateau.boards b on b.key = th.board_key where th.id = new.thread_id;
  if t is null or t.status <> 'approved' then raise exception 'replies are only possible on approved posts'; end if;
  if not plateau.is_admin() then
    if not plateau.can_post() then raise exception 'finish setting up your account first'; end if;
    if plateau.my_space() <> t.space then raise exception 'this thread belongs to the other space'; end if;
    select count(*) into n_min from plateau.replies where author = auth.uid() and created_at > now() - interval '1 minute';
    if n_min >= 5 then raise exception 'slow down: at most 5 replies a minute'; end if;
  end if;
  new.author := auth.uid(); new.removed := false;
  update plateau.threads set reply_count = reply_count + 1, last_activity = now() where id = new.thread_id;
  return new;
end $$;
drop trigger if exists reply_guard on plateau.replies;
create trigger reply_guard before insert on plateau.replies for each row execute function plateau.reply_guard();

create or replace function plateau.vote_count() returns trigger language plpgsql security definer set search_path = plateau, public as $$
begin
  if tg_op = 'INSERT' then update plateau.threads set vote_count = vote_count + 1 where id = new.thread_id; return new;
  else update plateau.threads set vote_count = greatest(vote_count - 1, 0) where id = old.thread_id; return old; end if;
end $$;
drop trigger if exists vote_count on plateau.votes;
create trigger vote_count after insert or delete on plateau.votes for each row execute function plateau.vote_count();

create or replace function plateau.summary_guard() returns trigger language plpgsql as $$
begin
  if jsonb_typeof(new.models) <> 'array' or jsonb_array_length(new.models) = 0 or jsonb_array_length(new.models) > 12 then
    raise exception 'models must be a non-empty array of at most 12 model summaries'; end if;
  if pg_column_size(new.models) > 20000 or pg_column_size(coalesce(new.age_bands,'{}'::jsonb)) > 2000 then
    raise exception 'summary payload too large'; end if;
  if new.ethics_confirmed is not true then raise exception 'ethics approval or a public licence must be confirmed'; end if;
  if tg_op = 'INSERT' and not plateau.is_admin() then
    if coalesce(plateau.my_space(),'') <> 'research' then raise exception 'only research accounts can share cohort summaries'; end if;
    new.owner := auth.uid(); new.status := 'pending'; new.review_note := null; new.reviewed_at := null;
  end if;
  return new;
end $$;
drop trigger if exists summary_guard on plateau.cohort_summaries;
create trigger summary_guard before insert or update on plateau.cohort_summaries for each row execute function plateau.summary_guard();

-- ======================================================================= row-level security
alter table plateau.admin_emails enable row level security;
alter table plateau.admins enable row level security;
alter table plateau.profiles enable row level security;
alter table plateau.boards enable row level security;
alter table plateau.threads enable row level security;
alter table plateau.replies enable row level security;
alter table plateau.votes enable row level security;
alter table plateau.reports enable row level security;
alter table plateau.cohort_summaries enable row level security;
alter table plateau.audit_log enable row level security;

drop policy if exists admins_read on plateau.admins;
create policy admins_read on plateau.admins for select using (plateau.is_admin());

drop policy if exists profiles_read on plateau.profiles;
create policy profiles_read on plateau.profiles for select using (
  id = auth.uid() or plateau.is_admin()
  or (space = 'research' and is_public and not banned)
  or (space = 'family' and plateau.my_space() = 'family' and not banned));
drop policy if exists profiles_insert on plateau.profiles;
create policy profiles_insert on plateau.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_update on plateau.profiles;
create policy profiles_update on plateau.profiles for update using (id = auth.uid() or plateau.is_admin()) with check (id = auth.uid() or plateau.is_admin());
drop policy if exists profiles_delete on plateau.profiles;
create policy profiles_delete on plateau.profiles for delete using (id = auth.uid() or plateau.is_admin());

drop policy if exists boards_read on plateau.boards;
create policy boards_read on plateau.boards for select using (true);

drop policy if exists threads_read on plateau.threads;
create policy threads_read on plateau.threads for select using (
  plateau.is_admin() or author = auth.uid()
  or (status = 'approved' and exists (select 1 from plateau.boards b where b.key = board_key
        and (b.space = 'research' or plateau.my_space() = 'family'))));
drop policy if exists threads_insert on plateau.threads;
create policy threads_insert on plateau.threads for insert with check (auth.uid() is not null);
drop policy if exists threads_author_edit on plateau.threads;
create policy threads_author_edit on plateau.threads for update
  using (author = auth.uid() and status = 'pending') with check (author = auth.uid() and status = 'pending');
drop policy if exists threads_author_delete on plateau.threads;
create policy threads_author_delete on plateau.threads for delete using (author = auth.uid() or plateau.is_admin());

drop policy if exists replies_read on plateau.replies;
create policy replies_read on plateau.replies for select using (
  plateau.is_admin() or (not removed and exists (select 1 from plateau.threads t join plateau.boards b on b.key = t.board_key
     where t.id = thread_id and t.status = 'approved' and (b.space = 'research' or plateau.my_space() = 'family'))));
drop policy if exists replies_insert on plateau.replies;
create policy replies_insert on plateau.replies for insert with check (auth.uid() is not null);
drop policy if exists replies_author_delete on plateau.replies;
create policy replies_author_delete on plateau.replies for delete using (author = auth.uid());

drop policy if exists votes_read on plateau.votes;
create policy votes_read on plateau.votes for select using (user_id = auth.uid());
drop policy if exists votes_insert on plateau.votes;
create policy votes_insert on plateau.votes for insert with check (user_id = auth.uid() and plateau.can_post()
  and exists (select 1 from plateau.threads t join plateau.boards b on b.key = t.board_key
              where t.id = thread_id and t.status = 'approved' and b.space = plateau.my_space()));
drop policy if exists votes_delete on plateau.votes;
create policy votes_delete on plateau.votes for delete using (user_id = auth.uid());

drop policy if exists reports_insert on plateau.reports;
create policy reports_insert on plateau.reports for insert with check (reporter = auth.uid());
drop policy if exists reports_read on plateau.reports;
create policy reports_read on plateau.reports for select using (plateau.is_admin() or reporter = auth.uid());

drop policy if exists summaries_read on plateau.cohort_summaries;
create policy summaries_read on plateau.cohort_summaries for select using (status = 'approved' or owner = auth.uid() or plateau.is_admin());
drop policy if exists summaries_insert on plateau.cohort_summaries;
create policy summaries_insert on plateau.cohort_summaries for insert with check (auth.uid() is not null);
drop policy if exists summaries_owner_delete on plateau.cohort_summaries;
create policy summaries_owner_delete on plateau.cohort_summaries for delete using (owner = auth.uid() or plateau.is_admin());

drop policy if exists audit_read on plateau.audit_log;
create policy audit_read on plateau.audit_log for select using (plateau.is_admin());

-- ======================================================================= read functions (joined, RLS-respecting)
-- author handles: research handles are public; family handles only to family members and admins
create or replace function plateau.handle_of(uid uuid) returns json language sql stable security definer set search_path = plateau, public as $$
  select case when p.space = 'research' or plateau.my_space() = 'family' or plateau.is_admin() or p.id = auth.uid()
              then json_build_object('handle', p.handle, 'role', p.role_label, 'space', p.space)
              else json_build_object('handle', 'member', 'role', null, 'space', p.space) end
  from plateau.profiles p where p.id = uid;
$$;

create or replace function plateau.feed(p_board text default null, p_space text default 'research', p_sort text default 'active',
                                        p_query text default null, p_limit int default 30, p_offset int default 0)
returns setof json language sql stable security invoker set search_path = plateau, public as $$
  select json_build_object('id', t.id, 'board', t.board_key, 'board_title', b.title, 'title', t.title,
         'excerpt', left(t.body, 280), 'status', t.status, 'replies', t.reply_count, 'votes', t.vote_count,
         'created_at', t.created_at, 'last_activity', t.last_activity, 'author', plateau.handle_of(t.author),
         'mine', t.author = auth.uid(), 'voted', exists (select 1 from plateau.votes v where v.thread_id = t.id and v.user_id = auth.uid()))
  from plateau.threads t join plateau.boards b on b.key = t.board_key
  where b.space = p_space and (p_board is null or t.board_key = p_board)
    and (t.status = 'approved' or t.author = auth.uid())
    and (p_query is null or t.title ilike '%' || p_query || '%' or t.body ilike '%' || p_query || '%')
  order by case when p_sort = 'top' then t.vote_count end desc nulls last,
           case when p_sort = 'new' then t.created_at end desc nulls last,
           t.last_activity desc
  limit least(p_limit, 100) offset greatest(p_offset, 0);
$$;

create or replace function plateau.thread(p_id uuid) returns json language sql stable security invoker set search_path = plateau, public as $$
  select json_build_object('id', t.id, 'board', t.board_key, 'board_title', b.title, 'space', b.space, 'title', t.title, 'body', t.body,
    'status', t.status, 'mod_note', case when t.author = auth.uid() or plateau.is_admin() then t.mod_note end,
    'replies_count', t.reply_count, 'votes', t.vote_count, 'created_at', t.created_at, 'author', plateau.handle_of(t.author),
    'mine', t.author = auth.uid(), 'voted', exists (select 1 from plateau.votes v where v.thread_id = t.id and v.user_id = auth.uid()),
    'replies', coalesce((select json_agg(json_build_object('id', r.id, 'body', r.body, 'created_at', r.created_at,
        'author', plateau.handle_of(r.author), 'mine', r.author = auth.uid(), 'removed', r.removed) order by r.created_at)
      from plateau.replies r where r.thread_id = t.id), '[]'::json))
  from plateau.threads t join plateau.boards b on b.key = t.board_key where t.id = p_id;
$$;

create or replace function plateau.stats() returns json language sql stable security definer set search_path = plateau, public as $$
  select json_build_object(
    'researchers', (select count(*) from plateau.profiles where space = 'research' and not banned),
    'families', (select count(*) from plateau.profiles where space = 'family' and not banned),
    'posts', (select count(*) from plateau.threads where status = 'approved'),
    'shared_cohorts', (select count(*) from plateau.cohort_summaries where status = 'approved'),
    'median_review_minutes', (select round(extract(epoch from percentile_cont(0.5) within group (order by reviewed_at - created_at)) / 60)
                              from plateau.threads where reviewed_at is not null and reviewed_at > now() - interval '30 days'));
$$;

create or replace function plateau.handle_available(p_handle text) returns boolean language sql stable security definer set search_path = plateau, public as $$
  select not exists (select 1 from plateau.profiles where handle = lower(p_handle));
$$;

-- ======================================================================= moderation (admins only)
create or replace function plateau.mod_queue() returns json language plpgsql stable security definer set search_path = plateau, public as $$
begin
  if not plateau.is_admin() then raise exception 'not a moderator'; end if;
  return json_build_object(
    'threads', coalesce((select json_agg(json_build_object('id', t.id, 'board', t.board_key, 'space', b.space, 'title', t.title, 'body', t.body,
        'created_at', t.created_at, 'author', plateau.handle_of(t.author)) order by t.created_at)
      from plateau.threads t join plateau.boards b on b.key = t.board_key where t.status = 'pending'), '[]'::json),
    'summaries', coalesce((select json_agg(row_to_json(s) order by s.created_at) from plateau.cohort_summaries s where s.status = 'pending'), '[]'::json),
    'reports', coalesce((select json_agg(json_build_object('id', r.id, 'target_type', r.target_type, 'target_id', r.target_id, 'reason', r.reason,
        'created_at', r.created_at, 'reporter', plateau.handle_of(r.reporter)) order by r.created_at)
      from plateau.reports r where r.status = 'open'), '[]'::json),
    'members', (select count(*) from plateau.profiles));
end $$;

create or replace function plateau.moderate_thread(p_id uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = plateau, public as $$
begin
  if not plateau.is_admin() then raise exception 'not a moderator'; end if;
  if p_status not in ('approved','rejected','removed') then raise exception 'bad status'; end if;
  update plateau.threads set status = p_status, mod_note = p_note, reviewed_at = now(), last_activity = case when p_status = 'approved' then now() else last_activity end where id = p_id;
  insert into plateau.audit_log(actor, action, target, note) values (auth.uid(), 'thread:' || p_status, p_id::text, p_note);
end $$;

create or replace function plateau.remove_reply(p_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = plateau, public as $$
begin
  if not plateau.is_admin() then raise exception 'not a moderator'; end if;
  update plateau.replies set removed = true where id = p_id;
  insert into plateau.audit_log(actor, action, target, note) values (auth.uid(), 'reply:removed', p_id::text, p_note);
end $$;

create or replace function plateau.review_summary(p_id uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = plateau, public as $$
begin
  if not plateau.is_admin() then raise exception 'not a moderator'; end if;
  if p_status not in ('approved','rejected') then raise exception 'bad status'; end if;
  update plateau.cohort_summaries set status = p_status, review_note = p_note, reviewed_at = now() where id = p_id;
  insert into plateau.audit_log(actor, action, target, note) values (auth.uid(), 'summary:' || p_status, p_id::text, p_note);
end $$;

create or replace function plateau.resolve_report(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = plateau, public as $$
begin
  if not plateau.is_admin() then raise exception 'not a moderator'; end if;
  update plateau.reports set status = p_status where id = p_id;
  insert into plateau.audit_log(actor, action, target) values (auth.uid(), 'report:' || p_status, p_id::text);
end $$;

create or replace function plateau.ban_user(p_handle text, p_reason text) returns void
language plpgsql security definer set search_path = plateau, public as $$
begin
  if not plateau.is_admin() then raise exception 'not a moderator'; end if;
  update plateau.profiles set banned = true, ban_reason = p_reason where handle = lower(p_handle);
  insert into plateau.audit_log(actor, action, target, note) values (auth.uid(), 'ban', p_handle, p_reason);
end $$;

create or replace function plateau.unban_user(p_handle text) returns void
language plpgsql security definer set search_path = plateau, public as $$
begin
  if not plateau.is_admin() then raise exception 'not a moderator'; end if;
  update plateau.profiles set banned = false, ban_reason = null where handle = lower(p_handle);
  insert into plateau.audit_log(actor, action, target) values (auth.uid(), 'unban', p_handle);
end $$;

-- account deletion by the user (removes auth user; cascades to everything they own)
create or replace function plateau.delete_my_account() returns void
language plpgsql security definer set search_path = plateau, public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ======================================================================= grants
grant select on all tables in schema plateau to anon, authenticated;
grant insert, update, delete on plateau.profiles, plateau.threads, plateau.replies, plateau.votes, plateau.reports, plateau.cohort_summaries to authenticated;
revoke all on plateau.admin_emails from anon, authenticated;
grant execute on all functions in schema plateau to anon, authenticated;
revoke execute on function plateau.delete_my_account() from anon;
revoke execute on function plateau.mod_queue(), plateau.moderate_thread(uuid,text,text), plateau.remove_reply(uuid,text),
  plateau.review_summary(uuid,text,text), plateau.resolve_report(uuid,text), plateau.ban_user(text,text), plateau.unban_user(text) from anon;
alter default privileges in schema plateau grant select on tables to anon, authenticated;
