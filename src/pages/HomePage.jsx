import { useState, useEffect } from 'react';
import { StatsTable } from '../components/StatsTable';
import { PnlHourlyChart } from '../components/PnlHourlyChart';
import { 
  getProvider, 
  getContract, 
  getTargetBalanceContract,
  getPnLContract,
  getSanityPnlContract,
  fetchProtocolFeesSinceJune,
  fetchGasExpensesTotalSpent,
  fetchVtWalletValue,
  fetchMainnetWalletValue,
  fetchTokenBalancesSnapshot,
  fetchMainnetTokenBalances,
  fetchVtWalletBalances,
  buildVtTokenBalancesSnapshot,
  TOKENS, 
  TOKEN_DECIMALS,
  AGGREGATORS,
  USDC_DIVISOR,
  FIRST_BLOCK,
  PNL_ANCHOR_BLOCK,
  PNL_MAY_START_BLOCK,
  PNL_JUNE_START_BLOCK,
  BLOCK_TIME_SECONDS
} from '../utils/contract';
import { calculateBlockNumbers, getCurrentBlockInfo } from '../utils/blockUtils';
import { useRpcToken } from '../context/RpcTokenContext';
import '../App.css';

function tokenBalanceDisplayName(tokenName) {
  if (tokenName === 'virtual') return 'Virtual';
  if (tokenName === 'cbbtc') return 'CBBTC';
  if (tokenName === 'wbtc') return 'WBTC';
  return tokenName.toUpperCase();
}

function progressBarColor(percentage) {
  const p = percentage;
  if (p < 50) return '#ef4444';
  if (p < 100) return '#f59e0b';
  if (p >= 200) return '#064e3b';
  const t = (p - 100) / 100;
  const start = { r: 34, g: 197, b: 94 };
  const end = { r: 6, g: 78, b: 59 };
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function renderTokenBalanceCube(tokenName, data) {
  return (
    <div key={tokenName} className="token-balance-item">
      <div className="token-balance-header">
        <span className="token-balance-name">{tokenBalanceDisplayName(tokenName)}</span>
        <span className="token-balance-percentage">{data.percentage.toFixed(2)}%</span>
      </div>
      <div className="token-balance-details">
        <div className="token-balance-row">
          <span className="token-balance-label">Balance:</span>
          <span className="token-balance-value">
            {data.balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6
            })}
          </span>
        </div>
        <div className="token-balance-row">
          <span className="token-balance-label">Target:</span>
          <span className="token-balance-value">
            {data.target.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6
            })}
          </span>
        </div>
      </div>
      <div className="token-balance-progress-bar">
        <div
          className="token-balance-progress-fill"
          style={{
            width: `${Math.min(data.percentage, 100)}%`,
            backgroundColor: progressBarColor(data.percentage)
          }}
        ></div>
      </div>
    </div>
  );
}

const BASE_BALANCE_SLOT_KEYS = ['weth', 'cbbtc', 'virtual', 'usdc'];

/** Mainnet cubes align under Base columns: weth, cbbtc→wbtc, virtual hole, usdc. */
const MAINNET_BALANCE_SLOTS = [
  { column: 'weth', tokenKey: 'weth' },
  { column: 'cbbtc', tokenKey: 'wbtc' },
  { column: 'virtual', tokenKey: null },
  { column: 'usdc', tokenKey: 'usdc' }
];

/** VT row: weth, cbbtc, virtual aligned; USDC column empty. */
const VT_BALANCE_SLOTS = [
  { column: 'weth', tokenKey: 'weth' },
  { column: 'cbbtc', tokenKey: 'cbbtc' },
  { column: 'virtual', tokenKey: 'virtual' },
  { column: 'usdc', tokenKey: null }
];

function renderBaseBalanceRow(balanceData) {
  return BASE_BALANCE_SLOT_KEYS.map((tokenKey) =>
    renderTokenBalanceCube(tokenKey, balanceData[tokenKey])
  );
}

function renderMainnetBalanceRow(balanceData) {
  return MAINNET_BALANCE_SLOTS.map(({ column, tokenKey }) => {
    if (tokenKey === null) {
      return (
        <div
          key={column}
          className="token-balance-item token-balance-item--hole"
          aria-hidden="true"
        />
      );
    }
    return renderTokenBalanceCube(tokenKey, balanceData[tokenKey]);
  });
}

function renderVtBalanceRow(balanceData) {
  return VT_BALANCE_SLOTS.map(({ column, tokenKey }) => {
    if (tokenKey === null) {
      return (
        <div
          key={column}
          className="token-balance-item token-balance-item--hole"
          aria-hidden="true"
        />
      );
    }
    return renderTokenBalanceCube(tokenKey, balanceData[tokenKey]);
  });
}

export function HomePage() {
  const { bearerToken } = useRpcToken();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBlock, setCurrentBlock] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [walletValue, setWalletValue] = useState(null);
  const [tokenBalances, setTokenBalances] = useState(null);
  const [mainnetTokenBalances, setMainnetTokenBalances] = useState(null);
  const [vtTokenBalances, setVtTokenBalances] = useState(null);
  const [vtWalletValue, setVtWalletValue] = useState(null);
  const [mainnetWalletValue, setMainnetWalletValue] = useState(null);
  const [mainnetMinUSDValue, setMainnetMinUSDValue] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [sanityPnl, setSanityPnl] = useState(null);
  const [protocolFees, setProtocolFees] = useState(null);
  const [gasExpenses, setGasExpenses] = useState(null);
  const [firstBlockTimestamp, setFirstBlockTimestamp] = useState(null);
  const [minUSDValue, setMinUSDValue] = useState(null);

  useEffect(() => {
    if (!bearerToken) return;

    fetchVolumeData();
    
    // Refresh every 1 minute
    const interval = setInterval(fetchVolumeData, 60000);
    return () => clearInterval(interval);
  }, [bearerToken]);

  async function fetchVolumeData() {
    try {
      // Only show loading on initial load, not on refresh
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      const provider = getProvider(bearerToken);
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

      let feesSinceJune = 0;
      try {
        feesSinceJune = await fetchProtocolFeesSinceJune(
          provider,
          blocks.current
        );
        setProtocolFees({ sinceJuneStart: feesSinceJune });
      } catch (e) {
        console.warn('Protocol fees fetch failed:', e);
        setProtocolFees(null);
      }

      try {
        const totalSpentEth = await fetchGasExpensesTotalSpent(provider);
        setGasExpenses({ totalSpentEth });
      } catch (e) {
        console.warn('Gas expenses fetch failed:', e);
        setGasExpenses(null);
      }

      // Fetch wallet value at different block heights
      const readWalletValue = async (blockTag, retries = 3) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const result = await contract.getWalletValue({ blockTag });
            return result;
          } catch (error) {
            if (attempt === retries) {
              console.warn(`getWalletValue call reverted at block ${blockTag} after ${retries} attempts`);
              return 0n;
            }
            await new Promise(resolve => setTimeout(resolve, attempt * 100));
          }
        }
        return 0n;
      };

      const [walletValueCurrent, walletValue1h, walletValue24h, minUSDValueRaw] = await Promise.all([
        readWalletValue(blocks.current),
        readWalletValue(blocks.oneHourAgo),
        readWalletValue(blocks.twentyFourHoursAgo),
        // minUSDValue is a simple view function, no blockTag needed
        contract.minUSDValue().catch((error) => {
          console.warn('Error fetching minUSDValue:', error);
          return 0n;
        })
      ]);

      // Convert to numbers (already in USD, not wei) - minUSDValue also has no decimals
      const currentValue = Number(walletValueCurrent.toString());
      const value1h = Number(walletValue1h.toString());
      const value24h = Number(walletValue24h.toString());
      const minUSDValueNumber = Number(minUSDValueRaw.toString());

      // Calculate changes
      const change1h = blocks.hasFull1hData ? currentValue - value1h : null;
      // For 24h: use 24h ago block if we have full 24h data, otherwise use first block
      let change24h;
      if (blocks.hasFull24hData) {
        change24h = currentValue - value24h;
      } else {
        // Less than 24h has passed, use first block as baseline
        const walletValueFirst = await readWalletValue(blocks.first);
        const valueFirst = Number(walletValueFirst.toString());
        change24h = currentValue - valueFirst;
      }

      setWalletValue({
        current: currentValue,
        change1h: change1h,
        change24h: change24h
      });

      setMinUSDValue(minUSDValueNumber);

      // Get wallet address
      let walletAddress;
      try {
        walletAddress = await contract.wallet();
        console.log('Wallet address retrieved:', walletAddress);
      } catch (error) {
        console.error('Error getting wallet address:', error);
        throw error;
      }
      
      // Get target balance contract
      const targetBalanceContract = getTargetBalanceContract(provider);
      
      // Fetch token balances and target balances (Base PropAMM)
      const balanceData = await fetchTokenBalancesSnapshot(
        provider,
        walletAddress,
        TOKENS,
        TOKEN_DECIMALS,
        targetBalanceContract
      );
      setTokenBalances(balanceData);

      let mainnetBalancesData = null;
      try {
        mainnetBalancesData = await fetchMainnetTokenBalances(bearerToken);
        setMainnetTokenBalances(mainnetBalancesData);
      } catch (e) {
        console.warn('Mainnet token balances fetch failed:', e);
        setMainnetTokenBalances(null);
      }

      try {
        if (mainnetBalancesData) {
          const vtBalances = await fetchVtWalletBalances(provider);
          setVtTokenBalances(
            buildVtTokenBalancesSnapshot(
              balanceData,
              mainnetBalancesData,
              vtBalances
            )
          );
        } else {
          setVtTokenBalances(null);
        }
      } catch (e) {
        console.warn('VT wallet token balances fetch failed:', e);
        setVtTokenBalances(null);
      }

      try {
        const vtValue = await fetchVtWalletValue(provider);
        setVtWalletValue(vtValue);
      } catch (e) {
        console.warn('VT wallet value fetch failed:', e);
        setVtWalletValue(null);
      }

      try {
        const mainnetSnapshot = await fetchMainnetWalletValue(bearerToken);
        setMainnetWalletValue(mainnetSnapshot.current);
        setMainnetMinUSDValue(mainnetSnapshot.minUSDValue);
      } catch (e) {
        console.warn('Mainnet wallet value fetch failed:', e);
        setMainnetWalletValue(null);
        setMainnetMinUSDValue(null);
      }

      // First block timestamp (local so PnL labels can use it in the same fetch)
      let firstBlockTsResolved = firstBlockTimestamp;
      if (firstBlockTsResolved == null) {
        try {
          const firstBlock = await provider.getBlock(FIRST_BLOCK);
          if (firstBlock && firstBlock.timestamp) {
            firstBlockTsResolved = Number(firstBlock.timestamp);
            setFirstBlockTimestamp(firstBlockTsResolved);
          }
        } catch (error) {
          console.warn('Error fetching first block timestamp:', error);
        }
      }

      // Fetch PnL at different block heights
      try {
        // Read PnL at current, 1h ago, and 24h ago blocks
        // Use appropriate contract address based on block number
        const readPnL = async (blockTag, retries = 3) => {
          const pnlContract = getPnLContract(provider, blockTag);
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              const result = await pnlContract.pnl({ blockTag });
              return result;
            } catch (error) {
              if (attempt === retries) {
                console.warn(`PnL call reverted at block ${blockTag} after ${retries} attempts`);
                return 0n;
              }
              await new Promise(resolve => setTimeout(resolve, attempt * 100));
            }
          }
          return 0n;
        };

        /** May Δ uses SanityPnl's <code>pnl()</code> at the fixed dashboard address; same scaling (÷ 1e36). */
        const readSanityPnlAtBlock = async (blockTag, retries = 3) => {
          const sanity = getSanityPnlContract(provider);
          const pnlFn = sanity.getFunction('pnl()');
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              return await pnlFn({ blockTag });
            } catch (error) {
              if (attempt === retries) {
                console.warn(
                  `SanityPnl.pnl call reverted at block ${blockTag} after ${retries} attempts`
                );
                return 0n;
              }
              await new Promise(resolve => setTimeout(resolve, attempt * 100));
            }
          }
          return 0n;
        };

        const hasFullAnchor31dData = blocks.current >= PNL_ANCHOR_BLOCK;
        const hasReachedMayStart = blocks.current >= PNL_MAY_START_BLOCK;
        const hasReachedJuneStart = blocks.current >= PNL_JUNE_START_BLOCK;
        const aprilFrozenEndBlock =
          PNL_MAY_START_BLOCK > 0 ? PNL_MAY_START_BLOCK - 1 : FIRST_BLOCK;
        const mayFrozenEndBlock =
          PNL_JUNE_START_BLOCK > 0 ? PNL_JUNE_START_BLOCK - 1 : PNL_MAY_START_BLOCK;
        const mayHeadSanityBlock = hasReachedJuneStart
          ? mayFrozenEndBlock
          : blocks.current;

        const [
          pnlCurrent,
          pnl1h,
          pnl24h,
          pnlAtFirstBlock,
          pnlAtAnchor31d,
          pnlAtAprilFrozenEnd,
          sanityPnlMayStartRaw,
          sanityPnlMayEndRaw,
          sanityPnlJuneStartRaw,
          sanityPnlJuneHeadRaw
        ] = await Promise.all([
          readPnL(blocks.current),
          readPnL(blocks.oneHourAgo),
          readPnL(blocks.twentyFourHoursAgo),
          hasFullAnchor31dData ? readPnL(FIRST_BLOCK) : Promise.resolve(0n),
          hasFullAnchor31dData ? readPnL(PNL_ANCHOR_BLOCK) : Promise.resolve(0n),
          hasFullAnchor31dData && hasReachedMayStart
            ? readPnL(aprilFrozenEndBlock)
            : Promise.resolve(0n),
          hasReachedMayStart
            ? readSanityPnlAtBlock(PNL_MAY_START_BLOCK)
            : Promise.resolve(0n),
          hasReachedMayStart
            ? readSanityPnlAtBlock(mayHeadSanityBlock)
            : Promise.resolve(0n),
          hasReachedJuneStart
            ? readSanityPnlAtBlock(PNL_JUNE_START_BLOCK)
            : Promise.resolve(0n),
          hasReachedJuneStart
            ? readSanityPnlAtBlock(blocks.current)
            : Promise.resolve(0n)
        ]);

        let anchor31dTimestamp = null;
        if (hasFullAnchor31dData) {
          try {
            const anchorBlock = await provider.getBlock(PNL_ANCHOR_BLOCK);
            if (anchorBlock && anchorBlock.timestamp != null) {
              anchor31dTimestamp = Number(anchorBlock.timestamp);
            }
          } catch (e) {
            console.warn('Failed to fetch PnL anchor block timestamp:', e);
          }
        }

        let mayStartTimestamp = null;
        if (hasReachedMayStart) {
          try {
            const mayBlock = await provider.getBlock(PNL_MAY_START_BLOCK);
            if (mayBlock && mayBlock.timestamp != null) {
              mayStartTimestamp = Number(mayBlock.timestamp);
            }
          } catch (e) {
            console.warn('Failed to fetch May start block timestamp:', e);
          }
        }

        let juneStartTimestamp = null;
        if (hasReachedJuneStart) {
          try {
            const juneBlock = await provider.getBlock(PNL_JUNE_START_BLOCK);
            if (juneBlock && juneBlock.timestamp != null) {
              juneStartTimestamp = Number(juneBlock.timestamp);
            }
          } catch (e) {
            console.warn('Failed to fetch June start block timestamp:', e);
          }
        }

        // Convert to numbers and divide by 1e36
        const pnlCurrentBigInt = typeof pnlCurrent === 'bigint' ? pnlCurrent : BigInt(pnlCurrent.toString());
        const pnl1hBigInt = typeof pnl1h === 'bigint' ? pnl1h : BigInt(pnl1h.toString());
        const pnl24hBigInt = typeof pnl24h === 'bigint' ? pnl24h : BigInt(pnl24h.toString());
        const pnlAtFirstBigInt = typeof pnlAtFirstBlock === 'bigint' ? pnlAtFirstBlock : BigInt(pnlAtFirstBlock.toString());
        const pnlAtAnchorBigInt =
          typeof pnlAtAnchor31d === 'bigint'
            ? pnlAtAnchor31d
            : BigInt(pnlAtAnchor31d.toString());
        const pnlAtAprilFrozenEndBigInt =
          typeof pnlAtAprilFrozenEnd === 'bigint'
            ? pnlAtAprilFrozenEnd
            : BigInt((pnlAtAprilFrozenEnd ?? 0n).toString());

        const pnlCurrentNumber = Number(pnlCurrentBigInt) / 1e36;
        const pnl1hNumber = Number(pnl1hBigInt) / 1e36;
        const pnl24hNumber = Number(pnl24hBigInt) / 1e36;
        const pnlAtFirstNumber = Number(pnlAtFirstBigInt) / 1e36;
        const pnlAtAnchorNumber = Number(pnlAtAnchorBigInt) / 1e36;
        const pnlAprilFrozenEndNumber =
          Number(pnlAtAprilFrozenEndBigInt) / 1e36;

        // Calculate differences
        const totalSinceFirst = pnlCurrentNumber; // cumulative PnL at head (contract view)

        {
          const totalSinceContract = getPnLContract(provider, blocks.current);
          const labelTs = firstBlockTsResolved;
          const labelText =
            labelTs != null
              ? new Date(labelTs * 1000).toLocaleString()
              : `(block ${FIRST_BLOCK} — timestamp pending)`;
          console.group('[PropAMM] PnL — "Total since {first block time}" row (full calculation)');
          console.log(
            '1) What the date means: the label is the wall-clock time of FIRST_BLOCK, which is an anchor for display only.'
          );
          console.log('   FIRST_BLOCK:', FIRST_BLOCK, '| label shown:', `Total since ${labelText}:`);
          console.log(
            '2) The number is NOT a delta since that time. It is the on-chain pnl() at the *current head* block, scaled for display (see below).'
          );
          console.log('3) blockTag passed to pnl() { blockTag: … }:', blocks.current);
          console.log('4) Contract (getPnLContract(provider, that block)):', totalSinceContract.target);
          console.log('5) pnl() return (int256, raw string):', pnlCurrent.toString());
          console.log('6) Scaling: display = Number(BigInt(pnl() raw)) / 1e36');
          console.log('7) pnl() as BigInt (for precision check):', pnlCurrentBigInt.toString());
          console.log('8) totalSinceFirst (what the UI shows for that row):', totalSinceFirst);
          console.log(
            '9) If you need change since first block, that would be pnl(current) and pnl(FIRST_BLOCK) on their respective historical contracts, then compare scaled values (not done for this label).'
          );
          console.groupEnd();
        }

        const pnl1hChange = blocks.hasFull1hData ? pnlCurrentNumber - pnl1hNumber : null;
        const pnl24hChange = blocks.hasFull24hData ? pnlCurrentNumber - pnl24hNumber : null;
        const pnlAprilWindow =
          hasFullAnchor31dData
            ? hasReachedMayStart
              ? pnlAprilFrozenEndNumber - pnlAtAnchorNumber
              : pnlCurrentNumber - pnlAtAnchorNumber
            : null;
        const sanityMayStartBi =
          typeof sanityPnlMayStartRaw === 'bigint'
            ? sanityPnlMayStartRaw
            : BigInt((sanityPnlMayStartRaw ?? 0n).toString());
        const sanityMayEndBi =
          typeof sanityPnlMayEndRaw === 'bigint'
            ? sanityPnlMayEndRaw
            : BigInt((sanityPnlMayEndRaw ?? 0n).toString());
        const sanityJuneStartBi =
          typeof sanityPnlJuneStartRaw === 'bigint'
            ? sanityPnlJuneStartRaw
            : BigInt((sanityPnlJuneStartRaw ?? 0n).toString());
        const sanityJuneHeadBi =
          typeof sanityPnlJuneHeadRaw === 'bigint'
            ? sanityPnlJuneHeadRaw
            : BigInt((sanityPnlJuneHeadRaw ?? 0n).toString());
        /** Sanity <code>pnl()</code> before May must not run (reverts); value is <code>0</code>. Frozen when June starts. */
        const pnlMayWindow =
          hasFullAnchor31dData
            ? hasReachedMayStart
              ? Number(sanityMayEndBi - sanityMayStartBi) / 1e36
              : 0
            : null;
        /** Same Sanity contract; <code>0</code> until {@link PNL_JUNE_START_BLOCK}. */
        const pnlJuneWindow =
          hasFullAnchor31dData
            ? hasReachedJuneStart
              ? Number(sanityJuneHeadBi - sanityJuneStartBi) / 1e36
              : 0
            : null;
        const pnlJuneExcludingFees =
          pnlJuneWindow != null && hasReachedJuneStart
            ? pnlJuneWindow - feesSinceJune
            : pnlJuneWindow;
        const pnlFirstBlockUntilAnchor31d =
          hasFullAnchor31dData &&
          firstBlockTsResolved != null &&
          anchor31dTimestamp != null
            ? pnlAtAnchorNumber - pnlAtFirstNumber
            : null;

        console.log('PnL values:', {
          current: pnlCurrentNumber,
          '1h ago': pnl1hNumber,
          '24h ago': pnl24hNumber,
          totalSinceFirst,
          '1h change': pnl1hChange,
          '24h change': pnl24hChange,
          'April (lineage Δ; frozen when past May start)': pnlAprilWindow,
          May: pnlMayWindow,
          June: pnlJuneWindow,
          'June (after fees)': pnlJuneExcludingFees,
          feesSinceJune,
          MAY_START_BLOCK: PNL_MAY_START_BLOCK,
          JUNE_START_BLOCK: PNL_JUNE_START_BLOCK,
          'first → April start (March)': pnlFirstBlockUntilAnchor31d
        });

        const blocksPerHour = Math.floor(3600 / BLOCK_TIME_SECONDS);
        const pnlHourlyRaw = await Promise.all(
          Array.from({ length: 25 }, (_, i) => {
            const h = 24 - i;
            const b = Math.max(FIRST_BLOCK, blocks.current - h * blocksPerHour);
            return readPnL(b);
          })
        );
        const hourlySeries = Array.from({ length: 24 }, (_, i) => {
          const rawPrev = pnlHourlyRaw[i];
          const rawNext = pnlHourlyRaw[i + 1];
          const pPrev = BigInt(
            typeof rawPrev === 'bigint' ? rawPrev : rawPrev.toString()
          );
          const pNext = BigInt(
            typeof rawNext === 'bigint' ? rawNext : rawNext.toString()
          );
          const diff = pNext - pPrev;
          return {
            slot: i,
            label:
              i === 23
                ? '1h ago → now: ΔPnl vs previous hour'
                : `${24 - i}h → ${24 - i - 1}h ago: ΔPnl vs previous hour`,
            pnl: Number(diff) / 1e36
          };
        });

        {
          const pv = hourlySeries.map((d) => d.pnl);
          const mn = Math.min(...pv);
          const mx = Math.max(...pv);
          console.log('[PropAMM] Hourly PnL delta — 24 points (display ÷1e36):', pv);
          console.log(
            '[PropAMM] Hourly PnL delta min / max:',
            mn,
            mx
          );
        }

        setPnl({
          totalSinceFirst,
          firstBlockLabelTs: firstBlockTsResolved,
          sinceAnchor31d: pnlAprilWindow,
          sinceAnchor31dTimestamp: anchor31dTimestamp,
          sinceMayStart: pnlMayWindow,
          sinceMayStartTimestamp: mayStartTimestamp,
          sinceJuneStart: pnlJuneExcludingFees,
          sinceJuneStartTimestamp: juneStartTimestamp,
          firstUntilAnchor31d: pnlFirstBlockUntilAnchor31d,
          oneHour: pnl1hChange,
          twentyFourHours: pnl24hChange,
          hourlySeries
        });
      } catch (error) {
        console.error('Error fetching PnL:', error);
        setPnl(null);
      }

      try {
        const sc = getSanityPnlContract(provider);
        const pnl0 = sc.getFunction('pnl()');
        const [ref, maxL, p0] = await Promise.all([
          sc.referencePnl(),
          sc.maxLoss(),
          pnl0()
        ]);
        const refB = BigInt(ref.toString());
        const pB = BigInt(p0.toString());
        const maxB = BigInt(maxL.toString());
        const scale = 1e36;
        setSanityPnl({
          referencePnl: Number(refB) / scale,
          maxAllowedLoss: Number(maxB) / scale,
          delta: Number(pB - refB) / scale
        });
      } catch (e) {
        console.warn('SanityPnl fetch failed:', e);
        setSanityPnl(null);
      }

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
          const [volumeCurrent, volume1h, volume24h] = await Promise.all([
            readVolume(blocks.current),
            readVolume(blocks.oneHourAgo),
            readVolume(blocks.twentyFourHoursAgo)
          ]);

          // Debug: Print raw values from contract first
          console.log(`[${tokenName}/${aggName}] Raw Volume Values from Contract:`);
          console.log(`  volumeCurrent (raw):`, volumeCurrent, `type:`, typeof volumeCurrent);
          console.log(`  volume1h (raw):`, volume1h, `type:`, typeof volume1h);
          console.log(`  volume24h (raw):`, volume24h, `type:`, typeof volume24h);

          // Convert to BigInt for calculations
          const currentBigInt = typeof volumeCurrent === 'bigint' ? volumeCurrent : BigInt(volumeCurrent.toString());
          const oneHourBigInt = typeof volume1h === 'bigint' ? volume1h : BigInt(volume1h.toString());
          const twentyFourHoursBigInt = typeof volume24h === 'bigint' ? volume24h : BigInt(volume24h.toString());

          // Debug: Print block numbers and volumes for all time periods
          console.log(`[${tokenName}/${aggName}] Volume Stats Block Comparison:`);
          console.log(`  Current block: ${blocks.current}`);
          console.log(`  Volume at current block (${blocks.current}): ${currentBigInt.toString()}`);
          console.log(`  1h ago block: ${blocks.oneHourAgo}`);
          console.log(`  Volume at 1h ago block (${blocks.oneHourAgo}): ${oneHourBigInt.toString()}`);
          console.log(`  24h ago block: ${blocks.twentyFourHoursAgo}`);
          console.log(`  Volume at 24h ago block (${blocks.twentyFourHoursAgo}): ${twentyFourHoursBigInt.toString()}`);
          console.log(`  First block: ${blocks.first}`);
          console.log(`  Blocks difference (current - 24h ago): ${blocks.current - blocks.twentyFourHoursAgo}`);
          console.log(`  Expected blocks in 24h: ${(3600 / 2) * 24} (43200)`);
          console.log(`  Blocks difference (current - 1h ago): ${blocks.current - blocks.oneHourAgo}`);
          console.log(`  Expected blocks in 1h: ${3600 / 2} (1800)`);

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

          // For 24h stats: always calculate volume from 24h ago block to now
          // The blocks.twentyFourHoursAgo is already calculated correctly (max of calculated 24h ago or first block)
          let twentyFourHoursVolume = currentBigInt - twentyFourHoursBigInt;
          console.log(`  Calculated 24h volume: ${twentyFourHoursVolume.toString()}`);

          volumeData[tokenName][aggName] = {
            oneHour: oneHourVolume.toString(),
            twentyFourHours: twentyFourHoursVolume.toString()
          };
        }
      }

      // Calculate aggregated statistics
      const perToken = {};
      const perAggregator = Object.fromEntries(
        Object.keys(AGGREGATORS).map((k) => [k, {}])
      );

      // Per token aggregation
      for (const tokenName of Object.keys(TOKENS)) {
        perToken[tokenName] = {};
        for (const aggName of Object.keys(AGGREGATORS)) {
          const vol = volumeData[tokenName][aggName] || { oneHour: '0', twentyFourHours: '0' };
          perToken[tokenName][aggName] = {
            oneHour: vol.oneHour,
            twentyFourHours: vol.twentyFourHours
          };
        }
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
      setSanityPnl(null);
      setProtocolFees(null);
      setGasExpenses(null);
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
    <div className="home-page">
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
        
        {/* Wallet Value Display */}
        {(walletValue || vtWalletValue !== null || mainnetWalletValue !== null) && (
          <div className="wallet-values-grid">
            {walletValue && (
              <div className="wallet-value-card">
                <div className="wallet-value-main">
                  <div className="wallet-value-main-left">
                    <span className="wallet-value-label">PropAMM wallet value</span>
                    <span className="wallet-value-amount">
                      ${walletValue.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                {minUSDValue !== null && minUSDValue !== undefined && (
                  <div className="wallet-value-minusd-block">
                    <div className="wallet-value-minusd-text">
                      <span className="wallet-value-minusd-label">Circuit Breaker Min USD Value</span>
                      <span className="wallet-value-minusd-amount">
                        ${minUSDValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    {walletValue.current > 0 && (
                      <div className="wallet-value-minusd-bar">
                        <div
                          className="wallet-value-minusd-bar-fill"
                          style={{
                            width: `${Math.min((minUSDValue / walletValue.current) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
                <div className="wallet-value-changes">
                  {walletValue.change1h !== null && walletValue.change1h !== undefined && (
                    <div className={`wallet-change ${walletValue.change1h >= 0 ? 'positive' : 'negative'}`}>
                      <span className="change-label">1h:</span>
                      <span className="change-value">
                        {walletValue.change1h >= 0 ? '+' : ''}{walletValue.change1h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="change-percent">
                        ({walletValue.change1h >= 0 ? '+' : ''}{((walletValue.change1h / walletValue.current) * 100).toFixed(2)}%)
                      </span>
                    </div>
                  )}
                  {walletValue.change24h !== null && walletValue.change24h !== undefined && (
                    <div className={`wallet-change ${walletValue.change24h >= 0 ? 'positive' : 'negative'}`}>
                      <span className="change-label">24h:</span>
                      <span className="change-value">
                        {walletValue.change24h >= 0 ? '+' : ''}{walletValue.change24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="change-percent">
                        ({walletValue.change24h >= 0 ? '+' : ''}{((walletValue.change24h / walletValue.current) * 100).toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {vtWalletValue !== null && (
              <div className="wallet-value-card wallet-value-card--simple">
                <div className="wallet-value-main">
                  <div className="wallet-value-main-left">
                    <span className="wallet-value-label">VT wallet</span>
                    <span className="wallet-value-amount">
                      ${vtWalletValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {mainnetWalletValue !== null && (
              <div className="wallet-value-card">
                <div className="wallet-value-main">
                  <div className="wallet-value-main-left">
                    <span className="wallet-value-label">Mainnet Wallet</span>
                    <span className="wallet-value-amount">
                      ${mainnetWalletValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
                {mainnetMinUSDValue !== null && mainnetMinUSDValue !== undefined && (
                  <div className="wallet-value-minusd-block">
                    <div className="wallet-value-minusd-text">
                      <span className="wallet-value-minusd-label">Circuit Breaker Min USD Value</span>
                      <span className="wallet-value-minusd-amount">
                        ${mainnetMinUSDValue.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    {mainnetWalletValue > 0 && (
                      <div className="wallet-value-minusd-bar">
                        <div
                          className="wallet-value-minusd-bar-fill"
                          style={{
                            width: `${Math.min((mainnetMinUSDValue / mainnetWalletValue) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Token Balances Display */}
        {(tokenBalances || mainnetTokenBalances || vtTokenBalances) && (
          <div className="token-balances-card">
            <h3 className="token-balances-title">Token Balances</h3>
            {tokenBalances && (
              <section className="token-balances-row">
                <h4 className="token-balances-row-title">Base PropAMM</h4>
                <div className="token-balances-grid token-balances-grid--aligned">
                  {renderBaseBalanceRow(tokenBalances)}
                </div>
              </section>
            )}
            {mainnetTokenBalances && (
              <section className="token-balances-row">
                <h4 className="token-balances-row-title">Mainnet PropAMM</h4>
                <div className="token-balances-grid token-balances-grid--aligned">
                  {renderMainnetBalanceRow(mainnetTokenBalances)}
                </div>
              </section>
            )}
            {vtTokenBalances && (
              <section className="token-balances-row">
                <h4 className="token-balances-row-title">VT wallet</h4>
                <div className="token-balances-grid token-balances-grid--aligned">
                  {renderVtBalanceRow(vtTokenBalances)}
                </div>
              </section>
            )}
          </div>
        )}
        {pnl !== null && (
          <div className="pnl-card">
            <h3 className="pnl-title">PnL Statistics</h3>
            <div className="token-balances-grid pnl-stats-cubes">
              {pnl.totalSinceFirst !== null && pnl.totalSinceFirst !== undefined && (
                <div className="token-balance-item">
                  <div className="token-balance-header">
                    <span className="token-balance-name">Total</span>
                  </div>
                  <div
                    className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                      pnl.totalSinceFirst >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {pnl.totalSinceFirst >= 0 ? '+' : ''}
                    {pnl.totalSinceFirst.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              )}

              {pnl.sinceJuneStart !== null && pnl.sinceJuneStart !== undefined && (
                <div className="token-balance-item">
                  <div className="token-balance-header">
                    <span className="token-balance-name">June (after fees)</span>
                  </div>
                  <div
                    className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                      pnl.sinceJuneStart >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {pnl.sinceJuneStart >= 0 ? '+' : ''}
                    {pnl.sinceJuneStart.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              )}

              {pnl.sinceMayStart !== null && pnl.sinceMayStart !== undefined && (
                <div className="token-balance-item">
                  <div className="token-balance-header">
                    <span className="token-balance-name">May</span>
                  </div>
                  <div
                    className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                      pnl.sinceMayStart >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {pnl.sinceMayStart >= 0 ? '+' : ''}
                    {pnl.sinceMayStart.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              )}

              {pnl.sinceAnchor31d !== null &&
                pnl.sinceAnchor31d !== undefined &&
                pnl.sinceAnchor31dTimestamp != null && (
                  <div className="token-balance-item">
                    <div className="token-balance-header">
                      <span className="token-balance-name">April</span>
                    </div>
                    <div
                      className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                        pnl.sinceAnchor31d >= 0 ? 'positive' : 'negative'
                      }`}
                    >
                      {pnl.sinceAnchor31d >= 0 ? '+' : ''}
                      {pnl.sinceAnchor31d.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                )}

              {pnl.firstUntilAnchor31d !== null &&
                pnl.firstUntilAnchor31d !== undefined &&
                (pnl.firstBlockLabelTs ?? firstBlockTimestamp) != null &&
                pnl.sinceAnchor31dTimestamp != null && (
                  <div className="token-balance-item">
                    <div className="token-balance-header">
                      <span className="token-balance-name">March</span>
                    </div>
                    <div
                      className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                        pnl.firstUntilAnchor31d >= 0 ? 'positive' : 'negative'
                      }`}
                    >
                      {pnl.firstUntilAnchor31d >= 0 ? '+' : ''}
                      {pnl.firstUntilAnchor31d.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                )}

              {pnl.oneHour !== null && pnl.oneHour !== undefined && (
                <div className="token-balance-item">
                  <div className="token-balance-header">
                    <span className="token-balance-name">Last 1h</span>
                  </div>
                  <div
                    className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                      pnl.oneHour >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {pnl.oneHour >= 0 ? '+' : ''}
                    {pnl.oneHour.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              )}

              {pnl.twentyFourHours !== null && pnl.twentyFourHours !== undefined && (
                <div className="token-balance-item">
                  <div className="token-balance-header">
                    <span className="token-balance-name">Last 24h</span>
                  </div>
                  <div
                    className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                      pnl.twentyFourHours >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {pnl.twentyFourHours >= 0 ? '+' : ''}
                    {pnl.twentyFourHours.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              )}
            </div>
            {pnl.hourlySeries && pnl.hourlySeries.length > 0 && (
              <PnlHourlyChart hourlySeries={pnl.hourlySeries} />
            )}
          </div>
        )}

        {(protocolFees !== null || gasExpenses !== null) && (
          <div className="token-balances-card protocol-fees-card">
            <h3 className="token-balances-title">Protocol Fees</h3>
            <div className="token-balances-grid protocol-fees-grid">
              {protocolFees !== null && (
                <div className="token-balance-item">
                  <div className="token-balance-header">
                    <span className="token-balance-name">Fees collected since June 1st</span>
                  </div>
                  <div className="protocol-fees-value">
                    $
                    {protocolFees.sinceJuneStart.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              )}
              {gasExpenses !== null && (
                <div className="token-balance-item">
                  <div className="token-balance-header">
                    <span className="token-balance-name">Gas expenses since June 7th</span>
                  </div>
                  <div className="protocol-fees-value">
                    {gasExpenses.totalSpentEth.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    ETH
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {sanityPnl !== null && (
          <div className="token-balances-card pnb-circuit-card">
            <h3 className="token-balances-title">Pnl Circuit Breaker</h3>
            <div className="token-balances-grid">
              <div className="token-balance-item">
                <div className="token-balance-header">
                  <span className="token-balance-name">referencePnl</span>
                </div>
                <div
                  className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                    sanityPnl.referencePnl >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {sanityPnl.referencePnl >= 0 ? '+' : ''}
                  {sanityPnl.referencePnl.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
              <div className="token-balance-item">
                <div className="pnb-circuit-cube-header-column">
                  <span className="token-balance-name">current loss</span>
                  <span className="pnb-circuit-max-allowed">
                    (max allowed{' '}
                    {sanityPnl.maxAllowedLoss.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6
                    })}
                    )
                  </span>
                </div>
                <div
                  className={`token-balance-value pnl-value pnb-circuit-cube-value ${
                    sanityPnl.delta >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {sanityPnl.delta >= 0 ? '+' : ''}
                  {sanityPnl.delta.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
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
