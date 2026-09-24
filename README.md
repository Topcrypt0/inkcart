# INK ULTRA CART

Everything on Ink in one place: tokens, xStocks, NFTs, Nado perps and lending rates, plus a wallet view and swap & bridge on the page itself.

**Live:** https://inkultracart.vercel.app. Every push to `main` deploys automatically (Vercel project `inkcart`, team `topcrypt0s-projects`).

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:8765. For LI.FI calls to use the API key locally, put `LIFI_API_KEY=…` in `.env.local` (git-ignored).

## Layout

- `index.html`: the page shell and tabs
- `src/app.js`, `src/data.js`, `src/styles.css`: the data tabs (vanilla JS, hash routing)
- `src/web3/`: the React island
  - `config.js`: wagmi config (Ink plus every EVM chain LI.FI routes through)
  - `ConnectModal.jsx`, `WalletButton.jsx`: wallet connection (EIP-6963 browser wallets)
  - `Widget.jsx`: the LI.FI widget (Swap & Bridge)
  - `WalletView.jsx`: portfolio (Blockscout balances, DexScreener prices, Nado positions, NFTs)
- `api/lifi.js`: an edge function that proxies `li.quest` and adds `LIFI_API_KEY` server-side. The key never ships to the browser.

## Trading

- **Tokens and xStocks:** "Buy" opens Swap & Bridge with ETH on Ink → the token. Routing is by LI.FI (DEX aggregators on Ink, bridges from 60+ chains, Solana and Bitcoin).
- **Perps:** these link out to Nado with the referral `https://app.nado.xyz?join=kripto1`.
- **NFTs:** these link out to OpenSea.

## Data sources

DefiLlama (TVL, DEX volume, fees, stablecoins, protocols, Tydro yields), DexScreener and GeckoTerminal (tokens), the Nado API (perps, spot, APR, account info), Blockscout at explorer.inkonchain.com (wallet balances and NFTs), the Ink RPC, and OpenSea (NFT floor snapshot).

## To do

1. **LI.FI integrator fee.** Create the integrator `inkultracart` with a fee wallet in the LI.FI partner portal, then add `feeConfig` in `src/web3/Widget.jsx`.
2. **WalletConnect.** A free Reown project ID adds mobile wallets via QR (Kraken Wallet, Rainbow, …).
3. **Live NFT floors** through an OpenSea API key (serverless proxy, like `api/lifi.js`).
4. **Nado trading on-site** via the Nado TypeScript SDK. This is an Ink Spark grant priority.

## Grants

- **Ink Spark** (500–20,000 USDC, rolling). Apply at https://forms.inkonchain.com/spark-builder-program. Nado and Tydro integrations are priorities.
- **Ink Forge** (up to 200k USDC, milestone-based).
- **Quotrons Builders** is not a grant. It is a donation registry: WETH to the Terminal Pot / Growth Sink / $INK buybacks earns builder points. It makes sense once the swap fee earns revenue.
