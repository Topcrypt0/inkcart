export const shortAddr = (a) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');

export function usd(v) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  if (v < 0) return '-' + usd(-v);
  const a = Math.abs(v);
  if (a >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
  if (a >= 1e4) return '$' + (v / 1e3).toFixed(1) + 'K';
  if (a >= 1) return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (a === 0) return '$0';
  return a < 0.01 ? '<$0.01' : '$' + v.toFixed(2);
}

export function amount(v) {
  if (!isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (a >= 1) return v.toLocaleString('en-US', { maximumFractionDigits: 3 });
  return v.toPrecision(3);
}

// Token balances arrive as integer strings; keep precision for big supplies by splitting before converting.
export function fromUnits(value, decimals) {
  const d = Number(decimals || 0);
  const s = String(value || '0').padStart(d + 1, '0');
  return Number(s.slice(0, s.length - d) + '.' + s.slice(s.length - d, s.length - d + 8));
}

export const x18 = (v) => fromUnits(String(v).replace('-', ''), 18) * (String(v).startsWith('-') ? -1 : 1);
