// Match model: Dixon-Coles adjusted Poisson. Every market below is read off the same
// score matrix, so bet builder legs combine exactly (no multiplying of correlated legs).
(function (root) {
  const MAXG = 10;
  const RHO = -0.06;          // Dixon-Coles low-score correction
  const HOME_ADV = 1.12;      // goal multiplier for the home side (and its inverse for the away side)
  const PRIOR_GAMES = 3;      // shrink group form toward the group average by this many games
  const MARKET_WEIGHT = 0.75; // blend weight on market-implied goal rates
  const HT_SHARE = 0.44;      // share of goals scored before half-time

  function pois(k, l) {
    let p = Math.exp(-l);
    for (let i = 1; i <= k; i++) p *= l / i;
    return p;
  }

  function tau(h, a, lh, la) {
    if (h === 0 && a === 0) return 1 - lh * la * RHO;
    if (h === 0 && a === 1) return 1 + lh * RHO;
    if (h === 1 && a === 0) return 1 + la * RHO;
    if (h === 1 && a === 1) return 1 - RHO;
    return 1;
  }

  function matrix(lh, la, dc = true) {
    const m = [];
    let s = 0;
    for (let h = 0; h <= MAXG; h++) {
      m[h] = [];
      for (let a = 0; a <= MAXG; a++) {
        const p = pois(h, lh) * pois(a, la) * (dc ? Math.max(tau(h, a, lh, la), 0) : 1);
        m[h][a] = p;
        s += p;
      }
    }
    for (let h = 0; h <= MAXG; h++) for (let a = 0; a <= MAXG; a++) m[h][a] /= s;
    return m;
  }

  function sumWhere(m, f) {
    let s = 0;
    for (let h = 0; h <= MAXG; h++) for (let a = 0; a <= MAXG; a++) if (f(h, a)) s += m[h][a];
    return s;
  }

  // Remove the bookmaker margin with the power method: find k with sum(p_i^k) = 1.
  function devig(odds) {
    const raw = odds.map(o => 1 / o);
    let lo = 0.5, hi = 3;
    for (let i = 0; i < 60; i++) {
      const k = (lo + hi) / 2;
      const s = raw.reduce((t, p) => t + Math.pow(p, k), 0);
      if (s > 1) lo = k; else hi = k;
    }
    const k = (lo + hi) / 2;
    return raw.map(p => Math.pow(p, k));
  }

  // Goal rates that reproduce the de-margined 1X2 (and over 2.5 when given).
  function fitMarket(mk) {
    const [pH, pD, pA] = devig([mk.h, mk.d, mk.a]);
    let pO = null;
    if (mk.over25) pO = Math.min(0.97, (1 / mk.over25) / 1.05); // assume ~5% margin on the over side
    const loss = (lh, la) => {
      const m = matrix(lh, la);
      const h = sumWhere(m, (x, y) => x > y), d = sumWhere(m, (x, y) => x === y), a = 1 - h - d;
      let e = (h - pH) ** 2 + (d - pD) ** 2 + (a - pA) ** 2;
      if (pO !== null) e += 0.5 * (sumWhere(m, (x, y) => x + y > 2) - pO) ** 2;
      return e;
    };
    let best = [1.3, 1.1], bestE = Infinity;
    for (let lh = 0.1; lh <= 6; lh += 0.1) for (let la = 0.05; la <= 4.5; la += 0.1) {
      const e = loss(lh, la);
      if (e < bestE) { bestE = e; best = [lh, la]; }
    }
    for (let step of [0.02, 0.005]) {
      const [ch, ca] = best;
      for (let lh = Math.max(0.05, ch - 0.12); lh <= ch + 0.12; lh += step)
        for (let la = Math.max(0.03, ca - 0.12); la <= ca + 0.12; la += step) {
          const e = loss(lh, la);
          if (e < bestE) { bestE = e; best = [lh, la]; }
        }
    }
    return { lh: best[0], la: best[1], pH, pD, pA, pO, fitErr: Math.sqrt(bestE / 3) };
  }

  function table(group) {
    const t = {};
    for (const [h, a, gh, ga] of group.results) {
      for (const n of [h, a]) t[n] = t[n] || { team: n, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
      const H = t[h], A = t[a];
      H.p++; A.p++; H.gf += gh; H.ga += ga; A.gf += ga; A.ga += gh;
      if (gh > ga) { H.w++; A.l++; H.pts += 3; H.form.push("W"); A.form.push("L"); }
      else if (gh < ga) { A.w++; H.l++; A.pts += 3; H.form.push("L"); A.form.push("W"); }
      else { H.d++; A.d++; H.pts++; A.pts++; H.form.push("D"); A.form.push("D"); }
    }
    return Object.values(t).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
  }

  // Goal rates from group form: attack and defence ratings shrunk toward the group mean.
  function fitStats(match, group) {
    const rows = table(group);
    const games = rows.reduce((s, r) => s + r.p, 0);
    const avg = rows.reduce((s, r) => s + r.gf, 0) / games; // goals per team per game
    const get = n => rows.find(r => r.team === n);
    const rate = (x, n) => ((x + PRIOR_GAMES * avg) / (n + PRIOR_GAMES)) / avg;
    const H = get(match.home), A = get(match.away);
    const adv = match.neutral ? 1 : HOME_ADV;
    return {
      lh: avg * rate(H.gf, H.p) * rate(A.ga, A.p) * adv,
      la: avg * rate(A.gf, A.p) * rate(H.ga, H.p) / adv,
      avg
    };
  }

  function rates(match, group) {
    const stats = fitStats(match, group);
    if (!match.market) return { lh: stats.lh, la: stats.la, stats, market: null };
    const market = fitMarket(match.market);
    const w = MARKET_WEIGHT;
    return {
      lh: Math.exp(w * Math.log(market.lh) + (1 - w) * Math.log(stats.lh)),
      la: Math.exp(w * Math.log(market.la) + (1 - w) * Math.log(stats.la)),
      stats, market
    };
  }

  // A market is {key, group, label, win, push} where win/push are predicates on (h, a).
  function fullTimeMarkets(home, away) {
    const L = [];
    const add = (group, key, label, win, push = null, leg = true) => L.push({ group, key, label, win, push, leg });
    add("Match result", "h", home + " win", (h, a) => h > a);
    add("Match result", "d", "Draw", (h, a) => h === a);
    add("Match result", "a", away + " win", (h, a) => h < a);
    add("Double chance", "dc_1x", home + " or draw", (h, a) => h >= a);
    add("Double chance", "dc_x2", away + " or draw", (h, a) => h <= a);
    add("Double chance", "dc_12", "Either team to win", (h, a) => h !== a);
    add("Draw no bet", "dnb_h", home + " (draw no bet)", (h, a) => h > a, (h, a) => h === a, false);
    add("Draw no bet", "dnb_a", away + " (draw no bet)", (h, a) => h < a, (h, a) => h === a, false);
    for (const l of [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]) {
      add("Total goals", "o" + l, "Over " + l + " goals", (h, a) => h + a > l);
      add("Total goals", "u" + l, "Under " + l + " goals", (h, a) => h + a < l);
    }
    add("Both teams to score", "btts_y", "Both teams to score: yes", (h, a) => h > 0 && a > 0);
    add("Both teams to score", "btts_n", "Both teams to score: no", (h, a) => h === 0 || a === 0);
    add("Result and BTTS", "h_btts", home + " win and BTTS", (h, a) => h > a && a > 0);
    add("Result and BTTS", "a_btts", away + " win and BTTS", (h, a) => a > h && h > 0);
    add("Result and BTTS", "d_btts", "Draw and BTTS", (h, a) => h === a && h > 0);
    add("Win to nil", "h_wtn", home + " to win to nil", (h, a) => h > a && a === 0);
    add("Win to nil", "a_wtn", away + " to win to nil", (h, a) => a > h && h === 0);
    for (const [side, name] of [["h", home], ["a", away]]) {
      const g = side === "h" ? (h, a) => h : (h, a) => a;
      for (const l of [0.5, 1.5, 2.5, 3.5]) {
        add("Team goals", side + "_o" + l, name + " over " + l + " goals", (h, a) => g(h, a) > l);
        add("Team goals", side + "_u" + l, name + " under " + l + " goals", (h, a) => g(h, a) < l);
      }
    }
    // Asian handicap on the home side; the away side is the mirror.
    for (const l of [-3.5, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3.5]) {
      const s = (l > 0 ? "+" : "") + l;
      const ms = (-l > 0 ? "+" : "") + (-l);
      const whole = Number.isInteger(l);
      add("Asian handicap", "ah_h" + s, home + " " + s, (h, a) => h - a + l > 0, whole ? (h, a) => h - a + l === 0 : null, !whole);
      add("Asian handicap", "ah_a" + ms, away + " " + ms, (h, a) => a - h - l > 0, whole ? (h, a) => h - a + l === 0 : null, !whole);
    }
    // European (3-way) handicap: the line is added to the home side's score.
    for (const l of [-3, -2, -1, 1, 2, 3]) {
      const s = (l > 0 ? "+" : "") + l;
      add("Handicap (3-way)", "eh_h" + s + "_h", home + " " + s + " (3-way handicap)", (h, a) => h + l > a);
      add("Handicap (3-way)", "eh_h" + s + "_d", "Handicap draw (" + home + " " + s + ")", (h, a) => h + l === a);
      add("Handicap (3-way)", "eh_h" + s + "_a", away + " win (" + home + " " + s + ")", (h, a) => h + l < a);
    }
    for (const n of [1, 2, 3]) {
      add("Winning margin", "h_by" + n, home + " by exactly " + n, (h, a) => h - a === n);
      add("Winning margin", "a_by" + n, away + " by exactly " + n, (h, a) => a - h === n);
    }
    add("Winning margin", "h_by4p", home + " by 4 or more", (h, a) => h - a >= 4);
    add("Winning margin", "a_by4p", away + " by 4 or more", (h, a) => a - h >= 4);
    add("Odd or even", "odd", "Odd total goals", (h, a) => (h + a) % 2 === 1);
    add("Odd or even", "even", "Even total goals", (h, a) => (h + a) % 2 === 0);
    for (let h = 0; h <= 5; h++) for (let a = 0; a <= 5; a++)
      add("Correct score", "cs" + h + "-" + a, home + " " + h + "-" + a + " " + away, (x, y) => x === h && y === a, null, false);
    return L;
  }

  // Half-based markets use independent Poisson halves (goal share HT_SHARE before the break).
  function halfMarkets(home, away, lh, la) {
    const n = 10;
    const h1 = [], a1 = [], h2 = [], a2 = [];
    for (let k = 0; k <= n; k++) {
      h1[k] = pois(k, lh * HT_SHARE); a1[k] = pois(k, la * HT_SHARE);
      h2[k] = pois(k, lh * (1 - HT_SHARE)); a2[k] = pois(k, la * (1 - HT_SHARE));
    }
    const prob = f => {
      let s = 0;
      for (let x1 = 0; x1 <= n; x1++) for (let y1 = 0; y1 <= n; y1++) {
        const p1 = h1[x1] * a1[y1];
        if (p1 < 1e-9) continue;
        for (let x2 = 0; x2 <= n; x2++) for (let y2 = 0; y2 <= n; y2++)
          if (f(x1, y1, x2, y2)) s += p1 * h2[x2] * a2[y2];
      }
      return s;
    };
    const res = (x, y) => (x > y ? "h" : x < y ? "a" : "d");
    const out = [];
    const add = (group, key, label, f) => out.push({ group, key, label, p: prob(f), pushP: 0 });
    add("Half-time result", "ht_h", home + " leading at half-time", (x1, y1) => x1 > y1);
    add("Half-time result", "ht_d", "Level at half-time", (x1, y1) => x1 === y1);
    add("Half-time result", "ht_a", away + " leading at half-time", (x1, y1) => x1 < y1);
    for (const l of [0.5, 1.5, 2.5]) {
      add("First-half goals", "ht_o" + l, "First half over " + l, (x1, y1) => x1 + y1 > l);
      add("First-half goals", "ht_u" + l, "First half under " + l, (x1, y1) => x1 + y1 < l);
    }
    for (const l of [0.5, 1.5, 2.5]) {
      add("Second-half goals", "sh_o" + l, "Second half over " + l, (a, b, x2, y2) => x2 + y2 > l);
    }
    add("Highest-scoring half", "hsh_1", "First half scores more", (x1, y1, x2, y2) => x1 + y1 > x2 + y2);
    add("Highest-scoring half", "hsh_2", "Second half scores more", (x1, y1, x2, y2) => x1 + y1 < x2 + y2);
    add("Highest-scoring half", "hsh_t", "Halves level", (x1, y1, x2, y2) => x1 + y1 === x2 + y2);
    add("Both halves", "h_bh", home + " to score in both halves", (x1, y1, x2) => x1 > 0 && x2 > 0);
    add("Both halves", "a_bh", away + " to score in both halves", (x1, y1, x2, y2) => y1 > 0 && y2 > 0);
    add("Both halves", "o05_bh", "A goal in both halves", (x1, y1, x2, y2) => x1 + y1 > 0 && x2 + y2 > 0);
    const names = { h: home, d: "Draw", a: away };
    for (const ht of ["h", "d", "a"]) for (const ft of ["h", "d", "a"])
      add("Half-time / full-time", "htft_" + ht + ft, names[ht] + " / " + names[ft],
        (x1, y1, x2, y2) => res(x1, y1) === ht && res(x1 + x2, y1 + y2) === ft);
    return out;
  }

  function analyse(match, group) {
    const r = rates(match, group);
    const m = matrix(r.lh, r.la);
    const ft = fullTimeMarkets(match.home, match.away).map(x => ({
      ...x, p: sumWhere(m, x.win), pushP: x.push ? sumWhere(m, x.push) : 0
    }));
    const half = halfMarkets(match.home, match.away, r.lh, r.la);
    const markets = ft.concat(half).map(x => ({ ...x, fair: fairOdds(x.p, x.pushP) }));
    return { rates: r, m, markets, table: table(group) };
  }

  // Fair decimal odds with pushes refunded: p*(o-1) = (1-p-push).
  function fairOdds(p, push = 0) {
    if (p <= 0) return Infinity;
    return 1 + (1 - p - push) / p;
  }

  function ev(p, push, odds) {
    return p * (odds - 1) - (1 - p - push);
  }

  function kelly(p, push, odds) {
    const b = odds - 1;
    if (b <= 0) return 0;
    const q = 1 - p - push;
    return Math.max(0, (b * p - q) / b);
  }

  function jointProb(m, legs) {
    return sumWhere(m, (h, a) => legs.every(l => l.win(h, a)));
  }

  root.NLModel = { matrix, sumWhere, devig, fitMarket, fitStats, rates, table, analyse, fairOdds, ev, kelly, jointProb, MAXG };
  if (typeof module !== "undefined") module.exports = root.NLModel;
})(typeof window !== "undefined" ? window : globalThis);
