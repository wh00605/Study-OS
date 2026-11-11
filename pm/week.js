/* Number Ten: the weekly loop. One issue a week, the player's own written response,
   then the country reacts: briefing, focus group, map, opposition, party, markets, press.
   Loaded before game.js; everything here runs only after the game has booted. */
'use strict';

const PERSONAS = [
  { id: 'pat', name: 'Pat', age: 71, job: 'retired nurse', place: 'Grimsby', g: 'pensioners', lean: .25, flav: 'on my pension' },
  { id: 'dev', name: 'Dev', age: 34, job: 'warehouse shift lead', place: 'Wolverhampton', g: 'working', lean: .1, flav: 'on twelve-hour shifts' },
  { id: 'hannah', name: 'Hannah', age: 41, job: 'solicitor', place: 'Guildford', g: 'middle', lean: .15, flav: 'with two kids and a mortgage' },
  { id: 'kieran', name: 'Kieran', age: 23, job: 'barista and student', place: 'Leeds', g: 'young', lean: -.45, flav: 'paying £850 a month for a box room' },
  { id: 'bernie', name: 'Bernadette', age: 52, job: 'primary school teacher', place: 'Swansea', g: 'public', lean: -.35, flav: 'with 32 kids in my class' },
  { id: 'raj', name: 'Raj', age: 47, job: 'runs a printing firm', place: 'Reading', g: 'business', lean: .35, flav: 'with fourteen staff to pay' },
  { id: 'morag', name: 'Morag', age: 63, job: 'sheep farmer', place: 'Perthshire', g: 'pensioners', lean: .4, flav: 'up here' },
  { id: 'tyrone', name: 'Tyrone', age: 29, job: 'electrician', place: 'Croydon', g: 'working', lean: -.1, flav: 'out on site every day' }
];
const QUOTE_BANDS = {
  love: ['Finally. {flav}, this is what I have been waiting years for.', 'Best thing I have heard from Westminster in a long time. I mean that.', 'If they actually do this, they have got my vote.'],
  like: ['Sounds sensible. {flav}, I would notice the difference if they deliver.', 'Not bad. I want to see the detail, but it is a start.', 'Fair enough. Better than what we had.'],
  mixed: ['Heard it all before. I will judge them on what changes {flav}.', 'Some of it is fine, but who is paying for it?', 'It does not do much for me either way.'],
  dislike: ['Does nothing for me {flav}. Feels like it is for someone else.', 'I do not trust it. Smells like a headline, not a plan.', 'Wrong priorities. There are bigger problems than this.'],
  hate: ['You are having a laugh. {flav}, this makes my life harder.', 'Out of touch. Completely out of touch.', 'This is exactly why people have given up on politicians.']
};
const TOPIC_LABELS = { income: 'income tax', vat: 'VAT', ni: 'National Insurance', corp: 'corporation tax', wealth: 'wealth tax', iht: 'inheritance tax', cgt: 'capital gains', fuel: 'fuel duty', councilTax: 'council tax', stamp: 'stamp duty', windfall: 'windfall tax', waits: 'NHS waiting list', nhs: 'NHS', care: 'social care', mental: 'mental health', meals: 'school meals', tuition: 'tuition fees', school: 'schools', unis: 'universities', childcare: 'childcare', police: 'policing', prisons: 'crime', death: 'death penalty', migration: 'immigration', rentcontrol: 'rent control', rents: 'renters', greenbelt: 'green belt', housing: 'housing', planning: 'planning', netzero: 'net zero', fossil: 'oil and gas', nuclear: 'nuclear', bills: 'energy bills', water: 'water', defence: 'defence', nationalservice: 'national service', aid: 'foreign aid', pension: 'pensions', pensionage: 'pension age', benefits: 'welfare', minwage: 'minimum wage', fourday: 'four-day week', ubi: 'basic income', unions: 'workers\' rights', nationalise: 'nationalisation', privatise: 'privatisation', transport: 'transport', eu: 'Europe', echr: 'human rights', redtape: 'red tape', smallbiz: 'small business', drugs: 'drugs', smoking: 'smoking', socialmedia: 'social media', monarchy: 'monarchy', lords: 'Lords', pr: 'voting reform', votes16: 'votes at 16', indyref: 'independence', tech: 'technology', digitalid: 'digital ID', sugar: 'sugar tax', gambling: 'gambling', pensionage2: 'pensions' };

/* Issues raised when no crisis is pressing: whatever is going worst. */
const DYN_ISSUES = [
  { id: 'dyn_health', k: 'health', cat: 'Health', title: S => `NHS waiting list hits ${f1(waitList())} million`,
    text: S => `${f1(waitList())} million people are waiting for treatment and ${aePct()}% of A&E patients are seen within four hours. The Health Secretary wants a plan announced this week.`,
    sugg: ['Fund 40,000 extra operations a year using spare private hospital capacity.', 'Raise NHS spending by £5bn a year, paid for by a 1p rise in National Insurance.', 'Set up community diagnostic centres in every town to cut waiting times.'] },
  { id: 'dyn_col', k: 'col', cat: 'Treasury', title: S => `Inflation at ${f1(S.econ.inflation)}% squeezes families`,
    text: S => `Prices are rising ${f1(S.econ.inflation)}% a year and Bank Rate is ${f2(S.econ.rate)}%. Food banks report record demand. Backbenchers want help for households.`,
    sugg: ['Cut fuel duty by 5p a litre for a year.', 'Give low-income households £300 off their energy bills this winter.', 'Freeze rail fares and cap bus fares at £2.'] },
  { id: 'dyn_housing', k: 'housing', cat: 'Housing', title: S => `Only ${f0(homes())},000 homes built this year`,
    text: S => `House building is at ${f0(homes())},000 a year against a need of 300,000. Average rents are up 8% and first-time buyers are in their mid-thirties.`,
    sugg: ['Build 100,000 council homes a year, funded by borrowing for investment.', 'Reform planning to override local objections to new housing.', 'Introduce rent controls and ban no-fault evictions.'] },
  { id: 'dyn_migration', k: 'immigration', cat: 'Home Office', title: S => `Net migration running at ${f0(S.econ.migration)},000`,
    text: S => `Net migration is ${f0(S.econ.migration)},000 a year. ${S.parties.P.name} is up in the polls and your MPs in marginal seats are nervous.`,
    sugg: ['Raise the skilled worker salary threshold and end most dependant visas.', 'Train more British workers in health and construction to reduce reliance on overseas recruitment.', 'Agree a returns deal with France to cut small boat crossings.'] },
  { id: 'dyn_crime', k: 'crime', cat: 'Home Office', title: S => `Only ${f1(chargeRate())}% of crimes lead to a charge`,
    text: S => `Shoplifting is at a record high and only ${f1(chargeRate())}% of crimes end with a charge. The Police Federation says forces are overstretched.`,
    sugg: ['Fund 13,000 neighbourhood police officers.', 'Make assaulting a shop worker a specific offence with tougher sentences.', 'Build 10,000 new prison places.'] },
  { id: 'dyn_economy', k: 'economy', cat: 'Treasury', title: S => `Growth stalls at ${f1(S.econ.growth)}%`,
    text: S => `The economy is growing at ${f1(S.econ.growth)}% a year and business investment is weak. The CBI wants a growth plan.`,
    sugg: ['Cut business rates for high-street shops.', 'Create a £10bn national wealth fund to invest in green industry.', 'Cut red tape and speed up planning for infrastructure.'] },
  { id: 'dyn_env', k: 'environment', cat: 'Energy', title: S => `Britain off track on net zero`,
    text: S => `Emissions are ${f0(emissions())}% below 1990 levels. The Climate Change Committee says the country will miss its next carbon budget.`,
    sugg: ['Insulate 5 million homes over the next decade.', 'Ban new oil and gas licences in the North Sea.', 'Approve a new fleet of small nuclear reactors.'] },
  { id: 'dyn_pay', k: 'pay', cat: 'Treasury', title: S => `Public sector pay falls behind`,
    text: S => `Nurses and teachers have lost ${f1(Math.max(0, 100 - S.econ.pubPay))}% in real pay since you took office. Unions are talking about ballots.`,
    sugg: ['Give public sector workers a 5% pay rise.', 'Offer 3% now and a review linking pay to productivity.', 'Hold pay and invest in recruitment instead.'] },
  { id: 'dyn_schools', k: 'education', cat: 'Education', title: S => `Schools warn of teacher shortages`,
    text: S => `Only ${f1(gcse())}% of pupils pass English and maths GCSE. Heads say recruitment is in crisis and SEND budgets are overspent.`,
    sugg: ['Recruit 6,500 new teachers with a £6,000 retention bonus.', 'Fund SEND support properly with an extra £2bn a year.', 'Free breakfast clubs in every primary school.'] }
];

/* ---------- issue of the week ---------- */
function issueDef(iss) {
  if (!iss) return null;
  if (iss.kind === 'dyn') return DYN_ISSUES.find(d => d.id === iss.id);
  return EVENTS.find(e => e.id === iss.id) || SPECIAL_EVENTS[iss.id];
}
function lexHits(text) {
  const t = (text || '').toLowerCase();
  return POLICY_LEX.filter(L => L.re.test(t)).map(L => L.id);
}
function newIssue() {
  if (S.campaign) { S.issue = null; return; }
  let iss = null;
  const forced = (S.issueQ || []).shift();
  if (forced) iss = { kind: 'event', id: forced };
  else if (chance(.65)) { const ev = pickEvent(); if (ev) { S.cool[ev.id] = S.week; iss = { kind: 'event', id: ev.id }; } }
  if (!iss) {
    const I = issues();
    const ranked = DYN_ISSUES.map(d => ({ d, v: (d.k === 'col' ? I.col : I[d.k] ?? 0) + gauss() * .35 - ((S.week - (S.cool[d.id] ?? -99)) < 10 ? 5 : 0) })).sort((a, b) => a.v - b.v);
    iss = { kind: 'dyn', id: ranked[0].d.id }; S.cool[ranked[0].d.id] = S.week;
  }
  const def = issueDef(iss);
  iss.title = typeof def.title === 'function' ? def.title(S) : def.title;
  iss.text = def.text(S);
  iss.cat = def.cat;
  iss.sugg = def.sugg || (def.opts || []).map(o => o.t + (o.h ? ` (${o.h.replace(/^[A-Z]/, c => c.toLowerCase())})` : '') + '.');
  iss.tags = lexHits(iss.title + ' ' + iss.text + ' ' + iss.sugg.join(' '));
  iss.w = S.week; iss.resolved = false;
  S.issue = iss;
}
function ignoredIssue() {
  const iss = S.issue;
  if (!iss || iss.resolved) return;
  G.stat('media', -2); G.gw({ all: -.4 });
  if (iss.k === 'health' || iss.cat === 'Health') G.svc('health', -1);
  news(`Critics attack the government's silence on: ${iss.title}.`, 'bad');
}

/* ---------- the built-in assessment, used when Claude is not available ---------- */
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function optionMatch(text, def) {
  if (!def || !def.opts) return -1;
  const stem = w => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5);
  const mine = new Set(text.split(/\s+/).map(stem).filter(w => w.length >= 4));
  let best = -1, bestN = 1;
  def.opts.forEach((o, i) => {
    const words = new Set((o.t + ' ' + (o.h || '')).split(/\s+/).map(stem).filter(w => w.length >= 4 && !['their', 'about', 'with', 'from', 'existing', 'within'].includes(w)));
    let n = 0; for (const w of words) if (mine.has(w)) n++;
    if (n > bestN) { bestN = n; best = i; }
  });
  return best;
}
function personaScore(p, groups, ideo, seed) {
  const r = mulberry(hashStr(p.id + seed))();
  return clamp(Math.round(50 + (groups[p.g] || 0) * 4.5 + (10 - Math.abs(p.lean - ideo) * 14) - 4 + (r - .5) * 16), 2, 98);
}
function band(sc) { return sc >= 75 ? 'love' : sc >= 58 ? 'like' : sc >= 42 ? 'mixed' : sc >= 25 ? 'dislike' : 'hate'; }
function fallbackReactions(fx, ideo, topic, seed, cost) {
  const groups = fx.groups || {};
  const focus = PERSONAS.map(p => {
    const score = personaScore(p, groups, ideo, seed);
    const lines = QUOTE_BANDS[band(score)];
    const q = lines[hashStr(p.id + seed) % lines.length].replace('{flav}', p.flav).replace(/(^|[.!?]\s+)([a-z])/g, (m, a2, c) => a2 + c.toUpperCase());
    return { id: p.id, score, quote: q };
  });
  const opp = oppList().map(p => {
    const d = Math.abs(ideo - PARTY_IDEO[p]);
    const pool = d < .35 ? ['We have been calling for this for months. Welcome, if overdue.', 'We will support this, but the government should have acted sooner.']
      : d < .7 ? [`A half-baked ${topic} announcement with no detail on who pays.`, 'Too little, too late, and badly thought through.']
      : [`Another ${topic} gimmick from a government that has run out of ideas.`, 'Working people will pay the price for this.', 'Uncosted, unworkable and unfair. We will vote against it.'];
    return { party: p, quote: pool[hashStr(p + seed) % pool.length] };
  });
  const facs = FACTIONS[S.pm.role] || FACTIONS.L;
  const back = facs.map((name, i) => {
    const fi = clamp(S.pm.ideo + FACTION_SHIFT[i], -1, 1);
    const mood = clamp(Math.round(72 - Math.abs(ideo - fi) * 85 + (fx.unity || 0) * 3), 5, 95);
    const q = mood >= 65 ? 'This is what we came into politics to do.' : mood >= 45 ? 'We can live with it, but we will be watching the detail.' : mood >= 25 ? 'This is not what we were elected on. Colleagues are uneasy.' : 'This is a betrayal. Some of us will not vote for it.';
    return { wing: name, mood, quote: q };
  });
  const cred = fx.cred || 0;
  const markets = cred <= -4 ? 'Gilt yields jump as investors question how it will be paid for.' : cost > 10 ? 'The City asks where the money is coming from. Gilts edge lower.' : cred >= 2 ? 'Markets welcome the fiscal discipline.' : 'Markets barely notice.';
  const fav = focus.reduce((a, f) => a + f.score, 0) / focus.length;
  const sur = S.pm.name.split(' ').pop();
  const headline = fav >= 62 ? `${sur} wins praise for ${topic} plan` : fav >= 45 ? `${topic.replace(/^\w/, c => c.toUpperCase())} plan splits opinion` : fav >= 30 ? `Backlash over PM's ${topic} plan` : `${sur}'s ${topic} fiasco`;
  return { focus, opp, back, markets, headline };
}
function oppList() {
  const opp = mainOpp();
  return [opp, ...['R', 'L', 'LD', 'P', 'G'].filter(p => p !== opp && p !== S.pm.role && p !== S.partner && (S.seats[p] || 0) > 0).slice(0, 2)];
}
function modelAnnounce(title, text) {
  const a = modelAssess(title, text);
  const iss = S.issue, def = issueDef(iss);
  const hits = lexHits(title + ' ' + text);
  const opt = iss && !iss.resolved ? optionMatch(title + ' ' + text, def) : -1;
  const addresses = !!iss && (opt >= 0 || hits.some(h => iss.tags.includes(h)));
  const cost = fxCost(a.fx);
  const legislation = !!hits.length && (a.contro >= 1 || Math.abs(cost) >= 4 || (a.fx.breaks || []).length > 0 || !!a.fx.flag || Math.abs(a.fx.revenue) > 2 || hits.some(h => ['income', 'vat', 'ni', 'corp', 'wealth', 'iht', 'echr', 'eu', 'monarchy', 'lords', 'pr', 'votes16', 'nationalise', 'death', 'minwage', 'drugs', 'rentcontrol', 'unions'].includes(h)));
  const topic = TOPIC_LABELS[hits[0]] || (iss ? iss.cat.toLowerCase() : 'policy');
  const fb = fallbackReactions(a.fx, a.ideo, topic, title + text + S.week, cost);
  const risk = !hits.length ? 'Officials cannot tell what this would change.' : a.contro >= 2 ? 'Deeply divisive. Expect a fight in Parliament and the courts.' : cost > 10 ? 'The cost is large and unfunded measures will worry markets.' : a.contro >= 1 ? 'Some of your MPs and peers will resist.' : 'Low delivery risk.';
  const rec = !hits.length ? 'Do not proceed' : (a.fx.cred || 0) <= -4 || a.contro >= 2.2 ? 'Proceed with caution' : 'Proceed';
  const winners = Object.entries(a.fx.groups || {}).filter(([, v]) => v > 1).map(([g]) => GROUPS[g].name).join(', ') || 'No clear winners';
  const losers = Object.entries(a.fx.groups || {}).filter(([, v]) => v < -1).map(([g]) => GROUPS[g].name).join(', ') || 'No clear losers';
  return {
    by: 'model', addresses, legislation, opt, name: a.name, summary: text.slice(0, 300) || title, dept: a.dept, ideo: a.ideo, contro: a.contro, fx: a.fx,
    briefing: { cost: cost > .05 ? `About ${bn(cost)} a year` : cost < -.05 ? `Raises about ${bn(-cost)} a year` : (a.fx.oneOff ? `${bn(a.fx.oneOff)} one-off` : 'Little or no direct cost'), risk, recommendation: rec, winners, losers, notes: a.notes },
    ...fb
  };
}

/* ---------- Claude assessment ---------- */
async function claudeAnnounce(title, text, signal) {
  const iss = S.issue;
  const opp = oppList();
  const facs = FACTIONS[S.pm.role] || FACTIONS.L;
  const prompt = `You run a realistic UK prime minister simulation game. The player is the Prime Minister and has just announced a policy. Assess it the way the OBR, the IFS, pollsters and political journalists would, then voice the reactions.

GAME STATE (${dstr(S.week)}): The PM, ${S.pm.name}, leads ${theName(S.pm.role)} (ideology ${f2(S.pm.ideo)} on a -1 left to +1 right scale) with ${govSeats()} of 650 MPs. Approval ${f0(S.approval)}%. Growth ${f1(S.econ.growth)}%, inflation ${f1(S.econ.inflation)}%, unemployment ${f1(S.econ.unemp)}%, Bank Rate ${f2(S.econ.rate)}%. Borrowing ${f1(S.econ.deficit / S.econ.gdp * 100)}% of GDP, debt ${f0(S.econ.debt / S.econ.gdp * 100)}%. NHS waiting list ${f1(waitList())} million. Net migration ${f0(S.econ.migration)},000. Manifesto pledges: ${S.pm.pledges.join(', ') || 'none'}.
THIS WEEK'S ISSUE: ${iss ? `${iss.title}. ${iss.text}` : 'none'}

THE PM'S ANNOUNCEMENT:
Title: "${title.slice(0, 120)}"
Text: "${text.slice(0, 1500)}"

FOCUS GROUP: ${PERSONAS.map(p => `${p.id} = ${p.name}, ${p.age}, ${p.job}, ${p.place}`).join('; ')}.
OPPOSITION LEADERS: ${opp.map(p => `${p} = ${S.leaders[p]} (${S.parties[p].name})`).join('; ')}.
THE PM'S PARTY WINGS: ${facs.join(', ')}.

Reply with only one JSON object:
{"addresses_issue": true if this is a response to this week's issue,
 "legislation": true if it needs an Act of Parliament (tax changes, new legal powers, big structural reforms), false if ministers can just do it,
 "name": formal UK bill title ending in "Bill" if legislation, else a short title,
 "summary": one plain sentence,
 "dept": lead department, "ideo": -1..1, "contro": 0..3 (how much it splits MPs and peers),
 "fx": {"spend": {"health","education","welfare","defence","police","transport","housing","environment","other": extra £bn a year, negative for cuts},
   "revenue": £bn a year raised, "oneOff": £bn borrowed once, "potential": trend growth points -0.6..0.6, "unemp": -1..1, "infl": -1.5..1.5, "migT": thousands a year,
   "svc": {"health","education","crime","housing","environment","defence","transport": -25..25}, "groups": {"pensioners","working","middle","young","public","business": -15..15},
   "conf": -12..12, "cred": gilt market credibility -12..12, "intl": -12..12, "unity": the PM's own party -10..10, "media": -6..6, "breaks": any of [no_income_tax, no_vat, no_ni, triple]},
 "briefing": {"cost": costing in plain words with £ figures, "risk": one sentence, "recommendation": "Proceed" or "Proceed with caution" or "Do not proceed", "winners": short phrase, "losers": short phrase, "notes": [2 to 4 short sentences from officials]},
 "focus": [one {"id", "score": 0-100 favourability, "quote": what they say, at most 30 words, in their own everyday British voice} for each focus group member],
 "opp": [one {"party", "quote": at most 25 words, an in-character political reaction} for each opposition leader],
 "back": [one {"wing", "mood": 0-100, "quote": at most 20 words} for each wing],
 "markets": one sentence on the gilt and currency reaction,
 "headline": a newspaper front-page headline}
Be realistic: unfunded giveaways cost credibility, popular policies can still split the party, vague announcements get little credit. Only include fx fields that change. Quotes must be political reactions, not claims about anyone's private life.`;
  const r = await SAMPLE.json(prompt, { modelTier: 'default', signal });
  const base = sanitizeFx(r);
  const pers = Array.isArray(r.focus) ? r.focus : [];
  const focus = PERSONAS.map(p => { const f = pers.find(x => x && x.id === p.id) || {}; return { id: p.id, score: clamp(Math.round(Number(f.score) || 50), 0, 100), quote: String(f.quote || '…').slice(0, 220) }; });
  const oq = Array.isArray(r.opp) ? r.opp : [];
  const oppOut = opp.map(p => ({ party: p, quote: String((oq.find(x => x && x.party === p) || oq[opp.indexOf(p)] || {}).quote || 'No comment.').slice(0, 200) }));
  const bq = Array.isArray(r.back) ? r.back : [];
  const back = facs.map((w, i) => { const b = bq.find(x => x && x.wing === w) || bq[i] || {}; return { wing: w, mood: clamp(Math.round(Number(b.mood) || 50), 0, 100), quote: String(b.quote || '').slice(0, 160) }; });
  const br = r.briefing || {};
  const def = issueDef(iss);
  return {
    by: 'claude', addresses: !!r.addresses_issue && !!iss, legislation: !!r.legislation, opt: -1,
    name: base.name || title || 'Government Bill', summary: base.summary || text.slice(0, 300), dept: base.dept, ideo: base.ideo, contro: base.contro, fx: base.fx,
    briefing: { cost: String(br.cost || '').slice(0, 200), risk: String(br.risk || '').slice(0, 240), recommendation: String(br.recommendation || 'Proceed with caution').slice(0, 40), winners: String(br.winners || '').slice(0, 120), losers: String(br.losers || '').slice(0, 120), notes: (Array.isArray(br.notes) ? br.notes : []).slice(0, 4).map(x => String(x).slice(0, 240)) },
    focus, opp: oppOut, back, markets: String(r.markets || '').slice(0, 220), headline: String(r.headline || '').slice(0, 120), _def: !!def
  };
}

/* ---------- announcing ---------- */
function seatSupport(fav, ideo) {
  return SEATS.map((seat, i) => {
    if (seat.reg === 'Northern Ireland') return null;
    const right = Math.log((seat.m.R * seat.m.P) / (seat.m.L * seat.m.G)) / 2;
    const r = mulberry(hashStr(seat.name + S.week))();
    return { i, name: seat.name, reg: seat.reg, v: clamp(fav + 45 * (ideo - S.pm.ideo * .3) * right + (seat.reg === 'Scotland' ? -4 : 0) + (r - .5) * 10, 1, 99) };
  }).filter(Boolean);
}
async function announce() {
  const title = (ui.wTitle || '').trim(), text = (ui.wText || '').trim();
  if (!text && !title) { ui.wErr = 'Write what you want to announce first.'; render(); return; }
  if (S.announce) return;
  const ctl = new AbortController(); ui.wPending = ctl; ui.wErr = null; render();
  let a = null, note = null;
  if (SAMPLE) {
    try { a = await claudeAnnounce(title, text, ctl.signal); }
    catch (e) {
      if (e && e.code === 'cancelled') { ui.wPending = null; render(); return; }
      if (e && (e.code === 'not_granted' || e.code === 'sampling_disabled')) SAMPLE = null;
      note = 'Claude could not assess this, so the Treasury model did.';
    }
  }
  if (!a) a = modelAnnounce(title, text);
  ui.wPending = null;
  applyAnnouncement(a, title, text, note);
  ui.wTitle = ''; ui.wText = '';
  save(); render();
}
function applyAnnouncement(a, title, text, note) {
  const fx = a.fx, iss = S.issue, def = issueDef(iss);
  const before = { approval: S.approval, unity: S.unity, cred: S.econ.credibility, gw: { ...S.goodwill } };
  let outcome = null;
  // A built-in crisis response the player's words clearly match runs the scripted consequence.
  if (a.by === 'model' && a.opt >= 0 && def && def.opts) { outcome = def.opts[a.opt].f(); }
  const now = a.legislation ? .3 : .45;
  if (!outcome) {
    const g = {}; for (const k in fx.groups || {}) g[k] = fx.groups[k] * now; G.gw(g);
    if (fx.media) G.stat('media', fx.media);
    if (fx.unity) G.unity(fx.unity);
    if (fx.intl) G.stat('intl', fx.intl);
    if (fx.cred) G.stat('credibility', fx.cred);
    if (fx.conf) G.conf(fx.conf * .5);
    // The Treasury and the gilt market notice spending with no money behind it.
    const unfunded = fxCost(fx) + (fx.oneOff || 0) / 5;
    if (unfunded > 2) G.stat('credibility', -Math.min(6, (unfunded - 2) * .3));
  }
  let bill = null, wc = null;
  if (!outcome && a.legislation) {
    const rest = JSON.parse(JSON.stringify(fx)); for (const k in rest.groups || {}) rest.groups[k] *= .3;
    delete rest.media; delete rest.unity; delete rest.intl; delete rest.cred;
    bill = { id: 'w' + S.week + '_' + (S.custom.length + 1), name: /bill$/i.test(a.name) ? a.name : (a.name || title || 'Government') + ' Bill', dept: a.dept, ideo: a.ideo, contro: a.contro, desc: a.summary, fx: rest, notes: a.briefing.notes, custom: true };
    S.custom.push(bill);
    wc = whipCount(bill, 'normal');
    S.bills.push({ id: bill.id, mode: 'normal', stage: 'second', left: 2, k: 1, manifesto: false });
    S.lastBill = { id: bill.id, w: S.week };
  } else if (!outcome) {
    const exec = JSON.parse(JSON.stringify(fx)); delete exec.groups; delete exec.media; delete exec.unity; delete exec.intl; delete exec.cred;
    const svcNow = exec.svc || {}; delete exec.svc;
    applyFx(exec, 1);
    for (const k in svcNow) { G.svc(k, svcNow[k] * .4); S.mods.svc[k] += svcNow[k] * .6; }
  }
  if (a.addresses && iss) iss.resolved = true;
  // Projected approval movement from this announcement alone
  stepGroups(false); S.approval = nationalApproval();
  const gwDelta = {}; for (const g in GROUPS) gwDelta[g] = S.goodwill[g] - before.gw[g];
  let pub = 0; for (const g in GROUPS) pub += GROUPS[g].pop * gwDelta[g];
  const fav = a.focus.reduce((x, f) => x + f.score, 0) / a.focus.length;
  const seats = seatSupport(fav, a.ideo).sort((x, y) => y.v - x.v);
  const regions = {}; for (const s2 of seats) { (regions[s2.reg] = regions[s2.reg] || []).push(s2.v); }
  S.announce = {
    w: S.week, title: title || a.name, text, by: a.by, note, addresses: a.addresses, issueTitle: iss ? iss.title : null, outcome,
    legislation: !!bill, billId: bill && bill.id, whip: wc && { ayes: wc.ayes, noes: wc.noes, rebels: wc.rebels },
    briefing: a.briefing, ideo: a.ideo, cost: fxCost(fx), oneOff: fx.oneOff || 0, potential: fx.potential || 0, gwDelta, pub, fav,
    focus: a.focus, opp: a.opp, back: a.back, markets: a.markets, headline: a.headline,
    regions: Object.entries(regions).map(([r, v]) => [r, v.reduce((x, y) => x + y, 0) / v.length]).sort((x, y) => y[1] - x[1]),
    top: seats.slice(0, 5).map(x => [x.name, x.v]), bottom: seats.slice(-5).reverse().map(x => [x.name, x.v]),
    moves: { approval: S.approval - before.approval, unity: S.unity - before.unity, cred: S.econ.credibility - before.cred }
  };
  news(`${a.headline || S.announce.title}.`, fav >= 55 ? 'good' : fav < 40 ? 'bad' : 'neutral');
  if (outcome) news(`${iss.title}: ${outcome}`);
}

/* ---------- the This week page ---------- */
function moveChip(label, v, unit, good, d = 1) {
  const cls = Math.abs(v) < Math.pow(10, -d) / 2 ? 'muted' : (v > 0) === good ? 'good' : 'bad';
  return `<span class="mv"><span class="muted">${label}</span> <strong class="${cls}">${signed(v, d)}${unit}</strong></span>`;
}
function weekHtml() {
  const iss = S.issue, a = S.announce, p = S.prevWeek;
  const moves = p ? `<div class="moves">${moveChip('Approval', S.approval - p.approval, ' pts', true)}${moveChip('Unity', S.unity - p.unity, '', true)}${moveChip('Growth', S.econ.growth - p.growth, ' pts', true, 2)}${moveChip('Inflation', S.econ.inflation - p.inflation, ' pts', false, 2)}${moveChip('Debt', S.econ.debt - p.debt, 'bn', false, 0)}${moveChip('Waiting list', (waitList() - p.wait) * 1000, 'k', false, 0)}${moveChip(leadRule().label, S.letters - p.letters, '', false, 0)}</div>` : '';
  if (S.campaign) return `<section class="card"><h2>Election campaign</h2><p>Polling day is in ${S.campaign.left} week${S.campaign.left === 1 ? '' : 's'}. Press Next week to choose where to campaign.</p>${moves}</section>`;
  const def = issueDef(iss);
  const issueCard = iss ? `<section class="card issue ${iss.resolved ? 'done' : ''}">
      <p class="kicker">${esc(iss.cat)} · this week’s issue</p><h2>${esc(iss.title)}</h2><p>${esc(iss.text)}</p>
      ${iss.resolved ? '<p class="callout good">You have responded to this.</p>' : `<div class="sugg"><span class="hint">Officials suggest (tap to start from one, then edit):</span>${iss.sugg.map((x, i) => `<button class="ex" data-sugg="${i}">${esc(x)}</button>`).join('')}</div>`}
    </section>` : '';
  const pending = !!ui.wPending;
  const form = a ? '' : `<section class="card">
      <h2>Your announcement this week</h2>
      <p class="muted">Respond to the issue, or announce anything else you want. ${SAMPLE ? 'Claude plays the civil service, the voters, the press and your opponents.' : 'The Treasury model costs it and the country reacts.'} Big changes go to Parliament as a bill.</p>
      <div class="field"><label for="wTitle">Headline (optional)</label><input id="wTitle" maxlength="90" placeholder="For example: A New Deal for Renters" value="${esc(ui.wTitle || '')}"></div>
      <div class="field"><label for="wText">What you are announcing</label><textarea id="wText" rows="4" maxlength="1500" placeholder="Say what changes, who pays and by how much.">${esc(ui.wText || '')}</textarea></div>
      ${ui.wErr ? `<p class="err">${esc(ui.wErr)}</p>` : ''}
      <div class="row-actions"><button class="btn primary" id="announceBtn" ${pending ? 'disabled' : ''}>${pending ? 'The civil service is working…' : 'Announce'}</button>${pending ? '<button class="btn" id="stopAnnounce">Stop</button>' : ''}<span class="hint">${pending && SAMPLE ? 'This can take up to a minute.' : 'One announcement a week.'}</span></div>
    </section>`;
  return `${moves ? `<section class="card slim"><div class="card-h"><h2>Since last week</h2><span class="muted small">${dstr(S.week)}</span></div>${moves}</section>` : ''}
    ${issueCard}${form}${a ? announceHtml(a) : ''}
    <section class="card slim endweek"><p>${!iss || iss.resolved ? 'Done for the week?' : 'You have not responded to this week’s issue yet.'}</p><button class="btn primary" id="nextBtn2" ${S.queue.length || S.gameOver ? 'disabled' : ''}>Next week ▸</button></section>`;
}
function announceHtml(a) {
  const persona = id => PERSONAS.find(p => p.id === id);
  const favCls = v => v >= 58 ? 'good' : v < 42 ? 'bad' : 'warn';
  const maxR = 100;
  return `<section class="card announce">
    <p class="kicker">${a.by === 'claude' ? 'Assessed by Claude' : 'Treasury model'} · announced ${dstr(a.w)}</p>
    <h2 class="headline">${esc(a.headline || a.title)}</h2>
    <p><strong>${esc(a.title)}.</strong> ${esc(a.text)}</p>
    ${a.note ? `<p class="callout warn">${esc(a.note)}</p>` : ''}
    ${a.outcome ? `<p class="callout">${esc(a.outcome)}</p>` : ''}
    ${a.issueTitle ? `<p class="small ${a.addresses ? 'good' : 'bad'}">${a.addresses ? 'This counts as your response to: ' : 'This does not address this week’s issue: '}${esc(a.issueTitle)}</p>` : ''}
    <div class="grid three">
      ${stat('Public favourability', f0(a.fav) + '/100', 'across the focus group', favCls(a.fav))}
      ${stat('Approval', signed(a.moves.approval) + ' pts', 'move this announcement caused', a.moves.approval > .05 ? 'good' : a.moves.approval < -.05 ? 'bad' : '')}
      ${a.legislation ? stat('Commons', `${a.whip.ayes}–${a.whip.noes}`, `projected second reading, ${a.whip.rebels} rebels`, a.whip.ayes > a.whip.noes ? 'good' : 'bad') : stat('Delivery', 'Ministers act now', 'no legislation needed', '')}
    </div>
    <div class="split">
      <div><h3>Civil service briefing</h3><dl class="brief">
        <div><dt>Cost</dt><dd>${esc(a.briefing.cost || '—')}</dd></div>
        <div><dt>Risk</dt><dd>${esc(a.briefing.risk || '—')}</dd></div>
        <div><dt>Winners</dt><dd>${esc(a.briefing.winners || '—')}</dd></div>
        <div><dt>Losers</dt><dd>${esc(a.briefing.losers || '—')}</dd></div>
        <div><dt>Recommendation</dt><dd class="${/do not/i.test(a.briefing.recommendation) ? 'bad' : /caution/i.test(a.briefing.recommendation) ? 'warn' : 'good'}">${esc(a.briefing.recommendation)}</dd></div>
      </dl>${(a.briefing.notes || []).length ? `<ul class="notes">${a.briefing.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      ${a.legislation ? `<p class="small muted">Introduced to Parliament. Second reading in two sitting weeks. Track it on the Parliament tab.</p>` : ''}</div>
      <div><h3>Voter groups</h3><ul class="dist">${Object.keys(GROUPS).map(g => { const v = a.gwDelta[g] || 0; return `<li><span>${GROUPS[g].name}</span><span class="${v > .3 ? 'good' : v < -.3 ? 'bad' : 'muted'}">${v > .3 ? 'Warmer' : v < -.3 ? 'Cooler' : 'No change'} ${Math.abs(v) >= .3 ? '(' + signed(v) + ')' : ''}</span></li>`; }).join('')}</ul>
      <h3>Markets</h3><p class="small">${esc(a.markets || '')}</p></div>
    </div>
    <h3>Focus group</h3>
    <div class="focus">${a.focus.map(f => { const p = persona(f.id); return `<figure class="fg"><figcaption><strong>${esc(p.name)}, ${p.age}</strong><span class="muted small">${esc(p.job)}, ${esc(p.place)}</span></figcaption><blockquote>“${esc(f.quote)}”</blockquote><span class="score ${favCls(f.score)}">${f.score}/100</span></figure>`; }).join('')}</div>
    <div class="split">
      <div><h3>Across the country</h3><ul class="regions">${a.regions.map(([r, v]) => `<li><span>${esc(r)}</span><span class="bar"><span style="width:${clamp(v, 0, maxR)}%" class="${favCls(v)}"></span></span><span class="num">${f0(v)}</span></li>`).join('')}</ul></div>
      <div><h3>Most supportive seats</h3><ol class="seatlist">${a.top.map(([n, v]) => `<li><span>${esc(n)}</span><span class="num good">${f0(v)}</span></li>`).join('')}</ol>
        <h3>Least supportive seats</h3><ol class="seatlist">${a.bottom.map(([n, v]) => `<li><span>${esc(n)}</span><span class="num bad">${f0(v)}</span></li>`).join('')}</ol></div>
    </div>
    <div class="split">
      <div><h3>The opposition</h3><ul class="quotes">${a.opp.map(o => `<li style="border-left-color:${partyColor(o.party)}"><strong>${esc(S.leaders[o.party] || S.parties[o.party].name)}</strong> <span class="muted small">${esc(S.parties[o.party].name)}</span><p>“${esc(o.quote)}”</p></li>`).join('')}</ul></div>
      <div><h3>Your party</h3><ul class="quotes">${a.back.map(b => `<li style="border-left-color:var(--${b.mood >= 60 ? 'good' : b.mood >= 40 ? 'warn' : 'bad'})"><strong>${esc(b.wing)}</strong> <span class="muted small">mood ${b.mood}/100</span><p>“${esc(b.quote)}”</p></li>`).join('')}</ul></div>
    </div>
  </section>`;
}
function bindWeek() {
  const t = $('#wTitle'); if (t) t.addEventListener('input', () => { ui.wTitle = t.value; });
  const x = $('#wText'); if (x) x.addEventListener('input', () => { ui.wText = x.value; });
  document.querySelectorAll('[data-sugg]').forEach(b => b.addEventListener('click', () => { ui.wText = S.issue.sugg[+b.dataset.sugg]; render(); const tx = $('#wText'); if (tx) { tx.focus(); tx.scrollIntoView({ block: 'center' }); } }));
  const ab = $('#announceBtn'); if (ab) ab.addEventListener('click', announce);
  const sb = $('#stopAnnounce'); if (sb) sb.addEventListener('click', () => ui.wPending && ui.wPending.abort());
  const n2 = $('#nextBtn2'); if (n2) n2.addEventListener('click', () => { advance(); window.scrollTo(0, 0); });
}
