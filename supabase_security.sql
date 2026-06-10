-- HOD102 Supabase security setup
-- Chạy file này trong Supabase SQL Editor.
-- Lưu ý: nếu bảng/cột đã tồn tại thì lệnh sẽ bỏ qua phần trùng.

alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists blocked boolean default false;
alter table public.profiles add column if not exists last_login timestamptz;
alter table public.profiles add column if not exists email text;

alter table public.questions add column if not exists is_active boolean default true;

alter table public.edit_requests add column if not exists status text default 'pending';
alter table public.edit_requests add column if not exists admin_note text;
alter table public.edit_requests add column if not exists reviewed_at timestamptz;
alter table public.edit_requests add column if not exists reviewed_by uuid;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and coalesce(blocked,false) = false
  );
$$;

create or replace function public.is_not_blocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and coalesce(blocked,false) = false
  );
$$;

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.edit_requests enable row level security;
alter table public.question_history enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update own login" on public.profiles;
create policy "profiles update own login" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "questions read active" on public.questions;
create policy "questions read active" on public.questions
for select to authenticated
using (is_active = true or public.is_admin());

drop policy if exists "questions admin write" on public.questions;
create policy "questions admin write" on public.questions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "edit_requests insert own" on public.edit_requests;
create policy "edit_requests insert own" on public.edit_requests
for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and public.is_not_blocked());

drop policy if exists "edit_requests read own or admin" on public.edit_requests;
create policy "edit_requests read own or admin" on public.edit_requests
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "edit_requests admin update" on public.edit_requests;
create policy "edit_requests admin update" on public.edit_requests
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "question_history read admin" on public.question_history;
create policy "question_history read admin" on public.question_history
for select to authenticated
using (public.is_admin());

drop policy if exists "question_history insert admin" on public.question_history;
create policy "question_history insert admin" on public.question_history
for insert to authenticated
with check (public.is_admin());
