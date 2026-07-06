import { ethers, FetchRequest } from 'ethers';
import sanityPnlAbi from '../data/abis/SanityPnl.json';
import circuitBreakerAbi from '../data/abis/CircuitBreaker.json';
import mexicanPricerV6Abi from '../data/abis/MexicanPricerV6.json';

// Contract configuration
export const CONTRACT_ADDRESS = '0xA05dE8fedaF5d47a6A8726811cC5f387BEf1F816';
/** Same deployment as {@link CONTRACT_ADDRESS} — swap / wallet / volume / min USD interface. */
export const CIRCUIT_BREAKER_ADDRESS = CONTRACT_ADDRESS;
/** Full circuit breaker ABI (copy also lives in `src/data/abis/CircuitBreaker.json`). */
export const CIRCUIT_BREAKER_ABI = circuitBreakerAbi;
// Base RPC endpoint — 1inch archive node (requires bearer token via getProvider)
export const BASE_RPC_URL = 'https://api.1inch.com/web3/8453/archive';
// Ethereum mainnet — same 1inch archive API, same bearer token
export const MAINNET_RPC_URL = 'https://api.1inch.com/web3/1/archive';
export const FIRST_BLOCK = 42784272;
export const BLOCK_TIME_SECONDS = 2;
/** FIRST_BLOCK + 31 days, assuming exactly {@link BLOCK_TIME_SECONDS} seconds per block */
export const PNL_ANCHOR_BLOCK =
  FIRST_BLOCK + (31 * 24 * 3600) / BLOCK_TIME_SECONDS;

/** Same block — start of April window in the dashboard. */
export const PNL_APRIL_START_BLOCK = PNL_ANCHOR_BLOCK;

/** Duration of April cube: thirty 24h periods in blocks (= 3600 * 24 * 30 / block time). */
export const PNL_APRIL_DURATION_BLOCKS =
  (30 * 24 * 3600) / BLOCK_TIME_SECONDS;

/** First block of May; April inclusive window is {@link PNL_APRIL_START_BLOCK} … (this − 1). */
export const PNL_MAY_START_BLOCK =
  PNL_APRIL_START_BLOCK + PNL_APRIL_DURATION_BLOCKS;

/** Duration of May window: 31 days in blocks (= 31 × 24 × 3600 / block time). */
export const PNL_MAY_DURATION_BLOCKS =
  (31 * 24 * 3600) / BLOCK_TIME_SECONDS;

/** First block of June; May inclusive window is {@link PNL_MAY_START_BLOCK} … (this − 1). */
export const PNL_JUNE_START_BLOCK =
  PNL_MAY_START_BLOCK + PNL_MAY_DURATION_BLOCKS;

/** App entry contract — same ABI as {@link CIRCUIT_BREAKER_ABI}. */
export const CONTRACT_ABI = circuitBreakerAbi;

// Target balance / imbalance curve contract ABI (subset used by the app)
export const TARGET_BALANCE_CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'tokenTargetBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'caps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'slippageCurve',
    outputs: [
      { internalType: 'int256', name: 'a', type: 'int256' },
      { internalType: 'int256', name: 'b', type: 'int256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'badPenaltyIn1M',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Token addresses
export const TOKENS = {
  weth: '0x4200000000000000000000000000000000000006',
  cbbtc: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  virtual: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b',
  usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
};

// Token decimals
export const TOKEN_DECIMALS = {
  weth: 18,
  cbbtc: 8,
  virtual: 18,
  usdc: 6
};

// Target balance contract address
export const TARGET_BALANCE_CONTRACT_ADDRESS = '0x32C42B4b9B636483831B0c99bc776999bD6175A3';

/** Base rebalancer — virtual balance offset per token. */
export const REBALANCER_CONTRACT_ADDRESS =
  '0xe55aDbd4a21616C4A5936B5C7e99bf43afaeb298';
export const REBALANCER_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'currTime', type: 'uint256' }
    ],
    name: 'getVirtualBalance',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const REBALANCE_OFFSET_TOKEN_KEYS = ['weth', 'cbbtc', 'virtual'];

export const VT_WALLET_ADDRESS = '0xbeeB9eeE061925cC6d2122F05a4e6536F0FEB000';
export const WALLET_VALUE_VIEW_CONTRACT_ADDRESS =
  '0x0Ca60fA2BaEe822c96f91D0a6fa8a5c11690c5cc';

export const WALLET_VALUE_VIEW_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'walletAddress', type: 'address' },
      { internalType: 'address[]', name: 'listedTokens', type: 'address[]' }
    ],
    name: 'getWalletValue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const VT_WALLET_LISTED_TOKENS = [
  TOKENS.weth,
  TOKENS.cbbtc,
  TOKENS.virtual
];

export const BASE_CIRCUIT_BREAKER_VIEW_ONLY_ADDRESS =
  '0xba831C1E08A9b2F1621a175c48deC23E97a85C27';
export const MAINNET_CIRCUIT_BREAKER_VIEW_ONLY_ADDRESS =
  '0x6B8629D8d6ba1691Df800A5a5c270619AD86d37F';

export const CIRCUIT_BREAKER_VIEW_ONLY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'walletAddress', type: 'address' },
      { internalType: 'address[]', name: 'listedTokens', type: 'address[]' },
      { internalType: 'int256[]', name: 'targets', type: 'int256[]' },
      { internalType: 'int256', name: 'usdcTarget', type: 'int256' }
    ],
    name: 'getPnl',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

/** Base PropAMM MTM token order (cbbtc, weth, virtual) — matches on-chain getPnl usage. */
export const BASE_PROP_AMM_MTM_LISTED_TOKENS = [
  TOKENS.cbbtc,
  TOKENS.weth,
  TOKENS.virtual
];

export const BASE_PROP_AMM_MTM_TARGETS = [
  ethers.parseUnits('1.5', TOKEN_DECIMALS.cbbtc),
  ethers.parseUnits('55', TOKEN_DECIMALS.weth),
  ethers.parseUnits('10000', TOKEN_DECIMALS.virtual)
];

export const BASE_PROP_AMM_MTM_USDC_TARGET = ethers.parseUnits('186706', TOKEN_DECIMALS.usdc);

/** VT wallet MTM token order matches {@link VT_WALLET_LISTED_TOKENS}. */
export const VT_MTM_LISTED_TOKENS = VT_WALLET_LISTED_TOKENS;

export const VT_MTM_TARGETS = [
  ethers.parseUnits('50', TOKEN_DECIMALS.weth),
  ethers.parseUnits('1.1', TOKEN_DECIMALS.cbbtc),
  ethers.parseUnits('4744', TOKEN_DECIMALS.virtual)
];

export const VT_MTM_USDC_TARGET = ethers.parseUnits('200000', TOKEN_DECIMALS.usdc);

/** Base-chain tokens tracked in the VT wallet balances row. */
export const VT_BALANCE_TOKENS = {
  weth: TOKENS.weth,
  cbbtc: TOKENS.cbbtc,
  virtual: TOKENS.virtual
};

/** Ethereum mainnet token addresses (no cbBTC / Virtual; WBTC replaces cbBTC). */
export const MAINNET_TOKENS = {
  weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  wbtc: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
};

export const MAINNET_WALLET_ADDRESS = '0xC841C89609656A39d9365fd0bAB4fD8D59B99155';
export const MAINNET_WALLET_VALUE_VIEW_CONTRACT_ADDRESS =
  '0xC298bDDCB96B2b2074068A235F26a6F29D2E0Dea';
export const MAINNET_CIRCUIT_BREAKER_ADDRESS =
  '0x5CDbE59400Cc2EFDCC2B54acca4a99FE00dD588c';

export const MAINNET_WALLET_LISTED_TOKENS = [
  MAINNET_TOKENS.weth,
  MAINNET_TOKENS.wbtc
];

export const MAINNET_TARGET_BALANCE_CONTRACT_ADDRESS =
  '0x0e1A3f4cF05829A25D5675DC6a3497eeE50a312a';

export const MAINNET_TOKEN_DECIMALS = {
  weth: 18,
  wbtc: 8,
  usdc: 6
};

/** Mainnet PropAMM MTM token order (weth, wbtc). */
export const MAINNET_MTM_LISTED_TOKENS = MAINNET_WALLET_LISTED_TOKENS;

export const MAINNET_MTM_TARGETS = [
  ethers.parseUnits('20', MAINNET_TOKEN_DECIMALS.weth),
  ethers.parseUnits('0.5', MAINNET_TOKEN_DECIMALS.wbtc)
];

export const MAINNET_MTM_USDC_TARGET = ethers.parseUnits(
  '170000',
  MAINNET_TOKEN_DECIMALS.usdc
);

/** Tokens shown in the mainnet PropAMM token-balances row (WBTC replaces cbBTC). */
export const MAINNET_BALANCE_TOKENS = {
  weth: MAINNET_TOKENS.weth,
  wbtc: MAINNET_TOKENS.wbtc,
  usdc: MAINNET_TOKENS.usdc
};

// PnL contract addresses (by on-chain block when reading historical pnl())
export const PNL_CONTRACT_ADDRESS_EARLIEST =
  '0x1b2Bfed2092532701e5C5DA69a0796989c094290';
export const PNL_CONTRACT_ADDRESS_OLD =
  '0xeE1C69BCAfb34b13cCEA4137ba056a87255bBFd2';
export const PNL_CONTRACT_ADDRESS_NEW =
  '0x64CdcC66a9943862bd4E3B608016A71bC9Ab860B';
export const PNL_CONTRACT_ADDRESS_LATEST =
  '0xD728CaE14Cb5cecA6544827C065D7802eDC215a0';
/** Inclusive end block for earliest PnL contract; from 44041150 use OLD until NEW threshold */
export const PNL_CONTRACT_FIRST_ERA_END_BLOCK = 44041149;
/** First block (inclusive) for NEW PnL contract */
export const PNL_CONTRACT_BLOCK_THRESHOLD = 44691628;
/** First block (inclusive) for current PnL contract (replaces NEW from this height) */
export const PNL_CONTRACT_LATEST_BLOCK_THRESHOLD = 45030435;

// PnL contract ABI
export const PNL_CONTRACT_ABI = [
  {
    inputs: [],
    name: 'pnl',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Aggregator addresses
export const AGGREGATORS = {
  kyberSwap: '0x63242A4Ea82847b20E506b63B0e2e2eFF0CC6cB0',
  kyberSwapNew: '0x8F10B468b06c6FD214B65F87778827F7D113f996',
  spyros: '0x7747F8D2a76BD6345Cc29622a946A929647F2359',
  router0x: '0x68A14203953130ae840e37DBe3d64c1E6858da7b',
  intent0x: '0x6b6e87D2Cc438C287a5550a8732C302454E4382b',
  okx: '0x0Bf54dd1664E14A01fc8aC3Abe8DD630ea9344D8',
  nordstern: '0x28BF6006d87De7F44445905Aa4f5CB8C0D8cbA02',
  lifiStaging: '0x1af18f06f97679b16a8f553326ab2857e6cfd920',
  lifi: '0x09ad820aac5779683b481c4674208a4e1b024afa',
  fibrous: '0x274602a953847d807231d2370072f5f4e4594b44',
  liquidMeshQA: '0xe5d4b6fa308335350e6b992c8a189eab51b22fae',
  liquidMesh: '0xf5ae73ca5ed58a30886b88e74d0ba1931d315a8c',
  rebalance: '0xe55aDbd4a21616C4A5936B5C7e99bf43afaeb298',
  bitget: '0x184a53FAe631f477B57E8319c7aedb42d98b8635'
};

export const AGGREGATOR_DISPLAY_NAMES = {
  kyberSwap: 'Kyber Swap',
  kyberSwapNew: 'kyber swap new',
  spyros: 'normal 0x',
  router0x: 'router 0x',
  intent0x: 'intent 0x',
  okx: 'okx',
  nordstern: 'Nordstern',
  lifiStaging: 'LiFi (staging)',
  lifi: 'LiFi',
  fibrous: 'Fibrous',
  liquidMeshQA: 'LiquidMesh (QA)',
  liquidMesh: 'LiquidMesh',
  rebalance: 'Rebalance',
  bitget: 'Bitget'
};

// USDC has 6 decimals, so divide by 1e6 to get human-readable number
export const USDC_DECIMALS = 6;
export const USDC_DIVISOR = 10n ** BigInt(USDC_DECIMALS);

// Initialize provider and contract
export function getProvider(bearerToken) {
  if (!bearerToken) {
    throw new Error('RPC bearer token is required');
  }
  const fetchRequest = new FetchRequest(BASE_RPC_URL);
  fetchRequest.setHeader('Authorization', `Bearer ${bearerToken}`);
  return new ethers.JsonRpcProvider(fetchRequest, {
    chainId: 8453,
    name: 'base'
  });
}

export function getMainnetProvider(bearerToken) {
  if (!bearerToken) {
    throw new Error('RPC bearer token is required');
  }
  const fetchRequest = new FetchRequest(MAINNET_RPC_URL);
  fetchRequest.setHeader('Authorization', `Bearer ${bearerToken}`);
  return new ethers.JsonRpcProvider(fetchRequest, {
    chainId: 1,
    name: 'mainnet'
  });
}

export function getContract(provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export function getTargetBalanceContract(provider) {
  return new ethers.Contract(TARGET_BALANCE_CONTRACT_ADDRESS, TARGET_BALANCE_CONTRACT_ABI, provider);
}

export function getRebalancerContract(provider) {
  return new ethers.Contract(
    REBALANCER_CONTRACT_ADDRESS,
    REBALANCER_CONTRACT_ABI,
    provider
  );
}

export function getWalletValueViewContract(provider) {
  return new ethers.Contract(
    WALLET_VALUE_VIEW_CONTRACT_ADDRESS,
    WALLET_VALUE_VIEW_CONTRACT_ABI,
    provider
  );
}

export function getBaseCircuitBreakerViewOnlyContract(provider) {
  return new ethers.Contract(
    BASE_CIRCUIT_BREAKER_VIEW_ONLY_ADDRESS,
    CIRCUIT_BREAKER_VIEW_ONLY_ABI,
    provider
  );
}

export function getMainnetCircuitBreakerViewOnlyContract(provider) {
  return new ethers.Contract(
    MAINNET_CIRCUIT_BREAKER_VIEW_ONLY_ADDRESS,
    CIRCUIT_BREAKER_VIEW_ONLY_ABI,
    provider
  );
}

async function readMtmPnl(
  chainLabel,
  contract,
  walletAddress,
  listedTokens,
  targets,
  usdcTarget,
  blockTag,
  retries = 3
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await contract.getPnl(
        walletAddress,
        listedTokens,
        targets,
        usdcTarget,
        { blockTag }
      );
      return Number(result.toString());
    } catch (error) {
      if (attempt === retries) {
        console.warn(
          `MTM getPnl (${chainLabel}) reverted at block ${blockTag} after ${retries} attempts`
        );
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 100));
    }
  }
  return null;
}

/** Base L1 block oracle — `number()` returns Ethereum mainnet block at that Base block. */
export const MAINNET_BLOCK_ORACLE_ADDRESS =
  '0x4200000000000000000000000000000000000015';
const MAINNET_BLOCK_ORACLE_ABI = [
  'function number() public view returns (uint256)'
];

async function getBaseBlockInfo(baseProvider) {
  const blockNumber = await baseProvider.getBlockNumber();
  try {
    const block = await baseProvider.send('eth_getBlockByNumber', [
      `0x${blockNumber.toString(16)}`,
      false
    ]);
    if (block?.timestamp) {
      return {
        blockNumber,
        timestamp: parseInt(block.timestamp, 16)
      };
    }
  } catch (error) {
    console.warn('getBaseBlockInfo RPC fallback:', error);
  }
  const block = await baseProvider.getBlock(blockNumber);
  return {
    blockNumber,
    timestamp: Number(block.timestamp)
  };
}

function mtmBaseBlockAtSecondsAgo(
  currentBlock,
  currentTimestamp,
  secondsAgo,
  minBlock = 0
) {
  const targetTimestamp = currentTimestamp - secondsAgo;
  const blocksBack = Math.floor(
    (currentTimestamp - targetTimestamp) / BLOCK_TIME_SECONDS
  );
  const calculated = currentBlock - blocksBack;
  return {
    block: Math.max(minBlock, calculated),
    hasFullData: calculated >= minBlock
  };
}

/** June 18 12:00:00 UTC (noon) — MTM period anchor (2026). */
export const MTM_JUNE_18_UTC_UNIX = Date.UTC(2026, 5, 18, 12, 0, 0) / 1000;

function mtmBaseBlockAtTimestamp(
  currentBlock,
  currentTimestamp,
  targetTimestamp,
  minBlock = 0
) {
  if (targetTimestamp > currentTimestamp) {
    return { block: minBlock, hasFullData: false };
  }
  const secondsAgo = currentTimestamp - targetTimestamp;
  return mtmBaseBlockAtSecondsAgo(
    currentBlock,
    currentTimestamp,
    secondsAgo,
    minBlock
  );
}

function mtmHoursAgoBlock(currentBlock, currentTimestamp, hours, minBlock = 0) {
  return mtmBaseBlockAtSecondsAgo(
    currentBlock,
    currentTimestamp,
    hours * 3600,
    minBlock
  );
}

async function getMainnetBlockAtBaseBlock(baseProvider, baseBlockTag) {
  const oracle = new ethers.Contract(
    MAINNET_BLOCK_ORACLE_ADDRESS,
    MAINNET_BLOCK_ORACLE_ABI,
    baseProvider
  );
  const result = await oracle.number({ blockTag: baseBlockTag });
  return Number(result);
}

function mtmPeriodChange(current, previous, hasFullData) {
  return current != null && previous != null && hasFullData
    ? current - previous
    : null;
}

async function readPropAmmMtmAtBlock(
  chainLabel,
  baseView,
  walletAddress,
  blockTag
) {
  return readMtmPnl(
    chainLabel,
    baseView,
    walletAddress,
    BASE_PROP_AMM_MTM_LISTED_TOKENS,
    BASE_PROP_AMM_MTM_TARGETS,
    BASE_PROP_AMM_MTM_USDC_TARGET,
    blockTag
  );
}

async function readVtMtmAtBlock(baseView, blockTag) {
  return readMtmPnl(
    'base',
    baseView,
    VT_WALLET_ADDRESS,
    VT_MTM_LISTED_TOKENS,
    VT_MTM_TARGETS,
    VT_MTM_USDC_TARGET,
    blockTag
  );
}

async function readMainnetMtmAtBlock(mainnetView, blockTag) {
  return readMtmPnl(
    'mainnet',
    mainnetView,
    MAINNET_WALLET_ADDRESS,
    MAINNET_MTM_LISTED_TOKENS,
    MAINNET_MTM_TARGETS,
    MAINNET_MTM_USDC_TARGET,
    blockTag
  );
}

/** Mark-to-market PnL for Base PropAMM, VT, and mainnet PropAMM wallets. */
export async function fetchMtmSnapshot(bearerToken, basePropAmmWalletAddress) {
  const baseProvider = getProvider(bearerToken);
  const mainnetProvider = getMainnetProvider(bearerToken);
  const baseView = getBaseCircuitBreakerViewOnlyContract(baseProvider);
  const mainnetView = getMainnetCircuitBreakerViewOnlyContract(mainnetProvider);

  const { blockNumber: baseBlockNow, timestamp: baseTimestampNow } =
    await getBaseBlockInfo(baseProvider);

  const baseOneHour = mtmHoursAgoBlock(
    baseBlockNow,
    baseTimestampNow,
    1,
    FIRST_BLOCK
  );
  const baseTwentyFourHours = mtmHoursAgoBlock(
    baseBlockNow,
    baseTimestampNow,
    24,
    FIRST_BLOCK
  );
  const baseSinceJune18 = mtmBaseBlockAtTimestamp(
    baseBlockNow,
    baseTimestampNow,
    MTM_JUNE_18_UTC_UNIX,
    FIRST_BLOCK
  );

  const [
    mainnetBlockNow,
    mainnetBlock1h,
    mainnetBlock24h,
    mainnetBlockSinceJune18
  ] = await Promise.all([
    getMainnetBlockAtBaseBlock(baseProvider, baseBlockNow),
    baseOneHour.hasFullData
      ? getMainnetBlockAtBaseBlock(baseProvider, baseOneHour.block)
      : Promise.resolve(null),
    baseTwentyFourHours.hasFullData
      ? getMainnetBlockAtBaseBlock(baseProvider, baseTwentyFourHours.block)
      : Promise.resolve(null),
    baseSinceJune18.hasFullData
      ? getMainnetBlockAtBaseBlock(baseProvider, baseSinceJune18.block)
      : Promise.resolve(null)
  ]);

  const mainnetOneHour = {
    block: mainnetBlock1h,
    hasFullData: baseOneHour.hasFullData && mainnetBlock1h != null
  };
  const mainnetTwentyFourHours = {
    block: mainnetBlock24h,
    hasFullData: baseTwentyFourHours.hasFullData && mainnetBlock24h != null
  };
  const mainnetSinceJune18 = {
    block: mainnetBlockSinceJune18,
    hasFullData: baseSinceJune18.hasFullData && mainnetBlockSinceJune18 != null
  };

  const [
    propAmmNow,
    propAmm1h,
    propAmm24h,
    propAmmSinceJune18,
    vtNow,
    vt1h,
    vt24h,
    vtSinceJune18,
    mainnetNow,
    mainnet1h,
    mainnet24h,
    mainnetSinceJune18Pnl,
    feesNow,
    fees1h,
    fees24h,
    feesSinceJune18
  ] = await Promise.all([
    readPropAmmMtmAtBlock('base', baseView, basePropAmmWalletAddress, baseBlockNow),
    baseOneHour.hasFullData
      ? readPropAmmMtmAtBlock('base', baseView, basePropAmmWalletAddress, baseOneHour.block)
      : Promise.resolve(null),
    baseTwentyFourHours.hasFullData
      ? readPropAmmMtmAtBlock('base', baseView, basePropAmmWalletAddress, baseTwentyFourHours.block)
      : Promise.resolve(null),
    baseSinceJune18.hasFullData
      ? readPropAmmMtmAtBlock('base', baseView, basePropAmmWalletAddress, baseSinceJune18.block)
      : Promise.resolve(null),
    readVtMtmAtBlock(baseView, baseBlockNow),
    baseOneHour.hasFullData
      ? readVtMtmAtBlock(baseView, baseOneHour.block)
      : Promise.resolve(null),
    baseTwentyFourHours.hasFullData
      ? readVtMtmAtBlock(baseView, baseTwentyFourHours.block)
      : Promise.resolve(null),
    baseSinceJune18.hasFullData
      ? readVtMtmAtBlock(baseView, baseSinceJune18.block)
      : Promise.resolve(null),
    readMainnetMtmAtBlock(mainnetView, mainnetBlockNow),
    mainnetOneHour.hasFullData
      ? readMainnetMtmAtBlock(mainnetView, mainnetOneHour.block)
      : Promise.resolve(null),
    mainnetTwentyFourHours.hasFullData
      ? readMainnetMtmAtBlock(mainnetView, mainnetTwentyFourHours.block)
      : Promise.resolve(null),
    mainnetSinceJune18.hasFullData
      ? readMainnetMtmAtBlock(mainnetView, mainnetSinceJune18.block)
      : Promise.resolve(null),
    fetchProtocolFeesSinceJune(baseProvider, baseBlockNow),
    baseOneHour.hasFullData
      ? fetchProtocolFeesSinceJune(baseProvider, baseOneHour.block)
      : Promise.resolve(null),
    baseTwentyFourHours.hasFullData
      ? fetchProtocolFeesSinceJune(baseProvider, baseTwentyFourHours.block)
      : Promise.resolve(null),
    baseSinceJune18.hasFullData
      ? fetchProtocolFeesSinceJune(baseProvider, baseSinceJune18.block)
      : Promise.resolve(null)
  ]);

  const propAmmAdjustedNow =
    propAmmNow != null ? propAmmNow - feesNow : null;
  const propAmmAdjusted1h =
    propAmm1h != null && fees1h != null ? propAmm1h - fees1h : null;
  const propAmmAdjusted24h =
    propAmm24h != null && fees24h != null ? propAmm24h - fees24h : null;
  const propAmmAdjustedSinceJune18 =
    propAmmSinceJune18 != null && feesSinceJune18 != null
      ? propAmmSinceJune18 - feesSinceJune18
      : null;

  return {
    propAmm: {
      value: propAmmAdjustedNow,
      change1h: mtmPeriodChange(
        propAmmAdjustedNow,
        propAmmAdjusted1h,
        baseOneHour.hasFullData
      ),
      change24h: mtmPeriodChange(
        propAmmAdjustedNow,
        propAmmAdjusted24h,
        baseTwentyFourHours.hasFullData
      ),
      changeSinceJune18: mtmPeriodChange(
        propAmmAdjustedNow,
        propAmmAdjustedSinceJune18,
        baseSinceJune18.hasFullData
      )
    },
    vt: {
      value: vtNow,
      change1h: mtmPeriodChange(vtNow, vt1h, baseOneHour.hasFullData),
      change24h: mtmPeriodChange(vtNow, vt24h, baseTwentyFourHours.hasFullData),
      changeSinceJune18: mtmPeriodChange(
        vtNow,
        vtSinceJune18,
        baseSinceJune18.hasFullData
      )
    },
    mainnet: {
      value: mainnetNow,
      change1h: mtmPeriodChange(mainnetNow, mainnet1h, mainnetOneHour.hasFullData),
      change24h: mtmPeriodChange(
        mainnetNow,
        mainnet24h,
        mainnetTwentyFourHours.hasFullData
      ),
      changeSinceJune18: mtmPeriodChange(
        mainnetNow,
        mainnetSinceJune18Pnl,
        mainnetSinceJune18.hasFullData
      )
    }
  };
}

/** Hourly total MTM deltas for the last 24h (25 snapshots → 24 hour-over-hour changes). */
export async function fetchMtmHourlySeries(bearerToken, basePropAmmWalletAddress) {
  const baseProvider = getProvider(bearerToken);
  const mainnetProvider = getMainnetProvider(bearerToken);
  const baseView = getBaseCircuitBreakerViewOnlyContract(baseProvider);
  const mainnetView = getMainnetCircuitBreakerViewOnlyContract(mainnetProvider);

  const { blockNumber: baseBlockNow, timestamp: baseTimestampNow } =
    await getBaseBlockInfo(baseProvider);

  const hourSnapshots = Array.from({ length: 25 }, (_, i) => {
    const hoursAgo = 24 - i;
    if (hoursAgo === 0) {
      return { block: baseBlockNow, hasFullData: true };
    }
    return mtmHoursAgoBlock(
      baseBlockNow,
      baseTimestampNow,
      hoursAgo,
      FIRST_BLOCK
    );
  });

  const mainnetBlocks = await Promise.all(
    hourSnapshots.map((snap) =>
      snap.hasFullData
        ? getMainnetBlockAtBaseBlock(baseProvider, snap.block)
        : Promise.resolve(null)
    )
  );

  const snapshots = await Promise.all(
    hourSnapshots.map(async (snap, idx) => {
      if (!snap.hasFullData || mainnetBlocks[idx] == null) return null;

      const [propAmm, vt, mainnet, fees] = await Promise.all([
        readPropAmmMtmAtBlock(
          'base',
          baseView,
          basePropAmmWalletAddress,
          snap.block
        ),
        readVtMtmAtBlock(baseView, snap.block),
        readMainnetMtmAtBlock(mainnetView, mainnetBlocks[idx]),
        fetchProtocolFeesSinceJune(baseProvider, snap.block)
      ]);

      const propAmmAdjusted =
        propAmm != null && fees != null ? propAmm - fees : null;

      if (propAmmAdjusted == null || vt == null || mainnet == null) {
        return null;
      }

      return {
        propAmm: propAmmAdjusted,
        vt,
        mainnet,
        total: propAmmAdjusted + vt + mainnet
      };
    })
  );

  return Array.from({ length: 24 }, (_, i) => {
    const prev = snapshots[i];
    const next = snapshots[i + 1];
    const delta = (a, b) =>
      a != null && b != null ? b - a : null;

    return {
      slot: i,
      label:
        i === 23
          ? '1h ago → now: Δ MTM vs previous hour'
          : `${24 - i}h → ${24 - i - 1}h ago: Δ MTM vs previous hour`,
      mtm: delta(prev?.total, next?.total),
      propAmm: delta(prev?.propAmm, next?.propAmm),
      vt: delta(prev?.vt, next?.vt),
      mainnet: delta(prev?.mainnet, next?.mainnet)
    };
  });
}

/** USD value for VT wallet via CircuitBreakerViewOnly.getWalletValue (Base). */
export async function fetchVtWalletValue(provider) {
  const contract = getWalletValueViewContract(provider);
  const result = await contract.getWalletValue(
    VT_WALLET_ADDRESS,
    VT_WALLET_LISTED_TOKENS
  );
  return Number(result.toString());
}

export function getMainnetWalletValueViewContract(provider) {
  return new ethers.Contract(
    MAINNET_WALLET_VALUE_VIEW_CONTRACT_ADDRESS,
    WALLET_VALUE_VIEW_CONTRACT_ABI,
    provider
  );
}

export function getMainnetCircuitBreakerContract(provider) {
  return new ethers.Contract(
    MAINNET_CIRCUIT_BREAKER_ADDRESS,
    CIRCUIT_BREAKER_ABI,
    provider
  );
}

export function getMainnetTargetBalanceContract(provider) {
  return new ethers.Contract(
    MAINNET_TARGET_BALANCE_CONTRACT_ADDRESS,
    TARGET_BALANCE_CONTRACT_ABI,
    provider
  );
}

/** Balances vs targets for a wallet and token set. */
export async function fetchTokenBalancesSnapshot(
  provider,
  walletAddress,
  tokens,
  tokenDecimals,
  targetBalanceContract
) {
  const balanceData = {};

  for (const [tokenName, tokenAddress] of Object.entries(tokens)) {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balance, targetBalance] = await Promise.all([
        tokenContract.balanceOf(walletAddress).catch(() => 0n),
        targetBalanceContract.tokenTargetBalance(tokenAddress).catch(() => 0n)
      ]);

      const decimals = tokenDecimals[tokenName];
      const divisor = 10n ** BigInt(decimals);
      const balanceBigInt =
        typeof balance === 'bigint' ? balance : BigInt(balance.toString());
      const targetBigInt =
        typeof targetBalance === 'bigint'
          ? targetBalance
          : BigInt(targetBalance.toString());

      const balanceNumber = Number(balanceBigInt) / Number(divisor);
      const targetNumber = Number(targetBigInt) / Number(divisor);
      const percentage = targetNumber > 0 ? (balanceNumber / targetNumber) * 100 : 0;

      balanceData[tokenName] = {
        balance: balanceNumber,
        target: targetNumber,
        percentage
      };
    } catch (error) {
      console.error(`Error fetching balance for ${tokenName}:`, error);
      balanceData[tokenName] = {
        balance: 0,
        target: 0,
        percentage: 0
      };
    }
  }

  return balanceData;
}

/** Base PropAMM balances, targets, and rebalance offsets (non-USDC tokens). */
export async function fetchBasePropAmmTokenBalances(provider, walletAddress) {
  const balanceData = await fetchTokenBalancesSnapshot(
    provider,
    walletAddress,
    TOKENS,
    TOKEN_DECIMALS,
    getTargetBalanceContract(provider)
  );

  const block = await provider.getBlock('latest');
  const currTime = block.timestamp;
  const rebalancer = getRebalancerContract(provider);

  await Promise.all(
    REBALANCE_OFFSET_TOKEN_KEYS.map(async (tokenName) => {
      try {
        const raw = await rebalancer.getVirtualBalance(TOKENS[tokenName], currTime);
        const rawBigInt =
          typeof raw === 'bigint' ? raw : BigInt(raw.toString());
        const divisor = 10n ** BigInt(TOKEN_DECIMALS[tokenName]);
        balanceData[tokenName].rebalanceOffset =
          Number(rawBigInt) / Number(divisor);
      } catch (error) {
        console.warn(`Rebalance offset fetch failed for ${tokenName}:`, error);
        balanceData[tokenName].rebalanceOffset = null;
      }
    })
  );

  return balanceData;
}

/** Mainnet PropAMM wallet balances vs targets on Ethereum mainnet. */
export async function fetchMainnetTokenBalances(bearerToken) {
  const provider = getMainnetProvider(bearerToken);
  return fetchTokenBalancesSnapshot(
    provider,
    MAINNET_WALLET_ADDRESS,
    MAINNET_BALANCE_TOKENS,
    MAINNET_TOKEN_DECIMALS,
    getMainnetTargetBalanceContract(provider)
  );
}

/** VT wallet on-chain balances (Base); targets are derived from PropAMM rows. */
export async function fetchVtWalletBalances(provider) {
  const balances = {};

  for (const [tokenName, tokenAddress] of Object.entries(VT_BALANCE_TOKENS)) {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await tokenContract.balanceOf(VT_WALLET_ADDRESS).catch(() => 0n);
    const decimals = TOKEN_DECIMALS[tokenName];
    const divisor = 10n ** BigInt(decimals);
    const balanceBigInt =
      typeof balance === 'bigint' ? balance : BigInt(balance.toString());
    balances[tokenName] = Number(balanceBigInt) / Number(divisor);
  }

  return balances;
}

function tokenBalanceEntry(balance, target) {
  return {
    balance,
    target,
    percentage: target > 0 ? (balance / target) * 100 : 0
  };
}

export const VT_FIXED_TARGETS = {
  weth: 50,
  cbbtc: 1.1,
  virtual: 4744,
  usdc: 0
};

function vtTokenBalanceEntry(balance, desiredBalance, fixedTarget) {
  return {
    balance,
    desiredBalance,
    fixedTarget,
    target: desiredBalance,
    percentage: desiredBalance > 0 ? (balance / desiredBalance) * 100 : 0
  };
}

/** VT wallet targets from Base + Mainnet PropAMM balances and targets. */
export function buildVtTokenBalancesSnapshot(
  baseBalances,
  mainnetBalances,
  vtBalances,
  vtUsdcBalance
) {
  const wethTarget =
    50 +
    baseBalances.weth.target +
    mainnetBalances.weth.target -
    baseBalances.weth.balance -
    mainnetBalances.weth.balance;

  const cbbtcTarget =
    1.1 +
    baseBalances.cbbtc.target +
    mainnetBalances.wbtc.target -
    baseBalances.cbbtc.balance -
    mainnetBalances.wbtc.balance;

  const virtualTarget =
    4744 + baseBalances.virtual.target - baseBalances.virtual.balance;

  return {
    weth: vtTokenBalanceEntry(vtBalances.weth, wethTarget, VT_FIXED_TARGETS.weth),
    cbbtc: vtTokenBalanceEntry(vtBalances.cbbtc, cbbtcTarget, VT_FIXED_TARGETS.cbbtc),
    virtual: vtTokenBalanceEntry(
      vtBalances.virtual,
      virtualTarget,
      VT_FIXED_TARGETS.virtual
    ),
    usdc: vtTokenBalanceEntry(vtUsdcBalance, 0, VT_FIXED_TARGETS.usdc)
  };
}

/** VT wallet USDC balance on Base (included in Global row; target fixed at 0). */
export async function fetchVtWalletUsdcBalance(provider) {
  const tokenContract = new ethers.Contract(TOKENS.usdc, ERC20_ABI, provider);
  const balance = await tokenContract.balanceOf(VT_WALLET_ADDRESS).catch(() => 0n);
  const balanceBigInt =
    typeof balance === 'bigint' ? balance : BigInt(balance.toString());
  return Number(balanceBigInt) / Number(USDC_DIVISOR);
}

/** Global row: summed balances; targets from Base + Mainnet constants (excludes VT). */
export function buildGlobalTokenBalancesSnapshot(
  baseBalances,
  mainnetBalances,
  vtBalances
) {
  const wethBalance =
    baseBalances.weth.balance +
    mainnetBalances.weth.balance +
    vtBalances.weth.balance;
  const wethTarget =
    baseBalances.weth.target + mainnetBalances.weth.target + 50;

  const btcBalance =
    baseBalances.cbbtc.balance +
    mainnetBalances.wbtc.balance +
    vtBalances.cbbtc.balance;
  const btcTarget =
    1.1 + baseBalances.cbbtc.target + mainnetBalances.wbtc.target;

  const virtualBalance = baseBalances.virtual.balance + vtBalances.virtual.balance;
  const virtualTarget = baseBalances.virtual.target + 4744;

  const usdcBalance =
    baseBalances.usdc.balance + mainnetBalances.usdc.balance + vtBalances.usdc.balance;

  return {
    weth: tokenBalanceEntry(wethBalance, wethTarget),
    cbbtc: tokenBalanceEntry(btcBalance, btcTarget),
    virtual: tokenBalanceEntry(virtualBalance, virtualTarget),
    usdc: tokenBalanceEntry(usdcBalance, 0)
  };
}

/** Mainnet wallet USD value + circuit breaker min USD threshold. */
export async function fetchMainnetWalletValue(bearerToken) {
  const provider = getMainnetProvider(bearerToken);
  const viewContract = getMainnetWalletValueViewContract(provider);
  const circuitBreaker = getMainnetCircuitBreakerContract(provider);
  const [valueRaw, minUsdRaw] = await Promise.all([
    viewContract.getWalletValue(
      MAINNET_WALLET_ADDRESS,
      MAINNET_WALLET_LISTED_TOKENS
    ),
    circuitBreaker.minUSDValue()
  ]);
  return {
    current: Number(valueRaw.toString()),
    minUSDValue: Number(minUsdRaw.toString())
  };
}

export function getPnLContract(provider, blockNumber = null) {
  // No block: assume current head deployment
  if (blockNumber == null) {
    return new ethers.Contract(
      PNL_CONTRACT_ADDRESS_LATEST,
      PNL_CONTRACT_ABI,
      provider
    );
  }
  const n = typeof blockNumber === 'bigint' ? Number(blockNumber) : blockNumber;
  let contractAddress;
  if (n <= PNL_CONTRACT_FIRST_ERA_END_BLOCK) {
    contractAddress = PNL_CONTRACT_ADDRESS_EARLIEST;
  } else if (n < PNL_CONTRACT_BLOCK_THRESHOLD) {
    contractAddress = PNL_CONTRACT_ADDRESS_OLD;
  } else if (n < PNL_CONTRACT_LATEST_BLOCK_THRESHOLD) {
    contractAddress = PNL_CONTRACT_ADDRESS_NEW;
  } else {
    contractAddress = PNL_CONTRACT_ADDRESS_LATEST;
  }
  return new ethers.Contract(contractAddress, PNL_CONTRACT_ABI, provider);
}

export const SANITY_PNL_ADDRESS =
  '0xAe5a436533ED3019B12D92A443865b8912629324';

export function getSanityPnlContract(provider) {
  return new ethers.Contract(SANITY_PNL_ADDRESS, sanityPnlAbi, provider);
}

export const PROTOCOL_FEES_ADDRESS =
  '0xE83FaC17F899c899Ef847D70a4B6eCE978CC358D';

export const PROTOCOL_FEES_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'fees',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

/** Tokens tracked by the protocol fees contract */
export const PROTOCOL_FEE_TOKEN_KEYS = ['weth', 'usdc', 'cbbtc', 'virtual'];

export function getProtocolFeesContract(provider) {
  return new ethers.Contract(
    PROTOCOL_FEES_ADDRESS,
    PROTOCOL_FEES_ABI,
    provider
  );
}

const PROTOCOL_FEES_USD_SCALE = 1e36;

/** Sum of protocol fees since June 1st, in USD (already ÷ 1e36). */
export async function fetchProtocolFeesSinceJune(provider, currentBlock) {
  const feesContract = getProtocolFeesContract(provider);
  const sanityContract = getSanityPnlContract(provider);

  const readFees = async (tokenAddress, blockTag, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await feesContract.fees(tokenAddress, { blockTag });
        return BigInt(result.toString());
      } catch (error) {
        if (attempt === retries) {
          console.warn(
            `Protocol fees call reverted at block ${blockTag} after ${retries} attempts`
          );
          return 0n;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
      }
    }
    return 0n;
  };

  const juneBaselineBlock =
    currentBlock >= PNL_JUNE_START_BLOCK ? PNL_JUNE_START_BLOCK : null;

  let totalUsdRaw = 0n;

  for (const tokenKey of PROTOCOL_FEE_TOKEN_KEYS) {
    const tokenAddress = TOKENS[tokenKey];
    const [feesCurrent, feesJuneStart] = await Promise.all([
      readFees(tokenAddress, currentBlock),
      juneBaselineBlock != null
        ? readFees(tokenAddress, juneBaselineBlock)
        : Promise.resolve(0n)
    ]);

    const feeDeltaWei = feesCurrent - feesJuneStart;

    try {
      const usdResult = await sanityContract.getUSDValue(tokenAddress, feeDeltaWei, {
        blockTag: currentBlock
      });
      totalUsdRaw += BigInt(usdResult.toString());
    } catch (error) {
      console.warn(`getUSDValue failed for ${tokenKey}:`, error);
    }
  }

  return Number(totalUsdRaw) / PROTOCOL_FEES_USD_SCALE;
}

export const ETH_DISTRIBUTOR_ADDRESS =
  '0x28FA46d660342e396DEDb6A8d41E835e36884570';

export const ETH_DISTRIBUTOR_ABI = [
  {
    inputs: [],
    name: 'totalSpent',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export function getEthDistributorContract(provider) {
  return new ethers.Contract(
    ETH_DISTRIBUTOR_ADDRESS,
    ETH_DISTRIBUTOR_ABI,
    provider
  );
}

/** Cumulative ETH spent by the gas distributor contract (wei → ETH). */
export async function fetchGasExpensesTotalSpent(provider) {
  const contract = getEthDistributorContract(provider);
  const result = await contract.totalSpent();
  return Number(ethers.formatUnits(BigInt(result.toString()), 18));
}

export const SLIPPAGE_STEPS_CONTRACT_ADDRESS =
  '0x3F1aa1C608544e4DE647F0aFE90e471edB239A74';

export const SLIPPAGE_STEPS_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'getSlippageTokenData',
    outputs: [
      {
        components: [
          { internalType: 'uint256[5]', name: 'xQuote', type: 'uint256[5]' },
          { internalType: 'uint256[5]', name: 'yQuote', type: 'uint256[5]' },
          { internalType: 'uint256[5]', name: 'xBase', type: 'uint256[5]' },
          { internalType: 'uint256[5]', name: 'yBase', type: 'uint256[5]' },
          { internalType: 'uint256', name: 'timeSlippageSlope', type: 'uint256' }
        ],
        internalType: 'struct SlippageTokenData',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export function getSlippageStepsContract(provider) {
  return new ethers.Contract(
    SLIPPAGE_STEPS_CONTRACT_ADDRESS,
    SLIPPAGE_STEPS_ABI,
    provider
  );
}

export const MEXICAN_PRICER_KYBER_ADDRESS =
  '0x2C4B2Eb2242D81DBe66a9a63a9f80fc6d272a33b';
export const MEXICAN_PRICER_ZEROX_ADDRESS =
  '0x6c47cFfa780603E8930D1dBcc5D0c98fd576859e';
export const MEXICAN_PRICER_OKX_ADDRESS =
  '0x29ce0351EE32982007CDFF41702C4eABf408EBFb';

/** MexicanPricerV6 — ABI for configuration widget (full contract; decode uses JSON). */
export const MEXICAN_PRICER_ABI = mexicanPricerV6Abi;

export function getMexicanPricerContract(provider, address) {
  return new ethers.Contract(address, MEXICAN_PRICER_ABI, provider);
}

/** Tokens on configuration page: steps + imbalance curve (subset of TOKENS) */
export const CONFIGURATION_TOKEN_KEYS = ['weth', 'cbbtc', 'virtual'];

// ERC20 ABI for balanceOf
export const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Format volume from wei to human-readable USDC
export function formatVolume(volumeWei) {
  if (!volumeWei || volumeWei === '0' || volumeWei === 0) return '0.00';
  const volumeBigInt = BigInt(volumeWei.toString());
  const volumeNumber = Number(volumeBigInt) / Number(USDC_DIVISOR);
  return volumeNumber.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
