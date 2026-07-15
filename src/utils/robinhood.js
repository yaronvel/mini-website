import { ethers } from 'ethers';
import circuitBreakerAbi from '../data/abis/CircuitBreaker.json';
import sanityPnlAbi from '../data/abis/SanityPnl.json';

export const ROBINHOOD_RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
export const ROBINHOOD_CHAIN_ID = 4663;

export const ROBINHOOD_WALLET_ADDRESS =
  '0xcA9bf993eB00f641F1d4EBf6f334f1Ff04074EF6';
export const ROBINHOOD_SANITY_PNL_ADDRESS =
  '0x351d0AeF16f04C3730299Da7bf898bFB9d66561E';
export const ROBINHOOD_CIRCUIT_BREAKER_ADDRESS =
  '0xd218b2B96dA54b7B7170AfF8b99d2DF8BA6d3334';
export const ROBINHOOD_PNL_ANCHOR_BLOCK = 10330897;

export const ROBINHOOD_TOKENS = {
  weth: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
  usdc: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
  virtual: '0xc6911796042b15d7Fa4F6CDe69e245DdCd3d9c31'
};

export const ROBINHOOD_TOKEN_DECIMALS = {
  weth: 18,
  usdc: 6,
  virtual: 18
};

const ROBINHOOD_TOKEN_LABELS = {
  weth: 'WETH',
  usdc: 'USDC',
  virtual: 'Virtual'
};

const QUOTE_IMPL_ABI = [
  {
    inputs: [],
    name: 'getListedTokens',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  }
];

const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
];

let robinhoodProviderSingleton = null;

export function getRobinhoodProvider() {
  if (!robinhoodProviderSingleton) {
    robinhoodProviderSingleton = new ethers.JsonRpcProvider(ROBINHOOD_RPC_URL, {
      chainId: ROBINHOOD_CHAIN_ID,
      name: 'robinhood'
    });
  }
  return robinhoodProviderSingleton;
}

function tokenKeyForAddress(address) {
  const normalized = address.toLowerCase();
  for (const [key, tokenAddress] of Object.entries(ROBINHOOD_TOKENS)) {
    if (tokenAddress.toLowerCase() === normalized) return key;
  }
  return normalized;
}

function tokenLabel(key) {
  return ROBINHOOD_TOKEN_LABELS[key] ?? key;
}

function toBigInt(value) {
  return typeof value === 'bigint' ? value : BigInt(value.toString());
}

function scaleInt256ToNumber(raw) {
  const value = toBigInt(raw);
  const scale = 10n ** 36n;
  const whole = value / scale;
  const fraction = value % scale;
  return Number(whole) + Number(fraction) / Number(scale);
}

async function readPnlUsd(sanityContract, blockTag) {
  const raw = await sanityContract.pnl({ blockTag });
  return scaleInt256ToNumber(raw);
}

async function collectImbalanceTokens(provider, circuitBreaker, sanityContract) {
  const quoteAddress = await circuitBreaker.quoteImpl();
  const quoteContract = new ethers.Contract(
    quoteAddress,
    QUOTE_IMPL_ABI,
    provider
  );
  const usdcAddress = await sanityContract.usdc();
  const listedTokens = await quoteContract.getListedTokens();

  const seen = new Set();
  const tokens = [];
  for (const address of [...listedTokens, usdcAddress]) {
    const normalized = address.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    tokens.push(address);
  }
  return tokens;
}

/** Current wallet value, PnL vs anchor block, and Robinhood-only imbalance snapshot. */
export async function fetchRobinhoodSnapshot() {
  const provider = getRobinhoodProvider();
  const circuitBreaker = new ethers.Contract(
    ROBINHOOD_CIRCUIT_BREAKER_ADDRESS,
    circuitBreakerAbi,
    provider
  );
  const sanityContract = new ethers.Contract(
    ROBINHOOD_SANITY_PNL_ADDRESS,
    sanityPnlAbi,
    provider
  );

  const blockNumber = await provider.getBlockNumber();

  let walletValueUsd = null;
  try {
    const raw = await circuitBreaker.getWalletValue();
    walletValueUsd = Number(raw.toString());
  } catch (error) {
    console.warn('Robinhood getWalletValue failed:', error);
  }

  let pnlCurrentUsd = null;
  let pnlAnchorUsd = null;
  try {
    pnlCurrentUsd = await readPnlUsd(sanityContract, 'latest');
    pnlAnchorUsd = await readPnlUsd(sanityContract, ROBINHOOD_PNL_ANCHOR_BLOCK);
  } catch (error) {
    console.warn('Robinhood pnl read failed:', error);
  }

  let tokenAddresses = Object.values(ROBINHOOD_TOKENS);
  try {
    tokenAddresses = await collectImbalanceTokens(
      provider,
      circuitBreaker,
      sanityContract
    );
  } catch (error) {
    console.warn('Robinhood token list failed, using defaults:', error);
  }

  const tokenRows = [];
  for (const tokenAddress of tokenAddresses) {
    try {
      const key = tokenKeyForAddress(tokenAddress);
      const decimals =
        ROBINHOOD_TOKEN_DECIMALS[key] ??
        Number(
          await new ethers.Contract(tokenAddress, ERC20_ABI, provider).decimals()
        );
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balanceRaw, targetRaw] = await Promise.all([
        tokenContract.balanceOf(ROBINHOOD_WALLET_ADDRESS),
        sanityContract.targets(tokenAddress)
      ]);

      const balanceBig = toBigInt(balanceRaw);
      const targetBig = toBigInt(targetRaw);
      const imbalanceNativeBig = balanceBig - targetBig;
      const imbalanceUsdRaw = await sanityContract.getUSDValue(
        tokenAddress,
        imbalanceNativeBig
      );

      const divisor = 10n ** BigInt(decimals);
      const balance = Number(balanceBig) / Number(divisor);
      const target = Number(targetBig) / Number(divisor);
      const imbalanceNative = Number(imbalanceNativeBig) / Number(divisor);
      const imbalanceUsd = scaleInt256ToNumber(imbalanceUsdRaw);

      tokenRows.push({
        key,
        label: tokenLabel(key),
        balance,
        target,
        imbalanceNative,
        imbalanceUsd,
        percentage: target > 0 ? (balance / target) * 100 : 0
      });
    } catch (error) {
      console.warn(`Robinhood imbalance fetch failed for ${tokenAddress}:`, error);
    }
  }

  const totalImbalanceUsd = tokenRows.reduce(
    (sum, row) => sum + row.imbalanceUsd,
    0
  );

  if (
    walletValueUsd == null &&
    pnlCurrentUsd == null &&
    tokenRows.length === 0
  ) {
    throw new Error('Failed to load any Robinhood on-chain data');
  }

  return {
    blockNumber,
    walletValueUsd,
    pnlCurrentUsd,
    pnlChangeUsd:
      pnlCurrentUsd != null && pnlAnchorUsd != null
        ? pnlCurrentUsd - pnlAnchorUsd
        : null,
    pnlAnchorBlock: ROBINHOOD_PNL_ANCHOR_BLOCK,
    totalImbalanceUsd,
    tokens: tokenRows
  };
}
