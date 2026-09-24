import { useEffect, useMemo, useRef } from 'react';
import { LiFiWidget } from '@lifi/widget';
import { EthereumProvider } from '@lifi/widget-provider-ethereum';
import { SolanaProvider } from '@lifi/widget-provider-solana';
import { BitcoinProvider } from '@lifi/widget-provider-bitcoin';
import { BITCOIN_ID, chains, INK_ID, INK_RPC, SOLANA_ID } from './config.js';
import { useConnectModal } from './ConnectModal.jsx';

const NATIVE = '0x0000000000000000000000000000000000000000';
// Must match the integrator name in the LI.FI partner portal for fees and volume stats to be attributed.
export const INTEGRATOR = 'inkcart';

export default function Widget() {
  const formRef = useRef(null);
  const { open } = useConnectModal();

  const config = useMemo(() => ({
    integrator: INTEGRATOR,
    variant: 'wide',
    appearance: 'dark',
    // Default route: anything → ETH on Ink. "Buy" buttons override the destination through formRef.
    toChain: INK_ID,
    toToken: NATIVE,
    chains: { allow: [...chains.map((c) => c.id), SOLANA_ID, BITCOIN_ID] },
    providers: [EthereumProvider(), SolanaProvider(), BitcoinProvider()],
    // EVM wallets come from the site's wagmi connection (header button); Solana and Bitcoin wallets
    // are handled by the widget itself.
    walletConfig: { usePartialWalletManagement: true, onConnect: () => open() },
    // All LI.FI calls go through our serverless proxy, which adds the API key server-side (api/lifi.js).
    sdkConfig: {
      apiUrl: `${window.location.origin}/api/lifi/v1`,
      rpcUrls: { [INK_ID]: [INK_RPC] },
    },
    hiddenUI: { appearance: true },
    theme: {
      colorSchemes: {
        dark: {
          palette: {
            primary: { main: '#7132f5' },
            secondary: { main: '#a98bff' },
            background: { default: '#14121f', paper: '#1b1829' },
            text: { primary: '#eeebf8', secondary: '#9993b5' },
          },
        },
      },
      shape: { borderRadius: 14, borderRadiusSecondary: 10 },
      typography: { fontFamily: 'Inter, system-ui, sans-serif' },
      container: { border: '1px solid #272338', borderRadius: '16px', boxShadow: 'none' },
    },
  }), [open]);

  // Buy (from the token tables) or Swap (from the wallet view) clicked elsewhere on the page.
  // Buy: pay with ETH on Ink, receive the token. Sell: pay with the token, receive ETH on Ink.
  useEffect(() => {
    const apply = (req) => {
      const f = formRef.current;
      if (!f || !req?.token) return false;
      const set = (k, v) => f.setFieldValue(k, v);
      if (req.side === 'sell') {
        set('fromChain', INK_ID);
        set('fromToken', req.token);
        if (req.token !== NATIVE) { set('toChain', INK_ID); set('toToken', NATIVE); }
      } else {
        set('fromChain', INK_ID);
        set('fromToken', NATIVE);
        set('toChain', INK_ID);
        set('toToken', req.token);
      }
      window.__iucPending = null;
      return true;
    };
    // The click may have happened before this chunk finished loading.
    let tries = 0;
    const timer = setInterval(() => {
      if (!window.__iucPending || apply(window.__iucPending) || ++tries > 40) clearInterval(timer);
    }, 150);
    const onBuy = (e) => apply(e.detail);
    window.addEventListener('iuc:buy', onBuy);
    return () => { clearInterval(timer); window.removeEventListener('iuc:buy', onBuy); };
  }, []);

  return <LiFiWidget integrator={INTEGRATOR} config={config} formRef={formRef} />;
}
