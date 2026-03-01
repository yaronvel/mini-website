# Base Volume Statistics Website

A React-based website that displays volume statistics from a Base smart contract. Shows 1-hour and 24-hour volume statistics per token, per aggregator, and overall totals.
 
## Features

- Real-time volume statistics from Base blockchain
- 1-hour and 24-hour volume tracking
- Per-token statistics (WETH, CBBTC, Token3)
- Per-aggregator statistics (Kyber Swap, ZeroX)
- Overall totals across all tokens and aggregators
- Auto-refresh every 30 seconds
- Responsive design

## Contract Details

- **Contract Address**: `0xA05dE8fedaF5d47a6A8726811cC5f387BEf1F816`
- **Network**: Base Mainnet
- **Starting Block**: 42784272
- **Block Time**: 2 seconds

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment (Serverless)

This is a static React application that can be deployed to any static hosting service. Here are the simplest options:

### Option 1: Vercel (Recommended - Simplest)

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" and import your repository
4. Vercel will auto-detect it's a Vite project
5. Click "Deploy" - no configuration needed!
6. Your site will be live in seconds

**Advantages:**
- Zero configuration
- Automatic deployments on git push
- Free tier with generous limits
- Global CDN
- Custom domains

### Option 2: Netlify

1. Push your code to a GitHub repository
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click "New site from Git" and connect your repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click "Deploy site"

**Advantages:**
- Simple setup
- Free tier available
- Automatic deployments
- Custom domains

### Option 3: Cloudflare Pages

1. Push your code to a GitHub repository
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
3. Click "Create a project" → "Connect to Git"
4. Select your repository
5. Build command: `npm run build`
6. Build output directory: `dist`
7. Click "Save and Deploy"

**Advantages:**
- Fast global CDN
- Free tier
- Unlimited bandwidth
- Custom domains

### Option 4: GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run: `npm run deploy`

## How It Works

1. Connects to Base blockchain via public RPC endpoint
2. Reads current block number and timestamp
3. Calculates block numbers for 1 hour and 24 hours ago (assuming 2s per block)
4. Calls the contract's `volume()` function for each token/aggregator combination at different block heights
5. Calculates volume differences to get 1h and 24h statistics
6. Handles edge cases where 24h data isn't available yet (uses first block as baseline)

## Data Format

Volume values are returned in USDC wei (6 decimals), so they're divided by 1e6 to display human-readable USDC amounts.

## Technologies

- React 19
- Vite
- ethers.js v6
- Base Mainnet RPC
