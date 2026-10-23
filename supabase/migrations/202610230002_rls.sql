create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'user'::public.app_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin';
$$;

create or replace function public.can_manage_news()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('editor', 'admin');
$$;

create or replace function public.can_manage_duma()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('duma', 'admin');
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('editor', 'admin');
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.can_manage_news() from public;
revoke all on function public.can_manage_duma() from public;
revoke all on function public.can_manage_content() from public;

grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_manage_news() to anon, authenticated;
grant execute on function public.can_manage_duma() to anon, authenticated;
grant execute on function public.can_manage_content() to anon, authenticated;

grant usage on schema public to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.news_posts enable row level security;
alter table public.legislation_documents enable row level security;
alter table public.code_articles enable row level security;
alter table public.bills enable row level security;
alter table public.bill_events enable row level security;
alter table public.votes enable row level security;
alter table public.duma_sessions enable row level security;
alter table public.gov_bodies enable row level security;
alter table public.intl_documents enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_select_self
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy profiles_update_admin
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update on public.profiles to authenticated;

create policy news_public_read
  on public.news_posts for select
  to anon, authenticated
  using (status = 'published');

create policy news_staff_read
  on public.news_posts for select
  to authenticated
  using (public.can_manage_news());

create policy news_staff_insert
  on public.news_posts for insert
  to authenticated
  with check (public.can_manage_news());

create policy news_staff_update
  on public.news_posts for update
  to authenticated
  using (public.can_manage_news())
  with check (public.can_manage_news());

create policy news_staff_delete
  on public.news_posts for delete
  to authenticated
  using (public.can_manage_news());

grant select on public.news_posts to anon, authenticated;
grant insert, update, delete on public.news_posts to authenticated;

create policy legislation_public_read
  on public.legislation_documents for select
  to anon, authenticated
  using (true);

create policy legislation_staff_insert
  on public.legislation_documents for insert
  to authenticated
  with check (public.can_manage_content());

create policy legislation_staff_update
  on public.legislation_documents for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy legislation_staff_delete
  on public.legislation_documents for delete
  to authenticated
  using (public.can_manage_content());

grant select on public.legislation_documents to anon, authenticated;
grant insert, update, delete on public.legislation_documents to authenticated;

create policy code_articles_public_read
  on public.code_articles for select
  to anon, authenticated
  using (true);

create policy code_articles_staff_insert
  on public.code_articles for insert
  to authenticated
  with check (public.can_manage_content());

create policy code_articles_staff_update
  on public.code_articles for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy code_articles_staff_delete
  on public.code_articles for delete
  to authenticated
  using (public.can_manage_content());

grant select on public.code_articles to anon, authenticated;
grant insert, update, delete on public.code_articles to authenticated;

create policy bills_public_read
  on public.bills for select
  to anon, authenticated
  using (true);

create policy bills_staff_insert
  on public.bills for insert
  to authenticated
  with check (public.can_manage_duma());

create policy bills_staff_update
  on public.bills for update
  to authenticated
  using (public.can_manage_duma())
  with check (public.can_manage_duma());

create policy bills_staff_delete
  on public.bills for delete
  to authenticated
  using (public.can_manage_duma());

grant select on public.bills to anon, authenticated;
grant insert, update, delete on public.bills to authenticated;

create policy bill_events_public_read
  on public.bill_events for select
  to anon, authenticated
  using (true);

create policy bill_events_staff_insert
  on public.bill_events for insert
  to authenticated
  with check (public.can_manage_duma());

create policy bill_events_staff_update
  on public.bill_events for update
  to authenticated
  using (public.can_manage_duma())
  with check (public.can_manage_duma());

create policy bill_events_staff_delete
  on public.bill_events for delete
  to authenticated
  using (public.can_manage_duma());

grant select on public.bill_events to anon, authenticated;
grant insert, update, delete on public.bill_events to authenticated;

create policy votes_public_read
  on public.votes for select
  to anon, authenticated
  using (published = true);

create policy votes_staff_read
  on public.votes for select
  to authenticated
  using (public.can_manage_duma());

create policy votes_staff_insert
  on public.votes for insert
  to authenticated
  with check (public.can_manage_duma());

create policy votes_staff_update
  on public.votes for update
  to authenticated
  using (public.can_manage_duma())
  with check (public.can_manage_duma());

create policy votes_staff_delete
  on public.votes for delete
  to authenticated
  using (public.can_manage_duma());

grant select on public.votes to anon, authenticated;
grant insert, update, delete on public.votes to authenticated;

create policy sessions_public_read
  on public.duma_sessions for select
  to anon, authenticated
  using (published = true);

create policy sessions_staff_read
  on public.duma_sessions for select
  to authenticated
  using (public.can_manage_duma());

create policy sessions_staff_insert
  on public.duma_sessions for insert
  to authenticated
  with check (public.can_manage_duma());

create policy sessions_staff_update
  on public.duma_sessions for update
  to authenticated
  using (public.can_manage_duma())
  with check (public.can_manage_duma());

create policy sessions_staff_delete
  on public.duma_sessions for delete
  to authenticated
  using (public.can_manage_duma());

grant select on public.duma_sessions to anon, authenticated;
grant insert, update, delete on public.duma_sessions to authenticated;

create policy gov_bodies_public_read
  on public.gov_bodies for select
  to anon, authenticated
  using (true);

create policy gov_bodies_admin_insert
  on public.gov_bodies for insert
  to authenticated
  with check (public.is_admin());

create policy gov_bodies_admin_update
  on public.gov_bodies for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy gov_bodies_admin_delete
  on public.gov_bodies for delete
  to authenticated
  using (public.is_admin());

grant select on public.gov_bodies to anon, authenticated;
grant insert, update, delete on public.gov_bodies to authenticated;

create policy intl_public_read
  on public.intl_documents for select
  to anon, authenticated
  using (published = true);

create policy intl_staff_read
  on public.intl_documents for select
  to authenticated
  using (public.can_manage_content());

create policy intl_staff_insert
  on public.intl_documents for insert
  to authenticated
  with check (public.can_manage_content());

create policy intl_staff_update
  on public.intl_documents for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy intl_staff_delete
  on public.intl_documents for delete
  to authenticated
  using (public.can_manage_content());

grant select on public.intl_documents to anon, authenticated;
grant insert, update, delete on public.intl_documents to authenticated;

create policy audit_log_admin_read
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

grant select on public.audit_log to authenticated;
