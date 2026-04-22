-- =============================================
-- RechtsKompas Advies - Supabase Schema
-- Plak dit in Supabase → SQL Editor → Run
-- =============================================

-- Gebruikersprofielen (uitbreiding op auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  voornaam text,
  achternaam text,
  telefoon text,
  stad text,
  created_at timestamptz default now()
);

-- Dossiers
create table public.dossiers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade,
  rechtsgebied text not null,
  onderwerp text not null,
  rol text not null,
  situatie text not null,
  naam text,
  stad text,
  analyse jsonb,
  complexiteit int,
  status text default 'actief',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Betalingen
create table public.betalingen (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles,
  dossier_id uuid references public.dossiers,
  type text not null, -- 'email' | 'tegenreactie' | 'jurist'
  bedrag numeric not null,
  stripe_payment_id text,
  status text default 'geslaagd',
  created_at timestamptz default now()
);

-- Jurist contacten (uitgaande contacten)
create table public.jurist_contacten (
  id uuid default gen_random_uuid() primary key,
  dossier_id uuid references public.dossiers,
  user_id uuid references public.profiles,
  kantoor_naam text,
  kantoor_email text,
  kantoor_telefoon text,
  kantoor_adres text,
  intro_brief text,
  status text default 'verzonden', -- verzonden | bevestigd | intake_gepland
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.dossiers enable row level security;
alter table public.betalingen enable row level security;
alter table public.jurist_contacten enable row level security;

-- Policies: gebruiker ziet alleen eigen data
create policy "Eigen profiel" on public.profiles for all using (auth.uid() = id);
create policy "Eigen dossiers" on public.dossiers for all using (auth.uid() = user_id);
create policy "Eigen betalingen" on public.betalingen for all using (auth.uid() = user_id);
create policy "Eigen contacten" on public.jurist_contacten for all using (auth.uid() = user_id);

-- Auto-profiel aanmaken bij registratie
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
