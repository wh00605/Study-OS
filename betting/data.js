// Nations League matchday 4, Tuesday 6 October 2026.
// Results and standings checked against each other (goals for/against and points
// rebuilt from the match list). Odds are market prices reported in previews on the
// day, not a live bet365 feed. Prices tagged src: "bet365" were quoted as bet365 in
// a preview; everything else is a market consensus reference.
window.NL_DATA = {
  asOf: "2026-10-06T18:20:00Z",
  groups: {
    A3: {
      name: "League A, Group 3",
      results: [
        ["England", "Spain", 2, 3], ["Croatia", "Czechia", 2, 1],
        ["Czechia", "England", 0, 2], ["Spain", "Croatia", 4, 1],
        ["Croatia", "England", 0, 7], ["Spain", "Czechia", 3, 1]
      ]
    },
    B1: {
      name: "League B, Group 1",
      results: [
        ["Slovenia", "Scotland", 0, 0], ["North Macedonia", "Switzerland", 0, 3],
        ["Scotland", "Switzerland", 0, 3], ["Slovenia", "North Macedonia", 2, 0],
        ["North Macedonia", "Scotland", 0, 2], ["Switzerland", "Slovenia", 2, 1]
      ]
    },
    C1: {
      name: "League C, Group 1",
      results: [
        ["Albania", "Belarus", 2, 0], ["San Marino", "Finland", 0, 7],
        ["Finland", "Belarus", 0, 0], ["San Marino", "Albania", 0, 3],
        ["Finland", "Albania", 2, 1], ["Belarus", "San Marino", 4, 0]
      ]
    },
    C3: {
      name: "League C, Group 3",
      results: [
        ["Faroe Islands", "Kazakhstan", 1, 1], ["Slovakia", "Moldova", 2, 0],
        ["Moldova", "Faroe Islands", 1, 1], ["Slovakia", "Kazakhstan", 2, 1],
        ["Kazakhstan", "Moldova", 1, 2], ["Faroe Islands", "Slovakia", 1, 1]
      ]
    },
    C4: {
      name: "League C, Group 4",
      results: [
        ["Bulgaria", "Luxembourg", 1, 2], ["Iceland", "Estonia", 1, 1],
        ["Bulgaria", "Estonia", 0, 0], ["Luxembourg", "Iceland", 0, 3],
        ["Estonia", "Luxembourg", 1, 0], ["Iceland", "Bulgaria", 3, 0]
      ]
    }
  },
  matches: [
    {
      id: "cro-esp", group: "A3", home: "Croatia", away: "Spain",
      ko: "2026-10-06T18:45:00Z", venue: "Stadion Poljud, Split", neutral: false,
      market: { h: 12.5, d: 7.14, a: 1.266, over25: 1.44, conf: "high" },
      bet365: { "o2.5": 1.44, "btts_y": 1.83, "eh_h+2_h": 2.0 },
      notes: [
        "Spain won the reverse fixture 4-1 last week and are unbeaten in 41.",
        "Croatia lost 7-0 at home to England on Saturday and have conceded 12 in 3.",
        "Market makes Spain about 75% after margin. Previews lean to 1-3 or 1-4."
      ]
    },
    {
      id: "eng-cze", group: "A3", home: "England", away: "Czechia",
      ko: "2026-10-06T18:45:00Z", venue: "Wembley Stadium, London", neutral: false,
      market: { h: 1.11, d: 8.45, a: 21.0, over25: 1.32, conf: "high" },
      bet365: {},
      notes: [
        "England won 2-0 in Prague and 7-0 in Croatia after losing 3-2 to Spain.",
        "Czechia have lost all three and scored 2.",
        "Kane leads the competition with 4 goals."
      ]
    },
    {
      id: "sco-svn", group: "B1", home: "Scotland", away: "Slovenia",
      ko: "2026-10-06T18:45:00Z", venue: "Hampden Park, Glasgow", neutral: false,
      market: { h: 1.82, d: 3.64, a: 4.85, conf: "medium" },
      bet365: {},
      notes: [
        "First meeting this campaign finished 0-0 in Slovenia.",
        "Neither side averages more than a goal a game in the group (Scotland 2 in 3, Slovenia 3 in 3).",
        "Both on 4 points, 5 behind Switzerland."
      ]
    },
    {
      id: "sui-mkd", group: "B1", home: "Switzerland", away: "North Macedonia",
      ko: "2026-10-06T18:45:00Z", venue: "Switzerland (home)", neutral: false,
      market: { h: 1.28, d: 5.75, a: 11.0, conf: "low" },
      bet365: {},
      notes: [
        "Sources disagree on the price: Switzerland quoted anywhere from 1.09 to 1.38. The 1X2 used here is a midpoint, so treat value calls on this match with caution.",
        "Switzerland: 3 wins, 8-1. North Macedonia: 3 defeats, 0-7, no goal scored.",
        "Switzerland won the reverse fixture 3-0."
      ]
    },
    {
      id: "alb-smr", group: "C1", home: "Albania", away: "San Marino",
      ko: "2026-10-06T18:45:00Z", venue: "Elbasan Arena", neutral: false,
      market: { h: 1.03, d: 15.0, a: 42.0, conf: "medium" },
      bet365: {},
      notes: [
        "Albania won 3-0 in San Marino last week. San Marino have conceded 14 in 3 without scoring.",
        "Albania lost 2-1 in Finland on Saturday.",
        "At 1.03 the win price has no betting interest. Look at handicaps and totals."
      ]
    },
    {
      id: "blr-fin", group: "C1", home: "Belarus", away: "Finland",
      ko: "2026-10-06T18:45:00Z", venue: "Illovszky Rudolf Stadion, Budapest (neutral)", neutral: true,
      market: null,
      bet365: {},
      notes: [
        "No reliable 1X2 price found. This match is model only, from group results, so confidence is low.",
        "The reverse fixture was 0-0 in Finland. Belarus beat San Marino 4-0 on Saturday.",
        "Belarus play home games in Hungary, so there is no home advantage in the model."
      ]
    },
    {
      id: "mda-svk", group: "C3", home: "Moldova", away: "Slovakia",
      ko: "2026-10-06T18:45:00Z", venue: "Moldova (home)", neutral: false,
      market: { h: 6.5, d: 4.4, a: 1.40, conf: "medium" },
      bet365: {},
      notes: [
        "Slovakia won the reverse fixture 2-0 and top the group on 7 points.",
        "Moldova have not won any of their last 8 home matches (D2 L6), per preview data.",
        "Both teams scored in 5 of Moldova's last 6, per preview data."
      ]
    },
    {
      id: "est-isl", group: "C4", home: "Estonia", away: "Iceland",
      ko: "2026-10-06T18:45:00Z", venue: "Lilleküla Stadium, Tallinn", neutral: false,
      market: { h: 5.0, d: 3.75, a: 1.62, over25: 1.80, conf: "medium" },
      bet365: { "d": 4.0 },
      notes: [
        "Reverse fixture was 1-1 in Iceland. Estonia have conceded 1 in 3.",
        "Iceland top the group: 7 points, 7-1.",
        "One preview quoted the draw at 3/1 with bet365. That is reported, not checked."
      ]
    },
    {
      id: "lux-bul", group: "C4", home: "Luxembourg", away: "Bulgaria",
      ko: "2026-10-06T18:45:00Z", venue: "Stade de Luxembourg", neutral: false,
      market: { h: 2.05, d: 3.20, a: 3.60, conf: "medium" },
      bet365: {},
      notes: [
        "Luxembourg won 2-1 in Bulgaria in the reverse fixture.",
        "Bulgaria have 1 goal in 3 and, per preview data, have not scored more than once in 11 straight away Nations League games.",
        "Under 2.5 was quoted around 1.44."
      ]
    },
    {
      id: "kaz-fro", group: "C3", home: "Kazakhstan", away: "Faroe Islands",
      ko: "2026-10-06T14:00:00Z", venue: "Astana Arena", neutral: false,
      market: { h: 2.37, d: 3.08, a: 3.09, conf: "medium" },
      bet365: {},
      final: [2, 2],
      notes: ["Played at 15:00 BST. Finished 2-2, with a red card for each side. Shown for the record only."]
    }
  ]
};
