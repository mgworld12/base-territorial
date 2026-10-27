-- Rode este script UMA vez no Supabase: SQL Editor > New query > Run

create table if not exists public.setor_info (
  mapa text not null check (mapa in ('ABT','AJA')),
  setor text not null,
  ano int,
  trimestre int,
  mes int,
  semana int,
  ano_entrada int,
  trimestre_entrada int,
  ano_saida int,
  trimestre_saida int,
  atualizado_em timestamptz default now(),
  atualizado_por uuid default auth.uid(),
  primary key (mapa, setor)
);

alter table public.setor_info enable row level security;

-- Somente usuários logados e aprovados (perfis.aprovado = true) leem e gravam
create policy "setor_info aprovados" on public.setor_info
  for all to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.aprovado = true))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.aprovado = true));
