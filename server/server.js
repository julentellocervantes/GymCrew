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
  if (!db.media || typeof db.media !== 'object') db.media = {};
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
let db = { users: {}, friends: {}, reqs: [], groups: {}, inbox: {}, seq: {}, blocks: {}, reports: [], media: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))); } catch { /* base nueva */ }
if (!db.media || typeof db.media !== 'object') db.media = {};
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
const cleanName = s => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 24);
const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
const online = new Map();       // código -> Set<ws>
const nameOf = c => (db.users[c] || {}).name || 'Alguien';
const namesOf = list => Object.fromEntries(list.map(c => [c, nameOf(c)]));
const friendsOf = c => db.friends[c] || (db.friends[c] = []);
const areFriends = (a, b) => friendsOf(a).includes(b);

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
    me: { code, name: nameOf(code) },
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
  },
  accept(ws, m) {
    const me = ws.code, from = String(m.from || '');
    const i = db.reqs.findIndex(r => r.from === from && r.to === me);
    if (i < 0) return fail(ws, 'accept', 'none');
    db.reqs.splice(i, 1);
    if (!areFriends(me, from)) { friendsOf(me).push(from); friendsOf(from).push(me); }
    persist();
    emit(me, { t: 'accepted', code: from, name: nameOf(from), online: online.has(from) });
    queue(from, { t: 'accepted', code: me, name: nameOf(me), online: online.has(me) });
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
    persist();
    queue(c, { t: 'unfriended', code: me });
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
    if (m.gid !== undefined) {
      const g = db.groups[String(m.gid)];
      if (!g || !g.members.includes(me)) return fail(ws, 'gx', 'invalid');
      if (k === 'gset' && g.by !== me) return fail(ws, 'gx', 'invalid');
      for (const c of g.members) if (c !== me) queue(c, Object.assign({ gid: m.gid }, out));
    } else if (m.to === 'friends') {
      if (!['post', 'del', 'cmt', 'pub', 'story'].includes(k)) return fail(ws, 'gx', 'invalid');
      for (const c of friendsOf(me)) queue(c, out);
    } else {
      const to = String(m.to || '');
      if (!areFriends(me, to)) return fail(ws, 'gx', 'invalid');
      queue(to, out);
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
    persist();
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
      } else if (!same(u.hash, sha(token))) {
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
  return u && same(u.hash, sha(token)) ? code : null;
}
function corsH(req) {
  const o = req.headers.origin;
  if (ORIGINS.length && o && !ORIGINS.includes(o)) return null;
  return { 'Access-Control-Allow-Origin': ORIGINS.length && o ? o : '*', 'Access-Control-Allow-Headers': 'X-Code, X-Token, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
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
