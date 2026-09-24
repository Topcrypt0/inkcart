import { useEffect, useRef, useState } from 'react';
import { useBalance, useConnection, useDisconnect } from 'wagmi';
import { INK_ID } from './config.js';
import { useConnectModal } from './ConnectModal.jsx';
import { shortAddr } from './format.js';

export function WalletButton() {
  const { address, isConnected, isConnecting, isReconnecting, connector } = useConnection();
  const { open } = useConnectModal();
  const { mutate: disconnect } = useDisconnect();
  const { data: bal } = useBalance({ address, chainId: INK_ID, query: { enabled: !!address } });
  const [menu, setMenu] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => { if (!box.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menu]);

  if (!isConnected) {
    return (
      <button className="btn" onClick={open} disabled={isReconnecting}>
        {isConnecting || isReconnecting ? 'Connecting…' : 'Connect wallet'}
      </button>
    );
  }

  const eth = bal ? Number(bal.value) / 1e18 : null;
  return (
    <div className="wallet-btn" ref={box}>
      <button className="btn ghost" onClick={() => setMenu((m) => !m)}>
        {connector?.icon && <img src={connector.icon} alt="" className="wicon" />}
        <span className="mono">{shortAddr(address)}</span>
        {eth !== null && <span className="muted hide-sm">{eth < 0.0001 ? '0' : eth.toFixed(4)} ETH</span>}
      </button>
      {menu && (
        <div className="wallet-menu">
          <a href="#wallet" onClick={() => setMenu(false)}>My wallet</a>
          <a href="#swap" onClick={() => setMenu(false)}>Swap &amp; Bridge</a>
          <button onClick={() => { navigator.clipboard?.writeText(address); setMenu(false); }}>Copy address</button>
          <a href={`https://explorer.inkonchain.com/address/${address}`} target="_blank" rel="noopener">Explorer ↗</a>
          <button onClick={() => { disconnect(); setMenu(false); }}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
