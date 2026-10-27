-- Rode este script UMA vez no Supabase: SQL Editor > New query > Run
-- Guarda APMs e meta semanal de cada agência, compartilhados entre todos os navegadores/computadores

create table if not exists public.previsao_cfg (
  agencia text primary key check (agencia in ('ABT','AJA')),
  apms int not null default 0,
  meta int not null default 17,
  atualizado_em timestamptz default now(),
  atualizado_por uuid default auth.uid()
);

alter table public.previsao_cfg enable row level security;

-- Somente usuários logados e aprovados (perfis.aprovado = true) leem e gravam
create policy "previsao_cfg aprovados" on public.previsao_cfg
  for all to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.aprovado = true))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.aprovado = true));

-- Valores iniciais (os que estavam na tela)
insert into public.previsao_cfg (agencia, apms, meta) values ('ABT', 6, 10), ('AJA', 6, 10)
on conflict (agencia) do nothing;
