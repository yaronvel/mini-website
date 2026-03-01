import { FIRST_BLOCK, BLOCK_TIME_SECONDS } from './contract.js';

/**
 * Calculate block numbers for different time periods
 * @param {number} currentBlock - Current block number
 * @param {number} currentTimestamp - Current block timestamp
 * @returns {Object} Object with block numbers and time period info
 */
export function calculateBlockNumbers(currentBlock, currentTimestamp) {
  const blocksPerHour = 3600 / BLOCK_TIME_SECONDS; // 1800 blocks per hour
  
  // Calculate blocks since first block
  const blocksSinceFirst = currentBlock - FIRST_BLOCK;
  const secondsSinceFirst = blocksSinceFirst * BLOCK_TIME_SECONDS;
  const hoursSinceFirst = secondsSinceFirst / 3600;
  const daysSinceFirst = secondsSinceFirst / 86400;

  // For 1h stats: calculate the block that's 1 hour ago
  // If that's before the first block, we'll use first block but mark it differently
  const calculated1hAgo = currentBlock - blocksPerHour;
  const block1hAgo = Math.max(FIRST_BLOCK, calculated1hAgo);
  const hasFull1hData = calculated1hAgo >= FIRST_BLOCK;
  
  // For "24h" stats: always use first block as baseline (since contract doesn't exist longer)
  // This will show volume since contract deployment
  const block24hAgo = FIRST_BLOCK;

  return {
    current: currentBlock,
    oneHourAgo: block1hAgo,
    twentyFourHoursAgo: block24hAgo, // Always first block
    first: FIRST_BLOCK,
    hasFull1hData: hasFull1hData,
    timeSinceFirst: {
      seconds: secondsSinceFirst,
      hours: hoursSinceFirst,
      days: daysSinceFirst
    }
  };
}

/**
 * Get current block number and timestamp from provider
 * @param {ethers.Provider} provider - Ethers provider
 * @returns {Promise<Object>} Object with block number and timestamp
 */
export async function getCurrentBlockInfo(provider) {
  const blockNumber = await provider.getBlockNumber();
  // Direct RPC call to get block with timestamp
  try {
    const block = await provider.send('eth_getBlockByNumber', [`0x${blockNumber.toString(16)}`, false]);
    if (block && block.timestamp) {
      const timestamp = parseInt(block.timestamp, 16);
      return {
        blockNumber,
        timestamp: timestamp
      };
    }
  } catch (error) {
    console.error('Error getting block via RPC:', error);
  }
  // Fallback: try getBlock method
  try {
    const block = await provider.getBlock(blockNumber);
    return {
      blockNumber,
      timestamp: Number(block.timestamp)
    };
  } catch (error) {
    console.error('Error getting block:', error);
    return {
      blockNumber,
      timestamp: null
    };
  }
}
