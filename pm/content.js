/* Number Ten: game content. Bills, events, pledges, names and seat geography.
   Engine helpers (G.*) are defined in game.js and only called when an event runs. */
'use strict';

const FIRST_NAMES = ['Alex','Priya','Tom','Fiona','Marcus','Helen','Ravi','Joanna','Callum','Nadia','Owen','Sarah','Imran','Claire','Gareth','Bridget','Daniel','Aisha','Rhys','Catherine','Liam','Meera','Stuart','Rachel','Kwame','Eleanor','Hamish','Yasmin','Patrick','Gemma','Ben','Lucy','Adebayo','Harriet','Rory','Sunita','Jonathan','Kerry','Matthew','Zara'];
const LAST_NAMES = ['Ashworth','Patel','Mercer','Doyle','Kaur','Hargreaves','Okafor','Lindqvist','Pemberton','Raines','Chowdhury','Fairbairn','Walsh','Ellery','Mahmood','Thornton','Gallagher','Nwosu','Brennan','Holloway','Sinclair','Quayle','Rahman','Whitfield','Dunmore','Kerr','Abbott','Lowe','Fenwick','Okonjo','Blythe','Carver','Moreton','Ince','Harlow','Pryce','Varma','Strachan','Lomax','Osei'];

const PLACE_A = ['Ash','Brad','Kings','Market','Chester','Wood','Stan','Hather','Mill','Bram','Eller','Cold','Thorn','Hal','Wake','Rother','Ock','Brent','Lang','Holm','Mar','Fern','Whit','Sal','Dun','Cran','Kel','Ald','Bur','Pen','Strat','Wey','Ux','Heath','Lyd','Tam','Ross','Glen','Kil','Aber','Llan','Car'];
const PLACE_B = ['ford','ton','ley','bury','field','wick','ham','mouth','borough','stead','well','bridge','dale','combe','minster','worth','by','hope','more','church','gate','burn','haven'];
const SUFFIXES = ['',' North',' South',' East',' West',' Central',' and District',' Vale',' Rural'];

const REGIONS = [
  ['London',75], ['South East',91], ['South West',58], ['East of England',61], ['East Midlands',47],
  ['West Midlands',57], ['Yorkshire and the Humber',54], ['North West',73], ['North East',27],
  ['Wales',32], ['Scotland',57], ['Northern Ireland',18]
];
/* Log-scale lean of each party by region. L = main centre-left, R = main centre-right,
   LD = liberals, P = populist right, G = greens, O = independents. */
const REGION_LEAN = {
  'London':                   {L:.40, R:-.20, LD: .00, P:-.55, G:.35, O:0},
  'South East':               {L:-.25,R: .22, LD: .30, P: .00, G:.00, O:0},
  'South West':               {L:-.35,R: .22, LD: .50, P: .05, G:.15, O:0},
  'East of England':          {L:-.20,R: .22, LD:-.10, P: .30, G:.00, O:0},
  'East Midlands':            {L: .00,R: .15, LD:-.40, P: .22, G:-.20,O:0},
  'West Midlands':            {L: .08,R: .10, LD:-.40, P: .18, G:-.15,O:0},
  'Yorkshire and the Humber': {L: .18,R:-.05, LD:-.30, P: .22, G:.05, O:0},
  'North West':               {L: .28,R:-.15, LD:-.20, P: .10, G:.00, O:0},
  'North East':               {L: .32,R:-.25, LD:-.50, P: .38, G:-.20,O:0},
  'Wales':                    {L: .28,R:-.15, LD:-.30, P: .12, G:-.10,O:.6},
  'Scotland':                 {L: .10,R:-.30, LD: .05, P:-.35, G:.00, O:0},
  'Northern Ireland':         {L:0,R:0,LD:0,P:0,G:0,O:0}
};

/* Voter groups. pop = share of electorate, turn = turnout, lean = -1 left .. +1 right.
   w = how much each issue moves them. Negative immigration weight means the group prefers
   a more open system. */
const GROUPS = {
  pensioners: {name:'Pensioners', pop:.20, turn:.82, lean:.30,
    w:{health:.25, col:.20, crime:.10, immigration:.15, pension:.20, tax:.10}},
  working:    {name:'Working-class voters', pop:.24, turn:.56, lean:0,
    w:{col:.25, jobs:.15, health:.15, immigration:.15, tax:.20, housing:.10}},
  middle:     {name:'Professionals & homeowners', pop:.24, turn:.72, lean:.10,
    w:{economy:.20, mortgage:.15, tax:.20, education:.15, environment:.10, health:.10, crime:.10}},
  young:      {name:'Under-30s', pop:.16, turn:.48, lean:-.40,
    w:{housing:.35, environment:.20, jobs:.15, education:.10, col:.10, tax:.10, health:.05, immigration:-.10}},
  public:     {name:'Public sector workers', pop:.10, turn:.68, lean:-.35,
    w:{pay:.35, health:.20, education:.15, col:.15, tax:.10, economy:.05}},
  business:   {name:'Business owners', pop:.06, turn:.76, lean:.40,
    w:{economy:.25, tax:.35, confidence:.25, immigration:-.15, transport:.10}}
};

const DEPTS = {
  health:      {name:'Health and social care', svc:'health'},
  education:   {name:'Education', svc:'education'},
  welfare:     {name:'Pensions and welfare', svc:null},
  defence:     {name:'Defence', svc:'defence'},
  police:      {name:'Police, courts and prisons', svc:'crime'},
  transport:   {name:'Transport', svc:'transport'},
  housing:     {name:'Housing and local government', svc:'housing'},
  environment: {name:'Energy and environment', svc:'environment'},
  other:       {name:'Everything else', svc:null}
};

const ROLES = [
  {id:'chancellor', name:'Chancellor of the Exchequer', short:'Chancellor', dept:'Treasury'},
  {id:'foreign',    name:'Foreign Secretary', short:'Foreign', dept:'Foreign Office'},
  {id:'home',       name:'Home Secretary', short:'Home', dept:'Home Office'},
  {id:'health',     name:'Health Secretary', short:'Health', dept:'Health'},
  {id:'education',  name:'Education Secretary', short:'Education', dept:'Education'},
  {id:'defence',    name:'Defence Secretary', short:'Defence', dept:'Defence'},
  {id:'housing',    name:'Housing Secretary', short:'Housing', dept:'Housing'},
  {id:'energy',     name:'Energy Secretary', short:'Energy', dept:'Energy'},
  {id:'transport',  name:'Transport Secretary', short:'Transport', dept:'Transport'},
  {id:'business',   name:'Business Secretary', short:'Business', dept:'Business'},
  {id:'whip',       name:'Chief Whip', short:'Chief Whip', dept:'Whips’ Office'}
];

/* Manifesto pledges. Tax locks break the moment a budget raises that tax.
   Outcome pledges are judged on election day. */
const PLEDGES = [
  {id:'no_income_tax', name:'No rise in income tax rates', kind:'tax'},
  {id:'no_vat', name:'No rise in VAT', kind:'tax'},
  {id:'no_ni', name:'No rise in National Insurance for workers', kind:'tax'},
  {id:'nhs_waits', name:'Cut the NHS waiting list below 6 million', kind:'outcome'},
  {id:'migration', name:'Bring net migration below 200,000', kind:'outcome'},
  {id:'homes', name:'Build 300,000 homes a year', kind:'outcome'},
  {id:'deficit', name:'Borrowing below 2% of GDP', kind:'outcome'},
  {id:'triple', name:'Keep the pensions triple lock', kind:'tax'}
];

/* Bills. ideo: -1 left .. +1 right. contro: how much it splits MPs and peers.
   fx: spend (£bn a year, today's prices), oneOff (£bn borrowed once), revenue (£bn a year),
   potential (trend growth, points), unemp, infl (points), migT (thousands a year),
   svc (service quality target), groups (goodwill), conf (business confidence target),
   cred (market credibility, one-off), intl, media, unity, flag. */
const BILLS = [
  {id:'rail', name:'Railways (Public Ownership) Bill', dept:'Transport', ideo:-.5, contro:.5,
    desc:'Bring train operators into public ownership as their franchises expire.',
    fx:{spend:{transport:1}, svc:{transport:8}, groups:{working:3, young:3, middle:1, business:-3}, conf:-2}},
  {id:'water', name:'Water Industry (Public Ownership) Bill', dept:'Environment', ideo:-.65, contro:1.5,
    desc:'Take the water companies into public ownership. Shareholders are compensated with gilts.',
    fx:{oneOff:22, svc:{environment:9}, groups:{working:3, young:3, pensioners:2, middle:1, business:-5}, cred:-5, conf:-4}},
  {id:'planning', name:'Planning and Infrastructure Bill', dept:'Housing', ideo:.1, contro:1.2,
    desc:'Override local objections to housing and grid projects. Releases grey-belt land.',
    fx:{potential:.15, svc:{housing:12}, groups:{young:6, business:3, pensioners:-4, middle:-3}}},
  {id:'council', name:'Social Housing Bill', dept:'Housing', ideo:-.4, contro:.3,
    desc:'Fund councils to build 90,000 social homes a year.',
    fx:{spend:{housing:5}, svc:{housing:9}, groups:{young:4, working:3, public:1}}},
  {id:'rent', name:'Rent Stabilisation Bill', dept:'Housing', ideo:-.65, contro:1.5,
    desc:'Cap annual rent rises at inflation and ban no-fault evictions.',
    fx:{svc:{housing:-3}, groups:{young:8, working:2, middle:-3, business:-3}, conf:-2}},
  {id:'wage', name:'National Living Wage (£15) Bill', dept:'Business', ideo:-.5, contro:.6,
    desc:'Raise the minimum wage to £15 an hour over two years.',
    fx:{unemp:.25, infl:.15, groups:{working:6, young:5, public:1, business:-8}, conf:-5}},
  {id:'workers', name:'Employment Rights Bill', dept:'Business', ideo:-.45, contro:.6,
    desc:'Day-one unfair dismissal rights, a ban on zero-hours contracts and easier union recognition.',
    fx:{unemp:.12, groups:{working:4, young:3, public:3, business:-6}, conf:-5}},
  {id:'redtape', name:'Regulatory Reform Bill', dept:'Business', ideo:.5, contro:.6,
    desc:'Scrap or simplify 1,200 business regulations, including some environmental rules.',
    fx:{potential:.1, conf:6, svc:{environment:-4}, groups:{business:6, middle:1, public:-2, young:-2}}},
  {id:'freeports', name:'Freeports and Investment Zones Bill', dept:'Business', ideo:.4, contro:.2,
    desc:'Ten new low-tax zones with fast-track planning.',
    fx:{potential:.08, revenue:-1, conf:4, groups:{business:4, working:1}}},
  {id:'windfall', name:'Energy Profits Levy Bill', dept:'Treasury', ideo:-.4, contro:.4,
    desc:'Extend and raise the windfall tax on oil and gas producers.',
    fx:{revenue:6, conf:-4, groups:{working:3, pensioners:2, young:2, business:-4}}},
  {id:'wealth', name:'Wealth Tax Bill', dept:'Treasury', ideo:-.75, contro:2,
    desc:'An annual 1% tax on net wealth above £10 million.',
    fx:{revenue:8, conf:-8, cred:-3, groups:{working:4, young:4, public:2, business:-9, middle:-2}}},
  {id:'tuition', name:'Tuition Fees Abolition Bill', dept:'Education', ideo:-.55, contro:.8,
    desc:'Replace university tuition fees with direct grants.',
    fx:{spend:{education:9}, svc:{education:2}, cred:-3, groups:{young:12, middle:3, pensioners:-2}}},
  {id:'meals', name:'Universal Free School Meals Bill', dept:'Education', ideo:-.35, contro:.2,
    desc:'Free lunches for every primary school pupil in England.',
    fx:{spend:{education:1.8}, svc:{education:3}, groups:{working:4, middle:2, public:2}}},
  {id:'teachers', name:'Teacher Recruitment Bill', dept:'Education', ideo:-.1, contro:.1,
    desc:'A £6,000 retention payment for teachers in shortage subjects.',
    fx:{spend:{education:2.5}, svc:{education:7}, groups:{public:4, middle:2}}},
  {id:'police', name:'Police Numbers Bill', dept:'Home Office', ideo:.2, contro:.1,
    desc:'Fund 20,000 extra officers and neighbourhood policing teams.',
    fx:{spend:{police:2.2}, svc:{crime:10}, groups:{pensioners:4, middle:2, working:2}}},
  {id:'sentencing', name:'Sentencing Reform Bill', dept:'Justice', ideo:-.2, contro:1,
    desc:'Replace most short prison terms with community sentences to ease overcrowding.',
    fx:{spend:{police:-1}, svc:{crime:-2}, flag:'prisons', groups:{pensioners:-4, middle:-1, public:1}}},
  {id:'prisons', name:'Prison Capacity Bill', dept:'Justice', ideo:.3, contro:.2,
    desc:'Build 20,000 new prison places by 2032.',
    fx:{spend:{police:1.5}, oneOff:6, svc:{crime:5}, flag:'prisons', groups:{pensioners:3, working:1}}},
  {id:'offshore', name:'Asylum (Offshore Processing) Bill', dept:'Home Office', ideo:.75, contro:2,
    desc:'Process asylum claims in a partner country abroad. Leaves some human rights rules disapplied.',
    fx:{spend:{other:1.5}, migT:-25, intl:-6, flag:'offshore', groups:{pensioners:6, working:4, young:-6, public:-2}}},
  {id:'visas', name:'Immigration (Skills Threshold) Bill', dept:'Home Office', ideo:.45, contro:.8,
    desc:'Raise the salary threshold for skilled visas to £45,000 and end most dependant visas.',
    fx:{migT:-120, potential:-.1, svc:{health:-3}, groups:{pensioners:5, working:4, business:-6, young:-3}, conf:-2}},
  {id:'carevisa', name:'Care Workforce Bill', dept:'Health', ideo:-.2, contro:.5,
    desc:'Fast-track overseas recruitment of care workers.',
    fx:{migT:60, svc:{health:4}, groups:{business:3, pensioners:-1, working:-2}}},
  {id:'care', name:'Social Care Bill', dept:'Health', ideo:-.3, contro:.3,
    desc:'Cap lifetime care costs at £86,000 and create a national care service.',
    fx:{spend:{health:6}, svc:{health:6}, groups:{pensioners:8, middle:3}}},
  {id:'nhsreform', name:'NHS Productivity Bill', dept:'Health', ideo:.3, contro:.8,
    desc:'Use private hospital capacity for routine operations and tie trust budgets to targets.',
    fx:{svc:{health:6}, groups:{public:-5, middle:2, pensioners:1}}},
  {id:'tobacco', name:'Tobacco and Vapes Bill', dept:'Health', ideo:-.1, contro:.5, free:true,
    desc:'Ban the sale of tobacco to anyone born after 2009.',
    fx:{svc:{health:2}, revenue:-.5, groups:{pensioners:1, young:-1, business:-1}}},
  {id:'dying', name:'Assisted Dying Bill', dept:'Justice', ideo:0, contro:1, free:true,
    desc:'Allow terminally ill adults to seek help to end their lives, with judicial approval.',
    fx:{groups:{middle:2, young:2, pensioners:-1}, media:1}},
  {id:'votes16', name:'Elections Bill', dept:'Cabinet Office', ideo:-.4, contro:.6,
    desc:'Lower the voting age to 16 and allow automatic voter registration.',
    fx:{flag:'votes16', groups:{young:5, pensioners:-2}}},
  {id:'lords', name:'House of Lords Reform Bill', dept:'Cabinet Office', ideo:-.3, contro:1.4,
    desc:'Remove the remaining hereditary peers and set a retirement age of 80.',
    fx:{groups:{middle:1, young:1}, media:1}},
  {id:'pr', name:'Electoral Reform Referendum Bill', dept:'Cabinet Office', ideo:-.2, contro:2.2,
    desc:'Hold a referendum on replacing first past the post with proportional representation.',
    fx:{flag:'prRef', groups:{young:3, middle:2}}},
  {id:'devo', name:'English Devolution Bill', dept:'Housing', ideo:0, contro:.2,
    desc:'Elected mayors with transport and skills budgets for every English region.',
    fx:{spend:{other:1}, potential:.05, svc:{transport:3}, groups:{working:2, business:1}}},
  {id:'defence', name:'Defence Investment Bill', dept:'Defence', ideo:.35, contro:.4,
    desc:'Raise defence spending to 3% of GDP.',
    fx:{spend:{defence:18}, svc:{defence:16}, intl:8, cred:-2, groups:{pensioners:4, middle:1, young:-2, public:-1}}},
  {id:'aid', name:'International Development Bill', dept:'Foreign Office', ideo:.55, contro:1,
    desc:'Cut overseas aid from 0.5% to 0.3% of national income.',
    fx:{spend:{other:-6}, intl:-8, groups:{pensioners:3, working:2, young:-3}}},
  {id:'cleanpower', name:'Clean Power Bill', dept:'Energy', ideo:-.35, contro:.5,
    desc:'Decarbonise the grid by 2030 through publicly backed wind and solar.',
    fx:{spend:{environment:6}, svc:{environment:15}, infl:.05, potential:.05, groups:{young:7, middle:3, working:-2, business:-1}}},
  {id:'northsea', name:'North Sea Licensing Bill', dept:'Energy', ideo:.5, contro:.6,
    desc:'Issue new oil and gas exploration licences every year.',
    fx:{revenue:2, svc:{environment:-10}, intl:-2, groups:{working:2, business:3, young:-6}}},
  {id:'zev', name:'Zero Emission Vehicles Bill', dept:'Transport', ideo:-.3, contro:.7,
    desc:'End sales of new petrol and diesel cars in 2030.',
    fx:{svc:{environment:6}, conf:-1, groups:{young:3, working:-4, pensioners:-3}}},
  {id:'nuclear', name:'Nuclear Energy Bill', dept:'Energy', ideo:.2, contro:.2,
    desc:'Approve two new reactors and a fleet of small modular reactors.',
    fx:{spend:{environment:3}, svc:{environment:6}, potential:.03, groups:{business:2, middle:1, young:-1}}},
  {id:'pensionage', name:'State Pension Age Bill', dept:'Work and Pensions', ideo:.4, contro:1.8,
    desc:'Bring forward the rise in the state pension age to 68.',
    fx:{spend:{welfare:-8}, cred:4, groups:{pensioners:-6, working:-6, middle:-1}}},
  {id:'triplelock', name:'Pensions Uprating Bill', dept:'Work and Pensions', ideo:.3, contro:2,
    desc:'Replace the triple lock with an earnings link.',
    fx:{flag:'noTripleLock', cred:5, groups:{pensioners:-12, young:2}}},
  {id:'twochild', name:'Child Poverty Bill', dept:'Work and Pensions', ideo:-.55, contro:.4,
    desc:'Scrap the two-child limit on child benefit payments.',
    fx:{spend:{welfare:3.5}, groups:{working:5, public:2, pensioners:-2, middle:-1}}},
  {id:'welfarecut', name:'Welfare Reform Bill', dept:'Work and Pensions', ideo:.5, contro:1.8,
    desc:'Tighten eligibility for disability and sickness benefits.',
    fx:{spend:{welfare:-5}, cred:3, unemp:-.1, groups:{working:-6, public:-2, pensioners:2, middle:1}}},
  {id:'digitalid', name:'Digital Identity Bill', dept:'Cabinet Office', ideo:.2, contro:1,
    desc:'A compulsory digital ID for right-to-work and right-to-rent checks.',
    fx:{spend:{other:.6}, migT:-15, media:-2, groups:{young:-3, middle:-2, pensioners:1, business:1}}},
  {id:'online', name:'Online Safety (Under-16s) Bill', dept:'Culture', ideo:.05, contro:.4,
    desc:'Ban under-16s from social media platforms.',
    fx:{groups:{middle:4, pensioners:3, young:-6, business:-2}}},
  {id:'europe', name:'European Partnership Bill', dept:'Foreign Office', ideo:-.3, contro:3,
    desc:'Align with EU single market rules for goods in return for frictionless trade.',
    fx:{potential:.3, migT:40, intl:10, conf:5, unity:-6, groups:{young:7, middle:4, business:5, pensioners:-8, working:-5}}},
  {id:'npr', name:'Northern Powerhouse Rail Bill', dept:'Transport', ideo:-.1, contro:.2,
    desc:'Build a new high-speed line between Liverpool, Manchester and Leeds.',
    fx:{spend:{transport:4}, potential:.08, svc:{transport:6}, groups:{working:2, business:2}}}
];

/* Random and seasonal events. when(S) decides eligibility, w is relative weight,
   cool is the minimum weeks before it can recur. Options return the outcome text. */
const EVENTS = [
  {id:'nhs_winter', cat:'Health', title:'NHS winter crisis', w:4, cool:30,
    when:S=>G.inMonths([11,0,1]) && S.svc.health<58,
    text:S=>`Only ${G.ae()}% of A&E patients were seen within four hours last week. Trolley waits are on the front pages and two hospital trusts have declared critical incidents.`,
    opts:[
      {t:'Emergency £2bn winter package', h:'Borrow £2bn this year', f:()=>{G.oneOff(2);G.svc('health',3);G.gw({pensioners:3,public:2,middle:1});G.stat('media',2);return 'Hospitals open 3,000 extra beds. The crisis eases but the Treasury is unhappy.';}},
      {t:'Order trusts to cancel routine operations', f:()=>{G.svc('health',-2);G.gw({pensioners:-2,middle:-2});return 'A&E pressure eases, but 40,000 planned operations are postponed and the waiting list grows.';}},
      {t:'Blame the previous government', f:()=>{G.stat('media',-3);G.gw({all:-1});return 'The line lands badly with voters who expect the government to act.';}}
    ]},
  {id:'doctors_strike', cat:'Health', title:'Resident doctors vote to strike', w:3, cool:40,
    when:S=>S.econ.pubPay<98.5,
    text:S=>`The BMA says resident doctors' real pay has fallen ${f1(100-S.econ.pubPay)}% since the election. 87% voted for a five-day walkout.`,
    opts:[
      {t:'Meet the demand in full', h:'About £1.5bn a year', f:()=>{G.spend('health',1.5);G.pay(2.5);G.gw({public:4,pensioners:1});G.stat('credibility',-2);G.unity(1);return 'The strike is called off. Nurses and teachers say they expect the same.';}},
      {t:'Offer a 4% deal with productivity strings', f:()=>{if(chance(.55)){G.spend('health',.7);G.pay(1);G.gw({public:2});return 'The BMA puts the offer to members, who accept it narrowly.';}G.svc('health',-3);G.gw({public:-2,pensioners:-2});return 'The offer is rejected. 30,000 appointments are cancelled during the walkout.';}},
      {t:'Refuse and sit it out', f:()=>{G.svc('health',-4);G.gw({public:-5,pensioners:-2,middle:-1});G.stat('media',-1);return 'The strike goes ahead. Consultants threaten to join the next round.';}}
    ]},
  {id:'teachers', cat:'Education', title:'Teachers threaten industrial action', w:2, cool:50,
    when:S=>S.econ.pubPay<98 && S.svc.education<58,
    text:S=>'The NEU is balloting for strikes over pay and workload. Heads warn that 1 in 4 maths lessons are taught by non-specialists.',
    opts:[
      {t:'Fund a 5% pay rise', h:'About £1.4bn a year', f:()=>{G.spend('education',1.4);G.pay(1.5);G.svc('education',3);G.gw({public:4,middle:1});return 'The ballot is suspended. Schools welcome the money.';}},
      {t:'Offer 3% from existing budgets', f:()=>{G.svc('education',-3);G.pay(.5);G.gw({public:-1});return 'Schools absorb the cost by cutting teaching assistants.';}},
      {t:'Legislate for minimum service levels', f:()=>{G.gw({public:-6,business:2,pensioners:1});G.unity(-2);G.stat('media',1);return 'Unions call it an attack on the right to strike. Some of your backbenchers agree.';}}
    ]},
  {id:'floods', cat:'Environment', title:'Severe flooding', w:3, cool:30,
    when:S=>G.inMonths([10,11,0,1,2]),
    text:S=>`Storm ${pick(['Agnes','Bram','Celia','Darragh','Elin','Fionn','Gerda'])} has flooded 4,000 homes across ${pick(['Yorkshire','the Severn valley','Cumbria','the Somerset Levels','the Midlands'])}. Residents say defences promised years ago were never built.`,
    opts:[
      {t:'Visit and announce a £500m recovery fund', f:()=>{G.oneOff(.5);G.stat('media',3);G.gw({pensioners:2,working:1});return 'Pictures of you in waders lead the news. Residents are grudgingly positive.';}},
      {t:'Deploy the army and fund new defences', h:'£1.2bn over two years', f:()=>{G.oneOff(1.2);G.svc('environment',2);G.stat('media',2);G.gw({all:1});return 'Soldiers fill sandbags within hours. The new defences programme is welcomed.';}},
      {t:'Leave it to local councils', f:()=>{G.stat('media',-5);G.gw({all:-2});return '"Where is the Prime Minister?" asks every front page.';}}
    ]},
  {id:'heatwave', cat:'Environment', title:'Drought and hosepipe bans', w:2, cool:40,
    when:S=>G.inMonths([5,6,7]),
    text:S=>'Temperatures hit 38°C. Five water companies impose hosepipe bans while leaking a fifth of their supply.',
    opts:[
      {t:'Ban bonuses for water bosses', f:()=>{G.gw({all:1});G.stat('media',2);G.conf(-1);return 'Popular, though the industry warns investment will suffer.';}},
      {t:'Fast-track two new reservoirs', h:'£0.8bn', f:()=>{G.oneOff(.8);G.svc('environment',2);return 'The first new reservoirs in 30 years get the go-ahead.';}},
      {t:'Urge people to save water', f:()=>{G.stat('media',-1);return 'The appeal is ignored and mocked.';}}
    ]},
  {id:'boats', cat:'Home Office', title:'Record Channel crossings', w:3, cool:20,
    when:S=>G.inMonths([4,5,6,7,8]),
    text:S=>`${f0(900+Math.random()*700)} people crossed the Channel in small boats in a single day. ${S.parties.P.name} is surging in coastal seats.`,
    opts:[
      {t:'Fund 1,000 more Border Force officers', h:'£0.4bn a year', f:()=>{G.spend('other',.4);G.migT(-5);G.gw({pensioners:2,working:2});return 'Crossings dip slightly. Critics say the gangs simply adapt.';}},
      {t:'Negotiate a returns deal with France', f:()=>{if(chance(.5)){G.migT(-10);G.stat('intl',2);G.gw({pensioners:3,working:2});return 'Paris agrees a one-in, one-out pilot. Crossings fall.';}G.stat('intl',-1);G.stat('media',-2);return 'Talks stall. The opposition calls it a humiliation.';}},
      {t:'Say safe legal routes are the answer', f:()=>{G.gw({young:2,public:1,pensioners:-4,working:-4});G.party('P',1);return 'The line plays well in cities and badly almost everywhere else.';}}
    ]},
  {id:'bank', cat:'Treasury', title:'A major lender is failing', w:1, cool:200,
    when:S=>S.econ.credibility<55 || S.econ.rate>4.5,
    text:S=>`${pick(['Northgate','Calder','Albany','Severn'])} Building Society has lost access to wholesale funding. 3 million savers have accounts there. The Bank of England needs an answer by Monday.`,
    opts:[
      {t:'Nationalise it overnight', h:'Adds £40bn to debt', f:()=>{G.oneOff(40);G.stat('credibility',-3);G.shock(-.3,0);return 'Savers are protected. The debt jumps and markets are uneasy.';}},
      {t:'Broker a rescue takeover', f:()=>{if(chance(.6)){G.shock(-.2,0);G.conf(-2);return 'A larger bank takes it over with a Treasury guarantee. Crisis averted.';}G.oneOff(25);G.shock(-.6,0);return 'The deal collapses at midnight. You have to step in anyway, at a worse price.';}},
      {t:'Let it fail', f:()=>{G.shock(-1.2,0);G.conf(-8);G.gw({all:-4});G.stat('media',-6);return 'Queues form outside branches. The panic spreads to two other lenders.';}}
    ]},
  {id:'energy', cat:'Energy', title:'Gas prices spike', w:2, cool:80,
    when:S=>true,
    text:S=>'A pipeline attack has sent wholesale gas prices up 80%. Ofgem warns the price cap will rise by £600 a year in three months.',
    opts:[
      {t:'Universal bill support', h:'About £20bn', f:()=>{G.oneOff(20);G.shock(-.1,.6);G.gw({all:4});G.stat('credibility',-4);return 'Bills are frozen for everyone. The cost is enormous.';}},
      {t:'Targeted help for poorer households', h:'About £6bn', f:()=>{G.oneOff(6);G.shock(-.3,1.3);G.gw({working:2,pensioners:2,middle:-2});return 'The poorest are protected. Middle earners feel the squeeze.';}},
      {t:'Let prices pass through', f:()=>{G.shock(-.5,2);G.gw({all:-4});G.stat('media',-4);return 'Inflation jumps and the Bank of England is forced to hold rates higher.';}}
    ]},
  {id:'war', cat:'Foreign Office', title:'War in Eastern Europe escalates', w:1, cool:150,
    when:S=>S.week>20,
    text:S=>'An allied government has asked for air defence systems and a £3bn support package. NATO meets in 48 hours.',
    opts:[
      {t:'Lead the response', h:'£3bn plus higher defence spending', f:()=>{G.oneOff(3);G.spend('defence',4);G.stat('intl',8);G.gw({pensioners:3,middle:2});G.shock(-.1,.3);return 'Allies praise British leadership. The cost lands on the deficit.';}},
      {t:'Match what allies offer', f:()=>{G.oneOff(1.5);G.stat('intl',2);return 'A solid but unremarkable contribution.';}},
      {t:'Focus on problems at home', f:()=>{G.stat('intl',-8);G.gw({working:1,young:1,middle:-2});return 'Washington and Brussels are openly critical.';}}
    ]},
  {id:'leak', cat:'No 10', title:'Cabinet split leaked', w:2, cool:30,
    when:S=>S.unity<55,
    text:S=>{const m=G.rival();return `Notes of last week's cabinet meeting have appeared in a Sunday paper. They show ${m?m.name:'a senior minister'} arguing against your strategy.`;},
    opts:[
      {t:'Launch a leak inquiry', f:()=>{G.stat('media',-1);G.unity(1);return 'The inquiry finds nothing, as usual, but cabinet is warned.';}},
      {t:'Laugh it off', f:()=>{G.stat('media',1);G.unity(-1);return 'You call it "healthy debate". Nobody believes it.';}},
      {t:'Confront the minister', f:()=>{const m=G.rival();if(m){m.loyal=clamp(m.loyal-2,1,10);}G.unity(-3);return 'A shouting match is overheard. The minister\'s allies start briefing.';}}
    ]},
  {id:'donor', cat:'Party', title:'Party donor row', w:1.5, cool:60,
    when:S=>true,
    text:S=>`It emerges that a £2m party donor met ministers three times before winning a £400m government contract.`,
    opts:[
      {t:'Return the money and order an inquiry', f:()=>{G.stat('heat',-1);G.stat('media',1);G.party('funds',-1);return 'The story fades after a week.';}},
      {t:'Insist everything was above board', f:()=>{G.stat('heat',4);G.stat('trust',-3);return 'More emails emerge. The story runs for a fortnight.';}}
    ]},
  {id:'defection', cat:'Party', title:'MP threatens to defect', w:2, cool:40,
    when:S=>S.unity<45 && G.govSeats()>200,
    text:S=>`One of your MPs from a ${pick(['coastal','northern','Midlands','rural'])} seat is in talks with ${S.pm.ideo>0?S.parties.P.name:S.parties.G.name}. They want a public concession.`,
    opts:[
      {t:'Offer them a ministerial job', f:()=>{G.unity(1);return 'They stay. Other MPs take note of how this works.';}},
      {t:'Let them go', f:()=>{G.loseSeat(S.pm.ideo>0?'P':'G');G.stat('media',-2);return 'They cross the floor. Your majority shrinks by two.';}},
      {t:'Remove the whip pre-emptively', f:()=>{G.loseSeat('O');G.unity(-2);return 'They sit as an independent and attack you weekly.';}}
    ]},
  {id:'scotus', cat:'Home Office', title:'Supreme Court rules against offshore processing', w:4, cool:300,
    when:S=>S.flags.offshore && !S.flags.scotusDone,
    text:S=>'The Supreme Court has ruled unanimously that the partner country is not safe. No flights can leave.',
    opts:[
      {t:'Legislate to declare the country safe', f:()=>{S.flags.scotusDone=1;G.unity(-4);G.stat('intl',-3);G.gw({pensioners:3,working:2,young:-4,middle:-2});return 'Lawyers warn more challenges will follow. Moderates are restless.';}},
      {t:'Accept the ruling and drop the scheme', f:()=>{S.flags.scotusDone=1;G.migT(25);G.gw({pensioners:-4,working:-3});G.party('P',1.5);return `${S.parties.P.name} calls it a betrayal and rises in the polls.`;}}
    ]},
  {id:'trade', cat:'Business', title:'Trade deal on the table', w:1.5, cool:100,
    when:S=>S.week>15,
    text:S=>'Washington offers a trade deal that would cut tariffs on British cars and drugs. In return it wants access for hormone-treated beef and chlorinated chicken.',
    opts:[
      {t:'Sign it', f:()=>{G.potential(.05);G.conf(4);G.gw({business:4,pensioners:-3,working:-1});G.unity(-2);return 'Exporters celebrate. Farmers blockade Whitehall with tractors.';}},
      {t:'Hold out for food standards', f:()=>{if(chance(.4)){G.potential(.04);G.conf(3);G.gw({business:2,pensioners:1});return 'The US backs down on food. A smaller deal is signed.';}G.stat('intl',-1);return 'Talks are put on ice.';}},
      {t:'Walk away', f:()=>{G.conf(-2);G.gw({pensioners:1});return 'Exporters are disappointed.';}}
    ]},
  {id:'carplant', cat:'Business', title:'Car plant to close', w:1.5, cool:80,
    when:S=>S.econ.confidence<55,
    text:S=>`A Japanese carmaker says it will close its ${pick(['Sunderland','Derbyshire','Swindon','Ellesmere Port'])} plant. 4,500 jobs are at risk, plus 20,000 in the supply chain.`,
    opts:[
      {t:'Offer a £500m subsidy package', f:()=>{G.oneOff(.5);G.gw({working:3});G.conf(1);return 'The company stays for now, in return for battery production.';}},
      {t:'Let the market decide', f:()=>{G.shock(-.1,0);G.gw({working:-4});G.stat('media',-2);return 'The plant closes. The town\'s MP is furious.';}}
    ]},
  {id:'steel', cat:'Business', title:'Last blast furnace at risk', w:1, cool:200,
    when:S=>S.week>30,
    text:S=>'The owners of Britain\'s last blast furnace say they will stop buying raw materials next week. Without them the UK cannot make virgin steel.',
    opts:[
      {t:'Take control of the plant', h:'About £1bn', f:()=>{G.oneOff(1);G.gw({working:4,pensioners:1});G.stat('intl',1);return 'Parliament is recalled. The furnace stays lit.';}},
      {t:'Let it close', f:()=>{G.gw({working:-4});G.stat('media',-3);return 'Unions and your own MPs call it an act of national self-harm.';}}
    ]},
  {id:'cyber', cat:'Home Office', title:'Cyber attack on NHS IT', w:1, cool:150,
    when:S=>true,
    text:S=>'A ransomware gang has locked a pathology supplier. Blood tests at 12 London hospitals have stopped.',
    opts:[
      {t:'Fund a national cyber defence programme', h:'£1bn', f:()=>{G.spend('defence',.5);G.oneOff(.5);G.svc('health',-1);return 'Services recover in three weeks.';}},
      {t:'Handle it within existing budgets', f:()=>{G.svc('health',-3);G.stat('media',-2);return 'Recovery takes two months. 10,000 operations are delayed.';}}
    ]},
  {id:'prisons_full', cat:'Justice', title:'Prisons are full', w:3, cool:60,
    when:S=>!S.flags.prisons && S.week>12,
    text:S=>'The prison population is 99.7% of usable capacity. Police cells are filling up and courts are adjourning trials.',
    opts:[
      {t:'Release some prisoners early', f:()=>{S.flags.prisons=1;G.gw({pensioners:-4,middle:-2});G.stat('media',-3);return 'Seven of the released are back in custody within a week. The papers keep count.';}},
      {t:'Rent cells abroad and build fast', h:'£2bn', f:()=>{S.flags.prisons=1;G.oneOff(2);G.svc('crime',1);return 'An expensive fix, but the system keeps running.';}},
      {t:'Do nothing and hope', f:()=>{G.svc('crime',-6);return 'Arrests are quietly rationed in several forces.';}}
    ]},
  {id:'unis', cat:'Education', title:'University on the brink', w:1.5, cool:80,
    when:S=>S.econ.migration<300 || S.svc.education<50,
    text:S=>`A university with 25,000 students says it cannot make payroll in March. A fall in international students has hit its finances.`,
    opts:[
      {t:'Bail it out', h:'£0.4bn', f:()=>{G.oneOff(.4);G.gw({young:2,middle:1});return 'Students are relieved. Other universities queue up.';}},
      {t:'Let it merge or close', f:()=>{G.gw({young:-3,public:-1});G.stat('media',-1);return 'The closure becomes a national story about the sector.';}}
    ]},
  {id:'council', cat:'Housing', title:'Council declares bankruptcy', w:2, cool:40,
    when:S=>S.svc.housing<45,
    text:S=>`${pick(['Northbridge','Coldmarsh','Ellingham','Stanwick'])} council has issued a section 114 notice. Libraries and bin collections will be cut.`,
    opts:[
      {t:'Raise funding for all councils', h:'£2bn a year', f:()=>{G.spend('housing',2);G.svc('housing',3);G.gw({working:1,pensioners:1,public:2});return 'Council leaders welcome the move.';}},
      {t:'Send in commissioners', f:()=>{G.gw({working:-1,public:-1});return 'Services are cut and council tax goes up 10%.';}}
    ]},
  {id:'opp_leader', cat:'Opposition', title:'Opposition leader resigns', w:1, cool:200,
    when:S=>S.parties[G.mainOpp()].share<26 && S.week>40,
    text:S=>`${S.leaders[G.mainOpp()]||'The opposition leader'} has resigned as leader of ${theName(G.mainOpp())} after poor polling. ${G.newLeader(G.mainOpp())} is favourite to replace them.`,
    opts:[
      {t:'Welcome the new leader graciously', f:()=>{G.swapLeader(G.mainOpp());S.oppLeader=Math.min(80,S.oppLeader+15);G.stat('media',1);return 'The new leader gets a honeymoon of their own.';}},
      {t:'Release an attack dossier on day one', f:()=>{G.swapLeader(G.mainOpp());S.oppLeader=Math.min(80,S.oppLeader+8);if(chance(.5)){S.oppLeader-=8;return 'It sticks. The new leader never quite recovers.';}G.stat('media',-2);return 'It looks petty. Commentators side with the new leader.';}}
    ]},
  {id:'meals_campaign', cat:'Education', title:'Footballer campaigns on child poverty', w:1, cool:150,
    when:S=>!S.passed.includes('meals') && !S.passed.includes('twochild'),
    text:S=>'An England striker\'s open letter on school holiday hunger has two million shares. The opposition will force a vote.',
    opts:[
      {t:'U-turn and fund holiday meals', h:'£0.5bn a year', f:()=>{G.spend('education',.5);G.gw({working:3,middle:2,public:2});G.stat('media',2);return 'A quick U-turn. The striker thanks you.';}},
      {t:'Whip MPs to vote it down', f:()=>{G.gw({working:-3,middle:-2,young:-3});G.unity(-3);G.stat('media',-4);return 'Your MPs face abuse in their constituencies.';}}
    ]},
  {id:'g7', cat:'Foreign Office', title:'G7 summit', w:1.5, cool:45,
    when:S=>G.inMonths([5,6]),
    text:S=>'World leaders meet in Italy. You can push one priority.',
    opts:[
      {t:'Climate finance', f:()=>{G.stat('intl',4);G.gw({young:2,middle:1});return 'You secure a joint statement on clean energy finance.';}},
      {t:'Trade and growth', f:()=>{G.stat('intl',2);G.conf(2);return 'Leaders agree to cut tariffs on green technology.';}},
      {t:'Security and defence', f:()=>{G.stat('intl',3);G.gw({pensioners:1});return 'You announce a new joint air defence initiative.';}}
    ]},
  {id:'pandemic', cat:'Health', title:'New respiratory virus', w:.4, cool:400,
    when:S=>S.week>52,
    text:S=>'A new virus is spreading in hospitals. Modellers warn of 400,000 admissions this winter without action.',
    opts:[
      {t:'Introduce early restrictions', h:'Costs about £30bn', f:()=>{G.oneOff(30);G.shock(-1.5,0);G.svc('health',-2);G.gw({pensioners:4,business:-5,young:-3});G.stat('media',2);return 'Hospitals cope. The economy takes a sharp hit.';}},
      {t:'Rely on testing and vaccines', h:'£8bn', f:()=>{G.oneOff(8);G.shock(-.4,0);G.svc('health',-6);G.gw({pensioners:-2});return 'The NHS is stretched to breaking point, but the economy stays open.';}}
    ]},
  {id:'water_collapse', cat:'Environment', title:'Water company collapses', w:1.5, cool:200,
    when:S=>!S.passed.includes('water') && S.week>20,
    text:S=>'The country\'s largest water company has £19bn of debt and says it cannot pay its creditors next month.',
    opts:[
      {t:'Special administration', h:'Adds £3bn to debt', f:()=>{G.oneOff(3);G.gw({all:1});return 'Taps keep running. Creditors take losses.';}},
      {t:'Let bills rise 40% to rescue it', f:()=>{G.shock(0,.3);G.gw({all:-3});G.stat('media',-3);return 'Customers are furious that they are paying for past dividends.';}}
    ]},
  {id:'plot', cat:'Party', title:'A rival is on manoeuvres', w:2, cool:40,
    when:S=>!!G.rival() && S.approval<38,
    text:S=>{const m=G.rival();return `${m.name} has given a speech setting out "a different vision for the party". Lobby journalists are calling it a leadership pitch.`;},
    opts:[
      {t:'Sack them', f:()=>{const m=G.rival();G.sack(m.id,true);G.unity(-5);return `${m.name} returns to the back benches with a grudge and a following.`;}},
      {t:'Promote them to bind them in', f:()=>{const m=G.rival();m.loyal=clamp(m.loyal+3,1,10);m.ambition=clamp(m.ambition-2,1,10);G.unity(2);return 'They accept a bigger brief. For now.';}},
      {t:'Ignore it', f:()=>{G.unity(-2);G.stat('media',-1);return 'The speech gets wall-to-wall coverage.';}}
    ]},
  {id:'walkout', cat:'No 10', title:'Cabinet ministers resign', w:6, cool:80,
    when:S=>S.approval<27 && S.unity<38 && S.week>20,
    text:S=>{const out=G.walkoutNames();return `${out.join(', ')} have resigned from the cabinet within the hour. Their joint letter says the government "cannot go on like this". More are expected to follow.`;},
    opts:[
      {t:'Refuse to go and appoint replacements', f:()=>{G.doWalkout();G.unity(-8);G.letters(.45);G.stat('media',-4);return 'You fill the posts by midnight. The new ministers are untested and the letters keep coming.';}},
      {t:'Announce you will stand down', f:()=>{G.doWalkout();G.resign('You announced your resignation after a wave of cabinet resignations.');return 'You will stay on until your party chooses a successor.';}},
      {t:'Call a snap general election', f:()=>{G.doWalkout();G.snap();return 'You go over the heads of your MPs and ask the country to decide.';}}
    ]},
  {id:'ai_jobs', cat:'Business', title:'AI investment offer', w:1, cool:200,
    when:S=>S.week>26,
    text:S=>'A US tech giant wants to build a £15bn data centre campus in the North East. It needs a grid connection in 18 months and lighter planning rules.',
    opts:[
      {t:'Fast-track it', f:()=>{G.potential(.05);G.conf(4);G.svc('environment',-2);G.gw({business:3,working:2,young:-1});return 'Construction starts within a year. 3,000 jobs are promised.';}},
      {t:'Insist on clean power and local jobs', f:()=>{if(chance(.5)){G.potential(.04);G.conf(2);G.gw({working:2,young:1});return 'The company agrees. A smaller but greener campus goes ahead.';}G.conf(-2);return 'The company takes the investment to Ireland.';}}
    ]},
  {id:'housebuilding', cat:'Housing', title:'Housebuilders cut output', w:1.5, cool:80,
    when:S=>S.econ.rate>4,
    text:S=>`High mortgage rates mean new-build sales have collapsed. The big five housebuilders will start ${f0(30+Math.random()*20)},000 fewer homes this year.`,
    opts:[
      {t:'A new help-to-buy scheme', h:'£3bn', f:()=>{G.oneOff(3);G.svc('housing',3);G.gw({young:3,middle:2});G.shock(0,.1);return 'Sales pick up. Economists say it mostly pushes up prices.';}},
      {t:'Buy unsold homes for social rent', h:'£2bn', f:()=>{G.oneOff(2);G.svc('housing',4);G.gw({young:2,working:2});return 'Councils get 8,000 homes at a discount.';}},
      {t:'Wait for rates to fall', f:()=>{G.svc('housing',-3);return 'Completions drop to a ten-year low.';}}
    ]}
];

/* The PMQs topic list. Each picks a question when its issue is weak. */
const PMQ_TOPICS = [
  {k:'health', q:S=>`The waiting list is ${f1(G.waitList())} million. When will the Prime Minister admit the NHS is in crisis on their watch?`},
  {k:'col', q:S=>`Inflation is ${f1(S.econ.inflation)}%. Families can't afford the weekly shop. What does the Prime Minister say to them?`},
  {k:'economy', q:S=>`Growth is ${f1(S.econ.growth)}%. Isn't it the truth that this government has no plan for the economy?`},
  {k:'immigration', q:S=>`Net migration is ${f0(S.econ.migration)},000. Why has the Prime Minister lost control of our borders?`},
  {k:'housing', q:S=>`Only ${f0(G.homes())},000 homes were built last year. Why can't a single young person in my constituency afford to buy?`},
  {k:'crime', q:S=>`Only ${f1(G.chargeRate())}% of crimes lead to a charge. Why are criminals getting away with it?`},
  {k:'mortgage', q:S=>`Bank Rate is ${f1(S.econ.rate)}%. Why are homeowners paying for this government's mistakes?`},
  {k:'tax', q:S=>`The tax burden is ${f1(G.taxBurden())}% of GDP. Isn't this the highest-taxing government in living memory?`},
  {k:'scandal', q:S=>'The Prime Minister\'s government is mired in sleaze. Will they finally publish the ministerial interests register?'}
];
