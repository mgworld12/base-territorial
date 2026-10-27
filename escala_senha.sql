-- Senha de edição do escala.html (BASE TERRITORIAL)
-- Rode UMA vez no SQL Editor do projeto Supabase usado pelo escala.html (rdxklpkukmuwwetftqde).
-- >>> Troque SENHA_INICIAL (linha marcada) pela senha que você quer. <<<
-- Depois, ela pode ser alterada na própria página (botão direito > Alterar senha).

create extension if not exists pgcrypto with schema extensions;

-- 1) Onde a senha fica guardada (só o "hash"; ninguém consegue ler pela internet)
create table if not exists public.escala_config (
  id int primary key check (id = 1),
  senha_hash text not null
);
alter table public.escala_config enable row level security;
revoke all on public.escala_config from anon, authenticated;

insert into public.escala_config (id, senha_hash)
values (1, extensions.crypt('SENHA_INICIAL', extensions.gen_salt('bf')))   -- <<< TROQUE AQUI
on conflict (id) do nothing;

-- 2) A tabela escala passa a só aceitar gravação pelas funções abaixo (que exigem a senha)
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'escala'
             and cmd in ('INSERT','UPDATE','DELETE','ALL')
  loop
    execute format('drop policy %I on public.escala', r.policyname);
  end loop;
end $$;

revoke insert, update, delete on public.escala from anon, authenticated;
grant select on public.escala to authenticated;

drop policy if exists escala_leitura_aprovados on public.escala;
create policy escala_leitura_aprovados on public.escala
  for select to authenticated
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.aprovado is true));

-- 3) Funções
create or replace function public.escala_usuario_ok()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p where p.id = auth.uid() and p.aprovado is true);
$$;

create or replace function public.escala_senha_ok(p_senha text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  if not public.escala_usuario_ok() then raise exception 'NAO_AUTORIZADO'; end if;
  select senha_hash into h from public.escala_config where id = 1;
  if h is not null and crypt(coalesce(p_senha,''), h) = h then return true; end if;
  perform pg_sleep(1);  -- atrasa tentativas erradas
  return false;
end $$;

create or replace function public.escala_trocar_senha(p_atual text, p_nova text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.escala_senha_ok(p_atual) then raise exception 'SENHA_INCORRETA'; end if;
  if length(coalesce(p_nova,'')) < 4 then raise exception 'SENHA_CURTA'; end if;
  update public.escala_config set senha_hash = crypt(p_nova, gen_salt('bf')) where id = 1;
  return true;
end $$;

create or replace function public.escala_gravar(p_senha text, p_dados jsonb, p_versao timestamptz)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n int;
  v_now timestamptz := clock_timestamp();
  v_user text := coalesce(auth.jwt() ->> 'email', '');
begin
  if not public.escala_senha_ok(p_senha) then raise exception 'SENHA_INCORRETA'; end if;
  if p_versao is null then
    insert into public.escala (id, dados, atualizado_em, atualizado_por)
    select 1, p_dados, v_now, v_user
    where not exists (select 1 from public.escala where id = 1);
  else
    update public.escala
       set dados = p_dados, atualizado_em = v_now, atualizado_por = v_user
     where id = 1 and atualizado_em = p_versao;
  end if;
  get diagnostics n = row_count;
  if n = 0 then return null; end if;   -- outra pessoa alterou antes
  return jsonb_build_object('atualizado_em', v_now, 'atualizado_por', v_user);
end $$;

revoke all on function public.escala_usuario_ok() from public, anon;
revoke all on function public.escala_senha_ok(text) from public, anon;
revoke all on function public.escala_trocar_senha(text, text) from public, anon;
revoke all on function public.escala_gravar(text, jsonb, timestamptz) from public, anon;
grant execute on function public.escala_senha_ok(text) to authenticated;
grant execute on function public.escala_trocar_senha(text, text) to authenticated;
grant execute on function public.escala_gravar(text, jsonb, timestamptz) to authenticated;
