import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './config.js';
import { ConnectModalProvider } from './ConnectModal.jsx';
import { WalletButton } from './WalletButton.jsx';
import { SwapView } from './SwapView.jsx';
import { WalletView } from './WalletView.jsx';
import { GmView } from './GmView.jsx';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

// The vanilla app owns routing (location.hash); the island just follows it so heavy parts mount only when opened.
function useHashTab() {
  const read = () => (location.hash || '#overview').slice(1);
  const [tab, setTab] = useState(read);
  useEffect(() => {
    const on = () => setTab(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return tab;
}

function Island() {
  const tab = useHashTab();
  // Mount the widget on first visit and keep it mounted, so an in-flight swap survives tab switches.
  const [swapMounted, setSwapMounted] = useState(tab === 'swap');
  useEffect(() => { if (tab === 'swap') setSwapMounted(true); }, [tab]);

  return (
    <>
      {createPortal(<WalletButton />, document.getElementById('walletSlot'))}
      {swapMounted && createPortal(<SwapView />, document.getElementById('swapRoot'))}
      {createPortal(<WalletView active={tab === 'wallet'} />, document.getElementById('walletRoot'))}
      {tab === 'gm' && createPortal(<GmView active />, document.getElementById('gmRoot'))}
    </>
  );
}

const host = document.createElement('div');
host.id = 'web3-island';
document.body.appendChild(host);
// Portals render into these; clear the static placeholders first.
['walletSlot', 'walletRoot', 'swapRoot', 'gmRoot'].forEach((id) => { document.getElementById(id).innerHTML = ''; });

createRoot(host).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        <ConnectModalProvider>
          <Island />
        </ConnectModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
