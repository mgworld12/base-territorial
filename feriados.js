// feriados.js — dias não úteis usados na previsão.
// 2026: Portaria MGI nº 11.460/2025 (feriados nacionais e pontos facultativos federais).
// Outros anos: feriados nacionais + regra geral dos pontos facultativos (Carnaval, Corpus Christi, Dia do Servidor).
// Cada ano tem portaria própria: confira e, se precisar, acrescente datas em FACULT_ANO ou EXTRAS.
const FERIADOS = (() => {
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const soma = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  function pascoa(a) { // algoritmo de Meeus/Jones/Butcher
    const g = a % 19, c = Math.floor(a / 100), h = (c - Math.floor(c / 4) - Math.floor((8 * c + 13) / 25) + 19 * g + 15) % 30,
      i = h - Math.floor(h / 28) * (1 - Math.floor(29 / (h + 1)) * Math.floor((21 - g) / 11)),
      j = (a + Math.floor(a / 4) + i + 2 - c + Math.floor(c / 4)) % 7, l = i - j,
      m = 3 + Math.floor((l + 40) / 44);
    return new Date(a, m - 1, l + 28 - 31 * Math.floor(m / 4));
  }
  const FACULT_ANO = { // 28/10/2026 foi transferido para 30/10 (aviso do MGI); 18/02 e 31/12 são meio expediente e contam como úteis
    2026: [['02-16', 'Carnaval'], ['02-17', 'Carnaval'], ['04-20', 'Véspera de Tiradentes'], ['06-04', 'Corpus Christi'],
      ['06-05', 'Emenda de Corpus Christi'], ['10-30', 'Dia do Servidor Público (transferido de 28/10)'], ['12-24', 'Véspera de Natal']],
  };
  const EXTRAS = []; // ex.: { data: '2027-12-24', nome: 'Véspera de Natal', tipo: 'facultativo' }  (tipos: nacional, rio, facultativo)
  const cache = {};
  function doAno(a) {
    if (cache[a]) return cache[a];
    const p = pascoa(a), L = [], add = (d, nome, tipo) => L.push({ data: typeof d === 'string' ? `${a}-${d}` : iso(d), nome, tipo });
    [['01-01', 'Confraternização Universal'], ['04-21', 'Tiradentes'], ['05-01', 'Dia do Trabalho'], ['09-07', 'Independência do Brasil'],
      ['10-12', 'Nossa Senhora Aparecida'], ['11-02', 'Finados'], ['11-15', 'Proclamação da República'], ['11-20', 'Consciência Negra'],
      ['12-25', 'Natal']].forEach(([d, n]) => add(d, n, 'nacional'));
    add(soma(p, -2), 'Sexta-feira Santa', 'nacional');
    add('01-20', 'São Sebastião (cidade do Rio)', 'rio'); add('04-23', 'São Jorge (estado do RJ)', 'rio');
    if (FACULT_ANO[a]) FACULT_ANO[a].forEach(([d, n]) => add(d, n, 'facultativo'));
    else { add(soma(p, -48), 'Carnaval', 'facultativo'); add(soma(p, -47), 'Carnaval', 'facultativo'); add(soma(p, 60), 'Corpus Christi', 'facultativo'); add('10-28', 'Dia do Servidor Público', 'facultativo'); }
    EXTRAS.filter(e => e.data.startsWith(a + '-')).forEach(e => L.push(e));
    return cache[a] = L;
  }
  // op: { rio: bool, facultativos: bool } — feriados nacionais sempre contam
  const motivo = (d, op) => doAno(d.getFullYear()).find(f => f.data === iso(d) && (f.tipo === 'nacional' || (f.tipo === 'rio' && op.rio) || (f.tipo === 'facultativo' && op.facultativos))) || null;
  const diaUtil = (d, op) => d.getDay() % 6 !== 0 && !motivo(d, op);
  function somaDiasUteis(n, op, ini = new Date()) {
    const d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());
    while (n > 0) { d.setDate(d.getDate() + 1); if (diaUtil(d, op)) n--; }
    return d;
  }
  function entre(ini, fim, op) { // feriados que caem em dia de semana entre as duas datas (para mostrar na tela)
    const r = [], d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 1);
    for (; d <= fim; d.setDate(d.getDate() + 1)) { if (d.getDay() % 6 === 0) continue; const f = motivo(d, op); if (f) r.push({ d: new Date(d), ...f }); }
    return r;
  }
  return { somaDiasUteis, entre, pascoa };
})();
