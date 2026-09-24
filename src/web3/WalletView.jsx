import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAddress } from 'viem';
import { useBalance, useConnection } from 'wagmi';
import { INK_ID } from './config.js';
import { useConnectModal } from './ConnectModal.jsx';
import { amount, fromUnits, shortAddr, usd, x18 } from './format.js';

const BLOCKSCOUT = 'https://explorer.inkonchain.com/api/v2';
const NADO = 'https://api.prod.nado.xyz';
const NADO_REF = 'https://app.nado.xyz?join=kripto1';
const DEFAULT_SUBACCOUNT = '64656661756c740000000000'; // "default" as bytes12

async function getJSON(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${new URL(url).host}`);
  return res.json();
}

// Blockscout knows balances; DexScreener fills in prices Blockscout doesn't have (most Ink memecoins).
async function fetchTokens(address) {
  const { items = [] } = await getJSON(`${BLOCKSCOUT}/addresses/${address}/tokens?type=ERC-20`);
  const rows = items.map((i) => {
    const t = i.token;
    return {
      address: t.address_hash || t.address,
      symbol: t.symbol || '?',
      name: t.name || '',
      icon: t.icon_url,
      balance: fromUnits(i.value, t.decimals),
      price: t.exchange_rate ? Number(t.exchange_rate) : null,
    };
  }).filter((r) => r.balance > 0);

  const missing = rows.filter((r) => r.price === null).map((r) => r.address);
  for (let i = 0; i < missing.length && i < 90; i += 30) {
    const pairs = await getJSON(`https://api.dexscreener.com/tokens/v1/ink/${missing.slice(i, i + 30).join(',')}`).catch(() => []);
    const best = new Map();
    for (const p of pairs) {
      const k = p.baseToken.address.toLowerCase();
      if ((p.liquidity?.usd || 0) < 5000) continue; // thin pools give fantasy prices
      if (!best.has(k) || p.liquidity.usd > best.get(k).liquidity.usd) best.set(k, p);
    }
    for (const r of rows) {
      const p = best.get(r.address.toLowerCase());
      if (p && r.price === null) { r.price = Number(p.priceUsd); r.icon = r.icon || p.info?.imageUrl; }
    }
  }
  return rows.map((r) => ({ ...r, value: r.price !== null ? r.balance * r.price : null })).sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
}

async function fetchNfts(address) {
  const { items = [] } = await getJSON(`${BLOCKSCOUT}/addresses/${address}/nft?type=ERC-721,ERC-1155`);
  return items.map((i) => ({
    contract: i.token.address_hash || i.token.address,
    collection: i.token.name || 'Unknown',
    id: i.id,
    name: i.metadata?.name || `#${i.id}`,
    image: i.image_url || null,
  }));
}

async function fetchNado(address) {
  const [info, assets] = await Promise.all([
    getJSON(`${NADO}/gateway/v1/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'subaccount_info', subaccount: address.toLowerCase() + DEFAULT_SUBACCOUNT }),
    }),
    getJSON(`${NADO}/gateway/v2/assets`),
  ]);
  const d = info.data;
  if (!d?.exists) return { exists: false };
  const sym = new Map(assets.map((a) => [a.product_id, a.symbol]));
  const oracle = new Map([...d.perp_products, ...d.spot_products].map((p) => [p.product_id, x18(p.oracle_price_x18)]));
  const perps = d.perp_balances
    .filter((p) => p.balance.amount !== '0')
    .map((p) => {
      const size = x18(p.balance.amount);
      const px = oracle.get(p.product_id) || 0;
      return {
        market: (sym.get(p.product_id) || `#${p.product_id}`).replace(/-PERP$/, ''),
        side: size > 0 ? 'Long' : 'Short', size: Math.abs(size), notional: Math.abs(size) * px,
        pnl: size * px + x18(p.balance.v_quote_balance),
      };
    })
    .sort((a, b) => b.notional - a.notional);
  const spot = d.spot_balances
    .filter((p) => p.balance.amount !== '0')
    .map((p) => {
      const amt = x18(p.balance.amount);
      return { asset: sym.get(p.product_id) || `#${p.product_id}`, amount: amt, value: amt * (oracle.get(p.product_id) ?? 1) };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  // healths[2] is the unweighted health: assets minus liabilities, i.e. account equity.
  return { exists: true, equity: x18(d.healths[2].health), perps, spot };
}

const buy = (token, side = 'buy') => {
  window.__iucPending = { token, side };
  window.dispatchEvent(new CustomEvent('iuc:buy', { detail: { token, side } }));
  location.hash = '#swap';
};

function Tile({ label, value, sub }) {
  return <div className="kpi"><div className="label">{label}</div><div className="value">{value}</div><div className="sub">{sub}</div></div>;
}

export function WalletView({ active }) {
  const { address: connected, isConnected } = useConnection();
  const { open } = useConnectModal();
  const [lookup, setLookup] = useState('');
  const [watched, setWatched] = useState(null);
  const address = watched || connected;
  const canTrade = isConnected && !watched; // read-only lookups get no Swap buttons
  const enabled = active && !!address;

  const eth = useBalance({ address, chainId: INK_ID, query: { enabled } });
  const ethPrice = useQuery({ queryKey: ['ethPrice'], enabled, queryFn: () => getJSON(`${BLOCKSCOUT}/stats`).then((s) => Number(s.coin_price)) });
  const tokens = useQuery({ queryKey: ['tokens', address], enabled, queryFn: () => fetchTokens(address) });
  const nfts = useQuery({ queryKey: ['nfts', address], enabled, queryFn: () => fetchNfts(address) });
  const nado = useQuery({ queryKey: ['nado', address], enabled, queryFn: () => fetchNado(address) });

  const lookupForm = (
    <form className="lookup" onSubmit={(e) => { e.preventDefault(); if (isAddress(lookup.trim())) setWatched(lookup.trim()); }}>
      <input className="search" placeholder="Look up any Ink address 0x…" value={lookup} onChange={(e) => setLookup(e.target.value)} aria-label="Address to look up" />
      <button className="btn ghost" type="submit" disabled={!isAddress(lookup.trim())}>View</button>
      {watched && <button className="btn ghost" type="button" onClick={() => { setWatched(null); setLookup(''); }}>{isConnected ? 'Back to my wallet' : 'Clear'}</button>}
    </form>
  );

  if (!address) {
    return (
      <div className="view-inner">
        <div className="view-head"><div><h1>My wallet</h1><p className="muted">Your Ink tokens, NFTs and Nado positions in one view.</p></div>{lookupForm}</div>
        <div className="card empty-state">
          <p>Connect a wallet to see everything you hold on Ink, then swap or bridge without leaving the page.</p>
          <button className="btn" onClick={open}>Connect wallet</button>
        </div>
      </div>
    );
  }

  const ethBal = eth.data ? Number(eth.data.value) / 1e18 : 0;
  const ethValue = ethPrice.data ? ethBal * ethPrice.data : null;
  const priced = (tokens.data || []).filter((t) => t.value !== null && t.value >= 0.01);
  const unpriced = (tokens.data || []).filter((t) => t.value === null || t.value < 0.01);
  const walletValue = (ethValue || 0) + priced.reduce((s, t) => s + t.value, 0);

  return (
    <div className="view-inner">
      <div className="view-head">
        <div>
          <h1>{watched ? 'Wallet' : 'My wallet'}</h1>
          <p className="muted mono">
            <a href={`https://explorer.inkonchain.com/address/${address}`} target="_blank" rel="noopener">{shortAddr(address)} ↗</a>
            {watched && <span className="tag gray" style={{ marginLeft: 8 }}>read-only</span>}
          </p>
        </div>
        {lookupForm}
      </div>

      <div className="kpis small">
        <Tile label="Wallet value on Ink" value={tokens.isLoading ? '…' : usd(walletValue)} sub={`${ethBal.toFixed(4)} ETH + ${priced.length} tokens`} />
        <Tile label="Nado equity" value={nado.isLoading ? '…' : nado.data?.exists ? usd(nado.data.equity) : '—'} sub={nado.data?.exists ? `${nado.data.perps.length} open perps` : 'no Nado account'} />
        <Tile label="NFTs" value={nfts.isLoading ? '…' : (nfts.data?.length ?? '—')} sub="on Ink" />
        <Tile label="Tokens" value={tokens.isLoading ? '…' : (tokens.data?.length ?? '—')} sub={`${unpriced.length} without a price`} />
      </div>

      <div className="card flush">
        <div className="card-head pad"><h2>Tokens</h2><a className="muted" href="#swap">Swap &amp; Bridge →</a></div>
        {tokens.isLoading ? <div className="loading"><div className="skeleton" /><div className="skeleton" /></div>
          : tokens.error ? <div className="error">Couldn't load tokens ({tokens.error.message}).</div>
          : (
            <div className="tbl-scroll"><table>
              <thead><tr><th className="nosort">Token</th><th className="nosort">Balance</th><th className="nosort">Price</th><th className="nosort">Value</th><th className="nosort" /></tr></thead>
              <tbody>
                <tr>
                  <td><div className="tok"><span className="logo ph">Ξ</span><div><span className="sym">ETH</span><div className="nm">Ether on Ink</div></div></div></td>
                  <td>{amount(ethBal)}</td><td>{ethPrice.data ? usd(ethPrice.data) : '—'}</td><td>{usd(ethValue)}</td>
                  <td>{canTrade && <button className="btn ghost" onClick={() => buy('0x0000000000000000000000000000000000000000', 'sell')}>Swap</button>}</td>
                </tr>
                {priced.map((t) => (
                  <tr key={t.address}>
                    <td><div className="tok">{t.icon ? <img className="logo" src={t.icon} alt="" /> : <span className="logo ph">{t.symbol.slice(0, 2)}</span>}<div><span className="sym">{t.symbol}</span><div className="nm">{t.name}</div></div></div></td>
                    <td>{amount(t.balance)}</td><td>{t.price < 0.01 ? t.price.toPrecision(3) : usd(t.price)}</td><td>{usd(t.value)}</td>
                    <td>{canTrade && <button className="btn ghost" onClick={() => buy(t.address, 'sell')}>Swap</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        {unpriced.length > 0 && (
          <details className="unpriced">
            <summary>{unpriced.length} tokens without a market price (often airdropped spam, don't interact with unknown contracts)</summary>
            <ul>{unpriced.map((t) => <li key={t.address}><span className="sym">{t.symbol}</span> <span className="muted">{amount(t.balance)}</span> <span className="mono muted">{shortAddr(t.address)}</span></li>)}</ul>
          </details>
        )}
      </div>

      <div className="card flush">
        <div className="card-head pad"><h2>Nado</h2><a className="muted" href={NADO_REF} target="_blank" rel="noopener">Open Nado ↗</a></div>
        {nado.isLoading ? <div className="loading"><div className="skeleton" /></div>
          : nado.error ? <div className="error">Couldn't load Nado ({nado.error.message}).</div>
          : !nado.data?.exists ? (
            <div className="empty-state inline"><p className="muted">No Nado account for this address yet. Nado is the perps + spot orderbook DEX on Ink.</p><a className="btn" href={NADO_REF} target="_blank" rel="noopener">Start trading on Nado</a></div>
          ) : (
            <div className="tbl-scroll"><table>
              <thead><tr><th className="nosort">Position</th><th className="nosort">Side</th><th className="nosort">Size</th><th className="nosort">Notional</th><th className="nosort">Unrealized PnL</th></tr></thead>
              <tbody>
                {nado.data.perps.map((p) => (
                  <tr key={p.market}><td><span className="sym">{p.market}</span> <span className="tag gray">perp</span></td><td className={p.side === 'Long' ? 'up' : 'down'}>{p.side}</td><td>{amount(p.size)}</td><td>{usd(p.notional)}</td><td className={p.pnl >= 0 ? 'up' : 'down'}>{usd(p.pnl)}</td></tr>
                ))}
                {nado.data.spot.map((s) => (
                  <tr key={s.asset}><td><span className="sym">{s.asset}</span> <span className="tag gray">{s.amount < 0 ? 'borrowed' : 'deposit'}</span></td><td /><td>{amount(s.amount)}</td><td>{usd(s.value)}</td><td /></tr>
                ))}
                {!nado.data.perps.length && !nado.data.spot.length && <tr><td colSpan={5} className="muted">Account exists, no open positions.</td></tr>}
              </tbody>
            </table></div>
          )}
      </div>

      <div className="card">
        <div className="card-head"><h2>NFTs</h2><span className="muted">{nfts.data?.length === 50 ? 'first 50' : ''}</span></div>
        {nfts.isLoading ? <div className="loading"><div className="skeleton" /></div>
          : nfts.error ? <div className="error">Couldn't load NFTs ({nfts.error.message}).</div>
          : !nfts.data?.length ? <p className="muted">No NFTs on Ink. <a href="#nfts">Browse collections →</a></p>
          : (
            <>
              <div className="nft-grid small">
                {nfts.data.map((n) => (
                  <a key={n.contract + n.id} className="nft" href={`https://opensea.io/item/ink/${n.contract}/${n.id}`} target="_blank" rel="noopener">
                    <div className="art"><span>{n.collection.slice(0, 2).toUpperCase()}</span>{n.image && <img src={n.image} alt="" loading="lazy" onError={(e) => e.currentTarget.remove()} />}</div>
                    <div className="meta"><div className="title"><span>{n.name}</span></div><div className="note">{n.collection}</div></div>
                  </a>
                ))}
              </div>
              <p className="fine" style={{ marginTop: 12 }}>Anyone can airdrop an NFT with a copycat name. Check the collection on OpenSea before you trust it.</p>
            </>
          )}
      </div>
    </div>
  );
}
