(() => {
  'use strict';

  const D = window.INK_DATA;
  const LLAMA_DIM = '?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true';
  const API = {
    chains: 'https://api.llama.fi/v2/chains',
    tvlHistory: 'https://api.llama.fi/v2/historicalChainTvl/Ink',
    dexs: 'https://api.llama.fi/overview/dexs/ink' + LLAMA_DIM,
    fees: 'https://api.llama.fi/overview/fees/ink' + LLAMA_DIM,
    stables: 'https://stablecoins.llama.fi/stablecoinchains',
    protocols: 'https://api.llama.fi/lite/protocols2?b=2',
    yieldPool: (id) => `https://yields.llama.fi/poolsEnriched?pool=${id}`,
    dsTokens: (addrs) => `https://api.dexscreener.com/tokens/v1/ink/${addrs.join(',')}`,
    gtPools: (page) => `https://api.geckoterminal.com/api/v2/networks/ink/pools?page=${page}&sort=h24_volume_usd_desc&include=base_token`,
    gtTrending: 'https://api.geckoterminal.com/api/v2/networks/ink/trending_pools?duration=24h&include=base_token',
    nadoContracts: 'https://api.prod.nado.xyz/archive/v2/contracts',
    nadoSpot: 'https://api.prod.nado.xyz/archive/v2/tickers?market=spot',
    nadoApr: 'https://api.prod.nado.xyz/gateway/v2/apr',
    rpc: 'https://rpc-gel.inkonchain.com',
  };
  const LINKS = {
    explorerToken: (a) => `https://explorer.inkonchain.com/token/${a}`,
    explorerAddr: (a) => `https://explorer.inkonchain.com/address/${a}`,
    dsPair: (p) => `https://dexscreener.com/ink/${p}`,
    dsEmbed: (p) => `https://dexscreener.com/ink/${p}?embed=1&theme=dark&trades=0&info=0`,
    gtPool: (p) => `https://www.geckoterminal.com/ink/pools/${p}`,
    opensea: (slug) => `https://opensea.io/collection/${slug}`,
    seadn: (path) => `https://i2c.seadn.io/${path}${path.includes('?') ? '&' : '?'}h=360&w=360`,
    nado: 'https://app.nado.xyz?join=kripto1', // referral link
    quotrons: 'https://www.quotrons.cash',
  };

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

  async function getJSON(url, opts = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeout || 15000);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      if (!res.ok) throw new Error(`${res.status} ${new URL(url).host}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  const postJSON = (url, body) =>
    getJSON(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  // Small per-viewer cache for heavy, slow-moving responses. Storage can be unavailable; the page works without it.
  function cacheGet(key, maxAgeMs) {
    try {
      const raw = localStorage.getItem('inkcart:' + key);
      if (!raw) return null;
      const { t, v } = JSON.parse(raw);
      return Date.now() - t < maxAgeMs ? v : null;
    } catch { return null; }
  }
  function cacheSet(key, v) {
    try { localStorage.setItem('inkcart:' + key, JSON.stringify({ t: Date.now(), v })); } catch { /* quota or disabled */ }
  }

  function usd(v, { compact = true } = {}) {
    v = num(v);
    if (v === null || !isFinite(v)) return '—';
    const a = Math.abs(v);
    if (compact && a >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (compact && a >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (compact && a >= 1e4) return '$' + (v / 1e3).toFixed(1) + 'K';
    if (a >= 1000) return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
  }
  function price(v) {
    v = num(v);
    if (v === null || !isFinite(v) || v === 0) return '—';
    if (v >= 1000) return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (v >= 1) return '$' + v.toFixed(v >= 100 ? 2 : 3);
    if (v >= 0.01) return '$' + v.toFixed(4);
    // 0.0000123 -> $0.0₄123 (subscript zero count, like DEX screeners)
    const s = v.toFixed(20).split('.')[1];
    const zeros = s.match(/^0*/)[0].length;
    const sub = String(zeros).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
    return '$0.0' + sub + s.slice(zeros, zeros + 4).replace(/0+$/, '');
  }
  function pct(v, digits = 2) {
    v = num(v);
    if (v === null || !isFinite(v)) return '<span class="muted">—</span>';
    const cls = v > 0 ? 'up' : v < 0 ? 'down' : 'muted';
    return `<span class="${cls}">${v > 0 ? '+' : ''}${v.toFixed(digits)}%</span>`;
  }
  const shortAddr = (a) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');
  const intFmt = (v) => (num(v) === null ? '—' : Number(v).toLocaleString('en-US'));

  function logo(src, label) {
    const ph = `<span class="logo ph">${esc(String(label || '?').replace(/^w/, '').slice(0, 2).toUpperCase())}</span>`;
    if (!src) return ph;
    return `<img class="logo" src="${esc(src)}" alt="" loading="lazy" onerror="this.outerHTML='${ph.replace(/'/g, "\\'").replace(/"/g, '&quot;')}'">`;
  }
  const caChip = (addr) => (addr ? `<button class="ca" data-copy="${esc(addr)}" title="Copy contract address">${shortAddr(addr)} ⧉</button>` : '<span class="muted">—</span>');
  const loading = (rows = 5) => '<div class="loading">' + '<div class="skeleton"></div>'.repeat(rows) + '</div>';
  const errorBox = (msg) => `<div class="error">Couldn't load this right now (${esc(msg)}). It retries when you come back to the tab.</div>`;

  let toastTimer;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  // Generic sortable table. columns: {label, cell(row), sort?(row), cls?, left?}
  function table(el, columns, rows, { sortIndex = null, asc = false, onRow = null, empty = 'Nothing here yet.' } = {}) {
    let si = sortIndex;
    let dirAsc = asc;
    function draw() {
      const data = [...rows];
      if (si !== null && columns[si].sort) {
        const f = columns[si].sort;
        data.sort((a, b) => {
          const x = f(a), y = f(b);
          if (x === y) return 0;
          if (x === null || x === undefined || Number.isNaN(x)) return 1;
          if (y === null || y === undefined || Number.isNaN(y)) return -1;
          return (x > y ? 1 : -1) * (dirAsc ? 1 : -1);
        });
      }
      const head = columns
        .map((c, i) => {
          const cls = [c.cls || '', c.left ? 'l' : '', c.sort ? '' : 'nosort', i === si ? 'sorted' : '', i === si && dirAsc ? 'asc' : '']
            .filter(Boolean).join(' ');
          return `<th class="${cls}" data-i="${i}">${c.label}</th>`;
        })
        .join('');
      const body = data.length
        ? data.map((r, ri) => `<tr class="${onRow ? 'click' : ''}" data-r="${rows.indexOf(r)}">${columns
            .map((c) => `<td class="${[c.cls || '', c.left ? 'l' : ''].join(' ')}">${c.cell(r, ri)}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${columns.length}" class="muted">${empty}</td></tr>`;
      el.innerHTML = `<div class="tbl-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
      $$('th', el).forEach((th) =>
        th.addEventListener('click', () => {
          const i = Number(th.dataset.i);
          if (!columns[i].sort) return;
          if (si === i) dirAsc = !dirAsc;
          else { si = i; dirAsc = false; }
          draw();
        }));
      if (onRow) {
        $$('tbody tr.click', el).forEach((tr) =>
          tr.addEventListener('click', (e) => {
            if (e.target.closest('a,button')) return;
            onRow(rows[Number(tr.dataset.r)]);
          }));
      }
    }
    draw();
    return { redraw: (newRows) => { rows = newRows; draw(); } };
  }

  // ---------- modal ----------
  function openChart({ title, pair, links = [] }) {
    const m = $('#chartModal');
    $('#modalTitle').innerHTML = title;
    $('#modalFrame').src = LINKS.dsEmbed(pair);
    $('#modalLinks').innerHTML = links
      .map((l) => (l.buy
        ? buyBtn(l.buy, l.label)
        : `<a class="btn ${l.ghost ? 'ghost' : ''}" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`))
      .join('');
    m.showModal();
  }
  $('#modalClose').addEventListener('click', () => $('#chartModal').close());
  $('#chartModal').addEventListener('click', (e) => { if (e.target.id === 'chartModal') e.target.close(); });
  $('#chartModal').addEventListener('close', () => { $('#modalFrame').src = 'about:blank'; });

  // "Buy" never leaves the site: it hands the token to the LI.FI widget on the Swap & Bridge tab (src/web3).
  const buyBtn = (addr, label = 'Buy', cls = '') =>
    `<button class="btn ${cls}" data-buy="${esc(addr)}" title="Swap into this token on INK CART">${esc(label)}</button>`;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-buy]');
    if (!b) return;
    e.stopPropagation();
    if ($('#chartModal').open) $('#chartModal').close();
    window.__iucPending = { token: b.dataset.buy, side: 'buy' };
    window.dispatchEvent(new CustomEvent('iuc:buy', { detail: window.__iucPending }));
    location.hash = '#swap';
  });

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      toast('Contract address copied');
    } catch {
      toast(b.dataset.copy);
    }
  });

  // ---------- DexScreener token aggregation ----------
  async function dsTokenStats(addresses) {
    const out = new Map();
    for (let i = 0; i < addresses.length; i += 30) {
      const chunk = addresses.slice(i, i + 30);
      const pairs = await getJSON(API.dsTokens(chunk));
      for (const p of pairs || []) {
        const key = p.baseToken.address.toLowerCase();
        if (!chunk.some((a) => a.toLowerCase() === key)) continue;
        const liq = p.liquidity?.usd || 0;
        const cur = out.get(key);
        if (!cur) {
          out.set(key, { main: p, liq, vol: p.volume?.h24 || 0, pairs: 1 });
        } else {
          cur.liq += liq;
          cur.vol += p.volume?.h24 || 0;
          cur.pairs += 1;
          if (liq > (cur.main.liquidity?.usd || 0)) cur.main = p;
        }
      }
    }
    return out;
  }

  // ---------- OVERVIEW ----------
  function kpiTile(label, value, sub = '') {
    return `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`;
  }

  function rankList(el, items, { value, sub = null, max = 8 }) {
    const top = items.slice(0, max);
    const peak = Math.max(...top.map(value), 1);
    el.innerHTML = top
      .map((it, i) => `<div class="rank-row"><span class="n">${i + 1}</span>${logo(it.logo, it.name)}<div><div class="name">${esc(it.name)}${sub ? `<small>${sub(it)}</small>` : ''}</div><div class="bar"><i style="width:${Math.max(2, (value(it) / peak) * 100)}%"></i></div></div><span class="v">${usd(value(it))}</span></div>`)
      .join('') || '<div class="muted">No data.</div>';
  }

  function drawTvlChart(el, points) {
    const W = 600, H = 220, padT = 56, padB = 18;
    const vals = points.map((p) => p.tvl);
    const min = Math.min(...vals) * 0.96, max = Math.max(...vals) * 1.02;
    const x = (i) => (i / (points.length - 1)) * W;
    const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.tvl).toFixed(1)}`).join('');
    const area = `${line}L${W},${H}L0,${H}Z`;
    const last = points[points.length - 1];
    const first = points[0];
    const change = ((last.tvl - first.tvl) / first.tvl) * 100;
    const dateFmt = (t) => new Date(t * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    el.innerHTML = `
      <div class="tip"><b id="tvlVal">${usd(last.tvl)}</b><span id="tvlDate">today · ${pct(change, 1)} in 180d</span></div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Ink TVL over the last 180 days">
        <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7132f5" stop-opacity=".45"/><stop offset="1" stop-color="#7132f5" stop-opacity="0"/></linearGradient></defs>
        <path d="${area}" fill="url(#g)"/>
        <path d="${line}" fill="none" stroke="#a98bff" stroke-width="2" vector-effect="non-scaling-stroke"/>
        <line id="tvlCursor" x1="0" x2="0" y1="${padT - 6}" y2="${H}" stroke="#6b6588" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" visibility="hidden"/>
      </svg>`;
    const svg = $('svg', el);
    const cursor = $('#tvlCursor', el);
    const show = (clientX) => {
      const r = svg.getBoundingClientRect();
      const i = Math.round(((clientX - r.left) / r.width) * (points.length - 1));
      const p = points[Math.max(0, Math.min(points.length - 1, i))];
      const cx = x(points.indexOf(p));
      cursor.setAttribute('x1', cx); cursor.setAttribute('x2', cx); cursor.setAttribute('visibility', 'visible');
      $('#tvlVal', el).textContent = usd(p.tvl);
      $('#tvlDate', el).textContent = dateFmt(p.date);
    };
    svg.addEventListener('mousemove', (e) => show(e.clientX));
    svg.addEventListener('touchmove', (e) => show(e.touches[0].clientX), { passive: true });
    svg.addEventListener('mouseleave', () => {
      cursor.setAttribute('visibility', 'hidden');
      $('#tvlVal', el).textContent = usd(last.tvl);
      $('#tvlDate', el).innerHTML = `today · ${pct(change, 1)} in 180d`;
    });
  }

  async function loadOverview() {
    const k = $('#kpis');
    const tiles = {
      tvl: ['Chain TVL', '…'], stables: ['Stablecoins', '…'], dex: ['DEX volume 24h', '…'],
      fees: ['Fees 24h', '…'], oi: ['Nado open interest', '…'], perp: ['Nado perps volume 24h', '…'],
    };
    const paint = () => { k.innerHTML = Object.values(tiles).map(([l, v, s]) => kpiTile(l, v, s)).join(''); };
    paint();
    ['#tvlChart', '#dexList', '#protocolList', '#feeList'].forEach((s) => ($(s).innerHTML = loading(6)));

    const tasks = [
      Promise.all([getJSON(API.chains), getJSON(API.tvlHistory)]).then(([chains, hist]) => {
        const ink = chains.find((c) => c.name === 'Ink');
        const pts = hist.slice(-180);
        const d7 = hist[hist.length - 8]?.tvl;
        tiles.tvl = ['Chain TVL', usd(ink?.tvl), d7 ? `${pct(((ink.tvl - d7) / d7) * 100, 1)} 7d` : ''];
        drawTvlChart($('#tvlChart'), pts);
      }).catch((e) => { tiles.tvl[1] = '—'; $('#tvlChart').innerHTML = errorBox(e.message); }),

      getJSON(API.stables).then((all) => {
        const ink = all.find((c) => c.name === 'Ink');
        tiles.stables = ['Stablecoins', usd(ink?.totalCirculatingUSD?.peggedUSD), 'on Ink'];
      }).catch(() => { tiles.stables[1] = '—'; }),

      getJSON(API.dexs).then((d) => {
        tiles.dex = ['DEX volume 24h', usd(d.total24h), `${usd(d.total7d)} 7d`];
        const list = (d.protocols || []).filter((p) => p.total24h > 0).sort((a, b) => b.total24h - a.total24h);
        rankList($('#dexList'), list.map((p) => ({ ...p, name: p.displayName || p.name })), { value: (p) => p.total24h });
      }).catch((e) => { tiles.dex[1] = '—'; $('#dexList').innerHTML = errorBox(e.message); }),

      getJSON(API.fees).then((d) => {
        tiles.fees = ['Fees 24h', usd(d.total24h), `${usd(d.total30d)} 30d`];
        const list = (d.protocols || []).filter((p) => p.total24h > 0).sort((a, b) => b.total24h - a.total24h);
        rankList($('#feeList'), list.map((p) => ({ ...p, name: p.displayName || p.name })), { value: (p) => p.total24h, sub: (p) => esc(p.category || '') });
      }).catch((e) => { tiles.fees[1] = '—'; $('#feeList').innerHTML = errorBox(e.message); }),

      getJSON(API.nadoContracts).then((c) => {
        const perps = Object.values(c);
        const oi = perps.reduce((s, p) => s + (p.open_interest_usd || 0), 0);
        const vol = perps.reduce((s, p) => s + (p.quote_volume || 0), 0);
        tiles.oi = ['Nado open interest', usd(oi), `${perps.length} perp markets`];
        tiles.perp = ['Nado perps volume 24h', usd(vol), 'Nado API'];
      }).catch(() => { tiles.oi[1] = '—'; tiles.perp[1] = '—'; }),

      loadProtocols().then((list) => {
        rankList($('#protocolList'), list, {
          value: (p) => p.tvl,
          sub: (p) => esc(p.category) + (p.allocator ? ' · also counted in others' : ''),
          max: 10,
        });
      }).catch((e) => { $('#protocolList').innerHTML = errorBox(e.message); }),
    ];
    tasks.forEach((t) => t.finally(paint));
    await Promise.allSettled(tasks);
  }

  // The full protocol list is ~1.4 MB, so only the Ink slice is kept, for 30 minutes.
  async function loadProtocols() {
    const cached = cacheGet('protocols', 30 * 60 * 1000);
    if (cached) return cached;
    const d = await getJSON(API.protocols, { timeout: 25000 });
    const allocators = new Set(['Onchain Capital Allocator', 'Risk Curators']);
    const list = d.protocols
      .filter((p) => (p.chains || []).includes('Ink') && p.chainTvls?.Ink?.tvl > 1000)
      .map((p) => ({ name: p.name, logo: p.logo, category: p.category, url: p.url, tvl: p.chainTvls.Ink.tvl, allocator: allocators.has(p.category) }))
      .sort((a, b) => b.tvl - a.tvl);
    cacheSet('protocols', list);
    return list;
  }

  // ---------- TOKENS ----------
  let tokenRows = [];
  let tokenTable = null;

  function tokenRow(stats, meta) {
    const p = stats.main;
    return {
      symbol: p.baseToken.symbol,
      name: p.baseToken.name,
      address: p.baseToken.address,
      image: p.info?.imageUrl || null,
      price: num(p.priceUsd),
      change: p.priceChange?.h24 ?? null,
      mcap: p.marketCap ?? null,
      fdv: p.fdv ?? null,
      liq: stats.liq,
      vol: stats.vol,
      pair: p.pairAddress,
      dex: p.dexId,
      tag: meta.tag,
      trending: meta.trending || false,
      x: meta.x || null,
    };
  }

  function tokenCell(r) {
    const tag = r.trending ? '<span class="tag hot">Trending</span>' : r.tag ? `<span class="tag">${esc(r.tag)}</span>` : '';
    return `<div class="tok">${logo(r.image, r.symbol)}<div><div><span class="sym">${esc(r.symbol)}</span> ${tag}</div><div class="nm">${esc(r.name)}</div></div></div>`;
  }

  function openToken(r) {
    openChart({
      title: `<div class="tok">${logo(r.image, r.symbol)}<div><span class="sym">${esc(r.symbol)}</span> <span class="muted">${price(r.price)}</span><div class="nm mono">${esc(r.address)}</div></div></div>`,
      pair: r.pair,
      links: [
        { label: `Buy ${r.symbol}`, buy: r.address },
        { label: 'DexScreener', href: LINKS.dsPair(r.pair), ghost: true },
        { label: 'GeckoTerminal', href: LINKS.gtPool(r.pair), ghost: true },
        { label: 'Explorer', href: LINKS.explorerToken(r.address), ghost: true },
        ...(r.x ? [{ label: '@' + r.x, href: 'https://x.com/' + r.x, ghost: true }] : []),
      ],
    });
  }

  async function loadTokens() {
    const el = $('#tokenTable');
    el.innerHTML = loading(10);
    try {
      const curatedAddrs = D.tokens.map((t) => t.address);
      const gtFeeds = [API.gtTrending, API.gtPools(1), API.gtPools(2)].map((u) => getJSON(u).catch(() => null));
      const [curated, ...gt] = await Promise.all([dsTokenStats(curatedAddrs), ...gtFeeds]);

      // Trending = base tokens of GeckoTerminal's trending and top-volume Ink pools, minus stables, majors,
      // xStocks (they have their own tab) and anything already curated.
      const skip = new Set(D.notTrending.map((s) => s.toUpperCase()));
      const known = new Set([...curatedAddrs, ...D.xstocks.map((x) => x.address).filter(Boolean)].map((a) => a.toLowerCase()));
      const trendAddrs = [];
      for (const inc of gt.flatMap((g) => g?.included || [])) {
        const a = inc.attributes?.address;
        const sym = inc.attributes?.symbol || '';
        if (!a || skip.has(sym.toUpperCase()) || /^w[A-Z]+x$/.test(sym) || known.has(a.toLowerCase())) continue;
        known.add(a.toLowerCase());
        trendAddrs.push(a);
        if (trendAddrs.length >= 20) break;
      }
      const trending = trendAddrs.length ? await dsTokenStats(trendAddrs).catch(() => new Map()) : new Map();

      tokenRows = [
        ...D.tokens.map((t) => curated.get(t.address.toLowerCase()) && tokenRow(curated.get(t.address.toLowerCase()), t)).filter(Boolean),
        ...trendAddrs.map((a) => trending.get(a.toLowerCase()) && tokenRow(trending.get(a.toLowerCase()), { trending: true })).filter(Boolean),
      ].filter((r) => r.liq >= 5000); // thin pools are almost always fakes or dust

      const cols = [
        { label: 'Token', left: true, cell: tokenCell, sort: (r) => r.symbol.toLowerCase() },
        { label: 'Price', cell: (r) => price(r.price), sort: (r) => r.price },
        { label: '24h', cell: (r) => pct(r.change), sort: (r) => r.change },
        { label: 'Market cap', cell: (r) => usd(r.mcap), sort: (r) => r.mcap, cls: 'hide-sm' },
        { label: 'FDV', cell: (r) => usd(r.fdv), sort: (r) => r.fdv },
        { label: 'Liquidity', cell: (r) => usd(r.liq), sort: (r) => r.liq, cls: 'hide-sm' },
        { label: 'Volume 24h', cell: (r) => usd(r.vol), sort: (r) => r.vol, cls: 'hide-sm' },
        { label: 'Contract', cell: (r) => caChip(r.address), cls: 'hide-sm' },
        { label: '', cell: (r) => buyBtn(r.address) },
      ];
      tokenTable = table(el, cols, tokenRows, { sortIndex: 5, onRow: openToken });
      applyTokenSearch();
    } catch (e) {
      el.innerHTML = errorBox(e.message);
      throw e;
    }
  }

  function applyTokenSearch() {
    if (!tokenTable) return;
    const q = $('#tokenSearch').value.trim().toLowerCase();
    tokenTable.redraw(q ? tokenRows.filter((r) => [r.symbol, r.name, r.address].some((s) => s.toLowerCase().includes(q))) : tokenRows);
  }
  $('#tokenSearch').addEventListener('input', applyTokenSearch);

  // ---------- XSTOCKS ----------
  async function loadXstocks() {
    const el = $('#xstockTable');
    el.innerHTML = loading(10);
    try {
      const addrs = D.xstocks.filter((x) => x.address).map((x) => x.address);
      const [ds, spot, apr] = await Promise.all([
        dsTokenStats(addrs),
        getJSON(API.nadoSpot).catch(() => ({})),
        getJSON(API.nadoApr).catch(() => []),
      ]);
      const nadoTvl = new Map(apr.map((a) => [a.symbol, a.tvl]));
      const rows = D.xstocks.map((x) => {
        const s = x.address ? ds.get(x.address.toLowerCase()) : null;
        const t = spot[`${x.symbol}_USDT0`];
        return {
          ...x,
          image: s?.main.info?.imageUrl || null,
          price: s ? num(s.main.priceUsd) : null,
          change: s?.main.priceChange?.h24 ?? null,
          liq: s?.liq ?? null,
          vol: s?.vol ?? null,
          pair: s?.main.pairAddress || null,
          nadoPrice: t && t.last_price ? t.last_price : null,
          nadoVol: t ? t.quote_volume : null,
          nadoTvl: nadoTvl.get(x.symbol) ?? null,
        };
      }).map((r) => ({ ...r, spread: r.price && r.nadoPrice ? ((r.nadoPrice - r.price) / r.price) * 100 : null }));
      const cols = [
        { label: 'Stock', left: true, sort: (r) => r.symbol, cell: (r) => `<div class="tok">${logo(r.image, r.symbol.replace(/^w|x$/g, ''))}<div><span class="sym">${esc(r.symbol)}</span><div class="nm">${esc(r.name)}</div></div></div>` },
        { label: 'DEX price', cell: (r) => price(r.price), sort: (r) => r.price },
        { label: '24h', cell: (r) => pct(r.change), sort: (r) => r.change },
        { label: 'DEX liquidity', cell: (r) => usd(r.liq), sort: (r) => r.liq, cls: 'hide-sm' },
        { label: 'Nado price', cell: (r) => price(r.nadoPrice), sort: (r) => r.nadoPrice, cls: 'hide-sm' },
        { label: 'Nado vs DEX', cell: (r) => pct(r.spread), sort: (r) => (r.spread === null ? null : Math.abs(r.spread)), cls: 'hide-sm' },
        { label: 'Nado vol 24h', cell: (r) => usd(r.nadoVol), sort: (r) => r.nadoVol, cls: 'hide-sm' },
        { label: 'On Nado', cell: (r) => usd(r.nadoTvl), sort: (r) => r.nadoTvl, cls: 'hide-sm' },
        { label: 'Contract', cell: (r) => caChip(r.address), cls: 'hide-sm' },
        { label: '', cell: (r) => `<span class="actions">${r.address ? buyBtn(r.address) : ''}<a class="btn ghost" href="${LINKS.nado}" target="_blank" rel="noopener">Nado</a></span>` },
      ];
      table(el, cols, rows, {
        sortIndex: 3,
        onRow: (r) => r.pair && openChart({
          title: `<div class="tok">${logo(r.image, r.symbol)}<div><span class="sym">${esc(r.symbol)}</span> <span class="muted">${esc(r.name)}</span><div class="nm mono">${esc(r.address)}</div></div></div>`,
          pair: r.pair,
          links: [
            { label: `Buy ${r.symbol}`, buy: r.address },
            { label: 'Trade on Nado', href: LINKS.nado, ghost: true },
            { label: 'Quotrons pools', href: LINKS.quotrons, ghost: true },
            { label: 'DexScreener', href: LINKS.dsPair(r.pair), ghost: true },
            { label: 'Explorer', href: LINKS.explorerToken(r.address), ghost: true },
          ],
        }),
      });
    } catch (e) {
      el.innerHTML = errorBox(e.message);
      throw e;
    }
  }

  // ---------- NFTS ----------
  function renderNfts(sortKey) {
    const list = [...D.nfts];
    if (sortKey === 'featured') list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.vol1d - a.vol1d);
    else list.sort((a, b) => b[sortKey] - a[sortKey]);
    $('#nftGrid').innerHTML = list
      .map((n) => `
        <article class="nft">
          <a class="art" href="${LINKS.opensea(n.slug)}" target="_blank" rel="noopener" aria-label="${esc(n.name)} on OpenSea">
            <span>${esc(n.name.slice(0, 2).toUpperCase())}</span>${n.img ? `<img src="${esc(LINKS.seadn(n.img))}" alt="" loading="lazy" onerror="this.remove()">` : ''}
          </a>
          <div class="meta">
            <div class="title"><span>${esc(n.name)}</span>${n.featured ? '<span class="tag">Pick</span>' : ''}</div>
            <div class="note">${esc(n.note || '')}</div>
            <div class="stats">
              <div>Floor<b>${usd(n.floor)}</b></div>
              <div>24h vol<b>${usd(n.vol1d)}</b></div>
              <div>Holders<b>${intFmt(n.owners)}</b></div>
            </div>
            <a class="btn" href="${LINKS.opensea(n.slug)}" target="_blank" rel="noopener">Buy on OpenSea</a>
          </div>
        </article>`)
      .join('');
  }
  $('#nftSort').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('#nftSort button').forEach((x) => x.classList.toggle('on', x === b));
    renderNfts(b.dataset.sort);
  });
  function loadNfts() {
    $('#nftNote').textContent = `${D.nfts.length} Ink collections. Floors and volume from OpenSea, snapshot ${D.nftSnapshotDate}. Buying happens on OpenSea.`;
    renderNfts('featured');
    return Promise.resolve();
  }

  // ---------- PERPS ----------
  let perpRows = [];
  let perpTable = null;
  function perpGroup(base) {
    for (const [g, list] of Object.entries(D.perpGroups)) if (list.includes(base)) return g;
    return 'crypto';
  }
  async function loadPerps() {
    const el = $('#perpTable');
    el.innerHTML = loading(12);
    try {
      const c = await getJSON(API.nadoContracts);
      perpRows = Object.values(c).map((p) => {
        const base = p.base_currency.replace(/-PERP$/, '');
        return {
          base, group: perpGroup(base), price: p.last_price || p.mark_price, change: p.price_change_percent_24h,
          vol: p.quote_volume, oi: p.open_interest_usd, funding: p.funding_rate != null ? p.funding_rate * 100 : null,
        };
      });
      const oi = perpRows.reduce((s, r) => s + (r.oi || 0), 0);
      const vol = perpRows.reduce((s, r) => s + (r.vol || 0), 0);
      const top = [...perpRows].sort((a, b) => b.oi - a.oi)[0];
      const stockOi = perpRows.filter((r) => r.group === 'stocks').reduce((s, r) => s + (r.oi || 0), 0);
      $('#perpKpis').innerHTML = [
        kpiTile('Open interest', usd(oi), `${perpRows.length} markets`),
        kpiTile('Volume 24h', usd(vol), 'all perps'),
        kpiTile('Biggest market', esc(top.base), `${usd(top.oi)} OI`),
        kpiTile('Stock perps OI', usd(stockOi), `${perpRows.filter((r) => r.group === 'stocks').length} stock markets`),
      ].join('');
      const cols = [
        { label: 'Market', left: true, sort: (r) => r.base, cell: (r) => `<div class="tok"><span class="sym">${esc(r.base)}</span><span class="tag gray">${r.group}</span></div>` },
        { label: 'Price', cell: (r) => price(r.price), sort: (r) => r.price },
        { label: '24h', cell: (r) => pct(r.change), sort: (r) => r.change },
        { label: 'Volume 24h', cell: (r) => usd(r.vol), sort: (r) => r.vol },
        { label: 'Open interest', cell: (r) => usd(r.oi), sort: (r) => r.oi },
        { label: 'Funding 24h', cell: (r) => pct(r.funding, 3), sort: (r) => r.funding, cls: 'hide-sm' },
        { label: '', cell: () => `<a class="btn" href="${LINKS.nado}" target="_blank" rel="noopener">Trade</a>`, cls: 'hide-sm' },
      ];
      perpTable = table(el, cols, perpRows, { sortIndex: 4 });
      applyPerpFilter();
    } catch (e) {
      el.innerHTML = errorBox(e.message);
      throw e;
    }
  }
  function applyPerpFilter() {
    if (!perpTable) return;
    const g = $('#perpFilter button.on').dataset.group;
    perpTable.redraw(g === 'all' ? perpRows : perpRows.filter((r) => r.group === g));
  }
  $('#perpFilter').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('#perpFilter button').forEach((x) => x.classList.toggle('on', x === b));
    applyPerpFilter();
  });

  // ---------- LENDING ----------
  async function loadLend() {
    const el = $('#lendTable');
    el.innerHTML = loading(10);
    try {
      const tydroEntries = await Promise.all(
        Object.entries(D.tydroPools).map(([sym, id]) =>
          getJSON(API.yieldPool(id)).then((r) => [sym, r.data?.[0]]).catch(() => [sym, null])));
      const nado = await getJSON(API.nadoApr).catch(() => []);
      const norm = (s) => s.toUpperCase().replace('₮', 'T');
      const rows = new Map();
      for (const [sym, p] of tydroEntries) {
        if (!p) continue;
        rows.set(norm(sym), { asset: sym, tApy: p.apy, t30: p.apyMean30d, tTvl: p.tvlUsd, tUrl: p.url });
      }
      for (const a of nado) {
        if (!a.tvl) continue;
        const key = norm(a.symbol);
        const r = rows.get(key) || { asset: a.symbol };
        Object.assign(r, { nDep: a.deposit_apr * 100, nBor: a.borrow_apr * 100, nTvl: a.tvl });
        rows.set(key, r);
      }
      const list = [...rows.values()].map((r) => {
        const best = Math.max(r.tApy ?? -1, r.nDep ?? -1);
        return { ...r, best: best >= 0.005 ? best : null, bestAt: (r.tApy ?? -1) >= (r.nDep ?? -1) ? 'Tydro' : 'Nado' };
      }).sort((a, b) => (b.tTvl || 0) + (b.nTvl || 0) - (a.tTvl || 0) - (a.nTvl || 0));
      const rate = (v) => (v === null || v === undefined ? '<span class="muted">—</span>' : `${v.toFixed(2)}%`);
      const cols = [
        { label: 'Asset', left: true, sort: (r) => r.asset, cell: (r) => `<div class="tok">${logo(null, r.asset)}<span class="sym">${esc(r.asset)}</span></div>` },
        { label: 'Best supply', sort: (r) => r.best, cell: (r) => (r.best === null ? '<span class="muted">—</span>' : `<b class="up">${r.best.toFixed(2)}%</b> <span class="tag gray">${r.bestAt}</span>`) },
        { label: 'Tydro supply', sort: (r) => r.tApy, cell: (r) => rate(r.tApy) },
        { label: 'Tydro 30d avg', sort: (r) => r.t30, cell: (r) => rate(r.t30), cls: 'hide-sm' },
        { label: 'Tydro TVL', sort: (r) => r.tTvl, cell: (r) => usd(r.tTvl), cls: 'hide-sm' },
        { label: 'Nado deposit', sort: (r) => r.nDep, cell: (r) => rate(r.nDep) },
        { label: 'Nado borrow', sort: (r) => r.nBor, cell: (r) => rate(r.nBor), cls: 'hide-sm' },
        { label: 'Nado TVL', sort: (r) => r.nTvl, cell: (r) => usd(r.nTvl), cls: 'hide-sm' },
        { label: '', cell: (r) => `<span class="actions">${r.tUrl ? `<a class="btn" href="${esc(r.tUrl)}" target="_blank" rel="noopener">Tydro</a>` : ''}${r.nTvl ? `<a class="btn ghost" href="${LINKS.nado}" target="_blank" rel="noopener">Nado</a>` : ''}</span>` },
      ];
      table(el, cols, list);
    } catch (e) {
      el.innerHTML = errorBox(e.message);
      throw e;
    }
  }

  // ---------- chain pill ----------
  async function pollChain() {
    try {
      const res = await postJSON(API.rpc, [
        { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
        { jsonrpc: '2.0', id: 2, method: 'eth_gasPrice', params: [] },
      ]);
      const byId = Object.fromEntries(res.map((r) => [r.id, r.result]));
      const block = parseInt(byId[1], 16);
      const gwei = parseInt(byId[2], 16) / 1e9;
      $('#chainPillText').innerHTML = `Ink · #${block.toLocaleString('en-US')}<span class="hide-sm"> · ${gwei < 0.01 ? gwei.toFixed(4) : gwei.toFixed(3)} gwei</span>`;
      $('#chainPill').classList.add('live');
    } catch {
      $('#chainPill').classList.remove('live');
      $('#chainPillText').textContent = 'Ink · RPC unreachable';
    }
  }

  // ---------- router ----------
  const noop = () => Promise.resolve(); // swap + wallet are rendered by the React island in src/web3
  const loaders = { overview: loadOverview, tokens: loadTokens, xstocks: loadXstocks, nfts: loadNfts, perps: loadPerps, lend: loadLend, swap: noop, wallet: noop };
  const loadedAt = {};
  const REFRESH_MS = 60 * 1000;

  function route() {
    const tab = (location.hash || '#overview').slice(1);
    const name = loaders[tab] ? tab : 'overview';
    $$('.view').forEach((v) => (v.hidden = v.id !== name));
    $$('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === name));
    // Reload when data is stale or the last load failed.
    if (!loadedAt[name] || Date.now() - loadedAt[name] > REFRESH_MS) {
      loadedAt[name] = Date.now();
      loaders[name]().catch(() => { loadedAt[name] = 0; });
    }
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo({ top: 0 }); });
  route();
  pollChain();
  setInterval(pollChain, 12000);
})();
