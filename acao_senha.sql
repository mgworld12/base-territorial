-- Senha para desfazer "Concluído" (setoresAJA.html) e usar "Selecionar Setor" (mapaAJA.html)
-- Rode UMA vez no SQL Editor do Supabase (rdxklpkukmuwwetftqde).
-- >>> Troque SENHA_INICIAL por Base2026 SÓ no editor do Supabase. NÃO grave a senha real neste arquivo se ele for para o GitHub (o repositório é público). <<<
-- Depois, a senha pode ser alterada nas próprias páginas (botão "Alterar senha").

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.acao_config (
  id int primary key check (id = 1),
  senha_hash text not null
);
alter table public.acao_config enable row level security;
revoke all on public.acao_config from anon, authenticated;

insert into public.acao_config (id, senha_hash)
values (1, extensions.crypt('SENHA_INICIAL', extensions.gen_salt('bf')))   -- <<< TROQUE AQUI
on conflict (id) do nothing;

create or replace function public.acao_senha_ok(p_senha text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  if not exists (select 1 from public.perfis p where p.id = auth.uid() and p.aprovado is true) then
    raise exception 'NAO_AUTORIZADO';
  end if;
  select senha_hash into h from public.acao_config where id = 1;
  if h is not null and crypt(coalesce(p_senha,''), h) = h then return true; end if;
  perform pg_sleep(1);  -- atrasa tentativas erradas
  return false;
end $$;

create or replace function public.acao_senha_trocar(p_atual text, p_nova text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.acao_senha_ok(p_atual) then raise exception 'SENHA_INCORRETA'; end if;
  if length(coalesce(p_nova,'')) < 4 then raise exception 'SENHA_CURTA'; end if;
  update public.acao_config set senha_hash = crypt(p_nova, gen_salt('bf')) where id = 1;
  return true;
end $$;

revoke all on function public.acao_senha_ok(text) from public, anon;
revoke all on function public.acao_senha_trocar(text, text) from public, anon;
grant execute on function public.acao_senha_ok(text) to authenticated;
grant execute on function public.acao_senha_trocar(text, text) to authenticated;
