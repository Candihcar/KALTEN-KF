create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('user', 'editor', 'duma', 'admin');
create type public.publish_status as enum ('draft', 'published', 'archived');
create type public.news_category as enum (
  'state',
  'government',
  'duma',
  'legislation',
  'international',
  'security',
  'statements',
  'announcements'
);
create type public.doc_status as enum (
  'draft',
  'in_force',
  'amended',
  'suspended',
  'repealed',
  'cancelled'
);
create type public.bill_status as enum (
  'draft',
  'submitted',
  'under_review',
  'voting',
  'adopted',
  'rejected',
  'revision',
  'signed',
  'published',
  'void'
);
create type public.code_kind as enum ('criminal', 'administrative');
create type public.body_kind as enum (
  'head',
  'government',
  'duma',
  'judicial',
  'law_enforcement',
  'agency'
);
create type public.intl_doc_kind as enum ('treaty', 'agreement', 'statement', 'negotiation');
create type public.session_kind as enum ('agenda', 'protocol');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(btrim(title)) >= 3),
  summary text,
  body text,
  category public.news_category not null default 'state',
  author text,
  status public.publish_status not null default 'draft',
  is_demo boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_posts_public_feed_idx
  on public.news_posts (published_at desc nulls last)
  where status = 'published';
create index news_posts_category_idx on public.news_posts (category);

create table public.legislation_documents (
  id uuid primary key default gen_random_uuid(),
  doc_number text not null,
  title text not null,
  doc_type text not null,
  authority text not null default '',
  category text not null default '',
  adopted_on date,
  published_on date,
  effective_on date,
  revision text,
  status public.doc_status not null default 'draft',
  is_demo boolean not null default false,
  summary text,
  body text,
  related_numbers text[] not null default '{}',
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index legislation_documents_number_idx on public.legislation_documents (doc_number);
create index legislation_documents_status_idx on public.legislation_documents (status);

create table public.code_articles (
  id uuid primary key default gen_random_uuid(),
  code_kind public.code_kind not null,
  article_number text not null,
  title text not null,
  part text,
  category text not null default '',
  description text,
  sanction text,
  notes text,
  related text[] not null default '{}',
  status public.doc_status not null default 'draft',
  effective_on date,
  is_demo boolean not null default false,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index code_articles_number_part_key
  on public.code_articles (code_kind, article_number, coalesce(part, ''));
create index code_articles_category_idx on public.code_articles (code_kind, category);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  title text not null,
  summary text,
  status public.bill_status not null default 'draft',
  is_demo boolean not null default false,
  initiator text not null default '',
  submitted_on date,
  related_law_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bills_status_idx on public.bills (status);

create table public.bill_events (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  occurred_on date not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create index bill_events_bill_idx on public.bill_events (bill_id, occurred_on);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  voted_on date,
  title text not null,
  for_count integer check (for_count is null or for_count >= 0),
  against_count integer check (against_count is null or against_count >= 0),
  abstain_count integer check (abstain_count is null or abstain_count >= 0),
  published boolean not null default false,
  source_note text,
  created_at timestamptz not null default now()
);

create index votes_bill_idx on public.votes (bill_id, voted_on desc);

create table public.duma_sessions (
  id uuid primary key default gen_random_uuid(),
  kind public.session_kind not null,
  number text not null,
  title text not null,
  session_date date,
  body text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index duma_sessions_kind_idx on public.duma_sessions (kind, session_date desc);

create table public.gov_bodies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind public.body_kind not null,
  summary text,
  description text,
  structure text,
  contacts text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.intl_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind public.intl_doc_kind not null,
  country text not null default '',
  signed_on date,
  status text not null default 'Проект',
  is_demo boolean not null default false,
  summary text,
  body text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid,
  action text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_role public.app_role,
  changed_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create index audit_log_changed_at_idx on public.audit_log (changed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger news_posts_set_updated_at
  before update on public.news_posts
  for each row execute function public.set_updated_at();

create trigger legislation_documents_set_updated_at
  before update on public.legislation_documents
  for each row execute function public.set_updated_at();

create trigger code_articles_set_updated_at
  before update on public.code_articles
  for each row execute function public.set_updated_at();

create trigger bills_set_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

create trigger intl_documents_set_updated_at
  before update on public.intl_documents
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.log_news_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_role public.app_role;
  target_id uuid;
  payload jsonb;
begin
  if actor is not null then
    select role into actor_role from public.profiles where id = actor;
  end if;

  if tg_op = 'DELETE' then
    target_id := old.id;
    payload := jsonb_build_object('title', old.title, 'status', old.status, 'is_demo', old.is_demo);
  else
    target_id := new.id;
    payload := jsonb_build_object('title', new.title, 'status', new.status, 'is_demo', new.is_demo);
  end if;

  insert into public.audit_log (table_name, record_id, action, actor_id, actor_role, details)
  values ('news_posts', target_id, tg_op, actor, actor_role, payload);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.log_news_change() from public;

create trigger news_posts_audit
  after insert or update or delete on public.news_posts
  for each row execute function public.log_news_change();
