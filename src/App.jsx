import { useState, useEffect } from 'react';
import { StatsTable } from './components/StatsTable';
import { 
  getProvider, 
  getContract, 
  TOKENS, 
  AGGREGATORS,
  USDC_DIVISOR 
} from './utils/contract';
import { calculateBlockNumbers, getCurrentBlockInfo } from './utils/blockUtils';
import './App.css';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBlock, setCurrentBlock] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchVolumeData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchVolumeData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchVolumeData() {
    try {
      // Only show loading on initial load, not on refresh
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      const provider = getProvider();
      const contract = getContract(provider);

      // Get current block info
      const blockInfo = await getCurrentBlockInfo(provider);
      setCurrentBlock(blockInfo.blockNumber);
      // Set timestamp - ensure it's a valid number
      if (blockInfo.timestamp && blockInfo.timestamp > 0) {
        setCurrentTimestamp(blockInfo.timestamp);
      } else {
        // If timestamp is missing, fetch it directly via RPC
        try {
          const block = await provider.send('eth_getBlockByNumber', [`0x${blockInfo.blockNumber.toString(16)}`, false]);
          if (block && block.timestamp) {
            setCurrentTimestamp(parseInt(block.timestamp, 16));
          }
        } catch (e) {
          console.error('Failed to get timestamp:', e);
        }
      }

      // Calculate block numbers
      const blocks = calculateBlockNumbers(blockInfo.blockNumber, blockInfo.timestamp);

      // Fetch volume data for all combinations
      const volumeData = {};

      for (const [tokenName, tokenAddress] of Object.entries(TOKENS)) {
        volumeData[tokenName] = {};

        for (const [aggName, aggAddress] of Object.entries(AGGREGATORS)) {
          // Read volume at different block heights with retry logic
          const readVolume = async (blockTag, retries = 3) => {
            for (let attempt = 1; attempt <= retries; attempt++) {
              try {
                const result = await contract.volume(aggAddress, tokenAddress, { blockTag });
                return result;
              } catch (error) {
                if (attempt === retries) {
                  // Final attempt failed, return 0 (no volume data at that block)
                  console.warn(`Volume call reverted at block ${blockTag} for ${tokenName}/${aggName} after ${retries} attempts`);
                  return 0n;
                }
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, attempt * 100));
              }
            }
            return 0n;
          };

          // Read volumes at all block heights
          const [volumeCurrent, volume1h, volumeFirst] = await Promise.all([
            readVolume(blocks.current),
            readVolume(blocks.oneHourAgo),
            readVolume(blocks.first)
          ]);

          // Convert to BigInt for calculations
          const currentBigInt = typeof volumeCurrent === 'bigint' ? volumeCurrent : BigInt(volumeCurrent.toString());
          const oneHourBigInt = typeof volume1h === 'bigint' ? volume1h : BigInt(volume1h.toString());
          const firstBigInt = typeof volumeFirst === 'bigint' ? volumeFirst : BigInt(volumeFirst.toString());

          // Calculate differences (volume in the time period)
          // For 1h: use 1h ago block if we have full 1h data, otherwise 0
          let oneHourVolume;
          if (blocks.hasFull1hData) {
            // More than 1h has passed, calculate volume from 1h ago to now
            oneHourVolume = currentBigInt - oneHourBigInt;
          } else {
            // Less than 1h has passed since first block, can't calculate 1h stats
            oneHourVolume = 0n;
          }
          
          // For "all time" stats: always use first block as baseline (shows volume since contract deployment)
          const twentyFourHoursVolume = currentBigInt - firstBigInt;

          volumeData[tokenName][aggName] = {
            oneHour: oneHourVolume.toString(),
            twentyFourHours: twentyFourHoursVolume.toString()
          };
        }
      }

      // Calculate aggregated statistics
      const perToken = {};
      const perAggregator = {
        kyberSwap: {},
        zeroX: {}
      };

      // Per token aggregation
      for (const tokenName of Object.keys(TOKENS)) {
        const kyber = volumeData[tokenName].kyberSwap || { oneHour: '0', twentyFourHours: '0' };
        const zeroX = volumeData[tokenName].zeroX || { oneHour: '0', twentyFourHours: '0' };

        perToken[tokenName] = {
          kyberSwap: {
            oneHour: kyber.oneHour,
            twentyFourHours: kyber.twentyFourHours
          },
          zeroX: {
            oneHour: zeroX.oneHour,
            twentyFourHours: zeroX.twentyFourHours
          }
        };
      }

      // Per aggregator aggregation
      for (const aggName of Object.keys(AGGREGATORS)) {
        for (const tokenName of Object.keys(TOKENS)) {
          const data = volumeData[tokenName][aggName] || { oneHour: '0', twentyFourHours: '0' };
          perAggregator[aggName][tokenName] = {
            oneHour: data.oneHour,
            twentyFourHours: data.twentyFourHours
          };
        }
      }

      // Overall totals
      let overall1h = 0n;
      let overall24h = 0n;

      for (const tokenName of Object.keys(TOKENS)) {
        for (const aggName of Object.keys(AGGREGATORS)) {
          const data = volumeData[tokenName][aggName];
          overall1h += BigInt(data.oneHour);
          overall24h += BigInt(data.twentyFourHours);
        }
      }

      // Only update stats when all data is loaded
      setStats({
        perToken,
        perAggregator,
        overall: {
          oneHour: overall1h.toString(),
          twentyFourHours: overall24h.toString()
        },
        timeSinceFirst: blocks.timeSinceFirst
      });

      setLoading(false);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error fetching volume data:', err);
      // Only show errors for critical failures (network, provider issues)
      // Contract call reverts are handled silently in readVolume
      if (err.code !== 'CALL_EXCEPTION') {
        setError(err.message || 'Failed to fetch volume data');
      } else {
        // For call exceptions, just log and continue (data might still be partially available)
        console.warn('Some contract calls failed, but continuing with available data');
      }
      setLoading(false);
    }
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Base Volume Statistics</h1>
        <div className="block-info">
          {currentBlock && (
            <p>Current Block: {currentBlock.toLocaleString()}</p>
          )}
          {currentTimestamp !== null && currentTimestamp !== undefined && currentTimestamp > 0 ? (
            <p>Timestamp: {new Date(currentTimestamp * 1000).toLocaleString()}</p>
          ) : currentBlock ? (
            <p>Timestamp: Loading...</p>
          ) : null}
        </div>
      </header>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={fetchVolumeData}>Retry</button>
        </div>
      )}

      <StatsTable stats={stats} loading={loading} />
    </div>
  );
}

export default App;
