import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAddress } from 'viem';
import {
  useBalance, useConnection, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract,
} from 'wagmi';
import { INK_ID } from './config.js';
import { useConnectModal } from './ConnectModal.jsx';
import { fetchProfileGms, fetchRecentGms, friendlyGmError, GM_ADDRESS, GM_COOLDOWN, gmAbi, hasProfile } from './gm.js';
import { shortAddr } from './format.js';

const EXPLORER = 'https://explorer.inkonchain.com';

function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(t); }, []);
  return now;
}

const hms = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, '0')).join(':');
const ago = (s) => (s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`);

// Days in a row: consecutive GMs less than 48 h apart, still alive if the last one is under 48 h old.
function streakOf(gms, now) {
  if (!gms.length || now - gms[gms.length - 1].time > 2 * GM_COOLDOWN) return 0;
  let n = 1;
  for (let i = gms.length - 1; i > 0 && gms[i].time - gms[i - 1].time < 2 * GM_COOLDOWN; i--) n++;
  return n;
}

function RecentFeed({ me }) {
  const now = useNow();
  const recent = useQuery({ queryKey: ['recentGms'], queryFn: () => fetchRecentGms(600), refetchInterval: 20_000, placeholderData: (p) => p });
  const list = recent.data || [];
  return (
    <div className="card">
      <div className="card-head"><h2>Live on Ink</h2><span className="muted">{recent.isLoading ? '…' : recent.isError && !list.length ? 'feed unavailable' : `${list.length} GMs in the last 10 min`}</span></div>
      <div className="gm-feed">
        {list.slice(0, 12).map((g) => (
          <a key={g.tx} className={`gm-row ${me && g.actor.toLowerCase() === me.toLowerCase() ? 'me' : ''}`} href={`${EXPLORER}/tx/${g.tx}`} target="_blank" rel="noopener">
            <span className="sun">☀️</span>
            <span className="mono">{shortAddr(g.actor)}</span>
            <span className="muted">{g.recipient ? <>gm'd <span className="mono">{shortAddr(g.recipient)}</span></> : 'said gm'}</span>
            <span className="muted t">{ago(Math.max(0, now - g.time))}</span>
          </a>
        ))}
        {!recent.isLoading && !recent.isError && !list.length && <p className="muted">Quiet right now. Be the first.</p>}
      </div>
    </div>
  );
}

export function GmView({ active }) {
  const { address, isConnected, chainId } = useConnection();
  const { open } = useConnectModal();
  const { mutate: switchChain, isPending: switching } = useSwitchChain();
  const now = useNow();
  const [fren, setFren] = useState('');
  const [mode, setMode] = useState('gm'); // 'gm' | 'fren'

  const enabled = active && !!address;
  const profile = useReadContract({ address: GM_ADDRESS, abi: gmAbi, functionName: 'profileOf', args: [address], chainId: INK_ID, query: { enabled } });
  const profileId = profile.data;
  const registered = hasProfile(profileId);
  const actorActive = useReadContract({ address: GM_ADDRESS, abi: gmAbi, functionName: 'isActorActive', args: [address], chainId: INK_ID, query: { enabled: enabled && registered } });
  const last = useReadContract({ address: GM_ADDRESS, abi: gmAbi, functionName: 'lastGM', args: [profileId], chainId: INK_ID, query: { enabled: enabled && registered } });
  const history = useQuery({ queryKey: ['gmHistory', profileId], enabled: enabled && registered, queryFn: () => fetchProfileGms(profileId) });
  const eth = useBalance({ address, chainId: INK_ID, query: { enabled } });

  const { mutate: write, data: hash, isPending: signing, error: writeError, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: INK_ID, query: { enabled: !!hash } });
  const done = receipt.isSuccess;

  useEffect(() => {
    if (!done) return;
    profile.refetch(); actorActive.refetch(); last.refetch();
    setTimeout(() => history.refetch(), 4000); // Blockscout indexes a few seconds behind the chain
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const lastTs = last.data ? Number(last.data) : 0;
  const nextAt = lastTs ? lastTs + GM_COOLDOWN : 0;
  const wait = Math.max(0, nextAt - now);
  const gms = history.data || [];
  const streak = streakOf(gms, now);
  const noGas = eth.data && eth.data.value === 0n;
  const wrongChain = isConnected && chainId !== INK_ID;
  const busy = signing || (!!hash && receipt.isLoading);
  const frenOk = isAddress(fren.trim()) && fren.trim().toLowerCase() !== address?.toLowerCase();

  const send = (functionName, args) => { reset(); write({ address: GM_ADDRESS, abi: gmAbi, functionName, args, chainId: INK_ID }); };

  let action;
  if (!isConnected) action = <button className="btn gm-btn" onClick={open}>Connect wallet to GM</button>;
  else if (wrongChain) action = <button className="btn gm-btn" disabled={switching} onClick={() => switchChain({ chainId: INK_ID })}>{switching ? 'Switching…' : 'Switch to Ink'}</button>;
  else if (profile.isLoading) action = <button className="btn gm-btn" disabled>Checking…</button>;
  else if (!registered) action = (
    <>
      <button className="btn gm-btn" disabled={busy} onClick={() => send('registerProfile')}>{busy ? 'Creating profile…' : 'Create gm.ink profile'}</button>
      <p className="fine">One-time transaction, gas only. It links this wallet to gm.ink so your daily GMs, streak and leaderboard rank are tracked.</p>
    </>
  );
  else if (actorActive.data === false) action = <p className="error small">This wallet was removed from its gm.ink profile. Manage it on <a href="https://gm.ink" target="_blank" rel="noopener">gm.ink</a>.</p>;
  else if (wait > 0 && !busy) action = (
    <>
      <button className="btn gm-btn done" disabled>GM sent ✓</button>
      <p className="gm-next">Next GM in <b className="mono">{hms(wait)}</b></p>
    </>
  );
  else action = (
    <>
      <div className="gm-mode chips">
        <button className={mode === 'gm' ? 'on' : ''} onClick={() => setMode('gm')}>GM Ink</button>
        <button className={mode === 'fren' ? 'on' : ''} onClick={() => setMode('fren')}>GM a fren</button>
      </div>
      {mode === 'fren' && <input className="search gm-fren" placeholder="Fren's wallet 0x…" value={fren} onChange={(e) => setFren(e.target.value)} aria-label="Fren wallet address" />}
      <button className="btn gm-btn" disabled={busy || (mode === 'fren' && !frenOk)}
        onClick={() => (mode === 'fren' ? send('gmTo', [fren.trim()]) : send('gm'))}>
        {signing ? 'Confirm in wallet…' : busy ? 'Sending GM…' : mode === 'fren' ? 'Send GM ☀️' : 'GM ☀️'}
      </button>
      <p className="fine">Free, you only pay gas (under a cent on Ink). One ranked GM per 24 hours.</p>
    </>
  );

  return (
    <div className="view-inner">
      <div className="view-head">
        <div>
          <h1>Daily GM</h1>
          <p className="muted">Say GM on Ink once a day. It goes onchain through gm.ink, so it counts for your gm.ink streak and leaderboard rank.</p>
        </div>
        <a className="btn ghost" href="https://gm.ink/leaderboard" target="_blank" rel="noopener">gm.ink leaderboard ↗</a>
      </div>

      <div className="gm-grid">
        <div className="card gm-card">
          <div className={`gm-sun ${done ? 'pop' : ''}`} aria-hidden="true">☀️</div>
          {done ? <h2 className="gm-title">GM sent. See you tomorrow.</h2> : <h2 className="gm-title">{wait > 0 && registered && isConnected ? 'You already said GM today' : 'GM, Ink.'}</h2>}
          {action}
          {noGas && !wrongChain && <p className="error small">You need a little ETH on Ink for gas. <a href="#swap">Bridge some →</a></p>}
          {writeError && <p className="error small">{friendlyGmError(writeError)}</p>}
          {hash && <p className="fine"><a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener">View transaction ↗</a></p>}
        </div>

        <div className="gm-side">
          <div className="kpis small gm-kpis">
            <div className="kpi"><div className="label">Your GMs</div><div className="value">{registered ? (history.isLoading ? '…' : history.isError ? '—' : gms.length) : '—'}</div><div className="sub">on gm.ink v2</div></div>
            <div className="kpi"><div className="label">Streak</div><div className="value">{registered && !history.isError ? (history.isLoading ? '…' : `${streak} ${streak === 1 ? 'day' : 'days'}`) : '—'}</div><div className="sub">GMs under 48 h apart</div></div>
            <div className="kpi"><div className="label">Last GM</div><div className="value">{lastTs ? ago(Math.max(0, now - lastTs)) : '—'}</div><div className="sub">{lastTs ? new Date(lastTs * 1000).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'never'}</div></div>
            <div className="kpi"><div className="label">Next GM</div><div className="value mono">{!registered ? '—' : wait > 0 ? hms(wait) : 'now'}</div><div className="sub">24 h cooldown</div></div>
          </div>
          <RecentFeed me={address} />
        </div>
      </div>
    </div>
  );
}
