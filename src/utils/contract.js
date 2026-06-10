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
export const TARGET_BALANCE_CONTRACT_ADDRESS = '0xe00B0150bA21625353b69d82b3ec28a9A744B0C7';

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
  liquidMesh: '0xf5ae73ca5ed58a30886b88e74d0ba1931d315a8c'
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
  liquidMesh: 'LiquidMesh'
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

export function getContract(provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export function getTargetBalanceContract(provider) {
  return new ethers.Contract(TARGET_BALANCE_CONTRACT_ADDRESS, TARGET_BALANCE_CONTRACT_ABI, provider);
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
      const usdResult = await sanityContract.getUSDValue(
        tokenAddress,
        feeDeltaWei
      );
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
