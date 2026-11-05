
/* ============================================================
   Utilitários
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ICON = cp => `<span class="ic" aria-hidden="true">${cp}</span>`;
const store = {
  get(k, d){ try { const v = localStorage.getItem('trilha-abap:' + k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem('trilha-abap:' + k, JSON.stringify(v)); } catch(e){} }
};
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2200); }
async function copyText(txt, btn){
  try { await navigator.clipboard.writeText(txt); toast('Código copiado'); }
  catch(e){
    const pre = btn.closest('.code').querySelector('pre');
    const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    toast('Selecionado: use Ctrl+C para copiar');
  }
}

/* ============================================================
   Realce de sintaxe ABAP / CDS
   ============================================================ */
const ABAP_KW = new Set(('ABSTRACT ADD ALIASES ALIGN ALL AND APPEND APPENDING AS ASCENDING ASSIGNING AT AUTHORITY-CHECK AVG BASE BEGIN BINARY BY CASE CAST CATCH CHANGING CHECK CLASS CLASS-DATA CLASS-METHODS CLEANUP CLEAR COMMIT COMPONENTS CONSTANTS CONSTRUCTOR CONTINUE CONV CORRESPONDING COUNT CREATE DATA DATE DECIMALS DEFAULT DEFINITION DELETE DESCENDING DISTINCT DIV DO DURATION ELSE ELSEIF END END-OF-DEFINITION ENDCASE ENDCLASS ENDDO ENDIF ENDLOOP ENDMETHOD ENDTRY ENDWHILE ENTITIES ENTITY EQ EXACT EXCEPT EXCEPTION EXIT EXPORTING FAILED FIELD FIELD-SYMBOL FIELD-SYMBOLS FIELDS FINAL FIND FIRST FOR FROM GROUP HASHED HAVING ID IF IMPLEMENTATION IMPORTING IN INCLUDE INHERITING INITIAL INNER INSERT INSTANCE INTERFACE INTERFACES INTO IS JOIN KEY LEFT LENGTH LIKE LINE LINES LOOP MAPPING MAX METHOD METHODS MIN MOD MODIFY NEW NO NON-UNIQUE NOT NUMBER OBJECT OCCURRENCES OF OFFSET ON OPTIONAL OR ORDER OTHERS OUTER PAD PCRE PRIVATE PROTECTED PUBLIC RAISE RAISING READ READ-ONLY REDEFINITION REF REFERENCE REPORTED RESPONSE RESULT RESULTS RETURNING RIGHT RISK LEVEL ROLLBACK ROWS SECTION SELECT SET SHORT SINGLE SORT SORTED STANDARD STATIC SUM TABLE TESTING THEN TIMES TO TRANSPORTING TRY TYPE TYPES UNIQUE UP UPDATE USER USING VALUE WHEN WHERE WHILE WIDTH WITH HARMLESS BOUND ISO UPPER INNER CENTER').split(' '));
const CDS_KW = new Set(('define view entity as select from key association to on where group by having case when then else end cast with parameters annotate extend table not null grant aspect role managed implementation in class unique strict persistent lock master authorization etag create update delete field readonly numbering determination validation modify save action result instance and or inner join left outer of projection root composition redefine service expose provider contract use alias').split(' '));
const ABAP_TYPES = new Set('i int8 p c n d t string xstring decfloat34 decfloat16 f abap_bool'.split(' '));
const TOKEN_RE = /(^\*.*$)|("[^\n]*$)|(\/\/[^\n]*$)|(\/\*[\s\S]*?\*\/)|('(?:[^'\n]|'')*')|(`(?:[^`\n]|``)*`)|(\|(?:[^|\\\n]|\\.)*\|)|(@[A-Za-z][\w.]*)|(\bsy-\w+)|(\$(?:projection|parameters|session)[\w.]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_\/][\w\/]*(?:-[A-Za-z]+)*)/gm;
function hl(code, lang){
  const cds = lang && lang !== 'ABAP';
  let out = '', last = 0, prev = '';
  code.replace(TOKEN_RE, (m, star, q, sl, ml, s1, s2, tpl, ann, sy, dol, num, word, off) => {
    out += esc(code.slice(last, off)); last = off + m.length;
    if (star || q || sl || ml) out += `<span class="c">${esc(m)}</span>`;
    else if (s1 || s2) out += `<span class="s">${esc(m)}</span>`;
    else if (tpl) out += `<span class="tp">${esc(m)}</span>`;
    else if (ann || dol) out += `<span class="y">${esc(m)}</span>`;
    else if (sy) out += `<span class="y">${esc(m)}</span>`;
    else if (num) out += `<span class="n">${esc(m)}</span>`;
    else if (word){
      let cls = '';
      if (cds){ if (CDS_KW.has(word.toLowerCase()) && word === word.toLowerCase()) cls = 'k'; }
      else if (ABAP_KW.has(word)) cls = 'k';
      else if (ABAP_TYPES.has(word) && /^(TYPE|CONV|EXACT|OF)$/.test(prev)) cls = 'y';
      out += cls ? `<span class="${cls}">${esc(m)}</span>` : esc(m);
      prev = word;
      return m;
    }
    else out += esc(m);
    return m;
  });
  return out + esc(code.slice(last));
}
const hlLines = (code, lang) => code.split('\n').map(l => hl(l, lang));
function codeBlock(code, title, lang = 'ABAP'){
  return `<div class="code"><div class="code-h"><b>${esc(title)}</b><span>${esc(lang)}</span><button class="btn trans sm" data-copy>${ICON('')}Copiar</button></div><pre><code>${hl(code, lang)}</code></pre></div>`;
}
function enhanceCode(root){
  $$('pre[data-abap]', root).forEach(pre => {
    const txt = pre.textContent.replace(/^\n/, '').replace(/\s+$/, '');
    const wrap = document.createElement('div');
    wrap.innerHTML = codeBlock(txt, pre.dataset.title || 'ABAP', pre.dataset.lang || 'ABAP');
    pre.replaceWith(wrap.firstChild);
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]');
  if (b){ copyText(b.closest('.code').querySelector('pre').textContent, b); }
});

/* ============================================================
   Progresso e tema
   ============================================================ */
let done = new Set(store.get('done', []));
function setDone(id, v){ v ? done.add(id) : done.delete(id); store.set('done', [...done]); updateProgress(); }
function updateProgress(){
  const n = LESSONS.filter(l => done.has(l.id)).length, tot = LESSONS.length;
  $('#ringFg').setAttribute('stroke-dasharray', `${(n / tot * 94.25).toFixed(2)} 94.25`);
  $('#progTxt').textContent = `${n} de ${tot} lições`;
  $$('.nav-item[data-id]').forEach(a => { const d = a.querySelector('.done'); if (d) d.hidden = !done.has(a.dataset.id); });
}
function effectiveDark(){
  const t = document.documentElement.getAttribute('data-theme');
  if (t) return t === 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}
function syncThemeIcon(){ $('#themeIc').innerHTML = effectiveDark() ? '' : ''; $('#themeBtn').setAttribute('aria-label', effectiveDark() ? 'Mudar para tema claro (Morning Horizon)' : 'Mudar para tema escuro (Evening Horizon)'); }
(function initTheme(){
  const saved = store.get('theme', null);
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  syncThemeIcon();
  $('#themeBtn').addEventListener('click', () => {
    const next = effectiveDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); store.set('theme', next); syncThemeIcon();
  });
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeIcon); } catch(e){}
  try { new MutationObserver(syncThemeIcon).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']}); } catch(e){}
})();

/* ============================================================
   Navegação lateral
   ============================================================ */
const closedGroups = new Set(store.get('closed', []));
function buildNav(){
  let h = `<ul><li><a class="nav-item nav-top" href="#inicio" data-route="inicio">${ICON('')}Início</a></li></ul>`;
  COURSES.forEach(c => {
    h += `<div class="nav-group ${closedGroups.has(c.id) ? 'closed' : ''}" data-g="${c.id}"><button aria-expanded="${!closedGroups.has(c.id)}"><span>Curso ${c.n}<small>${esc(c.title)}</small></span><span class="ic chev" aria-hidden="true"></span></button><ul>`;
    LESSONS.filter(l => l.c === c.n).forEach((l, i) => {
      h += `<li><a class="nav-item" href="#${l.id}" data-route="${l.id}" data-id="${l.id}"><span class="num">${String(i + 1).padStart(2, '0')}</span><span>${esc(l.title)}</span><span class="ic done" aria-label="concluída" hidden></span></a></li>`;
    });
    h += `</ul></div>`;
  });
  h += `<div class="nav-group" data-g="rec"><button aria-expanded="true"><span>Recursos<small>Revisão e prática</small></span><span class="ic chev" aria-hidden="true"></span></button><ul>
    <li><a class="nav-item nav-top" href="#referencia" data-route="referencia">${ICON('')}Referência rápida</a></li>
    <li><a class="nav-item nav-top" href="#simulado" data-route="simulado">${ICON('')}Simulado de certificação</a></li></ul></div>`;
  $('#sidenav').innerHTML = h;
  $$('.nav-group>button', $('#sidenav')).forEach(b => b.addEventListener('click', () => {
    const g = b.parentElement; g.classList.toggle('closed'); b.setAttribute('aria-expanded', !g.classList.contains('closed'));
    g.classList.contains('closed') ? closedGroups.add(g.dataset.g) : closedGroups.delete(g.dataset.g); store.set('closed', [...closedGroups]);
  }));
  $('#sidenav').addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });
}
function openNav(){ document.body.classList.add('nav-open'); $('#menuBtn').setAttribute('aria-expanded', 'true'); }
function closeNav(){ document.body.classList.remove('nav-open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
$('#menuBtn').addEventListener('click', () => document.body.classList.contains('nav-open') ? closeNav() : openNav());
$('#scrim').addEventListener('click', closeNav);

/* ============================================================
   Pesquisa
   ============================================================ */
(function initSearch(){
  const q = $('#q'), box = $('#sres'), wrapper = $('#search');
  const idx = [
    ...LESSONS.map(l => ({t:l.title, s:`Curso ${l.c} · ${l.sub}`, r:l.id, hay:(l.title + ' ' + l.sub + ' ' + l.obj.join(' ') + ' ' + l.kw).toLowerCase()})),
    ...REF.map(r => ({t:r[1], s:`Referência · ${r[2]}`, r:r[3], hay:(r[1] + ' ' + r[2] + ' ' + r[0]).toLowerCase()})),
    {t:'Referência rápida', s:'Sintaxe e glossário', r:'referencia', hay:'referência glossário cheat sheet sintaxe'},
    {t:'Simulado de certificação', s:'15 questões, nota mínima 65%', r:'simulado', hay:'simulado certificação prova exame quiz'}
  ];
  let cur = 0, items = [];
  function render(){
    const v = q.value.trim().toLowerCase();
    if (!v){ box.hidden = true; return; }
    const terms = v.split(/\s+/);
    items = idx.filter(i => terms.every(t => i.hay.includes(t))).slice(0, 8);
    cur = 0;
    box.innerHTML = items.length ? items.map((i, n) => `<a href="#${i.r}" class="${n === 0 ? 'cur' : ''}"><span>${esc(i.t)}</span><small>${esc(i.s)}</small></a>`).join('') : `<div class="none">Nada encontrado para “${esc(q.value)}”. Tente “select”, “exceção” ou “cds”.</div>`;
    box.hidden = false;
  }
  q.addEventListener('input', render);
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault(); if (!items.length) return;
      cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      $$('a', box).forEach((a, n) => a.classList.toggle('cur', n === cur));
    } else if (e.key === 'Enter' && items[cur]){ location.hash = items[cur].r; done_(); }
    else if (e.key === 'Escape'){ done_(); }
  });
  function done_(){ q.value = ''; box.hidden = true; wrapper.classList.remove('show'); q.blur(); }
  box.addEventListener('click', e => { if (e.target.closest('a')) setTimeout(done_, 0); });
  document.addEventListener('click', e => { if (!wrapper.contains(e.target) && e.target.closest('#searchBtn') == null){ box.hidden = true; wrapper.classList.remove('show'); } });
  $('#searchBtn').addEventListener('click', () => { wrapper.classList.add('show'); q.focus(); });
})();

/* ============================================================
   Quiz
   ============================================================ */
function quizHTML(list, name){
  return `<div class="quiz" data-quiz="${name}">` + list.map((x, i) => `
    ${i ? '<div class="qsep"></div>' : ''}<div class="q" data-a="${x.a}">
      <p class="qt">${i + 1}. ${esc(x.q)}</p>
      <div class="opts" role="group" aria-label="Opções da questão ${i + 1}">${x.o.map((o, j) => `<button class="opt" data-j="${j}"><span class="dot"></span><span>${esc(o)}</span></button>`).join('')}</div>
      <p class="why" hidden>${esc(x.why)}</p></div>`).join('') + `<div class="strip" data-qres hidden></div></div>`;
}
function bindQuiz(root){
  $$('.quiz', root).forEach(qz => {
    const total = $$('.q', qz).length; let answered = 0, right = 0;
    $$('.q', qz).forEach(q => {
      const a = +q.dataset.a;
      $$('.opt', q).forEach(btn => btn.addEventListener('click', () => {
        if (q.dataset.done) return; q.dataset.done = 1; answered++;
        const j = +btn.dataset.j;
        $$('.opt', q).forEach((o, k) => { o.disabled = true; if (k === a){ o.classList.add('right'); o.querySelector('.dot').textContent = '✓'; } });
        if (j !== a){ btn.classList.add('wrong'); btn.querySelector('.dot').textContent = '✕'; } else right++;
        q.querySelector('.why').hidden = false;
        if (answered === total){
          const r = qz.querySelector('[data-qres]'); r.hidden = false;
          const ok = right === total;
          r.className = 'strip ' + (ok ? 'ok' : right >= total / 2 ? '' : 'warn');
          r.innerHTML = `${ICON(ok ? '' : '')}<p><b>${right} de ${total} corretas.</b> ${ok ? 'Você pode marcar esta lição como concluída.' : 'Revise as explicações acima e tente o simulado depois.'}</p>`;
        }
      }));
    });
  });
}

/* ============================================================
   Ilustração da página inicial
   ============================================================ */
const HERO_SVG = `<svg class="illu" viewBox="0 0 420 300" role="img" aria-labelledby="herot"><title id="herot">Ilustração: notebook com código ABAP cercado por uma tabela, um cubo de dados e um selo de aprovação</title>
<ellipse cx="210" cy="270" rx="170" ry="16" class="f6" opacity=".6"/>
<path d="M60 150c0-80 70-130 150-130s160 50 160 120-60 120-160 120S60 230 60 150z" class="f7"/>
<g transform="translate(96 78)">
  <rect x="0" y="0" width="228" height="148" rx="12" class="f4"/>
  <rect x="10" y="10" width="208" height="128" rx="6" class="f8"/>
  <rect x="22" y="24" width="38" height="8" rx="4" class="f13"/><rect x="66" y="24" width="70" height="8" rx="4" class="f20"/>
  <rect x="34" y="42" width="56" height="8" rx="4" class="f13"/><rect x="96" y="42" width="84" height="8" rx="4" class="f2"/>
  <rect x="34" y="60" width="34" height="8" rx="4" class="f14"/><rect x="74" y="60" width="104" height="8" rx="4" class="f3"/>
  <rect x="46" y="78" width="120" height="8" rx="4" class="f20"/>
  <rect x="34" y="96" width="62" height="8" rx="4" class="f13"/>
  <rect x="22" y="114" width="48" height="8" rx="4" class="f13"/>
  <rect x="-24" y="148" width="276" height="14" rx="7" class="f5"/>
  <rect x="88" y="148" width="52" height="6" rx="3" class="f6"/>
</g>
<g transform="translate(28 46)">
  <rect width="104" height="78" rx="10" class="f8" stroke-width="1.5" style="stroke:var(--ill5)"/>
  <rect width="104" height="20" rx="10" class="f21"/><rect y="10" width="104" height="10" class="f21"/>
  <g class="f18"><rect x="10" y="30" width="38" height="8" rx="3"/><rect x="56" y="30" width="38" height="8" rx="3"/><rect x="10" y="46" width="38" height="8" rx="3"/><rect x="56" y="46" width="38" height="8" rx="3"/><rect x="10" y="62" width="38" height="8" rx="3"/><rect x="56" y="62" width="38" height="8" rx="3"/></g>
</g>
<g transform="translate(316 40)">
  <path d="M34 0l34 18v38L34 74 0 56V18z" class="f20"/><path d="M34 0l34 18-34 18L0 18z" class="f2"/><path d="M34 36v38L0 56V18z" class="f21"/>
</g>
<g transform="translate(330 176)"><circle r="30" class="f12" style="fill:var(--sapPositiveColor)"/><path d="M-13 1l9 9 17-19" fill="none" stroke="var(--sapBaseColor)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
<g class="f26"><path d="M70 196l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M262 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><circle cx="378" cy="128" r="5"/></g>
<g transform="translate(44 228)"><rect width="66" height="26" rx="13" class="f3"/><text x="33" y="17" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">SELECT</text></g>
<g transform="translate(250 240)"><rect width="56" height="24" rx="12" class="f9"/><text x="28" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">CDS</text></g>
</svg>`;

/* ============================================================
   Páginas
   ============================================================ */
function courseStats(c){
  const ls = LESSONS.filter(l => l.c === c.n);
  return {ls, n: ls.length, d: ls.filter(l => done.has(l.id)).length};
}
function nextLesson(){ return LESSONS.find(l => !done.has(l.id)); }

function pageHome(){
  const nl = nextLesson();
  const tiles = COURSES.map(c => { const s = courseStats(c); return `
    <a class="tile" href="#${s.ls[0].id}">
      <div style="display:flex;align-items:center;gap:.625rem"><span class="avatar" style="width:2.5rem;height:2.5rem;font-size:1.125rem;border-radius:.75rem;background:${c.bg};color:${c.color}">${ICON(c.icon)}</span><span class="tag">Curso ${c.n}</span></div>
      <h3>${esc(c.title)}</h3><p style="font-style:italic">${esc(c.en)}</p><p>${esc(c.desc)}</p>
      <div class="foot"><span class="kpi">${s.d}<small> / ${s.n} lições</small></span></div>
      <div class="bar" aria-hidden="true"><i style="width:${s.d / s.n * 100}%"></i></div>
    </a>`; }).join('');
  const trail = COURSES.map(c => `<div class="card obj"><span class="tag" style="background:${c.bg};color:${c.color}">Curso ${c.n}</span><h3>${esc(c.title)}</h3><ol class="trail">` +
    LESSONS.filter(l => l.c === c.n).map(l => `<li class="${done.has(l.id) ? 'ok' : ''}"><a href="#${l.id}"><span class="node">${done.has(l.id) ? '' : ''}</span><span><b>${esc(l.title)}</b><small>Unidade ${esc(l.u)} · ${esc(l.dur)}</small></span></a></li>`).join('') + `</ol></div>`).join('');
  return `<div class="page">
  <section class="hero"><div class="wrap hero-in">
    <div class="hero-c">
      <span class="eyebrow">Acquiring Core ABAP Skills · ABAP Cloud</span>
      <h1>Aprenda ABAP do Hello World ao RAP</h1>
      <p class="lead">Um guia de estudo em português que segue a trilha oficial da SAP Learning em 22 lições, com código comentado, laboratórios interativos e quizzes. Cada lição aponta para a documentação ABAP oficial.</p>
      <div class="hero-act">
        <a class="btn emph" href="#${nl ? nl.id : 'simulado'}">${ICON('')}${done.size ? 'Continuar: ' + esc(nl ? nl.title : 'simulado') : 'Começar pela primeira lição'}</a>
        <a class="btn" href="#simulado">${ICON('')}Fazer o simulado</a>
      </div>
    </div>
    <div class="hero-art">${HERO_SVG}</div>
  </div></section>
  <div class="wrap body">
    <section class="sec"><h2>${ICON('')}Percurso de aprendizagem</h2>
      <div class="tiles">${tiles}</div></section>
    <section class="sec"><h2>${ICON('')}Mapa da trilha</h2>
      <div class="grid3">${trail}</div></section>
    <section class="sec"><h2>${ICON('')}Por onde começar?</h2>
      <div class="grid3">
        <div class="card obj"><span class="tag info">Iniciante</span><h3>Nunca programou em ABAP</h3><p class="note">Siga o Curso 1 em ordem. Faça os laboratórios de cada lição antes do quiz.</p><a href="#primeiros-passos">Primeiros passos ${ICON('')}</a></div>
        <div class="card obj"><span class="tag c5">ABAP clássico</span><h3>Já conhece ABAP on-premise</h3><p class="note">Revise o que muda no ABAP Cloud e vá direto para EML, RAP e CDS.</p><a href="#business-objects">Business objects e EML ${ICON('')}</a></div>
        <div class="card obj"><span class="tag c7">Certificação</span><h3>Preparando o exame</h3><p class="note">Use o Curso 2 para aprofundar e treine com o simulado: nota mínima de 65%, como na prova real.</p><a href="#simulado">Simulado ${ICON('')}</a></div>
      </div></section>
    <section class="sec"><h2>${ICON('')}Como usar este guia</h2>
      <div class="grid2">
        <div class="card"><ul class="objectives" style="grid-template-columns:1fr">
          <li>${ICON('')}<span>Cada lição corresponde a uma unidade da trilha <i>Acquiring Core ABAP Skills</i>, com a duração estimada pela SAP Learning.</span></li>
          <li>${ICON('')}<span>Os blocos de código têm botão de copiar e seguem a sintaxe do ABAP Cloud, prontos para colar no ADT.</span></li>
          <li>${ICON('')}<span>Laboratórios simulam o comportamento do ABAP no navegador. Eles ajudam a prever o resultado; confirme sempre no sistema.</span></li>
          <li>${ICON('')}<span>Marque a lição como concluída. O progresso fica salvo neste navegador.</span></li>
        </ul></div>
        <div class="card obj"><h3>Fontes</h3><ul class="links">
          <li>${ICON('')}<a href="${LJ}" target="_blank" rel="noopener">SAP Learning: Acquiring Core ABAP Skills</a></li>
          <li>${ICON('')}<a href="${KD_CLOUD}" target="_blank" rel="noopener">ABAP Keyword Documentation (ABAP Cloud)</a></li>
          <li>${ICON('')}<a href="https://github.com/SAP-samples/abap-cheat-sheets" target="_blank" rel="noopener">ABAP cheat sheets (SAP-samples)</a></li>
          <li>${ICON('')}<a href="https://bmoreiraribeiro.github.io/ABAP/" target="_blank" rel="noopener">Almanaque ABAP: inspiração de estrutura</a></li>
        </ul><p class="note">Projeto de estudo independente, sem vínculo com a SAP. Design baseado no SAP Horizon.</p></div>
      </div></section>
  </div></div>`;
}

function pageLesson(l){
  const c = COURSES[l.c - 1];
  const tpl = document.getElementById('L-' + l.id);
  const prev = LESSONS[l.idx - 1], next = LESSONS[l.idx + 1];
  const isDone = done.has(l.id);
  const page = document.createElement('div');
  page.className = 'page';
  page.innerHTML = `
  <header class="oph">
    <div class="oph-in">
      <div class="avatar" style="background:${c.bg};color:${c.color}">${ICON(l.icon)}</div>
      <div class="oph-main">
        <nav class="crumbs" aria-label="Trilha"><a href="#inicio">Início</a><span>/</span><span>Curso ${c.n} · ${esc(c.title)}</span></nav>
        <h1>${esc(l.title)}</h1>
        <p class="sub">${esc(l.sub)}</p>
        <div class="attrs">
          <div class="attr"><span>Unidade SAP Learning</span><b>${esc(c.en)} · ${esc(l.u)}</b></div>
          <div class="attr"><span>Duração estimada</span><b>${esc(l.dur)}</b></div>
          <div class="attr"><span>Status</span><b data-status>${isDone ? '<span class="tag ok">' + ICON('') + 'Concluída</span>' : '<span class="tag">Não iniciada</span>'}</b></div>
        </div>
      </div>
      <div class="oph-act"><button class="btn ${isDone ? 'ok' : 'emph'}" data-mark>${ICON(isDone ? '' : '')}${isDone ? 'Concluída' : 'Marcar como concluída'}</button></div>
    </div>
    <div class="wrap"><nav class="anchors" aria-label="Seções da lição"></nav></div>
  </header>
  <div class="wrap body">
    <section class="sec" id="s-obj" data-anchor="Objetivos">
      <div class="card"><h2 style="font-size:1rem;margin-bottom:.75rem">Ao final desta lição você será capaz de</h2>
      <ul class="objectives">${l.obj.map(o => `<li>${ICON('')}<span>${esc(o)}</span></li>`).join('')}</ul></div>
    </section>
    <div data-slot></div>
    <section class="sec" id="s-quiz" data-anchor="Quiz">
      <h2>${ICON('')}Verifique o que aprendeu</h2>
      <div class="card">${quizHTML(QUIZ[l.id], l.id)}</div>
    </section>
    <section class="sec" id="s-docs" data-anchor="Documentação">
      <h2>${ICON('')}Documentação oficial</h2>
      <div class="card"><ul class="links">
        ${l.docs.map(d => `<li>${ICON('')}<a href="${d[1]}" target="_blank" rel="noopener">${esc(d[0])}</a></li>`).join('')}
        <li>${ICON('')}<a href="${LJ}" target="_blank" rel="noopener">SAP Learning: ${esc(c.en)}, unidade ${esc(l.u)}</a></li>
      </ul></div>
    </section>
    <nav class="pager" aria-label="Lição anterior e próxima">
      ${prev ? `<a href="#${prev.id}"><small>${ICON('')} Anterior</small><b>${esc(prev.title)}</b></a>` : `<a href="#inicio"><small>${ICON('')} Voltar</small><b>Início</b></a>`}
      ${next ? `<a class="next" href="#${next.id}"><small>Próxima ${ICON('')}</small><b>${esc(next.title)}</b></a>` : `<a class="next" href="#simulado"><small>Próximo ${ICON('')}</small><b>Simulado de certificação</b></a>`}
    </nav>
  </div>`;
  if (tpl) page.querySelector('[data-slot]').replaceWith(tpl.content.cloneNode(true));
  return page;
}

function pageRef(){
  const cats = [...new Set(REF.map(r => r[0]))];
  return `<div class="page"><header class="oph"><div class="oph-in"><div class="avatar" style="background:var(--sapAccentBg6);color:var(--sapIndication5)">${ICON('')}</div><div class="oph-main">
    <nav class="crumbs"><a href="#inicio">Início</a><span>/</span><span>Recursos</span></nav><h1>Referência rápida</h1><p class="sub">Sintaxe essencial do ABAP Cloud e de CDS em uma página, com link para a lição de cada item.</p></div></div></header>
  <div class="wrap body">
    <section class="sec"><div class="row">
      <div class="field" style="flex:2 1 16rem"><label for="refq">Filtrar</label><input class="in" id="refq" type="search" placeholder="ex.: loop, join, exceção"></div>
      <div class="field" style="flex:3 1 20rem"><span class="lbl">Categoria</span><div class="seg" id="refcat"><button aria-pressed="true" data-c="">Todas</button>${cats.map(c => `<button aria-pressed="false" data-c="${c}">${c}</button>`).join('')}</div></div>
    </div>
    <div class="card flush"><div class="tbl-wrap"><table class="t"><thead><tr><th>Categoria</th><th>Sintaxe</th><th>O que faz</th><th>Lição</th></tr></thead><tbody id="refbody"></tbody></table></div></div></section>
    <section class="sec"><h2>${ICON('')}Glossário</h2><div class="card"><dl class="kv">${GLOSS.map(g => `<dt><b>${esc(g[0])}</b></dt><dd>${esc(g[1])}</dd>`).join('')}</dl></div></section>
    <section class="sec"><h2>${ICON('')}Documentação oficial</h2><div class="card"><ul class="links">
      <li>${ICON('')}<a href="${KD_CLOUD}" target="_blank" rel="noopener">ABAP Keyword Documentation · ABAP Cloud</a></li>
      <li>${ICON('')}<a href="${KD('index')}" target="_blank" rel="noopener">ABAP Keyword Documentation · versão mais recente</a></li>
      <li>${ICON('')}<a href="https://github.com/SAP-samples/abap-cheat-sheets" target="_blank" rel="noopener">ABAP cheat sheets (SAP-samples, GitHub)</a></li>
      <li>${ICON('')}<a href="${LJ}" target="_blank" rel="noopener">SAP Learning: Acquiring Core ABAP Skills</a></li></ul></div></section>
  </div></div>`;
}
function bindRef(){
  let cat = '';
  const draw = () => {
    const v = $('#refq').value.trim().toLowerCase();
    const rows = REF.filter(r => (!cat || r[0] === cat) && (!v || (r[1] + ' ' + r[2]).toLowerCase().includes(v)));
    $('#refbody').innerHTML = rows.length ? rows.map(r => { const l = LESSONS.find(x => x.id === r[3]); return `<tr><td><span class="ref-cat">${r[0]}</span></td><td class="mono" style="min-width:16rem">${hl(r[1], r[0] === 'CDS' ? 'CDS' : 'ABAP')}</td><td>${esc(r[2])}</td><td><a href="#${r[3]}">${esc(l.title)}</a></td></tr>`; }).join('') : `<tr><td colspan="4" class="empty">Nenhum item corresponde ao filtro.</td></tr>`;
  };
  $('#refq').addEventListener('input', draw);
  $$('#refcat button').forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; $$('#refcat button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); }));
  draw();
}

/* ---------- Simulado ---------- */
const SIM = { qs: [], i: 0, ans: [], finished: false };
function newSim(){
  const pool = [];
  LESSONS.forEach(l => QUIZ[l.id].forEach(q => pool.push({...q, l: l.id, c: l.c})));
  for (let i = pool.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  SIM.qs = pool.slice(0, 15); SIM.i = 0; SIM.ans = Array(15).fill(null); SIM.finished = false;
}
function pageSim(){
  return `<div class="page"><header class="oph"><div class="oph-in"><div class="avatar" style="background:var(--sapAccentBg5);color:var(--sapIndication7)">${ICON('')}</div><div class="oph-main">
    <nav class="crumbs"><a href="#inicio">Início</a><span>/</span><span>Recursos</span></nav><h1>Simulado de certificação</h1>
    <p class="sub">15 questões sorteadas das 22 lições. Como no exame SAP real, a nota mínima é 65%. Você revisa as respostas no final.</p></div>
    <div class="oph-act"><button class="btn" data-sim-new>${ICON('')}Novo sorteio</button></div></div></header>
  <div class="wrap body"><section class="sec"><div class="card" id="simbox"></div></section></div></div>`;
}
function drawSim(){
  const box = $('#simbox'); if (!box) return;
  if (SIM.finished){
    const right = SIM.qs.filter((q, i) => SIM.ans[i] === q.a).length, pct = Math.round(right / SIM.qs.length * 100), ok = pct >= 65;
    const byC = COURSES.map(c => { const qs = SIM.qs.map((q, i) => [q, i]).filter(([q]) => q.c === c.n); const r = qs.filter(([q, i]) => SIM.ans[i] === q.a).length; return {c, n: qs.length, r}; });
    box.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:2rem;align-items:center">
      <div><div class="score" style="color:${ok ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)'}">${pct}%</div><div class="note">${right} de ${SIM.qs.length} corretas</div></div>
      <span class="tag ${ok ? 'ok' : 'err'}" style="font-size:.875rem;padding:.25rem .75rem">${ICON(ok ? '' : '')}${ok ? 'Aprovado' : 'Abaixo de 65%'}</span>
      <div style="flex:1 1 16rem;display:flex;flex-direction:column;gap:.5rem">${byC.map(x => `<div><div style="display:flex;justify-content:space-between;font-size:.8125rem"><span>Curso ${x.c.n} · ${esc(x.c.title)}</span><b>${x.r}/${x.n}</b></div><div class="bar"><i style="width:${x.n ? x.r / x.n * 100 : 0}%;background:${x.c.color}"></i></div></div>`).join('')}</div>
      <button class="btn emph" data-sim-new>${ICON('')}Novo simulado</button></div>
      <div class="qsep" style="margin:1.25rem 0"></div><h3 style="margin-bottom:.75rem">Revisão</h3>
      <div class="quiz">${SIM.qs.map((q, i) => { const l = LESSONS.find(x => x.id === q.l); const ok = SIM.ans[i] === q.a; return `<div class="q"><p class="qt">${i + 1}. ${esc(q.q)} <span class="tag ${ok ? 'ok' : 'err'}">${ok ? 'certa' : SIM.ans[i] == null ? 'em branco' : 'errada'}</span></p>
        <div class="opts">${q.o.map((o, j) => `<div class="opt ${j === q.a ? 'right' : j === SIM.ans[i] ? 'wrong' : ''}"><span class="dot">${j === q.a ? '✓' : j === SIM.ans[i] ? '✕' : ''}</span><span>${esc(o)}</span></div>`).join('')}</div>
        <p class="why">${esc(q.why)} <a href="#${l.id}">Rever: ${esc(l.title)}</a></p></div>`; }).join('<div class="qsep"></div>')}</div>`;
    return;
  }
  const q = SIM.qs[SIM.i], l = LESSONS.find(x => x.id === q.l), answered = SIM.ans.filter(a => a != null).length;
  box.innerHTML = `<div style="display:flex;flex-direction:column;gap:1rem">
    <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center"><b>Questão ${SIM.i + 1} de ${SIM.qs.length}</b><span class="note">Tema: ${esc(l.title)} · respondidas ${answered}/${SIM.qs.length}</span></div>
    <div class="bar"><i style="width:${(SIM.i + 1) / SIM.qs.length * 100}%;background:var(--sapBrandColor)"></i></div>
    <p class="qt" style="font-weight:600;font-size:1rem">${esc(q.q)}</p>
    <div class="opts">${q.o.map((o, j) => `<button class="opt ${SIM.ans[SIM.i] === j ? 'sel' : ''}" data-sim-opt="${j}"><span class="dot"></span><span>${esc(o)}</span></button>`).join('')}</div>
    <div style="display:flex;gap:.5rem;justify-content:space-between;flex-wrap:wrap">
      <button class="btn" data-sim-go="-1" ${SIM.i === 0 ? 'disabled' : ''}>${ICON('')}Anterior</button>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">${SIM.i < SIM.qs.length - 1 ? `<button class="btn emph" data-sim-go="1">Próxima${ICON('')}</button>` : ''}
      <button class="btn ${SIM.i === SIM.qs.length - 1 ? 'emph' : ''}" data-sim-end>${ICON('')}Finalizar</button></div>
    </div>
    ${SIM.i === SIM.qs.length - 1 && answered < SIM.qs.length ? `<div class="strip warn">${ICON('')}<p>Ainda há ${SIM.qs.length - answered} questão(ões) em branco. Você pode finalizar assim mesmo.</p></div>` : ''}
  </div>`;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-sim-opt],[data-sim-go],[data-sim-end],[data-sim-new]'); if (!t) return;
  if (t.dataset.simOpt != null) SIM.ans[SIM.i] = +t.dataset.simOpt;
  else if (t.dataset.simGo) SIM.i = Math.max(0, Math.min(SIM.qs.length - 1, SIM.i + +t.dataset.simGo));
  else if (t.hasAttribute('data-sim-end')) { SIM.finished = true; scrollTo({top:0}); }
  else if (t.hasAttribute('data-sim-new')) { newSim(); scrollTo({top:0}); }
  drawSim();
});

/* ============================================================
   Roteador
   ============================================================ */
let anchorObs;
function route(){
  const id = (location.hash || '').replace('#', '') || 'inicio';
  const app = $('#app');
  const l = LESSONS.find(x => x.id === id);
  if (anchorObs) anchorObs.disconnect();
  if (l){
    app.innerHTML = ''; app.appendChild(pageLesson(l));
    enhanceCode(app); mountWidgets(app); bindQuiz(app);
    const anc = $('.anchors', app);
    const secs = $$('.sec[data-anchor]', app);
    anc.innerHTML = secs.map(s => `<a href="#${l.id}" data-sec="${s.id}">${esc(s.dataset.anchor)}</a>`).join('');
    anc.addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); document.getElementById(a.dataset.sec).scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); });
    try {
      anchorObs = new IntersectionObserver(ents => { ents.forEach(en => { if (en.isIntersecting){ $$('a', anc).forEach(a => a.classList.toggle('on', a.dataset.sec === en.target.id)); const on = $('a.on', anc); if (on) anc.scrollLeft = on.offsetLeft - 16; } }); }, {rootMargin: '-30% 0px -60% 0px'});
      secs.forEach(s => anchorObs.observe(s));
    } catch(e){}
    $('[data-mark]', app).addEventListener('click', ev => {
      const now = !done.has(l.id); setDone(l.id, now);
      const b = ev.currentTarget; b.className = 'btn ' + (now ? 'ok' : 'emph'); b.innerHTML = ICON(now ? '' : '') + (now ? 'Concluída' : 'Marcar como concluída');
      $('[data-status]', app).innerHTML = now ? '<span class="tag ok">' + ICON('') + 'Concluída</span>' : '<span class="tag">Não iniciada</span>';
      toast(now ? 'Lição marcada como concluída' : 'Marcação removida');
    });
    document.title = l.title + ' · Trilha ABAP Core';
  } else if (id === 'referencia'){ app.innerHTML = pageRef(); bindRef(); document.title = 'Referência rápida · Trilha ABAP Core'; }
  else if (id === 'simulado'){ app.innerHTML = pageSim(); if (!SIM.qs.length) newSim(); drawSim(); document.title = 'Simulado · Trilha ABAP Core'; }
  else { app.innerHTML = pageHome(); document.title = 'Trilha ABAP Core'; }
  $$('.nav-item').forEach(a => { const on = a.dataset.route === (l || ['referencia', 'simulado'].includes(id) ? id : 'inicio'); a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const g = l ? $(`.nav-group[data-g="c${l.c}"]`) : null; if (g && g.classList.contains('closed')) g.querySelector('button').click();
  scrollTo({top:0});
}
