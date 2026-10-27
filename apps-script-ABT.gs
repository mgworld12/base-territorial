// Google Apps Script — grava no Google Sheets o que for alterado no site.
// Planilha > Extensões > Apps Script > cole > Implantar > Nova implantação (ou "Gerenciar implantações" > editar > Nova versão).
// App da Web | Executar como: Eu | Quem tem acesso: Qualquer pessoa. Copie a URL /exec para SCRIPT_URL no setores.html.
const GID = 1741145519;
const HEADERS = ["Status","Setor","EUV","EDOC","Tipo","Bairro","Prioridade CNEFE / PNAD","Endereço","Telefone","WhatsApp","E-mail","Observações","APM","Área de Risco"];
const KEYS    = ["ok","setor","euv","edoc","tipo","bairro","pri","end","tel","w1","email","obs","apm","risco"];
const ALT     = { w1: "tem whatsapp?" }; // título antigo: é renomeado para "WhatsApp"

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const m = JSON.parse(e.postData.contents);
    const sh = SpreadsheetApp.getActive().getSheets().filter(s => s.getSheetId() === GID)[0];
    const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim().toLowerCase());
    // coluna pelo título; cria no fim se não existir (ex.: APM, Observações, Área de Risco)
    const col = k => {
      const h = HEADERS[KEYS.indexOf(k)];
      let c = head.indexOf(h.toLowerCase()) + 1;
      if (!c && ALT[k]) { c = head.indexOf(ALT[k]) + 1; if (c) { sh.getRange(1, c).setValue(h); head[c - 1] = h.toLowerCase(); } }
      if (!c) { c = head.length + 1; sh.getRange(1, c).setValue(h); head.push(h.toLowerCase()); }
      return c;
    };
    const cs = col("setor");
    const find = s => {
      const n = sh.getLastRow() - 1;
      if (n < 1) return 0;
      const v = sh.getRange(2, cs, n, 1).getDisplayValues().flat();
      const i = v.findIndex(x => String(x).trim() === String(s).trim());
      return i < 0 ? 0 : i + 2;
    };
    const val = (k, v) => (k === "ok" || k === "risco") ? (v === true || v === "true") : v;

    if (m.op === "set") {
      const r = find(m.ant || m.setor);
      if (!r) throw new Error("setor não encontrado");
      const c = col(m.k);
      const cell = sh.getRange(r, c);
      if (["tel","tel2"].includes(m.k)) cell.setNumberFormat("@");
      cell.setValue(val(m.k, m.v));
    } else if (m.op === "add") {
      if (!find(m.setor)) {
        const r = sh.getLastRow() + 1;
        KEYS.forEach(k => { const c = col(k); const cell = sh.getRange(r, c); if (["tel","tel2"].includes(k)) cell.setNumberFormat("@"); cell.setValue(val(k, m.row[k])); });
      }
    } else if (m.op === "del") {
      const r = find(m.setor);
      if (r) sh.deleteRow(r);
    }
    SpreadsheetApp.flush();
    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("erro: " + err.message);
  } finally {
    lock.releaseLock();
  }
}
