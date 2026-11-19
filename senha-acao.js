// Pede a senha (guardada com hash no Supabase) antes de ações protegidas. Usa o _supabase da própria página.
(function () {
  const est = 'width:100%;padding:8px;margin:6px 0;box-sizing:border-box;font-size:15px';
  function caixa(html) {
    const d = document.createElement('dialog');
    d.style.cssText = 'border:1px solid #888;border-radius:10px;padding:18px;max-width:92vw;width:340px;background:Canvas;color:CanvasText;font:14px system-ui,sans-serif';
    d.innerHTML = html; document.body.append(d); d.addEventListener('close', () => d.remove()); d.showModal(); return d;
  }
  window.pedirSenha = msg => new Promise(resolve => {
    const d = caixa(`<form method="dialog"><b>${msg}</b><input type="password" id="sa-s" autocomplete="off" placeholder="Senha" style="${est}"><div id="sa-m" style="color:#c0392b;min-height:1.3em"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><a href="#" id="sa-t" style="font-size:13px">Alterar senha</a><span><button type="button" id="sa-c">Cancelar</button> <button type="submit" id="sa-ok">Confirmar</button></span></div></form>`);
    const $ = id => d.querySelector('#' + id); let ok = false;
    $('sa-s').focus(); $('sa-c').onclick = () => d.close();
    $('sa-t').onclick = ev => { ev.preventDefault(); d.close(); window.alterarSenha(); };
    d.addEventListener('close', () => resolve(ok));
    d.querySelector('form').onsubmit = async ev => {
      ev.preventDefault(); $('sa-ok').disabled = true; $('sa-m').textContent = 'Verificando…';
      try {
        const { data, error } = await _supabase.rpc('acao_senha_ok', { p_senha: $('sa-s').value });
        if (error) throw error;
        if (data === true) { ok = true; d.close(); return; }
        $('sa-m').textContent = 'Senha incorreta.'; $('sa-s').select();
      } catch (e) { $('sa-m').textContent = 'Não foi possível verificar a senha. O arquivo acao_senha.sql já foi executado no Supabase?'; }
      $('sa-ok').disabled = false;
    };
  });
  window.alterarSenha = () => new Promise(resolve => {
    const d = caixa(`<form><b>Alterar senha</b><input type="password" id="a1" placeholder="Senha atual" style="${est}"><input type="password" id="a2" placeholder="Nova senha (mínimo 4 caracteres)" style="${est}"><input type="password" id="a3" placeholder="Repita a nova senha" style="${est}">
      <div id="am" style="color:#c0392b;min-height:1.3em"></div><div style="text-align:right"><button type="button" id="ac">Cancelar</button> <button type="submit" id="ao">Alterar</button></div></form>`);
    const $ = id => d.querySelector('#' + id);
    $('a1').focus(); $('ac').onclick = () => d.close(); d.addEventListener('close', () => resolve());
    d.querySelector('form').onsubmit = async ev => {
      ev.preventDefault();
      if ($('a2').value !== $('a3').value) { $('am').textContent = 'As senhas novas não são iguais.'; return; }
      $('ao').disabled = true; $('am').textContent = 'Alterando…';
      const { error } = await _supabase.rpc('acao_senha_trocar', { p_atual: $('a1').value, p_nova: $('a2').value });
      if (!error) { d.close(); alert('Senha alterada.'); return; }
      $('am').textContent = /SENHA_INCORRETA/.test(error.message) ? 'Senha atual incorreta.' : /SENHA_CURTA/.test(error.message) ? 'A nova senha precisa ter pelo menos 4 caracteres.' : 'Não foi possível alterar: ' + error.message;
      $('ao').disabled = false;
    };
  });
})();
