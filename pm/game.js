/* Number Ten: engine and interface. */
'use strict';

/* ---------- utilities ---------- */
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const chance = p => Math.random() < p;
const pick = a => a[Math.floor(Math.random() * a.length)];
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
const f2 = v => (Math.round(v * 100) / 100).toFixed(2);
const f0 = v => Math.round(v).toLocaleString('en-GB');
const bn = v => (v < 0 ? '−' : '') + '£' + (Math.abs(v) >= 1000 ? (Math.abs(v) / 1000).toFixed(2) + 'tn' : f1(Math.abs(v)) + 'bn');
const signed = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(d);

/* ---------- constants ---------- */
const SAVE_KEY = 'numberten.save.v1';
const START = Date.UTC(2027, 6, 5); // Monday 5 July 2027
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const GDP0 = 2900;
const BASE_SPEND = { health: 205, education: 120, welfare: 320, defence: 65, police: 45, transport: 45, housing: 50, environment: 20, other: 210 };
const NEED_GROWTH = { health: .03, education: .005, welfare: .02, defence: .01, police: .012, transport: .01, housing: .015, environment: .02, other: .005 };
const BASE_TAX = { basic: 20, higher: 40, additional: 45, ni: 8, niEr: 15, vat: 20, corp: 25, fuel: 52.95 };
const BASE_Q = { health: 42, education: 55, crime: 47, housing: 36, environment: 50, defence: 50, transport: 47 };
const SVC_NAMES = { health: 'NHS', education: 'Schools', crime: 'Policing and justice', housing: 'Housing', environment: 'Environment', defence: 'Defence', transport: 'Transport' };
const SVC_ROLE = { health: 'health', education: 'education', crime: 'home', housing: 'housing', environment: 'energy', defence: 'defence', transport: 'transport' };
const PARTY_IDEO = { L: -.45, R: .45, LD: -.05, P: .85, G: -.8, S: -.45, NI: .2, O: 0 };
const PARTY_ORDER = ['L','R','LD','P','G','S','NI','O'];
const FACTIONS = { L: ['Left','Soft left','Centrist'], R: ['One Nation','Mainstream','Right'] };
const FACTION_SHIFT = [-.25, 0, .25];
const WINGS = { L: [['Left wing', -.65], ['Soft left', -.42], ['Centrist', -.18]], R: [['Centrist', .18], ['Mainstream', .42], ['Right wing', .65]] };
const POLLSTERS = ['Westbridge', 'Opinia', 'Merrion Research', 'Caldwell Polling', 'Statecraft'];

let S = null;      // game state
let SEATS = [];    // constituency profiles, rebuilt from S.seed
let ui = { tab: 'briefing', budget: null, billFilter: 'All' };

/* ---------- dates and calendar ---------- */
const dateOf = w => new Date(START + w * 7 * 864e5);
function md(w) { const d = dateOf(w); return { m: d.getUTCMonth(), d: d.getUTCDate(), y: d.getUTCFullYear() }; }
function dstr(w) { const { m, d, y } = md(w); return `${d} ${MONTHS[m]} ${y}`; }
function sitting(w) {
  const { m, d } = md(w); const n = m * 100 + d;
  if (n >= 622 && n <= 801) return false;   // summer
  if (n >= 814 && n <= 912) return false;   // conferences
  if (n >= 1119 || n <= 5) return false;    // Christmas
  if (n >= 301 && n <= 314) return false;   // Easter
  if (n >= 424 && n <= 431) return false;   // Whitsun
  return true;
}
const inWindow = (w, m, d0, d1) => { const x = md(w); return x.m === m && x.d >= d0 && x.d <= d1; };

/* ---------- constituencies ---------- */
function buildSeats(seed) {
  const r = mulberry(seed);
  const g = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const used = new Set(); const out = [];
  for (const [reg, n] of REGIONS) {
    for (let i = 0; i < n; i++) {
      let name;
      do { name = PLACE_A[Math.floor(r() * PLACE_A.length)] + PLACE_B[Math.floor(r() * PLACE_B.length)] + SUFFIXES[Math.floor(r() * SUFFIXES.length)]; } while (used.has(name));
      used.add(name);
      const u = g(); // urban (+) vs rural (-)
      const lean = REGION_LEAN[reg]; const m = {};
      m.L = Math.exp(lean.L + .22 * u + .28 * g());
      m.R = Math.exp(lean.R - .22 * u + .28 * g());
      m.LD = Math.exp(lean.LD + .65 * g());
      m.P = Math.exp(lean.P - .12 * u + .32 * g());
      m.G = Math.exp(lean.G + .28 * u + .45 * g());
      m.O = Math.exp(lean.O + .9 * g() - .3);
      out.push({ name, reg, m, ms: Math.exp(.18 * g()) });
    }
  }
  return out;
}
function runSeats(sh, localNoise = 0) {
  const res = { L: 0, R: 0, LD: 0, P: 0, G: 0, S: 0, NI: 0, O: 0 }; const winners = []; const detail = [];
  const scot = sh.S / 8.5;
  for (const seat of SEATS) {
    if (seat.reg === 'Northern Ireland') { res.NI++; winners.push('NI'); detail.push(null); continue; }
    const raw = {}; let tot = 0;
    for (const p of ['L','R','LD','P','G','O']) { raw[p] = Math.max(0.01, sh[p]) * seat.m[p] * (localNoise ? Math.exp(gauss() * localNoise) : 1); tot += raw[p]; }
    let sc = 0; if (seat.reg === 'Scotland') sc = clamp(scot * seat.ms, .02, .7);
    const share = {}; for (const p in raw) share[p] = raw[p] / tot * (1 - sc); if (sc) share.S = sc;
    let best = null, second = null;
    for (const p in share) { if (!best || share[p] > share[best]) { second = best; best = p; } else if (!second || share[p] > share[second]) second = p; }
    res[best]++; winners.push(best); detail.push({ win: best, second, margin: (share[best] - share[second]) * 100, share });
  }
  return { res, winners, detail };
}

/* ---------- new game ---------- */
function newGame(opts) {
  const role = opts.role; const other = role === 'L' ? 'R' : 'L';
  const wing = WINGS[role][opts.wing];
  const seed = Math.floor(Math.random() * 1e9);
  SEATS = buildSeats(seed);
  const parties = {
    L: { name: role === 'L' ? opts.party : 'Commonwealth Party', short: role === 'L' ? opts.short : 'CW' },
    R: { name: role === 'R' ? opts.party : 'Constitutional Party', short: role === 'R' ? opts.short : 'CON' },
    LD: { name: 'Liberal Union', short: 'LU' }, P: { name: 'Albion First', short: 'AF' }, G: { name: 'Green Party', short: 'GRN' },
    S: { name: 'Scottish Independence Party', short: 'SIP' }, NI: { name: 'Northern Ireland parties', short: 'NI' }, O: { name: 'Independents', short: 'IND' }
  };
  const start = { landslide: [40, 22], comfortable: [36, 25], narrow: [33, 29] }[opts.start];
  const sh = { [role]: start[0], [other]: start[1], LD: 12, P: role === 'R' ? 13 : 14, G: role === 'L' ? 7 : 8, S: 2.8, NI: 1.6, O: 1.6 };
  const tot = Object.values(sh).reduce((a, b) => a + b, 0); for (const p in sh) sh[p] = sh[p] * 100 / tot;
  for (const p in parties) parties[p].share = sh[p];

  S = {
    v: 1, seed, week: 0, termStart: 0, electionDue: 260, terms: 1,
    pm: { name: opts.name, role, wing: wing[0], ideo: wing[1], pledges: opts.pledges.slice(), pmqSkill: 0 },
    parties, seats: {}, winners: [], partner: null, govType: 'majority',
    econ: { gdp: GDP0, price: 1, growth: 1.2, gap: -.2, inflation: 2.6, unemp: 4.6, rate: 3.75, gilt: 4.4, effRate: 3.8,
      debt: 2750, credibility: 62, confidence: 50, migration: 350, shock: 0, inflShock: 0, pubPay: 100, revenue: 0, spending: 0, deficit: 0 },
    tax: { ...BASE_TAX }, spend: { ...BASE_SPEND },
    mods: { potential: 0, unemp: 0, infl: 0, migT: 0, conf: 0, revenue: 0, svc: { health: 0, education: 0, crime: 0, housing: 0, environment: 0, defence: 0, transport: 0 } },
    svc: { ...BASE_Q }, groups: {}, goodwill: {},
    approval: 50, unity: 70, unityMod: 0, media: 50, intl: 55, trust: 55, heat: 0, honeymoon: 9, fatigue: 0, oppLeader: 45,
    momentum: { L: 0, R: 0, LD: 0, P: 0, G: 0 },
    people: [], cabinet: {}, bills: [], passed: [], broken: [], flags: { tripleLock: true },
    history: [], news: [], queue: [], cool: {}, campaign: null, gameOver: null, stats: { pmqWins: 0, pmqs: 0, rebellionsLost: 0, budgets: 0, electionsWon: 1 },
    lastChallenge: -99, pollster: 0, lastPoll: null
  };
  for (const g in GROUPS) { S.groups[g] = 50; S.goodwill[g] = 0; }
  // Election that just happened
  const r = runSeats(sh);
  S.seats = r.res; S.winners = r.winners;
  if (S.seats[role] < 326) {
    S.govType = 'minority';
  }
  // People
  const names = new Set(); const mk = (minister) => {
    let n; do { n = pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES); } while (names.has(n)); names.add(n);
    const fac = Math.random() < .3 ? 0 : Math.random() < .64 ? 1 : 2;
    return { id: 'p' + names.size, name: n, comp: clamp(Math.round(4 + Math.random() * 5 + (minister ? 1 : 0)), 1, 10), loyal: clamp(Math.round(4 + Math.random() * 6), 1, 10),
      ambition: clamp(Math.round(2 + Math.random() * 8), 1, 10), profile: clamp(Math.round(2 + Math.random() * 7 + (minister ? 1 : 0)), 1, 10), fac, grudge: 0, seat: pick(SEATS.filter(s => s.reg !== 'Northern Ireland')).name };
  };
  for (const role2 of ROLES) { const p = mk(true); S.people.push(p); S.cabinet[role2.id] = p.id; }
  for (let i = 0; i < 18; i++) S.people.push(mk(false));
  // warm up groups to start values
  for (let i = 0; i < 40; i++) stepGroups(true);
  S.approval = nationalApproval();
  computeShares(true);
  pushHistory();
  news(`${S.pm.name} enters Downing Street. The ${S.parties[role].name} won ${S.seats[role]} seats${S.seats[role] >= 326 ? `, a majority of ${majority()}` : ', short of a majority'}.`, 'good');
  if (S.govType === 'minority') queue({ type: 'hung', data: {} });
  queue({ type: 'welcome', data: {} });
  save();
}

/* ---------- helpers used by events (G) ---------- */
const minister = role => S.people.find(p => p.id === S.cabinet[role]);
const comp = role => { const m = minister(role); return m ? m.comp : 5; };
const govSeats = () => S.seats[S.pm.role] + (S.partner ? S.seats[S.partner] : 0);
const majority = () => govSeats() * 2 - 650;
const mainOpp = () => (S.pm.role === 'L' ? 'R' : 'L');
const playerParty = () => S.parties[S.pm.role];
function news(text, tone = 'neutral') { S.news.unshift({ w: S.week, text, tone }); if (S.news.length > 150) S.news.length = 150; }
function queue(item) { S.queue.push(item); }

function spendingBreakdown() {
  const e = S.econ, sp = {};
  for (const d in S.spend) sp[d] = S.spend[d];
  sp.welfare += (e.unemp - 4.5) * 12 * e.price;
  sp.interest = e.debt * e.effRate / 100;
  sp.total = Object.values(sp).reduce((a, b) => a + b, 0);
  return sp;
}
function revenueBreakdown(t = S.tax, e = S.econ) {
  const sc = e.gdp / GDP0, emp = 1 - (e.unemp - 4.5) * .015, real = sc / e.price;
  const r = {
    inc: 300 * sc * emp * (.58 * t.basic / 20 + .30 * (t.higher / 40) * (1 - .010 * (t.higher - 40)) + .12 * (t.additional / 45) * (1 - .025 * (t.additional - 45))),
    ni: 60 * sc * emp * (t.ni / 8) * (1 - .005 * (t.ni - 8)),
    niEr: 125 * sc * emp * (t.niEr / 15) * (1 - .01 * (t.niEr - 15)),
    vat: 175 * sc * (t.vat / 20) * (1 - .012 * (t.vat - 20)),
    corp: 95 * sc * (t.corp / 25) * (1 - .02 * (t.corp - 25)) * (1 + (e.growth - 1.5) * .03),
    fuel: 25 * real * (t.fuel / 52.95) * (1 - .004 * (t.fuel - 52.95)),
    other: 320 * sc + S.mods.revenue * e.price
  };
  r.total = Object.values(r).reduce((a, b) => a + b, 0);
  return r;
}
const waitList = () => clamp(7.4 - (S.svc.health - 42) * .1, 2.5, 12);
const aePct = () => Math.round(clamp(72 + (S.svc.health - 42) * .55, 45, 96));
const homes = () => clamp(200 + (S.svc.housing - 36) * 4.2 - (S.econ.rate - 3.75) * 15, 90, 420);
const chargeRate = () => clamp(7 + (S.svc.crime - 47) * .16, 2, 20);
const gcse = () => clamp(65 + (S.svc.education - 55) * .2, 50, 80);
const emissions = () => clamp(54 + (S.svc.environment - 50) * .35 + S.week / 52 * 1.2, 40, 90);
const punctuality = () => clamp(68 + (S.svc.transport - 47) * .4, 40, 95);
const taxBurden = () => S.econ.revenue / S.econ.gdp * 100;

const G = {
  inMonths: ms => ms.includes(md(S.week).m),
  ae: aePct, waitList, homes, chargeRate, taxBurden, govSeats, mainOpp,
  oneOff: x => { S.econ.debt += x; },
  spend: (d, x) => { S.spend[d] += x * S.econ.price; },
  svc: (k, x) => { S.svc[k] = clamp(S.svc[k] + x, 0, 100); },
  gw: o => { for (const k in o) { if (k === 'all') for (const g in GROUPS) S.goodwill[g] += o[k]; else if (S.goodwill[k] !== undefined) S.goodwill[k] += o[k]; } },
  stat: (k, x) => {
    if (k === 'credibility' || k === 'confidence') S.econ[k] = clamp(S.econ[k] + x, 0, 100);
    else if (k === 'heat') S.heat = Math.max(0, S.heat + x);
    else S[k] = clamp(S[k] + x, 0, 100);
  },
  pay: x => { S.econ.pubPay += x; },
  unity: x => { S.unityMod += x; S.unity = clamp(S.unity + x, 0, 100); },
  shock: (g, i) => { S.econ.shock += g; S.econ.inflShock += i; },
  migT: x => { S.mods.migT += x; },
  conf: x => { S.econ.confidence = clamp(S.econ.confidence + x, 0, 100); },
  potential: x => { S.mods.potential += x; },
  party: (p, x) => { if (S.momentum[p] !== undefined) S.momentum[p] += x; },
  rival: () => {
    const c = S.people.filter(p => p.ambition >= 7 && p.loyal <= 5 && p.profile >= 5);
    c.sort((a, b) => (b.ambition + b.profile - b.loyal) - (a.ambition + a.profile - a.loyal));
    return c[0] || null;
  },
  sack: (id, grudge) => { for (const r in S.cabinet) if (S.cabinet[r] === id) { const repl = S.people.filter(p => !isMinister(p.id) && p.id !== id).sort((a, b) => b.comp - a.comp)[0]; S.cabinet[r] = repl ? repl.id : null; } const p = S.people.find(x => x.id === id); if (p && grudge) { p.grudge += 3; p.loyal = clamp(p.loyal - 3, 1, 10); } },
  loseSeat: to => {
    const idx = S.winners.findIndex(w => w === S.pm.role);
    if (idx >= 0) S.winners[idx] = to;
    S.seats[S.pm.role]--; S.seats[to] = (S.seats[to] || 0) + 1;
    checkGovType();
  }
};
const isMinister = id => Object.values(S.cabinet).includes(id);

function checkGovType() {
  if (S.partner) S.govType = govSeats() >= 326 ? 'coalition' : 'minority';
  else S.govType = S.seats[S.pm.role] >= 326 ? 'majority' : 'minority';
}

/* ---------- issues and approval ---------- */
function issues() {
  const e = S.econ, t = S.tax, s = S.svc, yrs = S.week / 52;
  return {
    economy: (e.growth - 1.5) * .7 - (e.unemp - 4.5) * .4,
    jobs: -(e.unemp - 4.5) * .8,
    col: -(e.inflation - 2) * .5 - ((t.fuel - 52.95) / 10) * .2,
    mortgage: -(e.rate - 3.75) * .6,
    pension: (S.spend.welfare / (BASE_SPEND.welfare * e.price * Math.pow(1.02, yrs)) - 1) * 8 + (S.flags.tripleLock ? .2 : -.5),
    pay: (e.pubPay - 100) / 3,
    health: (s.health - 50) / 20, education: (s.education - 50) / 20, crime: (s.crime - 50) / 20,
    housing: (s.housing - 50) / 20, environment: (s.environment - 50) / 20, defence: (s.defence - 50) / 20, transport: (s.transport - 50) / 20,
    immigration: -(e.migration - 250) / 150,
    confidence: (e.confidence - 50) / 20
  };
}
function taxScore(g, t = S.tax) {
  const d = { b: t.basic - 20, h: t.higher - 40, a: t.additional - 45, ni: t.ni - 8, er: t.niEr - 15, v: t.vat - 20, c: t.corp - 25, f: (t.fuel - 52.95) / 5 };
  switch (g) {
    case 'pensioners': return -(d.b * .15 + d.v * .2 + d.f * .08);
    case 'working': return -(d.b * .3 + d.ni * .3 + d.v * .25 + d.f * .15);
    case 'middle': return -(d.b * .2 + d.h * .15 + d.ni * .2 + d.v * .15 + d.a * .03 + d.f * .05);
    case 'young': return -(d.b * .2 + d.ni * .25 + d.v * .15);
    case 'public': return -(d.b * .25 + d.ni * .25 + d.v * .15);
    case 'business': return -(d.c * .25 + d.er * .3 + d.v * .1 + d.a * .04 + d.h * .04);
  }
  return 0;
}
function groupTarget(g, I) {
  const def = GROUPS[g]; let sc = 0;
  for (const k in def.w) sc += def.w[k] * (k === 'tax' ? taxScore(g) : I[k]);
  const fit = 4 - Math.abs(def.lean - S.pm.ideo) * 10;
  return clamp(43 + 25 * sc + fit + S.goodwill[g] + S.honeymoon + (S.media - 50) * .12 + (S.trust - 50) * .12 - S.heat - S.fatigue + (S.intl - 55) * .04, 3, 97);
}
function stepGroups(warm) {
  const I = issues();
  for (const g in GROUPS) {
    const t = groupTarget(g, I);
    S.groups[g] += (t - S.groups[g]) * (warm ? .25 : .08);
  }
}
function nationalApproval() { let a = 0; for (const g in GROUPS) a += GROUPS[g].pop * S.groups[g]; return a; }

/* ---------- vote shares ---------- */
function computeShares(instant) {
  const me = S.pm.role, opp = mainOpp(), a = S.approval, I = issues();
  const camp = S.campaign ? S.campaign.boost : 0;
  let mine = clamp(10 + .55 * a + camp, 5, 60);
  const fixed = { S: 2.8 + (S.momentum.S || 0), NI: 1.6, O: 1.6 + Math.max(0, 40 - a) * .03 };
  const rest = 100 - mine - fixed.S - fixed.NI - fixed.O;
  const ga = S.groups;
  const w = {};
  w[opp] = 30 * (1 + (S.oppLeader - 50) / 90) * (1 + S.momentum[opp] * .05);
  w.LD = 13 * (1 + (50 - ga.middle) / 90) * (1 + S.momentum.LD * .05) * (S.partner === 'LD' ? .8 : 1);
  w.P = 13 * (1 - I.immigration * .25 + (50 - ga.working) / 90 + (me === 'R' ? .25 : 0)) * (1 + S.momentum.P * .05);
  w.G = 8 * (1 + (50 - ga.young) / 70 - I.environment * .25 + (me === 'L' ? .25 : 0)) * (1 + S.momentum.G * .05);
  let tw = 0; for (const p in w) { w[p] = Math.max(.5, w[p]); tw += w[p]; }
  const target = { [me]: mine, ...fixed };
  for (const p in w) target[p] = rest * w[p] / tw;
  for (const p of PARTY_ORDER) {
    const cur = S.parties[p].share;
    S.parties[p].share = instant ? target[p] : cur + (target[p] - cur) * .15;
  }
  for (const p in S.momentum) S.momentum[p] *= .985;
}
function currentShares() { const o = {}; for (const p of PARTY_ORDER) o[p] = S.parties[p].share; return o; }

/* ---------- weekly simulation ---------- */
function stepEconomy() {
  const e = S.econ, m = S.mods, dt = 1 / 52, t = S.tax;
  const rv = revenueBreakdown(), sp = spendingBreakdown();
  e.revenue = rv.total; e.spending = sp.total; e.deficit = sp.total - rv.total;
  e.debt += e.deficit * dt;
  const defPct = e.deficit / e.gdp * 100, debtPct = e.debt / e.gdp * 100;
  const pot = 1.3 + m.potential + (e.migration - 300) / 1000 * .6 + (e.confidence - 50) / 100 + (S.svc.transport - 50) / 250 + (S.svc.education - 55) / 400 - (S.svc.health < 35 ? .1 : 0);
  e.pot = pot;
  const impulse = clamp(defPct - 3, -4, 6) * .3;
  const drag = (e.rate - 3.25) * .35;
  e.shock *= .965;
  const target = pot + impulse - drag - e.gap * .35 + e.shock;
  e.growth += (target - e.growth) * .1 + gauss() * .07;
  e.gap = clamp(e.gap + (e.growth - pot) * dt, -6, 6);
  e.inflShock *= .96;
  const infT = 2 + e.gap * .45 + e.inflShock + m.infl + Math.max(0, 55 - e.credibility) / 60 + (e.pubPay - 100) * .03;
  e.inflation = clamp(e.inflation + (infT - e.inflation) * .05 + gauss() * .04, -2, 20);
  const unT = 4.4 - e.gap * .45 + m.unemp + (t.niEr - 15) * .05;
  e.unemp = clamp(e.unemp + (unT - e.unemp) * .03 + gauss() * .01, 2, 15);
  e.gdp *= 1 + (e.growth + e.inflation) / 100 * dt;
  e.price *= 1 + e.inflation / 100 * dt;
  e.pubPay *= 1 - e.inflation / 100 * dt * .6; // pay settlements lag prices
  const spread = Math.max(0, 55 - e.credibility) / 22;
  e.gilt = e.rate * .55 + 2.2 + spread + Math.max(0, debtPct - 100) * .02;
  e.effRate += (e.gilt - e.effRate) * .004;
  const credT = 72 - Math.max(0, defPct - 3) * 7 - Math.max(0, debtPct - 95) * .5 + (comp('chancellor') - 5) * 2 - Math.max(0, e.inflation - 4) * 2;
  e.credibility = clamp(e.credibility + (credT - e.credibility) * .03, 0, 100);
  const confT = 55 - (t.corp - 25) * 1.5 - (t.niEr - 15) * 1.2 + m.conf + (e.growth - 1.5) * 4 + (comp('business') - 5) - Math.max(0, 50 - e.credibility) * .2;
  e.confidence = clamp(e.confidence + (confT - e.confidence) * .04, 0, 100);
  const migT = 300 + m.migT + (e.unemp < 4 ? 30 : 0) + (comp('home') - 5) * -3;
  e.migration = clamp(e.migration + (migT - e.migration) * .02, 0, 1200);

  // Bank of England MPC, roughly every six weeks
  if (S.week % 6 === 3) {
    const taylor = 3.25 + 1.5 * (e.inflation - 2) + .5 * e.gap;
    const diff = taylor - e.rate;
    if (Math.abs(diff) > .2) {
      const mv = clamp(Math.round(diff / .25) * .25, -.5, .5);
      if (mv !== 0) {
        e.rate = clamp(e.rate + mv, .1, 12);
        news(`Bank of England ${mv > 0 ? 'raises' : 'cuts'} Bank Rate to ${f2(e.rate)}%.`, mv > 0 ? 'bad' : 'good');
      }
    } else if (chance(.3)) news(`Bank of England holds Bank Rate at ${f2(e.rate)}%.`);
  }
}
function stepServices() {
  const e = S.econ, yrs = S.week / 52;
  for (const d in DEPTS) {
    const k = DEPTS[d].svc; if (!k) continue;
    const need = BASE_SPEND[d] * Math.pow(1 + NEED_GROWTH[d], yrs) * e.price;
    const ratio = S.spend[d] / need;
    let tgt = BASE_Q[k] + 110 * (ratio - 1) + (comp(SVC_ROLE[k]) - 5) * 1.5 + S.mods.svc[k];
    if (k === 'housing') tgt -= (e.migration - 300) / 30 + (e.rate - 3.75) * 2;
    if (k === 'crime') tgt -= (e.unemp - 4.5) * 1.5;
    if (k === 'health' || k === 'education') tgt += (e.pubPay - 100) * .8;
    S.svc[k] = clamp(S.svc[k] + (clamp(tgt, 0, 100) - S.svc[k]) * .012, 0, 100);
  }
}
function stepPolitics() {
  S.honeymoon *= .985; S.fatigue += 2.4 / 52; S.heat *= .95;
  for (const g in S.goodwill) S.goodwill[g] *= .985;
  S.media += (50 - S.media) * .01; S.intl += (55 + (comp('foreign') - 5) * 2 - S.intl) * .01;
  S.oppLeader = clamp(S.oppLeader + gauss() * .6 + (45 - S.oppLeader) * .01, 10, 85);
  stepGroups(false);
  S.approval = nationalApproval();
  computeShares(false);
  // unity
  const cab = Object.values(S.cabinet).map(id => S.people.find(p => p.id === id)).filter(Boolean);
  const facShare = [0, 0, 0]; cab.forEach(p => facShare[p.fac]++);
  const imbalance = Math.abs(facShare[0] / cab.length - .3) + Math.abs(facShare[1] / cab.length - .45) + Math.abs(facShare[2] / cab.length - .25);
  const grudges = S.people.filter(p => !isMinister(p.id) && p.grudge > 0).reduce((a, p) => a + p.grudge * p.profile / 10, 0);
  const uT = 56 + (S.approval - 40) * .55 - imbalance * 18 + S.unityMod + (comp('whip') - 5) * 1.2 - Math.max(0, majority() - 100) / 20 + S.honeymoon * .6 - grudges * .6 - (S.partner ? 4 : 0);
  S.unityMod *= .97;
  S.people.forEach(p => { p.grudge *= .995; });
  S.unity = clamp(S.unity + (uT - S.unity) * .05, 0, 100);
}
function pushHistory() {
  const sh = currentShares();
  S.history.push({ w: S.week, a: +S.approval.toFixed(1), u: +S.unity.toFixed(1), g: +S.econ.growth.toFixed(2), i: +S.econ.inflation.toFixed(2), un: +S.econ.unemp.toFixed(2), r: S.econ.rate, d: +(S.econ.debt / S.econ.gdp * 100).toFixed(1), sh: Object.fromEntries(Object.entries(sh).map(([k, v]) => [k, +v.toFixed(1)])) });
  if (S.history.length > 600) S.history.shift();
}

function advance() {
  if (!S || S.gameOver || S.queue.length) return;
  S.week++;
  const w = S.week, { m, d } = md(w);
  stepEconomy(); stepServices(); stepPolitics();
  const sit = sitting(w);
  if (S.campaign) { stepCampaign(); pushHistory(); save(); render(); return; }

  // Calendar
  if (m === 3 && d <= 7) aprilUprating();
  if (sit) stepBills();
  if (inWindow(w, 10, 22, 28)) queue({ type: 'budget', data: { kind: 'Autumn Budget' } });
  if (inWindow(w, 2, 8, 14)) springStatement();
  if (inWindow(w, 9, 1, 7)) queue({ type: 'event', data: { id: 'conference' } });
  if (inWindow(w, 4, 1, 7)) localElections();
  if (inWindow(w, 6, 15, 21)) queue({ type: 'event', data: { id: 'payreview' } });
  if (w % 4 === 2) monthlyStats();
  // Random events
  if (chance(.38)) { const ev = pickEvent(); if (ev) { S.cool[ev.id] = w; queue({ type: 'event', data: { id: ev.id } }); } }
  ministerScandals();
  if (chance(.012) && S.week > 8) byElection();
  checkChallenges();
  if (sit && !S.queue.some(q => q.type === 'budget')) queue({ type: 'pmqs', data: pmqTopic() });
  // Polls
  const pol = POLLSTERS[S.pollster++ % POLLSTERS.length];
  const sh = currentShares(); const poll = {}; for (const p of PARTY_ORDER) poll[p] = Math.max(0, sh[p] + gauss() * 1.4);
  S.lastPoll = { pol, poll };
  if (w >= S.electionDue - 6 && !S.campaign) startCampaign(true);
  pushHistory();
  save(); render();
}

function aprilUprating() {
  const up = S.flags.tripleLock ? Math.max(S.econ.inflation, 2.5) : S.econ.inflation;
  S.spend.welfare *= 1 + up / 100;
  news(`New tax year. Pensions and benefits rise ${f1(up)}%${S.flags.tripleLock ? ' under the triple lock' : ''}.`);
}
function springStatement() {
  const fc = forecast(S.tax, S.spend);
  news(`Spring Statement: the OBR forecasts borrowing of ${bn(fc.def[0])} (${f1(fc.defPct[0])}% of GDP) and debt ${fc.debtPct[4] < fc.debtPct[0] ? 'falling' : 'rising'} to ${f1(fc.debtPct[4])}% of GDP in five years.`, fc.debtPct[4] < fc.debtPct[0] ? 'good' : 'bad');
}
function monthlyStats() {
  const e = S.econ; const mo = MONTHS[(md(S.week).m + 10) % 12];
  news(`ONS: the economy is growing at ${f1(e.growth)}% a year. Inflation ${f1(e.inflation)}%, unemployment ${f1(e.unemp)}%.`, e.growth > 1.5 && e.inflation < 3 ? 'good' : e.growth < .5 || e.inflation > 4 ? 'bad' : 'neutral');
  if (chance(.5)) news(`NHS England: ${f1(waitList())} million people are waiting for treatment. ${aePct()}% of A&E patients were seen within four hours in ${mo}.`, S.svc.health > 50 ? 'good' : 'bad');
  else news(`Home Office: net migration is running at ${f0(e.migration)},000 a year.`, e.migration < 250 ? 'good' : 'neutral');
}
function localElections() {
  const a = S.approval; const net = Math.round((a - 40) * 25 + gauss() * 60);
  news(`Local elections: the ${playerParty().name} ${net >= 0 ? 'gains' : 'loses'} ${f0(Math.abs(net))} council seats.`, net >= 0 ? 'good' : 'bad');
  G.unity(net >= 0 ? 3 : clamp(net / 100, -8, 0));
}
function pickEvent() {
  const pool = EVENTS.filter(e => (S.week - (S.cool[e.id] ?? -999)) >= e.cool && e.when(S));
  if (!pool.length) return null;
  let tw = pool.reduce((a, e) => a + e.w, 0), r = Math.random() * tw;
  for (const e of pool) { r -= e.w; if (r <= 0) return e; }
  return pool[pool.length - 1];
}
function ministerScandals() {
  for (const r in S.cabinet) {
    const p = minister(r); if (!p) continue;
    if (chance(.0012 * (11 - p.comp))) { queue({ type: 'scandal', data: { id: p.id, role: r, kind: pick(['expenses', 'an undeclared donation', 'a leaked WhatsApp group', 'a bullying complaint', 'a second job', 'a planning favour for a donor']) } }); return; }
  }
}
function byElection() {
  const seats = S.winners.map((w, i) => w === S.pm.role ? i : -1).filter(i => i >= 0);
  if (!seats.length) return;
  const i = pick(seats); const seat = SEATS[i];
  const sh = currentShares(); sh[S.pm.role] -= 6; sh[mainOpp()] += 2; sh.LD += 2; sh.P += 1; sh.G += 1;
  const save = SEATS; SEATS = [seat]; const r = runSeats(sh, .15); SEATS = save;
  const det = r.detail[0]; const win = det.win;
  queue({ type: 'info', data: { title: `By-election in ${seat.name}`, kicker: 'By-election result', body: win === S.pm.role
    ? `You hold ${seat.name} with a majority of ${f1(det.margin)} points. It's a relief, though the swing against you was clear.`
    : `${S.parties[win].name} takes ${seat.name} from you on a ${f1(det.margin)}-point margin. Your majority shrinks by two.` } });
  if (win !== S.pm.role) { G.loseSeat(win); G.unity(-3); news(`${S.parties[win].name} gain ${seat.name} from the ${playerParty().name} in a by-election.`, 'bad'); }
  else { G.unity(1); news(`The ${playerParty().name} holds ${seat.name} in a by-election.`, 'good'); }
}
function checkChallenges() {
  if (S.week - S.lastChallenge > 26 && ((S.unity < 32 && S.approval < 33) || S.unity < 18) && chance(.12)) {
    S.lastChallenge = S.week;
    const c = G.rival() || S.people.filter(p => !isMinister(p.id)).sort((a, b) => b.profile - a.profile)[0];
    queue({ type: 'challenge', data: { id: c.id } });
  }
  if (S.govType === 'minority' && S.approval < 38 && chance(.04) && S.week > 10) queue({ type: 'confidence', data: {} });
}

/* ---------- PMQs ---------- */
function pmqTopic() {
  const I = issues(); const cand = [];
  for (const t of PMQ_TOPICS) {
    let v = t.k === 'tax' ? -(taxBurden() - 36) / 2 : t.k === 'scandal' ? (S.heat > 2 ? -2 : 1) : I[t.k];
    cand.push({ k: t.k, v: v + gauss() * .3 });
  }
  cand.sort((a, b) => a.v - b.v);
  return { k: cand[0].k, v: cand[0].v };
}
function resolvePmqs(data, style) {
  const skill = S.pm.pmqSkill; const v = data.v; let p, gain, lose;
  if (style === 'facts') { p = clamp(.5 + v * .25 + skill * .01, .1, .9); gain = 2; lose = -2; }
  else if (style === 'attack') { p = clamp(.55 + (50 - S.oppLeader) / 100 + skill * .01, .2, .85); gain = 2; lose = -1.5; }
  else if (style === 'announce') { p = clamp(.75 - (S.flags.announceCount || 0) * .05, .3, .8); gain = 1; lose = -1; S.flags.announceCount = (S.flags.announceCount || 0) + 1; G.oneOff(.2); }
  else { p = .4 + skill * .01; gain = 4; lose = -3.5; }
  const won = Math.random() < p; S.stats.pmqs++;
  if (won) { S.stats.pmqWins++; S.pm.pmqSkill = Math.min(20, skill + 1); }
  const x = won ? gain : lose;
  G.stat('media', x); G.unity(x * .4); G.gw({ all: x * .25 });
  const lines = {
    facts: won ? 'You rattle off the figures. The Speaker has to quieten your benches.' : 'The figures you quote are out of date. The opposition leader corrects you, and the sketch writers enjoy it.',
    attack: won ? 'You list the opposition\'s record in office. Your benches roar.' : 'The attack looks like a dodge. "Answer the question!" comes the cry.',
    announce: won ? 'You announce a new review. It makes the evening bulletins.' : 'Commentators note this is your third "new review" this term.',
    joke: won ? 'Your one-liner is the clip of the week. Even the opposition laughs.' : 'The joke falls flat. It trends for the wrong reasons.'
  };
  return { won, text: lines[style] };
}

/* ---------- bills ---------- */
function billById(id) { return BILLS.find(b => b.id === id); }
function whipCount(bill, mode) {
  const gov = S.seats[S.pm.role];
  const dist = Math.abs(bill.ideo - S.pm.ideo);
  let rate = Math.max(0, dist - .25) * .35 + (60 - S.unity) / 250 + (bill.contro || 0) * .04 + Math.max(0, 40 - S.approval) / 300 - (comp('whip') - 5) * .006 + Math.max(0, majority() - 80) / 4000;
  if (mode === 'soft') rate *= .4;
  if (mode === 'confidence') rate *= .25;
  if (mode === 'free') rate = Math.min(.6, dist * .5 + (bill.contro || 0) * .1 + .05);
  rate = clamp(rate, 0, .6);
  const rebels = Math.round(gov * rate);
  let ayes = gov - rebels, noes = Math.round(rebels * .75);
  for (const p of PARTY_ORDER) {
    if (p === S.pm.role) continue;
    let seats = S.seats[p] || 0; if (!seats) continue;
    if (p === 'NI') seats -= 7; // abstentionists
    if (seats <= 0) continue;
    const d = Math.abs(bill.ideo - PARTY_IDEO[p]);
    let f = d < .3 ? .92 : d < .55 ? .45 : d < .8 ? .12 : .02;
    if (p === S.partner) f = clamp(1 - Math.max(0, d - .3) * .8 - (bill.contro || 0) * .05, .3, 1);
    if (mode === 'free') f = clamp(f + .1, 0, 1);
    ayes += Math.round(seats * f); noes += Math.round(seats * (1 - f) * .95);
  }
  return { ayes, noes, rebels };
}
function introduceBill(id, mode) {
  const b = billById(id);
  S.bills.push({ id, mode, stage: 'second', left: 2, k: mode === 'soft' ? .6 : 1, manifesto: S.pm.pledges.includes('bill:' + id) });
  news(`The ${b.name} is introduced in the Commons${mode === 'soft' ? ' in a watered-down form' : mode === 'free' ? ' with a free vote' : mode === 'confidence' ? ' as a matter of confidence' : ''}.`);
}
function stepBills() {
  for (const bl of S.bills.slice()) {
    bl.left--;
    if (bl.left > 0) continue;
    const b = billById(bl.id);
    if (bl.stage === 'second') {
      const wc = whipCount(b, bl.mode);
      const ayes = Math.round(wc.ayes * (1 + gauss() * .02)), noes = Math.round(wc.noes * (1 + gauss() * .02));
      const passed = ayes > noes;
      if (wc.rebels > 15) G.unity(-Math.min(6, wc.rebels / 12));
      queue({ type: 'division', data: { id: bl.id, ayes, noes, rebels: wc.rebels, passed, mode: bl.mode } });
      if (passed) { bl.stage = 'committee'; bl.left = 3 + Math.floor(Math.random() * 3); news(`Commons passes the ${b.name} at second reading: Ayes ${ayes}, Noes ${noes}.`, 'good'); }
      else {
        S.bills = S.bills.filter(x => x !== bl); S.stats.rebellionsLost++;
        news(`Government defeated on the ${b.name}: Ayes ${ayes}, Noes ${noes}.`, 'bad');
        G.stat('media', -4); G.gw({ all: -1 });
        if (bl.mode === 'confidence') queue({ type: 'confidence', data: { forced: true } });
      }
    } else if (bl.stage === 'committee') {
      bl.stage = 'lords'; bl.left = 4 + Math.floor(Math.random() * 4);
    } else if (bl.stage === 'lords') {
      const p = (b.contro || 0) * .22 + (S.govType !== 'majority' ? .1 : 0) - (bl.manifesto ? .25 : 0);
      if (!bl.lordsDone && chance(p)) { bl.lordsDone = true; queue({ type: 'lords', data: { id: bl.id } }); bl.left = 2; }
      else { bl.stage = 'assent'; bl.left = 1; }
    } else if (bl.stage === 'assent') {
      S.bills = S.bills.filter(x => x !== bl);
      S.passed.push(bl.id);
      applyFx(b.fx, bl.k);
      news(`The ${b.name.replace(' Bill', ' Act')} receives Royal Assent.`, 'good');
    }
  }
}
function applyFx(fx, k = 1) {
  if (fx.spend) for (const d in fx.spend) S.spend[d] += fx.spend[d] * k * S.econ.price;
  if (fx.oneOff) S.econ.debt += fx.oneOff * k;
  if (fx.revenue) S.mods.revenue += fx.revenue * k;
  for (const key of ['potential', 'unemp', 'infl', 'migT', 'conf']) if (fx[key]) S.mods[key] += fx[key] * k;
  if (fx.conf) S.econ.confidence = clamp(S.econ.confidence + fx.conf * k * .5, 0, 100);
  if (fx.svc) for (const s in fx.svc) S.mods.svc[s] += fx.svc[s] * k;
  if (fx.groups) { const o = {}; for (const g in fx.groups) o[g] = fx.groups[g] * k; G.gw(o); }
  if (fx.cred) G.stat('credibility', fx.cred * k);
  if (fx.intl) G.stat('intl', fx.intl * k);
  if (fx.media) G.stat('media', fx.media * k);
  if (fx.unity) G.unity(fx.unity * k);
  if (fx.flag === 'noTripleLock') { S.flags.tripleLock = false; breakPledge('triple'); }
  else if (fx.flag === 'prRef') queue({ type: 'event', data: { id: 'referendum' } });
  else if (fx.flag) S.flags[fx.flag] = 1;
}
function breakPledge(id) {
  if (!S.pm.pledges.includes(id) || S.broken.includes(id)) return;
  S.broken.push(id);
  const p = PLEDGES.find(x => x.id === id);
  G.stat('trust', -12); G.stat('media', -5); G.unity(-3);
  news(`Manifesto pledge broken: "${p.name}". Opponents call it a betrayal.`, 'bad');
}

/* ---------- budget and forecasts ---------- */
function forecast(tax, spend) {
  const e = S.econ;
  let gdp = e.gdp, price = e.price, debt = e.debt, eff = e.effRate;
  const out = { def: [], defPct: [], debtPct: [], rev: [], spd: [] };
  const sp0 = Object.values(spend).reduce((a, b) => a + b, 0);
  for (let y = 0; y < 5; y++) {
    const g = (y === 0 ? (e.growth + e.pot) / 2 : e.pot || 1.3);
    const fakeE = { ...e, gdp, price, unemp: 4.5, growth: g };
    const rv = revenueBreakdown(tax, fakeE).total;
    const sp = sp0 * Math.pow(1.02, y) * (price / e.price) / Math.pow(1.02, y) * Math.pow(1.005, y) + debt * eff / 100;
    const def = sp - rv;
    out.rev.push(rv); out.spd.push(sp); out.def.push(def); out.defPct.push(def / gdp * 100);
    debt += def; out.debtPct.push(debt / (gdp * (1 + (g + 2) / 100)) * 100);
    gdp *= 1 + (g + 2) / 100; price *= 1.02; eff += (e.gilt - eff) * .2;
  }
  return out;
}
function openBudget(kind) {
  ui.budget = { kind, tax: { ...S.tax }, spend: { ...S.spend } };
}
function presentBudget() {
  const b = ui.budget; if (!b) return;
  const before = forecast(S.tax, S.spend), after = forecast(b.tax, b.spend);
  const dDef = after.defPct[0] - before.defPct[0];
  // tax pledge checks
  const t0 = S.tax, t1 = b.tax;
  if (t1.basic > t0.basic || t1.higher > t0.higher || t1.additional > t0.additional) breakPledge('no_income_tax');
  if (t1.vat > t0.vat) breakPledge('no_vat');
  if (t1.ni > t0.ni) breakPledge('no_ni');
  // market reaction
  let cred = 0;
  if (dDef > .3) cred -= (dDef - .3) * 6;
  if (dDef < -.4) cred += Math.min(5, -dDef * 3);
  if (after.debtPct[4] > after.debtPct[0] + 1) cred -= 3;
  cred += (comp('chancellor') - 5) * .5;
  G.stat('credibility', cred);
  // VAT and fuel price effects
  S.econ.inflShock += (t1.vat - t0.vat) * .45 + (t1.fuel - t0.fuel) * .02;
  // spending cuts anger public sector
  let cutsHealthEdu = 0;
  for (const d of ['health', 'education', 'police']) cutsHealthEdu += Math.min(0, (b.spend[d] - S.spend[d]) / S.spend[d]);
  if (cutsHealthEdu < -.02) { G.gw({ public: cutsHealthEdu * 120, pensioners: cutsHealthEdu * 40 }); G.unity(cutsHealthEdu * 60); }
  // headline group reaction from tax changes (beyond the ongoing effect)
  for (const g in GROUPS) S.goodwill[g] += (taxScore(g, t1) - taxScore(g, t0)) * 6;
  const kind = b.kind;
  S.tax = { ...t1 }; S.spend = { ...b.spend }; S.stats.budgets++;
  ui.budget = null;
  const verdict = cred <= -4 ? 'Gilt yields jump as markets question the numbers.' : cred >= 2 ? 'Markets welcome a credible plan.' : 'Markets take the statement in their stride.';
  news(`${kind}: borrowing forecast ${bn(after.def[0])} (${f1(after.defPct[0])}% of GDP). ${verdict}`, cred < -3 ? 'bad' : cred > 1 ? 'good' : 'neutral');
  return { verdict, after, dDef };
}

/* ---------- elections ---------- */
function startCampaign(forced) {
  S.campaign = { left: 6, boost: 0, debate: false, forced };
  news(forced ? 'Parliament is dissolved. The general election is in six weeks.' : `${S.pm.name} calls a snap general election, six weeks from today.`, 'neutral');
  queue({ type: 'campaign', data: {} });
}
function stepCampaign() {
  S.campaign.left--;
  S.campaign.boost *= .9;
  if (S.campaign.left <= 0) { electionNight(); return; }
  if (S.campaign.left === 3 && !S.campaign.debate) queue({ type: 'debate', data: {} });
  else queue({ type: 'campaign', data: {} });
  if (chance(.3)) { const ev = pickEvent(); if (ev) { S.cool[ev.id] = S.week; queue({ type: 'event', data: { id: ev.id } }); } }
}
const CAMPAIGN_FOCUS = [
  { id: 'economy', t: 'The economy', h: 'Strong if growth is good', score: () => issues().economy },
  { id: 'nhs', t: 'The NHS', h: 'Strong if waits are falling', score: () => issues().health + .3 },
  { id: 'borders', t: 'Immigration', h: 'Plays to older voters', score: () => issues().immigration + (S.pm.role === 'R' ? .4 : -.2) },
  { id: 'attack', t: 'Attack the opposition', h: 'Depends on their leader', score: () => (50 - S.oppLeader) / 20 },
  { id: 'marginals', t: 'Target marginal seats', h: 'Safe, small gain', score: () => .4 },
  { id: 'giveaway', t: 'Announce a giveaway', h: 'Popular, hurts credibility', score: () => .8 }
];
function campaignChoice(id) {
  const f = CAMPAIGN_FOCUS.find(x => x.id === id);
  const sc = f.score() + gauss() * .4;
  const boost = clamp(sc * .9, -1.5, 2);
  S.campaign.boost += boost;
  if (id === 'giveaway') { G.stat('credibility', -4); G.oneOff(3); }
  if (id === 'marginals') S.campaign.marginals = (S.campaign.marginals || 0) + 1;
  computeShares(false);
  return boost > .5 ? 'The campaign has a good week. Your poll numbers tick up.' : boost < -.3 ? 'The message falls flat and the opposition seizes the agenda.' : 'A steady week with no breakthroughs.';
}
function electionNight() {
  const sh = currentShares();
  const err = gauss() * 1.8;
  sh[S.pm.role] += err; sh[mainOpp()] -= err * .6;
  if (S.flags.votes16) sh.G += .5, sh[S.pm.role] += S.pm.role === 'L' ? .5 : -.5;
  // marginals targeting: boost in close seats via small extra share
  sh[S.pm.role] += (S.campaign.marginals || 0) * .25;
  for (const p in sh) sh[p] = Math.max(.3, sh[p]);
  const tot = Object.values(sh).reduce((a, b) => a + b, 0); for (const p in sh) sh[p] = sh[p] * 100 / tot;
  const r = runSeats(sh, .06);
  // pledges judged
  const kept = [], broken = [];
  for (const id of S.pm.pledges) {
    if (id.startsWith('bill:')) { (S.passed.includes(id.slice(5)) ? kept : broken).push(id); continue; }
    const p = PLEDGES.find(x => x.id === id); if (!p) continue;
    let ok = !S.broken.includes(id);
    if (id === 'nhs_waits') ok = waitList() < 6;
    if (id === 'migration') ok = S.econ.migration < 200;
    if (id === 'homes') ok = homes() >= 300;
    if (id === 'deficit') ok = S.econ.deficit / S.econ.gdp * 100 < 2;
    (ok ? kept : broken).push(id);
  }
  S.campaign = null;
  const prev = S.seats[S.pm.role];
  S.seats = r.res; S.winners = r.winners; S.partner = null;
  for (const p of PARTY_ORDER) S.parties[p].share = sh[p];
  const mine = S.seats[S.pm.role];
  const largest = PARTY_ORDER.reduce((a, b) => (S.seats[b] > S.seats[a] ? b : a), 'L');
  let outcome;
  if (mine >= 326) outcome = 'majority';
  else if (largest === S.pm.role) outcome = 'hung';
  else if (S.seats[largest] >= 326) outcome = 'lost';
  else outcome = (mine + (S.seats.LD || 0) >= 326 && S.pm.role === 'L') ? 'hung' : 'lost';
  queue({ type: 'result', data: { sh, seats: { ...r.res }, prev, outcome, kept, broken, detail: r.detail.filter(Boolean).filter(d => d.margin < 3).length } });
  if (outcome === 'majority') {
    S.stats.electionsWon++; S.terms++; S.termStart = S.week; S.electionDue = S.week + 260;
    S.honeymoon = 4; S.fatigue *= .75; S.govType = 'majority'; S.unityMod += 8; S.pm.pledges = S.pm.pledges.filter(p => p.startsWith('bill:') ? !S.passed.includes(p.slice(5)) : true);
    S.broken = [];
    news(`${S.pm.name} wins the general election with ${mine} seats and a majority of ${majority()}.`, 'good');
  } else if (outcome === 'hung') {
    S.electionDue = S.week + 260; S.termStart = S.week; S.govType = 'minority';
    news(`Hung parliament. The ${playerParty().name} is the largest party with ${mine} seats.`, 'neutral');
    queue({ type: 'hung', data: {} });
  } else {
    endGame('election', `The ${S.parties[largest].name} won the general election with ${S.seats[largest]} seats.`);
  }
}
function endGame(reason, text) {
  S.gameOver = { reason, text, week: S.week };
  queue({ type: 'gameover', data: { reason, text } });
}
function legacyScore() {
  const yrs = S.week / 52;
  let s = yrs * 8 + S.passed.length * 3 + (S.stats.electionsWon - 1) * 20 + (S.svc.health - 42) * .5 + (S.econ.growth) * 4 - Math.max(0, S.econ.debt / S.econ.gdp * 100 - 95) * .5 + (S.approval - 40) * .3;
  return Math.round(clamp(s, 0, 200));
}

/* ---------- save and load ---------- */
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; const s = JSON.parse(raw); if (!s || s.v !== 1) return false; S = s; SEATS = buildSeats(S.seed); return true; }
  catch (e) { return false; }
}
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } S = null; ui = { tab: 'briefing', budget: null, billFilter: 'All' }; render(); }

/* =====================================================================
   Interface
   ===================================================================== */
const partyColor = p => `var(--p${p})`;
const tone = (v, good, bad, invert) => { const g = invert ? v <= good : v >= good; const b = invert ? v >= bad : v <= bad; return g ? 'good' : b ? 'bad' : 'warn'; };

function lineChart(series, opts = {}) {
  const W = 640, H = opts.h || 200, P = { l: 36, r: 12, t: 10, b: 22 };
  const all = series.flatMap(s => s.v.filter(x => x != null));
  if (!all.length) return '<p class="muted">No data yet.</p>';
  let lo = opts.min ?? Math.min(...all), hi = opts.max ?? Math.max(...all);
  if (hi - lo < 1) { hi += .5; lo -= .5; }
  const pad = (hi - lo) * .08; lo = opts.min ?? lo - pad; hi = opts.max ?? hi + pad;
  const n = Math.max(2, series[0].v.length);
  const x = i => P.l + (W - P.l - P.r) * i / (n - 1);
  const y = v => P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo));
  const ticks = []; const step = niceStep((hi - lo) / 4);
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) ticks.push(t);
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(opts.label || 'chart')}">`;
  for (const t of ticks) svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${P.l - 6}" y="${y(t) + 4}" text-anchor="end" class="tick">${Number.isInteger(step) ? t : t.toFixed(1)}</text>`;
  if (opts.ref != null && opts.ref >= lo && opts.ref <= hi) svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(opts.ref)}" y2="${y(opts.ref)}" class="ref"/>`;
  if (opts.xlabels) for (const [i, l] of opts.xlabels) svg += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="tick">${l}</text>`;
  for (const s of series) {
    const pts = s.v.map((v, i) => v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean);
    if (pts.length < 2) continue;
    svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.c}" stroke-width="${s.wd || 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const last = s.v.length - 1; if (s.v[last] != null) svg += `<circle cx="${x(last)}" cy="${y(s.v[last])}" r="3.5" fill="${s.c}"/>`;
  }
  return svg + '</svg>';
}
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p; }
function yearLabels(hist) {
  const out = []; let lastY = null;
  hist.forEach((h, i) => { const y = md(h.w).y; if (lastY !== null && y !== lastY) out.push([i, String(y)]); lastY = y; });
  return out;
}

function commonsSvg(seats, order) {
  const cols = 38, r = 5, gap = 13; const dots = [];
  for (const p of order) for (let i = 0; i < (seats[p] || 0); i++) dots.push(p);
  const rows = Math.ceil(dots.length / cols);
  let s = `<svg viewBox="0 0 ${cols * gap + 4} ${rows * gap + 4}" class="commons" role="img" aria-label="House of Commons seats">`;
  dots.forEach((p, i) => { const cx = 2 + (i % cols) * gap + r, cy = 2 + Math.floor(i / cols) * gap + r; s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${partyColor(p)}"/>`; });
  return s + '</svg>';
}
function seatOrder() { const me = S.pm.role; const order = [me]; if (S.partner) order.push(S.partner); for (const p of ['LD','G','S','O','NI','P', mainOpp()]) if (!order.includes(p)) order.push(p); if (me === 'L') { return [me, ...(S.partner ? [S.partner] : []), 'G', 'S', 'LD', 'O', 'NI', 'P', 'R'].filter((v, i, a) => a.indexOf(v) === i); } return order; }

function meter(v, cls) { return `<span class="meter ${cls || ''}"><span style="width:${clamp(v, 0, 100)}%"></span></span>`; }

function render() {
  const root = $('#app');
  if (!S) { root.innerHTML = setupHtml(); bindSetup(); return; }
  root.innerHTML = gameHtml();
  bindGame();
  renderModal();
}

/* ----- setup ----- */
let setup = { role: 'L', wing: 1, start: 'comfortable', pledges: ['no_income_tax', 'nhs_waits'] };
function setupHtml() {
  const wingOpts = WINGS[setup.role].map((w, i) => `<label class="chip"><input type="radio" name="wing" value="${i}" ${setup.wing === i ? 'checked' : ''}><span>${w[0]}</span></label>`).join('');
  const pledgeOpts = PLEDGES.map(p => `<label class="chip"><input type="checkbox" name="pledge" value="${p.id}" ${setup.pledges.includes(p.id) ? 'checked' : ''}><span>${esc(p.name)}</span></label>`).join('');
  const billOpts = BILLS.filter(b => !b.free).map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
  return `
  <section class="setup">
    <div class="setup-head">
      <p class="eyebrow">Official · Sensitive</p>
      <h1>Number Ten</h1>
      <p class="lede">You have just won a general election. You have five years before the next one. Run the Treasury, pass your bills, manage your cabinet and keep your party behind you.</p>
    </div>
    <form id="setupForm" class="setup-form">
      <div class="field"><label for="pmName">Your name</label><input id="pmName" required maxlength="40" value="${esc(setup.name || 'Sam Ellison')}"></div>
      <div class="field-row">
        <div class="field"><label for="partyName">Party name</label><input id="partyName" required maxlength="40" value="${esc(setup.party || 'Progressive Party')}"></div>
        <div class="field small"><label for="partyShort">Short name</label><input id="partyShort" required maxlength="5" value="${esc(setup.short || 'PRG')}"></div>
      </div>
      <fieldset class="field"><legend>Where does your party sit?</legend>
        <div class="chips">
          <label class="chip"><input type="radio" name="role" value="L" ${setup.role === 'L' ? 'checked' : ''}><span>Centre-left</span></label>
          <label class="chip"><input type="radio" name="role" value="R" ${setup.role === 'R' ? 'checked' : ''}><span>Centre-right</span></label>
        </div></fieldset>
      <fieldset class="field"><legend>Your wing of the party</legend><div class="chips" id="wingChips">${wingOpts}</div>
        <p class="hint">Further from the centre pleases your base but costs you swing voters and moderate MPs.</p></fieldset>
      <fieldset class="field"><legend>Election result</legend>
        <div class="chips">
          <label class="chip"><input type="radio" name="start" value="landslide" ${setup.start === 'landslide' ? 'checked' : ''}><span>Landslide</span></label>
          <label class="chip"><input type="radio" name="start" value="comfortable" ${setup.start === 'comfortable' ? 'checked' : ''}><span>Comfortable win</span></label>
          <label class="chip"><input type="radio" name="start" value="narrow" ${setup.start === 'narrow' ? 'checked' : ''}><span>Narrow, maybe hung</span></label>
        </div></fieldset>
      <fieldset class="field"><legend>Manifesto pledges (pick up to 4)</legend><div class="chips">${pledgeOpts}</div>
        <label for="pledgeBill" class="sub">Flagship bill (optional)</label>
        <select id="pledgeBill"><option value="">None</option>${billOpts}</select>
        <p class="hint">Breaking a pledge costs trust. Flagship bills are protected in the Lords by the Salisbury convention.</p></fieldset>
      <p class="err" id="setupErr" hidden></p>
      <button class="btn primary big" type="submit">Kiss hands and enter Downing Street</button>
    </form>
  </section>`;
}
function bindSetup() {
  const f = $('#setupForm');
  f.addEventListener('change', e => {
    if (e.target.name === 'role') { setup.role = e.target.value; setup.wing = 1; keepSetupText(); render(); }
    if (e.target.name === 'wing') setup.wing = +e.target.value;
    if (e.target.name === 'start') setup.start = e.target.value;
    if (e.target.name === 'pledge') setup.pledges = [...f.querySelectorAll('input[name=pledge]:checked')].map(x => x.value);
  });
  f.addEventListener('submit', e => {
    e.preventDefault(); keepSetupText();
    const bill = $('#pledgeBill').value;
    const pledges = setup.pledges.slice(); if (bill) pledges.push('bill:' + bill);
    const err = $('#setupErr');
    if (pledges.length > 4) { err.textContent = `You have ${pledges.length} pledges. Pick 4 or fewer, counting the flagship bill.`; err.hidden = false; return; }
    if (!setup.name.trim() || !setup.party.trim()) { err.textContent = 'Enter your name and your party\'s name.'; err.hidden = false; return; }
    newGame({ name: setup.name.trim(), party: setup.party.trim(), short: (setup.short || setup.party.slice(0, 3)).toUpperCase(), role: setup.role, wing: setup.wing, start: setup.start, pledges });
    ui.tab = 'briefing'; render();
  });
}
function keepSetupText() { const n = $('#pmName'), p = $('#partyName'), s = $('#partyShort'); if (n) setup.name = n.value; if (p) setup.party = p.value; if (s) setup.short = s.value; }

/* ----- main screen ----- */
const TABS = [['briefing', 'Briefing'], ['treasury', 'Treasury'], ['services', 'Departments'], ['parliament', 'Parliament'], ['cabinet', 'Cabinet'], ['polling', 'Polling']];
function gameHtml() {
  const e = S.econ, maj = majority(), wk = S.electionDue - S.week;
  const yrsLeft = wk / 52;
  return `
  <header class="topbar">
    <div class="classify"><span>OFFICIAL – SENSITIVE</span><span>PRIME MINISTER’S OFFICE</span></div>
    <div class="topline">
      <div class="who">
        <h1 class="brand">Number Ten</h1>
        <p class="date"><strong>${dstr(S.week)}</strong> · Week ${S.week + 1} · ${sitting(S.week) ? 'Parliament sitting' : 'Recess'}</p>
      </div>
      <div class="pm"><span class="pdot" style="background:${partyColor(S.pm.role)}"></span>${esc(S.pm.name)} · ${esc(playerParty().name)}${S.partner ? ` with ${esc(S.parties[S.partner].name)}` : ''}</div>
      <button class="btn primary next" id="nextBtn" ${S.queue.length || S.gameOver ? 'disabled' : ''}>${S.campaign ? `Campaign week ▸` : 'Next week ▸'}</button>
    </div>
    <dl class="kpis">
      <div><dt>Approval</dt><dd class="${tone(S.approval, 45, 33)}">${f0(S.approval)}%</dd>${meter(S.approval, tone(S.approval, 45, 33))}</div>
      <div><dt>${S.govType === 'majority' ? 'Majority' : S.govType === 'coalition' ? 'Coalition majority' : 'Minority'}</dt><dd class="${maj > 20 ? 'good' : maj > 0 ? 'warn' : 'bad'}">${maj > 0 ? f0(maj) : f0(326 - govSeats()) + ' short'}</dd><span class="sub">${govSeats()} of 650 seats</span></div>
      <div><dt>Party unity</dt><dd class="${tone(S.unity, 60, 40)}">${f0(S.unity)}</dd>${meter(S.unity, tone(S.unity, 60, 40))}</div>
      <div><dt>Markets</dt><dd class="${tone(e.credibility, 55, 35)}">${f0(e.credibility)}</dd><span class="sub">10-year gilt ${f2(e.gilt)}%</span></div>
      <div><dt>Poll lead</dt><dd class="${leadTone()}">${signed(lead(), 1)}</dd><span class="sub">vs ${esc(S.parties[mainOpp()].short)}</span></div>
      <div><dt>Election</dt><dd>${S.campaign ? `${S.campaign.left} wks` : yrsLeft >= 1 ? f1(yrsLeft) + ' yrs' : wk + ' wks'}</dd><span class="sub">${S.campaign ? 'campaign under way' : 'latest date ' + dstr(S.electionDue).replace(/^\d+ /, '')}</span></div>
    </dl>
    <nav class="tabs" role="tablist">${TABS.map(([id, n]) => `<button role="tab" class="tab ${ui.tab === id ? 'on' : ''}" data-tab="${id}" aria-selected="${ui.tab === id}">${n}</button>`).join('')}</nav>
  </header>
  <main class="panel">${panelHtml()}</main>
  <footer class="foot"><span>Autosaves in this browser.</span><button class="link" id="resetBtn">Start a new game</button></footer>
  <div id="modal" class="modal" hidden></div>`;
}
const lead = () => S.parties[S.pm.role].share - Math.max(...PARTY_ORDER.filter(p => p !== S.pm.role).map(p => S.parties[p].share));
const leadTone = () => lead() > 3 ? 'good' : lead() < -3 ? 'bad' : 'warn';

function panelHtml() {
  switch (ui.tab) {
    case 'treasury': return treasuryHtml();
    case 'services': return servicesHtml();
    case 'parliament': return parliamentHtml();
    case 'cabinet': return cabinetHtml();
    case 'polling': return pollingHtml();
    default: return briefingHtml();
  }
}

function briefingHtml() {
  const e = S.econ, h = S.history.slice(-104);
  const items = [];
  if (S.campaign) items.push(['Election campaign', `${S.campaign.left} weeks to polling day.`, 'warn']);
  const nb = nextBudgetWeek(); items.push(['Next budget', `${dstr(nb)}. Use the Treasury tab to plan.`, '']);
  if (S.bills.length) items.push(['Bills in Parliament', S.bills.map(b => `${billById(b.id).name} (${stageName(b.stage)})`).join('; '), '']);
  else items.push(['Bills in Parliament', 'None. You have room for three. Open the Parliament tab to introduce one.', 'warn']);
  const pled = S.pm.pledges.map(id => pledgeName(id) + (S.broken.includes(id) ? ' (broken)' : '')).join('; ');
  items.push(['Manifesto pledges', pled || 'None', S.broken.length ? 'bad' : '']);
  const worst = Object.entries(S.groups).sort((a, b) => a[1] - b[1])[0];
  items.push(['Weakest voter group', `${GROUPS[worst[0]].name}: ${f0(worst[1])}% approve.`, worst[1] < 30 ? 'bad' : 'warn']);
  return `
  <div class="grid two">
    <section class="card">
      <h2>Red box</h2>
      <ul class="redbox">${items.map(([t, d, c]) => `<li class="${c}"><span class="rb-t">${esc(t)}</span><span>${esc(d)}</span></li>`).join('')}</ul>
    </section>
    <section class="card">
      <h2>Approval and unity</h2>
      ${lineChart([{ v: h.map(x => x.a), c: 'var(--bench)' }, { v: h.map(x => x.u), c: 'var(--brass)', wd: 1.5 }], { min: 0, max: 100, ref: 50, xlabels: yearLabels(h), label: 'Approval and party unity over time' })}
      <p class="legend"><span><i style="background:var(--bench)"></i>Approval</span><span><i style="background:var(--brass)"></i>Party unity</span></p>
    </section>
  </div>
  <div class="grid three">
    ${stat('Growth', f1(e.growth) + '%', 'a year', tone(e.growth, 1.5, .3))}
    ${stat('Inflation', f1(e.inflation) + '%', 'CPI, target 2%', tone(Math.abs(e.inflation - 2), .7, 2, true))}
    ${stat('Unemployment', f1(e.unemp) + '%', '', tone(e.unemp, 4.3, 5.5, true))}
    ${stat('Bank Rate', f2(e.rate) + '%', 'set by the Bank of England', '')}
    ${stat('Borrowing', f1(e.deficit / e.gdp * 100) + '% of GDP', bn(e.deficit) + ' a year', tone(e.deficit / e.gdp * 100, 2.5, 4.5, true))}
    ${stat('NHS waiting list', f1(waitList()) + 'm', aePct() + '% A&E within 4 hours', tone(waitList(), 6.5, 7.8, true))}
  </div>
  <section class="card">
    <h2>News</h2>
    <ol class="news">${S.news.slice(0, 18).map(n => `<li class="${n.tone}"><time>${dstr(n.w)}</time><span>${esc(n.text)}</span></li>`).join('')}</ol>
  </section>`;
}
function stat(label, val, sub, cls) { return `<div class="stat"><span class="s-l">${label}</span><span class="s-v ${cls}">${val}</span><span class="s-s">${sub}</span></div>`; }
function nextBudgetWeek() { for (let w = S.week + 1; w < S.week + 60; w++) if (inWindow(w, 10, 22, 28)) return w; return S.week; }
const stageName = s => ({ second: 'second reading', committee: 'committee stage', lords: 'House of Lords', assent: 'awaiting Royal Assent' }[s]);
const pledgeName = id => id.startsWith('bill:') ? 'Pass the ' + billById(id.slice(5)).name : PLEDGES.find(p => p.id === id).name;

function treasuryHtml() {
  const e = S.econ, rv = revenueBreakdown(), sp = spendingBreakdown(), fc = forecast(S.tax, S.spend), h = S.history.slice(-156);
  const rrow = (n, v) => `<tr><td>${n}</td><td class="num">${bn(v)}</td></tr>`;
  return `
  <div class="grid two">
    <section class="card">
      <h2>Public finances this year</h2>
      <div class="split">
        <table class="tbl"><caption>Receipts</caption>
          ${rrow('Income tax', rv.inc)}${rrow('National Insurance (employees)', rv.ni)}${rrow('National Insurance (employers)', rv.niEr)}${rrow('VAT', rv.vat)}${rrow('Corporation tax', rv.corp)}${rrow('Fuel duty', rv.fuel)}${rrow('Other taxes', rv.other)}
          <tr class="tot"><td>Total</td><td class="num">${bn(rv.total)}</td></tr></table>
        <table class="tbl"><caption>Spending</caption>
          ${Object.keys(DEPTS).map(d => rrow(DEPTS[d].name, sp[d])).join('')}${rrow('Debt interest', sp.interest)}
          <tr class="tot"><td>Total</td><td class="num">${bn(sp.total)}</td></tr></table>
      </div>
      <p class="callout ${e.deficit > 0 ? 'bad' : 'good'}">Borrowing ${bn(e.deficit)} a year, ${f1(e.deficit / e.gdp * 100)}% of GDP. Debt ${bn(e.debt)}, ${f1(e.debt / e.gdp * 100)}% of GDP. Tax take ${f1(taxBurden())}% of GDP.</p>
    </section>
    <section class="card">
      <h2>OBR five-year forecast</h2>
      <div class="table-wrap"><table class="tbl fc"><thead><tr><th>Year</th>${fc.def.map((_, i) => `<th class="num">${md(S.week).y + i}</th>`).join('')}</tr></thead>
        <tr><td>Borrowing</td>${fc.def.map(v => `<td class="num">${bn(v)}</td>`).join('')}</tr>
        <tr><td>% of GDP</td>${fc.defPct.map(v => `<td class="num">${f1(v)}</td>`).join('')}</tr>
        <tr><td>Debt % GDP</td>${fc.debtPct.map(v => `<td class="num">${f1(v)}</td>`).join('')}</tr></table></div>
      <p class="callout ${fc.debtPct[4] < fc.debtPct[3] ? 'good' : 'bad'}">Fiscal rule: debt falling in year five. ${fc.debtPct[4] < fc.debtPct[3] ? 'On track.' : 'Not met. Markets are watching.'}</p>
      <h3>Rates and markets</h3>
      ${lineChart([{ v: h.map(x => x.r), c: 'var(--box)' }, { v: h.map(x => x.i), c: 'var(--brass)' }], { ref: 2, xlabels: yearLabels(h), label: 'Bank Rate and inflation' })}
      <p class="legend"><span><i style="background:var(--box)"></i>Bank Rate</span><span><i style="background:var(--brass)"></i>Inflation</span><span><i class="dash"></i>2% target</span></p>
      <div class="row-actions"><button class="btn" id="emergencyBudget">Hold an emergency budget</button><span class="hint">Outside the Autumn Budget this costs market credibility.</span></div>
    </section>
  </div>
  <div class="grid three">
    ${stat('Business confidence', f0(e.confidence), 'index, 50 = neutral', tone(e.confidence, 55, 40))}
    ${stat('Trend growth', f1(e.pot || 1.3) + '%', 'what the economy can sustain', tone(e.pot || 1.3, 1.5, 1))}
    ${stat('Public sector pay', signed(e.pubPay - 100) + '%', 'real terms since you took office', tone(e.pubPay, 99.5, 97.5))}
    ${stat('Net migration', f0(e.migration) + 'k', 'a year', '')}
    ${stat('Debt interest', bn(sp.interest), f1(e.effRate) + '% average rate', tone(e.effRate, 4, 5, true))}
    ${stat('Market credibility', f0(e.credibility), 'below 35 risks a gilt crisis', tone(e.credibility, 55, 35))}
  </div>`;
}

function servicesHtml() {
  const rows = [
    ['health', 'NHS', `${f1(waitList())}m waiting · ${aePct()}% A&E in 4 hours`],
    ['education', 'Schools', `${f1(gcse())}% pass English and maths GCSE`],
    ['crime', 'Policing and justice', `${f1(chargeRate())}% of crimes charged${S.flags.prisons ? '' : ' · prisons near capacity'}`],
    ['housing', 'Housing', `${f0(homes())}k homes built a year`],
    ['environment', 'Environment', `Emissions ${f0(emissions())}% below 1990`],
    ['defence', 'Defence', `${f1(S.spend.defence / S.econ.gdp * 100)}% of GDP on defence`],
    ['transport', 'Transport', `${f0(punctuality())}% of trains on time`]
  ];
  const sp = spendingBreakdown();
  return `
  <section class="card">
    <h2>Departments</h2>
    <p class="muted">Quality moves slowly toward a level set by real-terms funding, the secretary of state's competence and your legislation. Budgets are fixed in cash between fiscal events, so inflation erodes them.</p>
    <div class="svc-list">${rows.map(([k, n, d]) => {
      const dept = Object.keys(DEPTS).find(x => DEPTS[x].svc === k); const m = minister(SVC_ROLE[k]);
      const yrs = S.week / 52; const need = BASE_SPEND[dept] * Math.pow(1 + NEED_GROWTH[dept], yrs) * S.econ.price; const ratio = S.spend[dept] / need;
      return `<div class="svc"><div class="svc-h"><strong>${n}</strong><span class="score ${tone(S.svc[k], 55, 40)}">${f0(S.svc[k])}/100</span></div>${meter(S.svc[k], tone(S.svc[k], 55, 40))}
        <p>${d}</p><p class="muted small">${bn(sp[dept])} a year · funding ${signed((ratio - 1) * 100)}% against demand · ${m ? esc(m.name) + ', competence ' + m.comp : 'no minister'}</p></div>`;
    }).join('')}</div>
  </section>`;
}

function parliamentHtml() {
  const order = seatOrder(); const slots = 3 - S.bills.length;
  const depts = ['All', ...new Set(BILLS.map(b => b.dept))];
  const avail = BILLS.filter(b => !S.passed.includes(b.id) && !S.bills.some(x => x.id === b.id) && (ui.billFilter === 'All' || b.dept === ui.billFilter));
  return `
  <div class="grid two">
    <section class="card">
      <h2>House of Commons</h2>
      ${commonsSvg(S.seats, order)}
      <ul class="parties">${order.filter(p => S.seats[p]).map(p => `<li><i style="background:${partyColor(p)}"></i>${esc(S.parties[p].name)}<span class="num">${S.seats[p]}</span></li>`).join('')}</ul>
      <p class="muted small">326 seats for a majority. ${S.govType === 'minority' ? 'You govern as a minority and every vote is a negotiation.' : `Working majority of ${majority()}.`}</p>
      <div class="row-actions">${S.campaign ? '' : `<button class="btn" id="callElection">Call a general election</button>`}<button class="btn danger" id="resignBtn">Resign</button></div>
    </section>
    <section class="card">
      <h2>Bills before Parliament <span class="muted">${S.bills.length}/3</span></h2>
      ${S.bills.length ? `<ul class="bills-prog">${S.bills.map(bl => { const b = billById(bl.id); const st = ['second', 'committee', 'lords', 'assent'].indexOf(bl.stage); return `<li><strong>${esc(b.name)}</strong><ol class="stages">${['2nd reading', 'Committee', 'Lords', 'Assent'].map((n, i) => `<li class="${i < st ? 'done' : i === st ? 'now' : ''}">${n}</li>`).join('')}</ol><span class="muted small">Next step in ${bl.left} sitting week${bl.left === 1 ? '' : 's'}${bl.mode !== 'normal' ? ' · ' + ({ soft: 'watered down', free: 'free vote', confidence: 'confidence vote' }[bl.mode]) : ''}</span></li>`; }).join('')}</ul>` : '<p class="muted">No government bills in progress.</p>'}
      <h3>Statute book</h3>
      <p class="small">${S.passed.length ? S.passed.map(id => esc(billById(id).name.replace(' Bill', ' Act'))).join(' · ') : 'No acts passed yet.'}</p>
    </section>
  </div>
  <section class="card">
    <div class="card-h"><h2>Legislative programme</h2>
      <label class="sel"><span class="sr">Department</span><select id="billFilter">${depts.map(d => `<option ${d === ui.billFilter ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label></div>
    ${slots <= 0 ? '<p class="callout warn">Parliamentary time is full. Wait for a bill to finish before introducing another.</p>' : ''}
    <div class="bill-list">${avail.map(b => {
      const wc = whipCount(b, b.free ? 'free' : 'normal'); const pass = wc.ayes > wc.noes;
      const cost = (b.fx.spend ? Object.values(b.fx.spend).reduce((a, c) => a + c, 0) : 0) - (b.fx.revenue || 0);
      return `<article class="bill"><div><h3>${esc(b.name)}</h3><p class="muted small">${esc(b.dept)} · ${ideoLabel(b.ideo)}${b.free ? ' · conscience issue' : ''}</p><p>${esc(b.desc)}</p></div>
        <div class="bill-f"><span class="small">${cost ? (cost > 0 ? 'Costs ' : 'Saves ') + bn(Math.abs(cost)) + ' a year' : b.fx.oneOff ? 'One-off ' + bn(b.fx.oneOff) : 'No direct cost'}</span>
        <span class="small ${pass ? 'good' : 'bad'}">Whips: ${wc.rebels} rebels, ${pass ? 'likely to pass' : 'likely to fail'}</span>
        <button class="btn" data-intro="${b.id}" ${slots <= 0 || S.campaign ? 'disabled' : ''}>Introduce</button></div></article>`;
    }).join('') || '<p class="muted">Nothing left in this department.</p>'}</div>
  </section>`;
}
const ideoLabel = v => v <= -.6 ? 'Left' : v <= -.25 ? 'Centre-left' : v < .25 ? 'Centrist' : v < .6 ? 'Centre-right' : 'Right';

function cabinetHtml() {
  const facs = FACTIONS[S.pm.role];
  const back = S.people.filter(p => !isMinister(p.id));
  return `
  <section class="card">
    <h2>Cabinet</h2>
    <p class="muted">Competence improves the department. Loyalty and ambition decide who plots. Keep the party's wings represented: about 30% ${facs[0]}, 45% ${facs[1]}, 25% ${facs[2]}.</p>
    <div class="table-wrap"><table class="tbl cab"><thead><tr><th>Post</th><th>Minister</th><th>Wing</th><th class="num">Competence</th><th class="num">Loyalty</th><th class="num">Ambition</th><th class="num">Profile</th><th></th></tr></thead>
    <tbody>${ROLES.map(r => { const m = minister(r.id); return `<tr><td>${r.name}</td><td>${m ? esc(m.name) : '<em>Vacant</em>'}</td><td>${m ? facs[m.fac] : ''}</td>
      <td class="num">${m ? pips(m.comp) : ''}</td><td class="num">${m ? pips(m.loyal) : ''}</td><td class="num">${m ? pips(m.ambition) : ''}</td><td class="num">${m ? pips(m.profile) : ''}</td>
      <td><select data-role="${r.id}" aria-label="Replace ${r.name}"><option value="">Reshuffle…</option>${back.map(p => `<option value="${p.id}">${esc(p.name)} (${facs[p.fac]}, comp ${p.comp})</option>`).join('')}</select></td></tr>`; }).join('')}</tbody></table></div>
  </section>
  <section class="card">
    <h2>Back benches</h2>
    <div class="table-wrap"><table class="tbl cab"><thead><tr><th>MP</th><th>Seat</th><th>Wing</th><th class="num">Competence</th><th class="num">Loyalty</th><th class="num">Ambition</th><th class="num">Profile</th><th>Mood</th></tr></thead>
    <tbody>${back.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.seat)}</td><td>${facs[p.fac]}</td><td class="num">${pips(p.comp)}</td><td class="num">${pips(p.loyal)}</td><td class="num">${pips(p.ambition)}</td><td class="num">${pips(p.profile)}</td><td>${p.grudge > 1 ? '<span class="bad">Sacked, resentful</span>' : p.ambition > 7 && p.loyal < 5 ? '<span class="warn">Restless</span>' : 'Content'}</td></tr>`).join('')}</tbody></table></div>
  </section>`;
}
const pips = n => `<span class="pips" aria-label="${n} of 10">${f0(n)}</span>`;

function pollingHtml() {
  const h = S.history.slice(-260); const parties = PARTY_ORDER.filter(p => !['NI', 'O'].includes(p));
  const proj = runSeats(currentShares()).res;
  const lp = S.lastPoll;
  return `
  <div class="grid two">
    <section class="card">
      <h2>Voting intention</h2>
      ${lineChart(parties.map(p => ({ v: h.map(x => x.sh[p]), c: partyColor(p), wd: p === S.pm.role ? 2.6 : 1.8 })), { min: 0, xlabels: yearLabels(h), label: 'Voting intention over time', h: 220 })}
      <p class="legend">${parties.map(p => `<span><i style="background:${partyColor(p)}"></i>${esc(S.parties[p].short)} ${f0(S.parties[p].share)}%</span>`).join('')}</p>
      ${lp ? `<p class="muted small">Latest poll, ${esc(lp.pol)}: ${parties.map(p => `${esc(S.parties[p].short)} ${f0(lp.poll[p])}`).join(', ')}.</p>` : ''}
    </section>
    <section class="card">
      <h2>Seat projection</h2>
      <p class="muted small">If an election were held today, on a uniform national swing across all 650 constituencies.</p>
      ${commonsSvg(proj, seatOrder())}
      <ul class="parties">${seatOrder().filter(p => proj[p]).map(p => `<li><i style="background:${partyColor(p)}"></i>${esc(S.parties[p].name)}<span class="num">${proj[p]}</span></li>`).join('')}</ul>
    </section>
  </div>
  <section class="card">
    <h2>Voter groups</h2>
    <div class="groups">${Object.keys(GROUPS).map(g => `<div class="grp"><div class="svc-h"><strong>${GROUPS[g].name}</strong><span class="score ${tone(S.groups[g], 45, 30)}">${f0(S.groups[g])}%</span></div>${meter(S.groups[g], tone(S.groups[g], 45, 30))}<p class="muted small">${f0(GROUPS[g].pop * 100)}% of voters · ${f0(GROUPS[g].turn * 100)}% turnout · cares most about ${topIssues(g)}</p></div>`).join('')}</div>
  </section>
  <div class="grid three">
    ${stat('Media relations', f0(S.media), 'lobby and press', tone(S.media, 55, 40))}
    ${stat('Public trust', f0(S.trust), 'falls when pledges break', tone(S.trust, 50, 35))}
    ${stat('Global standing', f0(S.intl), 'allies and summits', tone(S.intl, 55, 40))}
  </div>`;
}
const ISSUE_NAMES = { health: 'the NHS', col: 'the cost of living', crime: 'crime', immigration: 'immigration', pension: 'pensions', tax: 'tax', jobs: 'jobs', housing: 'housing', economy: 'the economy', mortgage: 'mortgages', education: 'schools', environment: 'climate', pay: 'pay', confidence: 'business conditions', transport: 'transport' };
function topIssues(g) { return Object.entries(GROUPS[g].w).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => ISSUE_NAMES[k]).join(' and '); }

function bindGame() {
  $('#nextBtn').addEventListener('click', advance);
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { ui.tab = b.dataset.tab; render(); window.scrollTo(0, 0); }));
  $('#resetBtn').addEventListener('click', () => openConfirm('Start a new game?', 'Your current government will be lost.', 'Start again', wipe));
  const fb = $('#billFilter'); if (fb) fb.addEventListener('change', () => { ui.billFilter = fb.value; render(); });
  document.querySelectorAll('[data-intro]').forEach(b => b.addEventListener('click', () => openIntro(b.dataset.intro)));
  document.querySelectorAll('select[data-role]').forEach(s => s.addEventListener('change', () => { if (s.value) openReshuffle(s.dataset.role, s.value); }));
  const eb = $('#emergencyBudget'); if (eb) eb.addEventListener('click', () => { queue({ type: 'budget', data: { kind: 'Emergency Budget', emergency: true } }); render(); });
  const ce = $('#callElection'); if (ce) ce.addEventListener('click', () => openConfirm('Call a general election?', `Polling day will be ${dstr(S.week + 6)}. You are ${lead() >= 0 ? f1(lead()) + ' points ahead' : f1(-lead()) + ' points behind'}.`, 'Dissolve Parliament', () => { startCampaign(false); save(); render(); }));
  const rb = $('#resignBtn'); if (rb) rb.addEventListener('click', () => openConfirm('Resign as Prime Minister?', 'This ends the game.', 'Resign', () => { endGame('resigned', `${S.pm.name} resigned after ${f1(S.week / 52)} years in office.`); save(); render(); }));
}

/* ----- one-off modals that are not in the queue ----- */
let transient = null;
function openConfirm(title, body, cta, fn) { transient = { title, body, cta, fn }; renderModal(); }
function openIntro(id) {
  const b = billById(id);
  const modes = b.free ? ['free'] : ['normal', 'soft', 'confidence'];
  transient = { intro: id, modes }; renderModal();
}
function openReshuffle(role, pid) {
  const r = ROLES.find(x => x.id === role), out = minister(role), inn = S.people.find(p => p.id === pid);
  transient = { title: `Appoint ${inn.name} as ${r.name}?`, body: `${out ? out.name + ' leaves government' + (out.profile >= 6 ? ' and has a following on the back benches.' : '.') : ''} ${inn.name} has competence ${inn.comp} and loyalty ${inn.loyal}.`, cta: 'Make the appointment', fn: () => {
    S.cabinet[role] = pid; if (out) { out.grudge += out.profile >= 6 ? 2 : 1; out.loyal = clamp(out.loyal - 2, 1, 10); G.unity(-out.profile * .3); }
    inn.loyal = clamp(inn.loyal + 1, 1, 10); news(`Reshuffle: ${inn.name} becomes ${r.name}${out ? `, replacing ${out.name}` : ''}.`); save(); render();
  }, cancel: () => render() };
  renderModal();
}

/* ----- the modal ----- */
function renderModal() {
  const box = $('#modal'); if (!box) return;
  let html = '';
  if (transient) html = transientHtml();
  else if (ui.budget || (S.queue[0] && S.queue[0].type === 'budget')) { if (!ui.budget) openBudget(S.queue[0].data.kind); html = budgetHtml(); }
  else if (S.queue.length) html = queueHtml(S.queue[0]);
  if (!html) { box.hidden = true; box.innerHTML = ''; document.body.classList.remove('locked'); return; }
  box.hidden = false; box.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  document.body.classList.add('locked');
  bindModal();
  const f = box.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true });
}
function transientHtml() {
  const t = transient;
  if (t.intro) {
    const b = billById(t.intro);
    const labels = { normal: ['Introduce as drafted', 'Normal whip'], soft: ['Water it down', 'About 60% of the effect, far fewer rebels'], confidence: ['Make it a confidence vote', 'Very few rebels. If you lose, you face a confidence vote.'], free: ['Free vote', 'MPs vote with their conscience'] };
    return `<p class="kicker">Whips’ briefing</p><h2>${esc(b.name)}</h2><p>${esc(b.desc)}</p>
      <div class="choices">${t.modes.map(m => { const wc = whipCount(b, m); return `<button class="choice" data-mode="${m}"><strong>${labels[m][0]}</strong><span>${labels[m][1]}</span><span class="${wc.ayes > wc.noes ? 'good' : 'bad'}">Projected: Ayes ${wc.ayes}, Noes ${wc.noes}${m !== 'free' ? ` · ${wc.rebels} rebels` : ''}</span></button>`; }).join('')}</div>
      <div class="sheet-f"><button class="btn" data-cancel>Not now</button></div>`;
  }
  return `<h2>${esc(t.title)}</h2><p>${esc(t.body)}</p><div class="sheet-f"><button class="btn" data-cancel>Cancel</button><button class="btn primary" data-ok>${esc(t.cta)}</button></div>`;
}
function queueHtml(q) {
  const d = q.data;
  switch (q.type) {
    case 'welcome': return `<p class="kicker">Downing Street</p><h2>Welcome to Number Ten</h2>
      <p>You lead the ${esc(playerParty().name)} with ${S.seats[S.pm.role]} MPs. The next election must be held by ${dstr(S.electionDue)}.</p>
      <ul class="tips"><li>Each turn is one week. Press <strong>Next week</strong> to move on.</li><li>Set taxes and spending at the Autumn Budget each November. The Treasury tab shows the OBR forecast.</li><li>Introduce up to three bills at once from the Parliament tab. Bills far from your MPs' views cause rebellions.</li><li>Approval comes from six voter groups. Each cares about different things.</li><li>Lose your party's confidence or the election and the game ends.</li></ul>
      <div class="sheet-f"><button class="btn primary" data-close>Get to work</button></div>`;
    case 'event': return eventHtml(d);
    case 'scandal': { const p = S.people.find(x => x.id === d.id); const r = ROLES.find(x => x.id === d.role);
      return `<p class="kicker">Ministerial scandal</p><h2>${esc(p.name)} under pressure</h2><p>The ${esc(r.name)} faces questions over ${esc(d.kind)}. The lobby wants to know if they still have your full confidence.</p>
      <div class="choices"><button class="choice" data-sc="back"><strong>Back them</strong><span>Loyal ministers remember. The story may run.</span></button><button class="choice" data-sc="probe"><strong>Refer to the ethics adviser</strong><span>Buys time. They may be cleared.</span></button><button class="choice" data-sc="sack"><strong>Sack them</strong><span>Decisive, but they become a backbench critic.</span></button></div>`; }
    case 'pmqs': { const t = PMQ_TOPICS.find(x => x.k === d.k);
      return `<p class="kicker">Prime Minister’s Questions · Wednesday</p><h2>The Leader of the Opposition</h2><blockquote>“${esc(t.q(S))}”</blockquote>
      <div class="choices four"><button class="choice" data-pmq="facts"><strong>Defend the record</strong><span>Works if the numbers are good</span></button><button class="choice" data-pmq="attack"><strong>Attack their record</strong><span>Reliable crowd-pleaser</span></button><button class="choice" data-pmq="announce"><strong>Announce a review</strong><span>Safe, small gain. Wears thin.</span></button><button class="choice" data-pmq="joke"><strong>Go for the one-liner</strong><span>High risk, high reward</span></button></div>
      <p class="muted small">Your record at the despatch box: ${S.stats.pmqWins} wins from ${S.stats.pmqs} sessions.</p>`; }
    case 'division': { const b = billById(d.id);
      return `<p class="kicker">Division · ${esc(b.name)}</p><h2>${d.passed ? 'The Ayes have it' : 'The Noes have it'}</h2>
      <div class="division"><div><span class="dv-n">${d.ayes}</span><span>Ayes</span></div><div><span class="dv-n">${d.noes}</span><span>Noes</span></div></div>
      <p>${d.rebels ? `${d.rebels} of your MPs rebelled.` : 'Your MPs held firm.'} ${d.passed ? 'The bill moves to committee stage.' : 'The bill falls. The government has been defeated on the floor of the House.'}</p>
      <div class="sheet-f"><button class="btn primary" data-close>Continue</button></div>`; }
    case 'lords': { const b = billById(d.id);
      return `<p class="kicker">House of Lords</p><h2>Peers amend the ${esc(b.name)}</h2><p>The Lords have voted for an amendment that weakens a central part of the bill.</p>
      <div class="choices"><button class="choice" data-lords="accept"><strong>Accept the amendment</strong><span>The bill passes with 75% of its effect</span></button><button class="choice" data-lords="ping"><strong>Overturn it in the Commons</strong><span>Ping-pong delays the bill four weeks</span></button></div>`; }
    case 'challenge': { const p = S.people.find(x => x.id === d.id);
      return `<p class="kicker">Leadership crisis</p><h2>${esc(p.name)} challenges you</h2><p>Enough MPs have submitted letters to trigger a confidence vote in your leadership. Your unity score is ${f0(S.unity)} and approval ${f0(S.approval)}%.</p>
      <div class="choices"><button class="choice" data-ch="fight"><strong>Fight it</strong><span>Win and your position is secure for a year</span></button><button class="choice" data-ch="quit"><strong>Resign as leader</strong><span>The game ends</span></button></div>`; }
    case 'confidence': return `<p class="kicker">House of Commons</p><h2>Vote of no confidence</h2><p>The opposition has tabled a motion of no confidence in His Majesty’s Government. You have ${govSeats()} MPs${S.partner ? ' including your coalition partner' : ''}.</p>
      <div class="sheet-f"><button class="btn primary" data-conf>Face the vote</button></div>`;
    case 'campaign': return `<p class="kicker">General election campaign · ${S.campaign ? S.campaign.left : 0} weeks to go</p><h2>Where should the campaign focus this week?</h2>
      <div class="choices">${CAMPAIGN_FOCUS.map(f => `<button class="choice" data-camp="${f.id}"><strong>${f.t}</strong><span>${f.h}</span></button>`).join('')}</div>`;
    case 'debate': return `<p class="kicker">Leaders’ debate</p><h2>The TV debate</h2><p>Eight million people are expected to watch.</p>
      <div class="choices"><button class="choice" data-deb="calm"><strong>Stay calm and statesmanlike</strong><span>Low risk</span></button><button class="choice" data-deb="attack"><strong>Go on the attack</strong><span>Could swing it either way</span></button><button class="choice" data-deb="vision"><strong>Set out a big vision</strong><span>Good if voters trust you</span></button></div>`;
    case 'result': return resultHtml(d);
    case 'hung': return hungHtml();
    case 'info': return `<p class="kicker">${esc(d.kicker || 'Update')}</p><h2>${esc(d.title)}</h2><p>${esc(d.body)}</p><div class="sheet-f"><button class="btn primary" data-close>Continue</button></div>`;
    case 'outcome': return `<p class="kicker">${esc(d.kicker || 'Outcome')}</p><h2>${esc(d.title)}</h2><p>${esc(d.body)}</p><div class="sheet-f"><button class="btn primary" data-close>Continue</button></div>`;
    case 'gameover': return gameOverHtml(d);
  }
  return `<h2>Update</h2><div class="sheet-f"><button class="btn primary" data-close>Continue</button></div>`;
}
const SPECIAL_EVENTS = {
  conference: { cat: 'Party', title: 'Party conference', text: () => `Delegates gather in ${pick(['Manchester', 'Liverpool', 'Birmingham', 'Brighton', 'Bournemouth'])}. What is the theme of your speech?`,
    opts: [
      { t: 'Red meat for the members', f: () => { G.unity(6); G.gw({ middle: -1, business: -1 }); G.stat('media', -1); return 'Standing ovations in the hall. Swing voters are less impressed.'; } },
      { t: 'Reach out to the centre ground', f: () => { G.unity(-2); G.gw({ middle: 3, business: 2, pensioners: 1 }); G.stat('media', 2); return 'Commentators praise the speech. Activists grumble.'; } },
      { t: 'A big new policy announcement', f: () => { G.oneOff(1); G.gw({ all: 1.5 }); G.stat('media', 3); G.unity(2); return 'The announcement dominates the news for days.'; } }
    ] },
  payreview: { cat: 'Treasury', title: 'Pay review bodies report', text: () => `The independent pay review bodies recommend a ${f1(Math.max(2.5, S.econ.inflation + 1))}% rise for nurses, teachers, doctors and police.`,
    opts: [
      { t: 'Accept and fund it in full', h: 'Adds to departmental budgets', f: () => { const r = Math.max(2.5, S.econ.inflation + 1); S.econ.pubPay += r; ['health', 'education', 'police'].forEach(d => S.spend[d] *= 1 + r / 100 * .45); G.gw({ public: 4 }); G.stat('credibility', -1); return 'Unions welcome the award. The Treasury is nervous.'; } },
      { t: 'Accept but make departments find the money', f: () => { const r = Math.max(2.5, S.econ.inflation + 1); S.econ.pubPay += r; ['health', 'education', 'crime'].forEach(k => G.svc(k, -3)); G.gw({ public: 2 }); return 'Staff get the rise. Services are cut to pay for it.'; } },
      { t: 'Impose 2%', f: () => { S.econ.pubPay += 2; G.gw({ public: -5 }); G.unity(-1); return 'Unions start preparing ballots.'; } }
    ] },
  referendum: { cat: 'Cabinet Office', title: 'Electoral reform referendum', text: () => 'The referendum on proportional representation is held. The campaign has been bitter.',
    opts: [
      { t: 'Campaign for change', f: () => { const yes = chance(.4 + (S.groups.young - 40) / 200); if (yes) { G.party('LD', 3); G.party('G', 2); G.party('P', 2); G.unity(-4); return 'Britain votes for proportional representation. Smaller parties are energised.'; } G.unity(1); G.stat('media', -2); return 'The country votes to keep first past the post, 58% to 42%.'; } },
      { t: 'Stay neutral', f: () => { if (chance(.3)) { G.party('LD', 3); G.party('P', 2); return 'A narrow vote for change.'; } return 'First past the post survives comfortably.'; } }
    ] }
};
function eventHtml(d) {
  const ev = EVENTS.find(e => e.id === d.id) || SPECIAL_EVENTS[d.id];
  if (!ev) return `<h2>Event</h2><div class="sheet-f"><button class="btn primary" data-close>Continue</button></div>`;
  if (!d.textCache) d.textCache = ev.text(S);
  return `<p class="kicker">${esc(ev.cat)}</p><h2>${esc(ev.title)}</h2><p>${esc(d.textCache)}</p>
    <div class="choices">${ev.opts.map((o, i) => `<button class="choice" data-opt="${i}"><strong>${esc(o.t)}</strong>${o.h ? `<span>${esc(o.h)}</span>` : ''}</button>`).join('')}</div>`;
}
function resultHtml(d) {
  const order = seatOrder();
  const verdict = { majority: 'You win a majority', hung: 'Hung parliament', lost: 'You have lost' }[d.outcome];
  return `<p class="kicker">General election · ${dstr(S.week)}</p><h2>${verdict}</h2>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Party</th><th class="num">Vote</th><th class="num">Seats</th></tr></thead>
    ${order.filter(p => d.seats[p] || d.sh[p] > 1).map(p => `<tr><td><i class="pd" style="background:${partyColor(p)}"></i>${esc(S.parties[p].name)}</td><td class="num">${f1(d.sh[p])}%</td><td class="num">${d.seats[p] || 0}</td></tr>`).join('')}</table></div>
    <p>Your party ${d.seats[S.pm.role] >= d.prev ? 'gains' : 'loses'} ${Math.abs(d.seats[S.pm.role] - d.prev)} seats. ${d.detail} seats were won by under 3 points.</p>
    ${d.kept.length || d.broken.length ? `<p class="small">Pledges kept: ${d.kept.map(pledgeName).join('; ') || 'none'}. Broken: ${d.broken.map(pledgeName).join('; ') || 'none'}.</p>` : ''}
    <div class="sheet-f"><button class="btn primary" data-close>Continue</button></div>`;
}
function hungHtml() {
  const mine = S.seats[S.pm.role], ld = S.seats.LD || 0;
  const canCoal = mine + ld >= 326;
  return `<p class="kicker">Hung parliament</p><h2>You are ${326 - mine} seats short</h2>
    <p>The ${esc(S.parties.LD.name)} has ${ld} MPs. They want a referendum on electoral reform as the price of a coalition.</p>
    <div class="choices">
      <button class="choice" data-hung="coalition" ${canCoal ? '' : 'disabled'}><strong>Form a coalition</strong><span>${canCoal ? `Gives you ${mine + ld} seats. Your party will be uneasy.` : 'Not enough seats between you.'}</span></button>
      <button class="choice" data-hung="minority"><strong>Govern as a minority</strong><span>Every vote is a fight. Confidence votes are a risk.</span></button>
    </div>`;
}
function gameOverHtml(d) {
  const yrs = S.week / 52;
  return `<p class="kicker">The end</p><h2>${esc(d.reason === 'election' ? 'Defeated at the ballot box' : d.reason === 'challenge' ? 'Ousted by your party' : d.reason === 'confidence' ? 'Brought down in the Commons' : 'You leave Downing Street')}</h2>
    <p>${esc(d.text)}</p>
    <dl class="legacy"><div><dt>Time in office</dt><dd>${f1(yrs)} years</dd></div><div><dt>Elections won</dt><dd>${S.stats.electionsWon}</dd></div><div><dt>Acts passed</dt><dd>${S.passed.length}</dd></div>
    <div><dt>Debt</dt><dd>${f0(S.econ.debt / S.econ.gdp * 100)}% of GDP</dd></div><div><dt>NHS waiting list</dt><dd>${f1(waitList())}m</dd></div><div><dt>Legacy score</dt><dd>${legacyScore()}</dd></div></dl>
    <p class="muted">${legacyScore() > 90 ? 'Historians will rank you among the more consequential prime ministers.' : legacyScore() > 50 ? 'A solid, if unspectacular, premiership.' : 'A brief and troubled premiership.'}</p>
    <div class="sheet-f"><button class="btn primary" data-newgame>Start a new game</button></div>`;
}

function budgetHtml() {
  const b = ui.budget; const q = S.queue[0]; const emergency = q && q.data && q.data.emergency;
  const fc = forecast(b.tax, b.spend), base = forecast(S.tax, S.spend);
  const taxRows = [['basic', 'Income tax basic rate', '%', 1], ['higher', 'Income tax higher rate', '%', 1], ['additional', 'Income tax additional rate', '%', 1], ['ni', 'Employee National Insurance', '%', 1], ['niEr', 'Employer National Insurance', '%', 1], ['vat', 'VAT', '%', 1], ['corp', 'Corporation tax', '%', 1], ['fuel', 'Fuel duty', 'p/litre', 1]];
  const rv1 = revenueBreakdown(b.tax), rv0 = revenueBreakdown(S.tax);
  const dist = Object.keys(GROUPS).map(g => [g, taxScore(g, b.tax) - taxScore(g, S.tax)]);
  const warn = [];
  if (S.pm.pledges.includes('no_income_tax') && (b.tax.basic > S.tax.basic || b.tax.higher > S.tax.higher || b.tax.additional > S.tax.additional)) warn.push('Breaks your pledge on income tax.');
  if (S.pm.pledges.includes('no_vat') && b.tax.vat > S.tax.vat) warn.push('Breaks your pledge on VAT.');
  if (S.pm.pledges.includes('no_ni') && b.tax.ni > S.tax.ni) warn.push('Breaks your pledge on National Insurance.');
  if (fc.defPct[0] - base.defPct[0] > .5) warn.push(`Adds ${f1(fc.defPct[0] - base.defPct[0])} points of GDP to borrowing. Expect markets to react.`);
  if (fc.debtPct[4] >= fc.debtPct[3]) warn.push('Debt is not falling in year five. The fiscal rule is broken.');
  const yrs = S.week / 52;
  return `<p class="kicker">HM Treasury · ${esc(b.kind)}</p><h2>${esc(b.kind)} ${md(S.week).y}</h2>
  <div class="budget">
    <div class="b-col">
      <h3>Taxes</h3>
      ${taxRows.map(([k, n, u, st]) => `<div class="b-row"><label for="t_${k}">${n}</label><div class="stepper"><button data-t="${k}" data-d="-${st}" aria-label="Lower ${n}">−</button><input id="t_${k}" inputmode="decimal" value="${k === 'fuel' ? f2(b.tax[k]) : b.tax[k]}" data-tin="${k}"><button data-t="${k}" data-d="${st}" aria-label="Raise ${n}">+</button></div><span class="unit">${u}</span><span class="delta ${b.tax[k] !== S.tax[k] ? '' : 'muted'}">${b.tax[k] !== S.tax[k] ? signed(b.tax[k] - S.tax[k], k === 'fuel' ? 2 : 0) : 'no change'}</span></div>`).join('')}
      <p class="small muted">Tax receipts ${bn(rv1.total)} (${signed(rv1.total - rv0.total)}bn).</p>
    </div>
    <div class="b-col">
      <h3>Departmental spending, £bn a year</h3>
      ${Object.keys(DEPTS).map(d => { const need = BASE_SPEND[d] * Math.pow(1 + NEED_GROWTH[d], yrs + 1) * S.econ.price * (1 + S.econ.inflation / 100); const real = (b.spend[d] / need - 1) * 100;
        return `<div class="b-row"><label for="s_${d}">${DEPTS[d].name}</label><div class="stepper"><button data-s="${d}" data-d="-1" aria-label="Cut ${DEPTS[d].name}">−</button><input id="s_${d}" inputmode="decimal" value="${f1(b.spend[d])}" data-sin="${d}"><button data-s="${d}" data-d="1" aria-label="Increase ${DEPTS[d].name}">+</button></div><span class="unit">bn</span><span class="delta ${real < -2 ? 'bad' : real > 2 ? 'good' : 'muted'}">${signed(real)}% vs demand</span></div>`; }).join('')}
      <button class="btn small" id="uprate">Uprate all departments for inflation and demand</button>
    </div>
  </div>
  <div class="b-sum">
    <div><h3>OBR forecast</h3><table class="tbl fc"><thead><tr><th></th>${fc.def.map((_, i) => `<th class="num">${md(S.week).y + i + 1}</th>`).join('')}</tr></thead>
      <tr><td>Borrowing % GDP</td>${fc.defPct.map(v => `<td class="num">${f1(v)}</td>`).join('')}</tr>
      <tr><td>Debt % GDP</td>${fc.debtPct.map(v => `<td class="num">${f1(v)}</td>`).join('')}</tr></table></div>
    <div><h3>Who gains, who loses</h3><ul class="dist">${dist.map(([g, v]) => `<li><span>${GROUPS[g].name}</span><span class="${v > .05 ? 'good' : v < -.05 ? 'bad' : 'muted'}">${v > .05 ? 'Better off' : v < -.05 ? 'Worse off' : 'No change'}</span></li>`).join('')}</ul></div>
  </div>
  ${warn.length ? `<ul class="warnings">${warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
  <div class="sheet-f">${emergency ? '<button class="btn" data-bcancel>Cancel</button>' : '<button class="btn" data-bkeep>Keep everything as it is</button>'}<button class="btn primary" data-present>Present the budget</button></div>`;
}

function closeTop() { S.queue.shift(); save(); render(); }
function showOutcome(title, body, kicker) { S.queue.shift(); S.queue.unshift({ type: 'outcome', data: { title, body, kicker } }); save(); render(); }

function bindModal() {
  const box = $('#modal');
  const on = (sel, fn) => box.querySelectorAll(sel).forEach(el => el.addEventListener('click', () => fn(el)));
  on('[data-cancel]', () => { const t = transient; transient = null; if (t && t.cancel) t.cancel(); else renderModal(); });
  on('[data-ok]', () => { const t = transient; transient = null; t.fn(); renderModal(); });
  on('[data-mode]', el => { const id = transient.intro; transient = null; introduceBill(id, el.dataset.mode); save(); render(); });
  on('[data-close]', () => closeTop());
  on('[data-newgame]', () => wipe());
  on('[data-opt]', el => {
    const q = S.queue[0]; const ev = EVENTS.find(e => e.id === q.data.id) || SPECIAL_EVENTS[q.data.id];
    const o = ev.opts[+el.dataset.opt]; const txt = o.f(); news(`${ev.title}: ${txt}`);
    showOutcome(ev.title, txt, ev.cat);
  });
  on('[data-sc]', el => {
    const q = S.queue[0], p = S.people.find(x => x.id === q.data.id), a = el.dataset.sc; let txt;
    if (a === 'back') { if (chance(.5)) { p.loyal = clamp(p.loyal + 2, 1, 10); G.stat('heat', 1); txt = `The story fades. ${p.name} is grateful.`; } else { G.stat('heat', 4); G.stat('media', -4); G.gw({ all: -1 }); txt = 'More revelations follow. You look weak for defending them.'; } }
    else if (a === 'probe') { if (chance(.55)) { txt = `${p.name} is cleared after three weeks.`; G.stat('heat', 1); } else { G.sack(p.id, true); G.stat('heat', 2); txt = `The adviser finds a breach. ${p.name} resigns.`; } }
    else { G.sack(p.id, true); G.stat('media', 2); G.unity(-p.profile * .3); txt = `${p.name} is out. You look decisive.`; }
    news(txt); showOutcome('Scandal', txt, 'Ministerial scandal');
  });
  on('[data-pmq]', el => { const q = S.queue[0]; const r = resolvePmqs(q.data, el.dataset.pmq); showOutcome(r.won ? 'A good day at the despatch box' : 'A rough session', r.text, 'Prime Minister’s Questions'); });
  on('[data-lords]', el => {
    const q = S.queue[0], bl = S.bills.find(x => x.id === q.data.id);
    if (bl) { if (el.dataset.lords === 'accept') { bl.k *= .75; bl.stage = 'assent'; bl.left = 1; } else { bl.left = 4; bl.lordsDone = true; } }
    closeTop();
  });
  on('[data-ch]', el => {
    const q = S.queue[0], p = S.people.find(x => x.id === q.data.id);
    if (el.dataset.ch === 'quit') { S.queue.shift(); endGame('challenge', `${S.pm.name} resigned rather than face a confidence vote. ${p.name} becomes Prime Minister.`); save(); render(); return; }
    const support = clamp(.35 + S.unity / 150 + S.approval / 200, .05, .95);
    const votes = Math.round(S.seats[S.pm.role] * clamp(support + gauss() * .06, 0, 1));
    if (votes > S.seats[S.pm.role] / 2) { G.unity(12); G.sack(p.id, true); p.ambition = 3; S.lastChallenge = S.week; showOutcome('You survive', `You win the confidence vote by ${votes} to ${S.seats[S.pm.role] - votes}. ${p.name} is finished, for now.`, 'Leadership crisis'); }
    else { S.queue.shift(); endGame('challenge', `You lost the confidence vote ${votes} to ${S.seats[S.pm.role] - votes}. ${p.name} becomes Prime Minister.`); save(); render(); }
  });
  on('[data-conf]', () => {
    const forced = S.queue[0].data.forced;
    let ayes = 650 - govSeats() - 7 - (S.seats.NI ? 3 : 0); let noes = govSeats();
    if (S.govType === 'minority' && !S.partner) noes += Math.round((S.seats.LD || 0) * (S.approval > 30 ? .4 : .1));
    if (forced) ayes -= Math.round(S.seats[S.pm.role] * .02);
    if (noes >= ayes) { G.unity(4); showOutcome('Government survives', `The motion is defeated by ${noes} votes to ${ayes}.`, 'Vote of no confidence'); }
    else { S.queue.shift(); news(`The government loses a vote of no confidence by ${ayes} to ${noes}.`, 'bad'); startCampaign(true); save(); render(); }
  });
  on('[data-camp]', el => { const t = campaignChoice(el.dataset.camp); showOutcome('Campaign trail', t, 'General election campaign'); });
  on('[data-deb]', el => {
    S.campaign.debate = true; const a = el.dataset.deb; let x;
    if (a === 'calm') x = .3 + gauss() * .4; else if (a === 'attack') x = gauss() * 1.4 + (50 - S.oppLeader) / 40; else x = (S.trust - 50) / 15 + gauss() * .6;
    S.campaign.boost += clamp(x, -2, 2.5);
    showOutcome('The debate', x > .5 ? 'Snap polls say you won the debate.' : x < -.3 ? 'Snap polls give it to your opponent.' : 'Snap polls call it a draw.', 'Leaders’ debate');
  });
  on('[data-hung]', el => {
    if (el.dataset.hung === 'coalition') { S.partner = 'LD'; S.govType = 'coalition'; G.unity(-6); news(`${S.pm.name} forms a coalition with the ${S.parties.LD.name}.`, 'neutral'); }
    else { S.partner = null; S.govType = 'minority'; news(`${S.pm.name} will lead a minority government.`, 'neutral'); }
    closeTop();
  });
  // budget
  const tin = (k, v) => { const lim = { basic: [10, 35], higher: [25, 60], additional: [30, 70], ni: [0, 16], niEr: [5, 25], vat: [5, 30], corp: [10, 40], fuel: [30, 90] }[k]; ui.budget.tax[k] = clamp(Math.round(v * 100) / 100, lim[0], lim[1]); };
  const sin = (d, v) => { ui.budget.spend[d] = clamp(Math.round(v * 10) / 10, S.spend[d] * .7, S.spend[d] * 1.5); };
  on('[data-t]', el => { tin(el.dataset.t, ui.budget.tax[el.dataset.t] + +el.dataset.d); renderModal(); });
  on('[data-s]', el => { sin(el.dataset.s, ui.budget.spend[el.dataset.s] + +el.dataset.d); renderModal(); });
  box.querySelectorAll('[data-tin]').forEach(i => i.addEventListener('change', () => { const v = parseFloat(i.value); if (!isNaN(v)) tin(i.dataset.tin, v); renderModal(); }));
  box.querySelectorAll('[data-sin]').forEach(i => i.addEventListener('change', () => { const v = parseFloat(i.value); if (!isNaN(v)) sin(i.dataset.sin, v); renderModal(); }));
  const up = $('#uprate', box); if (up) up.addEventListener('click', () => { const yrs = S.week / 52; for (const d in DEPTS) { const need = BASE_SPEND[d] * Math.pow(1 + NEED_GROWTH[d], yrs + 1) * S.econ.price * (1 + S.econ.inflation / 100); sin(d, Math.max(ui.budget.spend[d], need)); } renderModal(); });
  on('[data-bcancel]', () => { ui.budget = null; S.queue.shift(); render(); });
  on('[data-bkeep]', () => { ui.budget = null; S.queue.shift(); news('The Chancellor leaves taxes and spending unchanged.'); save(); render(); });
  on('[data-present]', () => {
    const q = S.queue[0]; if (q.data.emergency) G.stat('credibility', -4);
    const r = presentBudget();
    showOutcome('Budget presented', `${r.verdict} Borrowing is forecast at ${f1(r.after.defPct[0])}% of GDP, with debt at ${f1(r.after.debtPct[4])}% in five years.`, 'HM Treasury');
  });
}

/* ---------- boot ---------- */
document.addEventListener('keydown', e => {
  if (e.key === 'n' && !e.target.closest('input,select,textarea') && S && !S.queue.length && !transient && !ui.budget) advance();
});
if (!load()) S = null;
render();
window.NT = { get S() { return S; }, advance, newGame, render, runSeats, forecast };
