import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConnect, useConnection, useConnectors } from 'wagmi';

const Ctx = createContext({ open: () => {} });
export const useConnectModal = () => useContext(Ctx);

export function ConnectModalProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && createPortal(<ConnectModal onClose={() => setOpen(false)} />, document.body)}
    </Ctx.Provider>
  );
}

function ConnectModal({ onClose }) {
  const ref = useRef(null);
  const connectors = useConnectors();
  const { mutate: connect, isPending, variables, error } = useConnect();
  const { isConnected } = useConnection();

  useEffect(() => { ref.current?.showModal(); }, []);
  useEffect(() => { if (isConnected) onClose(); }, [isConnected, onClose]);

  // EIP-6963 wallets have their own names and icons; the generic "Injected" entry only matters when none announced.
  const named = connectors.filter((c) => c.id !== 'injected');
  const list = named.length ? named : connectors.filter((c) => typeof window !== 'undefined' && window.ethereum);

  return (
    <dialog ref={ref} className="modal connect" onClose={onClose} onClick={(e) => e.target === ref.current && ref.current.close()}>
      <div className="modal-head">
        <b>Connect a wallet</b>
        <button className="icon-btn" onClick={() => ref.current.close()} aria-label="Close">✕</button>
      </div>
      <div className="connect-list">
        {list.map((c) => (
          <button key={c.uid} className="connect-item" disabled={isPending} onClick={() => connect({ connector: c })}>
            {c.icon ? <img src={c.icon} alt="" /> : <span className="logo ph">{c.name.slice(0, 2)}</span>}
            <span>{c.id === 'injected' ? 'Browser wallet' : c.name}</span>
            {isPending && variables?.connector?.uid === c.uid && <span className="muted">Confirm in wallet…</span>}
          </button>
        ))}
        {!list.length && (
          <div className="connect-empty">
            <p>No browser wallet found.</p>
            <p className="muted">Install MetaMask, Rabby or Kraken Wallet, or open this page inside your wallet app's browser.</p>
          </div>
        )}
        {error && <p className="error small">{error.shortMessage || error.message}</p>}
      </div>
      <p className="fine pad">Connecting only shares your address. Every transaction still needs your signature.</p>
    </dialog>
  );
}
