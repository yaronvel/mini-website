import { ethers } from 'ethers';

// Contract configuration
export const CONTRACT_ADDRESS = '0xA05dE8fedaF5d47a6A8726811cC5f387BEf1F816';
// Base RPC endpoint - Infura
// Uses environment variable if available, otherwise falls back to default
export const BASE_RPC_URL = import.meta.env.VITE_INFURA_URL || 'https://base-mainnet.infura.io/v3/0ec938da607340d3bf91f8b60306f147';
export const FIRST_BLOCK = 42784272;
export const BLOCK_TIME_SECONDS = 2;

// Contract ABI - volume, getWalletValue, and wallet functions
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
  }
];

// Target balance contract ABI
export const TARGET_BALANCE_CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'tokenTargetBalance',
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
export const TARGET_BALANCE_CONTRACT_ADDRESS = '0x6d07A415B32c73362DC44c205B47485cCCfFdE4e';

// PnL contract address
export const PNL_CONTRACT_ADDRESS = '0xf4Eafd0f4210C173AbFdD291A8292E7079BeCd9F';

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
  zeroX: '0xdc5d8200A030798BC6227240f68b4dD9542686ef'
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

export function getPnLContract(provider) {
  return new ethers.Contract(PNL_CONTRACT_ADDRESS, PNL_CONTRACT_ABI, provider);
}

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
