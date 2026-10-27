-- Escala de Servidores: rodar UMA vez no Supabase (SQL Editor)

create table if not exists public.escala (
  id int primary key check (id = 1),
  dados jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now(),
  atualizado_por text
);

create table if not exists public.escala_editores (
  email text primary key
);

alter table public.escala enable row level security;
alter table public.escala_editores enable row level security;

-- Todos os usuários aprovados podem VER a escala
create policy "escala_ler" on public.escala for select to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.aprovado = true));

-- Somente os e-mails da tabela escala_editores podem CRIAR/ALTERAR
create policy "escala_inserir" on public.escala for insert to authenticated
  with check (exists (select 1 from public.escala_editores e where lower(e.email) = lower(auth.jwt() ->> 'email')));

create policy "escala_atualizar" on public.escala for update to authenticated
  using (exists (select 1 from public.escala_editores e where lower(e.email) = lower(auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.escala_editores e where lower(e.email) = lower(auth.jwt() ->> 'email')));

-- Cada pessoa só enxerga a própria linha em escala_editores (usado para saber se pode editar)
create policy "editores_ler_proprio" on public.escala_editores for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Quem pode editar (inclua outros e-mails separados por vírgula, no mesmo formato)
insert into public.escala_editores (email) values
  ('maury.goncalves@ibge.gov.br')
on conflict do nothing;
