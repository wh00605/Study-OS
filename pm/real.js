/* Number Ten: real Westminster data, PMQs question bank and the built-in policy model.
   MP lists and leaders reflect Parliament as of 2025-26. Ratings are game values, not judgements. */
'use strict';

const REAL_PARTIES = {
  L: { name: 'Labour', short: 'LAB' }, R: { name: 'Conservative', short: 'CON' }, LD: { name: 'Liberal Democrats', short: 'LD' },
  P: { name: 'Reform UK', short: 'REF' }, G: { name: 'Green Party', short: 'GRN' }, S: { name: 'SNP', short: 'SNP' },
  NI: { name: 'Northern Ireland parties', short: 'NI' }, O: { name: 'Plaid Cymru and others', short: 'OTH' }
};
const REAL_LEADERS = { L: 'Keir Starmer', R: 'Rishi Sunak', LD: 'Ed Davey', P: 'Nigel Farage', G: 'Carla Denyer', S: 'Stephen Flynn', O: 'Liz Saville Roberts' };
/* 2024 general election, 4 July 2024. NI = 17 Northern Ireland seats, O = Plaid (4), independents (6) and the Speaker. */
const REAL_2024_SEATS = { L: 411, R: 121, LD: 72, P: 5, G: 4, S: 9, NI: 17, O: 11 };
const REAL_2024_SHARES = { L: 33.7, R: 23.7, LD: 12.2, P: 14.3, G: 6.7, S: 2.5, NI: 1.6, O: 5.3 };

/* [name, wing (0/1/2 as in FACTIONS), competence, loyalty, ambition, profile, seat] */
const REAL_MPS = {
  L: [
    ['Keir Starmer',2,7,8,8,10,'Holborn and St Pancras'], ['Rachel Reeves',2,7,8,6,9,'Leeds West and Pudsey'], ['Angela Rayner',1,7,7,8,9,'Ashton-under-Lyne'],
    ['David Lammy',1,6,8,6,8,'Tottenham'], ['Yvette Cooper',2,8,7,6,8,'Pontefract, Castleford and Knottingley'], ['Shabana Mahmood',2,7,7,8,7,'Birmingham Ladywood'],
    ['Wes Streeting',2,7,6,9,8,'Ilford North'], ['Bridget Phillipson',2,6,8,6,6,'Houghton and Sunderland South'], ['John Healey',2,7,8,4,6,'Rawmarsh and Conisbrough'],
    ['Ed Miliband',1,7,7,5,8,'Doncaster North'], ['Louise Haigh',1,7,5,7,7,'Sheffield Heeley'], ['Jonathan Reynolds',2,6,8,5,5,'Stalybridge and Hyde'],
    ['Alan Campbell',2,6,9,3,4,'Tynemouth'], ['Steve Reed',2,6,8,5,5,'Streatham and Croydon North'], ['Peter Kyle',2,6,8,6,6,'Hove and Portslade'],
    ['Heidi Alexander',2,7,8,4,5,'Swindon South'], ['Pat McFadden',2,8,9,4,6,'Wolverhampton South East'], ['Lisa Nandy',1,6,6,6,7,'Wigan'],
    ['Liz Kendall',2,6,8,5,6,'Leicester West'], ['Darren Jones',2,7,8,7,6,'Bristol North West'], ['Emma Reynolds',2,6,8,5,4,'Wycombe'],
    ['Lucy Powell',1,6,5,7,7,'Manchester Central'], ['Jess Phillips',2,6,6,6,8,'Birmingham Yardley'], ['Emily Thornberry',1,6,6,6,7,'Islington South and Finsbury'],
    ['Dawn Butler',1,5,6,6,6,'Brent East'], ['Meg Hillier',2,7,7,4,5,'Hackney South and Shoreditch'], ['James Murray',2,7,8,5,4,'Ealing North'],
    ['Alison McGovern',1,6,8,5,4,'Birkenhead'], ['Anneliese Dodds',1,6,6,4,5,'Oxford East'], ['Clive Lewis',0,6,3,5,6,'Norwich South'],
    ['John McDonnell',0,7,2,4,8,'Hayes and Harlington'], ['Richard Burgon',0,5,2,5,5,'Leeds East'], ['Rebecca Long-Bailey',0,5,3,4,5,'Salford'],
    ['Rachael Maskell',0,6,3,4,5,'York Central']
  ],
  R: [
    ['Kemi Badenoch',2,7,6,9,9,'North West Essex'], ['Rishi Sunak',1,7,7,3,9,'Richmond and Northallerton'], ['Jeremy Hunt',0,8,7,5,8,'Godalming and Ash'],
    ['James Cleverly',1,7,7,7,7,'Braintree'], ['Priti Patel',2,6,6,7,8,'Witham'], ['Mel Stride',1,7,8,5,6,'Central Devon'],
    ['Chris Philp',2,6,7,6,6,'Croydon South'], ['Tom Tugendhat',0,7,6,7,7,'Tonbridge'], ['Victoria Atkins',0,6,7,5,5,'Louth and Horncastle'],
    ['Claire Coutinho',1,7,7,7,6,'East Surrey'], ['Laura Trott',1,6,8,5,5,'Sevenoaks'], ['Helen Whately',1,6,8,4,5,'Faversham and Mid Kent'],
    ['James Cartlidge',1,6,8,5,4,'South Suffolk'], ['Andrew Griffith',2,6,7,5,4,'Arundel and South Downs'], ['Stuart Andrew',0,6,8,4,4,'Daventry'],
    ['Alex Burghart',1,7,8,5,4,'Brentwood and Ongar'], ['Neil O’Brien',1,7,6,6,5,'Harborough, Oadby and Wigston'], ['Esther McVey',2,5,6,5,6,'Tatton'],
    ['Richard Holden',1,5,7,6,5,'Basildon and Billericay'], ['Kevin Hollinrake',1,6,8,4,4,'Thirsk and Malton'], ['John Glen',0,7,8,4,4,'Salisbury'],
    ['Kit Malthouse',1,6,6,6,5,'North West Hampshire'], ['Edward Argar',0,7,8,4,4,'Melton and Syston'], ['Gareth Bacon',2,6,8,4,3,'Orpington'],
    ['Rebecca Harris',1,6,9,3,3,'Castle Point']
  ],
  LD: [
    ['Ed Davey',1,7,8,8,9,'Kingston and Surbiton'], ['Daisy Cooper',1,7,8,6,7,'St Albans'], ['Wendy Chamberlain',1,6,8,5,5,'North East Fife'],
    ['Layla Moran',0,6,7,6,6,'Oxford West and Abingdon'], ['Tim Farron',0,6,7,4,6,'Westmorland and Lonsdale'], ['Munira Wilson',0,6,8,5,5,'Twickenham'],
    ['Christine Jardine',1,6,8,4,4,'Edinburgh West'], ['Alistair Carmichael',2,7,7,4,5,'Orkney and Shetland'], ['Sarah Olney',2,6,8,5,5,'Richmond Park'],
    ['Calum Miller',1,6,8,5,4,'Bicester and Woodstock'], ['Helen Morgan',1,6,8,5,4,'North Shropshire'], ['Lisa Smart',1,6,8,4,3,'Hazel Grove'],
    ['Zöe Franklin',0,5,8,4,3,'Guildford'], ['Vikki Slade',1,6,8,4,3,'Mid Dorset and North Poole']
  ],
  P: [
    ['Nigel Farage',1,7,8,10,10,'Clacton'], ['Richard Tice',1,6,8,6,7,'Boston and Skegness'], ['Lee Anderson',2,5,7,6,8,'Ashfield'],
    ['Danny Kruger',0,7,7,6,6,'East Wiltshire'], ['Sarah Pochin',1,5,7,4,4,'Runcorn and Helsby']
  ],
  G: [
    ['Carla Denyer',1,7,8,6,7,'Bristol Central'], ['Siân Berry',0,7,7,5,6,'Brighton Pavilion'], ['Adrian Ramsay',2,7,8,5,6,'Waveney Valley'],
    ['Ellie Chowns',2,7,8,5,5,'North Herefordshire']
  ]
};
/* Opening cabinets. Labour's is the one appointed on 5 July 2024; the others are what-if line-ups. */
const REAL_CABINETS = {
  L: { chancellor:'Rachel Reeves', foreign:'David Lammy', home:'Yvette Cooper', health:'Wes Streeting', education:'Bridget Phillipson', defence:'John Healey', housing:'Angela Rayner', energy:'Ed Miliband', transport:'Louise Haigh', business:'Jonathan Reynolds', whip:'Alan Campbell' },
  R: { chancellor:'Mel Stride', foreign:'Priti Patel', home:'Chris Philp', health:'Stuart Andrew', education:'Laura Trott', defence:'James Cartlidge', housing:'James Cleverly', energy:'Claire Coutinho', transport:'Richard Holden', business:'Andrew Griffith', whip:'Rebecca Harris' },
  LD: { chancellor:'Daisy Cooper', foreign:'Calum Miller', home:'Alistair Carmichael', health:'Helen Morgan', education:'Munira Wilson', defence:'Wendy Chamberlain', housing:'Sarah Olney', energy:'Layla Moran', transport:'Lisa Smart', business:'Christine Jardine', whip:'Tim Farron' },
  P: { chancellor:'Richard Tice', home:'Lee Anderson', business:'Danny Kruger', whip:'Sarah Pochin' },
  G: { chancellor:'Adrian Ramsay', energy:'Siân Berry', health:'Ellie Chowns' }
};
const DEFAULT_PM = { L: 'Keir Starmer', R: 'Kemi Badenoch', LD: 'Ed Davey', P: 'Nigel Farage', G: 'Carla Denyer' };

/* How each party can remove its own leader. pct = share of the party's MPs needed. */
const LEAD_RULES = {
  R:  { pct: .15, what: 'letters to the 1922 Committee', vote: 'mps', label: 'Letters' },
  L:  { pct: .20, what: 'MPs nominating a challenger', vote: 'members', label: 'Nominations' },
  LD: { pct: .25, what: 'MPs calling for a contest', vote: 'members', label: 'Calls to quit' },
  P:  { pct: .34, what: 'board members and MPs calling for change', vote: 'board', label: 'Calls to quit' },
  G:  { pct: .25, what: 'members of the party executive calling for change', vote: 'members', label: 'Calls to quit' }
};

/* PMQs: what each party's leader likes to ask about. k matches an issue in issues(). */
const PARTY_QS = {
  R: [
    { k: 'tax', q: S => `The tax burden is ${f1(G.taxBurden())}% of GDP, the highest in decades. Why does the Prime Minister keep making working people pay more?` },
    { k: 'economy', q: S => `Growth is ${f1(S.econ.growth)}%. Businesses tell me they have stopped hiring. Will the Prime Minister admit their plan has failed?` },
    { k: 'immigration', q: S => `Net migration is running at ${f0(S.econ.migration)},000 a year. When will this government get a grip on our borders?` },
    { k: 'mortgage', q: S => `Mortgage holders are paying for this government's borrowing. Why should families pay for their mistakes?` },
    { k: 'crime', q: S => `Only ${f1(G.chargeRate())}% of crimes end in a charge. Why are criminals getting away with it on this Prime Minister's watch?` }
  ],
  L: [
    { k: 'health', q: S => `${f1(G.waitList())} million people are on NHS waiting lists. Patients are waiting on trolleys in corridors. When will the Prime Minister act?` },
    { k: 'col', q: S => `Inflation is ${f1(S.econ.inflation)}%. Families are choosing between heating and eating. What does the Prime Minister say to them?` },
    { k: 'pay', q: S => `Nurses and teachers have seen their real pay fall. Why does this government think public servants should foot the bill?` },
    { k: 'housing', q: S => `Only ${f0(G.homes())},000 homes were built last year. A generation has given up on owning a home. Where is the plan?` },
    { k: 'jobs', q: S => `Unemployment is ${f1(S.econ.unemp)}%. What does the Prime Minister say to the people losing their jobs this week?` }
  ],
  LD: [
    { k: 'health', q: S => `Only ${G.ae()}% of A&E patients are seen within four hours, and care homes are closing. When will the Prime Minister fix social care?` },
    { k: 'environment', q: S => `Water companies are pumping sewage into our rivers and paying bonuses. Will the Prime Minister finally scrap Ofwat?` },
    { k: 'col', q: S => `Pensioners in my constituency can't afford their energy bills. Will the Prime Minister cut VAT on energy?` },
    { k: 'education', q: S => `Children with special needs are waiting years for support. Will the Prime Minister fund SEND properly?` },
    { k: 'economy', q: S => `Exporters are drowning in red tape. Will the Prime Minister negotiate a customs union with Europe?` }
  ],
  P: [
    { k: 'immigration', q: S => `${f0(S.econ.migration)},000 a year, and the boats keep coming. When will the Prime Minister stop the boats?` },
    { k: 'col', q: S => `Energy bills are among the highest in Europe because of net zero. Will the Prime Minister scrap the green levies?` },
    { k: 'crime', q: S => `Shoplifting is out of control and the police don't turn up. Why has this Prime Minister given up on law and order?` },
    { k: 'tax', q: S => `Working people pay more tax than ever while billions go on hotels for asylum seekers. Why?` },
    { k: 'economy', q: S => `Britain is getting poorer. Isn't the truth that both old parties have failed this country?` }
  ],
  G: [
    { k: 'environment', q: S => `We are ${f0(emissions())}% below 1990 emissions and off track for net zero. Why is the government still approving new oil and gas?` },
    { k: 'housing', q: S => `Rents are rising faster than wages. Will the Prime Minister bring in rent controls?` },
    { k: 'inequality', q: S => `Britain's richest 50 families hold more wealth than half the population. Will the Prime Minister introduce a wealth tax?` },
    { k: 'health', q: S => `NHS staff are leaving in their thousands. Will the Prime Minister give them a proper pay rise?` }
  ],
  S: [
    { k: 'col', q: S => `Scottish households pay some of the highest energy bills in Europe while living next to the North Sea. Why?` },
    { k: 'economy', q: S => `Brexit has cost Scotland billions. When will the Prime Minister respect Scotland's vote to remain?` },
    { k: 'scotland', q: S => `Scotland has voted for independence-supporting majorities again and again. Will the Prime Minister respect democracy and allow a referendum?` }
  ]
};
const TOPIC_WORDS = {
  health: ['nhs','hospital','waiting','doctor','nurse','a&e','patient','care'], col: ['inflation','bill','price','cost','energy','wage','pay'],
  economy: ['growth','economy','jobs','business','invest'], immigration: ['migration','border','boat','visa','asylum','return','deport'],
  housing: ['home','house','build','rent','planning'], crime: ['police','crime','officer','sentence','prison','court'],
  mortgage: ['mortgage','rate','bank','inflation'], tax: ['tax','burden','threshold','revenue'], scandal: ['standard','ethic','register','inquiry'],
  pay: ['pay','nurse','teacher','award','wage'], jobs: ['job','employment','work','skills'], environment: ['climate','emission','renewable','sewage','water','net zero','green'],
  education: ['school','teacher','send','pupil','children'], inequality: ['tax','wealth','fair','rich'], scotland: ['union','referendum','scotland','scottish'],
  bill: ['bill','law','plan','vote','policy']
};

/* Built-in policy model, used when Claude is not available to the page.
   Each entry: re matches the topic. up/down are effects when the clause pushes the topic up or down.
   inv: the noun is a burden, so cutting it helps (tuition fees, rents). fixed: always one direction. */
const UP_WORDS = ['raise','increase','expand','invest','boost','more','fund','build','extend','hire','recruit','introduce','create','double','protect','support','subsidise','subsidize','guarantee','legalise','legalize','decriminalise','decriminalize','rejoin','strengthen','tougher','longer','join','grow','lift','treble','triple','add','restore','put','bring','give','pay','tax','hike','new','universal','free'];
const DOWN_WORDS = ['cut','reduce','lower','scrap','abolish','ban','end','freeze','cap','limit','restrict','slash','halve','remove','tighten','stop','deport','leave','withdraw','crack','curb','fewer','less','axe','close','release','shorter','lighter','sell','outlaw','prohibit','exit','quit','tackle'];
const POLICY_LEX = [
  { id:'pensionage', re:/pension age|retirement age/, dept:'Work and Pensions',
    up:{spend:{welfare:-6}, cred:3, groups:{pensioners:-5,working:-6}, ideo:.4, note:'Raising the pension age saves about £6bn a year per year of age.'},
    down:{spend:{welfare:6}, cred:-3, groups:{working:5,pensioners:2}, ideo:-.4, note:'Lowering the pension age costs about £6bn a year per year of age.'}},
  { id:'income', re:/income tax|basic rate|higher rate|top rate|additional rate|personal allowance/, dept:'Treasury',
    up:{revenue:14, groups:{working:-5,middle:-6,public:-3,young:-2}, ideo:-.35, breaks:['no_income_tax'], note:'Each penny on the basic rate raises about £7bn a year.'},
    down:{revenue:-14, cred:-2, groups:{working:4,middle:5,public:2,young:2}, ideo:.4, note:'Each penny off the basic rate costs about £7bn a year.'}},
  { id:'vat', re:/\bvat\b/, dept:'Treasury',
    up:{revenue:16, infl:.5, groups:{working:-5,pensioners:-3,middle:-3}, ideo:.1, breaks:['no_vat'], note:'Each point of VAT raises about £8bn a year and briefly pushes up inflation.'},
    down:{revenue:-16, infl:-.4, groups:{working:4,pensioners:2,middle:2}, ideo:0, note:'Each point off VAT costs about £8bn a year.'}},
  { id:'ni', re:/national insurance|\bnics?\b/, dept:'Treasury',
    up:{revenue:10, unemp:.05, groups:{working:-4,young:-3,middle:-3,business:-3}, ideo:-.2, breaks:['no_ni'], note:'A point on National Insurance raises about £5bn from employees.'},
    down:{revenue:-10, groups:{working:3,young:2,middle:2,business:2}, ideo:.3}},
  { id:'corp', re:/corporation tax|business tax|tax on (?:companies|business)|profits tax/, dept:'Treasury',
    up:{revenue:8, conf:-6, potential:-.05, groups:{business:-7,working:1}, ideo:-.4, note:'Each point of corporation tax is worth about £3.5bn, less once firms respond.'},
    down:{revenue:-8, conf:6, potential:.05, groups:{business:6,working:-1}, ideo:.45}},
  { id:'wealth', re:/wealth tax|billionaire|millionaire|the rich\b|super-rich|wealthiest|top 1%/, fixed:'up', dept:'Treasury',
    up:{revenue:9, conf:-6, cred:-2, groups:{working:4,young:4,public:2,business:-7,middle:-1}, ideo:-.7, note:'Wealth taxes usually raise less than forecast as assets move abroad.'}},
  { id:'iht', re:/inheritance tax|death tax/, dept:'Treasury',
    up:{revenue:3, groups:{pensioners:-5,middle:-4}, ideo:-.4}, down:{revenue:-7, groups:{pensioners:4,middle:4,young:-1}, ideo:.5, note:'Abolishing inheritance tax costs about £7bn a year.'}},
  { id:'cgt', re:/capital gains/, dept:'Treasury', up:{revenue:4, conf:-2, groups:{middle:-2,business:-3}, ideo:-.4}, down:{revenue:-3, conf:2, groups:{business:3}, ideo:.4}},
  { id:'fuel', re:/fuel duty|petrol price|diesel/, dept:'Treasury', up:{revenue:3, infl:.1, groups:{working:-4,pensioners:-2,business:-2}, ideo:-.1}, down:{revenue:-3, infl:-.1, groups:{working:3,pensioners:1,business:1,young:-1}, ideo:.2}},
  { id:'councilTax', re:/council tax/, dept:'Housing', up:{revenue:4, groups:{middle:-3,pensioners:-3,working:-2}, ideo:-.2}, down:{revenue:-4, groups:{middle:2,pensioners:2,working:2}, ideo:.3}},
  { id:'stamp', re:/stamp duty/, dept:'Treasury', up:{revenue:3, groups:{middle:-3,young:-2}, ideo:-.2}, down:{revenue:-3, svc:{housing:1}, groups:{young:3,middle:2}, ideo:.3}},
  { id:'windfall', re:/windfall|energy profits|oil and gas profits|excess profits/, fixed:'up', dept:'Treasury',
    up:{revenue:5, conf:-3, groups:{working:3,pensioners:2,business:-3}, ideo:-.4}},
  { id:'waits', re:/waiting lists?|waiting times?|\bwaits\b/, inv:true, dept:'Health',
    up:{spend:{health:3}, svc:{health:6}, groups:{pensioners:4,middle:2}, ideo:0, note:'Cutting waits needs staff and theatres, not just targets.'}},
  { id:'nhs', re:/\bnhs\b|hospital|doctors?|nurses?|\bgps?\b|a&e|health service/, dept:'Health',
    up:{spend:{health:6}, svc:{health:8}, groups:{pensioners:5,public:4,middle:2,working:2}, ideo:-.15, note:'Health spending of £6bn a year buys roughly a 3% real rise.'},
    down:{spend:{health:-5}, svc:{health:-8}, groups:{pensioners:-6,public:-6,middle:-3,working:-3}, ideo:.4}},
  { id:'care', re:/social care|care homes?|elderly care|carers?/, dept:'Health',
    up:{spend:{health:4}, svc:{health:4}, groups:{pensioners:6,middle:2}, ideo:-.2}, down:{spend:{health:-2}, svc:{health:-3}, groups:{pensioners:-5}, ideo:.3}},
  { id:'mental', re:/mental health/, dept:'Health', up:{spend:{health:1.5}, svc:{health:2}, groups:{young:3,public:1}, ideo:-.1}},
  { id:'meals', re:/school meals|breakfast clubs?/, fixed:'up', dept:'Education', up:{spend:{education:1.8}, svc:{education:3}, groups:{working:4,middle:2,public:2}, ideo:-.3}},
  { id:'tuition', re:/tuition|student (?:loans?|debt)/, inv:true, dept:'Education',
    up:{spend:{education:7}, cred:-2, groups:{young:9,middle:2,pensioners:-1}, ideo:-.45, note:'Abolishing tuition fees costs about £7bn a year.'},
    down:{spend:{education:-1}, groups:{young:-6}, ideo:.4}},
  { id:'school', re:/schools?|teachers?|pupils|classrooms?|\bsend\b|special needs/, dept:'Education',
    up:{spend:{education:4}, svc:{education:7}, groups:{public:3,middle:3,working:2}, ideo:-.15},
    down:{spend:{education:-3}, svc:{education:-6}, groups:{public:-4,middle:-3}, ideo:.35}},
  { id:'unis', re:/universit/, dept:'Education', up:{spend:{education:2}, potential:.03, groups:{young:3,middle:1}, ideo:-.1}, down:{spend:{education:-2}, groups:{young:-3}, ideo:.3}},
  { id:'childcare', re:/childcare|nurser(?:y|ies)/, dept:'Education', up:{spend:{education:4}, potential:.05, unemp:-.05, groups:{young:5,working:3,middle:3}, ideo:-.2}},
  { id:'police', re:/police|officers|neighbourhood policing/, dept:'Home Office',
    up:{spend:{police:2.5}, svc:{crime:9}, groups:{pensioners:4,middle:2,working:2}, ideo:.15, note:'20,000 officers cost about £2.5bn a year.'},
    down:{spend:{police:-2}, svc:{crime:-8}, groups:{pensioners:-4,middle:-2}, ideo:-.1}},
  { id:'prisons', re:/prisons?|sentenc|jail|criminals|knife crime|shoplift/, dept:'Justice',
    up:{spend:{police:1.5}, oneOff:3, svc:{crime:5}, groups:{pensioners:4,working:2,young:-1}, ideo:.45},
    down:{spend:{police:-1}, svc:{crime:-2}, groups:{pensioners:-3}, ideo:-.3}},
  { id:'death', re:/death penalty|capital punishment|hanging/, fixed:'up', dept:'Justice',
    up:{intl:-10, media:-2, groups:{pensioners:3,working:2,young:-6,middle:-4,public:-3}, ideo:.95, note:'This would breach the UK\'s human rights treaty obligations.'}},
  { id:'migration', re:/immigra|migrants?|migration|visas?|asylum|refugees?|small boats|channel crossings|deport|borders?|illegal arrivals/, dept:'Home Office',
    up:{migT:120, potential:.1, svc:{housing:-3}, groups:{business:5,young:3,pensioners:-6,working:-5}, ideo:-.45},
    down:{migT:-120, potential:-.1, conf:-2, svc:{health:-2}, groups:{pensioners:6,working:5,business:-5,young:-3}, ideo:.55, note:'Lower migration eases housing demand but shrinks the workforce and the tax base.'}},
  { id:'rentcontrol', re:/rent controls?|rent caps?|cap(?:ping)? rents/, fixed:'up', dept:'Housing',
    up:{svc:{housing:-3}, groups:{young:8,working:2,middle:-3,business:-2}, ideo:-.6, note:'Rent controls help sitting tenants but tend to shrink the supply of rented homes.'}},
  { id:'rents', re:/rents?\b|rent control|landlords?|renters?|evictions?/, inv:true, dept:'Housing',
    up:{svc:{housing:-3}, groups:{young:8,working:2,middle:-3,business:-2}, ideo:-.6, note:'Rent controls help sitting tenants but tend to shrink the supply of rented homes.'}},
  { id:'greenbelt', re:/green belt|grey belt|countryside/, inv:true, dept:'Housing',
    up:{potential:.05, svc:{housing:8}, groups:{young:5,business:2,pensioners:-5,middle:-3}, ideo:.1},
    down:{svc:{housing:-4}, groups:{pensioners:3,middle:2,young:-3}, ideo:.2}},
  { id:'housing', re:/housing|homes|houses|housebuild|council homes|social homes|new towns/, dept:'Housing',
    up:{spend:{housing:4}, svc:{housing:10}, groups:{young:6,working:3}, ideo:-.15, note:'100,000 social homes a year cost about £8bn.'},
    down:{svc:{housing:-6}, groups:{young:-5}, ideo:.2}},
  { id:'planning', re:/planning|nimby/, fixed:'up', dept:'Housing', up:{potential:.1, svc:{housing:8}, groups:{young:5,business:3,pensioners:-4,middle:-2}, ideo:.15}},
  { id:'netzero', re:/net zero|renewables?|wind farms?|solar|climate|emissions|green energy|carbon|insulat|heat pumps?|clean power/, dept:'Energy',
    up:{spend:{environment:5}, svc:{environment:12}, infl:.05, potential:.03, groups:{young:7,middle:3,working:-2,pensioners:-1}, ideo:-.4},
    down:{spend:{environment:-3}, svc:{environment:-10}, groups:{young:-6,working:2,pensioners:2}, ideo:.5}},
  { id:'fossil', re:/\boil\b|\bgas\b|fracking|north sea|\bcoal\b/, dept:'Energy',
    up:{revenue:2, svc:{environment:-10}, intl:-2, groups:{working:2,business:3,young:-6}, ideo:.5},
    down:{revenue:-2, svc:{environment:6}, groups:{young:4,working:-2,business:-2}, ideo:-.5}},
  { id:'nuclear', re:/nuclear/, dept:'Energy', up:{spend:{environment:3}, svc:{environment:5}, potential:.03, groups:{business:2,middle:1,young:-1}, ideo:.2}, down:{svc:{environment:-3}, ideo:-.3}},
  { id:'bills', re:/energy bills?|price cap|heating bills?|fuel poverty/, inv:true, dept:'Energy',
    up:{oneOff:8, infl:-.3, cred:-2, groups:{working:4,pensioners:4,middle:2}, ideo:-.2}},
  { id:'water', re:/water compan|sewage|rivers?|ofwat/, fixed:'up', dept:'Environment', up:{svc:{environment:6}, conf:-1, groups:{working:2,middle:3,pensioners:2,young:2}, ideo:-.2}},
  { id:'defence', re:/defen[cs]e|military|army|navy|\braf\b|armed forces|\bnato\b|soldiers/, dept:'Defence',
    up:{spend:{defence:8}, svc:{defence:10}, intl:5, groups:{pensioners:4,middle:1,young:-2}, ideo:.3, note:'Each 0.25% of GDP on defence costs about £7bn a year.'},
    down:{spend:{defence:-6}, svc:{defence:-10}, intl:-6, groups:{pensioners:-4,young:2}, ideo:-.4}},
  { id:'nationalservice', re:/national service|conscription/, fixed:'up', dept:'Defence', up:{spend:{defence:2.5}, groups:{pensioners:5,young:-8,middle:-1}, ideo:.6}},
  { id:'aid', re:/foreign aid|overseas aid|international development|aid budget/, dept:'Foreign Office',
    up:{spend:{other:4}, intl:6, groups:{young:2,pensioners:-3,working:-2}, ideo:-.4}, down:{spend:{other:-5}, intl:-7, groups:{pensioners:3,working:2,young:-2}, ideo:.5}},
  { id:'pension', re:/pensions?|triple lock|pensioners/, dept:'Work and Pensions',
    up:{spend:{welfare:6}, cred:-1, groups:{pensioners:8,young:-2}, ideo:-.1},
    down:{spend:{welfare:-6}, cred:3, groups:{pensioners:-10,young:1}, ideo:.4, breaks:['triple']}},
  { id:'benefits', re:/benefits?|universal credit|welfare|two-child|disability|jobseekers?|sickness/, dept:'Work and Pensions',
    up:{spend:{welfare:5}, groups:{working:5,public:2,middle:-1,pensioners:-1}, ideo:-.45},
    down:{spend:{welfare:-5}, unemp:-.05, cred:2, groups:{working:-5,public:-2,pensioners:2,middle:1}, ideo:.5}},
  { id:'minwage', re:/minimum wage|living wage/, dept:'Business',
    up:{unemp:.2, infl:.1, conf:-4, groups:{working:6,young:5,business:-7}, ideo:-.45}, down:{groups:{working:-6,young:-4,business:4}, ideo:.6}},
  { id:'fourday', re:/four[- ]day week|4[- ]day week/, fixed:'up', dept:'Business', up:{potential:-.1, conf:-6, groups:{working:4,young:6,public:3,business:-8}, ideo:-.6}},
  { id:'ubi', re:/universal basic income|\bubi\b/, fixed:'up', dept:'Work and Pensions', up:{spend:{welfare:60}, cred:-10, infl:.5, groups:{young:8,working:5,middle:-5,business:-5}, ideo:-.8, note:'A meaningful basic income costs tens of billions a year even after replacing benefits.'}},
  { id:'unions', re:/unions?|strikes?|workers'? rights|zero[- ]hours/, dept:'Business',
    up:{unemp:.1, conf:-4, groups:{working:4,public:5,business:-6}, ideo:-.45}, down:{groups:{public:-6,working:-3,business:4,pensioners:2}, ideo:.6}},
  { id:'nationalise', re:/nationali[sz]|public ownership|state ownership/, fixed:'up', dept:'Treasury',
    up:{oneOff:15, cred:-4, conf:-5, groups:{working:4,young:3,public:2,business:-6}, ideo:-.65, note:'Buying out shareholders is paid for with new government debt.'}},
  { id:'privatise', re:/privati[sz]|sell off|outsourc/, fixed:'up', dept:'Treasury', up:{oneOff:-10, conf:3, groups:{public:-6,working:-3,business:4}, ideo:.65}},
  { id:'transport', re:/rail|trains?|railways?|bus(?:es)?\b|transport|roads?\b|potholes|hs2|trams?/, dept:'Transport',
    up:{spend:{transport:3}, svc:{transport:8}, potential:.04, groups:{working:2,business:2,young:2}, ideo:-.05},
    down:{spend:{transport:-2}, svc:{transport:-7}, groups:{working:-2}, ideo:.2}},
  { id:'eu', re:/\beu\b|european union|single market|customs union|brexit|europe\b/, dept:'Foreign Office',
    up:{potential:.25, migT:60, intl:8, conf:4, unity:-4, groups:{young:7,middle:4,business:5,pensioners:-7,working:-5}, ideo:-.35, note:'Closer EU trade lifts growth over a decade but splits Leave voters.'},
    down:{potential:-.1, intl:-4, groups:{pensioners:4,working:3,young:-4,business:-3}, ideo:.5}},
  { id:'echr', re:/echr|human rights act|european convention/, dept:'Justice',
    up:{intl:2, groups:{young:2,public:1}, ideo:-.3}, down:{intl:-8, migT:-20, groups:{pensioners:4,working:3,young:-5,middle:-3}, ideo:.75, note:'Leaving the ECHR would strain the Good Friday Agreement and trade deals.'}},
  { id:'redtape', re:/regulations?|red tape|bureaucra|deregulat/, dept:'Business',
    up:{conf:-3, groups:{business:-4,public:1}, ideo:-.3}, down:{potential:.08, conf:5, svc:{environment:-2}, groups:{business:5,public:-1}, ideo:.45}},
  { id:'smallbiz', re:/small business|start-?ups?|entrepreneur|business rates|high street/, dept:'Business', up:{potential:.05, conf:4, revenue:-1, groups:{business:5,middle:1}, ideo:.2}},
  { id:'drugs', re:/cannabis|drugs?\b|marijuana/, dept:'Home Office',
    up:{revenue:1, svc:{crime:-1}, groups:{young:6,pensioners:-5,middle:-1}, ideo:-.3}, down:{svc:{crime:2}, groups:{pensioners:3,young:-3}, ideo:.4}},
  { id:'smoking', re:/smok|tobacco|vapes?|vaping|cigarettes?/, inv:true, dept:'Health', up:{svc:{health:2}, revenue:-.5, groups:{pensioners:1,middle:1,young:-2}, ideo:-.05}},
  { id:'socialmedia', re:/social media|online safety|smartphones?|tiktok/, inv:true, dept:'Culture', up:{groups:{middle:4,pensioners:3,young:-6,business:-2}, ideo:.05}},
  { id:'monarchy', re:/monarchy|royal family|republic/, dept:'Cabinet Office', up:{groups:{pensioners:2}, ideo:.3}, down:{media:-4, groups:{pensioners:-10,working:-4,middle:-4,young:2}, ideo:-.7}},
  { id:'lords', re:/house of lords|\blords\b|peers/, dept:'Cabinet Office', up:{ideo:.2}, down:{media:1, groups:{middle:1,young:2}, ideo:-.35}},
  { id:'pr', re:/proportional representation|electoral reform|voting system/, fixed:'up', dept:'Cabinet Office', up:{unity:-3, flag:'prRef', groups:{young:3,middle:2}, ideo:-.2}},
  { id:'votes16', re:/votes at 16|voting age|16-year-olds? (?:to )?vote/, fixed:'up', dept:'Cabinet Office', up:{flag:'votes16', groups:{young:5,pensioners:-2}, ideo:-.35}},
  { id:'indyref', re:/independence referendum|indyref|scottish independence/, fixed:'up', dept:'Cabinet Office', up:{unity:-4, groups:{pensioners:-2}, ideo:-.3}},
  { id:'tech', re:/artificial intelligence|\bai\b|science|research|technology|tech sector|innovation/, dept:'Science', up:{spend:{other:2}, potential:.08, conf:3, groups:{business:3,young:2,middle:1}, ideo:0}},
  { id:'digitalid', re:/digital id|id cards?|identity cards?/, fixed:'up', dept:'Cabinet Office', up:{spend:{other:.8}, migT:-15, media:-2, groups:{young:-3,middle:-2,pensioners:1}, ideo:.2}},
  { id:'sugar', re:/sugar|junk food|obesity/, fixed:'up', dept:'Health', up:{revenue:1, svc:{health:2}, groups:{working:-2,middle:1}, ideo:-.2}},
  { id:'gambling', re:/gambling|betting|bookmakers/, fixed:'up', dept:'Culture', up:{revenue:1, groups:{middle:1,working:1,business:-1}, ideo:-.1}}
];
