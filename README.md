# INK CART (working name)

Everything on Ink in one place: tokens, xStocks, NFTs, Nado perps, lending rates, points.
A static site with no build step and no backend. Every number except the NFT floors loads live in the browser.

## Run locally

```bash
python3 -m http.server 8765 --directory ~/INK/inkcart
```

Then open http://localhost:8765.

## Files

- `index.html`: the layout and the 7 tabs
- `styles.css`: the dark theme, Ink purple `#7132F5`
- `app.js`: fetching, tables, the chart modal and hash routing (`#tokens`, `#perps`, …)
- `data.js`: the curated lists (tokens, xStocks, NFT snapshot, Tydro pool ids, points programs)

## Data sources (all free, CORS-enabled, no API key)

| Tab | Source |
|---|---|
| Overview | DefiLlama: chain TVL, TVL history, DEX volume, fees, stablecoins, protocols. Nado: OI and volume. Ink RPC: live block number |
| Tokens | DexScreener `tokens/v1/ink` for price, FDV, market cap, liquidity and volume. GeckoTerminal trending and top pools for auto-discovered tokens |
| xStocks | DexScreener (Ink DEX pools), Nado spot tickers and deposits |
| NFTs | OpenSea Ink rankings, **snapshot from 24 Sep 2026** |
| Perps | Nado `archive/v2/contracts` |
| Lending | DefiLlama Yields (Tydro pools), Nado `gateway/v2/apr` |
| Points | Curated cards, plus the leaderboard from the Nado rewards API (`leaderboard_contests`, `leaderboard`) |

## Known gaps / next steps

1. **Live NFT floors.** The OpenSea API needs a key (free, request it in the OpenSea developer docs). Add a small serverless proxy (`/api/nfts`) so the key stays off the client.
2. **$INK** isn't trading yet. Add it to `data.js → tokens` on TGE day.
3. **Buy buttons** open DexScreener. A native swap (for example the Velodrome/Uniswap router, or an aggregator widget) would make the "cart" real and could carry an integrator fee.
4. **Wallet view.** Connect a wallet to show its tokens, NFTs, Nado positions and Tydro deposits. This is the best next feature for the grant (see below).
5. Add a domain and analytics (Vercel Analytics or Plausible) so traction can be proven.

## Grants

- **Ink Spark** (500–20,000 USDC, rolling): https://docs.inkonchain.com/ink-builder-program/spark-program
  Requires a *live product* plus verifiable traction. Priorities are Tydro and Nado integrations, RWA and AI agents. The Lending tab (Tydro vs Nado) and the Perps tab already hit two of them.
  Apply here: https://forms.inkonchain.com/spark-builder-program
- **Ink Forge** (up to 200k USDC, milestone-based): for teams with real traction.
- **Quotrons Builders** is *not a grant*. It is a registry: a project that donates WETH (Terminal Pot / Growth Sink / $INK buybacks) or routes fees through Quotrons pools gets non-transferable builder points (20M pool). This only makes sense once the site earns fees.
