// comum.js — o que todas as páginas compartilham: cliente do Supabase e conferência de acesso.
// Carregue depois do supabase-js e do config.js.
if (/COLE_AQUI/.test(CFG.SUPABASE_URL + CFG.SUPABASE_ANON_KEY)) {
  document.documentElement.style.visibility = 'visible';
  alert('Falta configurar o Supabase: abra o arquivo config.js e cole a URL e a chave do projeto.');
}
const _supabase = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

// true = conta aprovada, false = não aprovada, null = não foi possível verificar
async function contaAprovada(userId) {
  const { data, error } = await _supabase.from('perfis').select('aprovado').eq('id', userId).maybeSingle();
  if (error) return null;
  return data ? data.aprovado === true : false;
}

// Páginas internas: só abre para quem está logado e aprovado; senão volta ao index.html.
async function exigirAcesso() {
  const volta = () => { location.replace('index.html'); return false; };
  try {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return volta();
    if ((await contaAprovada(session.user.id)) !== true) { await _supabase.auth.signOut(); return volta(); }
  } catch (e) { return volta(); }
  const g = document.getElementById('guarda-css'); if (g) g.remove();
  document.documentElement.style.visibility = 'visible';
  return true;
}
