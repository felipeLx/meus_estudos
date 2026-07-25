/* Prep — spaced-repetition study app for the exercise/study files.
   Vanilla ES modules, no dependencies, works offline. */

const APP = document.getElementById('app');
const STORE_KEY = 'prep.progress.v1';
const DAYS_KEY = 'prep.days.v1';
const SETTINGS_KEY = 'prep.settings.v1';
const DAY = 86400000;

let CONTENT = { decks: [] };
let CARDS = new Map();        // id -> card (with deck ref)
let progress = load(STORE_KEY, {});
let days = load(DAYS_KEY, {});
let settings = load(SETTINGS_KEY, { sessionSize: 20, newPerSession: 8 });
let session = null;

// ------------------------------------------------------------------
// storage
// ------------------------------------------------------------------
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}
const todayKey = () => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------------
// scheduler — SM-2 variant, grades: 0 again / 1 hard / 2 good / 3 easy
// ------------------------------------------------------------------
function grade(cardId, g) {
  const now = Date.now();
  const p = progress[cardId] || { ease: 2.5, interval: 0, reps: 0, lapses: 0 };
  let { ease, interval, reps, lapses } = p;

  if (g === 0) {
    lapses++; reps = 0; ease = Math.max(1.3, ease - 0.2);
    interval = 0;                            // relearn: back within the hour
    p.due = now + 10 * 60000;
  } else {
    reps++;
    if (g === 1) { ease = Math.max(1.3, ease - 0.15); interval = interval ? interval * 1.2 : 0.5; }
    else if (g === 2) { interval = interval ? interval * ease : 1; }
    else { ease = Math.min(3.0, ease + 0.15); interval = interval ? interval * ease * 1.3 : 3; }
    interval = Math.min(interval, 180);
    p.due = now + interval * DAY;
  }

  progress[cardId] = { ...p, ease, interval, reps, lapses, seen: now, last: g };
  save(STORE_KEY, progress);

  const k = todayKey();
  days[k] = (days[k] || 0) + 1;
  save(DAYS_KEY, days);
}

const isDue = (id) => { const p = progress[id]; return p && p.due <= Date.now(); };
const isNew = (id) => !progress[id];

function deckStats(deck) {
  let due = 0, fresh = 0, learned = 0;
  for (const c of deck.cards) {
    if (isNew(c.id)) fresh++;
    else if (isDue(c.id)) due++;
    else learned++;
  }
  return { due, fresh, learned, total: deck.cards.length };
}

function globalStats() {
  let due = 0, fresh = 0, learned = 0;
  for (const d of CONTENT.decks) {
    const s = deckStats(d);
    due += s.due; fresh += s.fresh; learned += s.learned;
  }
  return { due, fresh, learned, streak: streak(), today: days[todayKey()] || 0 };
}

function streak() {
  let n = 0;
  for (let i = 0; ; i++) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    if (days[d]) n++;
    else if (i > 0) break;                  // today not yet studied is not a break
  }
  return n;
}

// ------------------------------------------------------------------
// session building
// ------------------------------------------------------------------
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * deep mode (tracks marked deep, or the "hard first" toggle): pull more new cards
 * per sitting and front-load the hardest ones instead of shuffling flat.
 */
function buildSession(pool, deep = false) {
  const size = deep ? Math.round(settings.sessionSize * 1.5) : settings.sessionSize;
  const newCap = deep ? settings.newPerSession * 2 : settings.newPerSession;

  const due = pool.filter((c) => isDue(c.id)).sort((a, b) => progress[a.id].due - progress[b.id].due);
  let fresh = pool.filter((c) => isNew(c.id));
  fresh = deep
    ? fresh.sort((a, b) => b.difficulty - a.difficulty).slice(0, newCap)
    : shuffle(fresh).slice(0, newCap);

  let cards = [...due.slice(0, size), ...fresh];
  cards = deep ? cards.sort((a, b) => b.difficulty - a.difficulty) : shuffle(cards);
  return { cards: cards.slice(0, size + newCap), i: 0, done: 0, correct: 0, revealed: false, answered: null, deep };
}

// ------------------------------------------------------------------
// syntax highlight
// ------------------------------------------------------------------
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const SQL_KW = 'select|from|where|group|by|order|having|limit|offset|join|inner|left|right|full|outer|cross|lateral|on|as|with|recursive|union|all|except|intersect|case|when|then|else|end|and|or|not|in|is|null|between|like|ilike|exists|distinct|over|partition|rows|range|between|preceding|following|unbounded|current|row|insert|into|values|update|set|delete|create|table|view|temp|temporary|drop|alter|add|column|primary|key|foreign|references|constraint|unique|index|merge|using|matched|copy|stage|file_format|qualify|cast|interval|date_trunc|generate_series|filter|window|asc|desc|nulls|first|last|coalesce|nullif|returning|conflict|do|nothing|begin|commit|explain|analyze';
const PY_KW = 'def|class|return|yield|import|from|as|if|elif|else|for|while|break|continue|pass|with|try|except|finally|raise|lambda|global|nonlocal|assert|del|and|or|not|in|is|None|True|False|async|await|match|case|self';

const RULES = {
  sql: /(?<com>--[^\n]*|\/\*[\s\S]*?\*\/)|(?<str>'(?:''|[^'])*')|(?<num>\b\d+(?:\.\d+)?\b)|(?<kw>\b(?:KWSQL)\b)/gi,
  python: /(?<com>#[^\n]*)|(?<str>"""[\s\S]*?"""|'''[\s\S]*?'''|[rfb]?"(?:\\.|[^"\\])*"|[rfb]?'(?:\\.|[^'\\])*')|(?<dec>@[\w.]+)|(?<num>\b\d+(?:\.\d+)?\b)|(?<kw>\b(?:KWPY)\b)|(?<fn>\b[A-Za-z_]\w*(?=\())/g,
  yaml: /(?<com>#[^\n]*)|(?<str>"(?:\\.|[^"\\])*"|'(?:[^'])*')|(?<kw>^[ \t-]*[\w.$-]+(?=:))|(?<num>\b\d+(?:\.\d+)?\b)/gm,
};
RULES.sql = new RegExp(RULES.sql.source.replace('KWSQL', SQL_KW), 'gi');
RULES.python = new RegExp(RULES.python.source.replace('KWPY', PY_KW), 'g');

const CLASS = { com: 'tok-com', str: 'tok-str', kw: 'tok-kw', num: 'tok-num', fn: 'tok-fn', dec: 'tok-fn' };

function highlight(code, lang) {
  const re = RULES[lang];
  if (!re) return esc(code);
  re.lastIndex = 0;
  let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const kind = Object.keys(m.groups).find((k) => m.groups[k] !== undefined);
    out += `<span class="${CLASS[kind] || ''}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
    if (m[0] === '') re.lastIndex++;
  }
  return out + esc(code.slice(last));
}

const codeBlock = (code, lang, wrap) =>
  `<pre class="${wrap ? 'wrap' : ''}"><code>${highlight(code.replace(/\s+$/, ''), lang)}</code></pre>`;

// ------------------------------------------------------------------
// tiny markdown renderer (headings, lists, tables, quotes, fences, inline)
// ------------------------------------------------------------------
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

function md(src, defaultLang = 'md') {
  const parts = String(src || '').split(/```/);
  let html = '';
  parts.forEach((part, i) => {
    if (i % 2) {                                  // fenced code
      const nl = part.indexOf('\n');
      const lang = part.slice(0, nl).trim().toLowerCase() || defaultLang;
      html += codeBlock(part.slice(nl + 1), lang === 'py' ? 'python' : lang);
      return;
    }
    html += mdBlocks(part);
  });
  return html;
}

function mdBlocks(text) {
  const lines = text.split(/\r?\n/);
  let html = '', para = [], list = null;

  const flushPara = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
  const flushList = () => { if (list) { html += `</${list}>`; list = null; } };
  const openList = (tag) => { if (list !== tag) { flushList(); html += `<${tag}>`; list = tag; } };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    if (!t) { flushPara(); flushList(); continue; }

    const h = t.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushPara(); flushList(); html += `<h${Math.min(4, h[1].length)}>${inline(h[2])}</h${Math.min(4, h[1].length)}>`; continue; }

    if (/^(---+|\*\*\*+|___+)$/.test(t)) { flushPara(); flushList(); html += '<hr>'; continue; }

    if (t.startsWith('>')) { flushPara(); flushList(); html += `<blockquote>${inline(t.replace(/^>\s?/, ''))}</blockquote>`; continue; }

    // table: header row followed by a separator row
    if (t.includes('|') && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1] || '')) {
      flushPara(); flushList();
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      let out = `<div class="tablewrap"><table><thead><tr>${cells(t).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>`;
      i += 2;
      for (; i < lines.length && lines[i].includes('|'); i++) {
        out += `<tr>${cells(lines[i]).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`;
      }
      i--;
      html += out + '</tbody></table></div>';
      continue;
    }

    const ul = t.match(/^[-*+]\s+(.*)$/);
    const ol = t.match(/^(\d+)[.)]\s+(.*)$/);
    if (ul) { flushPara(); openList('ul'); html += `<li>${inline(ul[1])}</li>`; continue; }
    if (ol) { flushPara(); openList('ol'); html += `<li>${inline(ol[2])}</li>`; continue; }

    // indented block (ascii diagrams, expected output tables) -> preformatted
    if (/^ {2,}\S/.test(line) && !para.length) {
      flushList();
      const buf = [];
      while (i < lines.length && (/^ {2,}\S/.test(lines[i]) || !lines[i].trim())) { buf.push(lines[i]); i++; }
      i--;
      html += `<pre><code>${esc(buf.join('\n').replace(/\s+$/, ''))}</code></pre>`;
      continue;
    }

    flushList();
    para.push(t);
  }
  flushPara(); flushList();
  return html;
}

/** Prompt text from source files is plain-ish text; keep line breaks readable. */
const promptHtml = (c) => `<div class="md">${md(c.prompt, c.lang)}</div>`;

function answerHtml(c) {
  if (c.type === 'code') return codeBlock(c.answer, c.lang === 'sql' ? 'sql' : 'python');
  if (c.type === 'read') return codeBlock(c.answer, c.lang === 'md' ? '' : c.lang);
  return `<div class="md">${md(c.answer, c.lang)}</div>`;
}

// ------------------------------------------------------------------
// views
// ------------------------------------------------------------------
const h = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const GROUPS = [
  ['SQL', (d) => d.tags.includes('sql')],
  ['Python & Spark', (d) => d.tags.some((t) => ['python', 'pyspark', 'spark', 'pandas'].includes(t))],
  ['Airflow', (d) => d.tags.includes('airflow')],
  ['Concepts & Theory', (d) => d.tags.some((t) => ['concepts', 'databricks', 'architecture', 'governance', 'framework', 'quiz', 'etl'].includes(t))],
  ['Soft skills', (d) => d.tags.some((t) => ['behavioural', 'english'].includes(t))],
];

function viewHome() {
  const s = globalStats();
  const used = new Set();
  let groups = '';

  for (const [name, match] of GROUPS) {
    const decks = CONTENT.decks.filter((d) => !used.has(d.id) && match(d));
    if (!decks.length) continue;
    decks.forEach((d) => used.add(d.id));
    groups += `<div class="group-title">${h(name)}</div>` + decks.map(deckRow).join('');
  }
  const rest = CONTENT.decks.filter((d) => !used.has(d.id));
  if (rest.length) groups += `<div class="group-title">Other</div>` + rest.map(deckRow).join('');

  return `
  <header class="bar">
    <h1>Prep <span class="sub">${CONTENT.decks.reduce((n, d) => n + d.cards.length, 0)} cards</span></h1>
    <button class="iconbtn" data-go="#/search" aria-label="Search">⌕</button>
  </header>
  <main class="stack">
    <div class="stats">
      <div class="stat"><b>${s.due}</b><span>due</span></div>
      <div class="stat"><b>${s.fresh}</b><span>new</span></div>
      <div class="stat"><b>${s.streak}🔥</b><span>streak</span></div>
    </div>
    <button class="btn primary" data-go="#/study/all">
      ${s.due || s.fresh ? `Study now · ${Math.min(settings.sessionSize, s.due) + Math.min(settings.newPerSession, s.fresh)} cards` : 'Nothing due — study ahead'}
    </button>
    <div class="faint">Today: ${s.today} reviews · ${s.learned} cards scheduled</div>
    ${trackSection()}
    ${groups}
    <div class="faint" style="margin-top:20px">Built ${new Date(CONTENT.generatedAt).toLocaleDateString()} · <a href="#/settings">settings</a></div>
  </main>`;
}

function trackSection() {
  const tracks = CONTENT.tracks || [];
  if (!tracks.length) return '';
  return `<div class="group-title">Tracks</div>
    <div class="tracks">${tracks.map((t) => {
      const cards = trackCards(t);
      const due = cards.filter((c) => isDue(c.id)).length;
      return `<a class="track" href="#/track/${encodeURIComponent(t.id)}">
        <div class="deck-top">
          <span class="deck-title">${h(t.title)}${t.deep ? ' <span class="pill">deep</span>' : ''}</span>
          <span class="pill ${due ? '' : 'zero'}">${due ? due + ' due' : cards.length + ' cards'}</span>
        </div>
        <div class="faint">${h(t.blurb)}</div>
      </a>`;
    }).join('')}</div>`;
}

function viewTrack(id) {
  const t = trackById(id);
  if (!t) return viewMissing();
  const decks = trackDecks(t);
  const cards = trackCards(t);
  const due = cards.filter((c) => isDue(c.id)).length;
  const fresh = cards.filter((c) => isNew(c.id)).length;

  return `
  <header class="bar">
    <button class="iconbtn" data-go="#/">‹</button>
    <h1>${h(t.title)}<span class="sub"> · ${cards.length} cards</span></h1>
  </header>
  <main class="stack">
    <div class="faint">${h(t.blurb)}</div>
    <div class="stats">
      <div class="stat"><b>${due}</b><span>due</span></div>
      <div class="stat"><b>${fresh}</b><span>new</span></div>
      <div class="stat"><b>${decks.length}</b><span>decks</span></div>
    </div>
    <button class="btn primary" data-go="#/study/track:${encodeURIComponent(t.id)}">Study track</button>
    <button class="btn" data-go="#/study/track:${encodeURIComponent(t.id)}:deep">
      Deep session — hardest first
    </button>
    <div class="group-title">Decks in this track</div>
    ${decks.map(deckRow).join('')}
  </main>`;
}

function deckRow(d) {
  const s = deckStats(d);
  const pct = s.total ? Math.round((s.learned / s.total) * 100) : 0;
  return `
  <a class="deck" href="#/deck/${encodeURIComponent(d.id)}">
    <div class="deck-top">
      <span class="deck-title">${h(d.title)}</span>
      <span class="pill ${s.due ? '' : 'zero'}">${s.due ? s.due + ' due' : s.fresh + ' new'}</span>
    </div>
    <div class="faint">${s.total} cards · ${s.learned} learned</div>
    <div class="progress"><i style="width:${pct}%"></i></div>
  </a>`;
}

function viewDeck(id) {
  const d = CONTENT.decks.find((x) => x.id === id);
  if (!d) return viewMissing();
  const s = deckStats(d);
  return `
  <header class="bar">
    <button class="iconbtn" data-go="#/">‹</button>
    <h1>${h(d.title)}<span class="sub"> · ${s.total} cards</span></h1>
  </header>
  <main class="stack">
    <div class="stats">
      <div class="stat"><b>${s.due}</b><span>due</span></div>
      <div class="stat"><b>${s.fresh}</b><span>new</span></div>
      <div class="stat"><b>${s.learned}</b><span>learned</span></div>
    </div>
    <button class="btn primary" data-go="#/study/${encodeURIComponent(d.id)}">Study this deck</button>
    <button class="btn" data-go="#/read/${encodeURIComponent(d.id)}">Read mode</button>
    <div class="faint">Source: ${d.sources.map(h).join('<br>')}</div>
    <div class="group-title">Cards</div>
    ${d.cards.map((c, i) => `
      <a class="hit" href="#/read/${encodeURIComponent(d.id)}?c=${i}">
        <div class="t">${h(c.title)}</div>
        <div class="faint">${c.type} · ${'★'.repeat(c.difficulty)}${progress[c.id] ? ' · seen' : ''}</div>
      </a>`).join('')}
  </main>`;
}

function viewStudy() {
  if (!session || session.i >= session.cards.length) return viewSessionDone();
  const c = session.cards[session.i];
  const pct = Math.round((session.i / session.cards.length) * 100);
  const isMcq = c.type === 'mcq';

  let body = `<div class="card-meta">
      <span class="tag">${h(c.deckTitle)}</span>
      <span>${'★'.repeat(c.difficulty)}</span>
      <span class="spacer"></span>
      <span>${session.i + 1}/${session.cards.length}</span>
    </div>
    <h2>${h(c.title)}</h2>
    ${promptHtml(c)}`;

  if (isMcq) {
    body += `<div class="opts">${c.options.map((o) => `
      <button class="opt" data-opt="${o.key}"><b>${o.key}</b><span>${inline(o.text)}</span></button>`).join('')}</div>`;
    if (session.answered) {
      body += `<div class="answer"><div class="faint">Correct: ${c.correct}</div>${c.answer ? `<div class="md">${md(c.answer)}</div>` : ''}</div>`;
    }
  } else if (session.revealed) {
    body += `<div class="answer">${answerHtml(c)}</div>`;
  }

  let actions;
  if (isMcq) {
    actions = session.answered
      ? `<button class="btn primary" data-next="1">Next</button>`
      : `<div class="faint" style="text-align:center">Pick an answer</div>`;
  } else if (!session.revealed) {
    actions = `<button class="btn primary" data-reveal="1">Show answer</button>`;
  } else {
    actions = `<div class="grades">
      <button class="btn g1" data-grade="0">Again<small>10 min</small></button>
      <button class="btn g2" data-grade="1">Hard<small>${nextLabel(c.id, 1)}</small></button>
      <button class="btn g3" data-grade="2">Good<small>${nextLabel(c.id, 2)}</small></button>
      <button class="btn g4" data-grade="3">Easy<small>${nextLabel(c.id, 3)}</small></button>
    </div>`;
  }

  return `
  <header class="bar">
    <button class="iconbtn" data-go="#/">✕</button>
    <h1>${session.deep ? 'Deep session' : 'Session'}<span class="sub"> · ${session.done} done</span></h1>
    <button class="iconbtn" data-skip="1" aria-label="Skip">›</button>
  </header>
  <div class="study">
    <div class="sessionbar"><div class="progress"><i style="width:${pct}%"></i></div></div>
    <section class="card" id="card">${body}</section>
    <div class="actions">${actions}</div>
  </div>`;
}

function nextLabel(id, g) {
  const p = progress[id] || { ease: 2.5, interval: 0 };
  let iv;
  if (g === 1) iv = p.interval ? p.interval * 1.2 : 0.5;
  else if (g === 2) iv = p.interval ? p.interval * p.ease : 1;
  else iv = p.interval ? p.interval * p.ease * 1.3 : 3;
  iv = Math.min(iv, 180);
  return iv < 1 ? `${Math.round(iv * 24)} h` : `${Math.round(iv)} d`;
}

function viewSessionDone() {
  const s = globalStats();
  return `
  <header class="bar"><button class="iconbtn" data-go="#/">‹</button><h1>Session done</h1></header>
  <main class="stack">
    <div class="empty" style="font-size:44px">✓</div>
    <div class="stats">
      <div class="stat"><b>${session ? session.done : 0}</b><span>reviewed</span></div>
      <div class="stat"><b>${s.due}</b><span>still due</span></div>
      <div class="stat"><b>${s.streak}🔥</b><span>streak</span></div>
    </div>
    ${s.due || s.fresh ? `<button class="btn primary" data-again="1">Another session</button>` : ''}
    <button class="btn" data-go="#/">Back to decks</button>
  </main>`;
}

function viewRead(id, focus) {
  const d = CONTENT.decks.find((x) => x.id === id);
  if (!d) return viewMissing();
  return `
  <header class="bar">
    <button class="iconbtn" data-go="#/deck/${encodeURIComponent(d.id)}">‹</button>
    <h1>${h(d.title)}<span class="sub"> · read</span></h1>
  </header>
  <main class="stack reader">
    ${d.cards.map((c, i) => `
      <details ${String(i) === focus ? 'open' : ''}>
        <summary>${h(c.title)}</summary>
        ${promptHtml(c)}
        ${c.options ? `<ul class="md">${c.options.map((o) => `<li>${o.key === c.correct ? '<strong>' : ''}${o.key}) ${inline(o.text)}${o.key === c.correct ? ' ✓</strong>' : ''}</li>`).join('')}</ul>` : ''}
        ${c.answer ? answerHtml(c) : ''}
      </details>`).join('')}
  </main>`;
}

function viewSearch(q) {
  const query = (q || '').trim().toLowerCase();
  let hits = [];
  if (query.length >= 2) {
    for (const d of CONTENT.decks) {
      for (const c of d.cards) {
        const hay = `${c.title}\n${c.prompt}\n${c.answer}`.toLowerCase();
        const at = hay.indexOf(query);
        if (at !== -1) hits.push({ d, c, snippet: hay.slice(Math.max(0, at - 40), at + 90) });
      }
    }
  }
  return `
  <header class="bar">
    <button class="iconbtn" data-go="#/">‹</button>
    <h1>Search<span class="sub"> · ${hits.length} hits</span></h1>
  </header>
  <main class="stack">
    <input class="search" id="q" placeholder="window function, idempotent, trigger_rule…" value="${h(q || '')}" autocomplete="off">
    ${hits.slice(0, 60).map(({ d, c, snippet }) => `
      <a class="hit" href="#/read/${encodeURIComponent(d.id)}?c=${d.cards.indexOf(c)}">
        <div class="t">${h(c.title)}</div>
        <div class="faint">${h(d.title)}</div>
        <div class="faint">…${h(snippet)}…</div>
      </a>`).join('') || (query.length >= 2 ? '<div class="empty">No matches</div>' : '<div class="empty">Type to search all cards</div>')}
  </main>`;
}

function viewSettings() {
  return `
  <header class="bar"><button class="iconbtn" data-go="#/">‹</button><h1>Settings</h1></header>
  <main class="stack">
    <label class="faint">Reviews per session
      <input class="search" type="number" min="5" max="100" id="sessionSize" value="${settings.sessionSize}"></label>
    <label class="faint">New cards per session
      <input class="search" type="number" min="0" max="50" id="newPerSession" value="${settings.newPerSession}"></label>
    <button class="btn" data-export="1">Export progress</button>
    <button class="btn" data-reset="1">Reset all progress</button>
    <div class="faint">Progress is stored on this device only (localStorage).</div>
  </main>`;
}

const viewMissing = () => `
  <header class="bar"><button class="iconbtn" data-go="#/">‹</button><h1>Not found</h1></header>
  <main><div class="empty">That deck no longer exists. Rebuild the content bundle.</div></main>`;

// ------------------------------------------------------------------
// router
// ------------------------------------------------------------------
function render() {
  const [path, qs] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(qs || '');
  const [, route, arg] = path.split('/');

  let html;
  if (!route) html = viewHome();
  else if (route === 'deck') html = viewDeck(decodeURIComponent(arg || ''));
  else if (route === 'track') html = viewTrack(decodeURIComponent(arg || ''));
  else if (route === 'study') { ensureSession(decodeURIComponent(arg || 'all')); html = viewStudy(); }
  else if (route === 'read') html = viewRead(decodeURIComponent(arg || ''), params.get('c'));
  else if (route === 'search') html = viewSearch(params.get('q'));
  else if (route === 'settings') html = viewSettings();
  else html = viewHome();

  APP.innerHTML = html;
  if (route !== 'study') window.scrollTo(0, 0);

  // reveal should land on the answer, not leave it below the fold
  if (route === 'study' && session?.revealed) {
    document.querySelector('.answer')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  const q = document.getElementById('q');
  if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

/** scope: "all" | "<deckId>" | "track:<trackId>" (optionally suffixed ":deep") */
function ensureSession(scope) {
  if (session && session.scope === scope && session.i < session.cards.length) return;

  let deep = false;
  let key = scope;
  if (key.endsWith(':deep')) { deep = true; key = key.slice(0, -5); }

  let pool;
  if (key === 'all') {
    pool = CONTENT.decks.flatMap((d) => d.cards);
  } else if (key.startsWith('track:')) {
    const t = trackById(key.slice(6));
    deep = deep || !!t?.deep;
    pool = trackCards(t);
  } else {
    pool = CONTENT.decks.find((d) => d.id === key)?.cards || [];
  }
  session = { ...buildSession(pool, deep), scope };
}

const trackById = (id) => (CONTENT.tracks || []).find((t) => t.id === id);
const trackDecks = (t) => (t ? t.decks.map((id) => CONTENT.decks.find((d) => d.id === id)).filter(Boolean) : []);
const trackCards = (t) => trackDecks(t).flatMap((d) => d.cards);

// ------------------------------------------------------------------
// events
// ------------------------------------------------------------------
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go],[data-reveal],[data-grade],[data-next],[data-skip],[data-again],[data-opt],[data-reset],[data-export]');
  if (!t) return;

  if (t.dataset.go) { location.hash = t.dataset.go; return; }

  if (t.dataset.reveal) { session.revealed = true; render(); return; }

  if (t.dataset.opt) {
    if (session.answered) return;
    const c = session.cards[session.i];
    session.answered = t.dataset.opt;
    const ok = t.dataset.opt === c.correct;
    if (ok) session.correct++;
    grade(c.id, ok ? 2 : 0);
    session.done++;
    render();
    document.querySelectorAll('.opt').forEach((el) => {
      el.disabled = true;
      if (el.dataset.opt === c.correct) el.classList.add('correct');
      else if (el.dataset.opt === session.answered) el.classList.add('wrong');
    });
    return;
  }

  if (t.dataset.grade) {
    const c = session.cards[session.i];
    grade(c.id, Number(t.dataset.grade));
    advance();
    return;
  }

  if (t.dataset.next || t.dataset.skip) { advance(); return; }

  if (t.dataset.again) { session = null; location.hash = '#/study/all'; render(); return; }

  if (t.dataset.export) {
    const blob = new Blob([JSON.stringify({ progress, days }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prep-progress-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }

  if (t.dataset.reset) {
    if (!confirm('Erase all study progress on this device?')) return;
    progress = {}; days = {}; session = null;
    save(STORE_KEY, progress); save(DAYS_KEY, days);
    toast('Progress cleared');
    location.hash = '#/';
    render();
  }
});

function advance() {
  session.i++;
  session.done = Math.max(session.done, session.i);
  session.revealed = false;
  session.answered = null;
  render();
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'q') {
    const v = e.target.value;
    clearTimeout(window.__qt);
    window.__qt = setTimeout(() => history.replaceState(null, '', `#/search?q=${encodeURIComponent(v)}`) || render(), 180);
  }
  if (e.target.id === 'sessionSize' || e.target.id === 'newPerSession') {
    settings[e.target.id] = Math.max(0, Number(e.target.value) || 0);
    save(SETTINGS_KEY, settings);
  }
});

// keyboard: space reveals, 1-4 grade
document.addEventListener('keydown', (e) => {
  if (!location.hash.startsWith('#/study') || !session) return;
  if (document.activeElement?.tagName === 'INPUT') return;
  const c = session.cards[session.i];
  if (!c) return;
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (!session.revealed && c.type !== 'mcq') { session.revealed = true; render(); }
    else if (c.type === 'mcq' && session.answered) advance();
  } else if (session.revealed && '1234'.includes(e.key)) {
    grade(c.id, Number(e.key) - 1);
    advance();
  }
});

// swipe on a revealed card: left = again, right = good
let sx = 0, sy = 0;
document.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (!session || !session.revealed || !location.hash.startsWith('#/study')) return;
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
  const c = session.cards[session.i];
  if (!c || c.type === 'mcq') return;
  grade(c.id, dx > 0 ? 2 : 0);
  toast(dx > 0 ? 'Good' : 'Again');
  advance();
}, { passive: true });

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

window.addEventListener('hashchange', render);

// ------------------------------------------------------------------
// boot
// ------------------------------------------------------------------
fetch('content.json', { cache: 'no-cache' })
  .then((r) => r.json())
  .then((data) => {
    CONTENT = data;
    for (const d of CONTENT.decks) {
      for (const c of d.cards) {
        c.deckId = d.id;
        c.deckTitle = d.title;
        CARDS.set(c.id, c);
      }
    }
    // Drop progress for cards that no longer exist after a rebuild.
    let dirty = false;
    for (const id of Object.keys(progress)) if (!CARDS.has(id)) { delete progress[id]; dirty = true; }
    if (dirty) save(STORE_KEY, progress);

    render();
  })
  .catch((err) => {
    APP.innerHTML = `<main><div class="empty">Could not load content.json<br><span class="faint">${h(err.message)}</span></div></main>`;
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
