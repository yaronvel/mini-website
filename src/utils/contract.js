import { ethers } from 'ethers';

// Contract configuration
export const CONTRACT_ADDRESS = '0xA05dE8fedaF5d47a6A8726811cC5f387BEf1F816';
// Base RPC endpoint - Infura
// Uses environment variable if available, otherwise falls back to default
export const BASE_RPC_URL = import.meta.env.VITE_INFURA_URL || 'https://base-mainnet.infura.io/v3/0ec938da607340d3bf91f8b60306f147';
export const FIRST_BLOCK = 42784272;
export const BLOCK_TIME_SECONDS = 2;

// Contract ABI - only the volume function
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
  }
];

// Token addresses
export const TOKENS = {
  weth: '0x4200000000000000000000000000000000000006',
  cbbtc: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  token3: '0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82'
};

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
