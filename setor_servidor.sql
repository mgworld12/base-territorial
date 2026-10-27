-- Marcações de servidor por setor (mapaAJA.html), compartilhadas entre todos os usuários.
-- Rode uma vez no Supabase: SQL Editor > New query > colar > Run.

create table if not exists public.setor_servidor (
  mapa          text        not null,           -- 'AJA'
  setor         text        not null,           -- código do setor (15 dígitos)
  servidor      text        not null default '',
  atualizado_em timestamptz not null default now(),
  primary key (mapa, setor)
);

alter table public.setor_servidor enable row level security;

drop policy if exists "setor_servidor_select" on public.setor_servidor;
drop policy if exists "setor_servidor_insert" on public.setor_servidor;
drop policy if exists "setor_servidor_update" on public.setor_servidor;
drop policy if exists "setor_servidor_delete" on public.setor_servidor;

create policy "setor_servidor_select" on public.setor_servidor for select to authenticated using (true);
create policy "setor_servidor_insert" on public.setor_servidor for insert to authenticated with check (true);
create policy "setor_servidor_update" on public.setor_servidor for update to authenticated using (true) with check (true);
create policy "setor_servidor_delete" on public.setor_servidor for delete to authenticated using (true);
