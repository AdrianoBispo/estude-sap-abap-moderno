
/* ============================================================
   Laboratórios interativos
   ============================================================ */
const head = (t, s, ic) => `<div class="card-h">${ICON(ic)}<div><h3>${esc(t)}</h3>${s ? `<p>${esc(s)}</p>` : ''}</div></div>`;
const vis = s => esc(s).replace(/ /g, '<i>·</i>');
const tag = (cls, txt, ic) => `<span class="tag ${cls}">${ic ? ICON(ic) : ''}${esc(txt)}</span>`;
const strip = (cls, ic, html) => `<div class="strip ${cls}">${ICON(ic)}<p>${html}</p></div>`;
const seg = (id, opts, val) => `<div class="seg" id="${id}">${opts.map(o => `<button aria-pressed="${o[0] === val}" data-v="${esc(o[0])}">${esc(o[1])}</button>`).join('')}</div>`;
function segBind(el, id, cb){ $$(`#${id} button`, el).forEach(b => b.addEventListener('click', () => { $$(`#${id} button`, el).forEach(x => x.setAttribute('aria-pressed', x === b)); cb(b.dataset.v); })); }
const fmtNum = (n, d = 0) => Number(n).toLocaleString('pt-BR', {minimumFractionDigits: d, maximumFractionDigits: d});

/* Números no estilo ABAP: parse e arredondamento comercial exato (string decimal) */
function parseAbapNum(s){
  const t = String(s).trim();
  if (t === '') return {ok: true, sign: 1, int: '0', frac: ''};
  const m = t.match(/^([+-]?)(\d*)(?:\.(\d*))?([+-]?)$/);
  if (!m || (m[1] && m[4]) || (m[2] === '' && !(m[3] || ''))) return {ok: false};
  return {ok: true, sign: (m[1] === '-' || m[4] === '-') ? -1 : 1, int: (m[2] || '0').replace(/^0+(?=\d)/, ''), frac: m[3] || ''};
}
function roundDec(p, d){ // retorna {sign, digits (BigInt escalado por 10^d)}
  const frac = (p.frac + '0'.repeat(d + 1)).slice(0, d + 1);
  let v = BigInt(p.int + frac.slice(0, d) || '0');
  const rest = (p.frac + '0'.repeat(d + 1)).slice(d);
  if (rest.length && rest[0] >= '5') v += 1n;
  return {sign: v === 0n ? 1 : p.sign, v};
}
function decStr(r, d){ let s = r.v.toString().padStart(d + 1, '0'); s = d ? s.slice(0, -d) + '.' + s.slice(-d) : s; return (r.sign < 0 ? '-' : '') + s; }
function divRound(a, b, d){ // a/b com d decimais, arredondamento comercial (inteiros)
  const sign = Math.sign(a) * Math.sign(b) || 1; let n = BigInt(Math.abs(a)) * 10n ** BigInt(d); const den = BigInt(Math.abs(b));
  let q = n / den; const rem = n - q * den; if (2n * rem >= den) q += 1n;
  return decStr({sign: q === 0n ? 1 : sign, v: q}, d);
}

/* Dados de exemplo inspirados no modelo /DMO/ */
const CONN = [
  ['AA','0017','JFK','SFO','11:00:00',4139],['AA','0064','SFO','JFK','09:00:00',4139],
  ['AZ','0555','FCO','FRA','19:00:00',966],['AZ','0788','FCO','NRT','12:00:00',9859],
  ['JL','0407','NRT','FRA','13:30:00',9364],['JL','0408','FRA','NRT','20:25:00',9364],
  ['LH','0400','FRA','JFK','10:10:00',6162],['LH','0401','JFK','FRA','18:30:00',6162],['LH','0402','FRA','EWR','13:30:00',6217],
  ['SQ','0001','SIN','SFO','17:00:00',13597],['SQ','0002','SFO','SIN','21:55:00',13597],
  ['UA','0941','FRA','SFO','14:30:00',9126],['UA','3504','SFO','FRA','15:00:00',9126]
].map(r => ({carrier_id:r[0], connection_id:r[1], airport_from_id:r[2], airport_to_id:r[3], departure_time:r[4], distance:r[5]}));
const CARR = {AA:'American Airlines', AZ:'Alitalia', JL:'Japan Airlines', LH:'Lufthansa', SQ:'Singapore Airlines', UA:'United Airlines'};
const FLIGHTS = [
  ['AA','0017','20261105',422.94,385,371],['AA','0017','20261119',422.94,385,290],['AA','0064','20261106',438.20,385,342],
  ['AZ','0555','20261108',185.00,140,140],['AZ','0555','20261122',185.00,140,98],
  ['JL','0407','20261110',1120.00,380,362],['JL','0408','20261112',1120.00,380,301],
  ['LH','0400','20261103',879.82,330,330],['LH','0400','20261117',879.82,330,287],['LH','0401','20261104',902.10,330,312],['LH','0402','20261115',845.00,330,154],
  ['SQ','0001','20261109',1490.00,471,455],['SQ','0002','20261111',1490.00,471,398],
  ['UA','0941','20261107',870.00,300,276],['UA','0941','20261121',870.00,300,244],['UA','3504','20261114',899.00,300,300]
].map(r => ({carrier_id:r[0], connection_id:r[1], flight_date:r[2], price:r[3], seats_max:r[4], seats_occupied:r[5]}));
const fdate = d => `${d.slice(6)}.${d.slice(4, 6)}.${d.slice(0, 4)}`;
function table(cols, rows, fmt = {}){
  if (!rows.length) return `<div class="empty">Nenhuma linha.</div>`;
  return `<div class="tbl-wrap"><table class="t"><thead><tr>${cols.map(c => `<th class="${fmt[c] === 'num' ? 'num' : ''}">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${fmt[c] === 'num' ? 'num' : 'mono'}">${r[c] == null ? '<span class="note">null</span>' : esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const WIDGETS = {

/* ---------- Hello World ---------- */
hello(el){
  let lastActive = 'Hello World', active = true, timer;
  el.innerHTML = head('Console do ADT', 'Simulação da execução com F9', '') + `<div class="wid">
    <div class="row">
      <div class="field" style="flex:3 1 14rem"><label for="hw-txt">Texto passado para out->write( )</label><input id="hw-txt" class="in" value="Hello World"></div>
      <div class="field" style="flex:0 1 auto"><span class="lbl">Estado da classe</span>${seg('hw-act', [['1', 'Ativada'], ['0', 'Alterada, não ativada']], '1')}</div>
      <button class="btn emph" id="hw-run">${ICON('')}Executar (F9)</button>
    </div>
    <div id="hw-code"></div>
    <div class="console" id="hw-out" aria-live="polite"><span class="p">Console vazio. Clique em Executar.</span></div></div>`;
  const inp = $('#hw-txt', el);
  const code = () => { $('#hw-code', el).innerHTML = codeBlock('out->write( `' + inp.value.replace(/`/g, '``') + '` ).', 'Linha 11 · ZCL_HELLO_WORLD'); };
  inp.addEventListener('input', code); code();
  segBind(el, 'hw-act', v => active = v === '1');
  $('#hw-run', el).addEventListener('click', () => {
    if (active) lastActive = inp.value;
    const out = $('#hw-out', el); clearInterval(timer);
    const pre = active ? '' : '⚠ ZCL_HELLO_WORLD tem alterações não ativadas. O ADT executou a última versão ativa (Ctrl+F3 ativa).\n';
    const txt = lastActive;
    out.innerHTML = `<span class="p">ZCL_HELLO_WORLD › if_oo_adt_classrun~main</span>\n${pre ? `<span style="color:var(--sapCriticalColor)">${esc(pre)}</span>` : ''}`;
    const span = document.createElement('span'); out.appendChild(span);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches){ span.textContent = txt; return; }
    let i = 0; timer = setInterval(() => { span.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(timer); }, 28);
  });
},

/* ---------- Divisão: / DIV MOD ---------- */
divcalc(el){
  el.innerHTML = head('Calculadora de divisão ABAP', 'Mesmos operandos, quatro resultados diferentes', '') + `<div class="wid">
    <div class="row"><div class="field"><label for="dc-a">Dividendo (a)</label><input id="dc-a" class="in mono" type="number" value="7" step="1"></div>
    <div class="field"><label for="dc-b">Divisor (b)</label><input id="dc-b" class="in mono" type="number" value="2" step="1"></div>
    <div class="chips" style="align-self:center">${[[7,2],[-7,2],[7,-2],[10,4],[1,3],[5,0],[0,0]].map(p => `<button class="chip" data-p="${p}">${p[0]} , ${p[1]}</button>`).join('')}</div></div>
    <div id="dc-res"></div></div>`;
  const draw = () => {
    const a = parseInt($('#dc-a', el).value || '0', 10), b = parseInt($('#dc-b', el).value || '0', 10);
    let rows;
    if (b === 0 && a !== 0){
      $('#dc-res', el).innerHTML = strip('err', '', `<b>CX_SY_ZERODIVIDE</b> em todas as quatro operações: divisão por zero com dividendo diferente de zero.`); return;
    }
    if (b === 0){ rows = [['0', '0.00', '0', '0']]; }
    const mod = b === 0 ? 0 : ((a % Math.abs(b)) + Math.abs(b)) % Math.abs(b);
    const div = b === 0 ? 0 : (a - mod) / b;
    const r = b === 0 ? ['0', '0.00', '0', '0'] : [divRound(a, b, 0), divRound(a, b, 2), String(div), String(mod)];
    const lines = [
      ['result_i = a / b.', 'result_i TYPE i', r[0], 'Divide e arredonda comercialmente para inteiro.'],
      ['result_p = a / b.', 'result_p TYPE p DECIMALS 2', r[1], 'O destino do tipo p muda o tipo de cálculo.'],
      ['result_i = a DIV b.', 'TYPE i', r[2], 'Parte inteira, escolhida para que o resto seja ≥ 0.'],
      ['result_i = a MOD b.', 'TYPE i', r[3], 'Resto, sempre entre 0 e |b| − 1.']
    ];
    $('#dc-res', el).innerHTML = `<div class="tbl-wrap"><table class="t"><thead><tr><th>Instrução</th><th>Destino</th><th class="num">Resultado</th><th>Por quê</th></tr></thead><tbody>${lines.map(l => `<tr><td class="mono">${hl(l[0].replace(/\ba\b/, a).replace(/\bb\b/, b))}</td><td class="mono">${esc(l[1])}</td><td class="num mono"><b>${esc(l[2])}</b></td><td>${esc(l[3])}</td></tr>`).join('')}</tbody></table></div>
      ${b !== 0 ? `<p class="note">Verificação: ${a} = (${div}) × (${b}) + ${mod}. ${a === 0 && b === 0 ? '' : ''}</p>` : `<p class="note">Caso especial: 0 dividido por 0 resulta 0 em ABAP, sem exceção.</p>`}`;
  };
  ['#dc-a', '#dc-b'].forEach(s => $(s, el).addEventListener('input', draw));
  $$('.chip', el).forEach(c => c.addEventListener('click', () => { const [a, b] = c.dataset.p.split(','); $('#dc-a', el).value = a; $('#dc-b', el).value = b; draw(); }));
  draw();
},

/* ---------- Objetos e referências ---------- */
objlab(el){
  const S = {vars: {connection1: null, connection2: null, connection3: null}, objs: [], counter: 0, seq: 0, log: []};
  const vars = Object.keys(S.vars);
  const opt = sel => vars.map(v => `<option ${v === sel ? 'selected' : ''}>${v}</option>`).join('');
  el.innerHTML = head('Laboratório de objetos', 'Pilha de variáveis à esquerda, objetos na memória (heap) à direita', '') + `<div class="wid">
    <div class="row">
      <div class="field"><label for="ob-var">Variável</label><select id="ob-var" class="in">${opt('connection1')}</select></div>
      <div class="field"><label for="ob-car">i_carrier_id</label><input id="ob-car" class="in mono" value="LH" maxlength="3"></div>
      <div class="field"><label for="ob-con">i_connection_id</label><input id="ob-con" class="in mono" value="0400" maxlength="4"></div>
      <button class="btn emph" id="ob-new">${ICON('')}NEW</button>
      <button class="btn" id="ob-clr">${ICON('')}CLEAR</button>
    </div>
    <div class="row">
      <div class="field"><label for="ob-dst">Destino</label><select id="ob-dst" class="in">${opt('connection2')}</select></div>
      <span style="align-self:center;font-family:var(--mono)">=</span>
      <div class="field"><label for="ob-src">Origem</label><select id="ob-src" class="in">${opt('connection1')}</select></div>
      <button class="btn" id="ob-cp">${ICON('')}Copiar referência</button>
    </div>
    <div class="heap">
      <div class="mem"><b>Variáveis · REF TO lcl_connection</b><div id="ob-vars" style="display:flex;flex-direction:column;gap:.375rem"></div>
        <div class="refv" style="background:var(--sapAccentBg1);color:var(--sapAccent1)"><span>lcl_connection=>conn_counter</span><b id="ob-cnt">0</b></div></div>
      <div class="mem"><b>Heap</b><div class="objs" id="ob-objs"></div></div>
    </div>
    <div><span class="lbl">Instruções executadas</span><div class="log" id="ob-log"></div></div></div>`;
  function gc(){ S.objs = S.objs.filter(o => !o.gone); S.objs.forEach(o => { if (!vars.some(v => S.vars[v] === o.id)) o.gone = true; }); }
  function draw(){
    $('#ob-vars', el).innerHTML = vars.map(v => `<div class="refv"><span>${v}</span><span>${S.vars[v] ? `<b style="color:var(--sapSelectedColor)">→ objeto #${S.vars[v]}</b>` : '<span class="note">INITIAL</span>'}</span></div>`).join('');
    $('#ob-cnt', el).textContent = S.counter;
    $('#ob-objs', el).innerHTML = S.objs.length ? S.objs.map(o => { const refs = vars.filter(v => S.vars[v] === o.id); return `<div class="inst ${o.gone ? 'gone' : ''}"><b>#${o.id} lcl_connection</b><span>carrier_id = '${esc(o.c)}'</span><span>connection_id = '${esc(o.n)}'</span><span class="note" style="font-family:var(--font)">${o.gone ? 'Sem referência: recolhido pelo garbage collector' : refs.length + (refs.length === 1 ? ' referência' : ' referências')}</span></div>`; }).join('') : '<div class="note">Nenhum objeto. Use NEW para criar.</div>';
    $('#ob-log', el).innerHTML = S.log.slice(-6).reverse().map(l => `<div>${l}</div>`).join('') || '<div>Nada executado ainda.</div>';
  }
  $('#ob-new', el).addEventListener('click', () => {
    gc();
    const v = $('#ob-var', el).value, c = $('#ob-car', el).value.trim().toUpperCase(), n = $('#ob-con', el).value.trim();
    const stmt = hl(`${v} = NEW #( i_carrier_id = '${c}' i_connection_id = '${n}' ).`);
    if (!c || !n){ S.log.push(stmt + `<br><span style="color:var(--sapNegativeColor)">→ RAISE EXCEPTION cx_abap_invalid_value: nenhum objeto criado, ${v} mantém o valor anterior</span>`); draw(); return; }
    const id = ++S.seq; S.objs.push({id, c, n}); S.vars[v] = id; S.counter++;
    S.log.push(stmt); gc(); draw();
  });
  $('#ob-clr', el).addEventListener('click', () => { gc(); const v = $('#ob-var', el).value; S.vars[v] = null; S.log.push(hl(`CLEAR ${v}.`)); gc(); draw(); });
  $('#ob-cp', el).addEventListener('click', () => { gc(); const d = $('#ob-dst', el).value, s = $('#ob-src', el).value; S.vars[d] = S.vars[s]; S.log.push(hl(`${d} = ${s}.`) + ' <span class="note">(copia a referência, não o objeto)</span>'); gc(); draw(); });
  draw();
},

/* ---------- Construtor de SELECT ---------- */
sqlbuilder(el){
  const F = ['carrier_id', 'connection_id', 'airport_from_id', 'airport_to_id', 'departure_time', 'distance'];
  const S = {fields: new Set(['carrier_id', 'connection_id', 'airport_from_id', 'airport_to_id']), carrier: 'LH', minDist: 0, order: '', upto: 0, single: false};
  el.innerHTML = head('SELECT em /DMO/CONNECTION', '13 conexões de exemplo', '') + `<div class="wid">
    <div class="row">${seg('sq-mode', [['t', 'INTO TABLE'], ['s', 'SELECT SINGLE']], 't')}</div>
    <div><span class="lbl">FIELDS</span><div class="row" style="gap:.5rem 1rem">${F.map(f => `<label class="check"><input type="checkbox" value="${f}" ${S.fields.has(f) ? 'checked' : ''}><span class="mono" style="font-family:var(--mono);font-size:.8125rem">${f}</span></label>`).join('')}</div></div>
    <div class="row">
      <div class="field"><label for="sq-car">WHERE carrier_id =</label><select id="sq-car" class="in"><option value="">(sem filtro)</option>${Object.keys(CARR).map(c => `<option ${c === 'LH' ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="sq-dist">AND distance &gt; <b id="sq-dv">0</b></label><input id="sq-dist" type="range" min="0" max="12000" step="500" value="0"></div>
      <div class="field" data-tbl><label for="sq-ord">ORDER BY</label><select id="sq-ord" class="in"><option value="">(nenhum)</option><option value="connection_id">connection_id</option><option value="distance DESCENDING">distance DESCENDING</option><option value="airport_from_id">airport_from_id</option></select></div>
      <div class="field" data-tbl><label for="sq-up">UP TO n ROWS</label><input id="sq-up" class="in mono" type="number" min="0" max="20" value="0"></div>
    </div>
    <div id="sq-code"></div><div id="sq-res"></div></div>`;
  function draw(){
    const fields = F.filter(f => S.fields.has(f));
    $$('[data-tbl]', el).forEach(x => x.style.opacity = S.single ? .4 : 1);
    $$('[data-tbl] .in', el).forEach(x => x.disabled = S.single);
    const where = [];
    if (S.carrier) where.push(`carrier_id = '${S.carrier}'`);
    if (S.minDist) where.push(`distance > ${S.minDist}`);
    let c = `SELECT${S.single ? ' SINGLE' : ''} FROM /dmo/connection\n  FIELDS ${fields.join(', ') || '…'}`;
    if (where.length) c += `\n  WHERE ${where.join('\n    AND ')}`;
    if (!S.single && S.order) c += `\n  ORDER BY ${S.order}`;
    c += S.single ? `\n  INTO @DATA(connection).` : `\n  INTO TABLE @DATA(connections)` + (S.upto ? `\n  UP TO ${S.upto} ROWS.` : '.');
    $('#sq-code', el).innerHTML = codeBlock(c, 'ABAP SQL gerado');
    if (!fields.length){ $('#sq-res', el).innerHTML = strip('err', '', 'Erro de sintaxe: <code>FIELDS</code> precisa de pelo menos um campo (ou <code>*</code>).'); return; }
    let rows = CONN.filter(r => (!S.carrier || r.carrier_id === S.carrier) && r.distance > S.minDist);
    if (!S.single && S.order){ const [k, dir] = S.order.split(' '); rows = [...rows].sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (dir ? -1 : 1)); }
    if (S.single) rows = rows.slice(0, 1); else if (S.upto) rows = rows.slice(0, S.upto);
    const out = rows.map(r => Object.fromEntries(fields.map(f => [f, r[f]])));
    const subrc = rows.length ? 0 : 4;
    let notes = '';
    if (S.single) notes += strip('warn', '', 'O WHERE não informa a chave completa (<code>carrier_id</code> e <code>connection_id</code>). <code>SELECT SINGLE</code> devolve uma linha qualquer que atenda, e o ATC sinaliza isso.');
    if (!S.single && !S.order && rows.length > 1) notes += strip('', '', 'Sem <code>ORDER BY</code>, a ordem das linhas não é garantida pelo banco. Aqui elas aparecem na ordem da chave primária.');
    $('#sq-res', el).innerHTML = `<div class="statusline">${tag(subrc ? 'warn' : 'ok', 'sy-subrc = ' + subrc)}${tag('info', 'sy-dbcnt = ' + rows.length)}</div>${table(fields, out, {distance: 'num'})}${notes}`;
  }
  segBind(el, 'sq-mode', v => { S.single = v === 's'; draw(); });
  $$('input[type=checkbox]', el).forEach(c => c.addEventListener('change', () => { c.checked ? S.fields.add(c.value) : S.fields.delete(c.value); draw(); }));
  $('#sq-car', el).addEventListener('change', e => { S.carrier = e.target.value; draw(); });
  $('#sq-dist', el).addEventListener('input', e => { S.minDist = +e.target.value; $('#sq-dv', el).textContent = S.minDist; draw(); });
  $('#sq-ord', el).addEventListener('change', e => { S.order = e.target.value; draw(); });
  $('#sq-up', el).addEventListener('input', e => { S.upto = Math.max(0, parseInt(e.target.value || '0', 10)); draw(); });
  draw();
},

/* ---------- CORRESPONDING ---------- */
corr(el){
  const src = {carrier_id: 'LH', connection_id: '0400', airport_from_id: 'FRA', airport_to_id: 'JFK', distance: 6162};
  const base = {carrier_id: '', connection_id: '', from_airport: '', distance: 0, comment: 'manter este texto'};
  el.innerHTML = head('CORRESPONDING #( )', 'origem: connection · destino: target (tipos diferentes)', '') + `<div class="wid">
    <div class="row" style="gap:.5rem 1.5rem">
      <label class="check"><input type="checkbox" id="co-map"> MAPPING from_airport = airport_from_id</label>
      <label class="check"><input type="checkbox" id="co-exc"> EXCEPT distance</label>
      <label class="check"><input type="checkbox" id="co-base"> BASE ( target )</label>
    </div>
    <div id="co-code"></div>
    <div class="wid-split">
      <div class="panel"><h4>connection (origem)</h4>${table(['componente', 'valor'], Object.entries(src).map(([k, v]) => ({componente: k, valor: v})))}</div>
      <div class="panel"><h4>target (resultado)</h4><div id="co-out"></div></div>
    </div></div>`;
  function draw(){
    const map = $('#co-map', el).checked, exc = $('#co-exc', el).checked, b = $('#co-base', el).checked;
    let c = `target = CORRESPONDING #( ${b ? 'BASE ( target ) ' : ''}connection`;
    if (map) c += `\n             MAPPING from_airport = airport_from_id`;
    if (exc) c += `\n             EXCEPT distance`;
    c += ' ).';
    $('#co-code', el).innerHTML = codeBlock(c, 'Instrução');
    const rows = Object.keys(base).map(k => {
      let v, how;
      if (k === 'from_airport' && map){ v = src.airport_from_id; how = tag('c5', 'mapeado'); }
      else if (k in src && !(exc && k === 'distance')){ v = src[k]; how = tag('ok', 'mesmo nome'); }
      else if (b){ v = base[k]; how = tag('info', 'mantido (BASE)'); }
      else { v = typeof base[k] === 'number' ? 0 : ''; how = tag('', 'inicial'); }
      return `<tr><td class="mono">${k}</td><td class="mono">${v === '' ? '<span class="note">\' \'</span>' : esc(v)}</td><td>${how}</td></tr>`;
    }).join('');
    $('#co-out', el).innerHTML = `<div class="tbl-wrap"><table class="t"><thead><tr><th>componente</th><th>valor</th><th>origem</th></tr></thead><tbody>${rows}</tbody></table></div><p class="note">Antes da instrução, <code>target-comment</code> valia “manter este texto”.</p>`;
  }
  $$('input', el).forEach(i => i.addEventListener('change', draw)); draw();
},

/* ---------- Tabelas internas ---------- */
itab(el){
  const S = {std: [], sorted: [], hashed: Array.from({length: 8}, () => []), last: null};
  const hash = v => (((v * 2654435761) >>> 0) >>> 5) % 8;
  el.innerHTML = head('Três tabelas, mesmas operações', 'TYPE … TABLE OF i WITH … KEY table_line', '') + `<div class="wid">
    <div class="row">
      <div class="field" style="flex:0 1 8rem"><label for="it-v">Chave</label><input id="it-v" class="in mono" type="number" min="0" max="999" value="42"></div>
      <button class="btn emph" id="it-ins">${ICON('')}INSERT</button>
      <button class="btn" id="it-read">${ICON('')}READ TABLE</button>
      <button class="btn trans" id="it-rnd">${ICON('')}+5 aleatórias</button>
      <button class="btn trans neg" id="it-clr">${ICON('')}CLEAR</button>
    </div>
    <div id="it-code"></div>
    <div class="panel3">
      <div class="panel"><h4>STANDARD · NON-UNIQUE <span id="it-s1"></span></h4><div class="slots" id="it-std"></div></div>
      <div class="panel"><h4>SORTED · UNIQUE <span id="it-s2"></span></h4><div class="slots" id="it-srt"></div></div>
      <div class="panel"><h4>HASHED · UNIQUE <span id="it-s3"></span></h4><div class="buckets" id="it-hsh"></div></div>
    </div></div>`;
  function ins(v){
    S.std.push(v);
    const r2 = S.sorted.includes(v) ? 4 : (S.sorted.push(v), S.sorted.sort((a, b) => a - b), 0);
    const b = hash(v); const r3 = S.hashed[b].includes(v) ? 4 : (S.hashed[b].push(v), 0);
    return [0, r2, r3];
  }
  function draw(){
    const L = S.last || {};
    const slot = (v, i, cls, idx = true) => `<div class="slot ${cls}">${v}${idx ? `<small>${i + 1}</small>` : ''}</div>`;
    const sc = (k, i) => L.kind === 'read' ? (L[k].hit === i ? 'hit' : L[k].probes.includes(i) ? 'probe' : '') : (L.kind === 'ins' && L.v === (k === 'std' ? S.std : S.sorted)[i] && L.rc[k === 'std' ? 0 : 1] === 0 && (k === 'srt' || i === S.std.length - 1) ? 'new' : '');
    $('#it-std', el).innerHTML = S.std.map((v, i) => slot(v, i, sc('std', i))).join('') || '<span class="note">vazia</span>';
    $('#it-srt', el).innerHTML = S.sorted.map((v, i) => slot(v, i, sc('srt', i))).join('') || '<span class="note">vazia</span>';
    $('#it-hsh', el).innerHTML = S.hashed.map((bk, b) => `<div class="bucket"><small>bucket ${b}</small>${bk.map((v, j) => `<div class="slot ${L.kind === 'read' && L.hsh.b === b ? (L.hsh.hit === j ? 'hit' : j < (L.hsh.hit < 0 ? bk.length : L.hsh.hit) ? 'probe' : '') : (L.kind === 'ins' && L.v === v && L.rc[2] === 0 ? 'new' : '')}">${v}</div>`).join('')}</div>`).join('');
    const st = (id, txt, cls) => $(id, el).innerHTML = txt ? tag(cls, txt) : '';
    if (L.kind === 'ins'){
      st('#it-s1', 'sy-subrc = 0', 'ok'); st('#it-s2', 'sy-subrc = ' + L.rc[1], L.rc[1] ? 'warn' : 'ok'); st('#it-s3', 'sy-subrc = ' + L.rc[2], L.rc[2] ? 'warn' : 'ok');
      $('#it-code', el).innerHTML = codeBlock(`INSERT ${L.v} INTO TABLE itab.` + (L.rc[1] ? `\n" sorted/hashed: chave ${L.v} já existe => sy-subrc = 4, nada inserido` : ''), 'Última instrução');
    } else if (L.kind === 'read'){
      const f = (o, hashed) => o.hit >= 0 ? `${o.cmp} comparaç${o.cmp === 1 ? 'ão' : 'ões'}${hashed ? '' : ' · sy-tabix ' + (o.hit + 1)}` : `${o.cmp} comparaç${o.cmp === 1 ? 'ão' : 'ões'} · sy-subrc 4`;
      st('#it-s1', f(L.std), L.std.hit >= 0 ? 'warn' : 'err'); st('#it-s2', f(L.srt), L.srt.hit >= 0 ? 'info' : 'err'); st('#it-s3', 'hash + ' + f(L.hsh, true), L.hsh.hit >= 0 ? 'ok' : 'err');
      $('#it-code', el).innerHTML = codeBlock(`READ TABLE itab WITH TABLE KEY table_line = ${L.v}\n     TRANSPORTING NO FIELDS.`, 'Última instrução');
    } else { ['#it-s1', '#it-s2', '#it-s3'].forEach(i => st(i, '')); $('#it-code', el).innerHTML = codeBlock(`DATA std    TYPE STANDARD TABLE OF i WITH NON-UNIQUE KEY table_line.\nDATA sorted TYPE SORTED TABLE OF i WITH UNIQUE KEY table_line.\nDATA hashed TYPE HASHED TABLE OF i WITH UNIQUE KEY table_line.`, 'Declarações'); }
  }
  const val = () => { const v = parseInt($('#it-v', el).value, 10); return isNaN(v) ? null : Math.max(0, Math.min(999, v)); };
  $('#it-ins', el).addEventListener('click', () => { const v = val(); if (v == null) return; if (S.std.length >= 30){ toast('Limite de 30 linhas neste laboratório'); return; } S.last = {kind: 'ins', v, rc: ins(v)}; draw(); });
  $('#it-read', el).addEventListener('click', () => {
    const v = val(); if (v == null) return;
    const std = {probes: [], hit: -1, cmp: 0}; for (let i = 0; i < S.std.length; i++){ std.cmp++; std.probes.push(i); if (S.std[i] === v){ std.hit = i; break; } }
    const srt = {probes: [], hit: -1, cmp: 0}; let lo = 0, hi = S.sorted.length - 1; while (lo <= hi){ const m = (lo + hi) >> 1; srt.cmp++; srt.probes.push(m); if (S.sorted[m] === v){ srt.hit = m; break; } if (S.sorted[m] < v) lo = m + 1; else hi = m - 1; }
    const b = hash(v), bk = S.hashed[b], j = bk.indexOf(v); const hsh = {b, hit: j, cmp: j >= 0 ? j + 1 : bk.length};
    S.last = {kind: 'read', v, std, srt, hsh}; draw();
  });
  $('#it-rnd', el).addEventListener('click', () => { for (let i = 0; i < 5 && S.std.length < 30; i++){ const v = Math.floor(Math.random() * 100); S.last = {kind: 'ins', v, rc: ins(v)}; } draw(); });
  $('#it-clr', el).addEventListener('click', () => { S.std = []; S.sorted = []; S.hashed = S.hashed.map(() => []); S.last = null; draw(); });
  [42, 7, 19, 88, 3, 56, 7].forEach(v => ins(v)); S.last = null; draw();
},

/* ---------- EML ---------- */
eml(el){
  const S = {db: 'Agência Central', buf: null, live: 'prog', msg: '', log: []};
  el.innerHTML = head('Buffer transacional na prática', 'BO /DMO/R_AGENCYTP · agência 070050', '') + `<div class="wid">
    <div class="row">
      <div class="field" style="flex:2 1 14rem"><label for="em-name">Novo nome</label><input id="em-name" class="in" value="Agência Recife"></div>
      <button class="btn emph" id="em-mod">MODIFY ENTITIES</button>
      <button class="btn" id="em-com">${ICON('')}COMMIT ENTITIES</button>
      <button class="btn" id="em-rb">${ICON('')}ROLLBACK ENTITIES</button>
    </div>
    <div class="row"><button class="btn trans" id="em-read">${ICON('')}READ ENTITIES</button><button class="btn trans" id="em-sel">${ICON('')}SELECT na tabela</button><span class="note">Dica: tente gravar um nome vazio para disparar a validação do BO.</span></div>
    <div class="flowbox">
      <div class="fbox" data-b="prog"><h4>${ICON('')}Seu programa</h4><div id="em-prog" class="note">Nenhuma instrução.</div></div>
      <div class="fbox" data-b="buf"><h4>${ICON('')}Buffer transacional</h4><div id="em-buf"></div></div>
      <div class="fbox" data-b="db"><h4>${ICON('')}Banco · /DMO/AGENCY</h4><div id="em-db"></div></div>
    </div>
    <div id="em-msg"></div></div>`;
  const draw = () => {
    $$('.fbox', el).forEach(b => b.classList.toggle('live', b.dataset.b === S.live));
    $('#em-buf', el).innerHTML = S.buf != null ? `<span class="vis">name = '${esc(S.buf)}'</span><span class="tag warn">pendente</span>` : '<span class="note">vazio</span>';
    $('#em-db', el).innerHTML = `<span class="vis">name = '${esc(S.db)}'</span>`;
    $('#em-prog', el).innerHTML = S.log.slice(-1).map(l => `<code style="white-space:normal">${esc(l)}</code>`).join('') || 'Nenhuma instrução.';
    $('#em-msg', el).innerHTML = S.msg;
  };
  $('#em-mod', el).addEventListener('click', () => { S.buf = $('#em-name', el).value; S.live = 'buf'; S.log.push(`MODIFY ENTITIES … UPDATE FIELDS ( name ) WITH VALUE #( ( agencyid = '070050' name = '${S.buf}' ) ).`); S.msg = strip('', '', 'Alteração guardada no buffer. O banco ainda tem o valor antigo.'); draw(); });
  $('#em-com', el).addEventListener('click', () => {
    S.log.push('COMMIT ENTITIES RESPONSE OF /dmo/r_agencytp FAILED DATA(failed) REPORTED DATA(reported).');
    if (S.buf == null){ S.live = 'prog'; S.msg = strip('', '', 'Nada no buffer: o commit não grava nada.'); }
    else if (!S.buf.trim()){ S.live = 'buf'; S.msg = strip('err', '', '<b>sy-subrc = 4.</b> A validação do BO rejeitou o save: <code>failed</code> contém a agência 070050 e <code>reported</code> traz a mensagem “Nome da agência é obrigatório”. O buffer continua com a alteração até você corrigir ou fazer ROLLBACK.'); }
    else { S.db = S.buf; S.buf = null; S.live = 'db'; S.msg = strip('ok', '', '<b>sy-subrc = 0.</b> Validações passaram e o buffer foi gravado no banco numa única LUW.'); }
    draw();
  });
  $('#em-rb', el).addEventListener('click', () => { S.log.push('ROLLBACK ENTITIES.'); S.buf = null; S.live = 'buf'; S.msg = strip('', '', 'Buffer descartado. O banco não foi alterado.'); draw(); });
  $('#em-read', el).addEventListener('click', () => { S.log.push('READ ENTITIES OF /dmo/r_agencytp ENTITY /dmo/agency FIELDS ( name ) WITH … RESULT DATA(agencies).'); S.live = S.buf != null ? 'buf' : 'db'; S.msg = strip('', '', `READ ENTITIES retornou <b>'${esc(S.buf ?? S.db)}'</b>${S.buf != null ? ': ele enxerga o buffer, inclusive alterações ainda não gravadas.' : '.'}`); draw(); });
  $('#em-sel', el).addEventListener('click', () => { S.log.push(`SELECT SINGLE FROM /dmo/agency FIELDS name WHERE agency_id = '070050' INTO @DATA(name).`); S.live = 'db'; S.msg = strip(S.buf != null ? 'warn' : '', '', `SELECT retornou <b>'${esc(S.db)}'</b>${S.buf != null ? ': o SQL lê o banco e não vê o buffer.' : '.'}`); draw(); });
  draw();
},

/* ---------- Camadas RAP ---------- */
rap(el){
  const L = [
    {n: 'Tabela de banco', a: 'ZRAP_TRAVEL', ic: '', col: 'var(--sapIndication6)', d: 'Persistência. Guarda os dados ativos do business object.', lang: 'DDL', code: `define table zrap_travel {\n  key client      : abap.clnt not null;\n  key travel_uuid : sysuuid_x16 not null;\n  travel_id       : /dmo/travel_id;\n  description     : /dmo/description;\n  @Semantics.amount.currencyCode : 'zrap_travel.currency_code'\n  total_price     : /dmo/total_price;\n  currency_code   : /dmo/currency_code;\n  status          : /dmo/travel_status;\n  local_last_changed_at : abp_locinst_lastchange_tstmpl;\n}`},
    {n: 'CDS raiz (modelo)', a: 'ZR_Travel', ic: '', col: 'var(--sapIndication5)', d: 'Modelo de dados do BO com nomes semânticos. "root" marca a entidade raiz.', lang: 'CDS', code: `define root view entity ZR_Travel\n  as select from zrap_travel\n{\n  key travel_uuid   as TravelUUID,\n      travel_id     as TravelId,\n      description   as Description,\n      @Semantics.amount.currencyCode: 'CurrencyCode'\n      total_price   as TotalPrice,\n      currency_code as CurrencyCode,\n      status        as Status,\n      local_last_changed_at as LocalLastChanged\n}`},
    {n: 'Comportamento', a: 'ZR_Travel (BDEF) + ZBP_R_TRAVEL', ic: '', col: 'var(--sapIndication7)', d: 'Operações, validações, determinações e ações. A lógica fica na classe de comportamento (behavior pool).', lang: 'BDL', code: `managed implementation in class zbp_r_travel unique;\nstrict ( 2 );\n\ndefine behavior for ZR_Travel alias Travel\npersistent table zrap_travel\nlock master\nauthorization master ( instance )\netag master LocalLastChanged\n{\n  create; update; delete;\n  validation validateStatus on save { create; field Status; }\n  action acceptTravel result [1] $self;\n}`},
    {n: 'Projeção', a: 'ZC_Travel', ic: '', col: 'var(--sapIndication8)', d: 'Recorte do modelo para um caso de uso específico, com anotações de UI e o que é exposto.', lang: 'CDS', code: `@Metadata.allowExtensions: true\ndefine root view entity ZC_Travel\n  provider contract transactional_query\n  as projection on ZR_Travel\n{\n  key TravelUUID,\n      TravelId,\n      Description,\n      TotalPrice,\n      CurrencyCode,\n      Status\n}`},
    {n: 'Service definition', a: 'ZUI_TRAVEL', ic: '', col: 'var(--sapIndication3)', d: 'Escolhe as entidades que o serviço expõe, sem dizer o protocolo.', lang: 'CDS', code: `@EndUserText.label: 'Serviço de viagens'\ndefine service ZUI_TRAVEL {\n  expose ZC_Travel as Travel;\n}`},
    {n: 'Service binding', a: 'ZUI_TRAVEL_O4', ic: '', col: 'var(--sapIndication4)', d: 'Liga o serviço a um protocolo: OData V4, tipo UI. Depois de publicar, o botão Preview abre o app Fiori Elements.', preview: true}
  ];
  let cur = 0;
  el.innerHTML = head('Da tabela ao navegador', 'Clique nas camadas, de baixo para cima no modelo', '') + `<div class="wid"><div class="wid-split" style="grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)">
    <div class="layers" id="rp-l">${L.map((x, i) => `<button class="layer" data-i="${i}"><span class="lic" style="background:${x.col}">${ICON(x.ic)}</span><span><b>${esc(x.n)}</b><small>${esc(x.a)}</small></span></button>`).join('')}</div>
    <div id="rp-d" style="display:flex;flex-direction:column;gap:.75rem;min-width:0"></div></div></div>`;
  const draw = () => {
    $$('.layer', el).forEach((b, i) => b.classList.toggle('on', i === cur));
    const x = L[cur];
    let h = `<p>${esc(x.d)}</p>`;
    if (x.preview){
      h += `<dl class="kv"><dt>Tipo de binding</dt><dd>OData V4 · UI</dd><dt>Service definition</dt><dd class="mono">ZUI_TRAVEL</dd><dt>Entity set</dt><dd class="mono">Travel</dd><dt>Status</dt><dd>${tag('ok', 'Publicado')}</dd></dl>
      <div class="preview"><div class="mini-shell">${ICON('')} Viagens</div><div class="fio-bar"><div class="field" style="flex:0 1 10rem"><span class="lbl">Travel ID</span><input class="in" disabled></div><button class="btn emph sm">Go</button></div>
      <div style="background:var(--sapBaseColor)"><div class="fio-title">Viagens (3)</div>${table(['Travel ID', 'Descrição', 'Preço', 'Status'], [{'Travel ID': '00000001', 'Descrição': 'Congresso em Lisboa', 'Preço': '2.450,00 EUR', 'Status': 'Aceita'}, {'Travel ID': '00000002', 'Descrição': 'Feira em Frankfurt', 'Preço': '3.120,00 EUR', 'Status': 'Aberta'}, {'Travel ID': '00000003', 'Descrição': 'Visita a cliente', 'Preço': '980,00 EUR', 'Status': 'Aberta'}], {'Preço': 'num'})}</div></div>`;
    } else h += codeBlock(x.code, x.a, x.lang);
    $('#rp-d', el).innerHTML = h;
  };
  $$('.layer', el).forEach(b => b.addEventListener('click', () => { cur = +b.dataset.i; draw(); })); draw();
},

/* ---------- ABAP Unit runner ---------- */
unitrunner(el){
  el.innerHTML = head('Executor de testes', 'Escolha uma versão de apply_discount e rode os testes', '') + `<div class="wid">
    <div class="row">${seg('ut-v', [['ok', 'Implementação correta'], ['b1', 'Bug: / 10'], ['b2', 'Bug: sem validação']], 'ok')}<button class="btn emph" id="ut-run">${ICON('')}Executar testes (Ctrl+Shift+F10)</button></div>
    <div id="ut-code"></div><div id="ut-res"><div class="note">Clique em executar para ver o resultado.</div></div></div>`;
  let v = 'ok';
  const impl = {ok: 'r_price = i_price - i_price * i_percent / 100.', b1: 'r_price = i_price - i_price * i_percent / 10.', b2: '" validação removida\nr_price = i_price - i_price * i_percent / 100.'};
  const code = () => $('#ut-code', el).innerHTML = codeBlock((v === 'b2' ? '' : 'IF i_percent < 0 OR i_percent > 100.\n  RAISE EXCEPTION TYPE cx_abap_invalid_value.\nENDIF.\n') + impl[v], 'apply_discount · versão em teste');
  const calc = (p, pct) => { if (v !== 'b2' && (pct < 0 || pct > 100)) throw 'cx'; return p - p * pct / (v === 'b1' ? 10 : 100); };
  segBind(el, 'ut-v', x => { v = x; code(); $('#ut-res', el).innerHTML = '<div class="note">Versão alterada. Execute os testes novamente.</div>'; }); code();
  $('#ut-run', el).addEventListener('click', () => {
    const tests = [
      ['ten_percent', () => { const a = calc(100, 10); return a === 90 ? null : `Esperado [90.00], atual [${a.toFixed(2)}]`; }],
      ['zero_percent', () => { const a = calc(100, 0); return a === 100 ? null : `Esperado [100.00], atual [${a.toFixed(2)}]`; }],
      ['invalid_percent', () => { try { calc(100, 120); return 'Esperava exceção (cl_abap_unit_assert=>fail)'; } catch(e){ return null; } }]
    ].map(([n, f]) => [n, f()]);
    const fails = tests.filter(t => t[1]).length;
    $('#ut-res', el).innerHTML = `<div style="display:flex;flex-direction:column;gap:.5rem"><div class="bar" style="height:.5rem"><i style="width:100%;background:${fails ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'}"></i></div>
      <div class="statusline">${tag(fails ? 'err' : 'ok', fails ? `${fails} de 3 falharam` : '3 de 3 passaram')}<span class="note">ltc_price_calc · DURATION SHORT · RISK LEVEL HARMLESS</span></div>
      ${table(['Método', 'Resultado'], tests.map(t => ({'Método': t[0], 'Resultado': t[1] ? '✕ ' + t[1] : '✓ ok'})))}</div>`;
  });
},

/* ---------- Conversões ---------- */
convlab(el){
  el.innerHTML = head('Laboratório de conversão', 'DATA(source) = `…`. e depois target = source.', '') + `<div class="wid">
    <div class="row"><div class="field" style="flex:2 1 12rem"><label for="cv-in">Valor de origem (string)</label><input id="cv-in" class="in mono" value="12.5"></div>
      <div class="chips" style="align-self:center">${['12.5', '-3.5', '  7 ', '1234567', 'A1B2C3', 'abc', '20261332', '20261027', '99999999999'].map(p => `<button class="chip" data-p="${esc(p)}">${vis(p)}</button>`).join('')}</div></div>
    <div id="cv-out"></div></div>`;
  const cells = (s, len, cutLeft) => {
    const shown = s.padEnd(len, ' ').slice(0, len);
    return `<span class="cells">${[...shown].map(ch => `<span class="${ch === ' ' ? 'blank' : ''}">${ch === ' ' ? '·' : esc(ch)}</span>`).join('')}</span>`;
  };
  const draw = () => {
    const src = $('#cv-in', el).value; const p = parseAbapNum(src);
    const rows = [];
    // i
    if (!p.ok) rows.push(['i', tag('err', 'CX_SY_CONVERSION_NO_NUMBER', ''), 'O texto precisa representar um número.']);
    else { const r = roundDec(p, 0); const s = decStr(r, 0); rows.push(['i', BigInt(s) > 2147483647n || BigInt(s) < -2147483648n ? tag('err', 'CX_SY_CONVERSION_OVERFLOW', '') : `<span class="result" style="display:inline-block;padding:.25rem .5rem">${esc(s)}</span>`, p.frac && /[1-9]/.test(p.frac) ? 'Casas decimais arredondadas comercialmente (0,5 sobe, afastando do zero).' : 'Valor numérico convertido.']); }
    // p
    if (!p.ok) rows.push(['p LENGTH 8 DECIMALS 2', tag('err', 'CX_SY_CONVERSION_NO_NUMBER', ''), 'Mesmo critério do tipo i.']);
    else { const r = roundDec(p, 2); rows.push(['p LENGTH 8 DECIMALS 2', r.v > 999999999999999n ? tag('err', 'CX_SY_CONVERSION_OVERFLOW', '') : `<span class="result" style="display:inline-block;padding:.25rem .5rem">${esc(decStr(r, 2))}</span>`, 'Até 13 dígitos inteiros e 2 decimais, arredondado.']); }
    // c 5
    rows.push(['c LENGTH 5', cells(src, 5), src.length > 5 ? `Cortado à direita: perdeu “${esc(src.slice(5))}” sem aviso.` : src.length < 5 ? 'Completado com espaços à direita.' : 'Cabe exatamente.']);
    // n 6
    const dig = src.replace(/\D/g, ''); const nres = dig.length > 6 ? dig.slice(-6) : dig.padStart(6, '0');
    rows.push(['n LENGTH 6', cells(nres, 6), dig.length > 6 ? `Só os dígitos, alinhados à direita: perdeu “${dig.slice(0, -6)}” à esquerda.` : dig !== src.trim() ? 'Só os dígitos são passados, alinhados à direita com zeros.' : 'Alinhado à direita, completado com zeros.']);
    // d
    const d8 = src.padEnd(8, ' ').slice(0, 8);
    const valid = /^\d{8}$/.test(d8) && (() => { const y = +d8.slice(0, 4), m = +d8.slice(4, 6), dd = +d8.slice(6); const dt = new Date(Date.UTC(y, m - 1, dd)); return m >= 1 && m <= 12 && dt.getUTCDate() === dd && dt.getUTCMonth() === m - 1; })();
    rows.push(['d', cells(d8, 8), valid ? 'Data válida (AAAAMMDD).' : `${tag('warn', 'data inválida')} Os 8 primeiros caracteres são copiados <b>sem validação</b>. Use <code>EXACT d( )</code> para detectar.`]);
    $('#cv-out', el).innerHTML = `<div class="tbl-wrap"><table class="t"><thead><tr><th>DATA target TYPE …</th><th>Conteúdo de target</th><th>Regra aplicada</th></tr></thead><tbody>${rows.map(r => `<tr><td class="mono">${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>`;
  };
  $('#cv-in', el).addEventListener('input', draw);
  $$('.chip', el).forEach(c => c.addEventListener('click', () => { $('#cv-in', el).value = c.dataset.p; draw(); }));
  draw();
},

/* ---------- Funções de texto ---------- */
strlab(el){
  const FN = {
    to_upper: {p: [], f: t => t.toUpperCase(), c: () => 'to_upper( val = text )'},
    to_lower: {p: [], f: t => t.toLowerCase(), c: () => 'to_lower( val = text )'},
    condense: {p: [], f: t => t.trim().replace(/ {2,}/g, ' '), c: () => 'condense( val = text )'},
    strlen: {p: [], f: t => t.length, c: () => 'strlen( text )', num: true},
    substring: {p: [['off', '2'], ['len', '6']], f: (t, a) => { const o = +a.off, l = a.len === '' ? t.length - o : +a.len; if (o < 0 || l < 0 || o + l > t.length) throw 'CX_SY_RANGE_OUT_OF_BOUNDS'; return t.substr(o, l); }, c: a => `substring( val = text off = ${a.off}${a.len !== '' ? ' len = ' + a.len : ''} )`},
    find: {p: [['sub', 'ABAP']], f: (t, a) => a.sub === '' ? 0 : t.indexOf(a.sub), c: a => `find( val = text sub = \`${a.sub}\` )`, num: true},
    count: {p: [['sub', 'a']], f: (t, a) => a.sub === '' ? 0 : t.split(a.sub).length - 1, c: a => `count( val = text sub = \`${a.sub}\` )`, num: true},
    replace: {p: [['sub', 'a'], ['with', 'o'], ['occ', '0']], f: (t, a) => { if (!a.sub) return t; const occ = parseInt(a.occ || '1', 10); const parts = t.split(a.sub); if (parts.length === 1) return t; if (occ === 0) return parts.join(a.with); const n = parts.length - 1; const k = occ > 0 ? occ : n + occ + 1; if (k < 1 || k > n) return t; return parts.slice(0, k).join(a.sub) + a.with + parts.slice(k).join(a.sub); }, c: a => `replace( val = text sub = \`${a.sub}\` with = \`${a.with}\` occ = ${a.occ || 1} )`},
    segment: {p: [['index', '2'], ['sep', ' ']], f: (t, a) => { const segs = t.split(a.sep || ' '); const i = parseInt(a.index, 10); const k = i > 0 ? i - 1 : segs.length + i; if (!i || k < 0 || k >= segs.length) throw 'CX_SY_STRG_PAR_VAL'; return segs[k]; }, c: a => `segment( val = text index = ${a.index} sep = \`${a.sep}\` )`},
    reverse: {p: [], f: t => [...t].reverse().join(''), c: () => 'reverse( text )'},
    template: {p: [['WIDTH', '30'], ['ALIGN', 'CENTER'], ['PAD', '*']], f: (t, a) => { const w = parseInt(a.WIDTH, 10) || 0, pad = (a.PAD || ' ')[0]; if (w <= t.length) return t; const tot = w - t.length; const al = (a.ALIGN || 'LEFT').toUpperCase(); if (al === 'RIGHT') return pad.repeat(tot) + t; if (al === 'CENTER'){ const l = Math.floor(tot / 2); return pad.repeat(l) + t + pad.repeat(tot - l); } return t + pad.repeat(tot); }, c: a => `|{ text WIDTH = ${a.WIDTH} ALIGN = ${(a.ALIGN || 'LEFT').toUpperCase()} PAD = '${(a.PAD || ' ')[0]}' }|`}
  };
  el.innerHTML = head('Laboratório de funções de texto', 'text TYPE string', '') + `<div class="wid">
    <div class="row"><div class="field" style="flex:3 1 16rem"><label for="st-t">text</label><input id="st-t" class="in mono" value="  Trilha ABAP  na  nuvem  "></div>
      <div class="field"><label for="st-f">Função</label><select id="st-f" class="in">${Object.keys(FN).map(f => `<option value="${f}">${f === 'template' ? 'string template' : f + '( )'}</option>`).join('')}</select></div></div>
    <div class="row" id="st-p"></div><div id="st-code"></div><div id="st-out"></div></div>`;
  let fn = 'to_upper', args = {};
  const params = () => {
    const d = FN[fn]; args = Object.fromEntries(d.p.map(p => [p[0], p[1]]));
    $('#st-p', el).innerHTML = d.p.map(p => `<div class="field" style="flex:0 1 9rem"><label for="st-${p[0]}">${p[0]}</label><input id="st-${p[0]}" data-k="${p[0]}" class="in mono" value="${esc(p[1])}"></div>`).join('') || '<span class="note">Esta função só recebe o texto.</span>';
    $$('#st-p input', el).forEach(i => i.addEventListener('input', () => { args[i.dataset.k] = i.value; run(); }));
  };
  const run = () => {
    const t = $('#st-t', el).value, d = FN[fn];
    $('#st-code', el).innerHTML = codeBlock(`DATA(result) = ${d.c(args)}.`, 'Expressão');
    let out;
    try { const r = d.f(t, args); out = d.num ? `<span class="result" style="display:inline-block">${r}</span>` : `<div class="result"><span class="vis" style="background:none;padding:0">\`${vis(String(r))}\`</span></div><p class="note">Espaços aparecem como · · tamanho ${String(r).length}</p>`; }
    catch(e){ out = strip('err', '', `Exceção <b>${esc(e)}</b>: parâmetro fora dos limites do texto (tamanho ${t.length}).`); }
    $('#st-out', el).innerHTML = out;
  };
  $('#st-f', el).addEventListener('change', e => { fn = e.target.value; params(); run(); });
  $('#st-t', el).addEventListener('input', run);
  params(); run();
},

/* ---------- Agregações ---------- */
agglab(el){
  const AG = {'COUNT( * )': {k: 'flights', f: r => r.length}, 'SUM( seats_occupied )': {k: 'passengers', f: r => r.reduce((s, x) => s + x.seats_occupied, 0)}, 'AVG( seats_occupied AS DEC( 10, 2 ) )': {k: 'avg_pax', f: r => (r.reduce((s, x) => s + x.seats_occupied, 0) / r.length).toFixed(2)}, 'MAX( price )': {k: 'max_price', f: r => Math.max(...r.map(x => x.price)).toFixed(2)}, 'MIN( price )': {k: 'min_price', f: r => Math.min(...r.map(x => x.price)).toFixed(2)}};
  el.innerHTML = head('Agregação em /DMO/FLIGHT', '16 voos de exemplo', '') + `<div class="wid">
    <div class="row">
      <div class="field"><label for="ag-f">Agregação</label><select id="ag-f" class="in">${Object.keys(AG).map(a => `<option>${a}</option>`).join('')}</select></div>
      <div class="field"><span class="lbl">GROUP BY</span>${seg('ag-g', [['carrier_id', 'carrier_id'], ['conn', 'carrier_id, connection_id'], ['', 'nenhum']], 'carrier_id')}</div>
      <div class="field" style="flex:0 1 12rem"><label for="ag-h">HAVING COUNT( * ) &gt;= <b id="ag-hv">1</b></label><input id="ag-h" type="range" min="1" max="4" value="1"></div>
      <label class="check" style="align-self:center"><input type="checkbox" id="ag-full"> WHERE seats_occupied = seats_max</label>
    </div>
    <div id="ag-code"></div><div id="ag-out"></div></div>`;
  let g = 'carrier_id';
  const draw = () => {
    const a = $('#ag-f', el).value, h = +$('#ag-h', el).value, full = $('#ag-full', el).checked; $('#ag-hv', el).textContent = h;
    const keys = g === 'conn' ? ['carrier_id', 'connection_id'] : g ? ['carrier_id'] : [];
    let c = `SELECT FROM /dmo/flight\n  FIELDS ${[...keys, `${a} AS ${AG[a].k}`].join(',\n         ')}`;
    if (full) c += `\n  WHERE seats_occupied = seats_max`;
    if (keys.length) c += `\n  GROUP BY ${keys.join(', ')}`;
    if (h > 1) c += `\n  HAVING COUNT( * ) >= ${h}`;
    if (keys.length) c += `\n  ORDER BY ${keys.join(', ')}`;
    c += `\n  INTO TABLE @DATA(stats).`;
    $('#ag-code', el).innerHTML = codeBlock(c, 'ABAP SQL');
    const src = FLIGHTS.filter(f => !full || f.seats_occupied === f.seats_max);
    const groups = new Map(); src.forEach(f => { const k = keys.map(x => f[x]).join('|'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); });
    if (!keys.length && !groups.size) groups.set('', []);
    const rows = [...groups.entries()].filter(([, r]) => keys.length ? r.length >= h : r.length >= h || h === 1).sort().map(([k, r]) => { const o = {}; keys.forEach((x, i) => o[x] = k.split('|')[i]); o[AG[a].k] = r.length ? AG[a].f(r) : (a.startsWith('COUNT') ? 0 : null); return o; });
    $('#ag-out', el).innerHTML = `<div class="statusline">${tag('', `${src.length} linhas lidas no banco`)}${tag('ok', `${rows.length} transferidas ao ABAP`)}</div>${table([...keys, AG[a].k], rows, {[AG[a].k]: 'num'})}`;
  };
  segBind(el, 'ag-g', v => { g = v; draw(); });
  ['#ag-f', '#ag-h', '#ag-full'].forEach(s => $(s, el).addEventListener('input', draw));
  $('#ag-full', el).addEventListener('change', draw);
  draw();
},

/* ---------- Gráfico de performance ---------- */
perfchart(el){
  el.innerHTML = head('Comparações médias por leitura', 'Escala logarítmica nos dois eixos', '') + `<div class="wid">
    <div class="row"><div class="field" style="flex:1 1 18rem"><label for="pc-n">Linhas na tabela: <b id="pc-nv"></b></label><input id="pc-n" type="range" min="1" max="5" step="0.05" value="3"></div>
    <div class="legend"><span><i style="background:var(--sapCriticalColor)"></i>STANDARD (linear)</span><span><i style="background:var(--sapInformativeColor)"></i>SORTED (binária)</span><span><i style="background:var(--sapPositiveColor)"></i>HASHED</span></div></div>
    <div class="svg-scroll"><svg class="chart" id="pc-svg" viewBox="0 0 640 300" style="width:100%;min-width:30rem;height:auto" role="img" aria-label="Gráfico de comparações por tamanho de tabela"></svg></div>
    <div id="pc-t"></div></div>`;
  const W = 640, H = 300, L = 64, R = 20, T = 16, B = 40;
  const x = n => L + (Math.log10(n) - 1) / 4 * (W - L - R);
  const y = v => T + (1 - Math.log10(Math.max(v, 1)) / 5) * (H - T - B);
  const lin = n => (n + 1) / 2, bin = n => Math.log2(n) + 1, hsh = () => 1;
  const path = f => { let d = ''; for (let e = 1; e <= 5.0001; e += 0.05){ const n = 10 ** e; d += (d ? 'L' : 'M') + x(n).toFixed(1) + ' ' + y(f(n)).toFixed(1); } return d; };
  const ticks = [10, 100, 1000, 10000, 100000];
  const lbl = v => v >= 1000 ? (v / 1000) + ' mil' : v;
  const draw = () => {
    const e = +$('#pc-n', el).value, n = Math.round(10 ** e); $('#pc-nv', el).textContent = fmtNum(n);
    const pts = [[lin, 'var(--sapCriticalColor)'], [bin, 'var(--sapInformativeColor)'], [hsh, 'var(--sapPositiveColor)']];
    $('#pc-svg', el).innerHTML =
      [1, 10, 100, 1000, 10000, 100000].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--sapList_BorderColor)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${lbl(v)}</text>`).join('') +
      ticks.map(v => `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${H - B}" stroke="var(--sapList_BorderColor)"/><text x="${x(v)}" y="${H - B + 18}" text-anchor="middle">${lbl(v)}</text>`).join('') +
      `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">linhas na tabela</text><text x="14" y="${(T + H - B) / 2}" text-anchor="middle" transform="rotate(-90 14 ${(T + H - B) / 2})">comparações</text>` +
      pts.map(([f, c]) => `<path d="${path(f)}" fill="none" stroke="${c}" stroke-width="2.5"/>`).join('') +
      `<line x1="${x(n)}" x2="${x(n)}" y1="${T}" y2="${H - B}" stroke="var(--sapTextColor)" stroke-dasharray="4 4"/>` +
      pts.map(([f, c]) => `<circle cx="${x(n)}" cy="${y(f(n))}" r="5" fill="${c}" stroke="var(--sapBaseColor)" stroke-width="2"/>`).join('');
    $('#pc-t', el).innerHTML = table(['Tipo', 'Comparações por leitura', 'Para 1.000 leituras'], [
      {'Tipo': 'STANDARD (READ … WITH KEY)', 'Comparações por leitura': fmtNum(lin(n), 1), 'Para 1.000 leituras': fmtNum(lin(n) * 1000)},
      {'Tipo': 'SORTED (busca binária)', 'Comparações por leitura': fmtNum(bin(n), 1), 'Para 1.000 leituras': fmtNum(bin(n) * 1000)},
      {'Tipo': 'HASHED', 'Comparações por leitura': '≈ 1', 'Para 1.000 leituras': '≈ 1.000'}], {'Comparações por leitura': 'num', 'Para 1.000 leituras': 'num'});
  };
  $('#pc-n', el).addEventListener('input', draw); draw();
},

/* ---------- AUTHORITY-CHECK ---------- */
authsim(el){
  const C = ['BR', 'PT', 'DE', 'US'], A = [['01', 'criar'], ['02', 'alterar'], ['03', 'exibir'], ['06', 'eliminar']];
  el.innerHTML = head('Simulador de autorização', 'Objeto /DMO/TRVL · campos /DMO/CNTRY e ACTVT', '') + `<div class="wid"><div class="wid-split">
    <div class="panel"><h4>Role do usuário</h4>
      <label class="check"><input type="checkbox" id="au-has" checked> Role contém autorização para /DMO/TRVL</label>
      <div><span class="lbl">/DMO/CNTRY</span><div class="row" style="gap:.5rem 1rem">${C.map(c => `<label class="check"><input type="checkbox" data-c="${c}" ${['BR', 'PT'].includes(c) ? 'checked' : ''}>${c}</label>`).join('')}</div></div>
      <div><span class="lbl">ACTVT</span><div class="row" style="gap:.5rem 1rem">${A.map(a => `<label class="check"><input type="checkbox" data-a="${a[0]}" ${a[0] === '03' ? 'checked' : ''}>${a[0]} ${a[1]}</label>`).join('')}</div></div></div>
    <div class="panel"><h4>O que o código pede</h4>
      <div class="row"><div class="field"><label for="au-c">País</label><select id="au-c" class="in">${C.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="au-a">Atividade</label><select id="au-a" class="in">${A.map(a => `<option value="${a[0]}" ${a[0] === '02' ? 'selected' : ''}>${a[0]} ${a[1]}</option>`).join('')}</select></div></div></div></div>
    <div id="au-code"></div><div id="au-out"></div></div>`;
  const draw = () => {
    const has = $('#au-has', el).checked; $$('[data-c],[data-a]', el).forEach(i => i.disabled = !has);
    const cs = new Set($$('[data-c]:checked', el).map(i => i.dataset.c)), as = new Set($$('[data-a]:checked', el).map(i => i.dataset.a));
    const c = $('#au-c', el).value, a = $('#au-a', el).value;
    $('#au-code', el).innerHTML = codeBlock(`AUTHORITY-CHECK OBJECT '/DMO/TRVL'\n  ID '/DMO/CNTRY' FIELD '${c}'\n  ID 'ACTVT'      FIELD '${a}'.\n\nIF sy-subrc <> 0.\n  RAISE EXCEPTION TYPE zcx_no_authorization.\nENDIF.`, 'Verificação');
    const rc = !has ? 12 : (cs.has(c) && as.has(a)) ? 0 : 4;
    const why = rc === 0 ? `A role concede ${c} e a atividade ${a}.` : rc === 4 ? `A role tem o objeto, mas não para ${!cs.has(c) ? 'o país ' + c : ''}${!cs.has(c) && !as.has(a) ? ' nem ' : ''}${!as.has(a) ? 'a atividade ' + a : ''}.` : 'O usuário não tem nenhuma autorização para o objeto /DMO/TRVL.';
    $('#au-out', el).innerHTML = strip(rc ? (rc === 12 ? 'err' : 'warn') : 'ok', rc ? '' : '', `<b>sy-subrc = ${rc}</b> · ${esc(why)}`);
  };
  $$('input,select', el).forEach(i => i.addEventListener('change', draw)); draw();
},

/* ---------- Polimorfismo ---------- */
poly(el){
  let seq = 0; const S = [{t: 'cargo', name: 'D-ABUK', v: 50000}, {t: 'pax', name: 'D-AIMA', v: 509}];
  el.innerHTML = head('Uma referência, vários comportamentos', 'DATA planes TYPE TABLE OF REF TO lcl_plane', '') + `<div class="wid">
    <div class="row"><button class="btn" id="po-c">${ICON('')}Cargueiro</button><button class="btn" id="po-p">${ICON('')}Passageiros</button><button class="btn trans neg" id="po-x">${ICON('')}Limpar</button></div>
    <div id="po-code"></div><div id="po-tab"></div>
    <div class="row"><div class="field" style="flex:0 1 10rem"><label for="po-i">Linha</label><select id="po-i" class="in"></select></div>
      <button class="btn" id="po-cast">CAST lcl_cargo_plane( plane )</button><button class="btn" id="po-is">IS INSTANCE OF lcl_cargo_plane</button></div>
    <div id="po-out"></div></div>`;
  const draw = () => {
    const ap = S.map(p => p.t === 'cargo' ? `APPEND NEW lcl_cargo_plane( name = '${p.name}' cargo_kg = ${p.v} ) TO planes.` : `APPEND NEW lcl_passenger_plane( name = '${p.name}' seats = ${p.v} ) TO planes.`).join('\n');
    $('#po-code', el).innerHTML = codeBlock(`${ap || '" tabela vazia'}\n\nLOOP AT planes INTO DATA(plane).\n  " plane é REF TO lcl_plane: o método executado depende do objeto\n  out->write( plane->get_attributes( ) ).\nENDLOOP.`, 'Programa');
    $('#po-tab', el).innerHTML = table(['#', 'Tipo estático', 'Tipo dinâmico', 'get_attributes( ) retorna'], S.map((p, i) => ({'#': i + 1, 'Tipo estático': 'REF TO lcl_plane', 'Tipo dinâmico': p.t === 'cargo' ? 'lcl_cargo_plane' : 'lcl_passenger_plane', 'get_attributes( ) retorna': p.t === 'cargo' ? `${p.name}: cargueiro, ${fmtNum(p.v)} kg` : `${p.name}: ${p.v} assentos`})));
    $('#po-i', el).innerHTML = S.map((p, i) => `<option value="${i}">${i + 1} · ${p.name}</option>`).join('');
    $('#po-out', el).innerHTML = '';
  };
  const names = ['D-ABYT', 'PP-XTA', 'N123UA', 'JA731J', 'D-AIXP', '9V-SKA'];
  $('#po-c', el).addEventListener('click', () => { S.push({t: 'cargo', name: names[seq++ % 6], v: 20000 + (seq * 7919 % 80) * 1000}); draw(); });
  $('#po-p', el).addEventListener('click', () => { S.push({t: 'pax', name: names[seq++ % 6], v: 150 + (seq * 37 % 300)}); draw(); });
  $('#po-x', el).addEventListener('click', () => { S.length = 0; draw(); });
  $('#po-cast', el).addEventListener('click', () => { const p = S[+$('#po-i', el).value]; if (!p) return; $('#po-out', el).innerHTML = p.t === 'cargo' ? strip('ok', '', `Downcast funcionou: agora você acessa <code>cargo->cargo_kg</code> = ${fmtNum(p.v)}.`) : strip('err', '', `<b>CX_SY_MOVE_CAST_ERROR</b>: o objeto é um lcl_passenger_plane, não um lcl_cargo_plane.`); });
  $('#po-is', el).addEventListener('click', () => { const p = S[+$('#po-i', el).value]; if (!p) return; $('#po-out', el).innerHTML = strip(p.t === 'cargo' ? 'ok' : '', '', `<code>IF plane IS INSTANCE OF lcl_cargo_plane.</code> → <b>${p.t === 'cargo' ? 'verdadeiro' : 'falso'}</b>. Verifique antes de fazer o CAST e evite a exceção.`); });
  draw();
},

/* ---------- TRY … CATCH ---------- */
trysim(el){
  const CODE = ['TRY.', '    DATA(divisor) = CONV i( input ).', '    DATA(result)  = 100 / divisor.', '    out->write( |100 / { divisor } = { result }| ).', '  CATCH cx_sy_zerodivide INTO DATA(zero).', '    out->write( zero->get_text( ) ).', '  CATCH cx_sy_conversion_no_number.', '    out->write( `Isso não é um número` ).', '  CATCH cx_root INTO DATA(other).', '    out->write( |Outro erro: { other->get_text( ) }| ).', 'ENDTRY.', 'out->write( `O programa continua` ).'];
  const H = hlLines(CODE.join('\n'));
  el.innerHTML = head('Execução passo a passo', 'input TYPE string', '') + `<div class="wid">
    <div class="row"><div class="field" style="flex:0 1 12rem"><label for="ts-in">input</label><input id="ts-in" class="in mono" value="8"></div>
    <div class="chips" style="align-self:center">${['8', '3', '0', 'abc', ' 12.7', '99999999999'].map(p => `<button class="chip" data-p="${esc(p)}">${vis(p)}</button>`).join('')}</div></div>
    <div class="code"><div class="code-h"><b>Simulação</b><span>linhas executadas destacadas</span></div><pre id="ts-code"></pre></div>
    <div class="console" id="ts-out"></div><div id="ts-ex"></div></div>`;
  const run = () => {
    const s = $('#ts-in', el).value; const p = parseAbapNum(s); let lines, out, ex = '';
    if (!p.ok){ lines = [0, 1, 6, 7, 10, 11]; out = ['Isso não é um número']; ex = 'CX_SY_CONVERSION_NO_NUMBER → CX_SY_CONVERSION_ERROR → CX_DYNAMIC_CHECK'; }
    else {
      const d = BigInt(decStr(roundDec(p, 0), 0));
      if (d > 2147483647n || d < -2147483648n){ lines = [0, 1, 8, 9, 10, 11]; out = [`Outro erro: Overflow ao converter "${s.trim()}"`]; ex = 'CX_SY_CONVERSION_OVERFLOW: não há CATCH específico, cx_root captura'; }
      else if (d === 0n){ lines = [0, 1, 2, 4, 5, 10, 11]; out = ['Divisão por zero']; ex = 'CX_SY_ZERODIVIDE → CX_SY_ARITHMETIC_ERROR → CX_DYNAMIC_CHECK'; }
      else { lines = [0, 1, 2, 3, 10, 11]; out = [`100 / ${d} = ${divRound(100, Number(d), 0)}`]; }
    }
    out.push('O programa continua');
    $('#ts-code', el).innerHTML = H.map((h, i) => `<span class="${lines.includes(i) ? 'ln-run' : ''}"><span class="note" style="display:inline-block;width:2rem;user-select:none">${i + 1}</span>${h}</span>`).join('\n');
    $('#ts-out', el).textContent = out.join('\n');
    $('#ts-ex', el).innerHTML = ex ? strip('warn', '', `Exceção lançada na linha ${lines[2] === 2 ? 3 : 2}: <code>${esc(ex)}</code>`) : strip('ok', '', 'Nenhuma exceção: o bloco TRY terminou normalmente e os CATCH foram ignorados.');
  };
  $('#ts-in', el).addEventListener('input', run);
  $$('.chip', el).forEach(c => c.addEventListener('click', () => { $('#ts-in', el).value = c.dataset.p; run(); }));
  run();
},

/* ---------- Construtor de tabela ---------- */
tablebuilder(el){
  const TYPES = {'abap.clnt': [0, 0], 'abap.char': [1, 0], 'abap.numc': [1, 0], 'abap.int4': [0, 0], 'abap.dec': [1, 1], 'abap.curr': [1, 1], 'abap.cuky': [0, 0], 'abap.dats': [0, 0], 'abap.string': [0, 0], 'sysuuid_x16': [0, 0]};
  let F = [
    {n: 'client', t: 'abap.clnt', l: '', d: '', k: true}, {n: 'travel_id', t: 'abap.numc', l: '8', d: '', k: true},
    {n: 'description', t: 'abap.char', l: '80', d: '', k: false}, {n: 'begin_date', t: 'abap.dats', l: '', d: '', k: false},
    {n: 'total_price', t: 'abap.curr', l: '16', d: '2', k: false}, {n: 'currency_code', t: 'abap.cuky', l: '', d: '', k: false}];
  el.innerHTML = head('Construtor de tabela', 'Edite os campos; a definição e as verificações se atualizam', '') + `<div class="wid">
    <div class="row"><div class="field" style="flex:0 1 14rem"><label for="tb-n">Nome da tabela</label><input id="tb-n" class="in mono" value="ztravel_demo" maxlength="20"></div>
    <div class="field" style="flex:0 1 12rem"><label for="tb-dc">Classe de entrega</label><select id="tb-dc" class="in"><option value="#A">#A aplicação</option><option value="#C">#C customizing</option><option value="#L">#L temporária</option></select></div></div>
    <div class="frow"><span class="hd">Campo</span><span class="hd">Tipo</span><span class="hd">Tam.</span><span class="hd">Dec.</span><span class="hd">Chave</span><span></span></div>
    <div id="tb-rows" style="display:flex;flex-direction:column;gap:.5rem"></div>
    <div><button class="btn" id="tb-add">${ICON('')}Adicionar campo</button></div>
    <div id="tb-msg" style="display:flex;flex-direction:column;gap:.5rem"></div><div id="tb-code"></div></div>`;
  const rows = () => {
    $('#tb-rows', el).innerHTML = F.map((f, i) => { const [hl_, hd] = TYPES[f.t] || [0, 0]; return `<div class="frow" data-i="${i}">
      <input class="in mono" data-k="n" value="${esc(f.n)}" aria-label="Nome do campo ${i + 1}">
      <select class="in" data-k="t" aria-label="Tipo do campo ${i + 1}">${Object.keys(TYPES).map(t => `<option ${t === f.t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <input class="in mono" data-k="l" value="${esc(f.l)}" ${hl_ ? '' : 'disabled'} aria-label="Tamanho">
      <input class="in mono" data-k="d" value="${esc(f.d)}" ${hd ? '' : 'disabled'} aria-label="Decimais">
      <label class="check" style="justify-content:center"><input type="checkbox" data-k="k" ${f.k ? 'checked' : ''} aria-label="Campo chave"></label>
      <button class="ibtn" data-del aria-label="Remover campo">${ICON('')}</button></div>`; }).join('');
    $$('#tb-rows .frow', el).forEach(r => {
      const i = +r.dataset.i;
      $$('[data-k]', r).forEach(inp => inp.addEventListener(inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input', () => {
        const k = inp.dataset.k; F[i][k] = inp.type === 'checkbox' ? inp.checked : inp.value;
        if (k === 't'){ const [a, b] = TYPES[F[i].t]; if (!a) F[i].l = ''; if (!b) F[i].d = ''; if (a && !F[i].l) F[i].l = F[i].t === 'abap.char' ? '20' : F[i].t === 'abap.numc' ? '8' : '16'; if (b && !F[i].d) F[i].d = '2'; rows(); }
        gen();
      }));
      $('[data-del]', r).addEventListener('click', () => { F.splice(i, 1); rows(); gen(); });
    });
  };
  const gen = () => {
    const name = $('#tb-n', el).value.trim().toLowerCase(), dc = $('#tb-dc', el).value;
    const msgs = [];
    if (!/^[zy]/.test(name)) msgs.push(['err', 'O nome da tabela precisa começar com Z ou Y (namespace do cliente).']);
    if (name.length > 16) msgs.push(['err', `Nome com ${name.length} caracteres: o limite para tabelas de banco é 16.`]);
    if (!/^[a-z][a-z0-9_]*$/.test(name)) msgs.push(['err', 'Use apenas letras, dígitos e sublinhado, começando por letra.']);
    const names = F.map(f => f.n.trim().toLowerCase());
    F.forEach((f, i) => {
      const n = names[i];
      if (!/^[a-z][a-z0-9_]*$/.test(n)) msgs.push(['err', `Campo ${i + 1}: nome “${f.n}” inválido.`]);
      if (n.length > 30) msgs.push(['err', `Campo ${n}: máximo de 30 caracteres.`]);
      if (names.indexOf(n) !== i) msgs.push(['err', `Campo ${n} duplicado.`]);
      const [hl_, hd] = TYPES[f.t];
      if (hl_ && !(+f.l > 0)) msgs.push(['err', `Campo ${n}: informe o tamanho.`]);
      if (f.t === 'abap.char' && +f.l > 1333) msgs.push(['err', `Campo ${n}: abap.char vai até 1333 em tabelas; use abap.string para textos longos.`]);
      if (hd && (+f.d > +f.l)) msgs.push(['err', `Campo ${n}: decimais maiores que o tamanho.`]);
      if (f.t === 'abap.string' && f.k) msgs.push(['err', `Campo ${n}: strings não podem ser chave.`]);
    });
    const firstNonKey = F.findIndex(f => !f.k);
    if (firstNonKey >= 0 && F.slice(firstNonKey).some(f => f.k)) msgs.push(['err', 'Campos chave precisam vir antes dos demais campos.']);
    if (!F.some(f => f.k)) msgs.push(['err', 'A tabela precisa de pelo menos um campo chave.']);
    if (F.some(f => f.t === 'abap.clnt') && !(F[0].t === 'abap.clnt' && F[0].k)) msgs.push(['warn', 'O campo de mandante deve ser o primeiro campo chave.']);
    if (!F.some(f => f.t === 'abap.clnt')) msgs.push(['warn', 'Sem campo abap.clnt a tabela é independente de mandante. Para dados de aplicação, inclua client como primeiro campo.']);
    const cuky = F.find(f => f.t === 'abap.cuky');
    if (F.some(f => f.t === 'abap.curr') && !cuky) msgs.push(['err', 'Campos abap.curr precisam referenciar um campo abap.cuky de moeda.']);
    $('#tb-msg', el).innerHTML = msgs.length ? msgs.map(m => strip(m[0], m[0] === 'err' ? '' : '', esc(m[1]))).join('') : strip('ok', '', 'Sem erros: a tabela pode ser ativada.');
    const w = Math.max(...F.map(f => f.n.length + (f.k ? 4 : 0)), 8);
    const typ = f => { const [a, b] = TYPES[f.t]; return f.t + (a ? `(${f.l || '?'}${b ? ',' + (f.d || '0') : ''})` : f.t === 'abap.string' ? '(0)' : ''); };
    let c = `@EndUserText.label : 'Tabela de estudo'\n@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE\n@AbapCatalog.tableCategory : #TRANSPARENT\n@AbapCatalog.deliveryClass : ${dc}\n@AbapCatalog.dataMaintenance : #RESTRICTED\ndefine table ${name} {\n`;
    F.forEach(f => {
      if (f.t === 'abap.curr' && cuky) c += `  @Semantics.amount.currencyCode : '${name}.${cuky.n}'\n`;
      c += `  ${((f.k ? 'key ' : '') + f.n).padEnd(w)} : ${typ(f)}${f.k ? ' not null' : ''};\n`;
    });
    c += '}';
    $('#tb-code', el).innerHTML = codeBlock(c, name.toUpperCase(), 'DDL');
  };
  $('#tb-add', el).addEventListener('click', () => { F.push({n: 'novo_campo_' + (F.length + 1), t: 'abap.char', l: '20', d: '', k: false}); rows(); gen(); });
  $('#tb-n', el).addEventListener('input', gen); $('#tb-dc', el).addEventListener('change', gen);
  rows(); gen();
},

/* ---------- Expressões de caminho ---------- */
pathlab(el){
  el.innerHTML = head('SELECT em ZI_Connection', '_Carrier [1..1] · _Flights [0..*]', '') + `<div class="wid">
    <div class="row">
      <div class="field" style="flex:0 1 10rem"><label for="pl-c">Companhia</label><select id="pl-c" class="in">${Object.keys(CARR).map(c => `<option ${c === 'LH' ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <label class="check" style="align-self:center"><input type="checkbox" id="pl-n" checked> _Carrier.Name</label>
      <label class="check" style="align-self:center"><input type="checkbox" id="pl-f"> _Flights.FlightDate</label>
      <div class="field" style="flex:0 1 16rem"><label for="pl-flt">Filtro em _Flights</label><select id="pl-flt" class="in"><option value="">(sem filtro)</option><option value="full">[ SeatsOccupied = 330 ]</option><option value="d">[1: FlightDate = '20261103' ]</option></select></div>
    </div><div id="pl-code"></div><div id="pl-out"></div></div>`;
  const draw = () => {
    const car = $('#pl-c', el).value, wn = $('#pl-n', el).checked, wf = $('#pl-f', el).checked, flt = $('#pl-flt', el).value;
    $('#pl-flt', el).disabled = !wf;
    const fexpr = flt === 'full' ? `_Flights[ SeatsOccupied = 330 ]` : flt === 'd' ? `_Flights[1: FlightDate = '20261103' ]` : '_Flights';
    const cols = ['CarrierId', 'ConnectionId', ...(wn ? ['CarrierName'] : []), ...(wf ? ['FlightDate'] : [])];
    let c = `define view entity ZI_ConnectionPaths\n  as select from ZI_Connection\n{\n  key CarrierId,\n  key ConnectionId,`;
    if (wn) c += `\n      _Carrier.Name as CarrierName,`;
    if (wf) c += `\n  key ${fexpr}.FlightDate as FlightDate,   // vira chave: multiplica linhas`;
    c = c.replace(/,$/, '') + `\n}\nwhere CarrierId = '${car}'`;
    $('#pl-code', el).innerHTML = codeBlock(c, 'Projeção com caminhos', 'CDS');
    const base = CONN.filter(r => r.carrier_id === car);
    let rows = [];
    base.forEach(r => {
      const o = {CarrierId: r.carrier_id, ConnectionId: r.connection_id}; if (wn) o.CarrierName = CARR[r.carrier_id];
      if (!wf){ rows.push(o); return; }
      const fl = FLIGHTS.filter(f => f.carrier_id === r.carrier_id && f.connection_id === r.connection_id && (flt !== 'full' || f.seats_occupied === 330) && (flt !== 'd' || f.flight_date === '20261103'));
      if (!fl.length) rows.push({...o, FlightDate: null}); else fl.forEach(f => rows.push({...o, FlightDate: fdate(f.flight_date)}));
    });
    const joins = [wn ? 'LEFT OUTER TO ONE JOIN ZI_Carrier' : '', wf ? 'LEFT OUTER (TO MANY) JOIN ZI_Flight' : ''].filter(Boolean);
    $('#pl-out', el).innerHTML = `<div class="statusline">${tag('', base.length + ' conexões na origem')}${tag(rows.length > base.length ? 'warn' : 'ok', rows.length + ' linhas no resultado')}${joins.length ? joins.map(j => tag('info', j)).join('') : tag('ok', 'nenhum join gerado')}</div>${table(cols, rows)}
      ${wf && rows.some(r => r.FlightDate == null) ? `<p class="note">Linhas com <i>null</i>: a associação gera LEFT OUTER JOIN, então conexões sem voo correspondente continuam no resultado.</p>` : ''}`;
  };
  $$('select,input', el).forEach(i => i.addEventListener('change', draw)); draw();
},

/* ---------- CASE em CDS ---------- */
caselab(el){
  el.innerHTML = head('Classificação por distância', 'ZI_Connection · 13 conexões', '') + `<div class="wid">
    <div class="row"><div class="field"><label for="cl-l">Longa se distance &gt;= <b id="cl-lv"></b> km</label><input id="cl-l" type="range" min="2000" max="13000" step="250" value="9000"></div>
    <div class="field"><label for="cl-m">Média se distance &gt;= <b id="cl-mv"></b> km</label><input id="cl-m" type="range" min="500" max="12000" step="250" value="4000"></div></div>
    <div id="cl-code"></div><div id="cl-out"></div></div>`;
  const draw = () => {
    let L = +$('#cl-l', el).value, M = +$('#cl-m', el).value;
    $('#cl-lv', el).textContent = fmtNum(L); $('#cl-mv', el).textContent = fmtNum(M);
    $('#cl-code', el).innerHTML = codeBlock(`case\n  when distance >= ${L} then 'Longa'\n  when distance >= ${M} then 'Média'\n  else 'Curta'\nend as DistanceCategory`, 'Elemento calculado', 'CDS');
    const cls = d => d >= L ? 'Longa' : d >= M ? 'Média' : 'Curta';
    const cnt = {Longa: 0, 'Média': 0, Curta: 0};
    const rows = CONN.map(r => { const k = cls(r.distance); cnt[k]++; return `<tr><td class="mono">${r.carrier_id} ${r.connection_id}</td><td class="mono">${r.airport_from_id} → ${r.airport_to_id}</td><td class="num">${fmtNum(r.distance)}</td><td>${tag(k === 'Longa' ? 'c5' : k === 'Média' ? 'info' : 'ok', k)}</td></tr>`; }).join('');
    $('#cl-out', el).innerHTML = `<div class="statusline">${tag('c5', 'Longa: ' + cnt.Longa)}${tag('info', 'Média: ' + cnt['Média'])}${tag('ok', 'Curta: ' + cnt.Curta)}</div>
      ${M > L ? strip('warn', '', 'O limite de “Média” está acima do de “Longa”: como o CASE para no primeiro WHEN verdadeiro, nenhuma linha cai em “Média” acima do limite de “Longa”. A ordem dos WHEN importa.') : ''}
      <div class="tbl-wrap"><table class="t"><thead><tr><th>Voo</th><th>Rota</th><th class="num">Distância (km)</th><th>DistanceCategory</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };
  $$('input', el).forEach(i => i.addEventListener('input', draw)); draw();
},

/* ---------- @UI e Fiori Elements ---------- */
uilab(el){
  const E = [
    {n: 'TravelId', lbl: 'Viagem', li: 10, sf: 10, on: true, sfon: true},
    {n: 'AgencyId', lbl: 'Agência', li: 20, sf: 20, on: false, sfon: true},
    {n: 'Description', lbl: 'Descrição', li: 30, sf: 30, on: true, sfon: false},
    {n: 'BeginDate', lbl: 'Início', li: 40, sf: 40, on: true, sfon: false},
    {n: 'TotalPrice', lbl: 'Preço total', li: 50, sf: 50, on: false, sfon: false},
    {n: 'Status', lbl: 'Status', li: 60, sf: 60, on: true, sfon: true}];
  const DATA = [
    {TravelId: '00000001', AgencyId: '070001', Description: 'Congresso em Lisboa', BeginDate: '10.11.2026', TotalPrice: '2.450,00 EUR', Status: 'A'},
    {TravelId: '00000002', AgencyId: '070005', Description: 'Feira em Frankfurt', BeginDate: '18.11.2026', TotalPrice: '3.120,00 EUR', Status: 'O'},
    {TravelId: '00000003', AgencyId: '070012', Description: 'Visita a cliente em Recife', BeginDate: '02.12.2026', TotalPrice: '980,00 EUR', Status: 'X'},
    {TravelId: '00000004', AgencyId: '070001', Description: 'Treinamento em Walldorf', BeginDate: '12.01.2027', TotalPrice: '1.870,00 EUR', Status: 'O'}];
  const ST = {A: ['ok', 'Aceita'], O: ['warn', 'Aberta'], X: ['err', 'Recusada']};
  el.innerHTML = head('Metadata extension ao vivo', 'annotate entity ZC_Travel', '') + `<div class="wid"><div class="wid-split">
    <div class="tbl-wrap"><table class="t"><thead><tr><th>Elemento</th><th>@UI.lineItem</th><th>position</th><th>@UI.selectionField</th></tr></thead><tbody>${E.map((e, i) => `<tr><td class="mono">${e.n}</td><td><input type="checkbox" data-i="${i}" data-k="on" ${e.on ? 'checked' : ''} aria-label="lineItem ${e.n}"></td><td><input class="in mono" style="width:4.5rem;height:1.75rem" type="number" step="10" data-i="${i}" data-k="li" value="${e.li}" aria-label="posição ${e.n}"></td><td><input type="checkbox" data-i="${i}" data-k="sfon" ${e.sfon ? 'checked' : ''} aria-label="selectionField ${e.n}"></td></tr>`).join('')}</tbody></table></div>
    <div id="ui-code" style="min-width:0"></div></div>
    <div class="preview" id="ui-prev"></div></div>`;
  const draw = () => {
    let c = `@Metadata.layer: #CUSTOMER\nannotate entity ZC_Travel with\n{`;
    E.forEach(e => { if (!e.on && !e.sfon) return; c += '\n'; if (e.on) c += `  @UI.lineItem: [{ position: ${e.li} }]\n`; if (e.sfon) c += `  @UI.selectionField: [{ position: ${e.sf} }]\n`; c += `  ${e.n};\n`; });
    c += '}';
    $('#ui-code', el).innerHTML = codeBlock(c, 'ZC_TRAVEL (DDLX)', 'CDS');
    const cols = E.filter(e => e.on).sort((a, b) => a.li - b.li), sfs = E.filter(e => e.sfon).sort((a, b) => a.sf - b.sf);
    $('#ui-prev', el).innerHTML = `<div class="mini-shell">${ICON('')} Viagens <span class="tag" style="margin-left:auto">Preview Fiori Elements</span></div>
      <div class="fio-bar">${sfs.map(s => `<div class="field" style="flex:0 1 9rem"><span class="lbl">${esc(s.lbl)}</span><input class="in" disabled aria-label="${esc(s.lbl)}"></div>`).join('') || '<span class="note">Sem filtros: nenhum @UI.selectionField.</span>'}<button class="btn emph sm">Go</button></div>
      <div style="background:var(--sapBaseColor)"><div class="fio-title">Viagens (${DATA.length})</div>${cols.length ? `<div class="tbl-wrap"><table class="t fio-table"><thead><tr>${cols.map(c => `<th>${esc(c.lbl)}</th>`).join('')}</tr></thead><tbody>${DATA.map(r => `<tr>${cols.map(c => `<td>${c.n === 'Status' ? tag(ST[r.Status][0], ST[r.Status][1]) : esc(r[c.n])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<div class="empty">A tabela não tem colunas. Marque @UI.lineItem em algum elemento.</div>'}</div>`;
  };
  $$('[data-k]', el).forEach(inp => inp.addEventListener(inp.type === 'checkbox' ? 'change' : 'input', () => { const e = E[+inp.dataset.i]; if (inp.type === 'checkbox') e[inp.dataset.k] = inp.checked; else e.li = parseInt(inp.value || '0', 10); draw(); }));
  draw();
}
};

function mountWidgets(root){
  $$('[data-widget]', root).forEach(el => { const f = WIDGETS[el.dataset.widget]; if (f){ try { f(el); } catch(e){ el.innerHTML = `<div class="wid">${strip('err', '', 'Não foi possível carregar este laboratório.')}</div>`; console.error(e); } } });
}

/* ============================================================
   Inicialização
   ============================================================ */
buildNav(); updateProgress();
addEventListener('hashchange', route);
route();
