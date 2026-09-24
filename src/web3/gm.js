import { parseAbi } from 'viem';

// gm.ink GMV2 on Ink (proxy). Same contract gm.ink's own site uses, so GMs sent here count on its leaderboard.
// Docs: https://www.gm.ink/docs, function list: https://www.gm.ink/gm-v2-functions.md
export const GM_ADDRESS = '0x14Aec24CE62258FECDe22E928D8F37dD47165d4F';
export const GM_COOLDOWN = 86400; // seconds, rolling from the last GM (COOLDOWN())
export const GM_EXECUTED_TOPIC = '0x7e909f3772b7d831775b3c4cb5099a75b2c5a80ee6b1a2c37240e7eb0928ed02';

export const gmAbi = parseAbi([
  'function registerProfile() returns (bytes32)',
  'function gm()',
  'function gmTo(address recipient)',
  'function profileOf(address wallet) view returns (bytes32)',
  'function isActorActive(address actor) view returns (bool)',
  'function lastGM(bytes32 profileId) view returns (uint256)',
  'function paused() view returns (bool)',
  'error DailyLimitActive(uint256 availableAt)',
  'error InactiveActor(address actor)',
  'error WalletAlreadyBound(address wallet)',
  'error InvalidRecipient()',
  'error SelfRecipient()',
  'error SnapshotProofRequired(address wallet)',
  'error NotActivated()',
  'error EnforcedPause()',
]);

const ZERO32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const hasProfile = (id) => !!id && id !== ZERO32;

const BLOCKSCOUT = 'https://explorer.inkonchain.com/api/v2';
const RPC = 'https://rpc-gel.inkonchain.com';

// Every ranked GM of one profile. Blockscout v2 matches the profile id in any topic, so keep only GMExecuted.
// (The Etherscan-style /api logs endpoint has a tight per-IP limit; v2 allows far more.)
export async function fetchProfileGms(profileId) {
  const out = [];
  let params = '';
  for (let page = 0; page < 10; page++) {
    const res = await fetch(`${BLOCKSCOUT}/addresses/${GM_ADDRESS}/logs?topic=${profileId}${params}`);
    if (!res.ok) throw new Error(`${res.status} explorer`);
    const d = await res.json();
    for (const l of d.items || []) {
      if (l.topics?.[0] === GM_EXECUTED_TOPIC && l.topics?.[1] === profileId) {
        out.push({ time: Math.floor(Date.parse(l.block_timestamp) / 1000), tx: l.transaction_hash });
      }
    }
    if (!d.next_page_params) break;
    params = '&' + new URLSearchParams(d.next_page_params).toString();
  }
  return out.sort((a, b) => a.time - b.time);
}

async function rpc(method, params) {
  const r = await (await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })).json();
  if (r.error) throw new Error(r.error.message);
  return r.result;
}

// Ranked GMs across Ink over roughly the last `seconds` (one block per second), straight from the RPC.
export async function fetchRecentGms(seconds = 600) {
  const latest = parseInt(await rpc('eth_blockNumber', []), 16);
  const logs = await rpc('eth_getLogs', [{ address: GM_ADDRESS, topics: [GM_EXECUTED_TOPIC], fromBlock: '0x' + (latest - seconds).toString(16), toBlock: 'latest' }]);
  return logs
    .map((l) => ({
      actor: '0x' + l.topics[2].slice(26),
      recipient: /^0x0+$/.test(l.topics[3]) ? null : '0x' + l.topics[3].slice(26),
      time: parseInt(l.blockTimestamp, 16),
      tx: l.transactionHash,
    }))
    .reverse();
}

export function friendlyGmError(e) {
  const name = e?.cause?.data?.errorName || e?.data?.errorName || e?.cause?.cause?.data?.errorName;
  if (name === 'DailyLimitActive') return 'Already GM\'d in the last 24 hours. Come back when the timer hits zero.';
  if (name === 'InactiveActor') return 'This wallet has no active gm.ink profile yet. Create one first.';
  if (name === 'WalletAlreadyBound') return 'This wallet already belongs to a gm.ink profile.';
  if (name === 'SelfRecipient') return "You can't GM your own wallet or profile.";
  if (name === 'InvalidRecipient') return 'That recipient address is not valid.';
  if (name === 'EnforcedPause') return 'gm.ink is paused right now. Try again later.';
  if (/User rejected|denied/i.test(e?.message || '')) return 'Cancelled in the wallet.';
  return e?.shortMessage || e?.message || 'Something went wrong.';
}
