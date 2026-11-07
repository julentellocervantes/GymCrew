// GymCrew: tus entrenos en tu móvil y, si tú quieres, compartidos con amigos y con tu gimnasio.
// Todo vive en localStorage. Lo social es opt-in: nada sale del móvil salvo lo que decides compartir.
'use strict';

const APP_NAME = 'GymCrew'; // nombre provisional: cámbialo aquí, en index.html, manifest.webmanifest, sw.js y server/
const KEY = 'gymcrew.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

/* ---------- Códigos de amigo: 4 números + 3 letras ---------- */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O para no confundir con 1 y 0
const CODE_RE = /^\d{4}[A-Z]{3}$/;
const GCODE_RE = /^[A-Z]{5}\d{3}$/; // código de un grupo de gimnasio: 5 letras + 3 números
const normCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function rnd(n) {
  if (window.crypto && crypto.getRandomValues) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  }
  return Math.floor(Math.random() * n);
}
function genCode() {
  let d = '', l = '';
  for (let i = 0; i < 4; i++) d += rnd(10);
  for (let i = 0; i < 3; i++) l += LETTERS[rnd(LETTERS.length)];
  return d + l;
}

/* ---------- Dominio: tipos, músculos y catálogo de ejercicios ---------- */
/* Temas fijos para clasificar publicaciones (los mismos ids que valida el servidor) */
const TOPICS = [
  { id: 'fuerza', e: '🏋️', n: 'Fuerza' }, { id: 'cardio', e: '🏃', n: 'Cardio' }, { id: 'movilidad', e: '🧘', n: 'Movilidad' },
  { id: 'rutinas', e: '📋', n: 'Rutinas' }, { id: 'progreso', e: '📈', n: 'Progreso' }, { id: 'tecnica', e: '🎯', n: 'Técnica' },
  { id: 'motivacion', e: '🔥', n: 'Motivación' }, { id: 'preguntas', e: '❓', n: 'Preguntas' }, { id: 'principiantes', e: '🌱', n: 'Principiantes' }
];
const TOPIC_IDS = TOPICS.map(t => t.id);
const topicOf = id => TOPICS.find(t => t.id === id);
const TYPES = [
  { id: 'fuerza', e: '🏋️', n: 'Fuerza' }, { id: 'cardio', e: '🏃', n: 'Cardio' }, { id: 'funcional', e: '🤸', n: 'Funcional' },
  { id: 'deporte', e: '⚽', n: 'Deporte' }, { id: 'movilidad', e: '🧘', n: 'Movilidad' }
];
const TYPE_IDS = TYPES.map(t => t.id);
const typeOf = id => TYPES.find(t => t.id === id) || TYPES[0];
const MUSCLES = [
  { id: 'pecho', n: 'Pecho' }, { id: 'espalda', n: 'Espalda' }, { id: 'hombros', n: 'Hombros' }, { id: 'brazos', n: 'Brazos' },
  { id: 'piernas', n: 'Piernas' }, { id: 'gluteos', n: 'Glúteos' }, { id: 'core', n: 'Core' }, { id: 'cuerpo', n: 'Cuerpo entero' }
];
const MUSCLE_IDS = MUSCLES.map(m => m.id);
const FEELS = ['', '😞', '😕', '😐', '🙂', '😄'];
const FEEL_LABEL = ['', 'Mal', 'Regular', 'Normal', 'Bien', 'Genial'];
const REACTS = ['💪', '🔥', '👏', '🙌', '😮', '❤️'];
// [id, español, inglés, músculo]. El inglés se muestra con el idioma en English.
const EXERCISES = [
  ['press-banca', 'Press de banca', 'Bench press', 'pecho'], ['press-inclinado', 'Press inclinado', 'Incline press', 'pecho'],
  ['press-man', 'Press con mancuernas', 'Dumbbell press', 'pecho'], ['aperturas', 'Aperturas', 'Chest fly', 'pecho'],
  ['fondos', 'Fondos', 'Dips', 'pecho'], ['flexiones', 'Flexiones', 'Push-ups', 'pecho'], ['cruces-polea', 'Cruces en polea', 'Cable crossover', 'pecho'], ['press-declinado', 'Press declinado', 'Decline press', 'pecho'],
  ['dominadas', 'Dominadas', 'Pull-ups', 'espalda'], ['remo-barra', 'Remo con barra', 'Barbell row', 'espalda'],
  ['remo-man', 'Remo con mancuerna', 'Dumbbell row', 'espalda'], ['jalon', 'Jalón al pecho', 'Lat pulldown', 'espalda'],
  ['remo-polea', 'Remo en polea', 'Seated cable row', 'espalda'], ['peso-muerto', 'Peso muerto', 'Deadlift', 'espalda'],
  ['remo-t', 'Remo en T', 'T-bar row', 'espalda'], ['pullover', 'Pullover', 'Pullover', 'espalda'], ['remo-invertido', 'Remo invertido', 'Inverted row', 'espalda'],
  ['press-militar', 'Press militar', 'Overhead press', 'hombros'], ['press-hombro-man', 'Press de hombro con mancuernas', 'Dumbbell shoulder press', 'hombros'],
  ['elev-lat', 'Elevaciones laterales', 'Lateral raise', 'hombros'], ['elev-front', 'Elevaciones frontales', 'Front raise', 'hombros'],
  ['pajaros', 'Pájaros', 'Rear delt fly', 'hombros'], ['remo-menton', 'Remo al mentón', 'Upright row', 'hombros'], ['face-pull', 'Face pull', 'Face pull', 'hombros'], ['arnold', 'Press Arnold', 'Arnold press', 'hombros'],
  ['curl-barra', 'Curl con barra', 'Barbell curl', 'brazos'], ['curl-man', 'Curl con mancuernas', 'Dumbbell curl', 'brazos'],
  ['curl-martillo', 'Curl martillo', 'Hammer curl', 'brazos'], ['curl-predicador', 'Curl predicador', 'Preacher curl', 'brazos'],
  ['ext-triceps', 'Extensión de tríceps en polea', 'Triceps pushdown', 'brazos'], ['press-frances', 'Press francés', 'Skull crusher', 'brazos'],
  ['fondos-banco', 'Fondos en banco', 'Bench dips', 'brazos'], ['patada-triceps', 'Patada de tríceps', 'Triceps kickback', 'brazos'],
  ['sentadilla', 'Sentadilla', 'Squat', 'piernas'], ['sentadilla-front', 'Sentadilla frontal', 'Front squat', 'piernas'],
  ['prensa', 'Prensa de piernas', 'Leg press', 'piernas'], ['zancadas', 'Zancadas', 'Lunges', 'piernas'],
  ['bulgara', 'Sentadilla búlgara', 'Bulgarian split squat', 'piernas'], ['ext-cuad', 'Extensión de cuádriceps', 'Leg extension', 'piernas'],
  ['curl-femoral', 'Curl femoral', 'Leg curl', 'piernas'], ['rumano', 'Peso muerto rumano', 'Romanian deadlift', 'piernas'],
  ['gemelos-pie', 'Gemelos de pie', 'Standing calf raise', 'piernas'], ['gemelos-sent', 'Gemelos sentado', 'Seated calf raise', 'piernas'], ['goblet', 'Sentadilla goblet', 'Goblet squat', 'piernas'], ['hack', 'Sentadilla hack', 'Hack squat', 'piernas'], ['step-up', 'Subidas al cajón', 'Step-ups', 'piernas'],
  ['hip-thrust', 'Hip thrust', 'Hip thrust', 'gluteos'], ['puente', 'Puente de glúteo', 'Glute bridge', 'gluteos'],
  ['abductor', 'Abductor en máquina', 'Hip abduction', 'gluteos'], ['patada-gluteo', 'Patada de glúteo', 'Glute kickback', 'gluteos'],
  ['buenos-dias', 'Buenos días', 'Good morning', 'gluteos'],
  ['plancha', 'Plancha', 'Plank', 'core'], ['crunch', 'Abdominales (crunch)', 'Crunch', 'core'], ['elev-piernas', 'Elevación de piernas', 'Leg raise', 'core'],
  ['rueda', 'Rueda abdominal', 'Ab wheel', 'core'], ['russian-twist', 'Giro ruso', 'Russian twist', 'core'],
  ['plancha-lat', 'Plancha lateral', 'Side plank', 'core'], ['escaladores', 'Escaladores', 'Mountain climbers', 'core'],
  ['burpees', 'Burpees', 'Burpees', 'cuerpo'], ['kettlebell', 'Swing con kettlebell', 'Kettlebell swing', 'cuerpo'],
  ['thruster', 'Thruster', 'Thruster', 'cuerpo'], ['remo-erg', 'Remo en ergómetro', 'Rowing machine', 'cuerpo'],
  ['cuerda', 'Salto a la comba', 'Jump rope', 'cuerpo'], ['clean', 'Cargada', 'Power clean', 'cuerpo']
];
const EX_BY_ID = Object.fromEntries(EXERCISES.map(x => [x[0], x]));

/* ---------- Estado ---------- */
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const num = (v, a, b, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function normSet(s) {
  s = s && typeof s === 'object' ? s : {};
  const o = { r: Math.round(num(s.r, 0, 999)), w: Math.round(num(s.w, 0, 1000, 0) * 10) / 10 };
  const rpe = num(s.rpe, 0, 10);
  if (rpe >= 5) o.rpe = Math.round(rpe * 2) / 2;
  return o;
}
function normWorkout(w) {
  if (!w || typeof w !== 'object' || !DAY_RE.test(w.date)) return null;
  const o = {
    id: str(w.id, 40) || uid(), date: w.date, time: TIME_RE.test(w.time) ? w.time : '', dur: Math.round(num(w.dur, 0, 600)),
    type: TYPE_IDS.includes(w.type) ? w.type : 'fuerza',
    muscles: (Array.isArray(w.muscles) ? w.muscles : []).filter((m, i, a) => MUSCLE_IDS.includes(m) && a.indexOf(m) === i),
    note: str(w.note, 300), feel: Math.round(num(w.feel, 0, 5)),
    ex: (Array.isArray(w.ex) ? w.ex : []).filter(e => e && typeof e.k === 'string').slice(0, 40).map(e => ({ k: str(e.k, 40), sets: (Array.isArray(e.sets) ? e.sets : []).slice(0, 30).map(normSet) })),
    pr: (Array.isArray(w.pr) ? w.pr : []).slice(0, 12).map(p => ({ k: str(p && p.k, 40), t: ['1rm', 'peso', 'vol', 'reps'].includes(p && p.t) ? p.t : 'peso', v: num(p && p.v, 0, 100000) })).filter(p => p.k)
  };
  if (w.sh && typeof w.sh === 'object') o.sh = { f: !!w.sh.f, p: !!w.sh.p, tp: TOPIC_IDS.includes(w.sh.tp) ? w.sh.tp : '', g: (Array.isArray(w.sh.g) ? w.sh.g : []).filter(x => typeof x === 'string').slice(0, 40), vol: !!w.sh.vol, note: !!w.sh.note, det: !!w.sh.det };
  return o;
}
const normWorkouts = a => (Array.isArray(a) ? a : []).map(normWorkout).filter(Boolean);
const normRoutines = a => (Array.isArray(a) ? a : []).filter(r => r && typeof r.id === 'string' && typeof r.name === 'string').slice(0, 40)
  .map(r => ({ id: r.id.slice(0, 40), name: r.name.slice(0, 30), type: TYPE_IDS.includes(r.type) ? r.type : 'fuerza', ex: (Array.isArray(r.ex) ? r.ex : []).filter(x => typeof x === 'string').slice(0, 40).map(x => x.slice(0, 40)) }));
const normCustom = a => (Array.isArray(a) ? a : []).filter(x => x && typeof x.id === 'string' && typeof x.n === 'string').slice(0, 100)
  .map(x => ({ id: x.id.slice(0, 40), n: x.n.slice(0, 40), m: MUSCLE_IDS.includes(x.m) ? x.m : 'cuerpo' }));
const HEX32 = /^[0-9a-f]{32}$/;
const normMedia = m => (m && typeof m === 'object' && HEX32.test(String(m.id)) && (m.k === 'img' || m.k === 'vid') ? { id: m.id, k: m.k, w: Math.round(num(m.w, 0, 4000)), h: Math.round(num(m.h, 0, 4000)), d: Math.round(num(m.d, 0, 60)) } : null);
const normAud = a => ({ f: !!(a && a.f), o: !!(a && a.o), p: !!(a && a.p), g: (a && Array.isArray(a.g) ? a.g : []).filter(x => typeof x === 'string').slice(0, 40) });
const NOTE_TYPES = ['like', 'cmt', 'req', 'friend', 'join', 'follow', 'freq', 'fok'];
const normNotes = a => (Array.isArray(a) ? a : []).filter(n => n && NOTE_TYPES.includes(n.type) && typeof n.id === 'string').slice(-100).map(n => ({ id: n.id.slice(0, 40), ts: Number(n.ts) || 0, type: n.type, from: str(n.from, 12), pid: str(n.pid, 40), e: str(n.e, 4), text: str(n.text, 140), gname: str(n.gname, 24), name: str(n.name, 24), seen: !!n.seen }));
const normCard = c => ({ code: str(c && c.code, 12), name: str(c && c.name, 24) || 'Alguien', handle: str(c && c.handle, 20), priv: !(c && c.priv === false) });
const normNet = n => { n = n && typeof n === 'object' ? n : {}; const L = a => (Array.isArray(a) ? a : []).filter(c => c && CODE_RE.test(String(c.code))).slice(0, 500).map(normCard); return { following: L(n.following), followers: L(n.followers), freqIn: L(n.freqIn), freqOut: L(n.freqOut) }; };
const normFeed = a => (Array.isArray(a) ? a : []).filter(p => p && typeof p.id === 'string' && ((p.w && typeof p.w === 'object') || (p.pub && typeof p.pub === 'object'))).slice(-150).map(p => {
  const o = {
    id: p.id.slice(0, 40), from: str(p.from, 12), gid: p.gid ? str(p.gid, 40) : '', ts: Number(p.ts) || 0, w: p.w && typeof p.w === 'object' ? p.w : null,
    react: p.react && typeof p.react === 'object' ? p.react : {}, cmt: (Array.isArray(p.cmt) ? p.cmt : []).filter(c => c && typeof c.text === 'string').slice(-30)
  };
  if (p.pub && typeof p.pub === 'object') { o.pub = { text: str(p.pub.text, 400), m: normMedia(p.pub.m) }; o.aud = normAud(p.aud); }
  if (p.aud && !o.aud) o.aud = normAud(p.aud);
  if (TOPIC_IDS.includes(p.tp)) o.tp = p.tp;
  if (p.pubx) { o.pubx = true; o.stale = true; }
  return o;
});
const normStories = a => (Array.isArray(a) ? a : []).filter(s => s && typeof s.id === 'string' && Date.now() - (Number(s.ts) || 0) < 24 * 3600e3 && (s.text || normMedia(s.m))).slice(-60).map(s => ({ id: s.id.slice(0, 40), from: str(s.from, 12), gid: s.gid ? str(s.gid, 40) : '', ts: Number(s.ts) || 0, text: str(s.text, 140), m: normMedia(s.m), seen: !!s.seen, aud: normAud(s.aud) }));
const normLock = l => { const o = l && typeof l === 'object' ? l : {}; const ok = o.on === true && typeof o.h === 'string' && o.h.length > 0 && typeof o.s === 'string' && o.s.length > 0; return { on: ok, h: ok ? o.h.slice(0, 40) : '', s: ok ? o.s.slice(0, 20) : '', after: [0, 60, 300].includes(o.after) ? o.after : 0 }; };

function defaults() {
  return {
    workouts: [], routines: [], custom: [], feed: [], stories: [], notes: [], blocked: [], account: null, loginSkipped: false, tutorialDone: false, welcomeDone: false,
    me: { name: 'Yo', code: '', photo: '', frame: '', handle: '', priv: true },
    net: { following: [], followers: [], freqIn: [], freqOut: [] },
    friends: [], groups: [], names: {},
    requests: { incoming: [], outgoing: [] },
    achievements: {},
    ui: { fold: {}, tab: '', home: 'feed', ff: '', feedTab: 'foryou', tp: '', fl: 'friends', seg: 'chats', pf: 'posts', hseg: 'today', filter: '', draft: null, lastRoutine: '', quickType: 'fuerza' },
    settings: { noteToast: true, browserNotif: false, theme: 'auto', lang: 'es', haptics: true, goal: 3, rest: 90, lock: { on: false, h: '', s: '', after: 0 } }
  };
}

function load(src) {
  const base = defaults();
  let d = {};
  if (src && typeof src === 'object') d = src;
  else try { d = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { d = {}; }
  const rq = d.requests || {}, ui = d.ui && typeof d.ui === 'object' ? d.ui : {}, st = d.settings && typeof d.settings === 'object' ? d.settings : {};
  const s = {
    workouts: normWorkouts(d.workouts), routines: normRoutines(d.routines), custom: normCustom(d.custom), feed: normFeed(d.feed), stories: normStories(d.stories), notes: normNotes(d.notes),
    blocked: (Array.isArray(d.blocked) ? d.blocked : []).filter(c => CODE_RE.test(c)).slice(0, 200),
    account: d.account && typeof d.account === 'object' && typeof d.account.email === 'string' && d.account.email ? { email: str(d.account.email, 120), rcPending: /^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/.test(String(d.account.rcPending)) ? d.account.rcPending : '' } : null,
    loginSkipped: !!d.loginSkipped,
    welcomeDone: !!d.welcomeDone || !!d.account || !!d.loginSkipped,
    tutorialDone: d.tutorialDone !== undefined ? !!d.tutorialDone : !!((Array.isArray(d.workouts) && d.workouts.length) || (Array.isArray(d.friends) && d.friends.length)),
    me: Object.assign(base.me, d.me), net: normNet(d.net),
    friends: Array.isArray(d.friends) ? d.friends : [],
    groups: Array.isArray(d.groups) ? d.groups : [],
    names: d.names && typeof d.names === 'object' ? d.names : {},
    requests: { incoming: Array.isArray(rq.incoming) ? rq.incoming : [], outgoing: Array.isArray(rq.outgoing) ? rq.outgoing : [] },
    achievements: d.achievements && typeof d.achievements === 'object' ? d.achievements : {},
    ui: {
      pf: ['posts', 'replies', 'photos'].includes(ui.pf) ? ui.pf : 'posts',
      home: ui.home === 'day' ? 'day' : 'feed', fl: ['friends', 'following', 'followers'].includes(ui.fl) ? ui.fl : 'friends', ff: ['f', 'g', 'p'].includes(ui.ff) ? ui.ff : '',
      fold: Object.assign({}, ui.fold), tab: str(ui.tab, 12), seg: ['friends', 'chats', 'groups'].includes(ui.seg) ? ui.seg : 'chats',
      hseg: ['today', 'hist'].includes(ui.hseg) ? ui.hseg : 'today', feedTab: ui.feedTab === 'following' ? 'following' : 'foryou', tp: TOPIC_IDS.includes(ui.tp) ? ui.tp : '', filter: TYPE_IDS.includes(ui.filter) ? ui.filter : '',
      draft: ui.draft && typeof ui.draft === 'object' && normWorkout(ui.draft) ? Object.assign(normWorkout(ui.draft), { at: Number(ui.draft.at) || 0 }) : null,
      lastRoutine: str(ui.lastRoutine, 40), quickType: TYPE_IDS.includes(ui.quickType) ? ui.quickType : 'fuerza'
    },
    settings: Object.assign(base.settings, st)
  };
  s.settings.goal = Math.round(num(st.goal, 1, 7, 3));
  s.settings.rest = [30, 60, 90, 120, 180, 240].includes(st.rest) ? st.rest : 90;
  s.settings.lock = normLock(st.lock);
  s.groups.forEach(g => {
    if (!Array.isArray(g.messages)) g.messages = [];
    if (!Array.isArray(g.members)) g.members = [];
    if (!Array.isArray(g.meets)) g.meets = [];
    if (!g.stats || typeof g.stats !== 'object') g.stats = {};
    g.rank = !!g.rank;
    g.goal = Math.round(num(g.goal, 0, 14));
  });
  if (!CODE_RE.test(s.me.code)) s.me.code = genCode();
  s.me.handle = /^[a-z0-9_.]{3,20}$/.test(String(s.me.handle)) ? s.me.handle : ''; s.me.priv = s.me.priv !== false;
  return s;
}
let state = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state, (k, v) => (k === 'feed' && Array.isArray(v) ? v.filter(x => !x.pubx || x.cmt.some(c => c.from === state.me.code)) : k === 'stories' && Array.isArray(v) ? v.filter(x => !x.pubx) : v))); }
  catch { toast('No se pudo guardar. Revisa que el navegador permita almacenamiento local.'); }
}
save();

/* ---------- Utilidades ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => parse(ymd(new Date()));
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
const startOfWeek = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS = ['L','M','X','J','V','S','D'];

const fmtClock = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtShort = ts => { const d = new Date(ts); return ymd(d) === ymd(new Date()) ? fmtClock(ts) : `${d.getDate()}/${d.getMonth() + 1}`; };
function dayLabel(ts) {
  const d = new Date(ts);
  const diff = daysBetween(new Date(d.getFullYear(), d.getMonth(), d.getDate()), today());
  return diff === 0 ? 'Hoy' : diff === 1 ? 'Ayer' : `${d.getDate()} ${MESES[d.getMonth()]}`;
}

const ICON = {
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>'
};

function paintAvatar(node, name) {
  const clean = String(name || '?').trim();
  node.textContent = clean === 'Yo' ? '🙂' : (clean.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?');
  let h = 0;
  for (const c of clean) h = (h * 31 + c.charCodeAt(0)) % 360;
  h = 190 + (h % 140);   // familia azul → violeta → magenta: coherente con la marca
  node.style.background = `linear-gradient(135deg, hsl(${h} 85% 62%), hsl(${(h + 35) % 360} 80% 48%))`;
}

function emptyState(icon, title, text) {
  const li = el('li', 'glass empty');
  li.append(el('span', 'em-ico', icon), el('strong', '', title), el('span', '', text));
  return li;
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Marca texto escrito por el usuario (nombres, notas, mensajes) para que no se traduzca
const ut = n => { n.setAttribute('translate', 'no'); return n; };

// Reinicia una animación CSS sobre un elemento
function replay(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

// Numera los hijos para escalonar sus animaciones de entrada
function setStagger(node) {
  [...node.children].forEach((c, i) => c.style.setProperty('--i', i));
}

/* ---------- Avisos emergentes (en cola) ---------- */
const toastQ = [];
let toasting = false;
function toast(msg, act) {
  if (toastQ.length > 3) toastQ.shift();
  if (act) { toastQ.length = 0; toastQ.push({ msg, act }); clearTimeout(toastT); toasting = false; } // las acciones (Deshacer) se muestran al instante
  else toastQ.push(msg);
  if (!toasting) nextToast();
}
let toastT = 0;
function nextToast() {
  const item = toastQ.shift();
  if (!item) { toasting = false; return; }
  toasting = true;
  const t = $('#toast');
  const act = typeof item === 'object' ? item.act : null;
  t.textContent = typeof item === 'object' ? item.msg : item;
  t.classList.toggle('act', !!act);
  if (act) {
    const b = el('button', 'toast-act', act.label);
    b.type = 'button';
    b.addEventListener('click', () => { act.fn(); t.classList.remove('show'); }, { once: true });
    t.appendChild(b);
  }
  t.classList.add('show');
  toastT = setTimeout(() => {
    t.classList.remove('show');
    toastT = setTimeout(nextToast, 450);
  }, act ? (act.ms || 6000) : 2700);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignorar */ }
    ta.remove();
    return ok;
  }
}

/* ---------- Tema día/noche: 6:00 a 20:00 día, resto noche ---------- */
function applyTheme() {
  const h = new Date().getHours();
  const m = state.settings.theme;
  const t = m === 'day' || m === 'night' ? m : ((h >= 6 && h < 20) ? 'day' : 'night');
  if (root.dataset.theme !== t) root.dataset.theme = t;
  $('#metaTheme').setAttribute('content', t === 'day' ? '#eef5ff' : '#060b1c');
}



/* ---------- Idioma (español / inglés) ---------- */
// Se traduce lo que aparece en pantalla con I18N.tr (ver i18n.js). Lo que escribe el usuario no se toca.
const T = s => (state.settings.lang === 'en' && window.I18N ? I18N.tr(s) : s);
const txtMap = new WeakMap();
const attrMap = new WeakMap();
const TR_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
let langObs = null;

const skipTr = n => { const p = n.nodeType === 1 ? n : n.parentElement; return !p || /^(SCRIPT|STYLE|CANVAS|TEXTAREA)$/.test(p.tagName) || !!p.closest('[translate="no"]'); };

function trAttr(e, a) {
  if (e.closest('[translate="no"]') || /^(SCRIPT|STYLE|CANVAS)$/.test(e.tagName)) return;   // los atributos de un textarea (placeholder) sí se traducen; su contenido no
  const v = e.getAttribute(a);
  if (!v) return;
  let rec = attrMap.get(e);
  if (rec && rec[a] && rec[a].en === v) return;
  const en = I18N.tr(v);
  if (en !== v) { if (!rec) { rec = {}; attrMap.set(e, rec); } rec[a] = { es: v, en }; e.setAttribute(a, en); }
  else if (rec) delete rec[a];
}

function trNode(n) {
  if (n.nodeType === 3) {
    if (skipTr(n)) return;
    const rec = txtMap.get(n);
    if (rec && n.data === rec.en) return;
    const es = n.data;
    const en = I18N.tr(es);
    if (en !== es) { txtMap.set(n, { es, en }); n.data = en; } else txtMap.delete(n);
  } else if (n.nodeType === 1) {
    if (n.tagName === 'TEXTAREA') { TR_ATTRS.forEach(a => trAttr(n, a)); return; }
    if (skipTr(n)) return;
    TR_ATTRS.forEach(a => trAttr(n, a));
    n.childNodes.forEach(trNode);
  }
}

function revertNode(n) {
  if (n.nodeType === 3) {
    const rec = txtMap.get(n);
    if (rec && n.data === rec.en) n.data = rec.es;
    txtMap.delete(n);
  } else if (n.nodeType === 1) {
    const rec = attrMap.get(n);
    if (rec) Object.keys(rec).forEach(a => { if (n.getAttribute(a) === rec[a].en) n.setAttribute(a, rec[a].es); });
    attrMap.delete(n);
    n.childNodes.forEach(revertNode);
  }
}

function applyLang(rerender = true) {
  const en = state.settings.lang === 'en';
  document.documentElement.lang = en ? 'en' : 'es';
  if (!langObs) {
    langObs = new MutationObserver(muts => {
      if (state.settings.lang !== 'en') return;
      for (const m of muts) {
        if (m.type === 'childList') m.addedNodes.forEach(trNode);
        else if (m.type === 'characterData') trNode(m.target);
        else if (m.type === 'attributes') trAttr(m.target, m.attributeName);
      }
    });
  }
  langObs.disconnect();
  if (en) {
    langObs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TR_ATTRS });
    trNode(document.body);
  } else revertNode(document.body);
  if (rerender) renderAll();
}

function renderAccount() {
  const a = state.account;
  $('#accIn').classList.toggle('hidden', !a);
  $('#accOut').classList.toggle('hidden', !!a);
  if (a) { $('#accName').textContent = state.me.name; $('#accMail').textContent = a.email; }
}

/* ---------- Apariencia: tema e idioma ---------- */
const THEME_OPTS = ['auto', 'day', 'night'];
function paintAppearance() {
  $('#themeSeg').dataset.idx = String(Math.max(0, THEME_OPTS.indexOf(state.settings.theme)));
  $('#langSeg').dataset.idx = state.settings.lang === 'en' ? '1' : '0';
}
function setTheme(m) {
  if (!THEME_OPTS.includes(m)) return;
  state.settings.theme = m;
  save();
  applyTheme();
  paintAppearance();
}
function setLang(l) {
  if (l !== 'es' && l !== 'en') return;
  state.settings.lang = l;
  save();
  paintAppearance();
  applyLang();
}

/* ---------- Pantalla de bienvenida ---------- */
let sp = 0;
let spRaf = 0;
let splashDone = false;
const easeOutCubic = k => 1 - Math.pow(1 - k, 3);

function setSp(v) {
  sp = Math.max(0, Math.min(1, v));
  root.style.setProperty('--sp', sp.toFixed(4));
}

function tweenSp(to, ms, cb) {
  const from = sp;
  const t0 = performance.now();
  root.classList.add('sp-live');
  cancelAnimationFrame(spRaf);
  const step = now => {
    const k = Math.min(1, (now - t0) / ms);
    setSp(from + (to - from) * easeOutCubic(k));
    if (k < 1) spRaf = requestAnimationFrame(step);
    else { root.classList.remove('sp-live'); if (cb) cb(); }
  };
  spRaf = requestAnimationFrame(step);
}

function finishSplash() {
  if (splashDone) return;
  splashDone = true;
  tweenSp(1, 800, () => {
    root.classList.add('entered');
    $('#splash').classList.add('hidden');
    afterSplash();
  });
}

function afterSplash() {
  [$('#appShell'), $('#tabbar'), $('#login')].forEach(n => { n.inert = false; });
  if (!$('#app').classList.contains('hidden')) { moveIndicator(false); playEnter($('#view-' + currentTab), 'from-right'); }
  if (state.settings.lock.on) lockShow('unlock'); else maybeTutorial();
}

function bindSplash() {
  const splash = $('#splash');
  [$('#appShell'), $('#tabbar'), $('#login')].forEach(n => { n.inert = true; });
  setSp(0);

  let drag = null;
  splash.addEventListener('pointerdown', e => {
    if (splashDone) return;
    cancelAnimationFrame(spRaf);
    root.classList.add('sp-live');
    drag = { y0: e.clientY, p0: sp, last: e.clientY, lt: performance.now(), v: 0, moved: 0, hint: !!e.target.closest('#splashHint') };
    try { splash.setPointerCapture(e.pointerId); } catch { /* ignorar */ }
    splash.classList.add('grabbing');
  });
  splash.addEventListener('pointermove', e => {
    if (!drag) return;
    setSp(drag.p0 + (drag.y0 - e.clientY) / (window.innerHeight * 0.62));
    drag.moved = Math.max(drag.moved, Math.abs(drag.y0 - e.clientY));
    const now = performance.now();
    const dt = now - drag.lt;
    if (dt > 0) drag.v = 0.75 * drag.v + 0.25 * ((drag.last - e.clientY) / dt);
    drag.last = e.clientY;
    drag.lt = now;
  });
  const end = () => {
    if (!drag) return;
    const { v, moved, hint } = drag;
    drag = null;
    splash.classList.remove('grabbing');
    // un toque sobre "Desliza hacia arriba" también abre (accesibilidad)
    if (hint && moved < 8) finishSplash();
    else if (sp > 0.3 || v > 0.55) finishSplash();
    else tweenSp(0, 600, () => root.classList.remove('sp-live'));
  };
  splash.addEventListener('pointerup', end);
  splash.addEventListener('pointercancel', end);

  // Alternativas: rueda del ratón, teclado y toque en "Desliza hacia arriba"
  splash.addEventListener('wheel', e => { if (e.deltaY > 20) finishSplash(); }, { passive: true });
  splash.addEventListener('keydown', e => {
    if (['Enter', ' ', 'ArrowUp'].includes(e.key)) { e.preventDefault(); finishSplash(); }
  });
  $('#splashHint').addEventListener('click', finishSplash);
  splash.focus({ preventScroll: true });
}

/* ---------- Cuenta con correo y contraseña ---------- */
// Lo primero que ve una persona nueva. El servidor guarda la contraseña con scrypt; aquí solo queda el correo.
// Los entrenos siguen guardándose en este dispositivo: la cuenta identifica tu perfil social.
const needLogin = () => !state.account && !state.loginSkipped;
const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]{1,200}\.[^\s@<>.]{2,24}$/;
let lgMode = 'signup', lgBusy = false;
const LG_ERR = {
  email: 'Ese correo no parece válido.', pass: 'La contraseña necesita entre 8 y 100 caracteres.', name: 'Escribe tu nombre.',
  exists: 'Ya hay una cuenta con ese correo. Prueba en «Entrar».', taken: 'Este perfil ya tiene otra cuenta. Entra con ella en «Entrar».',
  bad: 'Correo o contraseña incorrectos.', busy: 'Demasiados intentos. Espera unos minutos.', format: 'No se pudo enviar. Inténtalo de nuevo.',
  server: 'El servidor falló. Inténtalo en un momento.', age: 'Tienes que tener 16 años o más.', none: 'No hay servidor al que conectarse.', net: 'Sin conexión con el servidor.',
  rc: 'Escribe tu código de recuperación (20 letras y números).', rcbad: 'El correo o el código de recuperación no son correctos.'
};
function setLgMsg(k, ok) { const m = $('#loginMsg'); m.textContent = k ? T(LG_ERR[k] || k) : ''; m.classList.toggle('ok', !!ok); }
function setLgMode(m) {
  lgMode = m === 'login' ? 'login' : m === 'recover' ? 'recover' : 'signup';
  const su = lgMode === 'signup', rec = lgMode === 'recover';
  $('#lgMode').dataset.idx = su ? 0 : 1;
  $('#lgMode').classList.toggle('hidden', rec);
  $('#lgRcRow').classList.toggle('hidden', !rec);
  $('#lgForgot').classList.toggle('hidden', lgMode !== 'login');
  $('#lgBack').classList.toggle('hidden', !rec);
  $('#lgRecTitle').classList.toggle('hidden', !rec);
  $('#lgPass').placeholder = T(rec ? 'Contraseña nueva (mínimo 8)' : 'Mínimo 8 caracteres');
  $$('#lgMode button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.lg === lgMode)));
  $('#lgNameRow').classList.toggle('hidden', !su);
  $('#lgAgeRow').classList.toggle('hidden', !su);
  $('#lgPass').autocomplete = su ? 'new-password' : 'current-password';
  $('#lgGo').textContent = T(su ? 'Crear cuenta' : rec ? 'Restablecer contraseña' : 'Entrar');
  setLgMsg('');
}
function paintLoginSkip() { $('#loginSkip').classList.toggle('hidden', !!(window.Srv && Srv.http) || !window.Srv); }
async function submitLogin(e) {
  e.preventDefault();
  if (lgBusy) return;
  const su = lgMode === 'signup', rec = lgMode === 'recover', email = $('#lgEmail').value.trim().toLowerCase(), pw = $('#lgPass').value, name = $('#lgName').value.trim().slice(0, 20), rcIn = $('#lgRc').value;
  const bad = k => { setLgMsg(k); replay($('.login-card'), 'shake'); };
  if (su && !name) return bad('name');
  if (!EMAIL_RE.test(email)) return bad('email');
  if ((su || rec) && (pw.length < 8 || pw.length > 100)) return bad('pass');
  if (rec && rcIn.replace(/[^A-Za-z2-9]/g, '').length < 20) return bad('rc');
  if (!su && !rec && !pw) return bad('bad');
  if (su && !$('#lgAge').checked) return bad('age');
  lgBusy = true; $('#lgGo').disabled = true; setLgMsg('Conectando…', true);
  try {
    await Srv.discovered();
    if (!Srv.http) { bad('none'); return; }
    const a = Srv.auth, body = su ? { email, password: pw, name, code: a.code, token: a.token } : rec ? { email, password: pw, rc: rcIn } : { email, password: pw, token: a.token };
    let r, j = {};
    try { r = await fetch(Srv.http + '/auth/' + (su ? 'signup' : rec ? 'recover' : 'login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); j = await r.json().catch(() => ({})); }
    catch { bad('net'); return; }
    if (!r.ok || !j.ok) { bad(rec && j.err === 'bad' ? 'rcbad' : j.err || 'server'); return; }
    if (rec) {                                                      // contraseña restablecida: se guarda el código nuevo y se entra
      lgBusy = false; $('#lgGo').disabled = false;
      $('#lgRc').value = '';
      state.account = { email, rcPending: j.rc }; save();
      setLgMode('login'); setLgMsg('Contraseña cambiada. Ya puedes entrar.', true);
      showRecovery(j.rc, () => {});
      return;
    }
    if (!su && j.code !== state.me.code) { state.friends = state.friends.filter(f => !f.srv); state.me.code = j.code; }
    if (!su) { state.me.handle = /^[a-z0-9_.]{3,20}$/.test(String(j.handle)) ? j.handle : ''; state.me.priv = j.priv !== false; }
    state.me.name = String(j.name || name || state.me.name).slice(0, 20);
    state.account = { email, rcPending: su && j.rc ? String(j.rc) : '' };
    state.loginSkipped = false;
    $('#lgPass').value = '';
    save();
    Srv.identify({ code: state.me.code, name: state.me.name }, true);
    setLgMsg('');
    toast(su ? 'Cuenta creada. ¡Bienvenido!' : 'Sesión iniciada');
    hideLogin();
    renderAll();
    if (state.account.rcPending) showRecovery(state.account.rcPending);
  } finally { lgBusy = false; $('#lgGo').disabled = false; }
}

/* ---------- Primera vez: guía de cuenta y @usuario obligatorio ---------- */
const WELCOME = [
  { i: '👋', t: 'Crea tu cuenta', d: 'Con una cuenta tu perfil social te acompaña en cualquier móvil: tu nombre, tu @usuario, tus amigos y tus seguidores. Son solo 3 pasos.' },
  { i: '✍️', t: 'Tus datos', d: 'Escribe tu nombre (así te verán), tu correo y una contraseña de al menos 8 caracteres. Confirma que tienes 16 años o más. Guarda bien la contraseña: no se puede recuperar.' },
  { i: '＠', t: 'Tu @usuario', d: 'Justo después elegirás tu @usuario. Es obligatorio: es lo que usan los demás para encontrarte y seguirte. Luego te enseñaremos cómo se usa la app.' }
];
let wlI = 0;
function paintWelcome() {
  const s = WELCOME[wlI];
  $('#wlIco').textContent = s.i; $('#wlTitle').textContent = T(s.t); $('#wlText').textContent = T(s.d);
  $('#wlCount').textContent = `${wlI + 1} / ${WELCOME.length}`;
  $$('#wlDots i').forEach((d, k) => d.classList.toggle('on', k === wlI));
  $('#wlBack').classList.toggle('hidden', wlI === 0);
  $('#wlNext').textContent = T(wlI === WELCOME.length - 1 ? 'Crear mi cuenta' : 'Siguiente');
  replay($('.wl-card'), 'pop');
}
function showWelcome() { wlI = 0; $('#welcome').classList.remove('hidden', 'fade'); paintWelcome(); }
function endWelcome(mode) {
  state.welcomeDone = true; save();
  $('#welcome').classList.add('hidden');
  $('#login').classList.remove('hidden', 'fade');
  setLgMode(mode); paintLoginSkip();
  setTimeout(() => $(mode === 'signup' ? '#lgName' : '#lgEmail').focus({ preventScroll: true }), 300);
}
const needHandle = () => !!state.account && !state.me.handle;
const HANDLE_RE = /^[a-z0-9_.]{3,20}$/;
const handleOk = h => HANDLE_RE.test(h) && !/^\.|\.$|\.\./.test(h);
const gateOpen = () => !$('#handleGate').classList.contains('hidden');
function showGate() {
  if (gateOpen()) return;
  $('#handleGate').classList.remove('hidden', 'fade');
  const g = $('#gateInput');
  if (!g.value) { const guess = String(state.me.name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_.]/g, '').slice(0, 20); g.value = guess.length >= 3 ? guess : ''; }
  paintGate(); setGateMsg('');
  setTimeout(() => g.focus({ preventScroll: true }), 300);
}
function hideGate() {
  if (!gateOpen()) return;
  $('#handleGate').classList.add('fade');
  setTimeout(() => $('#handleGate').classList.add('hidden'), 400);
  maybeTutorial();
}
function setGateMsg(k, ok) { const m = $('#gateMsg'); m.textContent = k ? T(k) : ''; m.classList.toggle('ok', !!ok); }
function paintGate() { const h = $('#gateInput').value.trim().toLowerCase().replace(/^@/, ''); $('#gateGo').disabled = !handleOk(h) || gateBusy; }
let gateBusy = false, gatePending = '';
function submitGate(e) {
  e.preventDefault();
  const h = $('#gateInput').value.trim().toLowerCase().replace(/^@/, '');
  if (!handleOk(h)) { setGateMsg(HDL_ERR.invalid); return; }
  gateBusy = true; paintGate();
  if (!srvSend({ t: 'handle', h })) { gatePending = h; setGateMsg('Conectando…', true); }   // se envía solo en cuanto haya conexión
  else setGateMsg('Guardando…', true);
  setTimeout(() => { if (gateBusy) { gateBusy = false; paintGate(); if (gateOpen() && needHandle()) setGateMsg('Sin conexión con el servidor. Inténtalo en unos segundos.'); } }, 8000);
}

function showLogin() {
  closeSheets();
  $('#chat').classList.remove('open');
  $('#settings').classList.remove('open');
  $('#workout').classList.remove('open');
  $('#gym').classList.remove('open');
  syncOverlayClass();
  openGroupId = null;
  $('#app').classList.add('hidden');
  $('#tabbar').classList.add('hidden');
  $('#login').classList.add('hidden');
  if (!state.welcomeDone && !state.account) { showWelcome(); return; }
  $('#login').classList.remove('hidden', 'fade');
  setLgMode(state.account ? 'login' : 'signup');
  paintLoginSkip();
  setTimeout(() => $('#lgEmail').focus({ preventScroll: true }), 300);
}

function hideLogin() {
  const l = $('#login');
  if (!l.classList.contains('hidden')) {
    l.classList.add('fade');
    setTimeout(() => l.classList.add('hidden'), 450);
  }
  showApp();
  maybeTutorial();
}

/* ---------- Código de recuperación: se enseña una vez y hay que confirmar que está guardado ---------- */
function showRecovery(rc, after) {
  $('#rcCode').textContent = rc;
  $('#rcOk').checked = false; $('#rcGo').disabled = true;
  $('#recovery').classList.remove('hidden');
  $('#rcGo').onclick = () => {
    if (state.account) state.account.rcPending = '';
    save(); $('#recovery').classList.add('hidden');
    if (after) after();
  };
}
function logout() {
  state.account = null;
  state.loginSkipped = false;
  save();
  $('#settings').classList.remove('open');
  syncOverlayClass();
  showLogin();
}

function showApp() {
  $('#app').classList.remove('hidden');
  $('#tabbar').classList.remove('hidden');
  renderAll();
  requestAnimationFrame(() => {
    moveIndicator(false);
    if (splashDone) playEnter($('#view-' + currentTab), 'from-right');
  });
}



const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const buzz = pat => { try { if (navigator.vibrate && state.settings.haptics !== false && !reduceMotion()) navigator.vibrate(pat); } catch { /* ignorar */ } };
// Chispas de celebración (solo adorno; sin movimiento si el sistema pide menos animación)
function sparkle(host, n, gold) {
  host.innerHTML = '';
  if (reduceMotion()) return;
  const cols = gold ? ['#f5b301', '#fff1a8', '#ffd24a', '#ff9f1a'] : ['#1f6bff', '#5eead4', '#5ac8fa', '#a9b8ff', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const s = el('i'), a = Math.random() * Math.PI * 2, d = 36 + Math.random() * 64;
    s.style.setProperty('--dx', Math.cos(a) * d + 'px');
    s.style.setProperty('--dy', Math.sin(a) * d - 14 + 'px');
    s.style.setProperty('--r', Math.round(Math.random() * 360) + 'deg');
    s.style.background = cols[i % cols.length];
    s.style.animationDelay = Math.round(Math.random() * 120) + 'ms';
    host.appendChild(s);
  }
}

/* ---------- Tutorial guiado (primera vez) ---------- */
const TOUR = [
  { t: '¡Bienvenido a GymCrew! 💪', d: 'Un repaso rápido. Tus entrenos se guardan solo en tu móvil. Compartir con amigos o con tu gimnasio es siempre opcional y lo decides en cada entreno. Para mayores de 16 años.', tab: 'inicio' },
  { sel: '.tab[data-tab="historial"]', tab: 'historial', hs: 'today', t: 'Entrenar 🏋️', d: 'Apunta tu entreno con ejercicios, series y kilos. Los récords se detectan solos y el historial queda en el calendario.' },
  { sel: '#fab', tab: 'inicio', t: 'Crear ➕', d: 'Apunta un entreno, escribe una publicación o sube una historia de 24 h. Tú decides quién lo ve.' },
  { sel: '.tab[data-tab="amigos"]', tab: 'amigos', t: 'Mensajes 💬', d: 'Chats, grupos de tu gimnasio y búsqueda de personas por @usuario. Puedes bloquear, reportar y salir cuando quieras.' },
  { sel: '.tab[data-tab="perfil"]', tab: 'perfil', t: 'Perfil 🙂', d: 'Tu banner, tus publicaciones y tu progreso: racha y récords.' },
  { sel: '#openSettings', tab: 'inicio', t: 'Ajustes ⚙️', d: 'Tema, idioma, privacidad y copia de seguridad. GymCrew no sustituye a un profesional de la salud ni da consejos médicos ni de dieta.' },
  { t: '¡Todo listo! 🎉', d: 'Cuando quieras, pulsa ＋ y apunta tu primer entreno.', last: true }
];

let tourI = -1;

function maybeTutorial() {
  if (needHandle()) { if (!$('#app').classList.contains('hidden')) showGate(); return; }
  if (state.tutorialDone || tourI >= 0) return;
  if (!splashDone || $('#app').classList.contains('hidden') || (!$('#login').classList.contains('hidden') && !$('#login').classList.contains('fade'))) return;
  setTimeout(() => { if (!state.tutorialDone && tourI < 0) startTour(); }, 700);
}

function startTour() {
  tourI = 0;
  $('#tour').classList.remove('hidden');
  requestAnimationFrame(() => $('#tour').classList.add('on'));
  tourShow(0);
}

function tourShow(i) {
  const st = TOUR[i];
  tourI = i;
  if (st.tab && st.tab !== currentTab) showTab(st.tab);
  if (st.hs && state.ui.hseg !== st.hs) setHseg(st.hs);
  const card = $('#tourCard');
  $('#tourN').textContent = `${i + 1} / ${TOUR.length}`;
  $('#tourT').textContent = T(st.t);
  $('#tourD').textContent = T(st.d);
  $('#tourPrev').classList.toggle('hidden', i === 0);
  $('#tourNext').textContent = T(st.last ? 'Terminar' : 'Siguiente');
  $('#tourSkip').classList.toggle('hidden', !!st.last);
  card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
  const place = () => {
    if (tourI !== i) return;
    const hole = $('#tourHole');
    const target = st.sel ? $(st.sel) : null;
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = target.getBoundingClientRect(), pad = 8;
      hole.classList.remove('none');
      hole.style.cssText = `top:${r.top - pad}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;border-radius:${Math.min(28, Math.max(16, r.height / 2 + pad))}px`;
      const below = r.top + r.height / 2 < innerHeight / 2;
      card.style.top = below ? Math.min(innerHeight - 230, r.bottom + 18) + 'px' : 'auto';
      card.style.bottom = below ? 'auto' : Math.max(12, innerHeight - r.top + 18) + 'px';
    } else {
      hole.classList.add('none');
      hole.style.cssText = `top:${innerHeight / 2}px;left:${innerWidth / 2}px;width:0;height:0`;
      card.style.top = Math.max(40, innerHeight / 2 - 120) + 'px';
      card.style.bottom = 'auto';
    }
  };
  setTimeout(place, st.tab ? 760 : 60);
}

function endTour(done) {
  const wasNew = !state.tutorialDone;
  state.tutorialDone = true;
  save();
  tourI = -1;
  $('#tour').classList.remove('on');
  setTimeout(() => $('#tour').classList.add('hidden'), 350);
  showTab('inicio');
}

function bindTour() {
  $('#tourNext').addEventListener('click', () => { if (TOUR[tourI].last) endTour(true); else tourShow(tourI + 1); });
  $('#tourPrev').addEventListener('click', () => { if (tourI > 0) tourShow(tourI - 1); });
  $('#tourSkip').addEventListener('click', () => endTour(false));
  $('#btnTour').addEventListener('click', () => {
    $('#settings').classList.remove('open');
    syncOverlayClass();
    startTour();
  });
  window.addEventListener('resize', () => { if (tourI >= 0) tourShow(tourI); });
}

/* ---------- Dominio: ejercicios, volumen, récords y racha ---------- */
const exInfo = id => {
  const c = state.custom.find(x => x.id === id);
  if (c) return { n: c.n, m: c.m };
  const x = EX_BY_ID[id];
  return x ? { n: state.settings.lang === 'en' ? x[2] : x[1], m: x[3] } : { n: id, m: 'cuerpo' };
};
const exName = id => exInfo(id).n;
const est1rm = s => (s.r <= 0 || s.w <= 0 ? 0 : s.r === 1 ? s.w : Math.round(s.w * (1 + s.r / 30) * 10) / 10);
const doneSets = e => e.sets.filter(s => s.r > 0);
const fmtKg = v => (Math.round(v * 10) / 10).toLocaleString(state.settings.lang === 'en' ? 'en' : 'es');
const wKey = w => w.date + (w.time || '00:00');
const sortedW = () => [...state.workouts].sort((a, b) => wKey(a).localeCompare(wKey(b)));
const workoutVol = w => w.ex.reduce((a, e) => a + doneSets(e).reduce((b, s) => b + s.r * s.w, 0), 0);
const workoutSets = w => w.ex.reduce((a, e) => a + doneSets(e).length, 0);
const workoutMuscles = w => [...new Set([...w.muscles, ...w.ex.map(e => exInfo(e.k).m)])];

// Mejores marcas de un ejercicio dentro de una sesión
function sessionBest(e) {
  const sets = doneSets(e);
  return { rm: Math.max(0, ...sets.map(est1rm)), maxW: Math.max(0, ...sets.map(s => s.w)), vol: sets.reduce((a, s) => a + s.r * s.w, 0), reps: Math.max(0, ...sets.map(s => s.r)) };
}
// Récords de la sesión w frente a todas las anteriores. La primera vez que haces un ejercicio solo fija la base (sin récord).
function prsFor(w) {
  const before = state.workouts.filter(o => o.id !== w.id && wKey(o) < wKey(w));
  const out = [];
  for (const e of w.ex) {
    const cur = sessionBest(e);
    const prev = before.flatMap(o => o.ex.filter(x => x.k === e.k)).map(sessionBest);
    if (!prev.length || !doneSets(e).length) continue;
    const top = f => Math.max(0, ...prev.map(f));
    if (cur.maxW > 0) {
      if (cur.rm > top(p => p.rm)) out.push({ k: e.k, t: '1rm', v: cur.rm });
      else if (cur.maxW > top(p => p.maxW)) out.push({ k: e.k, t: 'peso', v: cur.maxW });
      else if (cur.vol > top(p => p.vol)) out.push({ k: e.k, t: 'vol', v: cur.vol });
    } else if (cur.reps > top(p => p.reps)) out.push({ k: e.k, t: 'reps', v: cur.reps });
  }
  return out;
}
const PR_LABEL = { '1rm': '1RM est.', peso: 'Peso máx.', vol: 'Volumen', reps: 'Repeticiones' };
const prText = p => `${exName(p.k)} · ${state.settings.lang === 'en' ? { '1rm': 'est. 1RM', peso: 'top weight', vol: 'volume', reps: 'reps' }[p.t] : PR_LABEL[p.t]} ${fmtKg(p.v)}${p.t === 'reps' ? '' : ' kg'}`;

// Historial de un ejercicio: una marca por sesión
function exHistory(k) {
  return sortedW().map(w => ({ w, e: w.ex.find(x => x.k === k) })).filter(x => x.e && doneSets(x.e).length).map(x => Object.assign({ date: x.w.date }, sessionBest(x.e)));
}

// Semana: lunes a domingo
const wkStart = d => startOfWeek(d);
const inWeek = (w, start) => { const d = daysBetween(start, parse(w.date)); return d >= 0 && d < 7; };
const weekWorkouts = start => state.workouts.filter(w => inWeek(w, start));
const weekDays = start => new Set(weekWorkouts(start).map(w => w.date));

// Racha flexible: semanas seguidas que cumplen el objetivo semanal. La semana en curso nunca la rompe; una semana fallida solo empieza de cero.
function streakInfo() {
  const goal = state.settings.goal, t = today(), w0 = wkStart(t);
  const cnt = new Map();
  for (const w of state.workouts) { const k = ymd(wkStart(parse(w.date))); cnt.set(k, (cnt.get(k) || 0) + 1); }
  const met = d => (cnt.get(ymd(d)) || 0) >= goal;
  const n = cnt.get(ymd(w0)) || 0;
  let cur = met(w0) ? 1 : 0, d = addDays(w0, -7);
  while (met(d)) { cur++; d = addDays(d, -7); }
  let best = 0, run = 0;
  const first = state.workouts.length ? wkStart(parse(sortedW()[0].date)) : w0;
  for (let x = first; x <= w0; x = addDays(x, 7)) { run = met(x) ? run + 1 : 0; best = Math.max(best, run); }
  return { cur, best: Math.max(best, cur), n, goal, left: Math.max(0, goal - n), days: weekDays(w0) };
}

function computeStats() {
  const list = sortedW(), t = today(), w0 = wkStart(t);
  const res = { total: list.length, month: 0, weeks: Array(8).fill(0), lastText: '—', last: null };
  if (!list.length) return res;
  const last = parse(list[list.length - 1].date), since = daysBetween(last, t);
  res.last = list[list.length - 1];
  res.lastText = since <= 0 ? 'Hoy' : since === 1 ? 'Ayer' : `Hace ${since} días`;
  res.month = list.filter(w => { const d = parse(w.date); return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth(); }).length;
  for (const w of list) { const diff = Math.floor(daysBetween(wkStart(parse(w.date)), w0) / 7); if (diff >= 0 && diff < 8) res.weeks[7 - diff]++; }
  return res;
}
const allPrs = () => state.workouts.reduce((a, w) => a + w.pr.length, 0);
const recentPrs = days => sortedW().reverse().filter(w => w.pr.length && daysBetween(parse(w.date), today()) <= days).flatMap(w => w.pr.map(p => Object.assign({ date: w.date }, p)));

// Series por grupo muscular de la semana (volumen semanal)
function weekVolume(start) {
  const r = Object.fromEntries(MUSCLE_IDS.map(m => [m, { sets: 0, kg: 0 }]));
  for (const w of weekWorkouts(start)) for (const e of w.ex) { const m = exInfo(e.k).m, s = doneSets(e); r[m].sets += s.length; r[m].kg += s.reduce((a, x) => a + x.r * x.w, 0); }
  return r;
}

/* ---------- Logros y marcos ---------- */
const FRAME_NAME = {};
const checkAchievements = () => {};

/* ---------- Avatar propio con marco ---------- */
function mountAva(host, size) {
  const a = el('span', 'ava');
  a.style.setProperty('--s', size + 'px');
  a.appendChild(el('span', 'ava-in'));
  host.insertBefore(a, host.firstChild);
  return a;
}

function updateAva(a, o) {
  const inn = a.firstChild;
  const key = o.icon ? 'i' + o.icon : o.photo ? 'p' + o.photo.length : 'n' + o.name;
  if (a.dataset.k !== key) {
    a.dataset.k = key;
    inn.textContent = '';
    inn.style.background = '';
    inn.style.fontSize = '';
    if (o.icon) {
      inn.textContent = o.icon;
      inn.style.fontSize = 'calc(var(--s) * .56)';
      inn.style.background = 'linear-gradient(135deg, rgba(255,255,255,.7), rgba(180,200,255,.35))';
    } else if (o.photo) {
      const img = new Image();
      img.alt = '';
      img.draggable = false;
      img.src = o.photo;
      inn.appendChild(img);
    } else paintAvatar(inn, o.name);
  }
  if (o.frame) a.dataset.frame = o.frame; else delete a.dataset.frame;
}

let hdrAva, bigAva;
function renderMe() {
  const o = { name: state.me.name, photo: state.me.photo, frame: state.me.frame };
  updateAva(hdrAva, o);
  updateAva(bigAva, o);
  $('#hello').textContent = state.me.name && state.me.name !== 'Yo' ? `Hola, ${state.me.name}` : 'Hola';
}

function fmtCodeNode(node, code) {
  node.textContent = '';
  node.append(code.slice(0, 4), Object.assign(el('span', 'l', code.slice(4))));
}

async function setPhotoFromFile(file) {
  if (!file) return;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const S = 256;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const m = Math.min(img.naturalWidth, img.naturalHeight);
    c.getContext('2d').drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, S, S);
    URL.revokeObjectURL(url);
    state.me.photo = c.toDataURL('image/jpeg', 0.85);
    save();
    renderAll();
    toast('Foto actualizada');
  } catch { toast('No se pudo cargar esa imagen'); }
}

/* ---------- Copia completa ---------- */
const BACKUP_KEYS = ['routines', 'custom', 'achievements'];
function makeBackup() {
  const st = { workouts: state.workouts, me: { name: state.me.name, frame: state.me.frame }, settings: { theme: state.settings.theme, lang: state.settings.lang, haptics: state.settings.haptics, goal: state.settings.goal, rest: state.settings.rest } };
  BACKUP_KEYS.forEach(k => { st[k] = state[k]; });
  return { app: 'gymcrew', v: 1, date: ymd(new Date()), state: JSON.parse(JSON.stringify(st)) };
}
function restoreBackup(src) {
  const n = load(JSON.parse(JSON.stringify(Object.assign({}, src, { friends: [], groups: [] }))));
  BACKUP_KEYS.forEach(k => { state[k] = n[k]; });
  if (src.me) { state.me.name = n.me.name; state.me.frame = n.me.frame; }
  if (src.settings) Object.assign(state.settings, { theme: n.settings.theme, lang: n.settings.lang, haptics: n.settings.haptics, goal: n.settings.goal, rest: n.settings.rest });
  const known = new Set(state.workouts.map(w => w.id));
  n.workouts.forEach(w => { if (!known.has(w.id)) state.workouts.push(w); });
  save();
  applyTheme();
  renderAll();
}

/* ---------- Perfil ---------- */
const BANNERS = [
  'linear-gradient(135deg, #17b983, #0a8259 55%, #064e3b)', 'linear-gradient(135deg, #5b95ff, #2a56d4 60%, #172a6e)',
  'linear-gradient(135deg, #ffd447, #ff9f5c 55%, #e0523f)', 'linear-gradient(135deg, #ff7a6b, #c92f55 60%, #4a1236)',
  'linear-gradient(135deg, #8f7bff, #5b95ff 55%, #17b983)', 'linear-gradient(135deg, #2b3a38, #111a19 60%, #000)'
];
const bannerIdx = () => Math.max(0, Math.min(BANNERS.length - 1, Math.floor(Number(state.me.banner)) || 0));
function paintBanner() {
  $('#pfBanner').style.background = BANNERS[bannerIdx()];
  const box = $('#bannerPick');
  box.innerHTML = '';
  BANNERS.forEach((g, i) => {
    const b = el('button', 'bn-sw' + (i === bannerIdx() ? ' on' : '')); b.type = 'button'; b.style.background = g;
    b.setAttribute('aria-label', `Banner ${i + 1}`); b.setAttribute('aria-pressed', String(i === bannerIdx()));
    b.addEventListener('click', () => { state.me.banner = i; save(); paintBanner(); });
    box.appendChild(b);
  });
}
function setPfEdit(open) {
  $('#pfEdit').setAttribute('aria-expanded', String(open));
  $('#pfEdit').textContent = T(open ? 'Cerrar' : 'Editar perfil');
  $('#pfEditBody').classList.toggle('open', open); $('#pfEditBody').inert = !open;
}
function renderProfile(animate) {
  paintBanner();
  const input = $('#nameInput');
  if (document.activeElement !== input) input.value = state.me.name === 'Yo' ? '' : state.me.name;
  paintProfileNet();
  renderProfileActivity();
  $('#photoDel').disabled = !state.me.photo;
  const st = streakInfo();
  $('#profStats').innerHTML = '';
  [[state.workouts.length, 'Entrenos'], [st.cur, 'Semanas en racha'], [allPrs(), 'Récords']].forEach(([n, l]) => {
    const b = el('div', 'pstat');
    b.append(el('b', '', String(n)), el('span', '', l));
    $('#profStats').appendChild(b);
  });
}

/* Tu actividad en el perfil: publicaciones, respuestas y fotos */
const myPosts = () => state.feed.filter(p => p.from === state.me.code).sort(postSort);
function myReplies() {
  const out = [];
  state.feed.forEach(p => { if (isBlocked(p.from)) return; p.cmt.forEach(c => { if (c.from === state.me.code) out.push({ c, p }); }); });
  return out.sort((a, b) => b.c.ts - a.c.ts);
}
function postGist(p) { return p.pub ? (p.pub.text || T('una foto')) : `${T('entreno')} · ${T(typeOf(p.w.ty).n)}`; }
function renderProfileActivity() {
  if (!$('#pfList')) return;
  const v = state.ui.pf;
  $('#pfSeg').dataset.idx = ['posts', 'replies', 'photos'].indexOf(v);
  $$('#pfSeg button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.pf === v)));
  const ul = $('#pfList'), grid = $('#pfGrid');
  ul.innerHTML = ''; grid.innerHTML = '';
  ul.classList.toggle('hidden', v === 'photos'); grid.classList.toggle('hidden', v !== 'photos');
  if (v === 'posts') {
    const list = myPosts().slice(0, 60);
    if (!list.length) ul.appendChild(emptyState('📝', 'Todavía no has publicado nada', 'Lo que compartas aparecerá aquí. Tú decides quién lo ve.'));
    list.forEach(p => ul.appendChild(feedCard(p)));
  } else if (v === 'replies') {
    const list = myReplies().slice(0, 80);
    if (!list.length) ul.appendChild(emptyState('💬', 'Aún no has respondido a nadie', 'Tus respuestas a publicaciones de otras personas aparecerán aquí.'));
    list.forEach(({ c, p }) => {
      const li = el('li', 'glass row tappable pf-reply'); li.tabIndex = 0; li.setAttribute('role', 'button');
      const main = el('div', 'main');
      main.append(el('small', '', `${T('Respondiste a')} ${p.from === state.me.code ? T('ti') : personName(p.from)} · ${dayLabel(c.ts)} ${fmtClock(c.ts)}`), ut(el('strong', '', c.text)), ut(el('small', 'pf-gist', '“' + postGist(p).slice(0, 80) + '”')));
      li.appendChild(main);
      const open = () => openThread(p);
      li.addEventListener('click', open); li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      ul.appendChild(li);
    });
  } else {
    const list = myPosts().filter(p => p.pub && p.pub.m).slice(0, 90);
    if (!list.length) { grid.classList.add('hidden'); ul.classList.remove('hidden'); ul.appendChild(emptyState('📷', 'Todavía no hay fotos', 'Las fotos y vídeos que publiques saldrán aquí.')); return; }
    list.forEach(p => {
      const b = el('button', 'pf-cell'); b.type = 'button'; b.setAttribute('aria-label', `${p.pub.m.k === 'vid' ? T('Vídeo') : T('Foto')} · ${dayLabel(p.ts)}`);
      const gone = () => { b.classList.add('gone'); b.textContent = '🖼'; };
      if (p.pub.m.k === 'img') { const im = document.createElement('img'); im.loading = 'lazy'; im.alt = ''; im.src = mediaUrl(p.pub.m.id); im.onerror = gone; b.appendChild(im); }
      else { const vd = document.createElement('video'); vd.muted = true; vd.playsInline = true; vd.preload = 'metadata'; vd.src = mediaUrl(p.pub.m.id); vd.onerror = gone; b.append(vd, el('span', 'pf-play', '▶')); }
      b.addEventListener('click', () => openThread(p));
      grid.appendChild(b);
    });
  }
}


/* ---------- Navegación con transiciones ---------- */
const GROUP = { inicio: 'inicio', historial: 'historial', amigos: 'amigos', perfil: 'perfil' };
const ORDER = ['inicio', 'historial', 'amigos', 'perfil'];
const TITLES = { inicio: 'Inicio', historial: 'Entrenar', amigos: 'Mensajes', perfil: 'Perfil' };
let currentTab = 'inicio';
let pendingSwitch = null;

// Coloca el indicador de cristal bajo la pestaña activa (se desliza con muelle)
function moveIndicator(animate = true) {
  const bar = $('#tabbar');
  const ind = $('#tabInd');
  const active = $('.tab.active');
  if (!active || bar.classList.contains('hidden')) return;
  const b = bar.getBoundingClientRect();
  const a = active.getBoundingClientRect();
  if (!b.width) return;
  if (!animate) ind.style.transition = 'none';
  ind.style.width = a.width + 'px';
  ind.style.height = a.height + 'px';
  ind.style.transform = `translate(${a.left - b.left - bar.clientLeft}px, ${a.top - b.top - bar.clientTop}px)`;
  if (!animate) { ind.getBoundingClientRect(); ind.style.transition = ''; }
}

function settleSwitch() {
  if (pendingSwitch) { clearTimeout(pendingSwitch.t); pendingSwitch.done(); pendingSwitch = null; }
}

function playEnter(view, fromClass) {
  setStagger(view);
  view.classList.add('entering', fromClass);
  setTimeout(() => view.classList.remove('entering', fromClass), 900);
}

function showTab(name) {
  if (name === currentTab) return;
  settleSwitch();
  const from = $('#view-' + currentTab);
  const to = $('#view-' + name);
  const dir = ORDER.indexOf(name) > ORDER.indexOf(currentTab) ? 1 : -1;
  const [outCls, inCls] = dir > 0 ? ['to-left', 'from-right'] : ['to-right', 'from-left'];
  window.scrollTo(0, 0);
  if (name === 'perfil') renderProfile(true);
  if (name === 'inicio') { renderHome(); pullPub(); }
  setStagger(to);
  from.classList.add('leaving', outCls);
  to.classList.add('active', 'entering', inCls);
  const done = () => { from.classList.remove('active', 'leaving', outCls); to.classList.remove('entering', inCls); };
  pendingSwitch = { done, t: setTimeout(() => { done(); pendingSwitch = null; }, 700) };
  currentTab = name;
  if (state.ui.tab !== name) { state.ui.tab = name; save(); }
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === GROUP[name]));
  $('#viewTitle').textContent = T(TITLES[name]);
  replay($('#viewTitle'), 'swap');
  moveIndicator(true);
}

function syncOverlayClass() {
  document.body.classList.toggle('ov-open', !!$('.overlay.open'));
}

let opener = null;
const rememberOpener = () => { const a = document.activeElement; opener = a && a !== document.body ? a : null; };
function restoreFocus() { const o = opener; opener = null; if (o && o.isConnected) try { o.focus({ preventScroll: true }); } catch { /* ignorar */ } }
function openSheet(id) { rememberOpener(); $('#backdrop').classList.add('open'); $('#' + id).classList.add('open'); }
function closeSheets() {
  const was = !!$('.sheet.open');
  $$('.sheet.open').forEach(s => s.classList.remove('open'));
  $('#backdrop').classList.remove('open');
  if (was) restoreFocus();
}

/* ---------- Render general ---------- */
function renderAll() {
  checkAchievements(false);
  renderMe();
  renderHome();
  renderEntrenos();
  renderSocial();
  renderProfile(false);
  renderAccount();
  paintGoalSettings();
  aliveNumbers();
}

/* ---------- Inicio: Hoy, semana, récords, amigos ---------- */
const typeChip = (t, on) => { const b = el('button', 'chip' + (on ? ' on' : '')); b.type = 'button'; b.dataset.type = t.id; b.setAttribute('aria-pressed', String(!!on)); b.append(el('span', '', t.e), el('span', '', ' ' + t.n)); return b; };

function renderHome() {
  const s = computeStats(), st = streakInfo();
  const today0 = ymd(new Date());
  $('#streakNum').textContent = st.cur;
  setStreakPill($('#streakPill'), st.cur);
  setStreakPill($('#profStreak'), st.cur);

  // Hoy
  const did = state.workouts.filter(w => w.date === today0);
  $('#todayTitle').textContent = did.length ? '✅ Hoy ya entrenaste' : 'Hoy';
  $('#todaySub').textContent = did.length ? `${did.length} entreno${did.length > 1 ? 's' : ''} · ${did.reduce((a, w) => a + w.dur, 0) || '—'} min. Si quieres, apunta otro.` : 'Apunta tu entreno y, si quieres, compártelo.';
  const go = $('#todayGo');
  go.textContent = 'Apuntar entreno';
  $('#repeatLast').classList.toggle('hidden', !state.workouts.length);

  // Semana en curso
  $('#weekCount').textContent = `${st.n}/${st.goal}`;
  $('#weekFill').style.width = Math.min(100, Math.round((st.n / st.goal) * 100)) + '%';
  $('#weekHint').textContent = st.n >= st.goal ? '🎯 Objetivo de la semana cumplido. Lo demás es extra.' : st.n === 0 ? `Tu objetivo: ${st.goal} entreno${st.goal > 1 ? 's' : ''} esta semana. Los días de descanso también suman.` : `Te ${st.left === 1 ? 'falta' : 'faltan'} ${st.left} para tu objetivo. Sin prisa.`;
  const dots = $('#weekDots');
  dots.innerHTML = '';
  const w0 = wkStart(today());
  for (let i = 0; i < 7; i++) {
    const d = addDays(w0, i), on = st.days.has(ymd(d));
    const wd = el('div', 'wd' + (on ? ' on' : '') + (ymd(d) === today0 ? ' today' : ''));
    wd.append(el('i', '', on ? '💪' : ''), el('span', '', DIAS[i]));
    dots.appendChild(wd);
  }
  $('#streakHint').textContent = st.cur ? `${st.cur} semana${st.cur > 1 ? 's' : ''} cumpliendo tu objetivo · mejor: ${st.best}.` : st.best ? `Tu mejor racha: ${st.best} semana${st.best > 1 ? 's' : ''}. Cada semana empieza de nuevo.` : 'Cumple tu objetivo semanal para empezar tu racha.';

  // Récords recientes
  const prs = recentPrs(30).slice(0, 3);
  $('#prCard').classList.toggle('hidden', !prs.length);
  const pl = $('#prList');
  pl.innerHTML = '';
  prs.forEach(p => { const li = el('li', 'glass row static'); li.append(el('span', 'ach-ico', '🏅'), ut(el('div', 'main', '')), el('div', 'side', dayLabel(parse(p.date).getTime()))); li.children[1].append(ut(el('strong', '', exName(p.k))), el('small', '', prText(p).split(' · ')[1])); pl.appendChild(li); });

  renderFeed();
  if (currentTab === 'perfil') renderProfileActivity();
  paintBell();
  if (thOpen) renderThread();
  void s;
}

function setStreakPill(node, n) {
  node.innerHTML = '';
  node.append(el('span', 'f', '🔥'), el('b', '', String(n)));
  node.classList.toggle('cold', n === 0);
  node.setAttribute('aria-label', `Racha de ${n} semanas`);
}

function workoutRow(w) {
  const li = el('li', 'glass row static');
  const t = typeOf(w.type);
  const main = el('div', 'main edit');
  main.tabIndex = 0; main.setAttribute('role', 'button'); main.setAttribute('aria-label', 'Editar entreno');
  const d = parse(w.date);
  const head = el('strong', '');
  head.append(`${t.e} ${T(t.n)} · ${d.getDate()} ${T(MESES[d.getMonth()])}${w.time ? ' · ' + w.time : ''} `, el('span', '', FEELS[w.feel] || ''));
  main.appendChild(head);
  const bits = [];
  if (w.dur) bits.push(`${w.dur} min`);
  if (w.ex.length) bits.push(`${w.ex.length} ejercicio${w.ex.length > 1 ? 's' : ''}`);
  const sets = workoutSets(w);
  if (sets) bits.push(`${sets} serie${sets > 1 ? 's' : ''}`);
  if (w.pr.length) bits.push(`🏅 ${w.pr.length} récord${w.pr.length > 1 ? 's' : ''}`);
  if (w.sh && (w.sh.f || w.sh.g.length)) bits.push('📣 compartido');
  if (bits.length) main.appendChild(el('small', '', bits.join(' · ')));
  if (w.note) main.appendChild(ut(el('small', 'note', w.note)));
  const open = () => openWorkout(w);
  main.addEventListener('click', open);
  main.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  const del = el('button', 'icon-btn plain');
  del.type = 'button';
  del.setAttribute('aria-label', 'Borrar entreno');
  del.innerHTML = ICON.x;
  del.addEventListener('click', () => deleteWorkout(w, li));
  li.append(main, del);
  return li;
}

function deleteWorkout(w, li) {
  const apply = () => {
    state.workouts = state.workouts.filter(x => x.id !== w.id);
    save(); renderAll(); buzz(10);
    toast('Entreno borrado', { label: 'Deshacer', fn: () => { state.workouts.push(w); save(); renderAll(); } });
  };
  if (li) { li.classList.add('removing'); setTimeout(apply, 280); } else apply();
}

// Registro de un toque: tipo + sensación. Es privado; compartirlo se decide en el registro completo.
function repeatLast() {
  const l = sortedW().pop();
  if (!l) return;
  openWorkout(null, { from: l });
}

/* ---------- Entrenos: historial, rutinas y progreso ---------- */
let viewMonth = new Date(today().getFullYear(), today().getMonth(), 1);
let histQ = '';

function renderBars(container, values, labels) {
  container.innerHTML = '';
  const max = Math.max(1, ...values);
  values.forEach((v, i) => {
    const col = el('div', 'bar-col');
    const bar = el('div', 'bar');
    bar.style.height = Math.max(v ? 8 : 3, Math.round((v / max) * 100)) + '%';
    col.append(el('span', 'bar-v', v ? String(v) : ''), bar, el('span', 'bar-l', labels[i]));
    container.appendChild(col);
  });
}

const HSEGS = ['today', 'hist'];
function setHseg(v) {
  state.ui.hseg = v;
  save();
  renderEntrenos();
}

function renderEntrenos() {
  const v = state.ui.hseg;
  $('#hsegBar').dataset.idx = HSEGS.indexOf(v);
  $$('#hsegBar button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.hseg === v)));
  HSEGS.forEach(p => $('#hpane-' + p).classList.toggle('hidden', p !== v));
  if (v === 'hist') renderHist(); else renderHome();
}

function renderHist() {
  const t = today();
  $('#monthTitle').textContent = `${T(MESES[viewMonth.getMonth()])} ${viewMonth.getFullYear()}`;
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const dim = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const days = new Set(state.workouts.map(w => w.date));
  const grid = $('#calGrid');
  grid.innerHTML = '';
  DIAS.forEach(d => grid.appendChild(el('span', 'dow', d)));
  for (let i = 0; i < lead; i++) grid.appendChild(el('span', 'day empty'));
  for (let d = 1; d <= dim; d++) {
    const ds = ymd(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    const b = el('button', 'day' + (days.has(ds) ? ' marked' : '') + (ds === ymd(t) ? ' today' : ''), String(d));
    b.type = 'button';
    b.setAttribute('aria-label', `${d} ${T(MESES[viewMonth.getMonth()])}${days.has(ds) ? ', con entreno' : ''}`);
    b.addEventListener('click', () => { const w = state.workouts.find(x => x.date === ds); if (w && days.has(ds)) openWorkout(w); else openWorkout(null, { date: ds }); });
    grid.appendChild(b);
  }
  const f = $('#typeFilters');
  f.innerHTML = '';
  [{ id: '', e: '✨', n: 'Todos' }, ...TYPES].forEach(tp => {
    const b = typeChip(tp, state.ui.filter === tp.id);
    b.addEventListener('click', () => { state.ui.filter = tp.id; save(); renderHist(); });
    f.appendChild(b);
  });
  const q = histQ.trim().toLowerCase();
  const list = sortedW().reverse().filter(w => {
    const d = parse(w.date);
    if (d.getFullYear() !== viewMonth.getFullYear() || d.getMonth() !== viewMonth.getMonth()) return false;
    if (state.ui.filter && w.type !== state.ui.filter) return false;
    return !q || w.note.toLowerCase().includes(q) || w.ex.some(e => exName(e.k).toLowerCase().includes(q));
  });
  const ul = $('#monthList');
  ul.innerHTML = '';
  if (!list.length) ul.appendChild(emptyState('📅', 'Nada por aquí', state.workouts.length ? 'No hay entrenos con ese filtro este mes.' : 'Cuando apuntes entrenos aparecerán aquí.'));
  list.forEach(w => ul.appendChild(workoutRow(w)));
  setStagger(ul);
}
function changeMonth(n) {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + n, 1);
  renderHist();
}


function openExDetail(k) {
  const h = exHistory(k);
  $('#exdName').textContent = exName(k);
  $('#exdName').setAttribute('translate', 'no');
  const best = f => Math.max(0, ...h.map(f));
  const stats = $('#exdStats');
  stats.innerHTML = '';
  const bw = !h.some(x => x.maxW);
  (bw ? [[best(x => x.reps), 'Reps (mejor serie)'], [h.length, 'Sesiones']] : [[fmtKg(best(x => x.rm)) + ' kg', '1RM estimado'], [fmtKg(best(x => x.maxW)) + ' kg', 'Peso máx.'], [fmtKg(best(x => x.vol)) + ' kg', 'Volumen (sesión)']]).forEach(([v, l]) => {
    const b = el('div', 'pstat'); b.append(el('b', '', String(v)), el('span', '', l)); stats.appendChild(b);
  });
  const pts = h.slice(-20).map(x => (bw ? x.reps : x.rm));
  const svg = $('#exdChart');
  svg.innerHTML = '';
  if (pts.length > 1) {
    const mx = Math.max(...pts), mn = Math.min(...pts), rg = mx - mn || 1;
    const xy = pts.map((v, i) => [10 + (i * 280) / (pts.length - 1), 70 - ((v - mn) / rg) * 55]);
    const NS = 'http://www.w3.org/2000/svg';
    const line = document.createElementNS(NS, 'polyline');
    line.setAttribute('points', xy.map(p => p.join(',')).join(' '));
    line.setAttribute('class', 'ln');
    svg.appendChild(line);
    xy.forEach(p => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', 3.2); svg.appendChild(c); });
  }
  svg.classList.toggle('hidden', pts.length < 2);
  const ul = $('#exdList');
  ul.innerHTML = '';
  sortedW().reverse().filter(w => w.ex.some(e => e.k === k && doneSets(e).length)).slice(0, 5).forEach(w => {
    const e = w.ex.find(x => x.k === k);
    const li = el('li', 'exd-row');
    li.append(el('span', '', `${parse(w.date).getDate()} ${T(MESES[parse(w.date).getMonth()])}`), el('span', '', doneSets(e).map(s => `${s.r}×${fmtKg(s.w)}`).join('  ')));
    ul.appendChild(li);
  });
  openSheet('sheetExD');
}

/* ---------- Editor de entreno ---------- */
let ed = null;      // entreno que se está editando
let edShare = null; // elección de compartir
let edDraftT = 0;

function blankWorkout(o = {}) {
  const n = new Date();
  return { id: '', date: o.date || ymd(n), time: `${pad(n.getHours())}:${pad(n.getMinutes())}`, dur: 0, type: state.ui.quickType, muscles: [], note: '', feel: 0, ex: [] };
}
const cloneEx = list => list.map(e => ({ k: e.k, sets: e.sets.map(s => ({ r: s.r, w: s.w })) }));
const lastSetsFor = k => { const h = sortedW().reverse().find(w => w.ex.some(e => e.k === k && doneSets(e).length)); return h ? doneSets(h.ex.find(e => e.k === k)) : []; };

function openWorkout(w, o = {}) {
  rememberOpener();
  if (w) ed = JSON.parse(JSON.stringify(w));
  else {
    ed = blankWorkout(o);
    if (o.from) { ed.type = o.from.type; ed.muscles = [...o.from.muscles]; ed.ex = cloneEx(o.from.ex); }
    else if (o.routine) { ed.type = o.routine.type; ed.ex = o.routine.ex.map(k => ({ k, sets: lastSetsFor(k).slice(0, 3).map(s => ({ r: s.r, w: s.w })) })); state.ui.lastRoutine = o.routine.id; save(); }
    else if (state.ui.draft && Date.now() - state.ui.draft.at < 12 * 3600e3 && !o.date) { ed = JSON.parse(JSON.stringify(state.ui.draft)); ed.id = ''; toast('Borrador recuperado'); }
  }
  edShare = w && w.sh ? { f: w.sh.f, p: !!w.sh.p, tp: w.sh.tp || '', g: [...w.sh.g], vol: w.sh.vol, note: w.sh.note, det: !!w.sh.det } : { f: false, p: false, tp: '', g: [], vol: false, note: false, det: true };
  paintWorkout();
  $('#workout').classList.add('open');
  syncOverlayClass();
  $('#wScroll').scrollTop = 0;
}

function closeWorkout(discard) {
  restStop(true);
  $('#workout').classList.remove('open');
  syncOverlayClass();
  if (discard && ed && !ed.id) { state.ui.draft = null; save(); }
  ed = null;
  restoreFocus();
}

function edDirty() { return !!ed && (ed.ex.length || ed.dur || ed.note || ed.feel); }
function saveDraft() {
  clearTimeout(edDraftT);
  if (!ed || ed.id) return;
  edDraftT = setTimeout(() => { if (ed && !ed.id && edDirty()) { state.ui.draft = Object.assign(JSON.parse(JSON.stringify(ed)), { at: Date.now() }); save(); } }, 600);
}

function paintWorkout() {
  $('#wTitle').textContent = T(ed.id ? 'Editar entreno' : 'Nuevo entreno');
  $('#wDate').value = ed.date;
  $('#wTime').value = ed.time || '';
  $('#wDur').value = ed.dur || '';
  $('#wNote').value = ed.note;
  $$('#wQuick button').forEach(b => b.setAttribute('aria-pressed', String(ed.date === ymd(addDays(today(), -Number(b.dataset.qd))))));
  const tp = $('#wType');
  tp.innerHTML = '';
  TYPES.forEach(t => { const b = typeChip(t, ed.type === t.id); b.addEventListener('click', () => { ed.type = t.id; paintWorkout(); saveDraft(); }); tp.appendChild(b); });
  const mu = $('#wMuscles');
  mu.innerHTML = '';
  const derived = new Set(ed.ex.map(e => exInfo(e.k).m));
  MUSCLES.forEach(m => {
    const on = ed.muscles.includes(m.id) || derived.has(m.id);
    const b = el('button', 'chip sm' + (on ? ' on' : ''), T(m.n));
    b.type = 'button';
    b.setAttribute('aria-pressed', String(on));
    b.addEventListener('click', () => { if (derived.has(m.id)) return; ed.muscles = ed.muscles.includes(m.id) ? ed.muscles.filter(x => x !== m.id) : [...ed.muscles, m.id]; paintWorkout(); saveDraft(); });
    mu.appendChild(b);
  });
  $$('#wFeel input').forEach(i => { i.checked = Number(i.value) === ed.feel; });
  $('#wLoad').classList.toggle('hidden', !!ed.id || !state.workouts.length);
  $('#wRepeat').classList.toggle('hidden', !state.workouts.length);
  $('#wDelete').classList.toggle('hidden', !ed.id);
  paintExercises();
  paintShare();
  restPaint();
}

function paintExercises() {
  const box = $('#wEx');
  box.innerHTML = '';
  ed.ex.forEach((e, ei) => {
    const card = el('div', 'glass ex-card');
    const head = el('div', 'ex-head');
    head.append(ut(el('strong', '', exName(e.k))), el('small', 'muted', T(MUSCLES.find(m => m.id === exInfo(e.k).m).n)));
    const prev = lastSetsFor(e.k);
    const rm = el('button', 'icon-btn plain');
    rm.type = 'button'; rm.setAttribute('aria-label', 'Quitar ejercicio'); rm.innerHTML = ICON.x;
    rm.addEventListener('click', () => { ed.ex.splice(ei, 1); paintWorkout(); saveDraft(); });
    head.appendChild(rm);
    card.appendChild(head);
    if (prev.length) card.appendChild(el('p', 'muted small ex-last', `${T('Última vez')}: ${prev.map(s => `${s.r}×${fmtKg(s.w)}`).join(' · ')}`));
    const sets = el('div', 'sets');
    sets.appendChild(Object.assign(el('div', 'set set-h'), { innerHTML: `<span>#</span><span>${T('Reps')}</span><span>kg</span><span>RPE</span><span></span>` }));
    e.sets.forEach((s, si) => {
      const row = el('div', 'set');
      const mk = (key, ph, max, step, mode) => {
        const i = document.createElement('input');
        i.type = 'number'; i.inputMode = mode; i.min = '0'; i.max = String(max); i.step = String(step);
        i.placeholder = ph; i.value = s[key] ? s[key] : '';
        i.setAttribute('aria-label', `${T(key === 'r' ? 'Reps' : key === 'w' ? 'Peso en kg' : 'RPE')} ${T('serie')} ${si + 1}`);
        i.addEventListener('input', () => { s[key] = Number(i.value) || 0; if (key === 'rpe' && s.rpe < 5) delete s.rpe; saveDraft(); });
        return i;
      };
      const del = el('button', 'icon-btn plain');
      del.type = 'button'; del.setAttribute('aria-label', 'Quitar serie'); del.innerHTML = ICON.x;
      del.addEventListener('click', () => { e.sets.splice(si, 1); paintWorkout(); saveDraft(); });
      row.append(el('span', 'sn', String(si + 1)), mk('r', '0', 999, 1, 'numeric'), mk('w', '0', 1000, 0.5, 'decimal'), mk('rpe', '—', 10, 0.5, 'decimal'), del);
      sets.appendChild(row);
    });
    card.appendChild(sets);
    const add = el('button', 'btn sm wide', T('+ Serie'));
    add.type = 'button';
    add.addEventListener('click', () => {
      const l = e.sets[e.sets.length - 1] || prev[e.sets.length] || prev[prev.length - 1];
      e.sets.push(l ? { r: l.r, w: l.w } : { r: 0, w: 0 });
      paintWorkout(); saveDraft();
      restStart(state.settings.rest, true);
    });
    card.appendChild(add);
    box.appendChild(card);
  });
  $('#wExEmpty').classList.toggle('hidden', ed.ex.length > 0);
}

/* Selector de ejercicios (catálogo + propios) */
function openExPicker() {
  $('#exSearch').value = '';
  paintExPicker();
  openSheet('sheetEx');
}
function paintExPicker() {
  const q = $('#exSearch').value.trim().toLowerCase();
  const box = $('#exList');
  box.innerHTML = '';
  const all = [...state.custom.map(c => ({ id: c.id, n: c.n, m: c.m, mine: true })), ...EXERCISES.map(x => ({ id: x[0], n: state.settings.lang === 'en' ? x[2] : x[1], m: x[3] }))];
  const found = all.filter(x => !q || x.n.toLowerCase().includes(q));
  MUSCLES.forEach(m => {
    const items = found.filter(x => x.m === m.id);
    if (!items.length) return;
    box.appendChild(el('p', 'label', T(m.n)));
    const g = el('div', 'ex-grid');
    items.forEach(x => {
      const b = el('button', 'chip' + (ed && ed.ex.some(e => e.k === x.id) ? ' on' : ''));
      b.type = 'button';
      b.appendChild(ut(el('span', '', (x.mine ? '⭐ ' : '') + x.n)));
      b.addEventListener('click', () => addExercise(x.id));
      g.appendChild(b);
    });
    box.appendChild(g);
  });
  if (!found.length) box.appendChild(el('p', 'muted small', T('Nada con ese nombre. Puedes crearlo abajo.')));
}
function addExercise(k) {
  if (!ed || ed.ex.length >= 40) return;
  if (!ed.ex.some(e => e.k === k)) {
    const prev = lastSetsFor(k);
    ed.ex.push({ k, sets: (prev.length ? prev.slice(0, 3) : [{ r: 0, w: 0 }]).map(s => ({ r: s.r, w: s.w })) });
  }
  closeSheets();
  paintWorkout();
  saveDraft();
}
function addCustomExercise() {
  const n = $('#exCustom').value.trim().slice(0, 40);
  if (!n) { toast('Escribe un nombre'); return; }
  if (state.custom.length >= 100) { toast('Has llegado al máximo de ejercicios propios'); return; }
  const c = { id: 'c' + uid(), n, m: $('#exCustomM').value };
  state.custom.push(c);
  save();
  $('#exCustom').value = '';
  addExercise(c.id);
}

/* Temporizador de descanso: sin sonido; una vibración suave al terminar (si está activada) */
let rest = { end: 0, timer: 0, total: 0 };
function restStart(sec, soft) {
  if (soft && rest.end && rest.end > Date.now()) return; // no pisa un descanso en marcha
  rest.total = sec;
  rest.end = Date.now() + sec * 1000;
  clearInterval(rest.timer);
  rest.timer = setInterval(restTick, 250);
  restPaint();
}
function restTick() {
  if (Date.now() >= rest.end) { clearInterval(rest.timer); rest.timer = 0; buzz([30, 60, 30]); }
  restPaint();
}
function restStop(silent) {
  clearInterval(rest.timer); rest.timer = 0; rest.end = 0;
  if (!silent) restPaint();
}
function restPaint() {
  const left = rest.end ? Math.max(0, Math.ceil((rest.end - Date.now()) / 1000)) : 0;
  const run = rest.end && left > 0;
  $('#restTime').textContent = run ? `${Math.floor(left / 60)}:${pad(left % 60)}` : rest.end ? T('¡Listo!') : T('Descanso');
  $('#restFill').style.width = run ? Math.round((left / rest.total) * 100) + '%' : rest.end ? '0%' : '100%';
  $('#restStart').textContent = run ? `+30 s` : `${state.settings.rest} s`;
  $('#restStop').classList.toggle('hidden', !rest.end);
  $('#restBar').classList.toggle('running', !!run);
}

/* Compartir: decisión explícita, entreno a entreno */
function paintShare() {
  const on = srvOn();
  $('#shareHint').textContent = on ? T('Nadie ve nada si no marcas una opción. La nota y los kilos no se envían salvo que lo actives aquí.') : T('Sin servidor: de momento no se puede compartir. Tus entrenos se quedan en este móvil.');
  $('#shFriends').checked = edShare.f;
  $('#shFriends').disabled = !on || !state.friends.some(f => f.srv);
  $('#shPublic').checked = edShare.p;
  $('#shPublic').disabled = !on;
  paintTopicRow($('#shTopics'), edShare.tp, id => { edShare.tp = id; paintShare(); });
  $('#shVol').checked = edShare.vol;
  $('#shDet').checked = edShare.det;
  $('#shNote').checked = edShare.note;
  $('#shOpts').classList.toggle('hidden', !(edShare.f || edShare.p || edShare.g.length));
  const box = $('#shGroups');
  box.innerHTML = '';
  state.groups.filter(g => g.srv && !g.direct).forEach(g => {
    const b = el('button', 'chip sm' + (edShare.g.includes(g.id) ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('aria-pressed', String(edShare.g.includes(g.id)));
    b.disabled = !on;
    b.appendChild(ut(el('span', '', `${g.gym ? '🏟️' : '👥'} ${g.name}`)));
    b.addEventListener('click', () => { edShare.g = edShare.g.includes(g.id) ? edShare.g.filter(x => x !== g.id) : [...edShare.g, g.id]; paintShare(); });
    box.appendChild(b);
  });
  $('#shGroupsWrap').classList.toggle('hidden', !box.children.length);
}

function readEditor() {
  ed.date = DAY_RE.test($('#wDate').value) ? $('#wDate').value : ymd(new Date());
  ed.time = $('#wTime').value;
  ed.dur = Math.round(num($('#wDur').value, 0, 600));
  ed.note = $('#wNote').value.slice(0, 300);
  const f = $('#wFeel input:checked');
  ed.feel = f ? Number(f.value) : 0;
}

function saveWorkout() {
  readEditor();
  ed.ex = ed.ex.map(e => ({ k: e.k, sets: e.sets.filter(s => s.r > 0) })).filter(e => e.sets.length);
  const isNew = !ed.id;
  const w = normWorkout(Object.assign({}, ed, { id: ed.id || uid() }));
  w.pr = prsFor(w);
  const share = edShare.f || edShare.p || edShare.g.length ? { f: edShare.f, p: edShare.p, tp: edShare.tp, g: edShare.g, vol: edShare.vol, note: edShare.note, det: edShare.det } : null;
  if (share) w.sh = share; else delete w.sh;
  const i = state.workouts.findIndex(x => x.id === w.id);
  if (i >= 0) state.workouts[i] = w; else state.workouts.push(w);
  if (isNew) state.ui.draft = null;
  save();
  if (share) shareWorkout(w);
  closeWorkout(false);
  buzz(14);
  renderAll();
  todayBurst();
  toast(w.pr.length ? `🏅 ${T('¡Récord!')} ${prText(w.pr[0])}` : `${typeOf(w.type).e} ${T('Entreno guardado')}`);
}


/* ---------- Social: datos ---------- */
let openGroupId = null;
let openGym = null;   // id del grupo de gimnasio abierto en su pantalla
let cmtOpen = new Set();
const rxOpen = new Set();
function popEl(n) { if (!reduceMotion() && n.animate) n.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' }); }
let rankMetric = 'n';
let modTarget = null;

const groupById = id => state.groups.find(g => g.id === id);
const friendById = id => state.friends.find(f => f.id === id);
const friendByCode = c => state.friends.find(f => f.code === c);
const isFollowed = c => state.net.following.some(x => x.code === c);
const knownPerson = c => !!friendByCode(c) || isFollowed(c) || state.net.followers.some(x => x.code === c);
const handleOf = c => { for (const k of ['following', 'followers', 'freqIn', 'freqOut']) { const x = state.net[k].find(y => y.code === c); if (x && x.handle) return x.handle; } return ''; };
const personName = c => (c === state.me.code ? 'Tú' : (friendByCode(c) || {}).name || state.names[c] || 'Alguien');
const senderName = from => (from === 'me' ? 'Tú' : (friendById(from) || {}).name || state.names[from] || 'Alguien');
const isBlocked = c => state.blocked.includes(c);
const lastMsg = g => g.messages[g.messages.length - 1];
function chatName(g) {
  if (g.direct) { const f = friendById(g.members[0]); return f ? f.name : g.name; }
  return g.name;
}
function memberLine(g) {
  if (g.codes && !g.direct) return ['Tú', ...g.codes.filter(c => c !== state.me.code).map(personName)].join(', ');
  const names = g.members.map(id => (friendById(id) || {}).name).filter(Boolean);
  return g.direct ? 'Chat directo' : ['Tú', ...names].join(', ');
}
function previewText(g) {
  const m = lastMsg(g);
  if (!m) return 'Sin mensajes todavía';
  if (m.type === 'sys') return m.text;
  return (m.from === 'me' ? 'Tú: ' : '') + m.text;
}

let lastBadge = 0;
function updateBadge() {
  const n = state.groups.reduce((a, g) => a + (g.unread || 0), 0) + state.requests.incoming.length;
  const b = $('#badge');
  b.textContent = n > 99 ? '99+' : n;
  b.classList.toggle('hidden', n === 0);
  if (n > lastBadge) replay(b, 'pop');
  lastBadge = n;
}

/* ---------- Social: pestañas ---------- */
const SEGS = ['chats', 'groups', 'friends'];
function setSeg(s) {
  if (state.ui.seg === s) return;
  state.ui.seg = s;
  save();
  renderSocial();
  swapList();
}

function renderSocial() {
  updateBadge();
  const seg = state.ui.seg;
  $('#srvNotice').classList.toggle('hidden', srvOn());
  $('#seg').dataset.idx = SEGS.indexOf(seg);
  $('#reqCard').classList.toggle('hidden', seg !== 'friends');
  $('#groupsBox').classList.toggle('hidden', seg !== 'groups');
  $('#chatList').classList.toggle('hidden', seg !== 'chats');
  const fl = state.ui.fl;
  $('#flChips').classList.toggle('hidden', seg !== 'friends');
  $('#friendList').classList.toggle('hidden', seg !== 'friends' || fl !== 'friends');
  $('#netList').classList.toggle('hidden', seg !== 'friends' || fl === 'friends');
  $('#segAdd').classList.toggle('hidden', seg !== 'chats');
  paintFl();
  renderRequests();
  renderNet();
  renderFeed();   // el feed vive en Inicio; se repinta también aquí por si cambian bloqueos o grupos
  renderGroupsList();
  renderChatList();
  renderFriends();
  if (openGym && $('#gym').classList.contains('open')) renderGym();
}

function swapList() {
  const nodes = { groups: ['#groupsBox'], chats: ['#chatList'], friends: ['#reqCard', '#flChips', state.ui.fl === 'friends' ? '#friendList' : '#netList'] }[state.ui.seg].map(s => $(s));
  nodes.forEach(n => {
    n.classList.remove('swap-in', 'swap');
    const cls = n.tagName === 'UL' ? 'swap' : 'swap-in';
    if (cls === 'swap') setStagger(n);
    replay(n, cls);
    setTimeout(() => n.classList.remove(cls), 900);
  });
}

/* ---------- Feed ---------- */
const postSort = (a, b) => b.ts - a.ts;
function visibleFeed(gid) { return state.feed.filter(p => !isBlocked(p.from) && (gid === undefined || p.gid === gid)).sort(postSort); }
// Fila de temas: elegir uno (o ninguno). onPick(id | '')
function paintTopicRow(box, cur, onPick, withAll) {
  box.innerHTML = '';
  const mk = (id, label) => {
    const b = el('button', 'chip' + (cur === id ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-pressed', String(cur === id));
    b.appendChild(ut(el('span', '', label)));
    b.addEventListener('click', () => onPick(cur === id && !withAll ? '' : id));
    box.appendChild(b);
  };
  if (withAll) mk('', T('Todos los temas'));
  TOPICS.forEach(t => mk(t.id, `${t.e} ${T(t.n)}`));
}
const isOpenPost = p => !!p.pubx || !!p.open || !!(p.aud && p.aud.p);
// «Para ti»: todo lo público, con lo que más conversación genera un poco por delante. «Siguiendo»: tú, tus amigos, tus grupos y la gente que sigues.
const feedScore = p => p.ts + Math.min(30, reactTotal(p) + 2 * p.cmt.length) * 20 * 60e3 + (isFollowed(p.from) ? 3600e3 : 0);
const homeFeed = () => {
  const tp = state.ui.tp, fy = state.ui.feedTab !== 'following';
  const list = visibleFeed().filter(p => (!tp || p.tp === tp) && (fy ? isOpenPost(p) && !p.stale : p.from === state.me.code || !p.pubx || isFollowed(p.from)));
  return fy ? list.sort((x, y) => feedScore(y) - feedScore(x)) : list;
};

function feedSummary(w) {
  const t = typeOf(w.ty), bits = [];
  if (w.dur) bits.push(`${w.dur} min`);
  if (w.ex) bits.push(`${w.ex} ${T(w.ex === 1 ? 'ejercicio' : 'ejercicios')}`);
  if (w.sets) bits.push(`${w.sets} ${T(w.sets === 1 ? 'serie' : 'series')}`);
  return `${t.e} ${T(t.n)}${bits.length ? ' · ' + bits.join(' · ') : ''}`;
}

const PR_KIND_EN = { '1rm': 'est. 1RM', peso: 'top weight', vol: 'volume', reps: 'reps' };
const reactTotal = p => Object.keys(p.react || {}).length;
// Detalle de ejercicios que recibo: solo texto y números acotados
function normDet(d) {
  return (Array.isArray(d) ? d : []).slice(0, 20).map(e => ({ n: str(e && e.n, 40), s: (Array.isArray(e && e.s) ? e.s : []).slice(0, 15).map(x => [Math.max(1, Math.min(999, Math.round(Number(x && x[0])) || 0)), Math.max(0, Math.min(1000, Math.round((Number(x && x[1]) || 0) * 10) / 10))]) })).filter(e => e.n && e.s.length);
}
const fmtSet = ([r, w]) => (w > 0 ? `${r}×${fmtKg(w)} kg` : `${r} ${T('reps')}`);
function detBox(det, open) {
  const d = document.createElement('details'); d.className = 'tw-det'; d.open = !!open;
  const sm = document.createElement('summary'); sm.textContent = `${T('Ver ejercicios')} (${det.length})`;
  d.appendChild(sm);
  det.forEach(e => {
    const row = el('div', 'det-ex');
    row.append(ut(el('strong', '', e.n)), el('span', 'det-sets', e.s.map(fmtSet).join('  ·  ')));
    d.appendChild(row);
  });
  return d;
}
function workoutEmbed(p, open) {
  const t = typeOf(p.w.ty);
  const box = el('div', 'tw-embed');
  const top = el('p', 'feed-sum');
  top.append(el('span', 'feed-type', `${t.e} ${T(t.n)}`));
  if (p.w.feel) top.append(' ', el('span', 'feed-feel', FEELS[p.w.feel]));
  box.appendChild(top);
  const stats = el('div', 'feed-stats');
  const tile = (n, l) => { const d = el('div', 'stat-tile'); d.append(el('b', '', String(n)), el('small', '', T(l))); stats.appendChild(d); };
  if (p.w.dur) tile(p.w.dur, 'min');
  if (p.w.ex) tile(p.w.ex, p.w.ex === 1 ? 'ejercicio' : 'ejercicios');
  if (p.w.sets) tile(p.w.sets, p.w.sets === 1 ? 'serie' : 'series');
  if (p.w.vol) tile(fmtKg(p.w.vol), 'kg en total');
  if (stats.children.length) box.appendChild(stats);
  (p.w.pr || []).forEach(r => box.appendChild(ut(el('span', 'pr-chip', `🏅 ${r.n} · ${state.settings.lang === 'en' ? PR_KIND_EN[r.k] : PR_LABEL[r.k] || ''} ${fmtKg(r.v)}${r.k === 'reps' ? '' : ' kg'}`))));
  if (p.w.note) box.appendChild(ut(el('p', 'feed-note', p.w.note)));
  const det = normDet(p.w.det);
  if (det.length) box.appendChild(detBox(det, open));
  return box;
}

function toggleLike(p) {
  const me = state.me.code;
  if (p.react[me] === '❤️') {
    delete p.react[me]; save();
    srvSend(Object.assign({ t: 'gx', k: 'react', p: { pid: p.id, o: p.from, e: '' } }, gxRoute(p)));
    renderSocial(); renderHome();
  } else { reactTo(p, '❤️'); }
}

function feedCard(p, opt = {}) {
  const mine = p.from === state.me.code;
  const li = el('li', 'glass tweet' + (opt.thread ? ' thread-main' : '')); li.dataset.id = p.id;
  const av = el('span', 'avatar');
  paintAvatar(av, mine ? state.me.name : personName(p.from));
  const col = el('div', 'tw-col');
  const head = el('div', 'tw-head');
  const grp = p.gid && groupById(p.gid) ? groupById(p.gid).name : '';
  const who = el('span', 'tw-who');
  who.append(ut(el('strong', '', mine ? T('Tú') : personName(p.from))), el('small', '', `${dayLabel(p.ts)} · ${fmtClock(p.ts)}`));
  if (grp) who.appendChild(ut(el('span', 'tw-grp', '👥 ' + grp)));
  if (p.pubx && pubHandles[p.from]) who.appendChild(el('span', 'tw-hdl', '@' + pubHandles[p.from]));
  if (isOpenPost(p)) who.appendChild(ut(el('span', 'tw-grp', '🌍 ' + T('Público'))));
  if (topicOf(p.tp)) who.appendChild(ut(el('span', 'tw-grp tw-tp', `${topicOf(p.tp).e} ${T(topicOf(p.tp).n)}`)));
  const menu = el('button', 'icon-btn plain');
  menu.type = 'button';
  menu.setAttribute('aria-label', mine ? T(p.pub ? 'Borrar publicación' : 'Dejar de compartir') : T('Más opciones'));
  menu.textContent = mine ? '🗑' : '⋯';
  menu.addEventListener('click', e => { e.stopPropagation(); if (mine) { unsharePost(p); closeThread(); } else openMod(p.from, p.pub ? 'publicación de ' + personName(p.from) : 'entreno de ' + personName(p.from), isOpenPost(p) ? p.id : ''); });
  head.append(who, menu);
  col.appendChild(head);
  col.appendChild(p.pub ? pubBody(p) : workoutEmbed(p, opt.thread));

  const mineR = p.react[state.me.code], liked = mineR === '❤️';
  const ncm = p.cmt.filter(c => !isBlocked(c.from)).length, nr = reactTotal(p);
  const bar = el('div', 'tw-actions');
  const act = (cls, ico, n, label) => { const b = el('button', 'tw-act ' + cls); b.type = 'button'; b.setAttribute('aria-label', label); b.append(el('span', 'tw-ico', ico), el('span', 'tw-n', n ? String(n) : '')); bar.appendChild(b); return b; };
  const rep = act('rep', '💬', ncm, `${T('Responder')} (${ncm})`);
  rep.addEventListener('click', e => { e.stopPropagation(); if (!opt.thread) openThread(p); else $('#thInput').focus(); });
  const lk = act('like' + (liked ? ' on' : ''), liked ? '❤️' : '🤍', nr, `${T('Me gusta')} (${nr})`);
  lk.setAttribute('aria-pressed', String(liked));
  if (mine) lk.disabled = true; else lk.addEventListener('click', e => { e.stopPropagation(); toggleLike(p); popEl(lk); });
  const more = act('more', mineR && !liked ? mineR : '😀', 0, T('Más reacciones'));
  more.setAttribute('aria-expanded', String(rxOpen.has(p.id)));
  if (mine) more.disabled = true; else more.addEventListener('click', e => { e.stopPropagation(); if (rxOpen.has(p.id)) rxOpen.delete(p.id); else rxOpen.add(p.id); renderSocial(); renderHome(); });
  col.appendChild(bar);
  if (nr) {
    const counts = {};
    Object.values(p.react).forEach(e => { counts[e] = (counts[e] || 0) + 1; });
    const sm = el('div', 'feed-summary');
    sm.append(el('span', 'em-stack', Object.keys(counts).sort((x, y) => counts[y] - counts[x]).slice(0, 4).join('')));
    col.appendChild(sm);
  }
  if (rxOpen.has(p.id) && !mine) {
    const tray = el('div', 'react-row');
    REACTS.forEach(e => {
      const b = el('button', 'react' + (mineR === e ? ' on' : ''), e);
      b.type = 'button'; b.setAttribute('aria-label', `Reaccionar ${e}`); b.setAttribute('aria-pressed', String(mineR === e));
      b.addEventListener('click', ev => { ev.stopPropagation(); rxOpen.delete(p.id); reactTo(p, e); });
      tray.appendChild(b);
    });
    col.appendChild(tray);
  }
  li.append(av, col);
  if (!opt.thread) {
    li.classList.add('tappable');
    li.addEventListener('click', e => { if (e.target.closest('button, video, a, input, details')) return; openThread(p); });
  }
  return li;
}

/* ---------- Hilo (respuestas) ---------- */
let thOpen = null;
function findPost(from, id) { return state.feed.find(p => p.id === id && p.from === from); }
function openThread(p) {
  if (!p) return;
  rememberOpener();
  thOpen = { from: p.from, id: p.id };
  renderThread();
  $('#thread').classList.add('open');
  $('#thread').setAttribute('aria-hidden', 'false');
  syncOverlayClass();
}
function closeThread() {
  if (!thOpen) return;
  thOpen = null;
  $('#thread').classList.remove('open');
  $('#thread').setAttribute('aria-hidden', 'true');
  syncOverlayClass();
  restoreFocus();
}
function renderThread() {
  if (!thOpen) return;
  const p = findPost(thOpen.from, thOpen.id);
  if (!p) { closeThread(); return; }
  const box = $('#thPost');
  box.innerHTML = '';
  box.appendChild(feedCard(p, { thread: true }));
  const ul = $('#thList');
  ul.innerHTML = '';
  const cs = p.cmt.filter(c => !isBlocked(c.from)).sort((a, b) => a.ts - b.ts);
  if (!cs.length) ul.appendChild(emptyState('💬', 'Aún no hay respuestas', 'Sé la primera persona en animar. Máximo 140 caracteres.'));
  cs.forEach(c => {
    const li = el('li', 'glass tweet cm');
    const av = el('span', 'avatar');
    const me = c.from === state.me.code;
    paintAvatar(av, me ? state.me.name : personName(c.from));
    const col = el('div', 'tw-col');
    const head = el('div', 'tw-head');
    const who = el('span', 'tw-who');
    who.append(ut(el('strong', '', me ? T('Tú') : personName(c.from))), el('small', '', `${dayLabel(c.ts)} · ${fmtClock(c.ts)}`));
    head.appendChild(who);
    if (!me) { const m = el('button', 'icon-btn plain'); m.type = 'button'; m.textContent = '⋯'; m.setAttribute('aria-label', T('Más opciones')); m.addEventListener('click', () => openMod(c.from, c.text)); head.appendChild(m); }
    col.append(head, ut(el('p', 'pub-text', c.text)));
    li.append(av, col);
    ul.appendChild(li);
  });
}

/* ---------- Notificaciones ---------- */
const unseenNotes = () => state.notes.filter(n => !n.seen && !isBlocked(n.from)).length;
function paintBell() {
  const n = unseenNotes(), b = $('#bellBadge');
  b.textContent = n > 9 ? '9+' : String(n);
  b.classList.toggle('hidden', n === 0);
  $('#bellBtn').setAttribute('aria-label', n ? `${T('Notificaciones')} (${n})` : T('Notificaciones'));
}
const kindOf = pid => { const p = state.feed.find(x => x.id === pid && x.from === state.me.code); return p && p.pub ? 'publicación' : 'entreno'; };
function noteText(n) {
  const who = personName(n.from), k = T(kindOf(n.pid));
  switch (n.type) {
    case 'like': return `${who} ${T('reaccionó')} ${n.e || '❤️'} ${T('a tu')} ${k}`;
    case 'cmt': return `${who} ${T('respondió')}: “${n.text}”`;
    case 'req': return `${who} ${T('quiere ser tu amigo')}`;
    case 'friend': return `${who} ${T('y tú ya sois amigos')}`;
    case 'follow': return `${who} ${T('empezó a seguirte')}`;
    case 'freq': return `${who} ${T('quiere seguirte')}`;
    case 'fok': return `${who} ${T('aceptó tu solicitud')}`;
    default: return `${who} ${T('se unió a')} ${n.gname || T('tu grupo')}`;
  }
}
let srvNotes = false;   // con servidor, las notificaciones las guarda y envía él (se ven igual en todos tus dispositivos)
function addNote(n, silent, fromSrv) {
  if (srvNotes && !fromSrv) return;
  if (!n.from || n.from === state.me.code || isBlocked(n.from)) return;
  if (n.id && state.notes.some(x => x.id === n.id)) return;
  if (n.name) state.names[n.from] = n.name;
  if (n.type === 'cmt' && n.cid && state.notes.some(x => x.cid === n.cid)) return;
  if (n.type === 'like') state.notes = state.notes.filter(x => !(x.type === 'like' && x.from === n.from && x.pid === n.pid));
  state.notes.push(Object.assign({ id: uid(), ts: Date.now(), seen: false, e: '', text: '', pid: '', gname: '' }, n));
  state.notes = state.notes.slice(-100);
  save();
  paintBell();
  if ($('#notes').classList.contains('open')) renderNotes();
  else if (!silent && state.settings.noteToast !== false) { const t = noteText(state.notes[state.notes.length - 1]); toast(t); systemNotify('GymCrew', t); }
}
function dropLikeNote(from, pid) { if (srvNotes) return; const n = state.notes.length; state.notes = state.notes.filter(x => !(x.type === 'like' && x.from === from && x.pid === pid)); if (n !== state.notes.length) { save(); paintBell(); if ($('#notes').classList.contains('open')) renderNotes(); } }
function markNotesSeen() { let ch = false; state.notes.forEach(n => { if (!n.seen) { n.seen = true; ch = true; } }); if (ch) { save(); if (srvNotes) srvSend({ t: 'nseen' }); } paintBell(); }

function renderNotes() {
  const ul = $('#ntList');
  ul.innerHTML = '';
  const list = state.notes.filter(n => !isBlocked(n.from)).sort((a, b) => b.ts - a.ts);
  if (!list.length) { ul.appendChild(emptyState('🔔', 'Todo tranquilo', 'Aquí verás cuando alguien reaccione, responda a tus publicaciones o te siga.')); return; }
  const rows = [], seen = {};
  list.forEach(n => {
    if (n.type === 'like') {
      const k = 'like:' + n.pid;
      if (seen[k]) { seen[k].names.push(n.from); seen[k].unseen = seen[k].unseen || !n.seen; return; }
      seen[k] = { n, names: [n.from], unseen: !n.seen };
      rows.push(seen[k]);
    } else rows.push({ n, names: [n.from], unseen: !n.seen });
  });
  rows.forEach(r => {
    const n = r.n, li = el('li', 'glass row nt-row' + (r.unseen ? ' unseen' : ''));
    li.tabIndex = 0; li.setAttribute('role', 'button');
    const av = el('span', 'avatar');
    paintAvatar(av, personName(n.from));
    const main = el('div', 'main');
    let line;
    if (n.type === 'like' && r.names.length > 1) {
      const a = personName(r.names[0]), more = r.names.length - 1;
      line = `${a} ${T('y')} ${more} ${T(more === 1 ? 'persona más reaccionaron a tu' : 'personas más reaccionaron a tu')} ${T(kindOf(n.pid))}`;
    } else line = noteText(n);
    main.appendChild(ut(el('strong', 'nt-line', line)));
    main.appendChild(el('small', '', `${dayLabel(n.ts)} · ${fmtClock(n.ts)}`));
    const ico = el('span', 'side nt-ico', { like: '❤️', cmt: '💬', req: '👋', friend: '🤝', join: '👥', follow: '➕', freq: '🔔', fok: '✅' }[n.type]);
    li.append(av, main, ico);
    const go = () => openNote(n);
    li.addEventListener('click', go);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    ul.appendChild(li);
  });
}
function openNote(n) {
  n.seen = true; save(); paintBell();
  if (n.type === 'like' || n.type === 'cmt') {
    const p = findPost(state.me.code, n.pid);
    if (p) { closeNotes(false); openThread(p); } else { toast('Esa publicación ya no está'); renderNotes(); }
    return;
  }
  closeNotes(false);
  showTab('amigos');
  if (n.type === 'join') setSeg('groups'); else { setSeg('friends'); if (n.type === 'follow') setFl('followers'); else if (n.type === 'fok') setFl('following'); else if (n.type === 'friend') setFl('friends'); }
  if (n.type === 'friend') { const f = friendByCode(n.from); if (f) openDirect(f.id); }
}
function openNotes() {
  rememberOpener();
  renderNotes();
  $('#notes').classList.add('open');
  $('#notes').setAttribute('aria-hidden', 'false');
  syncOverlayClass();
}
function closeNotes(restore = true) {
  if (!$('#notes').classList.contains('open')) return;
  $('#notes').classList.remove('open');
  $('#notes').setAttribute('aria-hidden', 'true');
  syncOverlayClass();
  markNotesSeen();
  if (restore) restoreFocus();
}

/* ---------- Inicio estilo timeline ---------- */
function bindTimeline() {
  $$('#feedTabs button').forEach(b => b.addEventListener('click', () => { state.ui.feedTab = b.dataset.ft; save(); renderFeed(); }));
  $('#tpSel').addEventListener('change', e => { state.ui.tp = TOPIC_IDS.includes(e.target.value) ? e.target.value : ''; save(); renderFeed(); });
  $('#newPill').addEventListener('click', () => { window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); $('#newPill').classList.add('hidden'); });
  window.addEventListener('scroll', () => { if (window.scrollY < 120) $('#newPill').classList.add('hidden'); }, { passive: true });
  $('#pfEdit').addEventListener('click', () => setPfEdit($('#pfEdit').getAttribute('aria-expanded') !== 'true'));
  $('#pfBanner').addEventListener('click', () => setPfEdit(true));
  setPfEdit(false);
  $$('#pfSeg button').forEach(b => b.addEventListener('click', () => { state.ui.pf = b.dataset.pf; save(); renderProfileActivity(); }));
  $('#bellBtn').addEventListener('click', openNotes);
  $('#ntBack').addEventListener('click', () => closeNotes());
  $('#ntRead').addEventListener('click', () => { markNotesSeen(); renderNotes(); });
  $('#thBack').addEventListener('click', closeThread);
  $('#thForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const p = thOpen && findPost(thOpen.from, thOpen.id), v = $('#thInput').value;
    if (!p || !v.trim()) return;
    commentOn(p, v);
    $('#thInput').value = '';
  });
  $('#rsNoteToast').checked = state.settings.noteToast !== false;
  $('#rsNoteToast').addEventListener('change', e => { state.settings.noteToast = e.target.checked; save(); });
  // «＋»: elegir qué crear
  $('#fab').addEventListener('click', () => openSheet('sheetNew'));
  $('#nwWorkout').addEventListener('click', () => { closeSheets(); openWorkout(null); });
  $('#nwPost').addEventListener('click', () => { closeSheets(); openPost('pub'); });
  $('#nwStory').addEventListener('click', () => { closeSheets(); openPost('story'); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#thread.open')) closeThread(); else if ($('#notes.open')) closeNotes();
  });
  paintBell();
}
// Aviso discreto cuando llegan publicaciones nuevas y estás leyendo más abajo
function maybeNewPill() { if (currentTab === 'inicio' && window.scrollY > 400) $('#newPill').classList.remove('hidden'); }

/* ---------- Publicaciones con foto/vídeo e historias ---------- */
const STORY_MS = 24 * 3600e3, VID_MAX = 15, IMG_MAX_PX = 1280;
const mediaUrl = id => (window.Srv && Srv.http ? Srv.http : '') + '/media/' + id;
const activeStories = code => state.stories.filter(s => s.from === code && Date.now() - s.ts < STORY_MS && !isBlocked(code)).sort((a, b) => a.ts - b.ts);
const expireStories = () => { const n = state.stories.length; state.stories = state.stories.filter(s => Date.now() - s.ts < STORY_MS); return n !== state.stories.length; };

async function prepImage(file) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { bmp = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('decode')); im.src = URL.createObjectURL(file); }); }
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
  const sc = Math.min(1, IMG_MAX_PX / Math.max(w0, h0)), w = Math.max(1, Math.round(w0 * sc)), h = Math.max(1, Math.round(h0 * sc));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(bmp, 0, 0, w, h);   // al redibujar se pierden los datos EXIF (ubicación, modelo del móvil…)
  let q = 0.82, blob;
  for (;;) { blob = await new Promise(r => c.toBlob(r, 'image/jpeg', q)); if (!blob || blob.size <= 500 * 1024 || q <= 0.45) break; q -= 0.1; }
  if (!blob || blob.size > 600 * 1024) throw new Error('big');
  return { blob, k: 'img', w, h, d: 0 };
}

// Recodifica el vídeo en el propio móvil: máx. 15 s, 720 px, sin audio (así nadie comparte conversaciones sin querer)
function prepVideo(file, onProg) {
  return new Promise((ok, no) => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    const url = URL.createObjectURL(file);
    v.src = url;
    const done = fn => arg => { URL.revokeObjectURL(url); fn(arg); };
    const fail = done(no), good = done(ok);
    v.onerror = () => fail(new Error('decode'));
    v.onloadedmetadata = () => {
      const vw = v.videoWidth || 640, vh = v.videoHeight || 360;
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
        if (file.size <= 4 * 1024 * 1024 && /^video\/(mp4|webm)/.test(file.type)) return good({ blob: file, k: 'vid', w: vw, h: vh, d: Math.min(VID_MAX, Math.round(v.duration) || 0) });
        return fail(new Error('norec'));
      }
      const sc = Math.min(1, 720 / Math.max(vw, vh)), w = Math.max(2, Math.round(vw * sc / 2) * 2), h = Math.max(2, Math.round(vh * sc / 2) * 2);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      const mime = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
      let rec;
      try { rec = new MediaRecorder(c.captureStream(24), mime ? { mimeType: mime, videoBitsPerSecond: 900000 } : { videoBitsPerSecond: 900000 }); } catch { return fail(new Error('norec')); }
      const parts = [], dur = Math.min(isFinite(v.duration) && v.duration > 0 ? v.duration : VID_MAX, VID_MAX);
      rec.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(parts, { type: String(rec.mimeType || 'video/webm').split(';')[0] });
        if (blob.size > 4 * 1024 * 1024) return fail(new Error('big'));
        good({ blob, k: 'vid', w, h, d: Math.round(dur) });
      };
      const draw = () => {
        x.drawImage(v, 0, 0, w, h);
        if (onProg) onProg(Math.min(1, v.currentTime / dur));
        if (v.ended || v.currentTime >= dur) { v.pause(); if (rec.state !== 'inactive') rec.stop(); return; }
        requestAnimationFrame(draw);
      };
      rec.start(250);
      v.play().then(() => requestAnimationFrame(draw)).catch(() => fail(new Error('decode')));
    };
  });
}

async function uploadMedia(blob, ttl, ref) {
  const a = window.Srv && Srv.auth, base = window.Srv && Srv.http;
  if (!a || !base || !Srv.online) throw new Error('offline');
  const r = await fetch(`${base}/media?ttl=${ttl}&ref=${encodeURIComponent(ref)}`, { method: 'POST', headers: { 'X-Code': a.code, 'X-Token': a.token, 'Content-Type': 'application/octet-stream' }, body: blob });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id) throw new Error(j.err || 'http');
  return j;
}
const POST_ERR = { offline: 'Necesitas conexión con el servidor para publicar.', big: 'El archivo es demasiado grande.', quota: 'Has llegado al límite de archivos en el servidor. Borra alguna publicación.', busy: 'Demasiadas subidas seguidas. Prueba más tarde.', type: 'Ese tipo de archivo no está permitido.', decode: 'No se pudo leer ese archivo.', norec: 'Este navegador no puede preparar ese vídeo. Prueba con uno más corto o una foto.', auth: 'El servidor no reconoce este dispositivo.' };

let postMode = 'pub', postMedia = null, postBusy = false;
function paintPostPrev() {
  const box = $('#pPrev');
  box.innerHTML = '';
  box.classList.toggle('hidden', !postMedia);
  $('#pDrop').classList.toggle('hidden', !postMedia);
  if (!postMedia) return;
  if (postMedia.k === 'img') { const im = document.createElement('img'); im.alt = ''; im.src = postMedia.url; box.appendChild(im); }
  else { const v = document.createElement('video'); v.src = postMedia.url; v.muted = true; v.controls = true; v.playsInline = true; v.preload = 'metadata'; box.appendChild(v); }
}
function paintPostAud() {
  const box = $('#pAud');
  box.innerHTML = '';
  const row = (id, label, on) => {
    const l = el('label', 'aud-row');
    const i = document.createElement('input');
    i.type = 'checkbox'; i.id = id; i.checked = on; i.className = 'switch';
    l.append(ut(el('span', '', label)), i);
    box.appendChild(l);
  };
  row('aud-f', T('Mis amigos'), false);
  row('aud-o', T('Mis seguidores'), false);
  row('aud-p', T('Público (cualquiera en GymCrew)'), false);
  state.groups.filter(g => g.srv && g.gym).forEach(g => row('aud-g-' + g.id, g.name, false));
}
let postTopic = '';
function paintPostTopics() { paintTopicRow($('#pTopics'), postTopic, id => { postTopic = id; paintPostTopics(); }); }
function openPost(mode) {
  if (!srvOn()) { toast('Necesitas conexión con el servidor para publicar.'); return; }
  postMode = mode === 'story' ? 'story' : 'pub';
  postMedia = null; postBusy = false; postTopic = '';
  $('#pText').value = '';
  $('#pMsg').textContent = '';
  paintPostMode(); paintPostPrev(); paintPostAud(); paintPostTopics();
  openSheet('sheetPost');
}
function paintPostMode() {
  $('#pMode').dataset.idx = postMode === 'story' ? 1 : 0;
  $$('#pMode button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === postMode)));
  $('#pTitle').textContent = T(postMode === 'story' ? 'Nueva historia' : 'Nueva publicación');
  $('#pText').maxLength = postMode === 'story' ? 140 : 400;
  $('#pText').value = $('#pText').value.slice(0, $('#pText').maxLength);
  $('#pSend').textContent = T(postMode === 'story' ? 'Subir historia' : 'Publicar');
  const ap = $('#aud-p'); if (ap) { ap.closest('.aud-row').classList.toggle('hidden', postMode === 'story'); if (postMode === 'story') ap.checked = false; }
}
async function pickMedia(file) {
  if (!file) return;
  const msg = $('#pMsg');
  msg.textContent = T('Preparando…');
  postBusy = true; $('#pSend').disabled = true;
  try {
    const r = file.type.startsWith('video/') ? await prepVideo(file, f => { msg.textContent = `${T('Preparando vídeo…')} ${Math.round(f * 100)}%`; }) : await prepImage(file);
    if (postMedia) URL.revokeObjectURL(postMedia.url);
    postMedia = Object.assign(r, { url: URL.createObjectURL(r.blob) });
    msg.textContent = '';
    paintPostPrev();
  } catch (e) { msg.textContent = T(POST_ERR[e.message] || POST_ERR.decode); }
  postBusy = false; $('#pSend').disabled = false;
}
async function sendPost() {
  if (postBusy) return;
  const msg = $('#pMsg'), text = $('#pText').value.trim();
  const aud = { f: $('#aud-f') && $('#aud-f').checked, o: $('#aud-o') && $('#aud-o').checked, p: !!($('#aud-p') && $('#aud-p').checked), g: state.groups.filter(g => g.srv && g.gym && $('#aud-g-' + g.id) && $('#aud-g-' + g.id).checked).map(g => g.id) };
  if (!text && !postMedia) { msg.textContent = T('Escribe algo o añade una foto o un vídeo.'); return; }
  if (!aud.f && !aud.o && !aud.p && !aud.g.length) { msg.textContent = T('Elige quién lo ve.'); return; }
  if (aud.p && !state.me.handle) { msg.textContent = T('Para publicar en público primero elige tu @usuario (Social → Amigos).'); return; }
  postBusy = true; $('#pSend').disabled = true; msg.textContent = T('Subiendo…');
  const id = uid(), kind = postMode;
  try {
    let m = null;
    if (postMedia) { const up = await uploadMedia(postMedia.blob, kind === 'story' ? 'story' : 'post', id); m = { id: up.id, k: up.k, w: postMedia.w, h: postMedia.h, d: postMedia.d }; }
    const p = { id, text }; if (m) p.m = m; if (kind === 'pub' && postTopic) p.tp = postTopic;
    let ok = true;
    if (aud.f) ok = srvSend({ t: 'gx', to: 'friends', k: kind, p }) && ok;
    if (aud.o) ok = srvSend({ t: 'gx', to: 'followers', k: kind, p }) && ok;
    if (aud.p) ok = srvSend({ t: 'gx', to: 'public', k: kind, p }) && ok;
    aud.g.forEach(gid => { ok = srvSend({ t: 'gx', gid, k: kind, p }) && ok; });
    if (!ok) throw new Error('offline');
    const now = Date.now();
    if (kind === 'story') state.stories.push({ id, from: state.me.code, gid: '', ts: now, text, m, seen: true, aud });
    else state.feed.push({ id, from: state.me.code, gid: '', ts: now, w: null, pub: { text, m }, tp: postTopic, aud, react: {}, cmt: [] });
    save();
    closeSheets();
    renderAll();
    toast(kind === 'story' ? 'Historia subida. Desaparece en 24 h.' : 'Publicado');
  } catch (e) { msg.textContent = T(POST_ERR[e.message] || 'No se pudo publicar.'); }
  postBusy = false; $('#pSend').disabled = false;
}
function bindPost() {
  $$('#pMode button').forEach(b => b.addEventListener('click', () => { postMode = b.dataset.mode; paintPostMode(); }));
  ['#pFile', '#pCam'].forEach(id => $(id).addEventListener('change', ev => { const f = ev.target.files[0]; ev.target.value = ''; pickMedia(f); }));
  $('#pDrop').addEventListener('click', () => { if (postMedia) URL.revokeObjectURL(postMedia.url); postMedia = null; paintPostPrev(); });
  $('#pSend').addEventListener('click', sendPost);
  bindStories();
}

// Cuerpo de una publicación en el feed
function mediaNode(m, who) {
  const wrap = el('div', 'pub-media');
  const gone = () => { wrap.innerHTML = ''; wrap.classList.add('gone'); wrap.appendChild(el('span', '', T('Este contenido ya no está disponible'))); };
  if (m.k === 'img') { const im = document.createElement('img'); im.loading = 'lazy'; im.alt = `${T('Foto de')} ${who}`; im.src = mediaUrl(m.id); im.onerror = gone; if (m.w && m.h) im.style.aspectRatio = `${m.w} / ${m.h}`; wrap.appendChild(im); }
  else { const v = document.createElement('video'); v.controls = true; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata'; v.src = mediaUrl(m.id); v.onerror = gone; v.setAttribute('aria-label', `${T('Vídeo de')} ${who}`); if (m.w && m.h) v.style.aspectRatio = `${m.w} / ${m.h}`; wrap.appendChild(v); }
  return wrap;
}
function pubBody(p) {
  const box = el('div', 'pub-body');
  if (p.pub.text) box.appendChild(ut(el('p', 'pub-text', p.pub.text)));
  if (p.pub.m) box.appendChild(mediaNode(p.pub.m, p.from === state.me.code ? T('Tú') : personName(p.from)));
  return box;
}

/* Historias */
let sv = null, svTimer = 0;
function openStories(code) {
  const list = activeStories(code);
  if (!list.length) return;
  sv = { code, list, i: Math.max(0, list.findIndex(s => !s.seen)) };
  $('#storyView').classList.remove('hidden');
  $('#appShell').inert = true;
  showStory();
  $('#svClose').focus();
}
function closeStories() {
  clearTimeout(svTimer);
  const v = $('#svStage video'); if (v) v.pause();
  $('#svStage').innerHTML = '';
  $('#storyView').classList.add('hidden');
  $('#appShell').inert = false;
  sv = null;
  save(); renderSocial();
}
function showStory() {
  clearTimeout(svTimer);
  const s = sv.list[sv.i], mine = sv.code === state.me.code;
  s.seen = true;
  const nm = mine ? T('Tú') : personName(sv.code);
  $('#svAva').textContent = '';
  paintAvatar($('#svAva'), mine ? state.me.name : nm);
  ut($('#svName')).textContent = nm;
  $('#svWhen').textContent = `${fmtClock(s.ts)} · ${T('desaparece en')} ${Math.max(1, Math.ceil((STORY_MS - (Date.now() - s.ts)) / 3600e3))} h`;
  const bars = $('#svBars');
  bars.innerHTML = '';
  sv.list.forEach((_, i) => { const b = el('i', i < sv.i ? 'done' : i === sv.i ? 'cur' : ''); bars.appendChild(b); });
  const stage = $('#svStage');
  stage.innerHTML = '';
  const next = () => nextStory();
  const auto = !reduceMotion();
  if (s.m) {
    const m = s.m;
    if (m.k === 'img') {
      const im = document.createElement('img'); im.alt = `${T('Historia de')} ${nm}`; im.src = mediaUrl(m.id);
      im.onerror = () => { stage.innerHTML = ''; stage.appendChild(el('p', 'sv-gone', T('Este contenido ya no está disponible'))); };
      stage.appendChild(im);
      if (auto) svTimer = setTimeout(next, 6000);
    } else {
      const v = document.createElement('video'); v.src = mediaUrl(m.id); v.muted = true; v.playsInline = true; v.autoplay = true; v.controls = false;
      v.setAttribute('aria-label', `${T('Historia de')} ${nm}`);
      v.onended = () => { if (auto) next(); };
      v.onerror = () => { stage.innerHTML = ''; stage.appendChild(el('p', 'sv-gone', T('Este contenido ya no está disponible'))); };
      stage.appendChild(v);
      v.play().catch(() => {});
      if (auto) svTimer = setTimeout(next, (VID_MAX + 2) * 1000);
    }
    if (s.text) stage.appendChild(ut(el('p', 'sv-cap', s.text)));
  } else {
    let h = 0; for (const c of s.id) h = (h * 31 + c.charCodeAt(0)) % 360;
    const card = el('div', 'sv-text'); card.style.background = `linear-gradient(160deg, hsl(${200 + h % 80} 85% 42%), hsl(${230 + h % 70} 80% 28%))`;
    card.appendChild(ut(el('p', '', s.text)));
    stage.appendChild(card);
    if (auto) svTimer = setTimeout(next, 6000);
  }
  $('#svAdd').classList.toggle('hidden', !mine);
  $('#svDel').classList.toggle('hidden', !mine);
  $('#svMore').classList.toggle('hidden', mine);
  const cur = bars.children[sv.i];
  if (cur && auto) { cur.style.setProperty('--dur', (s.m && s.m.k === 'vid' ? VID_MAX : 6) + 's'); }
}
function nextStory() { if (!sv) return; if (sv.i >= sv.list.length - 1) return closeStories(); sv.i++; showStory(); }
function prevStory() { if (!sv) return; if (sv.i > 0) sv.i--; showStory(); }
function deleteStory() {
  if (!sv || sv.code !== state.me.code) return;
  const s = sv.list[sv.i];
  if (!confirm(T('¿Borrar esta historia?'))) return;
  const a = s.aud || { f: false, g: [] };
  if (a.f) srvSend({ t: 'gx', to: 'friends', k: 'del', p: { pid: s.id } });
  if (a.o) srvSend({ t: 'gx', to: 'followers', k: 'del', p: { pid: s.id } });
  if (a.p) srvSend({ t: 'gx', to: 'public', k: 'del', p: { pid: s.id } });
  (a.g || []).forEach(gid => { if (groupById(gid)) srvSend({ t: 'gx', gid, k: 'del', p: { pid: s.id } }); });
  state.stories = state.stories.filter(x => x.id !== s.id);
  sv.list.splice(sv.i, 1);
  if (!sv.list.length) return closeStories();
  sv.i = Math.min(sv.i, sv.list.length - 1);
  showStory();
}
function bindStories() {
  $('#svClose').addEventListener('click', closeStories);
  $('#svNext').addEventListener('click', nextStory);
  $('#svPrev').addEventListener('click', prevStory);
  $('#svDel').addEventListener('click', deleteStory);
  $('#svAdd').addEventListener('click', () => { closeStories(); openPost('story'); });
  $('#svMore').addEventListener('click', () => { const c = sv && sv.code, cur = sv && sv.list[sv.i]; closeStories(); if (c) openMod(c, 'historia de ' + personName(c), cur && cur.pubx ? cur.id : ''); });
  document.addEventListener('keydown', e => {
    if (!sv) return;
    if (e.key === 'Escape') closeStories(); else if (e.key === 'ArrowRight') nextStory(); else if (e.key === 'ArrowLeft') prevStory();
  });
}

function crewStrip(fy) {
  const wrap = el('li', 'crew-strip-wrap');
  const row = el('div', 'crew-strip');
  row.setAttribute('role', 'list');
  const now = Date.now(), recent = code => state.feed.some(p => p.from === code && now - p.ts < 72 * 3600e3);
  const add = (label, node, cls, onClick, aria) => {
    const b = el('button', 'crew-item' + (cls ? ' ' + cls : ''));
    b.type = 'button'; b.setAttribute('role', 'listitem'); b.setAttribute('aria-label', aria);
    b.append(node, ut(el('small', '', label)));
    b.addEventListener('click', onClick);
    row.appendChild(b);
  };
  const me = el('span', 'avatar lg');
  paintAvatar(me, state.me.name);
  if (state.me.photo) { me.textContent = ''; const im = document.createElement('img'); im.alt = ''; im.src = state.me.photo; me.appendChild(im); }
  const mine = activeStories(state.me.code);
  if (!mine.length) me.appendChild(el('span', 'plus-badge', '＋'));
  add(T('Tu historia'), me, mine.length ? 'ring seen' : '', () => (mine.length ? openStories(state.me.code) : openPost('story')), mine.length ? T('Ver mi historia') : T('Subir una historia'));
  if (fy) {
    // Historias públicas de cualquiera; primero las que no has visto
    const by = [...new Set(state.stories.filter(s => s.pubx && s.from !== state.me.code && !isBlocked(s.from)).map(s => s.from))];
    by.map(c => ({ c, st: activeStories(c) })).filter(x => x.st.length).sort((x, y) => Number(y.st.some(s => !s.seen)) - Number(x.st.some(s => !s.seen))).forEach(({ c, st }) => {
      const av = el('span', 'avatar lg'); paintAvatar(av, personName(c));
      add(personName(c), av, st.some(x => !x.seen) ? 'ring' : 'ring seen', () => openStories(c), `${T('Ver historia de')} ${personName(c)}`);
    });
  } else {
    const seen = new Set(), who = state.friends.map(f => ({ code: f.code, name: f.name, f })).concat((state.net.following || []).map(f => ({ code: f.code, name: f.name })));
    who.forEach(w => {
      if (seen.has(w.code)) return; seen.add(w.code);
      const st = activeStories(w.code).filter(x => !x.pubx || isFollowed(w.code));
      if (!w.f && !st.length) return;
      const av = el('span', 'avatar lg'); paintAvatar(av, w.name);
      if (w.f && w.f.on) av.classList.add('online');
      const unseen = st.some(x => !x.seen);
      add(w.name, av, st.length ? (unseen ? 'ring' : 'ring seen') : recent(w.code) ? 'ring seen' : '', () => (st.length ? openStories(w.code) : w.f ? openDirect(w.f.id) : null), st.length ? `${T('Ver historia de')} ${w.name}` : w.name);
    });
    add(T('Buscar'), el('span', 'avatar lg add-ava', '＋'), '', () => { showTab('amigos'); setSeg('friends'); setTimeout(() => $('#srchInput').focus({ preventScroll: true }), 450); }, T('Buscar personas'));
  }
  wrap.appendChild(row);
  return wrap;
}


function renderFeed() {
  expireStories();
  const fy = state.ui.feedTab !== 'following';
  $('#feedTabs').dataset.idx = fy ? 0 : 1;
  $$('#feedTabs button').forEach(b => b.setAttribute('aria-selected', String((b.dataset.ft === 'following') === !fy)));
  const box = $('#crewBox'), old = box.querySelector('.crew-strip'), sx = old ? old.scrollLeft : 0;
  box.innerHTML = '';
  box.appendChild(crewStrip(fy));
  const nw = box.querySelector('.crew-strip'); if (nw) nw.scrollLeft = sx;   // no saltar al principio al repintar
  const sel = $('#tpSel');
  if (!sel.options.length) {
    sel.add(new Option(T('Temas'), ''));
    TOPICS.forEach(t => sel.add(new Option(`${t.e} ${T(t.n)}`, t.id)));
  }
  sel.value = state.ui.tp || '';
  const ul = $('#feedList');
  ul.innerHTML = '';
  const list = homeFeed().slice(0, 40);
  if (!list.length) ul.appendChild(fy ? emptyState('🌍', state.ui.tp ? 'Nada con este tema todavía' : 'Aún no hay publicaciones públicas', state.ui.tp ? 'Prueba con otro tema o publica tú el primero.' : 'Cuando alguien publique en público, saldrá aquí. Tú también puedes ser el primero.') : emptyState('👥', 'Aquí verás a tu gente', 'Publicaciones e historias de tus amigos, tus grupos y la gente que sigues. Búscalos en Social.'));
  list.forEach(p => ul.appendChild(feedCard(p)));
  setStagger(ul);
}

function upsertPost(item) {
  const cur = state.feed.find(p => p.id === item.id && p.from === item.from);
  if (cur) { cur.w = item.w; if (item.tp !== undefined) cur.tp = item.tp; if (item.aud) cur.aud = item.aud; if (item.gid && !cur.gid) cur.gid = item.gid; return cur; }
  const p = Object.assign({ react: {}, cmt: [] }, item);
  state.feed.push(p);
  if (state.feed.length > 150) state.feed.sort(postSort).length = 150;
  return p;
}

// Ruta de un mensaje social: grupo del post, o directo al autor
function gxRoute(p) { return p.pubx ? { to: 'public' } : p.gid && groupById(p.gid) ? { gid: p.gid } : { to: p.from }; }
function reactTo(p, e) {
  if (p.react[state.me.code] === e) return;
  p.react[state.me.code] = e;
  save();
  if (!srvSend(Object.assign({ t: 'gx', k: 'react', p: { pid: p.id, o: p.from, e } }, gxRoute(p)))) toast('Sin conexión: tu reacción solo la ves tú');
  renderSocial(); renderHome();
}
function commentOn(p, text) {
  text = String(text || '').trim().slice(0, 140);
  if (!text) return;
  const c = { id: uid(), from: state.me.code, text, ts: Date.now() };
  p.cmt.push(c);
  save();
  const mine = p.from === state.me.code;
  const msg = { t: 'gx', k: 'cmt', p: { pid: p.id, o: p.from, id: c.id, text } };
  let ok = false;
  if (!mine) ok = srvSend(Object.assign(msg, gxRoute(p)));
  else {
    const w = p.pub ? { sh: p.aud } : state.workouts.find(x => x.id === p.id);
    if (w && w.sh) { if (w.sh.f) ok = srvSend(Object.assign({}, msg, { to: 'friends' })) || ok; if (w.sh.o) ok = srvSend(Object.assign({}, msg, { to: 'followers' })) || ok; if (w.sh.p) ok = srvSend(Object.assign({}, msg, { to: 'public' })) || ok; w.sh.g.forEach(gid => { if (groupById(gid)) ok = srvSend(Object.assign({}, msg, { gid })) || ok; }); }
  }
  if (!ok) toast('Sin conexión: tu comentario solo lo ves tú');
  renderSocial(); renderHome();
}

/* Compartir y dejar de compartir */
function shareWorkout(w) {
  const sh = w.sh;
  if (!sh || !srvOn()) return;
  const wk = { ty: w.type, dur: w.dur, ex: w.ex.length, sets: workoutSets(w), d: w.date, pr: w.pr.slice(0, 5).map(p => ({ n: exName(p.k), k: p.t, v: p.v })) };
  if (w.feel) wk.feel = w.feel;
  if (sh.vol) wk.vol = Math.round(workoutVol(w));
  if (sh.note && w.note) wk.note = w.note.slice(0, 140);
  if (sh.det) wk.det = w.ex.slice(0, 20).map(e => ({ n: exName(e.k), s: doneSets(e).slice(0, 15).map(s => [s.r, s.w]) })).filter(e => e.s.length);
  const p = { id: w.id, w: wk }; if (sh.tp) p.tp = sh.tp;
  let sent = 0;
  if (sh.f && srvSend({ t: 'gx', to: 'friends', k: 'post', p })) sent++;
  if (sh.p && srvSend({ t: 'gx', to: 'public', k: 'post', p })) sent++;
  sh.g.forEach(gid => { if (groupById(gid) && srvSend({ t: 'gx', gid, k: 'post', p })) sent++; });
  upsertPost({ id: w.id, from: state.me.code, gid: '', ts: Date.now(), w: wk, tp: sh.tp || '', aud: { f: !!sh.f, o: false, p: !!sh.p, g: sh.g } });
  save();
  state.groups.filter(g => g.rank).forEach(sendStats);
  if (!sent) toast('Sin conexión: no se pudo compartir');
}

function unsharePost(p) {
  if (!confirm(T(p.pub ? '¿Borrar esta publicación? Se quitará del feed de los demás.' : '¿Dejar de compartir este entreno? Se quitará del feed de los demás.'))) return;
  const w = p.pub ? { sh: p.aud } : state.workouts.find(x => x.id === p.id);
  if (srvOn() && w && w.sh) {
    if (w.sh.f) srvSend({ t: 'gx', to: 'friends', k: 'del', p: { pid: p.id } });
    if (w.sh.o) srvSend({ t: 'gx', to: 'followers', k: 'del', p: { pid: p.id } });
    if (w.sh.p) srvSend({ t: 'gx', to: 'public', k: 'del', p: { pid: p.id } });
    w.sh.g.forEach(gid => { if (groupById(gid)) srvSend({ t: 'gx', gid, k: 'del', p: { pid: p.id } }); });
  }
  if (w && !p.pub) delete w.sh;
  state.feed = state.feed.filter(x => !(x.id === p.id && x.from === p.from));
  save(); renderAll();
  toast(p.pub ? 'Publicación borrada' : 'Dejaste de compartir ese entreno');
}

// "Borrar mis datos compartidos": quita mis entrenos de los feeds de los demás y mis estadísticas de los rankings
function deleteSharedData() {
  if (srvOn()) {
    srvSend({ t: 'gx', to: 'friends', k: 'del', p: { all: true } });
    srvSend({ t: 'gx', to: 'followers', k: 'del', p: { all: true } });
    srvSend({ t: 'gx', to: 'public', k: 'del', p: { all: true } });
    state.groups.filter(g => g.srv && !g.direct).forEach(g => { srvSend({ t: 'gx', gid: g.id, k: 'del', p: { all: true } }); if (g.rank) srvSend({ t: 'gx', gid: g.id, k: 'stat', p: { hide: true } }); });
  }
  state.workouts.forEach(w => { delete w.sh; });
  state.feed = state.feed.filter(p => p.from !== state.me.code);
  state.stories = state.stories.filter(s => s.from !== state.me.code);
  state.groups.forEach(g => { g.rank = false; });
  save(); renderAll();
  toast('Tus datos compartidos se han borrado');
}

/* ---------- Moderación: reportar y bloquear ---------- */
function openMod(code, text, pid) {
  if (!CODE_RE.test(code) || code === state.me.code) return;
  modTarget = { code, text: String(text || '').slice(0, 300), pid: pid || '' };
  $('#modWho').textContent = personName(code);
  $('#modWho').setAttribute('translate', 'no');
  $('#modText').textContent = modTarget.text;
  $('#modText').classList.toggle('hidden', !modTarget.text);
  openSheet('sheetMod');
}
function blockUser(code) {
  if (!isBlocked(code)) state.blocked.push(code);
  srvSend({ t: 'block', code });
  const f = friendByCode(code);
  if (f) dropFriend(f);
  state.feed = state.feed.filter(p => p.from !== code);
  state.stories = state.stories.filter(s => s.from !== code);
  state.notes = state.notes.filter(n => n.from !== code);
  state.groups.forEach(g => { delete g.stats[code]; });
  state.requests.incoming = state.requests.incoming.filter(r => r.code !== code);
  save(); closeSheets(); renderAll();
  toast('Usuario bloqueado. No verás nada suyo ni él lo tuyo.');
}
function unblockUser(code) {
  state.blocked = state.blocked.filter(c => c !== code);
  srvSend({ t: 'unblock', code });
  save(); paintBlocked(); renderSocial();
}
/* ---------- Cuenta: cambiar contraseña, nuevo código de recuperación y borrar la cuenta ---------- */
let accMode = 'pw', accBusy = false;
const ACC_TXT = {
  pw: ['Cambiar contraseña', 'Se cerrarán los códigos de recuperación anteriores y recibirás uno nuevo.', 'Cambiar contraseña'],
  rc: ['Nuevo código de recuperación', 'El código anterior dejará de valer. Guarda el nuevo en un lugar seguro.', 'Generar código'],
  del: ['Borrar mi cuenta', 'Se borran del servidor tu cuenta, tu @usuario, tus publicaciones, historias, amistades y grupos. Tus entrenos de este móvil se conservan. No se puede deshacer.', 'Borrar mi cuenta']
};
function openAcc(mode) {
  if (!state.account) { toast('Primero inicia sesión'); return; }
  accMode = mode;
  const [t, d, b] = ACC_TXT[mode];
  $('#accTitle').textContent = T(t); $('#accDesc').textContent = T(d); $('#accGo').textContent = T(b);
  $('#accGo').classList.toggle('danger', mode === 'del');
  $('#accNewRow').classList.toggle('hidden', mode !== 'pw');
  $('#accPass').value = ''; $('#accNew').value = ''; $('#accMsg').textContent = '';
  openSheet('sheetAcc');
}
async function submitAcc(e) {
  e.preventDefault();
  if (accBusy || !state.account) return;
  const pw = $('#accPass').value, np = $('#accNew').value, msg = t => { $('#accMsg').textContent = T(t); };
  if (!pw) return msg('Escribe tu contraseña actual.');
  if (accMode === 'pw' && (np.length < 8 || np.length > 100)) return msg('La contraseña nueva necesita entre 8 y 100 caracteres.');
  if (accMode === 'del' && !confirm(T('¿Seguro? Se borrará tu cuenta del servidor y no se puede deshacer.'))) return;
  accBusy = true; $('#accGo').disabled = true; msg('Conectando…');
  try {
    await Srv.discovered();
    if (!Srv.http) return msg('Sin conexión con el servidor.');
    const body = { email: state.account.email, password: pw, token: Srv.auth.token };
    if (accMode === 'pw') body.newPassword = np;
    let r, j = {};
    try { r = await fetch(Srv.http + '/auth/' + (accMode === 'del' ? 'delete' : accMode === 'pw' ? 'password' : 'rcode'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); j = await r.json().catch(() => ({})); }
    catch { return msg('Sin conexión con el servidor.'); }
    if (!r.ok || !j.ok) return msg(j.err === 'bad' ? 'La contraseña no es correcta.' : j.err === 'busy' ? 'Demasiados intentos. Espera unos minutos.' : 'El servidor falló. Inténtalo en un momento.');
    closeSheets(); $('#accPass').value = ''; $('#accNew').value = '';
    if (accMode === 'del') { forgetAccountLocal(); return; }
    state.account.rcPending = j.rc; save();
    showRecovery(j.rc);
    toast(accMode === 'pw' ? 'Contraseña cambiada' : 'Código nuevo generado');
  } finally { accBusy = false; $('#accGo').disabled = false; }
}
// Tras borrar la cuenta: se queda tu historial de entrenos, pero todo lo social y la identidad se reinician
function forgetAccountLocal() {
  state.account = null; state.loginSkipped = false;
  state.me.handle = ''; state.me.priv = true; state.me.code = genCode();
  state.friends = []; state.groups = []; state.notes = []; state.blocked = [];
  state.feed = []; state.stories = []; state.requests = { incoming: [], outgoing: [] };
  state.net = { following: [], followers: [], freqIn: [], freqOut: [] };
  state.workouts.forEach(w => { delete w.sh; });
  openGroupId = null; openGym = null;
  Srv.forget(); Srv.identify({ code: state.me.code, name: state.me.name }, true);
  save();
  $('#settings').classList.remove('open'); syncOverlayClass();
  showLogin();
  toast('Cuenta borrada');
}
function reportUser(code, text, pid) {
  if (!srvSend({ t: 'report', code, why: pid ? 'post' : 'msg', text, pid: pid || undefined })) { toast('Necesitas conexión con el servidor para reportar'); return; }
  closeSheets();
  toast('Reporte enviado. Gracias por avisar.');
}
function paintBlocked() {
  const ul = $('#blockedList');
  ul.innerHTML = '';
  $('#blockedEmpty').classList.toggle('hidden', state.blocked.length > 0);
  state.blocked.forEach(c => {
    const li = el('li', 'glass row static');
    const b = el('button', 'btn sm', T('Desbloquear'));
    b.type = 'button';
    b.addEventListener('click', () => unblockUser(c));
    li.append(ut(el('div', 'main', '')), b);
    li.firstChild.append(ut(el('strong', '', state.names[c] || T('Usuario'))), el('small', '', c));
    ul.appendChild(li);
  });
}

/* ---------- Grupos de gimnasio ---------- */
function renderGroupsList() {
  const ul = $('#gymList');
  ul.innerHTML = '';
  const gs = state.groups.filter(g => g.gym);
  if (!gs.length) ul.appendChild(emptyState('🏟️', 'Tu gimnasio, tu grupo', 'Crea un grupo y pasa su código a tu gente, o únete con el código que te den. Dentro hay feed, retos suaves y quedadas.'));
  gs.forEach(g => {
    const li = el('li', 'glass row');
    const av = el('span', 'avatar');
    paintAvatar(av, g.name);
    const main = el('div', 'main');
    main.append(ut(el('strong', '', g.name)), el('small', '', `${(g.codes || []).length || g.members.length + 1} ${T('miembros')} · ${g.code}`));
    const next = nextMeet(g);
    if (next) main.appendChild(el('small', 'meet-tag', `📍 ${fmtMeet(next)}`));
    li.append(av, main, el('div', 'side', '›'));
    li.addEventListener('click', () => openGymScreen(g.id));
    ul.appendChild(li);
  });
  setStagger(ul);
}

function addServerGroup(s) {
  Object.entries(s.names || {}).forEach(([c, n]) => { state.names[c] = n; });
  let g = groupById(s.gid);
  const codes = s.members;
  if (g) {
    g.codes = codes;
    if (s.code) { g.code = s.code; g.gym = true; g.by = s.by; }
    return null;
  }
  const members = s.members.filter(c => c !== state.me.code).map(c => (friendByCode(c) || {}).id).filter(Boolean);
  g = { id: s.gid, name: s.name, members, codes, notify: false, srv: true, messages: [], meets: [], stats: {}, rank: false, goal: 0, unread: 0, created: Date.now() };
  if (s.code) { g.code = s.code; g.gym = true; g.by = s.by; }
  state.groups.push(g);
  return g;
}

function openGymSheet() {
  $('#gjName').value = '';
  $('#gjCode').value = '';
  $('#gjMsg').textContent = '';
  openSheet('sheetGym');
}
const ERR_GYM = {
  'no-group': 'No existe ningún grupo con ese código.', already: 'Ya estás en ese grupo.', full: 'Ese grupo está completo.',
  'mine-full': 'Has llegado al máximo de grupos.', code: 'Código no válido: son 5 letras y 3 números.', busy: 'Demasiados intentos. Prueba más tarde.', invalid: 'No se pudo crear el grupo.'
};
function createGymGroup() {
  const name = $('#gjName').value.trim().slice(0, 24);
  if (!name) { $('#gjMsg').textContent = T('Ponle un nombre al grupo'); return; }
  if (!srvOn() || !Srv.online) { $('#gjMsg').textContent = T('Necesitas conexión con el servidor para crear un grupo.'); return; }
  srvSend({ t: 'gcreate', gid: uid() + rnd(1000), name });
}
function joinGymGroup() {
  const code = normCode($('#gjCode').value);
  if (!GCODE_RE.test(code)) { $('#gjMsg').textContent = T(ERR_GYM.code); return; }
  if (!srvOn() || !Srv.online) { $('#gjMsg').textContent = T('Necesitas conexión con el servidor para unirte a un grupo.'); return; }
  srvSend({ t: 'gjoin', code });
}

function weekStatsMine() {
  const st = streakInfo();
  return { wk: ymd(wkStart(today())), n: Math.min(14, st.n), pr: Math.min(99, recentPrs(30).length), st: st.cur };
}
function sendStats(g) {
  if (!g || !g.srv) return;
  if (g.rank) srvSend({ t: 'gx', gid: g.id, k: 'stat', p: weekStatsMine() });
  else srvSend({ t: 'gx', gid: g.id, k: 'stat', p: { hide: true } });
}

const fmtMeet = m => { const d = new Date(m.at); return `${dayLabel(d.getTime())} ${fmtClock(d.getTime())}${m.place ? ' · ' + m.place : ''}`; };
const upcoming = g => g.meets.filter(m => new Date(m.at).getTime() > Date.now() - 3 * 3600e3).sort((a, b) => a.at.localeCompare(b.at));
const nextMeet = g => upcoming(g)[0];

function openGymScreen(id) {
  const g = groupById(id);
  if (!g) return;
  rememberOpener();
  openGym = id;
  renderGym();
  $('#gym').classList.add('open');
  syncOverlayClass();
  if (g.rank) sendStats(g);
}
function closeGymScreen() {
  openGym = null;
  $('#gym').classList.remove('open');
  syncOverlayClass();
  restoreFocus();
}

function renderGym() {
  const g = groupById(openGym);
  if (!g) { closeGymScreen(); return; }
  $('#gyName').textContent = g.name;
  $('#gyName').setAttribute('translate', 'no');
  fmtCodeNode($('#gyCode'), g.code || '');
  $('#gyMembersLine').textContent = memberLine(g);
  $('#gyMembersLine').setAttribute('translate', 'no');
  const mine = streakInfo();

  // Reto semanal del grupo (opcional)
  const iAmBy = g.by === state.me.code;
  $('#gyGoalLbl').classList.toggle('hidden', !iAmBy);
  $('#gyGoalSel').value = String(g.goal || 0);
  const wk = ymd(wkStart(today()));
  const sharing = Object.entries(g.stats).filter(([c, s]) => s.wk === wk && !isBlocked(c));
  const doneN = sharing.filter(([, s]) => s.n >= g.goal).length + (g.rank && mine.n >= g.goal ? 1 : 0);
  const total = sharing.length + (g.rank ? 1 : 0);
  $('#gyChal').textContent = g.goal ? `${T('Reto de la semana')}: ${g.goal} ${T(g.goal === 1 ? 'entreno' : 'entrenos')} · ${T('tú')} ${mine.n}/${g.goal}` : T('Sin reto esta semana');
  $('#gyChalSub').textContent = g.goal ? (total ? `${doneN} ${T('de')} ${total} ${T('de quienes comparten sus estadísticas ya lo han cumplido.')}` : T('Nadie comparte estadísticas todavía. Es opcional.')) : (iAmBy ? T('Puedes proponer un reto abajo. Es opcional y sin presión.') : T('El creador del grupo puede proponer un reto semanal.'));
  $('#gyChalBar').style.width = g.goal ? Math.min(100, Math.round((mine.n / g.goal) * 100)) + '%' : '0%';

  // Ranking amable y opcional
  $('#gyRankMe').checked = !!g.rank;
  $('#gyRankShow').checked = !!g.showRank;
  $('#gyRankBody').classList.toggle('hidden', !g.showRank);
  const box = $('#gyRank');
  box.innerHTML = '';
  if (g.showRank) {
    const rows = sharing.map(([c, s]) => ({ c, n: s.n, pr: s.pr, st: s.st }));
    if (g.rank) rows.push({ c: state.me.code, n: mine.n, pr: weekStatsMine().pr, st: mine.cur });
    const key = { n: 'n', st: 'st', pr: 'pr' }[rankMetric];
    rows.sort((a, b) => b[key] - a[key]);
    $$('#gyMetric button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === rankMetric)));
    if (!rows.length) box.appendChild(el('li', 'muted small', T('Nadie participa en el ranking todavía.')));
    rows.forEach((r, i) => {
      const li = el('li', 'rank-row' + (r.c === state.me.code ? ' me' : ''));
      li.append(el('span', 'rk', i < 3 && r[key] > 0 ? ['🥇', '🥈', '🥉'][i] : '·'), ut(el('span', 'rn', personName(r.c))), el('b', '', String(r[key])));
      box.appendChild(li);
    });
  }

  // Quedadas
  const ml = $('#gyMeets');
  ml.innerHTML = '';
  const ups = upcoming(g);
  $('#gyMeetsEmpty').classList.toggle('hidden', ups.length > 0);
  ups.forEach(m => {
    const li = el('li', 'glass meet-card');
    li.append(el('strong', '', `📍 ${fmtMeet(m)}`));
    li.appendChild(ut(el('small', 'muted', `${T('Propone')}: ${personName(m.by)}${m.note ? ' · ' + m.note : ''}`)));
    const going = Object.entries(m.rsvp).filter(([c, v]) => v === 1 && !isBlocked(c)).map(([c]) => personName(c));
    li.appendChild(ut(el('small', '', going.length ? `${T('Van')}: ${going.join(', ')}` : T('Aún no ha confirmado nadie'))));
    const row = el('div', 'row2');
    const my = m.rsvp[state.me.code];
    [[1, '✅ Voy'], [0, '🙅 No voy']].forEach(([v, l]) => {
      const b = el('button', 'btn sm' + (my === v ? ' primary' : ''), T(l));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(my === v));
      b.addEventListener('click', () => { m.rsvp[state.me.code] = v; save(); srvSend({ t: 'gx', gid: g.id, k: 'rsvp', p: { mid: m.id, v } }); renderGym(); });
      row.appendChild(b);
    });
    li.appendChild(row);
    ml.appendChild(li);
  });

  // Feed del grupo
  const fl = $('#gyFeed');
  fl.innerHTML = '';
  const items = visibleFeed(g.id).slice(0, 20);
  $('#gyFeedEmpty').classList.toggle('hidden', items.length > 0);
  items.forEach(p => fl.appendChild(feedCard(p)));

  // Miembros (moderación)
  const mu = $('#gyMembers');
  mu.innerHTML = '';
  (g.codes || []).filter(c => c !== state.me.code && !isBlocked(c)).forEach(c => {
    const li = el('li', 'glass row');
    const av = el('span', 'avatar'); paintAvatar(av, personName(c));
    const b = el('button', 'icon-btn plain', '⋯');
    b.type = 'button'; b.setAttribute('aria-label', 'Más opciones');
    b.addEventListener('click', () => openMod(c, ''));
    const mn = el('div', 'main'); mn.appendChild(ut(el('strong', '', personName(c))));
    li.append(av, mn, b);
    mu.appendChild(li);
  });
}

function proposeMeet() {
  const g = groupById(openGym);
  if (!g) return;
  const d = $('#mDate').value, t = $('#mTime').value;
  if (!DAY_RE.test(d) || !TIME_RE.test(t)) { toast('Elige día y hora'); return; }
  const m = { id: uid(), by: state.me.code, at: `${d}T${t}`, place: $('#mPlace').value.trim().slice(0, 40), note: $('#mNote').value.trim().slice(0, 60), rsvp: { [state.me.code]: 1 } };
  if (!srvSend({ t: 'gx', gid: g.id, k: 'meet', p: { id: m.id, at: m.at, place: m.place, note: m.note } })) { toast('Sin conexión con el servidor'); return; }
  g.meets.push(m);
  g.meets = g.meets.slice(-20);
  save(); closeSheets(); renderGym();
  toast('Quedada propuesta 📍');
}

function leaveGym() {
  const g = groupById(openGym);
  if (!g || !confirm(T(`¿Salir de "${g.name}"? Tus entrenos compartidos y tus estadísticas dejarán de verse en ese grupo.`))) return;
  srvSend({ t: 'gx', gid: g.id, k: 'del', p: { all: true } });
  srvSend({ t: 'gleave', gid: g.id });
  state.groups = state.groups.filter(x => x.id !== g.id);
  state.feed = state.feed.filter(p => p.gid !== g.id);
  state.stories = state.stories.filter(s => s.gid !== g.id);
  state.workouts.forEach(w => { if (w.sh) w.sh.g = w.sh.g.filter(x => x !== g.id); });
  save();
  closeGymScreen();
  renderAll();
  toast('Has salido del grupo');
}

/* Mensajes sociales entrantes */
function onGx(m) {
  if (isBlocked(m.from)) return;
  const g = m.gid ? groupById(m.gid) : null, f = friendByCode(m.from);
  if (m.gid ? !g : !knownPerson(m.from)) return;
  const p = m.p || {}, ts = Math.min(Date.now(), (m.ts || Date.now()) - (window.Srv ? Srv.skew : 0));
  const find = () => state.feed.find(x => x.id === p.pid && x.from === p.o);
  switch (m.k) {
    case 'post': {
      const isNew = !state.feed.some(x => x.id === p.id && x.from === m.from);
      upsertPost({ id: p.id, from: m.from, gid: m.gid || '', ts, w: p.w, tp: TOPIC_IDS.includes(p.tp) ? p.tp : '' });
      if (isNew && currentTab !== 'inicio') toast(`💪 ${personName(m.from)} ${T('compartió un entreno')}`);
      if (isNew) maybeNewPill();
      break;
    }
    case 'pub': {
      const md = normMedia(p.m), text = str(p.text, 400);
      if ((!text && !md) || state.feed.some(x => x.id === p.id && x.from === m.from)) return;
      state.feed.push({ id: String(p.id).slice(0, 40), from: m.from, gid: m.gid || '', ts, w: null, pub: { text, m: md }, tp: TOPIC_IDS.includes(p.tp) ? p.tp : '', react: {}, cmt: [] });
      if (state.feed.length > 150) state.feed.sort(postSort).length = 150;
      if (currentTab !== 'inicio') toast(`📸 ${personName(m.from)} ${T('ha publicado')}`);
      maybeNewPill();
      break;
    }
    case 'story': {
      const md = normMedia(p.m), text = str(p.text, 140);
      if ((!text && !md) || state.stories.some(x => x.id === p.id && x.from === m.from)) return;
      state.stories.push({ id: String(p.id).slice(0, 40), from: m.from, gid: m.gid || '', ts, text, m: md, seen: false, aud: { f: false, o: false, g: [] } });
      state.stories = state.stories.slice(-60);
      break;
    }
    case 'react': {
      const it = find();
      if (it) { if (p.e) it.react[m.from] = p.e; else delete it.react[m.from]; }
      if (p.o === state.me.code) { if (p.e) addNote({ type: 'like', from: m.from, pid: p.pid, e: p.e }); else dropLikeNote(m.from, p.pid); }
      break;
    }
    case 'cmt': {
      const it = find();
      if (it && !it.cmt.some(c => c.id === p.id)) { it.cmt.push({ id: p.id, from: m.from, text: p.text, ts }); it.cmt = it.cmt.slice(-30); }
      if (p.o === state.me.code) addNote({ type: 'cmt', from: m.from, pid: p.pid, text: p.text, cid: p.id });
      break;
    }
    case 'del': state.feed = state.feed.filter(x => !(x.from === m.from && (p.all || x.id === p.pid))); state.stories = state.stories.filter(x => !(x.from === m.from && (p.all || x.id === p.pid))); break;
    case 'stat': if (g) { if (p.hide) delete g.stats[m.from]; else g.stats[m.from] = { wk: p.wk, n: p.n, pr: p.pr, st: p.st }; } break;
    case 'meet': if (g && !g.meets.some(x => x.id === p.id)) { g.meets.push({ id: p.id, by: m.from, at: p.at, place: p.place, note: p.note, rsvp: {} }); g.meets = g.meets.slice(-20); toast(`📍 ${personName(m.from)} ${T('propone una quedada en')} ${g.name}`); } break;
    case 'rsvp': if (g) { const mt = g.meets.find(x => x.id === p.mid); if (mt) mt.rsvp[m.from] = p.v; } break;
    case 'gset': if (g && m.from === g.by) g.goal = p.goal; break;
    default: return;
  }
  save();
  renderHome();
  renderSocial();
}


function renderChatList() {
  const ul = $('#chatList');
  ul.innerHTML = '';
  if (!state.groups.length) {
    ul.appendChild(emptyState('💬', 'Aquí aparecerán tus chats', 'Aún no tienes chats. Añade amigos con su código o únete a un grupo de gimnasio y escríbeles.'));
    return;
  }
  const gs = [...state.groups].sort((a, b) => ((lastMsg(b) || {}).ts || b.created) - ((lastMsg(a) || {}).ts || a.created));
  for (const g of gs) {
    const li = el('li', 'glass row');
    const av = el('span', 'avatar');
    paintAvatar(av, chatName(g));
    const main = el('div', 'main');
    main.append(ut(el('strong', '', (g.gym ? '🏟️ ' : '') + chatName(g))), el('small', '', previewText(g)));
    const side = el('div', 'side');
    const m = lastMsg(g);
    side.appendChild(el('span', '', m ? fmtShort(m.ts) : ''));
    if (g.unread) side.appendChild(el('span', 'badge', g.unread));
    li.append(av, main, side);
    li.addEventListener('click', () => openChat(g.id));
    ul.appendChild(li);
  }
}

function renderFriends() {
  const ul = $('#friendList');
  ul.innerHTML = '';
  if (!state.friends.length) {
    ul.appendChild(emptyState('🤝', 'Tu círculo está vacío', 'Todavía no tienes amigos. Busca a alguien por su @usuario en el bloque de arriba: cuando os sigáis los dos, seréis amigos y podréis chatear.'));
    return;
  }
  for (const f of state.friends) {
    const li = el('li', 'glass row');
    const av = el('span', 'avatar');
    paintAvatar(av, f.name);
    const main = el('div', 'main');
    const live = !!(f.srv && window.Srv && Srv.online);
    main.append(ut(el('strong', '', f.name)), el('small', '', (live ? (f.on ? '🟢 En línea · ' : '⚪ Desconectado · ') : '') + (handleOf(f.code) ? '@' + handleOf(f.code) : 'Toca para chatear')));
    const more = el('button', 'icon-btn plain', '⋯');
    more.type = 'button';
    more.setAttribute('aria-label', 'Más opciones');
    more.addEventListener('click', ev => { ev.stopPropagation(); if (f.code) openMod(f.code, ''); });
    const del = el('button', 'icon-btn plain');
    del.setAttribute('aria-label', 'Quitar amigo');
    del.innerHTML = ICON.x;
    del.addEventListener('click', ev => {
      ev.stopPropagation();
      if (!confirm(T(`¿Quitar a ${f.name}? También saldrá de sus grupos y se borrará vuestro chat directo.`))) return;
      if (f.srv && !srvSend({ t: 'unfriend', code: f.code })) { toast('Necesitas conexión con el servidor para quitar a un amigo'); return; }
      li.classList.add('removing');
      setTimeout(() => { dropFriend(f); save(); renderSocial(); }, 280);
    });
    li.append(av, main, more, del);
    li.addEventListener('click', () => openDirect(f.id));
    ul.appendChild(li);
  }
}

/* ---------- Personas: nombre de usuario, buscar y seguir ---------- */
let hdlEdit = false, found = [], srchTimer = 0;
const HDL_ERR = { taken: 'Ese nombre de usuario ya está cogido.', invalid: 'Usa de 3 a 20 caracteres: letras, números, punto o guion bajo.', busy: 'Has cambiado el nombre demasiadas veces hoy. Inténtalo mañana.' };
const FOLLOW_ERR = { 'no-user': 'No se puede seguir a esa persona.', full: 'Ya sigues a demasiada gente.', many: 'Tienes demasiadas solicitudes pendientes.', busy: 'Demasiadas acciones seguidas. Espera un poco.' };
function setHdlMsg(text, kind) { if (gateOpen() && text) { gateBusy = false; paintGate(); setGateMsg(text, kind === 'ok'); }
   const m = $('#hdlMsg'); m.textContent = text || ''; m.classList.remove('ok', 'err'); if (kind) m.classList.add(kind); }
const relOf = c => (friendByCode(c) ? 'friend' : isFollowed(c) ? 'following' : state.net.freqOut.some(x => x.code === c) ? 'requested' : 'none');

function personRow(c, actions) {
  const li = el('li', 'glass row static');
  const av = el('span', 'avatar');
  paintAvatar(av, c.name);
  const main = el('div', 'main');
  main.append(ut(el('strong', '', c.name)), el('small', '', (c.handle ? '@' + c.handle : '') + (c.priv ? ' 🔒' : '')));
  li.append(av, main);
  if (actions.length > 1) { const box = el('div', 'acts'); actions.forEach(a => box.appendChild(a)); li.appendChild(box); } else actions.forEach(a => li.appendChild(a));
  return li;
}
const actBtn = (label, cls, fn) => { const b = el('button', 'btn sm ' + cls, label); b.type = 'button'; b.addEventListener('click', ev => { ev.stopPropagation(); fn(b); }); return b; };
function followUser(c) { if (!srvSend({ t: 'follow', code: c.code })) toast('Sin conexión con el servidor'); }
function unfollowUser(c, rel) {
  const msg = rel === 'friend' ? `¿Dejar de seguir a ${c.name}? Dejaréis de ser amigos y se borrará vuestro chat directo.` : `¿Dejar de seguir a ${c.name}?`;
  if (!confirm(T(msg))) return;
  if (!srvSend({ t: 'unfollow', code: c.code })) toast('Sin conexión con el servidor');
}
const cancelReq = c => { if (!srvSend({ t: 'fcancel', code: c.code })) toast('Sin conexión con el servidor'); };
function relButton(c) {
  const rel = relOf(c.code);
  if (rel === 'friend') return actBtn(T('Amigos ✓'), 'ok', () => unfollowUser(c, rel));
  if (rel === 'following') return actBtn(T('Siguiendo'), '', () => unfollowUser(c, rel));
  if (rel === 'requested') return actBtn(T('Pendiente'), '', () => cancelReq(c));
  return actBtn(T(c.priv ? 'Solicitar' : 'Seguir'), 'primary', () => followUser(c));
}

function paintPeople() {
  const need = !state.me.handle || hdlEdit;
  $('#hdlBox').classList.toggle('hidden', !need);
  if (need && document.activeElement !== $('#hdlInput') && !$('#hdlInput').value) $('#hdlInput').value = state.me.handle;
  $('#srchInput').disabled = !srvOn();
  const q = $('#srchInput').value.trim().replace(/^@/, '');
  $('#srchMsg').textContent = !srvOn() ? T('Sin conexión: no se puede buscar personas ahora.') : q.length >= 2 && !found.length && !srchTimer ? T('Nadie con ese usuario. Prueba con otro.') : '';
}
function renderSearch() {
  const ul = $('#srchList');
  ul.innerHTML = '';
  const q = $('#srchInput').value.trim().replace(/^@/, '');
  if (q.length >= 2) found.filter(c => c.code !== state.me.code && !isBlocked(c.code)).forEach(c => ul.appendChild(personRow(c, [relButton(c)])));
  paintPeople();
}
function renderRequests() {
  const inc = state.net.freqIn, out = state.net.freqOut;
  $('#reqCount').textContent = inc.length;
  $('#reqCount').classList.toggle('hidden', inc.length === 0);
  $('#segBadge').textContent = inc.length;
  $('#segBadge').classList.toggle('hidden', inc.length === 0 || state.ui.seg === 'friends');
  $('#reqInBox').classList.toggle('hidden', !inc.length);
  const ulIn = $('#reqIn');
  ulIn.innerHTML = '';
  inc.forEach(c => {
    const li = personRow(c, [
      actBtn(T('Rechazar'), '', () => { li.classList.add('removing'); if (!srvSend({ t: 'freject', code: c.code })) toast('Sin conexión con el servidor'); }),
      actBtn(T('Aceptar'), 'ok', () => { li.classList.add('removing'); if (!srvSend({ t: 'fapprove', code: c.code })) toast('Sin conexión con el servidor'); })
    ]);
    li.classList.add('req-row');
    ulIn.appendChild(li);
  });
  $('#reqOutBox').classList.toggle('hidden', !out.length);
  const ulOut = $('#reqOut');
  ulOut.innerHTML = '';
  out.forEach(c => ulOut.appendChild(personRow(c, [actBtn(T('Cancelar'), '', () => cancelReq(c))])));
  renderSearch();
}
function paintFl() {
  $$('#flChips .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.fl === state.ui.fl)));
  $('#cntFriends').textContent = state.friends.length;
  $('#cntFollowing').textContent = state.net.following.length;
  $('#cntFollowers').textContent = state.net.followers.length;
}
function setFl(v) { if (!['friends', 'following', 'followers'].includes(v)) return; state.ui.fl = v; save(); renderSocial(); }
function renderNet() {
  const ul = $('#netList');
  ul.innerHTML = '';
  const fl = state.ui.fl;
  if (fl === 'friends') return;
  const list = (fl === 'following' ? state.net.following : state.net.followers).filter(c => !isBlocked(c.code));
  if (!list.length) { ul.appendChild(emptyState(fl === 'following' ? '👀' : '👥', fl === 'following' ? 'Todavía no sigues a nadie' : 'Todavía no te sigue nadie', fl === 'following' ? 'Busca a alguien por su @usuario en el bloque de arriba.' : 'Cuando alguien te siga, aparecerá aquí. Puedes quitar seguidores cuando quieras.')); return; }
  list.forEach(c => {
    const acts = [];
    if (fl === 'following') acts.push(relButton(c));
    else {
      if (relOf(c.code) === 'none') acts.push(relButton(c));
      acts.push(actBtn(T('Quitar'), '', () => { if (confirm(T(`¿Quitar a ${c.name} de tus seguidores?`))) srvSend({ t: 'rmfollower', code: c.code }); }));
    }
    const li = personRow(c, acts);
    li.classList.remove('static');
    const more = el('button', 'icon-btn plain', '⋯');
    more.type = 'button'; more.setAttribute('aria-label', T('Más opciones'));
    more.addEventListener('click', () => openMod(c.code, ''));
    li.appendChild(more);
    ul.appendChild(li);
  });
}
function applyGraph(g) {
  state.net = normNet(g);
  ['following', 'followers', 'freqIn', 'freqOut'].forEach(k => state.net[k].forEach(c => { state.names[c.code] = c.name; }));
  state.net.freqIn = state.net.freqIn.filter(c => !isBlocked(c.code));
  save();
  renderSocial(); paintProfileNet(); renderHome();
}
function paintProfileNet() {
  if (!$('#myHandle')) return;
  $('#profHandle').textContent = state.me.handle ? '@' + state.me.handle : '';
  $('#profHandle').classList.toggle('hidden', !state.me.handle);
  $('#myHandle').textContent = state.me.handle ? '@' + state.me.handle : T('Sin nombre de usuario');
  $('#editHandle').textContent = T(state.me.handle ? 'Cambiar nombre de usuario' : 'Elegir nombre de usuario');
  $('#rsPriv').checked = state.me.priv;
  $('#privNote').textContent = T(state.me.priv ? 'Quien quiera seguirte necesita tu aprobación' : 'Cualquiera puede seguirte y ver lo que publiques para seguidores');
  $('#pfFolN').textContent = state.net.followers.length;
  $('#pfFingN').textContent = state.net.following.length;
}
function saveHandle() {
  const h = $('#hdlInput').value.trim().toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9_.]{3,20}$/.test(h) || /^\.|\.$|\.\./.test(h)) return setHdlMsg(T(HDL_ERR.invalid), 'err');
  if (h === state.me.handle) { hdlEdit = false; renderRequests(); return; }
  if (!srvSend({ t: 'handle', h })) return setHdlMsg(T('Sin conexión con el servidor. Inténtalo en unos segundos.'), 'err');
  setHdlMsg(T('Guardando…'));
}
function goPeople(focus) {
  showTab('amigos'); setSeg('friends');
  if (focus) setTimeout(() => $((focus === 'hdl' && (!state.me.handle || hdlEdit)) ? '#hdlInput' : '#srchInput').focus({ preventScroll: true }), 450);
}
function bindPeople() {
  $('#segAdd').addEventListener('click', openGroupSheet);
  $('#hdlSave').addEventListener('click', saveHandle);
  $('#hdlInput').addEventListener('input', e => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_.@]/g, ''); setHdlMsg(''); });
  $('#hdlInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveHandle(); });
  $('#srchInput').addEventListener('input', () => {
    clearTimeout(srchTimer);
    const q = $('#srchInput').value.trim().replace(/^@/, '');
    found = [];
    if (q.length < 2 || !srvOn()) { srchTimer = 0; renderSearch(); return; }
    srchTimer = setTimeout(() => { srchTimer = 0; if (!srvSend({ t: 'search', q })) $('#srchMsg').textContent = T('Sin conexión con el servidor.'); }, 300);
    renderSearch();
  });
  $$('#flChips .chip').forEach(c => c.addEventListener('click', () => setFl(c.dataset.fl)));
  $('#editHandle').addEventListener('click', () => { hdlEdit = true; $('#hdlInput').value = state.me.handle; goPeople('hdl'); renderRequests(); });
  $('#rsPriv').addEventListener('change', e => {
    const priv = e.target.checked;
    if (!priv && !confirm(T('¿Hacer tu perfil público? Cualquiera podrá seguirte sin pedirte permiso y se aprobarán las solicitudes pendientes.'))) { e.target.checked = true; return; }
    if (!srvSend({ t: 'profile', priv })) { e.target.checked = !priv; toast('Necesitas conexión con el servidor'); return; }
    state.me.priv = priv; save(); paintProfileNet();
  });
  $('#pfFollowers').addEventListener('click', () => { goPeople(); setFl('followers'); });
  $('#pfFollowing').addEventListener('click', () => { goPeople(); setFl('following'); });
}

/* ---------- Social: grupos y chats directos ---------- */
function openGroupSheet() {
  if (!state.friends.length) {
    toast('Primero hazte amigo de alguien: sigue a una persona y que te siga de vuelta');
    goPeople(true);
    return;
  }
  $('#groupName').value = '';
  const box = $('#groupFriends');
  box.innerHTML = '';
  for (const f of state.friends) {
    const label = el('label', 'pick');
    const av = el('span', 'avatar');
    av.style.cssText = 'width:34px;height:34px;font-size:.8rem';
    paintAvatar(av, f.name);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = f.id;
    label.append(av, ut(el('span', '', f.name)), cb);
    box.appendChild(label);
  }
  openSheet('sheetGroup');
}

function createGroup() {
  const name = $('#groupName').value.trim();
  const members = $$('#groupFriends input:checked').map(i => i.value);
  if (!name) { toast('Ponle un nombre al grupo'); return; }
  if (!members.length) { toast('Elige al menos un amigo'); return; }
  const g = { id: uid(), name, members, messages: [], meets: [], stats: {}, rank: false, goal: 0, unread: 0, created: Date.now() };
  if (srvOn() && members.every(id => (friendById(id) || {}).srv)) {
    const codes = members.map(id => friendById(id).code);
    if (!srvSend({ t: 'gnew', gid: g.id, name, members: codes })) { toast('Sin conexión con el servidor'); return; }
    g.srv = true;
    g.codes = [state.me.code, ...codes];
  }
  state.groups.push(g);
  save();
  closeSheets();
  renderAll();
  openChat(g.id);
}

function ensureDirect(f) {
  let g = state.groups.find(x => x.direct && x.members[0] === f.id);
  if (!g) {
    g = { id: uid(), name: f.name, members: [f.id], direct: true, messages: [], meets: [], stats: {}, rank: false, goal: 0, unread: 0, created: Date.now() };
    state.groups.push(g);
  }
  return g;
}

function openDirect(fid) {
  const f = friendById(fid);
  if (!f) return;
  const had = state.groups.some(x => x.direct && x.members[0] === fid);
  const g = ensureDirect(f);
  if (!had) { save(); renderSocial(); }
  openChat(g.id);
}

function openGroupInfo() {
  const g = groupById(openGroupId);
  if (!g) return;
  $('#giName').textContent = chatName(g);
  $('#giMembers').textContent = g.direct ? `Tú y ${chatName(g)}` : 'Miembros: ' + memberLine(g);
  $('#giDelete').textContent = g.direct ? 'Eliminar chat' : 'Eliminar grupo';
  openSheet('sheetGroupInfo');
}

/* ---------- Chat ---------- */
function openChat(id) {
  const g = groupById(id);
  if (!g) return;
  openGroupId = id;
  g.unread = 0;
  save();
  renderChat(false);
  $('#chat').classList.add('open');
  syncOverlayClass();
  renderSocial();
}

function closeChat() {
  openGroupId = null;
  $('#chat').classList.remove('open');
  syncOverlayClass();
  renderSocial();
}


function renderChat(animateLast) {
  const g = groupById(openGroupId);
  if (!g) return;
  paintAvatar($('#chatAvatar'), chatName(g));
  $('#chatName').textContent = chatName(g);
  $('#chatMembers').textContent = memberLine(g);

  const box = $('#msgs');
  box.innerHTML = '';
  let lastDay = '';
  for (const m of g.messages) {
    const day = new Date(m.ts).toDateString();
    if (day !== lastDay) { lastDay = day; box.appendChild(el('div', 'day-sep', dayLabel(m.ts))); }
    if (m.type === 'sys') { box.appendChild(el('div', 'glass event sys', m.text)); continue; }
    const b = el('div', m.from === 'me' ? 'bubble me' : 'bubble them glass');
    if (m.from !== 'me') { b.dataset.from = m.fromCode || ''; b.dataset.text = m.text; }
    if (m.from !== 'me' && !g.direct) b.appendChild(ut(el('span', 'who', senderName(m.from))));
    b.appendChild(ut(el('span', 'txt', m.text)));
    b.appendChild(el('time', '', fmtClock(m.ts) + (m.pending ? ' ⏳' : '')));
    box.appendChild(b);
  }
  if (animateLast && box.lastElementChild) box.lastElementChild.classList.add('new');
  box.scrollTo({ top: box.scrollHeight, behavior: animateLast ? 'smooth' : 'auto' });
}

function sendMessage(ev) {
  ev.preventDefault();
  const g = groupById(openGroupId);
  const text = $('#msgInput').value.trim();
  if (!g || !text) return;
  const sm = { id: uid(), from: 'me', type: 'text', text, ts: Date.now() };
  g.messages.push(sm);
  srvRelay(g, sm);
  $('#msgInput').value = '';
  save();
  renderChat(true);
  renderSocial();
}

// Punto de entrada para mensajes de otras personas.
// Con un servidor real, aquí llegarían los mensajes por WebSocket / Firebase / Supabase.
function receive(g, m) {
  g.messages.push(m);
  const viewing = openGroupId === g.id;
  if (viewing) renderChat(true); else g.unread = (g.unread || 0) + 1;
  save();
  renderSocial();

  const who = senderName(m.from);
  const body = `${who}: ${m.text}`;
  if (!viewing) toast(`${chatName(g)} · ${body}`);
  systemNotify(chatName(g), body);
}

function systemNotify(title, body) {
  if (state.settings.browserNotif && 'Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body: T(body) }); } catch { /* ignorar */ }
  }
}


/* ---------- Servidor: amigos, solicitudes, chat y social ---------- */

const srvOn = () => !!(window.Srv && Srv.enabled);
const srvSend = o => !!(window.Srv && Srv.send(o));
const ERR_REQ = {
  'no-user': 'No existe nadie con ese código. Revisa que esté bien escrito y que esa persona ya haya abierto la app.',
  friends: 'Ya sois amigos.', pending: 'Ya enviaste una solicitud a ese código.',
  full: 'Has llegado al máximo de amigos.', many: 'Tienes demasiadas solicitudes pendientes.', code: 'Código no válido.'
};

function dropFriend(f) {
  state.friends = state.friends.filter(x => x.id !== f.id);
  state.groups = state.groups.filter(g => !(g.direct && g.members[0] === f.id));
  state.groups.forEach(g => { g.members = g.members.filter(id => id !== f.id); });
}

function toLocalMsg(m, from) {
  const b = m.m || {};
  return { id: m.id, from, fromCode: m.from, ts: Math.min(Date.now(), (m.ts || Date.now()) - (window.Srv ? Srv.skew : 0)), type: 'text', text: String(b.text || '').slice(0, 1000) };
}

// Envía un mensaje propio al servidor; si no hay conexión queda pendiente (⏳) y sale al reconectar
function srvRelay(g, m) {
  if (!srvOn() || m.type !== 'text') return;
  let to = null;
  if (g.direct) { const f = friendById(g.members[0]); if (!f || !f.srv) return; to = f.code; }
  else if (!g.srv) return;
  const body = { type: 'text', text: m.text };
  const ok = srvSend(g.direct ? { t: 'dm', to, id: m.id, m: body } : { t: 'gm', gid: g.id, id: m.id, m: body });
  if (ok) delete m.pending; else m.pending = true;
}
function srvFlush() {
  for (const g of state.groups) for (const m of g.messages) if (m.pending && m.from === 'me') srvRelay(g, m);
}

/* Publicaciones públicas: el servidor las guarda y cada dispositivo las pide al abrir Inicio */
const pubHandles = {};
let pubPulled = 0;
function pullPub(force) {
  if (!srvOn() || !window.Srv || !Srv.online) return;
  if (!force && Date.now() - pubPulled < 10e3) return;
  pubPulled = Date.now();
  srvSend({ t: 'pubfeed' });
}
// Entreno público recibido del servidor: solo los campos esperados y acotados
function normPubW(w) {
  if (!w || typeof w !== 'object' || !TYPES.some(t => t.id === w.ty)) return null;
  const n = (v, mx) => Math.max(0, Math.min(mx, Math.round(Number(v)) || 0));
  const o = { ty: w.ty, dur: n(w.dur, 600), ex: n(w.ex, 60), sets: n(w.sets, 400), d: DAY_RE.test(String(w.d)) ? w.d : '' };
  o.pr = (Array.isArray(w.pr) ? w.pr : []).slice(0, 5).map(x => ({ n: str(x && x.n, 40), k: ['1rm', 'peso', 'vol', 'reps'].includes(x && x.k) ? x.k : 'peso', v: Math.max(0, Math.min(2000, Number(x && x.v) || 0)) })).filter(x => x.n);
  if (n(w.feel, 5)) o.feel = n(w.feel, 5);
  if (w.vol !== undefined) o.vol = n(w.vol, 1e6);
  if (w.note) o.note = str(w.note, 140);
  const dt = normDet(w.det); if (dt.length) o.det = dt;
  return o;
}
function applyPubFeed(m) {
  const names = m.names && typeof m.names === 'object' ? m.names : {};
  Object.keys(names).forEach(c => { if (!CODE_RE.test(c)) return; state.names[c] = str(names[c].name, 24) || 'Alguien'; if (names[c].handle) pubHandles[c] = str(names[c].handle, 20); });
  const keep = state.feed.filter(x => !x.pubx);
  const oldMine = state.feed.filter(x => x.pubx && x.cmt.some(c => c.from === state.me.code));   // las que comenté siguen en mi perfil aunque ya no salgan en el feed
  const next = [];
  (Array.isArray(m.posts) ? m.posts : []).forEach(x => {
    if (!x || typeof x.id !== 'string' || !CODE_RE.test(String(x.from)) || isBlocked(x.from)) return;
    const md = normMedia(x.m), text = str(x.text, 400), wk = normPubW(x.w), tp = TOPIC_IDS.includes(x.tp) ? x.tp : '';
    if (!text && !md && !wk) return;
    const react = {}; Object.keys(x.r || {}).forEach(c => { if (CODE_RE.test(c) && REACTS.includes(x.r[c])) react[c] = x.r[c]; });
    const cmt = (Array.isArray(x.c) ? x.c : []).filter(c => c && typeof c.text === 'string' && CODE_RE.test(String(c.from))).slice(-30).map(c => ({ id: str(c.id, 40), from: c.from, text: str(c.text, 140), ts: Math.min(Date.now(), Number(c.ts) || 0) }));
    const own = keep.find(k => k.id === x.id && k.from === x.from);
    if (own) { own.open = true; Object.assign(own.react, react); cmt.forEach(c => { if (!own.cmt.some(o => o.id === c.id)) own.cmt.push(c); }); return; }   // ya la tengo por amigos, grupos o es mía
    next.push({ id: x.id.slice(0, 40), from: x.from, gid: '', ts: Math.min(Date.now(), Number(x.ts) || 0), w: wk, pub: wk ? null : { text, m: md }, tp, react, cmt, pubx: true });
  });
  const oldSeen = new Set(state.stories.filter(s => s.pubx && s.seen).map(s => s.id));
  state.stories = state.stories.filter(s => !s.pubx);
  (Array.isArray(m.stories) ? m.stories : []).forEach(x => {
    if (!x || typeof x.id !== 'string' || !CODE_RE.test(String(x.from)) || isBlocked(x.from)) return;
    const md = normMedia(x.m), text = str(x.text, 140);
    if ((!text && !md) || state.stories.some(s => s.id === x.id && s.from === x.from)) return;
    state.stories.push({ id: x.id.slice(0, 40), from: x.from, gid: '', ts: Math.min(Date.now(), Number(x.ts) || 0), text, m: md, seen: x.from === state.me.code || oldSeen.has(x.id), aud: { f: false, o: false, p: false, g: [] }, pubx: x.from !== state.me.code });
  });
  state.stories = state.stories.filter(s => !(s.pubx === false)).slice(-80);
  const before = state.feed.filter(x => x.pubx).length;
  oldMine.forEach(o => { if (!next.some(x => x.id === o.id && x.from === o.from) && !isBlocked(o.from)) next.push(Object.assign(o, { stale: true })); });
  state.feed = keep.concat(next);
  save(); renderHome(); if (thOpen) renderThread();
}

setInterval(() => { if (currentTab === 'inicio' && !document.hidden) pullPub(); }, 60e3);
document.addEventListener('visibilitychange', () => { if (!document.hidden && currentTab === 'inicio') pullPub(); });

function srvReady(m) {
  state.names[m.me.code] = m.me.name;
  m.friends.forEach(s => {
    state.names[s.code] = s.name;
    let f = friendByCode(s.code);
    if (!f) { f = { id: uid(), name: s.name, code: s.code }; state.friends.push(f); }
    f.srv = true;
    f.name = s.name;
  });
  state.friends.filter(f => f.srv && !m.friends.some(s => s.code === f.code)).forEach(dropFriend);
  state.friends.forEach(f => { f.on = m.online.includes(f.code); });
  const inOld = state.requests.incoming, outOld = state.requests.outgoing;
  state.requests.incoming = inOld.filter(r => !r.srv).concat(m.inReq.map(r => inOld.find(o => o.srv && o.code === r.code) || { id: uid(), name: r.name, code: r.code, ts: r.ts, srv: true }));
  state.requests.outgoing = outOld.filter(r => !r.srv).concat(m.outReq.map(r => outOld.find(o => o.srv && o.code === r.code) || { id: uid(), code: r.code, ts: r.ts, srv: true }));
  (m.blocked || []).forEach(c => { if (!state.blocked.includes(c) && state.blocked.length < 200) state.blocked.push(c); });
  state.me.handle = /^[a-z0-9_.]{3,20}$/.test(String(m.me.handle)) ? m.me.handle : ''; state.me.priv = m.me.priv !== false;
  if (m.graph) { state.net = normNet(m.graph); ['following', 'followers', 'freqIn', 'freqOut'].forEach(k => state.net[k].forEach(c => { state.names[c.code] = c.name; })); }
  if (Array.isArray(m.notes)) {
    srvNotes = true;
    const seen = Number(m.nseen) || 0;
    state.notes = normNotes(m.notes.map(n => Object.assign({}, n, { seen: (Number(n.ts) || 0) <= seen })));
    m.notes.forEach(n => { if (n.name && n.from) state.names[n.from] = n.name; });
  }
  m.groups.forEach(addServerGroup);
  state.groups.filter(g => g.srv && g.gym && !m.groups.some(x => x.gid === g.id)).forEach(g => { g.srv = false; });
  srvFlush();
  save();
  renderAll();
  if (gatePending && !state.me.handle) { srvSend({ t: 'handle', h: gatePending }); setGateMsg('Guardando…', true); }
  gatePending = '';
  if (gateOpen() && state.me.handle) hideGate(); else if (needHandle() && !$('#app').classList.contains('hidden')) showGate();
  pullPub(true);
}

function onSrvMsg(m) {
  switch (m.t) {
    case 'ready': srvReady(m); return;
    case 'req': state.names[m.from] = m.name; return;   // solicitudes de amistad por código (clientes antiguos): el aviso llega como notificación
    case 'graph': applyGraph(m); return;
    case 'pubfeed': applyPubFeed(m); return;
    case 'note': addNote(Object.assign({}, m.note, { seen: false }), false, true); return;
    case 'notegone': {
      const n0 = state.notes.length;
      state.notes = state.notes.filter(x => x.id !== m.id);
      if (n0 !== state.notes.length) { save(); paintBell(); if ($('#notes').classList.contains('open')) renderNotes(); }
      return;
    }
    case 'nseen': {
      let ch = false;
      state.notes.forEach(n => { if (!n.seen && n.ts <= m.ts) { n.seen = true; ch = true; } });
      if (ch) { save(); paintBell(); }
      return;
    }
    case 'found': found = (m.list || []).map(normCard); renderSearch(); return;
    case 'ok':
      if (m.re === 'handle') { gateBusy = false; state.me.handle = m.h; hdlEdit = false; $('#hdlInput').value = ''; setHdlMsg(''); save(); renderRequests(); paintProfileNet(); toast(`${T('Tu usuario es')} @${m.h}`); if (gateOpen()) hideGate(); }
      else if (m.re === 'follow') toast(m.state === 'requested' ? T('Solicitud enviada') : T('Ahora sigues a esta persona'));
      return;
    case 'err':
      if (m.re === 'handle') { gateBusy = false; setHdlMsg(T(HDL_ERR[m.why] || HDL_ERR.invalid), 'err'); }
      else if (m.re === 'follow') toast(FOLLOW_ERR[m.why] || FOLLOW_ERR['no-user']);
      else if (m.re === 'gx' && m.why === 'nohandle') toast(T('Para publicar en público primero elige tu @usuario (Social → Amigos).'));
      else if (m.re === 'gx' && m.why === 'busy') toast(T('Demasiadas acciones seguidas. Espera un poco.'));
      else if (m.re === 'gx' && m.why === 'muted') toast(T('Varias personas han reportado tus publicaciones. No puedes publicar en público durante unos días.'));
      else if (m.re === 'search') $('#srchMsg').textContent = T(FOLLOW_ERR.busy);
      else if (m.re === 'gnew') toast('No se pudo crear el grupo en el servidor');
      else if (m.re === 'gcreate' || m.re === 'gjoin') { const t = T(ERR_GYM[m.why] || ERR_GYM.invalid); if ($('#sheetGym').classList.contains('open')) $('#gjMsg').textContent = t; else toast(t); }
      return;
    case 'accepted': {
      state.names[m.code] = m.name;
      state.requests.incoming = state.requests.incoming.filter(r => r.code !== m.code);
      state.requests.outgoing = state.requests.outgoing.filter(r => r.code !== m.code);
      let f = friendByCode(m.code);
      const isNew = !f;
      if (!f) { f = { id: uid(), name: m.name, code: m.code }; state.friends.push(f); }
      if (isNew) addNote({ type: 'friend', from: m.code }, true);
      f.srv = true; f.name = m.name; f.on = !!m.online;
      save();
      renderAll();
      if (isNew) toast(`${m.name} y tú ya sois amigos 🎉`);
      return;
    }
    case 'rejected':
    case 'cancelled': {
      const c = m.code || m.from;
      state.requests.outgoing = state.requests.outgoing.filter(r => r.code !== c);
      state.requests.incoming = state.requests.incoming.filter(r => r.code !== c);
      save(); renderSocial();
      return;
    }
    case 'unfriended': {
      const f = friendByCode(m.code);
      if (f) { dropFriend(f); if (openGroupId && !groupById(openGroupId)) closeChat(); save(); renderAll(); }
      return;
    }
    case 'dm': {
      const f = friendByCode(m.from);
      if (!f || isBlocked(m.from)) return;
      const g = ensureDirect(f);
      if (g.messages.some(x => x.id === m.id)) return;
      receive(g, toLocalMsg(m, f.id));
      return;
    }
    case 'group': {
      const g = addServerGroup(m);
      if (g) { save(); renderSocial(); toast(`Te han añadido al grupo ${m.name}`); }
      return;
    }
    case 'gm': {
      const g = groupById(m.gid);
      if (!g || isBlocked(m.from) || g.messages.some(x => x.id === m.id)) return;
      const f = friendByCode(m.from);
      receive(g, toLocalMsg(m, f ? f.id : m.from));
      return;
    }
    case 'gleft': {
      const g = groupById(m.gid);
      if (!g) return;
      const f = friendByCode(m.code);
      if (f) g.members = g.members.filter(id => id !== f.id);
      if (g.codes) g.codes = g.codes.filter(c => c !== m.code);
      g.messages.push({ id: uid(), type: 'sys', text: `${(f || {}).name || state.names[m.code] || 'Alguien'} salió del grupo`, ts: Date.now() });
      save(); renderSocial(); if (openGroupId === g.id) renderChat(true);
      return;
    }
    case 'pres': {
      const f = friendByCode(m.code);
      if (f) { f.on = !!m.on; renderFriends(); }
      return;
    }
    case 'fname': {
      state.names[m.code] = m.name;
      const f = friendByCode(m.code);
      if (f) { f.name = m.name; save(); renderSocial(); }
      return;
    }
    case 'gx': onGx(m); return;
    case 'gcode': {
      const g = addServerGroup(m);
      save(); renderAll(); closeSheets();
      toast(m.joined ? `Te has unido a ${m.name} 🏟️` : `Grupo creado. Código: ${m.code}`);
      openGymScreen(m.gid);
      return;
    }
    case 'gjoined': {
      const g = groupById(m.gid);
      if (!g) return;
      state.names[m.code] = m.name;
      if (g.codes && !g.codes.includes(m.code)) g.codes.push(m.code);
      g.messages.push({ id: uid(), type: 'sys', text: `${m.name} se ha unido al grupo`, ts: Date.now() });
      if (g.rank) sendStats(g);
      if (g.by === state.me.code) addNote({ type: 'join', from: m.code, gname: g.name }, true);
      save(); renderSocial();
      return;
    }
  }
}


/* --- Estado de la conexión (Ajustes) --- */
let srvRegen = 0;
function srvStatusUI() { /* sin ajustes de servidor: la conexión es automática */ }
function onSrvStatus(st, why) {
  // Código repetido y todavía sin amigos en el servidor: se estrena otro sin avisar
  if (st === 'error' && why === 'taken' && !state.account && !state.friends.some(f => f.srv) && srvRegen++ < 5) {
    state.me.code = genCode();
    save();
    renderAll();
    Srv.identify({ code: state.me.code, name: state.me.name }, true);
    return;
  }
  srvStatusUI();
  if (st === 'online') renderSocial();
}
function bindSrv() {
  Srv.onmsg = onSrvMsg;
  Srv.onstatus = onSrvStatus;
  Srv.start({ code: state.me.code, name: state.me.name }).then(() => { srvStatusUI(); paintLoginSkip(); });
}

const FOLD_DEFAULT = { inv: false, pfMore: false, frame: false, achDone: false, achTodo: false, missions: true, trophies: true };
function paintFold(btn) {
  const key = btn.dataset.fold;
  const open = key in state.ui.fold ? !!state.ui.fold[key] : !!FOLD_DEFAULT[key];
  btn.setAttribute('aria-expanded', String(open));
  const body = $('#' + btn.dataset.target);
  body.classList.toggle('open', open);
  body.inert = !open;
}
function applyFolds() { $$('.fold').forEach(paintFold); }
function toggleFold(btn) {
  const key = btn.dataset.fold;
  state.ui.fold[key] = btn.getAttribute('aria-expanded') !== 'true';
  save();
  paintFold(btn);
}


/* ---------- Modo prueba ---------- */
const pick = arr => arr[rnd(arr.length)];
const SIM_TEXTS = ['¡Ánimo! 💪', '¿Qué tal el día?', 'Mañana quedamos, ¿no?', 'Jajaja 😂', 'Buenas 👋'];
const SIM_NOTES = ['Día largo', 'Con la cabeza en otra parte', 'Tranquilo hoy', 'Hoy sí 😅', ''];
const SIM_NAMES = ['Marcos', 'Lucía', 'Pablo', 'Ana', 'Sergio', 'Irene', 'Dani', 'Nerea'];

function simulate() {
  const gs = state.groups.filter(g => g.members.some(id => friendById(id)));
  if (!gs.length) { toast('Crea un chat con algún amigo primero'); return; }
  const g = pick(gs);
  const from = pick(g.members.filter(id => friendById(id)));
  if (rnd(2) === 0) receive(g, { id: uid(), from, ts: Date.now(), type: 'event', mood: 1 + rnd(5), note: pick(SIM_NOTES) });
  else receive(g, { id: uid(), from, ts: Date.now(), type: 'text', text: pick(SIM_TEXTS) });
}

// Las solicitudes simuladas con código ya no existen: ahora se sigue por @usuario con el servidor.
function simulateRequest() { toast('Las solicitudes de prueba ya no existen: usa dos móviles con el servidor'); }
function simulateAccept() { simulateRequest(); }



/* ---------- Ajustes ---------- */
function updateNotifBtn() {
  const b = $('#btnBrowserNotif');
  if (!('Notification' in window)) { b.textContent = 'Tu navegador no admite avisos'; b.disabled = true; return; }
  if (Notification.permission === 'denied') b.textContent = 'Avisos bloqueados en el navegador';
  else if (Notification.permission === 'granted' && state.settings.browserNotif) b.textContent = 'Avisos del navegador: activados';
  else b.textContent = 'Activar avisos del navegador';
}

/* Ajustes: un índice con apartados claros; cada apartado se abre en su propia página */
let setPageNow = '';
function paintSettingsHub() {
  const a = state.account;
  $('#setAva').textContent = (state.me.name || '?').trim().charAt(0).toUpperCase() || '?';
  $('#setAccName').textContent = state.me.name || T('Tu cuenta');
  $('#setAccSub').textContent = a ? [state.me.handle ? '@' + state.me.handle : '', a.email].filter(Boolean).join(' · ') : T('Crear cuenta o entrar');
  const th = { auto: 'Automático', day: 'Día', night: 'Noche' }[state.settings.theme] || 'Automático';
  $('#setSubLook').textContent = `${T('Tema')} ${T(th).toLowerCase()} · ${state.settings.lang === 'en' ? 'English' : 'Español'}`;
  $('#setSubNotes').textContent = `${T('Actividad')}: ${T(state.settings.noteToast !== false ? 'sí' : 'no')} · ${T('vibración')}: ${T(state.settings.haptics !== false ? 'sí' : 'no')}`;
  $('#setSubPriv').textContent = `${T('PIN')}: ${T(state.settings.lock.on ? 'activado' : 'desactivado')} · ${state.blocked.length} ${T(state.blocked.length === 1 ? 'bloqueado' : 'bloqueados')}`;
}
function setPage(name) {
  setPageNow = name || '';
  $('#setHub').classList.toggle('hidden', !!name);
  let title = 'Ajustes';
  $$('#settings .set-page').forEach(pg => { const on = pg.dataset.page === name; pg.classList.toggle('hidden', !on); if (on) title = pg.dataset.title; });
  $('#setTitle').textContent = T(title);
  $('#settings .ov-body').scrollTop = 0;
  if (!name) paintSettingsHub();
}
function settingsBack() { if (setPageNow) setPage(''); else closeSettings(); }
function openSettings(page) {
  rememberOpener();
  setPage(typeof page === 'string' ? page : '');
  $('#rsHaptics').checked = state.settings.haptics !== false;
  paintAppearance();
  updateNotifBtn();
  $('#settings').classList.add('open');
  syncOverlayClass();
}
function closeSettings() {
  $('#settings').classList.remove('open');
  setPageNow = '';
  syncOverlayClass();
}

/* ---------- Teclado del móvil: mantiene el chat visible ---------- */
function bindViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const update = () => {
    root.style.setProperty('--vvh', vv.height + 'px');
    root.style.setProperty('--vvt', vv.offsetTop + 'px');
    if (openGroupId) { const box = $('#msgs'); box.scrollTop = box.scrollHeight; }
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  update();
}

/* ---------- Calidad de vida ---------- */

/* ---------- Animaciones «vivas» (v22): números que cuentan, fondo con parallax, aviso suave del botón + ---------- */
const countRaf = new WeakMap();
function countTo(node, target) {
  if (!node) return;
  const txt = String(target);
  const dec = /^\d+\.\d$/.test(txt), num = parseFloat(txt);
  if (!/^\d+(\.\d)?$/.test(txt) || reduceMotion() || document.hidden) { node.textContent = txt; node._cv = isNaN(num) ? 0 : num; return; }
  const from = typeof node._cv === 'number' ? node._cv : 0;
  cancelAnimationFrame(countRaf.get(node) || 0);
  if (from === num) { node.textContent = txt; return; }
  const t0 = performance.now(), dur = Math.min(900, 350 + Math.abs(num - from) * 12);
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = from + (num - from) * e;
    node.textContent = k >= 1 ? txt : (dec ? v.toFixed(1) : String(Math.round(v)));
    if (k < 1) countRaf.set(node, requestAnimationFrame(step)); else node._cv = num;
  };
  node._cv = num;
  countRaf.set(node, requestAnimationFrame(step));
}
function aliveNumbers() {
  [['#totalCount'], ['#monthCount'], ['#prTotal'], ['#bestWeeks'], ['#streakNum']].forEach(([sel]) => { const n = $(sel); if (n) countTo(n, n.textContent); });
}
function bindAlive() {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking || reduceMotion()) return;
    ticking = true;
    requestAnimationFrame(() => { root.style.setProperty('--sy', Math.min(window.scrollY, 1400)); ticking = false; });
  }, { passive: true });
  // Los emojis del registro rápido «saludan» una vez al entrar a Inicio
  }
function todayBurst() {
  const h = $('#todayBurst'); if (!h) return;
  h.className = 'pl-burst'; sparkle(h, 16, false);
  setTimeout(() => { h.innerHTML = ''; }, 1400);
}

/* ---------- Bloqueo con PIN, privacidad, CSV y PWA (v21) ---------- */
function cyrb53(str, seed) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
function pinHash(pin, salt) { let v = cyrb53(salt + ':' + pin, 7); for (let i = 0; i < 3000; i++) v = cyrb53(salt + v + pin, i); return v.toString(36); }
const newSalt = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

let lockMode = '', lockBuf = '', lockTmp = '', lockFails = 0, lockUntil = 0, hiddenAt = 0, lockTimer = 0;
const lockOpen = () => !$('#lock').classList.contains('hidden');
function lockPaint() {
  $$('#lockDots i').forEach((d, i) => d.classList.toggle('on', i < lockBuf.length));
}
function lockMsg(t) { $('#lockMsg').textContent = t ? T(t) : ''; }
function lockShow(mode) {
  lockMode = mode; lockBuf = ''; lockTmp = '';
  const setup = mode === 'set1' || mode === 'verify-off' || mode === 'verify-change';
  $('#lockTitle').textContent = T(mode === 'set1' ? 'Elige un PIN de 4 dígitos' : mode === 'set2' ? 'Repite el PIN' : setup ? 'Introduce tu PIN actual' : 'Introduce tu PIN');
  $('#lockCancel').classList.toggle('hidden', mode === 'unlock');
  $('#lockForgot').classList.toggle('hidden', mode !== 'unlock');
  lockMsg(''); lockPaint();
  const L = $('#lock');
  L.classList.remove('hidden'); L.classList.remove('out'); replay($('#lock .lock-card'), 'pop-in');
  if (mode === 'unlock') [$('#appShell'), $('#tabbar'), $('#login')].forEach(n => { n.inert = true; });
  setTimeout(() => { const b = $('#lockPad button'); if (b) b.focus(); }, 60);
}
function lockHide() {
  const L = $('#lock');
  L.classList.add('out');
  setTimeout(() => { L.classList.add('hidden'); L.classList.remove('out'); }, reduceMotion() ? 0 : 260);
  [$('#appShell'), $('#tabbar'), $('#login')].forEach(n => { n.inert = false; });
  lockMode = '';
  paintLockSettings();
}
function paintLockSettings() {
  const l = state.settings.lock;
  $('#rsLock').checked = l.on;
  $('#lockOpts').classList.toggle('hidden', !l.on);
  $('#lockAfter').value = String(l.after);
}
function lockShake(msg) {
  const c = $('#lock .lock-card');
  replay(c, 'shake'); buzz(60); lockBuf = ''; lockPaint(); lockMsg(msg);
}
function lockDigit(k) {
  if (!lockOpen()) return;
  if (Date.now() < lockUntil) { lockMsg(`Espera ${Math.ceil((lockUntil - Date.now()) / 1000)} s`); return; }
  if (k === 'x') { lockBuf = lockBuf.slice(0, -1); lockPaint(); return; }
  if (lockBuf.length >= 4) return;
  lockBuf += k; buzz(6); lockPaint();
  if (lockBuf.length < 4) return;
  const pin = lockBuf, l = state.settings.lock;
  setTimeout(() => {
    if (lockMode === 'set1') { lockTmp = pin; lockMode = 'set2'; lockBuf = ''; lockPaint(); $('#lockTitle').textContent = T('Repite el PIN'); lockMsg(''); return; }
    if (lockMode === 'set2') {
      if (pin !== lockTmp) { lockMode = 'set1'; $('#lockTitle').textContent = T('Elige un PIN de 4 dígitos'); lockShake('No coinciden. Prueba otra vez.'); return; }
      const salt = newSalt();
      state.settings.lock = { on: true, h: pinHash(pin, salt), s: salt, after: l.after };
      save(); lockHide(); toast('PIN activado'); return;
    }
    // unlock, verify-off, verify-change: comprobar el PIN actual
    if (pinHash(pin, l.s) !== l.h) {
      lockFails++;
      if (lockFails >= 5) { lockFails = 0; lockUntil = Date.now() + 30000; lockShake('Demasiados intentos. Espera 30 s.'); }
      else lockShake('PIN incorrecto');
      return;
    }
    lockFails = 0;
    if (lockMode === 'verify-off') { state.settings.lock = normLock(); save(); lockHide(); toast('PIN desactivado'); }
    else if (lockMode === 'verify-change') { lockShow('set1'); }
    else lockHide();
  }, 120);
}
function lockNow() { if (state.settings.lock.on && !lockOpen()) { closeSheets(); lockShow('unlock'); } }
function bindLock() {
  $$('#lockPad button').forEach(b => b.addEventListener('click', () => lockDigit(b.dataset.k)));
  document.addEventListener('keydown', e => {
    if (!lockOpen()) return;
    if (/^\d$/.test(e.key)) lockDigit(e.key); else if (e.key === 'Backspace') lockDigit('x');
    else if (e.key === 'Escape' && lockMode !== 'unlock') { $('#lockCancel').click(); }
  });
  $('#lockCancel').addEventListener('click', () => { lockHide(); });
  $('#lockForgot').addEventListener('click', () => {
    if (!confirm(T('Si olvidaste el PIN, la única forma de entrar es borrar TODOS los datos de este móvil (registros, progreso, amigos). Si tienes una copia completa podrás restaurarla después. ¿Borrar todo?'))) return;
    try { localStorage.removeItem('gymcrew.srv'); } catch (e) { /* ignorar */ }
    state = load({}); save(); location.reload();
  });
  $('#rsLock').addEventListener('change', e => {
    if (e.target.checked) lockShow('set1'); else lockShow('verify-off');
  });
  $('#lockAfter').addEventListener('change', e => { state.settings.lock.after = Number(e.target.value); save(); });
  $('#lockNow').addEventListener('click', () => { closeSettings(); lockNow(); });
  $('#lockChange').addEventListener('click', () => lockShow('verify-change'));
  document.addEventListener('visibilitychange', () => {
    const on = state.settings.lock.on;
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); if (on) $('#privacyCover').classList.remove('hidden'); return; }
    $('#privacyCover').classList.add('hidden');
    if (on && hiddenAt && Date.now() - hiddenAt >= state.settings.lock.after * 1000) lockNow();
  });
  paintLockSettings();
}

function csvCell(v) {
  let t = String(v == null ? '' : v).replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t]/.test(t)) t = "'" + t;
  return /[",;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}
function exportCsv() {
  const rows = [['fecha', 'hora', 'tipo', 'duracion_min', 'sensacion_1_5', 'ejercicio', 'serie', 'repeticiones', 'peso_kg', 'rpe', 'nota']];
  sortedW().forEach(w => {
    const base = [w.date, w.time || '', w.type, w.dur || '', w.feel || ''];
    if (!w.ex.length) rows.push([...base, '', '', '', '', '', w.note || '']);
    w.ex.forEach(e => e.sets.forEach((s, i) => rows.push([...base, exName(e.k), i + 1, s.r, s.w, s.rpe || '', i === 0 ? w.note || '' : ''])));
  });
  const blob = new Blob(['﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `gymcrew-entrenos-${ymd(new Date())}.csv`; a.click();
  URL.revokeObjectURL(a.href);
  toast(`${state.workouts.length} entrenos exportados`);
}
function registerSW() {
  try { if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* ignorar */ }
}

function paintGoalSettings() {
  paintBlocked();
}

function bindQol() {
  $('#csvBtn').addEventListener('click', exportCsv);
  $('#entrySearch').addEventListener('input', e => { histQ = e.target.value; renderHist(); });
  bindLock();
  bindPost();
  bindTimeline();
  bindAlive();
  registerSW();
  $$('#wQuick button').forEach(b => b.addEventListener('click', () => { ed.date = ymd(addDays(today(), -Number(b.dataset.qd))); $('#wDate').value = ed.date; paintWorkout(); }));
  $('#wDate').addEventListener('change', () => { if (ed) { ed.date = $('#wDate').value; paintWorkout(); } });
  ['#wTime', '#wDur', '#wNote'].forEach(s => $(s).addEventListener('input', () => { if (ed) { readEditor(); saveDraft(); } }));
  $('#wFeel').addEventListener('change', () => { if (ed) { readEditor(); saveDraft(); } });
  const vt = $('#viewTitle');
  vt.setAttribute('tabindex', '0');
  vt.setAttribute('title', 'Volver arriba');
  const top = () => window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
  vt.addEventListener('click', top);
  vt.addEventListener('keydown', e => { if (e.key === 'Enter') top(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('.sheet.open')) { closeSheets(); return; }
    if ($('#workout.open')) { tryCloseWorkout(); return; }
    if ($('#gym.open')) { closeGymScreen(); return; }
    if ($('#settings.open')) { if (setPageNow) setPage(''); else { closeSettings(); restoreFocus(); } }
  });
  $('#rsHaptics').addEventListener('change', e => { state.settings.haptics = e.target.checked; save(); if (e.target.checked) buzz(14); });
}

function tryCloseWorkout() {
  readEditor();
  if (edDirty() && !ed.id && !confirm(T('Tu entreno se queda como borrador en este móvil. ¿Salir?'))) return;
  closeWorkout(false);
}

/* ---------- Eventos ---------- */
function bind() {
  $$('.tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.goto)));
  $('#hdrAva').addEventListener('click', () => showTab('perfil'));
  $('#openSettings').addEventListener('click', () => openSettings());
  $('#settingsBack').addEventListener('click', settingsBack);
  $$('#settings [data-sp]').forEach(b => b.addEventListener('click', () => setPage(b.dataset.sp)));
  $('#backdrop').addEventListener('click', closeSheets);
  window.addEventListener('resize', () => moveIndicator(false));
  if ('ResizeObserver' in window) new ResizeObserver(() => moveIndicator(false)).observe($('#tabbar'));
  bindViewport();

  // Inicio
  $('#todayGo').addEventListener('click', () => openWorkout(null, {}));
  $('#repeatLast').addEventListener('click', repeatLast);

  // Entrenos
  $$('[data-hseg]').forEach(b => b.addEventListener('click', () => setHseg(b.dataset.hseg)));
  $('#prevMonth').addEventListener('click', () => changeMonth(-1));
  $('#nextMonth').addEventListener('click', () => changeMonth(1));

  // Editor de entreno
  $('#wBack').addEventListener('click', tryCloseWorkout);
  $('#wSave').addEventListener('click', saveWorkout);
  $('#wAddEx').addEventListener('click', openExPicker);
  $('#exSearch').addEventListener('input', paintExPicker);
  $('#exCustomAdd').addEventListener('click', addCustomExercise);
  $('#wRepeat').addEventListener('click', () => { const l = sortedW().pop(); if (l && ed) { ed.type = l.type; ed.muscles = [...l.muscles]; ed.ex = cloneEx(l.ex); paintWorkout(); saveDraft(); toast('Cargado tu último entreno'); } });
  $('#wDelete').addEventListener('click', () => { const w = state.workouts.find(x => x.id === ed.id); if (w && confirm(T('¿Borrar este entreno?'))) { closeWorkout(false); deleteWorkout(w); } });
  $('#restStart').addEventListener('click', () => { const run = rest.end > Date.now(); if (run) { rest.end += 30000; rest.total += 30; restPaint(); } else restStart(state.settings.rest); });
  $('#restStop').addEventListener('click', () => restStop());
  $('#shFriends').addEventListener('change', e => { edShare.f = e.target.checked; paintShare(); });
  $('#shPublic').addEventListener('change', e => { edShare.p = e.target.checked; paintShare(); });
  $('#shVol').addEventListener('change', e => { edShare.vol = e.target.checked; });
  $('#shDet').addEventListener('change', e => { edShare.det = e.target.checked; });
  $('#shNote').addEventListener('change', e => { edShare.note = e.target.checked; });

  // Social
  $$('[data-seg]').forEach(b => b.addEventListener('click', () => setSeg(b.dataset.seg)));
  bindPeople();
  $('#gymOpen').addEventListener('click', openGymSheet);
  $('#gjCreate').addEventListener('click', createGymGroup);
  $('#gjJoin').addEventListener('click', joinGymGroup);
  $('#gjCode').addEventListener('input', e => { e.target.value = normCode(e.target.value).slice(0, 8); $('#gjMsg').textContent = ''; });
  $('#saveGroup').addEventListener('click', createGroup);
  $('#chatBack').addEventListener('click', closeChat);
  $('#chatInfo').addEventListener('click', openGroupInfo);
  $('#composer').addEventListener('submit', sendMessage);
  $('#giDelete').addEventListener('click', () => {
    const g = groupById(openGroupId);
    if (g && confirm(T(`¿Eliminar "${chatName(g)}" y su chat?`))) {
      if (g.srv && !g.gym) srvSend({ t: 'gleave', gid: g.id });
      state.groups = state.groups.filter(x => x.id !== g.id);
      save(); closeSheets(); closeChat(); renderAll();
    }
  });

  // Grupo de gimnasio
  $('#gyBack').addEventListener('click', closeGymScreen);
  $('#gyCopy').addEventListener('click', async () => { const g = groupById(openGym); if (g) toast((await copyText(g.code)) ? 'Código copiado' : `Código: ${g.code}`); });
  $('#gyChat').addEventListener('click', () => { const id = openGym; closeGymScreen(); openChat(id); });
  $('#gyLeave').addEventListener('click', leaveGym);
  $('#gyGoalSel').addEventListener('change', e => { const g = groupById(openGym); if (g) { g.goal = Number(e.target.value); save(); srvSend({ t: 'gx', gid: g.id, k: 'gset', p: { goal: g.goal } }); renderGym(); } });
  $('#gyRankMe').addEventListener('change', e => { const g = groupById(openGym); if (g) { g.rank = e.target.checked; save(); sendStats(g); renderGym(); } });
  $('#gyRankShow').addEventListener('change', e => { const g = groupById(openGym); if (g) { g.showRank = e.target.checked; save(); renderGym(); } });
  $$('#gyMetric button').forEach(b => b.addEventListener('click', () => { rankMetric = b.dataset.m; renderGym(); }));
  $('#gyMeetNew').addEventListener('click', () => { $('#mDate').value = ymd(new Date()); $('#mTime').value = '19:00'; $('#mPlace').value = ''; $('#mNote').value = ''; openSheet('sheetMeet'); });
  $('#mSave').addEventListener('click', proposeMeet);

  // Moderación
  $('#modReport').addEventListener('click', () => modTarget && reportUser(modTarget.code, modTarget.text, modTarget.pid));
  $('#modBlock').addEventListener('click', () => modTarget && confirm(T('¿Bloquear a esta persona? Dejaréis de veros y se quitará de tus amigos.')) && blockUser(modTarget.code));
  $('#msgs').addEventListener('click', e => {
    const b = e.target.closest('.bubble.them');
    if (b && b.dataset.from) openMod(b.dataset.from, b.dataset.text || '');
  });

  // Perfil
  $('#nameInput').addEventListener('change', e => {
    state.me.name = e.target.value.trim().slice(0, 20) || 'Yo';
    save(); renderAll();
    if (window.Srv) Srv.identify({ code: state.me.code, name: state.me.name });
  });
  $('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  const pickPhoto = () => $('#photoInput').click();
  $('#avaBig').addEventListener('click', pickPhoto);
  $('#photoBtn').addEventListener('click', pickPhoto);
  $('#photoInput').addEventListener('change', async e => { await setPhotoFromFile(e.target.files[0]); e.target.value = ''; });
  $('#photoDel').addEventListener('click', () => { state.me.photo = ''; save(); renderAll(); toast('Foto quitada'); });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) applyTheme(); });
  $('#lgForm').addEventListener('submit', submitLogin);
  $('#wlNext').addEventListener('click', () => { if (wlI < WELCOME.length - 1) { wlI++; paintWelcome(); } else endWelcome('signup'); });
  $('#wlBack').addEventListener('click', () => { if (wlI > 0) { wlI--; paintWelcome(); } });
  $('#wlHave').addEventListener('click', () => endWelcome('login'));
  $('#gateForm').addEventListener('submit', submitGate);
  $('#gateInput').addEventListener('input', () => { setGateMsg(''); paintGate(); });
  $$('#lgMode button').forEach(b => b.addEventListener('click', () => setLgMode(b.dataset.lg)));
  $('#loginSkip').addEventListener('click', () => { state.loginSkipped = true; save(); hideLogin(); });
  $('#btnLogout').addEventListener('click', logout);
  $('#lgForgot').addEventListener('click', () => setLgMode('recover'));
  $('#lgBack').addEventListener('click', () => setLgMode('login'));
  $('#rcOk').addEventListener('change', e => { $('#rcGo').disabled = !e.target.checked; });
  $('#rcCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#rcCode').textContent); toast('Código copiado'); } catch { toast('No se pudo copiar: anótalo a mano'); } });
  $('#accPw').addEventListener('click', () => openAcc('pw'));
  $('#accRc').addEventListener('click', () => openAcc('rc'));
  $('#delAccount').addEventListener('click', () => openAcc('del'));
  $('#accForm').addEventListener('submit', submitAcc);
  $('#btnLogin').addEventListener('click', () => { $('#settings').classList.remove('open'); syncOverlayClass(); showLogin(); });

  // Ajustes
  $('#btnBrowserNotif').addEventListener('click', async () => {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    state.settings.browserNotif = p === 'granted';
    save(); updateNotifBtn();
    if (p === 'granted') toast('Avisos activados');
  });
  $$('.fold').forEach(b => b.addEventListener('click', () => toggleFold(b)));
  bindTour();
  $$('[data-theme-opt]').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.themeOpt)));
  $$('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  // Ajustes: datos
  const download = (obj, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
    a.download = name; a.click();
    URL.revokeObjectURL(a.href);
  };
  $('#exportBtn').addEventListener('click', () => download({ workouts: state.workouts }, `gymcrew-${ymd(new Date())}.json`));
  $('#backupBtn').addEventListener('click', () => { download(makeBackup(), `gymcrew-copia-${ymd(new Date())}.json`); toast('Copia guardada'); });
  $('#restoreFile').addEventListener('change', async ev => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.app !== 'gymcrew' || typeof data.state !== 'object') throw new Error();
      if (!confirm(T('Se reemplazarán tus rutinas, ejercicios propios, logros y ajustes por los de la copia (tus entrenos se unen sin duplicar). ¿Continuar?'))) return;
      restoreBackup(data.state);
      toast('Copia restaurada');
    } catch { toast('El archivo no es una copia completa válida'); }
  });
  $('#importFile').addEventListener('change', async ev => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.workouts)) throw new Error();
      const known = new Set(state.workouts.map(w => w.id));
      normWorkouts(data.workouts).forEach(w => { if (!known.has(w.id)) { delete w.sh; state.workouts.push(w); } });
      save(); renderAll();
      toast('Importación completada');
    } catch { toast('El archivo no es una copia válida'); }
  });
  $('#wipeEntries').addEventListener('click', () => {
    if (confirm(T('Se borrarán todos tus entrenos y tu racha. No se puede deshacer. ¿Continuar?'))) {
      state.workouts = []; state.feed = state.feed.filter(p => p.from !== state.me.code); state.ui.draft = null;
      save(); renderAll(); toast('Entrenos borrados');
    }
  });
  $('#wipeShared').addEventListener('click', () => { if (confirm(T('Se quitarán de los feeds y rankings de tus amigos y grupos todos los entrenos y estadísticas que compartiste. Tus entrenos se quedan en tu móvil. ¿Continuar?'))) deleteSharedData(); });
  $('#wipeSocial').addEventListener('click', () => {
    if (confirm(T('Se borrarán tus amigos, solicitudes, grupos y chats. No se puede deshacer. ¿Continuar?'))) {
      if (srvOn()) {
        if (!Srv.online) { toast('Necesitas conexión con el servidor para borrar tus amigos'); return; }
        deleteSharedData();
        state.friends.filter(f => f.srv).forEach(f => Srv.send({ t: 'unfriend', code: f.code }));
        state.groups.filter(g => g.srv).forEach(g => Srv.send({ t: 'gleave', gid: g.id }));
        state.requests.incoming.filter(r => r.srv).forEach(r => Srv.send({ t: 'reject', from: r.code }));
        state.requests.outgoing.filter(r => r.srv).forEach(r => Srv.send({ t: 'cancel', to: r.code }));
      }
      state.friends = []; state.groups = []; state.feed = [];
      state.requests = { incoming: [], outgoing: [] };
      openGroupId = null; openGym = null;
      $('#chat').classList.remove('open'); $('#gym').classList.remove('open');
      syncOverlayClass(); save(); renderAll();
      toast('Amigos y chats borrados');
    }
  });
}

/* ---------- Arranque ---------- */
applyTheme();
setInterval(applyTheme, 30000);
hdrAva = mountAva($('#hdrAva'), 44);
bigAva = mountAva($('#avaBig'), 96);
$('#avaBig').appendChild(Object.assign(el('span', 'cam'), { innerHTML: ICON.cam }));
bind();
bindQol();
bindSplash();
applyFolds();
paintAppearance();
if (state.settings.lang === 'en') applyLang(false);
checkAchievements(true);
if (needLogin()) showLogin(); else showApp();
if (state.account && state.account.rcPending) showRecovery(state.account.rcPending);
bindSrv();
if (state.tutorialDone && state.ui.tab && state.ui.tab !== 'inicio' && TITLES[state.ui.tab]) showTab(state.ui.tab);
