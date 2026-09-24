import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  ink, mainnet, arbitrum, base, optimism, polygon, bsc, avalanche, gnosis, linea, scroll, zkSync, blast, mode,
  unichain, sonic, berachain, hyperEvm, worldchain, soneium, celo, mantle, sei, abstract, lisk, fraxtal, kaia,
  plumeMainnet, katana, metis, fuse, immutableZkEvm, flare, vana, gravity, zeroGMainnet, injective, xLayer, ronin,
  opBNB, lens, cronos, morph, boba, rootstock, apeChain, telos, tempo, arbitrumNova, etherlink, hemi, megaeth,
  xdc, somnia, arc, bob, flowMainnet, viction, plasma, stable, monad, robinhood,
} from 'viem/chains';

export const INK_ID = ink.id; // 57073
export const INK_RPC = 'https://rpc-gel.inkonchain.com';

// Every EVM chain LI.FI routes through (24 Sep 2026) that viem knows. Wagmi needs each one listed,
// or the widget can't ask the wallet to switch to it.
export const chains = [
  ink, mainnet, base, arbitrum, optimism, polygon, bsc, avalanche, gnosis, linea, scroll, zkSync, blast, mode,
  unichain, sonic, berachain, hyperEvm, worldchain, soneium, celo, mantle, sei, abstract, lisk, fraxtal, kaia,
  plumeMainnet, katana, metis, fuse, immutableZkEvm, flare, vana, gravity, zeroGMainnet, injective, xLayer, ronin,
  opBNB, lens, cronos, morph, boba, rootstock, apeChain, telos, tempo, arbitrumNova, etherlink, hemi, megaeth,
  xdc, somnia, arc, bob, flowMainnet, viction, plasma, stable, monad, robinhood,
];

// LI.FI ids for the non-EVM chains the widget can bridge from.
export const SOLANA_ID = 1151111081099710;
export const BITCOIN_ID = 20000000000001;

export const wagmiConfig = createConfig({
  chains,
  // EIP-6963 discovery lists every installed browser wallet (MetaMask, Rabby, Kraken Wallet, Phantom, …) on its own.
  connectors: [injected()],
  transports: Object.fromEntries(chains.map((c) => [c.id, c.id === ink.id ? http(INK_RPC) : http()])),
});
