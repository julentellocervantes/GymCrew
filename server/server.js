'use strict';
/* Servidor de GymCrew (Node.js + WebSocket).
   - /ws       Cuentas por código de amigo, amigos, solicitudes, chats directos y de grupo,
               presencia, grupos de gimnasio con código y relé del lado social (entrenos
               compartidos, reacciones, comentarios, retos, quedadas). Los mensajes para alguien
               desconectado se guardan hasta que vuelve a conectarse; el servidor NO guarda historial.
   - /health   Comprobación de estado.
   - Sirve además los ficheros de la app (index.html, app.js...) para tener todo en un mismo sitio.
   Sin contraseñas ni correos: cada dispositivo genera un secreto aleatorio que lo identifica.
   Protocolo: compatible hacia atrás. Los mensajes nuevos son tipos nuevos (gcreate, gjoin, gx, block,
   unblock, report); un cliente antiguo ignora los que no conoce y el servidor ignora los tipos viejos
   que ya no usa. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'db.json');
const STATIC_DIR = process.env.STATIC_DIR === undefined ? path.join(__dirname, '..') : process.env.STATIC_DIR;
const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const LIM = { friends: 200, groups: 40, groupSize: 30, inbox: 500, perIp: 25, reports: 500, blocks: 200 };

const CODE_RE = /^\d{4}[A-Z]{3}$/;
const GCODE_RE = /^[A-Z]{5}\d{3}$/;
const GID_RE = /^[A-Za-z0-9_-]{4,40}$/;
const TOKEN_RE = /^[0-9a-f]{32,128}$/;
const MSGID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const MEDIA_RE = /^[0-9a-f]{32}$/;
/* Almacenamiento remoto opcional (Supabase, plan gratuito sin tarjeta): la base de datos y los archivos
   se guardan fuera del servidor para que sobrevivan a reinicios del hosting gratuito (disco temporal).
   Solo se usa fetch (sin dependencias). Las claves van SOLO en variables de entorno del hosting. */
const SB_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SB_KEY = (process.env.SUPABASE_KEY || '').trim();
const SB_BUCKET = (process.env.SUPABASE_BUCKET || 'gcmedia').trim();
const REMOTE = !!(SB_URL && SB_KEY);
if (SB_URL && !SB_KEY) { console.error('Falta SUPABASE_KEY (la clave secreta de Supabase). Añádela en las variables de entorno del hosting.'); process.exit(1); }
if (REMOTE && !/^https:\/\//.test(SB_URL) && !/^http:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(SB_URL)) { console.error('SUPABASE_URL debe empezar por https://'); process.exit(1); }
async function sb(pathq, opt) {
  opt = opt || {};
  const h = Object.assign({ apikey: SB_KEY }, SB_KEY.startsWith('sb_') ? {} : { Authorization: 'Bearer ' + SB_KEY }, opt.headers);
  return fetch(SB_URL + pathq, Object.assign({}, opt, { headers: h, signal: AbortSignal.timeout(25000) }));
}
async function loadRemote() {
  const r = await sb('/rest/v1/gc_kv?key=eq.db&select=val');
  if (!r.ok) throw new Error('Supabase respondió ' + r.status + ' al leer la base (¿clave incorrecta o falta la tabla gc_kv?)');
  const rows = await r.json();
  if (rows.length && rows[0].val && typeof rows[0].val === 'object') Object.assign(db, rows[0].val);
  normDb();
  return rows.length ? 'datos cargados' : 'base nueva';
}
async function saveRemote() {
  const r = await sb('/rest/v1/gc_kv?on_conflict=key', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify([{ key: 'db', val: db, updated_at: new Date().toISOString() }]) });
  if (!r.ok) throw new Error('Supabase respondió ' + r.status + ' al guardar');
}
async function mediaPut(id, buf, mime) {
  if (!REMOTE) { fs.mkdirSync(MEDIA_DIR, { recursive: true }); fs.writeFileSync(path.join(MEDIA_DIR, id), buf); return; }
  const r = await sb('/storage/v1/object/' + SB_BUCKET + '/' + id, { method: 'POST', headers: { 'Content-Type': mime, 'x-upsert': 'true' }, body: buf });
  if (!r.ok) throw new Error('storage ' + r.status);
}
async function mediaGet(id) {
  const r = await sb('/storage/v1/object/authenticated/' + SB_BUCKET + '/' + id);
  return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
}
function mediaDel(id) {
  if (!REMOTE) return fs.unlink(path.join(MEDIA_DIR, id), () => {});
  sb('/storage/v1/object/' + SB_BUCKET + '/' + id, { method: 'DELETE' }).catch(() => {});
}

const MEDIA_DIR = process.env.MEDIA_DIR || path.join(path.dirname(DATA_FILE), 'media');
const MEDIA = { maxImg: 600 * 1024, maxVid: 4 * 1024 * 1024, perUserBytes: 40 * 1024 * 1024, perUserCount: 60, postMs: 30 * 24 * 3600e3, storyMs: 25 * 3600e3 };

/* ---------- Base de datos (un JSON, guardado de forma atómica) ---------- */
let db = { users: {}, friends: {}, reqs: [], groups: {}, inbox: {}, seq: {}, blocks: {}, reports: [], media: {}, follows: {}, freqs: [], notes: {}, nseen: {}, handles: {}, pubs: [], accounts: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))); } catch { /* base nueva */ }
function normDb() {
  if (!db.media || typeof db.media !== 'object') db.media = {};
  for (const k of ['follows', 'notes', 'nseen', 'handles']) if (!db[k] || typeof db[k] !== 'object' || Array.isArray(db[k])) db[k] = {};
  if (!Array.isArray(db.freqs)) db.freqs = [];
  if (!Array.isArray(db.pubs)) db.pubs = [];
  if (!db.accounts || typeof db.accounts !== 'object' || Array.isArray(db.accounts)) db.accounts = {};
  // Las amistades antiguas cuentan como seguirse los dos
  for (const [a, list] of Object.entries(db.friends)) for (const b of list) { const f = db.follows[a] || (db.follows[a] = []); if (!f.includes(b)) f.push(b); }
}
normDb();
let dirty = false, timer = null, saving = null;
function persist() { dirty = true; if (!timer) timer = setTimeout(flush, REMOTE ? 3000 : 400); }
function flush() {
  timer = null;
  if (!dirty) return saving;
  dirty = false;
  if (REMOTE) {
    if (saving) { dirty = true; timer = setTimeout(flush, 1500); return saving; }
    saving = saveRemote().catch(e => { console.error('No se pudo guardar en Supabase:', e.message); dirty = true; if (!timer) timer = setTimeout(flush, 10000); }).then(() => { saving = null; });
    return saving;
  }
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) { console.error('No se pudo guardar:', e.message); dirty = true; }
}
function shutdown() {
  if (timer) clearTimeout(timer);
  dirty = dirty || false;
  const end = () => process.exit(0);
  setTimeout(end, 8000).unref();
  Promise.resolve(saving).then(() => { dirty = true; return flush(); }).then(end, end);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/* ---------- Utilidades ---------- */
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const tokenOk = (u, token) => !!u && (same(u.hash, sha(token)) || (u.alts || []).some(h => same(h, sha(token))));
const cleanName = s => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 24);
const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
const online = new Map();       // código -> Set<ws>
const nameOf = c => (db.users[c] || {}).name || 'Alguien';
const namesOf = list => Object.fromEntries(list.map(c => [c, nameOf(c)]));
const friendsOf = c => db.friends[c] || (db.friends[c] = []);
const areFriends = (a, b) => friendsOf(a).includes(b);
const followsOf = c => db.follows[c] || (db.follows[c] = []);
const isFollowing = (a, b) => followsOf(a).includes(b);
const followersOf = c => Object.keys(db.follows).filter(u => db.follows[u].includes(c));
const blockedEither = (a, b) => (db.blocks[a] || []).includes(b) || (db.blocks[b] || []).includes(a);
const HANDLE_RE = /^[a-z0-9_.]{3,20}$/;
const isPriv = c => (db.users[c] || {}).priv !== false;     // sin ajuste = privado
const card = c => { const u = db.users[c] || {}; return { code: c, name: u.name || 'Alguien', handle: u.handle || '', priv: u.priv !== false }; };
const NOTE_MS = 30 * 24 * 3600e3;

function emit(code, o) { const s = online.get(code); if (s) for (const w of s) send(w, o); }
// Mensaje que debe llegar sí o sí: se guarda hasta que el cliente lo confirme
function queue(code, o) {
  if (o.from && (db.blocks[code] || []).includes(o.from)) return; // quien te bloqueó no recibe nada tuyo
  const n = (db.seq[code] = (db.seq[code] || 0) + 1);
  const it = Object.assign({ n }, o);
  const box = db.inbox[code] || (db.inbox[code] = []);
  box.push(it);
  while (box.length > LIM.inbox) box.shift();
  persist();
  emit(code, it);
}

/* ---------- Notificaciones guardadas en el servidor (se ven igual en todos tus dispositivos) ---------- */
function note(to, n) {
  if (!to || to === n.from || blockedEither(to, n.from)) return;
  const box = db.notes[to] || (db.notes[to] = []);
  if (n.type === 'like') for (let i = box.length - 1; i >= 0; i--) if (box[i].type === 'like' && box[i].from === n.from && box[i].pid === n.pid) box.splice(i, 1);
  const it = Object.assign({ id: crypto.randomBytes(6).toString('hex'), ts: Date.now(), name: nameOf(n.from) }, n);
  box.push(it);
  while (box.length > 100) box.shift();
  persist();
  emit(to, { t: 'note', note: it });
}
function dropNote(to, fn) {
  const box = db.notes[to]; if (!box) return;
  const gone = box.filter(fn); if (!gone.length) return;
  db.notes[to] = box.filter(x => !fn(x));
  persist();
  for (const g of gone) emit(to, { t: 'notegone', id: g.id });
}
function pruneNotes() { const lim = Date.now() - NOTE_MS; for (const c of Object.keys(db.notes)) db.notes[c] = db.notes[c].filter(n => n.ts > lim); }
setInterval(pruneNotes, 3600e3).unref();

// Avisos de me gusta/reacción y comentarios para quien publicó
function noteGx(me, k, p, owner) {
  if (!owner || owner === me) return;
  if (k === 'react') {
    if (p.e) note(owner, { type: 'like', from: me, pid: p.pid, e: p.e });
    else dropNote(owner, x => x.type === 'like' && x.from === me && x.pid === p.pid);
  } else if (k === 'cmt') note(owner, { type: 'cmt', from: me, pid: p.pid, cid: p.id, text: p.text });
}

/* ---------- Publicaciones públicas (visibles para cualquiera con cuenta) ---------- */
const PUB = { max: 300, ttl: 7 * 24 * 3600e3, perHour: 10, show: 60, cmts: 30 };
function prunePubs() {
  const now = Date.now(), keep = [];
  for (const x of db.pubs) { if (now - x.ts > PUB.ttl) { if (x.m) dropMedia(x.m.id); } else keep.push(x); }
  while (keep.length > PUB.max) { const o = keep.shift(); if (o.m) dropMedia(o.m.id); }
  db.pubs = keep;
}
setInterval(() => { prunePubs(); persist(); }, 3600e3).unref();
const pubOf = (by, id) => db.pubs.find(x => x.by === by && x.id === id);
function pubView(me) {
  const names = {}, nm = c => { names[c] = { name: nameOf(c), handle: (db.users[c] || {}).handle || '' }; return c; };
  const posts = db.pubs.filter(x => !blockedEither(me, x.by)).slice(-PUB.show).reverse().map(x => ({
    id: x.id, from: nm(x.by), ts: x.ts, text: x.text, m: x.m || undefined,
    r: Object.fromEntries(Object.entries(x.r).filter(([c]) => !blockedEither(me, c))),
    c: x.c.filter(k => !blockedEither(me, k.from)).map(k => ({ id: k.id, from: nm(k.from), text: k.text, ts: k.ts }))
  }));
  for (const x of posts) for (const c of Object.keys(x.r)) nm(c);
  return { t: 'pubfeed', posts, names };
}

/* ---------- Seguidores (seguir es de una vía; seguirse los dos = amigos) ---------- */
function graph(code) {
  return {
    t: 'graph',
    following: followsOf(code).slice(0, 500).map(card),
    followers: followersOf(code).slice(0, 500).map(card),
    freqIn: db.freqs.filter(r => r.to === code).map(r => Object.assign(card(r.from), { ts: r.ts })),
    freqOut: db.freqs.filter(r => r.from === code).map(r => Object.assign(card(r.to), { ts: r.ts })),
    friends: friendsOf(code).map(card)
  };
}
const pushGraph = (...cs) => { for (const c of new Set(cs)) emit(c, graph(c)); };
function linkFriends(a, b) {
  for (const [x, y] of [[a, b], [b, a]]) { const f = followsOf(x); if (!f.includes(y)) f.push(y); }
  if (areFriends(a, b) || friendsOf(a).length >= LIM.friends || friendsOf(b).length >= LIM.friends) return false;
  friendsOf(a).push(b); friendsOf(b).push(a);
  return true;
}
function becameFriends(a, b) {
  note(a, { type: 'friend', from: b });
  note(b, { type: 'friend', from: a });
  queue(a, { t: 'accepted', code: b, name: nameOf(b), online: online.has(b) });
  queue(b, { t: 'accepted', code: a, name: nameOf(a), online: online.has(a) });
}
// a empieza a seguir a b (ya aprobado). Si b ya seguía a a, pasan a ser amigos.
function addFollow(a, b, quiet) {
  if (!isFollowing(a, b)) followsOf(a).push(b);
  let fr = false;
  if (isFollowing(b, a) && !areFriends(a, b)) fr = linkFriends(a, b);
  persist();
  if (fr) becameFriends(a, b);
  else if (!quiet) note(b, { type: 'follow', from: a });
  pushGraph(a, b);
}
function cutFollow(a, b) { // a deja de seguir a b
  db.follows[a] = followsOf(a).filter(x => x !== b);
  if (areFriends(a, b)) {
    db.friends[a] = friendsOf(a).filter(x => x !== b);
    db.friends[b] = friendsOf(b).filter(x => x !== a);
    queue(b, { t: 'unfriended', code: a });
    queue(a, { t: 'unfriended', code: b });
  }
  persist();
}

const hits = new Map();
function rate(key, max, ms) {
  const now = Date.now();
  const a = (hits.get(key) || []).filter(t => now - t < ms);
  if (a.length >= max) { hits.set(key, a); return false; }
  a.push(now); hits.set(key, a); return true;
}
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.length || now - a[a.length - 1] > 3600e3) hits.delete(k); }, 600e3).unref();

const REACTS = ['💪', '🔥', '👏', '🙌', '😮', '❤️'];
const TYPES = ['fuerza', 'cardio', 'funcional', 'deporte', 'movilidad'];
const int = (v, a, b) => { const n = Math.floor(Number(v)); return n >= a && n <= b ? n : null; };
const txt = (v, n) => String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
// Valida y limpia el contenido social; lo que no encaja se descarta (nunca se reenvía tal cual)
function cleanGx(k, p) {
  if (!p || typeof p !== 'object') return null;
  if (k === 'post') {
    const w = p.w;
    if (!MSGID_RE.test(String(p.id)) || !w || !TYPES.includes(w.ty)) return null;
    const o = { id: String(p.id), w: { ty: w.ty, dur: int(w.dur, 0, 600) || 0, ex: int(w.ex, 0, 60) || 0, sets: int(w.sets, 0, 400) || 0, d: DAY_RE.test(String(w.d)) ? w.d : '' } };
    o.w.pr = (Array.isArray(w.pr) ? w.pr : []).slice(0, 5).map(x => ({ n: txt(x && x.n, 40), k: ['1rm', 'peso', 'vol', 'reps'].includes(x && x.k) ? x.k : 'peso', v: Math.max(0, Math.min(2000, Number(x && x.v) || 0)) })).filter(x => x.n);
    if (w.feel !== undefined && int(w.feel, 1, 5)) o.w.feel = int(w.feel, 1, 5);
    if (w.vol !== undefined && int(w.vol, 0, 1e6) !== null) o.w.vol = int(w.vol, 0, 1e6); // solo si la persona decidió compartir el volumen
    if (w.note) o.w.note = txt(w.note, 140);                                              // solo si la persona decidió compartir la nota
    return o;
  }
  if (k === 'pub' || k === 'story') {
    if (!MSGID_RE.test(String(p.id))) return null;
    const o = { id: String(p.id), text: txt(p.text, k === 'pub' ? 400 : 140) };
    if (p.m) {
      const m = p.m, rec = MEDIA_RE.test(String(m.id)) ? db.media[String(m.id)] : null;
      if (!rec) return null;
      o.m = { id: String(m.id), k: rec.k, w: int(m.w, 1, 4000) || 0, h: int(m.h, 1, 4000) || 0, d: rec.k === 'vid' ? (int(m.d, 0, 60) || 0) : 0 };
      o.by = rec.by; // se comprueba al enrutar que el archivo es de quien publica
    }
    return o.text || o.m ? o : null;
  }
  if (k === 'react') return MSGID_RE.test(String(p.pid)) && CODE_RE.test(String(p.o)) && (REACTS.includes(p.e) || p.e === '') ? { pid: String(p.pid), o: p.o, e: p.e } : null;
  if (k === 'cmt') {
    const t = txt(p.text, 140);
    return t && MSGID_RE.test(String(p.pid)) && MSGID_RE.test(String(p.id)) && CODE_RE.test(String(p.o)) ? { pid: String(p.pid), o: p.o, id: String(p.id), text: t } : null;
  }
  if (k === 'del') return p.all === true ? { all: true } : MSGID_RE.test(String(p.pid)) ? { pid: String(p.pid) } : null;
  if (k === 'stat') {
    if (p.hide === true) return { hide: true };
    if (!DAY_RE.test(String(p.wk))) return null;
    const n = int(p.n, 0, 14);
    return n === null ? null : { wk: p.wk, n, pr: int(p.pr, 0, 99) || 0, st: int(p.st, 0, 520) || 0 };
  }
  if (k === 'meet') {
    if (!MSGID_RE.test(String(p.id)) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(p.at))) return null;
    return { id: String(p.id), at: p.at, place: txt(p.place, 40), note: txt(p.note, 60) };
  }
  if (k === 'rsvp') return MSGID_RE.test(String(p.mid)) && (p.v === 0 || p.v === 1) ? { mid: String(p.mid), v: p.v } : null;
  if (k === 'gset') { const g = int(p.goal, 0, 14); return g === null ? null : { goal: g }; }
  return null;
}

function cleanMsg(m) {
  if (!m || typeof m !== 'object') return null;
  if (m.type === 'text') {
    const text = String(m.text || '').slice(0, 1000);
    return text.trim() ? { type: 'text', text } : null;
  }
  if (m.type === 'event') {
    const mood = Math.floor(Number(m.mood) || 0);
    if (mood < 0 || mood > 5) return null;
    const o = { type: 'event', mood };
    if (m.note) o.note = String(m.note).slice(0, 500);
    if (m.fx) o.fx = String(m.fx).slice(0, 20);
    return o;
  }
  return null;
}

/* ---------- Cuentas, amigos y chat ---------- */
function ready(code) {
  return {
    t: 'ready',
    me: { code, name: nameOf(code), handle: (db.users[code] || {}).handle || '', priv: isPriv(code) },
    graph: graph(code),
    notes: (db.notes[code] || []).filter(n => n.ts > Date.now() - NOTE_MS),
    nseen: db.nseen[code] || 0,
    friends: friendsOf(code).map(c => ({ code: c, name: nameOf(c) })),
    inReq: db.reqs.filter(r => r.to === code).map(r => ({ code: r.from, name: nameOf(r.from), ts: r.ts })),
    outReq: db.reqs.filter(r => r.from === code).map(r => ({ code: r.to, ts: r.ts })),
    groups: Object.entries(db.groups).filter(([, g]) => g.members.includes(code)).map(([gid, g]) => ({ gid, name: g.name, members: g.members, names: namesOf(g.members), code: g.code, by: g.by })),
    blocked: db.blocks[code] || [],
    online: friendsOf(code).filter(c => online.has(c)),
    seq: db.seq[code] || 0,
    now: Date.now()
  };
}

function presence(code, on) {
  for (const f of friendsOf(code)) emit(f, { t: 'pres', code, on });
}

const H = {
  name(ws, m) {
    const name = cleanName(m.name);
    if (!name) return;
    db.users[ws.code].name = name;
    persist();
    for (const f of friendsOf(ws.code)) emit(f, { t: 'fname', code: ws.code, name });
  },
  req(ws, m) {
    const me = ws.code, to = String(m.to || '');
    if (!CODE_RE.test(to) || to === me) return fail(ws, 'req', 'code');
    if (!db.users[to]) return fail(ws, 'req', 'no-user');
    if (areFriends(me, to)) return fail(ws, 'req', 'friends');
    if (db.reqs.some(r => r.from === me && r.to === to)) return fail(ws, 'req', 'pending');
    if (friendsOf(me).length >= LIM.friends) return fail(ws, 'req', 'full');
    if (db.reqs.filter(r => r.from === me).length >= 50) return fail(ws, 'req', 'many');
    // Si esa persona ya te había escrito, se aceptan mutuamente
    if (db.reqs.some(r => r.from === to && r.to === me)) return H.accept(ws, { from: to });
    db.reqs.push({ from: me, to, ts: Date.now() });
    persist();
    send(ws, { t: 'ok', re: 'req', to, name: nameOf(to) });
    queue(to, { t: 'req', from: me, name: nameOf(me), ts: Date.now() });
    note(to, { type: 'req', from: me });
  },
  accept(ws, m) {
    const me = ws.code, from = String(m.from || '');
    const i = db.reqs.findIndex(r => r.from === from && r.to === me);
    if (i < 0) return fail(ws, 'accept', 'none');
    db.reqs.splice(i, 1);
    linkFriends(me, from);
    persist();
    emit(me, { t: 'accepted', code: from, name: nameOf(from), online: online.has(from) });
    queue(from, { t: 'accepted', code: me, name: nameOf(me), online: online.has(me) });
    note(from, { type: 'friend', from: me });
    dropNote(me, x => x.type === 'req' && x.from === from);
    pushGraph(me, from);
  },
  reject(ws, m) {
    const me = ws.code, from = String(m.from || '');
    const i = db.reqs.findIndex(r => r.from === from && r.to === me);
    if (i < 0) return;
    db.reqs.splice(i, 1);
    persist();
    queue(from, { t: 'rejected', code: me });
  },
  cancel(ws, m) {
    const me = ws.code, to = String(m.to || '');
    const i = db.reqs.findIndex(r => r.from === me && r.to === to);
    if (i < 0) return;
    db.reqs.splice(i, 1);
    persist();
    queue(to, { t: 'cancelled', from: me });
  },
  unfriend(ws, m) {
    const me = ws.code, c = String(m.code || '');
    if (!areFriends(me, c)) return;
    db.friends[me] = friendsOf(me).filter(x => x !== c);
    db.friends[c] = friendsOf(c).filter(x => x !== me);
    db.follows[me] = followsOf(me).filter(x => x !== c);
    db.follows[c] = followsOf(c).filter(x => x !== me);
    persist();
    queue(c, { t: 'unfriended', code: me });
    pushGraph(me, c);
  },
  dm(ws, m) {
    const me = ws.code, to = String(m.to || '');
    const body = cleanMsg(m.m);
    if (!areFriends(me, to) || !body || !MSGID_RE.test(String(m.id))) return fail(ws, 'dm', 'invalid', m.id);
    queue(to, { t: 'dm', from: me, id: m.id, m: body, ts: Date.now() });
    send(ws, { t: 'sent', id: m.id });
  },
  gnew(ws, m) {
    const me = ws.code;
    const gid = String(m.gid || '');
    const name = cleanName(m.name);
    const members = [...new Set((Array.isArray(m.members) ? m.members : []).map(String))].filter(c => c !== me);
    if (!GID_RE.test(gid) || db.groups[gid] || !name || !members.length || members.length >= LIM.groupSize) return fail(ws, 'gnew', 'invalid');
    if (!members.every(c => areFriends(me, c))) return fail(ws, 'gnew', 'not-friends');
    if (Object.values(db.groups).filter(g => g.members.includes(me)).length >= LIM.groups) return fail(ws, 'gnew', 'full');
    const all = [me, ...members];
    db.groups[gid] = { name, members: all, by: me, created: Date.now() };
    persist();
    for (const c of members) queue(c, { t: 'group', gid, name, members: all, names: namesOf(all), by: me });
    send(ws, { t: 'ok', re: 'gnew', gid });
  },
  gm(ws, m) {
    const me = ws.code, g = db.groups[String(m.gid)];
    const body = cleanMsg(m.m);
    if (!g || !g.members.includes(me) || !body || !MSGID_RE.test(String(m.id))) return fail(ws, 'gm', 'invalid', m.id);
    const ts = Date.now();
    for (const c of g.members) if (c !== me) queue(c, { t: 'gm', gid: m.gid, from: me, id: m.id, m: body, ts });
    send(ws, { t: 'sent', id: m.id });
  },
  gleave(ws, m) {
    const me = ws.code, gid = String(m.gid || ''), g = db.groups[gid];
    if (!g || !g.members.includes(me)) return;
    g.members = g.members.filter(c => c !== me);
    // Los grupos con código viven mientras quede alguien; los creados entre amigos se cierran con menos de 2
    if (g.members.length < (g.code ? 1 : 2)) {
      for (const c of g.members) queue(c, { t: 'gleft', gid, code: me, closed: true });
      delete db.groups[gid];
    } else for (const c of g.members) queue(c, { t: 'gleft', gid, code: me });
    persist();
  },
  // Grupo de gimnasio con código de 5 letras + 3 números. Se puede entrar sin ser amigo de nadie.
  gcreate(ws, m) {
    const me = ws.code, gid = String(m.gid || ''), name = cleanName(m.name);
    if (!GID_RE.test(gid) || db.groups[gid] || !name) return fail(ws, 'gcreate', 'invalid');
    if (Object.values(db.groups).filter(g => g.members.includes(me)).length >= LIM.groups) return fail(ws, 'gcreate', 'full');
    if (!rate('gcreate:' + me, 10, 3600e3)) return fail(ws, 'gcreate', 'busy');
    let code;
    do { code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[crypto.randomInt(24)]).join('') + String(crypto.randomInt(1000)).padStart(3, '0'); }
    while (Object.values(db.groups).some(g => g.code === code));
    db.groups[gid] = { name, members: [me], by: me, created: Date.now(), code };
    persist();
    send(ws, { t: 'gcode', gid, name, code, members: [me], names: namesOf([me]), by: me });
  },
  gjoin(ws, m) {
    const me = ws.code, code = String(m.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!rate('gjoin:' + me, 20, 3600e3)) return fail(ws, 'gjoin', 'busy');
    if (!GCODE_RE.test(code)) return fail(ws, 'gjoin', 'code');
    const gid = Object.keys(db.groups).find(k => db.groups[k].code === code), g = db.groups[gid];
    if (!g) return fail(ws, 'gjoin', 'no-group');
    if (g.members.includes(me)) return fail(ws, 'gjoin', 'already');
    if (g.members.length >= LIM.groupSize) return fail(ws, 'gjoin', 'full');
    if (g.members.some(c => (db.blocks[c] || []).includes(me))) return fail(ws, 'gjoin', 'no-group');
    if (Object.values(db.groups).filter(x => x.members.includes(me)).length >= LIM.groups) return fail(ws, 'gjoin', 'mine-full');
    g.members.push(me);
    persist();
    send(ws, { t: 'gcode', gid, name: g.name, code: g.code, members: g.members, names: namesOf(g.members), by: g.by, joined: true });
    for (const c of g.members) if (c !== me) queue(c, { t: 'gjoined', gid, code: me, name: nameOf(me) });
    note(g.by, { type: 'join', from: me, gid, gname: g.name });
  },
  // Relé del lado social. El servidor valida y reenvía; no guarda nada más que la cola de entrega.
  gx(ws, m) {
    const me = ws.code, k = String(m.k || ''), p = cleanGx(k, m.p);
    if (!p) return fail(ws, 'gx', 'invalid');
    if (!rate('gx:' + me, 120, 60e3)) return fail(ws, 'gx', 'busy');
    if (p.m) { // el archivo tiene que ser de quien publica; queda ligado a la publicación para borrarlo con ella
      if (p.by !== me) return fail(ws, 'gx', 'invalid');
      const rec = db.media[p.m.id];
      rec.ref = p.id;
      if (k === 'story') rec.exp = Math.min(rec.exp, Date.now() + MEDIA.storyMs);
      persist();
    }
    delete p.by;
    if (k === 'del') dropMediaWhere(x => x.by === me && (p.all ? m.to === 'friends' : x.ref === p.pid)); // «borrar todo» solo vacía los archivos si viene del borrado general, no al salir de un grupo
    const out = { t: 'gx', from: me, k, p, ts: Date.now() };
    if (m.to === 'public' && m.gid === undefined) return gxPublic(ws, me, k, p);
    if (m.gid !== undefined) {
      const g = db.groups[String(m.gid)];
      if (!g || !g.members.includes(me)) return fail(ws, 'gx', 'invalid');
      if (k === 'gset' && g.by !== me) return fail(ws, 'gx', 'invalid');
      for (const c of g.members) if (c !== me) queue(c, Object.assign({ gid: m.gid }, out));
      noteGx(me, k, p, g.members.includes(p.o) ? p.o : '');
    } else if (m.to === 'friends') {
      if (!['post', 'del', 'cmt', 'pub', 'story'].includes(k)) return fail(ws, 'gx', 'invalid');
      for (const c of friendsOf(me)) queue(c, out);
    } else if (m.to === 'followers') {
      if (!['del', 'cmt', 'pub', 'story'].includes(k)) return fail(ws, 'gx', 'invalid');
      for (const c of followersOf(me)) queue(c, out);
    } else {
      const to = String(m.to || '');
      if (!areFriends(me, to) && !isFollowing(me, to)) return fail(ws, 'gx', 'invalid');
      queue(to, out);
      noteGx(me, k, p, to === p.o ? to : '');
    }
  },
  block(ws, m) {
    const me = ws.code, c = String(m.code || '');
    if (!CODE_RE.test(c) || c === me) return;
    const list = db.blocks[me] || (db.blocks[me] = []);
    if (!list.includes(c) && list.length < LIM.blocks) list.push(c);
    // Bloquear también quita la amistad
    if (areFriends(me, c)) {
      db.friends[me] = friendsOf(me).filter(x => x !== c);
      db.friends[c] = friendsOf(c).filter(x => x !== me);
      queue(c, { t: 'unfriended', code: me });
    }
    db.reqs = db.reqs.filter(r => !((r.from === me && r.to === c) || (r.from === c && r.to === me)));
    db.freqs = db.freqs.filter(r => !((r.from === me && r.to === c) || (r.from === c && r.to === me)));
    db.follows[me] = followsOf(me).filter(x => x !== c);
    db.follows[c] = followsOf(c).filter(x => x !== me);
    dropNote(me, x => x.from === c);
    persist();
    pushGraph(me, c);
  },
  unblock(ws, m) {
    const me = ws.code, c = String(m.code || '');
    db.blocks[me] = (db.blocks[me] || []).filter(x => x !== c);
    persist();
  },
  // Reporte de un mensaje: solo se guarda para que quien administra el servidor lo revise
  report(ws, m) {
    const me = ws.code, c = String(m.code || '');
    if (!CODE_RE.test(c) || !rate('report:' + me, 20, 3600e3)) return;
    db.reports.push({ by: me, who: c, why: String(m.why || '').slice(0, 20), text: String(m.text || '').slice(0, 300), ts: Date.now() });
    while (db.reports.length > LIM.reports) db.reports.shift();
    persist();
  },
  /* ---- Nombre de usuario, perfil privado/público y seguidores ---- */
  handle(ws, m) {
    const me = ws.code, h = String(m.h || '').trim().toLowerCase().replace(/^@/, '');
    if (!HANDLE_RE.test(h) || /^\.|\.$|\.\./.test(h)) return fail(ws, 'handle', 'invalid');
    const u = db.users[me];
    if (u.handle === h) return send(ws, { t: 'ok', re: 'handle', h });
    if (db.handles[h] && db.handles[h] !== me) return fail(ws, 'handle', 'taken');
    if (!rate('handle:' + me, 6, 24 * 3600e3)) return fail(ws, 'handle', 'busy');
    if (u.handle) delete db.handles[u.handle];
    u.handle = h; db.handles[h] = me;
    persist();
    send(ws, { t: 'ok', re: 'handle', h });
    pushGraph(me, ...friendsOf(me), ...followersOf(me));
  },
  profile(ws, m) {
    const me = ws.code, u = db.users[me], priv = m.priv !== false;
    if (u.priv === priv) return send(ws, { t: 'ok', re: 'profile', priv });
    u.priv = priv;
    // Al hacerse público, las solicitudes pendientes se aprueban solas
    if (!priv) for (const r of db.freqs.filter(x => x.to === me)) { db.freqs = db.freqs.filter(x => x !== r); addFollow(r.from, me, true); note(r.from, { type: 'fok', from: me }); }
    persist();
    send(ws, { t: 'ok', re: 'profile', priv });
    pushGraph(me, ...followersOf(me));
  },
  search(ws, m) {
    const me = ws.code, q = String(m.q || '').trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '').slice(0, 20);
    if (!rate('search:' + me, 40, 60e3)) return fail(ws, 'search', 'busy');
    const out = [];
    if (q.length >= 2) {
      for (const [h, c] of Object.entries(db.handles)) {
        if (c === me || !h.startsWith(q) || blockedEither(me, c)) continue;
        out.push(Object.assign(card(c), { rel: areFriends(me, c) ? 'friend' : isFollowing(me, c) ? 'following' : db.freqs.some(r => r.from === me && r.to === c) ? 'requested' : 'none', follower: isFollowing(c, me) }));
        if (out.length >= 10) break;
      }
      out.sort((a, b) => (a.handle === q ? -1 : 0) - (b.handle === q ? -1 : 0) || a.handle.localeCompare(b.handle));
    }
    send(ws, { t: 'found', q: String(m.q || '').slice(0, 24), list: out });
  },
  follow(ws, m) {
    const me = ws.code, to = String(m.code || '');
    if (!CODE_RE.test(to) || to === me || !db.users[to] || blockedEither(me, to)) return fail(ws, 'follow', 'no-user');
    if (!rate('follow:' + me, 60, 3600e3)) return fail(ws, 'follow', 'busy');
    if (isFollowing(me, to)) return pushGraph(me);
    if (followsOf(me).length >= 500) return fail(ws, 'follow', 'full');
    if (!isPriv(to)) { addFollow(me, to); return send(ws, { t: 'ok', re: 'follow', code: to, state: 'following' }); }
    if (db.freqs.some(r => r.from === me && r.to === to)) return send(ws, { t: 'ok', re: 'follow', code: to, state: 'requested' });
    if (db.freqs.filter(r => r.from === me).length >= 50) return fail(ws, 'follow', 'many');
    db.freqs.push({ from: me, to, ts: Date.now() });
    persist();
    note(to, { type: 'freq', from: me });
    send(ws, { t: 'ok', re: 'follow', code: to, state: 'requested' });
    pushGraph(me, to);
  },
  unfollow(ws, m) {
    const me = ws.code, to = String(m.code || '');
    cutFollow(me, to);
    dropNote(to, x => x.from === me && (x.type === 'follow' || x.type === 'freq'));
    pushGraph(me, to);
  },
  rmfollower(ws, m) {
    const me = ws.code, c = String(m.code || '');
    if (!isFollowing(c, me)) return;
    cutFollow(c, me);
    pushGraph(me, c);
  },
  fcancel(ws, m) {
    const me = ws.code, to = String(m.code || '');
    db.freqs = db.freqs.filter(r => !(r.from === me && r.to === to));
    persist();
    dropNote(to, x => x.type === 'freq' && x.from === me);
    pushGraph(me, to);
  },
  fapprove(ws, m) {
    const me = ws.code, from = String(m.code || '');
    const r = db.freqs.find(x => x.from === from && x.to === me);
    if (!r) return fail(ws, 'fapprove', 'none');
    db.freqs = db.freqs.filter(x => x !== r);
    dropNote(me, x => x.type === 'freq' && x.from === from);
    addFollow(from, me, true);
    note(from, { type: 'fok', from: me });
    pushGraph(me, from);
  },
  freject(ws, m) {
    const me = ws.code, from = String(m.code || '');
    db.freqs = db.freqs.filter(r => !(r.from === from && r.to === me));
    dropNote(me, x => x.type === 'freq' && x.from === from);
    persist();
    pushGraph(me, from);
  },
  pubfeed(ws) {
    if (!rate('pf:' + ws.code, 30, 60e3)) return;
    send(ws, pubView(ws.code));
  },
  nseen(ws) {
    const ts = Date.now();
    db.nseen[ws.code] = ts;
    persist();
    emit(ws.code, { t: 'nseen', ts });
  },
  ack(ws, m) {
    const n = Number(m.n) || 0;
    const box = db.inbox[ws.code];
    if (!box) return;
    db.inbox[ws.code] = box.filter(it => it.n > n);
    persist();
  },
  ping(ws) { send(ws, { t: 'pong' }); }
};
function fail(ws, re, why, id) { send(ws, { t: 'err', re, why, id }); }

function onApp(ws, ip) {
  ws.code = null;
  const bucket = { n: 40, t: Date.now() };
  ws.on('message', raw => {
    // 10 mensajes por segundo de media, con ráfagas de 40
    const now = Date.now();
    bucket.n = Math.min(40, bucket.n + (now - bucket.t) / 100); bucket.t = now;
    if (--bucket.n < 0) { ws.close(1008, 'rate'); return; }
    let m;
    try { m = JSON.parse(raw.toString()); } catch { return; }
    if (!m || typeof m.t !== 'string') return;

    if (!ws.code) {
      if (m.t !== 'hello') return;
      const code = String(m.code || ''), token = String(m.token || '');
      if (!CODE_RE.test(code) || !TOKEN_RE.test(token)) { send(ws, { t: 'err', re: 'hello', why: 'format' }); return ws.close(); }
      if (!rate('hello:' + ip, 40, 600e3)) { send(ws, { t: 'err', re: 'hello', why: 'busy' }); return ws.close(); }
      let u = db.users[code];
      if (!u) {
        if (!rate('reg:' + ip, 15, 3600e3)) { send(ws, { t: 'err', re: 'hello', why: 'busy' }); return ws.close(); }
        const name = cleanName(m.name) || 'Yo';
        u = db.users[code] = { name, hash: sha(token), created: Date.now() };
        friendsOf(code);
        persist();
      } else if (!tokenOk(u, token)) {
        send(ws, { t: 'err', re: 'hello', why: 'taken' });
        return ws.close();
      } else {
        const name = cleanName(m.name);
        if (name && name !== u.name) { u.name = name; persist(); for (const f of friendsOf(code)) emit(f, { t: 'fname', code, name }); }
      }
      ws.code = code;
      const first = !online.has(code);
      if (first) online.set(code, new Set());
      online.get(code).add(ws);
      send(ws, ready(code));
      for (const it of db.inbox[code] || []) send(ws, it);
      if (first) presence(code, true);
      return;
    }
    const h = H[m.t];
    if (h) h(ws, m);
  });
  ws.on('close', () => {
    if (!ws.code) return;
    const s = online.get(ws.code);
    if (!s) return;
    s.delete(ws);
    if (!s.size) { online.delete(ws.code); presence(ws.code, false); }
  });
}

/* ---------- Fotos y vídeos (subida por HTTP; en el WebSocket solo viaja el identificador) ---------- */
// Se comprueba el tipo real por los primeros bytes: lo que diga el cliente no vale.
function sniff(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { k: 'img', mime: 'image/jpeg' };
  if (buf.length > 12 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { k: 'img', mime: 'image/png' };
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return { k: 'img', mime: 'image/webp' };
  if (buf.length > 12 && buf.slice(4, 8).toString() === 'ftyp') return { k: 'vid', mime: 'video/mp4' };
  if (buf.length > 12 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { k: 'vid', mime: 'video/webm' };
  return null;
}
function dropMedia(id) {
  if (!db.media[id]) return;
  delete db.media[id];
  mediaDel(id);
  persist();
}
function dropMediaWhere(fn) { for (const id of Object.keys(db.media)) if (fn(db.media[id], id)) dropMedia(id); }
function sweepMedia() { const now = Date.now(); dropMediaWhere(m => m.exp <= now); }
setInterval(sweepMedia, 10 * 60e3).unref();
sweepMedia();
function authHttp(req) {
  const code = String(req.headers['x-code'] || ''), token = String(req.headers['x-token'] || '');
  const u = CODE_RE.test(code) && TOKEN_RE.test(token) ? db.users[code] : null;
  return tokenOk(u, token) ? code : null;
}
function corsH(req) {
  const o = req.headers.origin;
  if (ORIGINS.length && o && !ORIGINS.includes(o)) return null;
  return { 'Access-Control-Allow-Origin': ORIGINS.length && o ? o : '*', 'Access-Control-Allow-Headers': 'X-Code, X-Token, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
}
function gxPublic(ws, me, k, p) {
  if (k === 'pub') {
    if (!(db.users[me] || {}).handle) return fail(ws, 'gx', 'nohandle');
    if (!rate('pub:' + me, PUB.perHour, 3600e3)) return fail(ws, 'gx', 'busy');
    if (pubOf(me, p.id)) return;
    db.pubs.push({ id: p.id, by: me, ts: Date.now(), text: p.text, m: p.m || null, r: {}, c: [] });
    prunePubs(); persist();
  } else if (k === 'del') {
    const mine = db.pubs.filter(x => x.by === me && (p.all || x.id === p.pid));
    for (const x of mine) if (x.m) dropMedia(x.m.id);
    db.pubs = db.pubs.filter(x => !mine.includes(x)); persist();
  } else if (k === 'react' || k === 'cmt') {
    const x = pubOf(p.o, k === 'react' ? p.pid : p.pid);
    if (!x || blockedEither(me, x.by)) return fail(ws, 'gx', 'invalid');
    if (k === 'react') { if (p.e) x.r[me] = p.e; else delete x.r[me]; }
    else {
      if (x.c.some(c => c.id === p.id)) return;
      if (!rate('pcmt:' + me, 30, 3600e3)) return fail(ws, 'gx', 'busy');
      x.c.push({ id: p.id, from: me, text: p.text, ts: Date.now() }); x.c = x.c.slice(-PUB.cmts);
    }
    persist(); noteGx(me, k, p, x.by);
  } else return fail(ws, 'gx', 'invalid');
}
/* ---------- Cuentas con correo y contraseña ----------
   El correo es solo el identificador para volver a entrar (no se verifica ni se envía nada).
   La contraseña se guarda con scrypt y sal propia; nunca viaja a otros usuarios. Entrar desde otro
   dispositivo añade una clave nueva a la misma persona (máx. 8 dispositivos). */
const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]{1,200}\.[^\s@<>.]{2,24}$/;
const scryptP = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))));
const normEmail = e => String(e || '').trim().toLowerCase();
function readJson(req, cb) {
  const chunks = []; let size = 0, dead = false;
  req.on('data', c => { size += c.length; if (size > 4096) { dead = true; req.destroy(); return; } chunks.push(c); });
  req.on('end', () => { if (dead) return; try { cb(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch { cb(null); } });
}
function onAuth(req, res, url, headers) {
  const cors = corsH(req);
  if (!cors) { res.writeHead(403, headers); return res.end(); }
  const H = Object.assign({}, headers, cors, { 'Cache-Control': 'no-store' });
  const j = (code, o) => { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json' }, H)); res.end(JSON.stringify(o)); };
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  if (req.method !== 'POST') return j(405, { err: 'method' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const which = url.pathname.slice('/auth/'.length);
  if (which !== 'signup' && which !== 'login') return j(404, { err: 'none' });
  readJson(req, async b => {
    try {
      if (!b || typeof b !== 'object') return j(400, { err: 'format' });
      const email = normEmail(b.email), pw = typeof b.password === 'string' ? b.password : '';
      if (!EMAIL_RE.test(email) || email.length > 120) return j(400, { err: 'email' });
      if (which === 'signup') {
        if (!rate('signup:' + ip, 10, 3600e3)) return j(429, { err: 'busy' });
        if (pw.length < 8 || pw.length > 100) return j(400, { err: 'pass' });
        const code = String(b.code || ''), token = String(b.token || ''), name = cleanName(b.name);
        if (!CODE_RE.test(code) || !TOKEN_RE.test(token)) return j(400, { err: 'format' });
        if (!name) return j(400, { err: 'name' });
        if (db.accounts[email]) return j(409, { err: 'exists' });
        let u = db.users[code];
        if (u && (!tokenOk(u, token) || u.email)) return j(409, { err: 'taken' });   // ese perfil ya es de otra persona o ya tiene cuenta
        const salt = crypto.randomBytes(16).toString('hex'), pwh = (await scryptP(pw, salt)).toString('hex');
        if (db.accounts[email]) return j(409, { err: 'exists' });
        if (!u) { u = db.users[code] = { name, hash: sha(token), created: Date.now() }; friendsOf(code); }
        else if (name !== u.name) { u.name = name; for (const f of friendsOf(code)) emit(f, { t: 'fname', code, name }); }
        u.email = email;
        db.accounts[email] = { code, salt, pw: pwh, ts: Date.now() };
        persist();
        return j(200, { ok: true, code, name: u.name });
      }
      // login
      if (!rate('login:' + ip, 30, 600e3) || !rate('loginm:' + email, 10, 600e3)) return j(429, { err: 'busy' });
      const token = String(b.token || '');
      if (!TOKEN_RE.test(token)) return j(400, { err: 'format' });
      const acc = db.accounts[email];
      const salt = acc ? acc.salt : '00'.repeat(16);
      const got = await scryptP(pw.slice(0, 100), salt);           // siempre se calcula: no se nota si el correo existe
      if (!acc || !same(acc.pw, got.toString('hex'))) return j(401, { err: 'bad' });
      const u = db.users[acc.code];
      if (!u) return j(401, { err: 'bad' });
      if (!tokenOk(u, token)) { u.alts = (u.alts || []).concat(sha(token)).slice(-7); persist(); }   // este dispositivo pasa a ser de confianza
      return j(200, { ok: true, code: acc.code, name: u.name, handle: u.handle || '', priv: u.priv !== false });
    } catch { return j(500, { err: 'server' }); }
  });
}
function onMedia(req, res, url, headers) {
  const cors = corsH(req);
  if (!cors) { res.writeHead(403, headers); return res.end(); }
  const H = Object.assign({}, headers, cors);
  const j = (code, o) => { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json' }, H)); res.end(JSON.stringify(o)); };
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  if (req.method === 'GET') {
    const id = url.pathname.slice('/media/'.length), m = MEDIA_RE.test(id) ? db.media[id] : null;
    if (!m || m.exp <= Date.now()) return j(404, { err: 'gone' });
    const MH = Object.assign({ 'Content-Type': m.mime, 'Content-Length': m.size, 'Cache-Control': 'private, max-age=3600', 'Cross-Origin-Resource-Policy': 'cross-origin', 'Content-Disposition': 'inline' }, H);
    if (REMOTE) {
      mediaGet(id).then(b => { if (!b) return j(404, { err: 'gone' }); res.writeHead(200, Object.assign(MH, { 'Content-Length': b.length })); res.end(b); }).catch(() => j(502, { err: 'storage' }));
      return;
    }
    res.writeHead(200, MH);
    return fs.createReadStream(path.join(MEDIA_DIR, id)).on('error', () => res.destroy()).pipe(res);
  }
  if (req.method !== 'POST') return j(405, { err: 'method' });
  const me = authHttp(req);
  if (!me) return j(401, { err: 'auth' });
  if (!rate('media:' + me, 40, 3600e3)) return j(429, { err: 'busy' });
  const ttl = url.searchParams.get('ttl') === 'story' ? 'story' : 'post';
  const ref = txt(url.searchParams.get('ref'), 40);
  const mine = Object.values(db.media).filter(x => x.by === me);
  const declared = Number(req.headers['content-length']) || 0;
  if (declared > MEDIA.maxVid) return j(413, { err: 'big' });
  const chunks = []; let size = 0, dead = false;
  req.on('data', c => {
    size += c.length;
    if (size > MEDIA.maxVid) { dead = true; j(413, { err: 'big' }); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', () => {
    if (dead) return;
    const buf = Buffer.concat(chunks), t = sniff(buf);
    if (!t) return j(415, { err: 'type' });
    if (t.k === 'img' && buf.length > MEDIA.maxImg) return j(413, { err: 'big' });
    if (mine.length >= MEDIA.perUserCount || mine.reduce((a, x) => a + x.size, 0) + buf.length > MEDIA.perUserBytes) return j(507, { err: 'quota' });
    const id = crypto.randomBytes(16).toString('hex');
    mediaPut(id, buf, t.mime).then(() => {
      db.media[id] = { by: me, k: t.k, mime: t.mime, size: buf.length, ref: ref || '', exp: Date.now() + (ttl === 'story' ? MEDIA.storyMs : MEDIA.postMs) };
      persist();
      j(200, { id, k: t.k, mime: t.mime });
    }).catch(() => j(500, { err: 'disk' }));
  });
  req.on('error', () => {});
}

/* ---------- HTTP + enrutado de WebSocket ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
  if (url.pathname === '/health') {
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, headers));
    return res.end(JSON.stringify({ app: 'gymcrew', ok: true, users: Object.keys(db.users).length, online: online.size }));
  }
  if (url.pathname.startsWith('/auth/')) return onAuth(req, res, url, headers);
  if (url.pathname === '/media' || url.pathname.startsWith('/media/')) return onMedia(req, res, url, headers);
  if (!STATIC_DIR || req.method !== 'GET') { res.writeHead(404, headers); return res.end('No encontrado'); }
  let name = decodeURIComponent(url.pathname).slice(1) || 'index.html';
  const ext = path.extname(name).toLowerCase();
  // Solo ficheros sueltos de la carpeta de la app, nunca subcarpetas (server/, data/...)
  if (name.includes('/') || name.includes('\\') || name.startsWith('.') || !MIME[ext] || name === 'package.json') { res.writeHead(404, headers); return res.end('No encontrado'); }
  fs.readFile(path.join(STATIC_DIR, name), (err, buf) => {
    if (err) { res.writeHead(404, headers); return res.end('No encontrado'); }
    res.writeHead(200, Object.assign({ 'Content-Type': MIME[ext], 'Cache-Control': 'no-cache' }, headers));
    res.end(buf);
  });
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
const conns = new Map();
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://x');
  const origin = req.headers.origin;
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (ORIGINS.length && origin && !ORIGINS.includes(origin)) { socket.destroy(); return; }
  if ((conns.get(ip) || 0) >= LIM.perIp) { socket.destroy(); return; }
  const mode = url.pathname === '/ws' ? 'app' : null;
  if (!mode) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => {
    conns.set(ip, (conns.get(ip) || 0) + 1);
    ws.on('close', () => { const n = (conns.get(ip) || 1) - 1; if (n) conns.set(ip, n); else conns.delete(ip); });
    ws.on('error', () => {});
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    onApp(ws, ip);
  });
});
// Limpia conexiones muertas (móvil que pierde la cobertura sin cerrar)
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch { /* ya cerrada */ } } }, 30e3).unref();

if (require.main === module) {
  (async () => {
    let where = DATA_FILE;
    if (REMOTE) {
      // Si no se puede leer la base remota NO arrancamos: así nunca sobrescribimos datos reales con una base vacía.
      try { where = 'Supabase (' + await loadRemote() + ')'; } catch (e) { console.error('No se pudo cargar la base:', e.message); process.exit(1); }
      sweepMedia();
      // Una lectura al día evita que Supabase pause el proyecto por inactividad.
      setInterval(() => { sb('/rest/v1/gc_kv?key=eq.db&select=key').catch(() => {}); }, 12 * 3600e3).unref();
    }
    server.listen(PORT, HOST, () => console.log(`GymCrew server en http://${HOST}:${PORT} · datos en ${where}`));
  })();
}
module.exports = { server, db, flush };
