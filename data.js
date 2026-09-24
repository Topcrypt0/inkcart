// Curated lists. Everything else on the page is fetched live.
// Contract addresses were matched to the most liquid Ink pair on DexScreener (24 Sep 2026).
// Same-ticker copies with ~$1.4k liquidity exist for several of these — never swap in an address without checking liquidity.

window.INK_DATA = {
  // Ecosystem tokens shown first on the Tokens tab. Trending tokens are added automatically from GeckoTerminal.
  tokens: [
    { symbol: 'OTO', address: '0x0e04Ca25B5cd15047946d89E21cBcDBaE43A323B', tag: 'Launchpad', x: 'otomate_trade' },
    { symbol: 'QWIRE', address: '0xfDDb101D08998FEc888b69bd3B9DFE8DEc99a28A', tag: 'Quotrons', x: 'Quotrontitative' },
    { symbol: 'BEAST', address: '0xD95B9A5Fa7C2708fD4FE0E07E59bDE1Ef35b194a', tag: 'Meme' },
    { symbol: 'KRAKMASK', address: '0x32bCB803f696C99Eb263D60a05CAfD8689026575', tag: 'Meme', x: 'KrakMask' },
    { symbol: 'PURPLE', address: '0xD642B49d10cc6e1BC1c6945725667c35e0875f22', tag: 'Meme' },
    { symbol: 'CAT', address: '0x20C69C12abf2B6F8D8ca33604DD25C700c7e70A5', tag: 'AI agent' },
    { symbol: 'ANITA', address: '0x0606FC632ee812bA970af72F8489baAa443C4B98', tag: 'Meme' },
    { symbol: 'HKT', address: '0xcf010BA185Fd6ee6027b141e2C32614D673f8258', tag: 'Meme' },
    { symbol: 'OCTO', address: '0x3cb52DF6C7E75943F00f413f768C8A7c5875bF3F', tag: 'Quotrons' },
    { symbol: 'SHROOMY', address: '0x0c5E2D1C98cd265C751e02F8F3293bC5764F9111', tag: 'DeFi' },
    { symbol: 'kBTC', address: '0x73E0C0d45E048D25Fc26Fa3159b0aA04BfA4Db98', tag: 'Kraken' },
  ],

  // Base tokens that are never "trending" (stables, wrapped majors).
  notTrending: ['WETH', 'ETH', 'USDT0', 'USD₮0', 'USDC', 'USDC.E', 'USDG', 'GHO', 'OUSDT', 'KBTC', 'SOLVBTC', 'WEETH', 'SUSDE', 'USDE', 'SYRUPUSDT', 'KHYPE', 'WBTC', 'CBBTC'],

  // Wrapped xStocks on Ink. `address: null` = listed on Nado, but no DEX pool found yet.
  xstocks: [
    { symbol: 'wAAPLx', name: 'Apple', address: '0x943BF64D566c32A2Bcd41AC92FB63C111cC9De8f' },
    { symbol: 'wAMZNx', name: 'Amazon', address: '0x910cabdE3EBa7Fc1Ce64fD14bD680b9f60fA0F90' },
    { symbol: 'wGOOGLx', name: 'Alphabet', address: '0xf8c5308F80E459bb53d9EbE689854d9cBb2Caa6f' },
    { symbol: 'wMETAx', name: 'Meta', address: null },
    { symbol: 'wMSFTx', name: 'Microsoft', address: null },
    { symbol: 'wNVDAx', name: 'NVIDIA', address: '0xa8ddb5Cd96b5222AFe198316E9A57CAA642850D5' },
    { symbol: 'wQQQx', name: 'Nasdaq 100 (QQQ)', address: '0x4C1AE29c159838fC1b224636E28E086EB69101f7' },
    { symbol: 'wSPYx', name: 'S&P 500 (SPY)', address: '0xE7E553Cd128F0011777323A0b44a7b96EA1CB540' },
    { symbol: 'wTSLAx', name: 'Tesla', address: '0xc3FdBe3A68EE5dE461D30415a8165cf9Aefe1171' },
    { symbol: 'wMSTRx', name: 'Strategy (MSTR)', address: '0x30987adF0B11dc698438a99BA04ec3a1AB2c7EaB' },
    { symbol: 'wNFLXx', name: 'Netflix', address: '0x7d87fD6A379714194a797c0bBB8B40c30D250856' },
    { symbol: 'wPLTRx', name: 'Palantir', address: '0x4A2df09536F62341C9f946427D16414C04e21342' },
    { symbol: 'wSPCXx', name: 'SpaceX', address: '0x8e2eeD8b8B5E13Ea7BF38e50d7821d2C57309072' },
  ],

  // OpenSea snapshot, Ink chain page, 24 Sep 2026 (the OpenSea API needs a key, so floors are not live yet).
  nftSnapshotDate: '24 Sep 2026',
  nfts: [
    { slug: 'templars-of-the-storm', name: 'Templars of the Storm', floor: 1908.0, vol1d: 3294.15, owners: 821, supply: 1200, img: 'admin-uploads/f189f573f43d0fa8eab11049be7133/aaf189f573f43d0fa8eab11049be7133.png', note: 'Nado NFT: points multiplier + VIP fee tiers', featured: true },
    { slug: '404-machine', name: 'THE 404 MACHINE', floor: 104.54, vol1d: 4343.71, owners: 812, supply: 1519, img: 'collection/404-machine/image_type_logo/dd6a940d0c221ed8a77706ba830267/dadd6a940d0c221ed8a77706ba830267.png', note: 'Otomate: forged by burning $OTO, shares launchpad fees', featured: true },
    { slug: 'octocore-ink', name: 'Octocore', floor: 104.4, vol1d: 6223.52, owners: 126, supply: 3113, img: 'ink/3a3ceee77a9c36a48e7c6ce6182d2c97/c87320bca35ba29d05a2800c0224cc/8ec87320bca35ba29d05a2800c0224cc.png', note: 'Paired with $OCTO', featured: true },
    { slug: 'prtscn-ink', name: 'PRTSCN', floor: 91.89, vol1d: 2712.0, owners: 1838, supply: 4440, img: 'ink/0x3ea71c6abde8a1b3cf6e5683761a7378b4e9e448/9901a26d4e2ad976ac4274be141be8/de9901a26d4e2ad976ac4274be141be8.gif?frame-time=1', note: 'Quotrons ecosystem PFP set', featured: true },
    { slug: 'krak-heads-285086705', name: 'KRAK HEADS', floor: 74.08, vol1d: 116.5, owners: 231, supply: 888, img: 'collection/krak-heads-285086705/image_type_logo/b40a00b716a20e83cac99d91c06d47/a3b40a00b716a20e83cac99d91c06d47.png', note: 'From the $KRAKMASK team', featured: true },
    { slug: 'onchain-inkpunks', name: 'Onchain InkPunks', floor: 5.15, vol1d: 195.39, owners: 1700, supply: 10000, img: null, note: 'Fully onchain punks, Dec 2024', featured: true },
    { slug: 'boinknfts', name: 'Boink', floor: 43.8, vol1d: 845.89, owners: 306, supply: 777, img: 'collection/boink-339329205/image_type_logo/97b7cf0eda3cacae31f88fd9e5ef28/ed97b7cf0eda3cacae31f88fd9e5ef28.png' },
    { slug: 'anitaonink', name: 'ANITA', floor: 34.67, vol1d: 86.49, owners: 707, supply: 1294, img: 'collection/anitaonink/image_type_logo/c39e22d1a0a1913c3e95d6e4f5d75f/95c39e22d1a0a1913c3e95d6e4f5d75f.png' },
    { slug: 'inkysquad', name: 'InkySquad', floor: 32.25, vol1d: 80.57, owners: 590, supply: 1154, img: 'ink/00669611f27c420e953d9c888c057b7c/839c1f7f09e7a32b62dc3aace11a59/25839c1f7f09e7a32b62dc3aace11a59.jpeg' },
    { slug: 'squink-108031948', name: 'Squink', floor: 23.79, vol1d: 1958.29, owners: 377, supply: 3333, img: 'collection/squink-108031948/image_type_logo/c34c177257f137632a71da88bc1f4b/2dc34c177257f137632a71da88bc1f4b.png' },
    { slug: 'ladyboi', name: 'Lady Boi', floor: 14.78, vol1d: 75.09, owners: 263, supply: 4747, img: 'collection/ladyboi/image_type_logo/2659ec8e6f95a7d1faf5950e4b266d/012659ec8e6f95a7d1faf5950e4b266d.png' },
    { slug: 'inkbrokers-nft', name: 'Ink Brokers', floor: 14.24, vol1d: 1169.28, owners: 930, supply: 4444, img: 'collection/ink-brokers-94135623/image_type_logo/3b302842784f41c8de5048893c3a2e/423b302842784f41c8de5048893c3a2e.gif?frame-time=1' },
    { slug: 'boi-ink', name: 'Boi', floor: 12.08, vol1d: 76.65, owners: 763, supply: 4747, img: 'collection/boi-ink/image_type_logo/2e74f11f77344e866e45295b2a6f95/082e74f11f77344e866e45295b2a6f95.png' },
    { slug: 'inkbunnies', name: 'INK Bunnies', floor: 10.21, vol1d: 32.13, owners: 1207, supply: 2221, img: 'ink/b902a0fb55f64e16985156b711332c5a/d4c5a2cd90e5fde4bf6f74be86c4d8/e1d4c5a2cd90e5fde4bf6f74be86c4d8.jpeg' },
    { slug: 'ink-hornet', name: 'Ink Hornet', floor: 8.6, vol1d: 811.11, owners: 690, supply: 2222, img: 'collection/ink-hornet/image_type_logo/69f73add8f460b96184e91e6bec0b3/4169f73add8f460b96184e91e6bec0b3.png' },
    { slug: 'nobodiesnft', name: 'Nobodies Secret Society', floor: 8.33, vol1d: 64.45, owners: 1091, supply: 1818, img: 'collection/nobodies-secret-society/image_type_logo/ce6088c24dc6b5958171cde4074865/dece6088c24dc6b5958171cde4074865.png' },
    { slug: 'ink-ghost-866557730', name: 'INK Ghost', floor: 2.15, vol1d: 2056.46, owners: 498, supply: 2222, img: 'collection/ink-ghost-866557730/image_type_logo/633326623ac5b2eeb75108a399e3d0/21633326623ac5b2eeb75108a399e3d0.gif?frame-time=1' },
    { slug: 'smolboi-380681282', name: 'SmolBoi', floor: 1.32, vol1d: 138.07, owners: 195, supply: 4386, img: 'collection/smolboi-380681282/image_type_logo/a17d686015fa93190d3380005eed98/3da17d686015fa93190d3380005eed98.png' },
    { slug: 'eye-of-the-seeker', name: 'Eye of the Seeker', floor: 1.07, vol1d: 40.29, owners: 28093, supply: 80538, img: 'admin-uploads/6e8280d91048bb522dc2325e1dc8bb/fe6e8280d91048bb522dc2325e1dc8bb.png' },
    { slug: 'bum-market', name: 'Bum Market', floor: 0.78, vol1d: 80.86, owners: 515, supply: 2020, img: 'collection/bum-market/image_type_logo/5698f6db0571a3d17341bfdd6f457a/a45698f6db0571a3d17341bfdd6f457a.png' },
  ],

  // Tydro reserves on DefiLlama yields (pool ids are stable).
  tydroPools: {
    KBTC: '1357e23b-83d2-4183-bda0-a36913510b98',
    USDC: '4d296741-940d-44c1-a729-f6bd1f330f6f',
    WETH: '15baa435-9e38-4688-a345-6fe5783235ae',
    SOLVBTC: 'c12fde20-3dd4-4bae-a27a-bd897f8c4785',
    SYRUPUSDT: 'c205d31d-60aa-5990-9661-caaa9ca2571e',
    USDT0: 'ae25cef1-2ded-4c05-af5e-09f6420a2bce',
    USDG: '065ea91c-deff-4da0-a06f-64c642780936',
    SUSDE: '1731a991-a218-4988-891b-9e6e32a69506',
    GHO: '2fb294c3-2599-4134-b852-5e45cf57a879',
    WEETH: '20eb1a71-bff9-40e0-93f4-9a6a299521ab',
    USDE: '21aa18fb-5f8d-4f54-94a7-aa35ee7493c2',
  },

  // Nado perp buckets for the filter chips; anything not listed is crypto.
  perpGroups: {
    stocks: ['AAPL', 'AMD', 'AMZN', 'AVGO', 'BBX', 'CRCL', 'DELL', 'GOOGL', 'HIMS', 'INTC', 'LLY', 'META', 'MRVL', 'MSFT', 'MSTR', 'MU', 'NBIS', 'NVDA', 'ORCL', 'PENG', 'QQQ', 'SKHY', 'SNDK', 'SPCX', 'SPY', 'TSLA', 'ZHIPU'],
    commodities: ['WTI', 'XAG', 'XAUT'],
    fx: ['EURUSD', 'GBPUSD', 'USDJPY'],
  },

  points: [
    {
      name: '$INK airdrop',
      by: 'Ink Foundation · Kraken',
      status: 'Pre-TGE',
      body: '1B fixed supply. Reported eligibility: real usage on Ink, Kraken Pro activity, Nado trading and Tydro liquidity. Token not trading yet.',
      link: 'https://blog.kraken.com/news/integrating-ink-token',
      linkLabel: 'Kraken blog',
    },
    {
      name: 'Nado Points — Season 2',
      by: 'Nado',
      status: 'Live',
      body: 'Weekly points for trading, maker orders, open interest and liquidations. Not raw volume.',
      link: 'https://app.nado.xyz/points',
      linkLabel: 'Open Nado',
    },
    {
      name: 'xPoints on Nado',
      by: 'Nado · xStocks',
      status: 'Live',
      body: 'Points for holding and trading wrapped xStocks on Nado.',
      link: 'https://docs.nado.xyz/incentives-and-rewards/xpoints-on-nado',
      linkLabel: 'Docs',
    },
    {
      name: 'Quotrons Builder Points',
      by: 'Quotrons',
      status: 'Live',
      body: '20M floating builder points for projects that fund the Terminal Pot, Growth Sink or $INK buybacks. Non-transferable.',
      link: 'https://www.quotrons.cash/builders',
      linkLabel: 'Leaderboard',
    },
    {
      name: 'Templars of the Storm',
      by: 'Nado NFT',
      status: 'NFT boost',
      body: 'Holding a Templar multiplies Nado points and unlocks VIP fee tiers.',
      link: 'https://opensea.io/collection/templars-of-the-storm',
      linkLabel: 'OpenSea',
    },
  ],
};
