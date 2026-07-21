import { ethers } from 'ethers';
import circuitBreakerAbi from '../data/abis/CircuitBreaker.json';
import sanityPnlAbi from '../data/abis/SanityPnl.json';
import { calculateBlockNumbers, getCurrentBlockInfo } from './blockUtils.js';

export const ROBINHOOD_RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_BLOCK_TIME_SECONDS = 0.1;
export const ROBINHOOD_FIRST_BLOCK = 10330897;

export const ROBINHOOD_WALLET_ADDRESS =
  '0xcA9bf993eB00f641F1d4EBf6f334f1Ff04074EF6';
export const ROBINHOOD_SANITY_PNL_ADDRESS =
  '0x351d0AeF16f04C3730299Da7bf898bFB9d66561E';
export const ROBINHOOD_CIRCUIT_BREAKER_ADDRESS =
  '0xd218b2B96dA54b7B7170AfF8b99d2DF8BA6d3334';
export const ROBINHOOD_ETH_DEVIATION_CONTRACT_ADDRESS =
  '0xcC74c077852676AC11158AB0E2748AED60f6F3Ce';
export const ROBINHOOD_PROPAMM_MID_SHIFT_CONTRACT_ADDRESS =
  '0x7944d66C66a911b6002D581782f202106842Da08';
export const ROBINHOOD_PNL_ANCHOR_BLOCK = ROBINHOOD_FIRST_BLOCK;

export const ROBINHOOD_TOKENS = {
  weth: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
  usdc: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
  virtual: '0xc6911796042b15d7Fa4F6CDe69e245DdCd3d9c31'
};

export const ROBINHOOD_VOLUME_TOKENS = {
  weth: ROBINHOOD_TOKENS.weth,
  usdg: ROBINHOOD_TOKENS.usdc
};

export const ROBINHOOD_VOLUME_TOKEN_LABELS = {
  weth: 'WETH',
  usdg: 'USDG'
};

export const ROBINHOOD_AGGREGATORS = {
  normal0x: '0x1d4B86491ec211257cbedD77A4380a7494624EfF',
  router0x: '0x1167cB478D05d6B8178e6881354E0F052Fd234c1',
  intent0x: '0xFDb98116df7345E31d8588eF0e9BE166818A5C07',
  kyberSwap: '0x8F10B468b06c6FD214B65F87778827F7D113f996'
};

export const ROBINHOOD_AGGREGATOR_DISPLAY_NAMES = {
  normal0x: 'normal 0x',
  router0x: 'router 0x',
  intent0x: '0x intents',
  kyberSwap: 'KyberSwap'
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

const ETH_DEVIATION_ABI = [
  {
    inputs: [],
    name: 'calcDeviation',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const PROPAMM_MID_SHIFT_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'currTime', type: 'uint256' }],
    name: 'getSkew',
    outputs: [{ internalType: 'int96', name: '', type: 'int96' }],
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

/** Decode a 256-bit two's-complement integer (handles negative bps from calcDeviation). */
function toSignedInt256(raw) {
  const value = toBigInt(raw);
  const signBit = 1n << 255n;
  if (value >= signBit) {
    return value - (1n << 256n);
  }
  return value;
}

function scaleInt256ToNumber(raw) {
  const value = toSignedInt256(raw);
  const scale = 10n ** 36n;
  const whole = value / scale;
  const fraction = value % scale;
  return Number(whole) + Number(fraction) / Number(scale);
}

async function readPnlUsd(sanityContract, blockTag) {
  const raw = await sanityContract.pnl({ blockTag });
  return scaleInt256ToNumber(raw);
}

function robinhoodBlockAtSecondsAgo(
  currentBlock,
  secondsAgo,
  minBlock = ROBINHOOD_FIRST_BLOCK
) {
  const blocksBack = Math.floor(secondsAgo / ROBINHOOD_BLOCK_TIME_SECONDS);
  const calculated = currentBlock - blocksBack;
  return {
    block: Math.max(minBlock, calculated),
    hasFullData: calculated >= minBlock
  };
}

function robinhoodHoursAgoBlock(currentBlock, hours, minBlock = ROBINHOOD_FIRST_BLOCK) {
  return robinhoodBlockAtSecondsAgo(currentBlock, hours * 3600, minBlock);
}

function robinhoodMtmPeriodChange(current, previous, hasFullData) {
  return current != null && previous != null && hasFullData
    ? current - previous
    : null;
}

/** Current Robinhood PropAMM wallet value + circuit breaker min USD threshold. */
export async function fetchRobinhoodWalletValue() {
  const provider = getRobinhoodProvider();
  const circuitBreaker = new ethers.Contract(
    ROBINHOOD_CIRCUIT_BREAKER_ADDRESS,
    circuitBreakerAbi,
    provider
  );
  const [valueRaw, minUsdRaw] = await Promise.all([
    circuitBreaker.getWalletValue(),
    circuitBreaker.minUSDValue()
  ]);
  const current = Number(valueRaw?.toString?.() ?? valueRaw);
  const minUSDValue = Number(minUsdRaw?.toString?.() ?? minUsdRaw);
  return {
    current: Number.isFinite(current) ? current : null,
    minUSDValue: Number.isFinite(minUSDValue) ? minUSDValue : null
  };
}

/** MTM-style PnL deltas from SanityPnl `pnl()` on Robinhood chain. */
export async function fetchRobinhoodMtmSnapshot() {
  const provider = getRobinhoodProvider();
  const sanityContract = new ethers.Contract(
    ROBINHOOD_SANITY_PNL_ADDRESS,
    sanityPnlAbi,
    provider
  );

  const { blockNumber } = await getCurrentBlockInfo(provider);
  const minBlock = ROBINHOOD_FIRST_BLOCK;

  const oneHour = robinhoodHoursAgoBlock(blockNumber, 1, minBlock);
  const twentyFourHours = robinhoodHoursAgoBlock(blockNumber, 24, minBlock);

  const [pnlNow, pnl1h, pnl24h] = await Promise.all([
    readPnlUsd(sanityContract, blockNumber),
    oneHour.hasFullData
      ? readPnlUsd(sanityContract, oneHour.block)
      : Promise.resolve(null),
    twentyFourHours.hasFullData
      ? readPnlUsd(sanityContract, twentyFourHours.block)
      : Promise.resolve(null)
  ]);

  return {
    value: pnlNow,
    change1h: robinhoodMtmPeriodChange(pnlNow, pnl1h, oneHour.hasFullData),
    change24h: robinhoodMtmPeriodChange(
      pnlNow,
      pnl24h,
      twentyFourHours.hasFullData
    ),
    change7d: null,
    changeSinceJune18: null
  };
}

/** Robinhood PropAMM wallet balances vs SanityPnl targets (WETH, Virtual, USDC). */
export async function fetchRobinhoodTokenBalances() {
  const provider = getRobinhoodProvider();
  const sanityContract = new ethers.Contract(
    ROBINHOOD_SANITY_PNL_ADDRESS,
    sanityPnlAbi,
    provider
  );

  const balanceData = {};

  for (const [key, tokenAddress] of Object.entries(ROBINHOOD_TOKENS)) {
    try {
      const decimals = ROBINHOOD_TOKEN_DECIMALS[key];
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balanceRaw, targetRaw] = await Promise.all([
        tokenContract.balanceOf(ROBINHOOD_WALLET_ADDRESS),
        sanityContract.targets(tokenAddress)
      ]);

      const balanceBig = toBigInt(balanceRaw);
      const targetBig = toBigInt(targetRaw);
      const divisor = 10n ** BigInt(decimals);
      const balance = Number(balanceBig) / Number(divisor);
      const target = Number(targetBig) / Number(divisor);

      balanceData[key] = {
        balance,
        target,
        percentage: target > 0 ? (balance / target) * 100 : 0
      };
    } catch (error) {
      console.warn(`Robinhood token balance fetch failed for ${key}:`, error);
      balanceData[key] = { balance: 0, target: 0, percentage: 0 };
    }
  }

  return balanceData;
}

/** PnL circuit breaker snapshot from Robinhood SanityPnl (referencePnl, maxLoss, current loss). */
export async function fetchRobinhoodSanityPnlCircuitBreaker() {
  const provider = getRobinhoodProvider();
  const sanityContract = new ethers.Contract(
    ROBINHOOD_SANITY_PNL_ADDRESS,
    sanityPnlAbi,
    provider
  );
  const pnlFn = sanityContract.getFunction('pnl()');
  const [referenceRaw, maxLossRaw, pnlRaw] = await Promise.all([
    sanityContract.referencePnl(),
    sanityContract.maxLoss(),
    pnlFn()
  ]);

  const referencePnl = scaleInt256ToNumber(referenceRaw);
  const currentPnl = scaleInt256ToNumber(pnlRaw);
  const maxB = toBigInt(maxLossRaw);
  const scale = 1e36;

  return {
    referencePnl,
    maxAllowedLoss: Number(maxB) / scale,
    delta: currentPnl - referencePnl
  };
}

async function readEthDeviationBps(provider) {
  const deviationContract = new ethers.Contract(
    ROBINHOOD_ETH_DEVIATION_CONTRACT_ADDRESS,
    ETH_DEVIATION_ABI,
    provider
  );
  const raw = await deviationContract.calcDeviation.staticCall();
  return Number(toSignedInt256(raw));
}

function computePropAmmMidShift(skewRaw) {
  const x = toBigInt(skewRaw);
  const oneE18 = 10n ** 18n;
  const oneE4 = 10n ** 4n;
  const scaled = ((x - oneE18) * oneE4 * 100n) / oneE18;
  return Number(scaled) / 100;
}

async function readPropAmmMidShift(provider, currTimeSeconds) {
  const skewContract = new ethers.Contract(
    ROBINHOOD_PROPAMM_MID_SHIFT_CONTRACT_ADDRESS,
    PROPAMM_MID_SHIFT_ABI,
    provider
  );
  const skewRaw = await skewContract.getSkew(currTimeSeconds);
  return computePropAmmMidShift(skewRaw);
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

  const { blockNumber, timestamp } = await getCurrentBlockInfo(provider);
  const currTimeSeconds =
    timestamp && timestamp > 0
      ? timestamp
      : Math.floor(Date.now() / 1000);

  let ethDeviationBps = null;
  try {
    ethDeviationBps = await readEthDeviationBps(provider);
  } catch (error) {
    console.warn('Robinhood calcDeviation failed:', error);
  }

  let propAmmMidShift = null;
  try {
    propAmmMidShift = await readPropAmmMidShift(provider, currTimeSeconds);
  } catch (error) {
    console.warn('Robinhood getSkew failed:', error);
  }

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
    ethDeviationBps,
    propAmmMidShift,
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

async function readRobinhoodVolume(contract, aggAddress, tokenAddress, blockTag, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await contract.volume(aggAddress, tokenAddress, { blockTag });
    } catch (error) {
      if (attempt === retries) {
        console.warn(
          `Robinhood volume reverted at block ${blockTag} for ${tokenAddress}/${aggAddress}`
        );
        return 0n;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 100));
    }
  }
  return 0n;
}

function toVolumeBigInt(value) {
  return typeof value === 'bigint' ? value : BigInt(value.toString());
}

/** 1h / 24h volume stats for Robinhood PropAMM (WETH + USDG). */
export async function fetchRobinhoodVolumeStats() {
  const provider = getRobinhoodProvider();
  const contract = new ethers.Contract(
    ROBINHOOD_CIRCUIT_BREAKER_ADDRESS,
    circuitBreakerAbi,
    provider
  );

  const { blockNumber, timestamp } = await getCurrentBlockInfo(provider);
  const blocks = calculateBlockNumbers(blockNumber, timestamp, {
    firstBlock: ROBINHOOD_FIRST_BLOCK,
    blockTimeSeconds: ROBINHOOD_BLOCK_TIME_SECONDS
  });

  const volumeData = {};
  for (const [tokenName, tokenAddress] of Object.entries(ROBINHOOD_VOLUME_TOKENS)) {
    volumeData[tokenName] = {};

    for (const [aggName, aggAddress] of Object.entries(ROBINHOOD_AGGREGATORS)) {
      const [volumeCurrent, volume1h, volume24h] = await Promise.all([
        readRobinhoodVolume(contract, aggAddress, tokenAddress, blocks.current),
        readRobinhoodVolume(contract, aggAddress, tokenAddress, blocks.oneHourAgo),
        readRobinhoodVolume(
          contract,
          aggAddress,
          tokenAddress,
          blocks.twentyFourHoursAgo
        )
      ]);

      const currentBigInt = toVolumeBigInt(volumeCurrent);
      const oneHourBigInt = toVolumeBigInt(volume1h);
      const twentyFourHoursBigInt = toVolumeBigInt(volume24h);

      const oneHourVolume = blocks.hasFull1hData
        ? currentBigInt - oneHourBigInt
        : 0n;
      const twentyFourHoursVolume = currentBigInt - twentyFourHoursBigInt;

      volumeData[tokenName][aggName] = {
        oneHour: oneHourVolume.toString(),
        twentyFourHours: twentyFourHoursVolume.toString()
      };
    }
  }

  const perToken = {};
  const perAggregator = Object.fromEntries(
    Object.keys(ROBINHOOD_AGGREGATORS).map((key) => [key, {}])
  );

  for (const tokenName of Object.keys(ROBINHOOD_VOLUME_TOKENS)) {
    perToken[tokenName] = {};
    for (const aggName of Object.keys(ROBINHOOD_AGGREGATORS)) {
      const vol = volumeData[tokenName][aggName] || {
        oneHour: '0',
        twentyFourHours: '0'
      };
      perToken[tokenName][aggName] = {
        oneHour: vol.oneHour,
        twentyFourHours: vol.twentyFourHours
      };
    }
  }

  for (const aggName of Object.keys(ROBINHOOD_AGGREGATORS)) {
    for (const tokenName of Object.keys(ROBINHOOD_VOLUME_TOKENS)) {
      const data = volumeData[tokenName][aggName] || {
        oneHour: '0',
        twentyFourHours: '0'
      };
      perAggregator[aggName][tokenName] = {
        oneHour: data.oneHour,
        twentyFourHours: data.twentyFourHours
      };
    }
  }

  let overall1h = 0n;
  let overall24h = 0n;
  for (const tokenName of Object.keys(ROBINHOOD_VOLUME_TOKENS)) {
    for (const aggName of Object.keys(ROBINHOOD_AGGREGATORS)) {
      const data = volumeData[tokenName][aggName];
      overall1h += BigInt(data.oneHour);
      overall24h += BigInt(data.twentyFourHours);
    }
  }

  return {
    perToken,
    perAggregator,
    overall: {
      oneHour: overall1h.toString(),
      twentyFourHours: overall24h.toString()
    },
    timeSinceFirst: blocks.timeSinceFirst
  };
}
