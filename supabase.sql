-- Deltessa Data schema. Run once: Supabase dashboard > SQL Editor > New query > paste > Run.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null, sector text, contact_person text, email text, phone text, address text,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null, description text,
  service_type text default 'Data Analysis',
  status text not null default 'In Progress' check (status in ('In Progress','Pending Review','Completed')),
  signon_date date default current_date, due_date date, completion_date date,
  charge numeric(12,2) not null default 0 check (charge >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.client_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  log_date date default current_date, log_type text default 'Note', note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, subject text not null, message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists jobs_client_idx on public.jobs(client_id);
create index if not exists logs_client_idx on public.client_logs(client_id);

-- Row Level Security: nothing is readable without logging in, except that visitors may INSERT a contact message.
alter table public.clients     enable row level security;
alter table public.jobs        enable row level security;
alter table public.client_logs enable row level security;
alter table public.messages    enable row level security;

create policy "admin full access" on public.clients     for all to authenticated using (true) with check (true);
create policy "admin full access" on public.jobs        for all to authenticated using (true) with check (true);
create policy "admin full access" on public.client_logs for all to authenticated using (true) with check (true);
create policy "admin full access" on public.messages    for all to authenticated using (true) with check (true);

create policy "visitors can send a message" on public.messages for insert to anon
  with check (is_read = false and char_length(name) between 1 and 120 and char_length(email) between 3 and 200
              and char_length(subject) between 1 and 200 and char_length(message) between 1 and 5000);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant insert on public.messages to anon;
