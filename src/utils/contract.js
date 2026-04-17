import { ethers } from 'ethers';

// Contract configuration
export const CONTRACT_ADDRESS = '0xA05dE8fedaF5d47a6A8726811cC5f387BEf1F816';
// Base RPC endpoint - Infura
// Uses environment variable if available, otherwise falls back to default
export const BASE_RPC_URL = import.meta.env.VITE_INFURA_URL || 'https://base-mainnet.infura.io/v3/0ec938da607340d3bf91f8b60306f147';
export const FIRST_BLOCK = 42784272;
export const BLOCK_TIME_SECONDS = 2;
/** FIRST_BLOCK + 31 days, assuming exactly 2 seconds per block */
export const PNL_ANCHOR_BLOCK =
  FIRST_BLOCK + (31 * 24 * 3600) / BLOCK_TIME_SECONDS;

// Contract ABI - volume, getWalletValue, wallet, and minUSDValue functions
export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'dexAggregator', type: 'address' },
      { internalType: 'address', name: 'token', type: 'address' }
    ],
    name: 'volume',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getWalletValue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'wallet',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'minUSDValue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

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

// PnL contract addresses
export const PNL_CONTRACT_ADDRESS_OLD = '0xeE1C69BCAfb34b13cCEA4137ba056a87255bBFd2';
export const PNL_CONTRACT_ADDRESS_NEW = '0x64CdcC66a9943862bd4E3B608016A71bC9Ab860B';
export const PNL_CONTRACT_BLOCK_THRESHOLD = 44691628;

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
  permissionless: '0xd35C6717cCa1E04696B694DCb1643Ac3620D2152'
};

export const AGGREGATOR_DISPLAY_NAMES = {
  kyberSwap: 'Kyber Swap',
  kyberSwapNew: 'kyber swap new',
  spyros: 'normal 0x',
  router0x: 'router 0x',
  intent0x: 'intent 0x',
  okx: 'okx',
  permissionless: 'permissionless'
};

// USDC has 6 decimals, so divide by 1e6 to get human-readable number
export const USDC_DECIMALS = 6;
export const USDC_DIVISOR = 10n ** BigInt(USDC_DECIMALS);

// Initialize provider and contract
export function getProvider() {
  return new ethers.JsonRpcProvider(BASE_RPC_URL);
}

export function getContract(provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export function getTargetBalanceContract(provider) {
  return new ethers.Contract(TARGET_BALANCE_CONTRACT_ADDRESS, TARGET_BALANCE_CONTRACT_ABI, provider);
}

export function getPnLContract(provider, blockNumber = null) {
  // If blockNumber is provided and >= threshold, use new contract, otherwise use old contract
  const contractAddress = (blockNumber !== null && blockNumber >= PNL_CONTRACT_BLOCK_THRESHOLD) 
    ? PNL_CONTRACT_ADDRESS_NEW 
    : PNL_CONTRACT_ADDRESS_OLD;
  return new ethers.Contract(contractAddress, PNL_CONTRACT_ABI, provider);
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
  '0x7FA55857511ddE798deA42FF64F2EE82dF7f7988';
export const MEXICAN_PRICER_ZEROX_ADDRESS =
  '0x015D847e2e77F2998eaA73013dE554B57935F729';

/** Minimal ABI for configuration page (config + odds) */
export const MEXICAN_PRICER_ABI = [
  {
    inputs: [],
    name: 'config',
    outputs: [
      { internalType: 'uint64', name: 'avgNormalP', type: 'uint64' },
      { internalType: 'uint64', name: 'stdNormalP', type: 'uint64' },
      { internalType: 'uint64', name: 'gasPenaltySlope', type: 'uint64' },
      { internalType: 'uint64', name: 'fixedFee', type: 'uint64' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'oddsForYes',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'oddsForNo',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

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
