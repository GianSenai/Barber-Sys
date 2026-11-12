create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- O primeiro usuário cadastrado vira administrador (dono da barbearia)
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
  for each row execute function public.handle_new_user_role();

create table public.barber_schedules (
  barber_id text primary key,
  schedule jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.barber_schedules to anon, authenticated;
grant insert, update, delete on public.barber_schedules to authenticated;
grant all on public.barber_schedules to service_role;
alter table public.barber_schedules enable row level security;
create policy "Anyone reads schedules" on public.barber_schedules for select to anon, authenticated using (true);
create policy "Admins insert schedules" on public.barber_schedules for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update schedules" on public.barber_schedules for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete schedules" on public.barber_schedules for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.absences (
  id uuid primary key default gen_random_uuid(),
  barber_id text,
  date_from date not null,
  date_to date not null,
  start_time text,
  end_time text,
  reason text not null default 'Folga',
  created_at timestamptz not null default now()
);
grant select on public.absences to anon, authenticated;
grant insert, update, delete on public.absences to authenticated;
grant all on public.absences to service_role;
alter table public.absences enable row level security;
create policy "Anyone reads absences" on public.absences for select to anon, authenticated using (true);
create policy "Admins insert absences" on public.absences for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update absences" on public.absences for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete absences" on public.absences for delete to authenticated using (public.has_role(auth.uid(), 'admin'));