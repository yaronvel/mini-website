import { formatVolume } from '../utils/contract.js';
import { TOKENS, AGGREGATORS } from '../utils/contract.js';

// Format time period for display
function formatTimePeriod(timeSinceFirst) {
  if (!timeSinceFirst) return '24h';
  
  const { hours, days } = timeSinceFirst;
  
  if (days >= 1) {
    return `${days.toFixed(1)}d`;
  } else if (hours >= 1) {
    return `${hours.toFixed(1)}h`;
  } else {
    const minutes = hours * 60;
    return `${minutes.toFixed(0)}m`;
  }
}

export function StatsTable({ stats, loading }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading volume data...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="error">No data available</div>;
  }

  const tokenNames = Object.keys(TOKENS);
  const aggregatorNames = Object.keys(AGGREGATORS);
  const timePeriodLabel = formatTimePeriod(stats.timeSinceFirst);

  return (
    <div className="stats-container">
      <h2>Volume Statistics</h2>
      
      {/* 1 Hour Stats Section */}
      <div className="time-period-section">
        <h3 className="time-period-header">1 Hour Statistics</h3>
        
        {/* Per Token Stats - 1h */}
        <div className="stats-section">
          <h4>Per Token (1h)</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Kyber Swap</th>
                <th>ZeroX</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {tokenNames.map((tokenName) => {
                const tokenStats = stats.perToken[tokenName] || {};
                const kyber1h = tokenStats.kyberSwap?.oneHour || '0';
                const zeroX1h = tokenStats.zeroX?.oneHour || '0';
                const total1h = (BigInt(kyber1h) + BigInt(zeroX1h)).toString();
                const displayName = tokenName === 'sol' ? 'SOL' : tokenName.toUpperCase();

                return (
                  <tr key={tokenName}>
                    <td className="token-name">{displayName}</td>
                    <td>${formatVolume(kyber1h)}</td>
                    <td>${formatVolume(zeroX1h)}</td>
                    <td className="total-cell">${formatVolume(total1h)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Per Aggregator Stats - 1h */}
        <div className="stats-section">
          <h4>Per Aggregator (1h)</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Aggregator</th>
                <th>WETH</th>
                <th>CBBTC</th>
                <th>SOL</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {aggregatorNames.map((aggName) => {
                const aggStats = stats.perAggregator[aggName] || {};
                const weth1h = aggStats.weth?.oneHour || '0';
                const cbbtc1h = aggStats.cbbtc?.oneHour || '0';
                const sol1h = aggStats.sol?.oneHour || '0';
                const total1h = (BigInt(weth1h) + BigInt(cbbtc1h) + BigInt(sol1h)).toString();

                return (
                  <tr key={aggName}>
                    <td className="aggregator-name">
                      {aggName === 'kyberSwap' ? 'Kyber Swap' : 'ZeroX'}
                    </td>
                    <td>${formatVolume(weth1h)}</td>
                    <td>${formatVolume(cbbtc1h)}</td>
                    <td>${formatVolume(sol1h)}</td>
                    <td className="total-cell">${formatVolume(total1h)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Overall Total - 1h */}
        <div className="stats-section">
          <div className="totals-card">
            <div className="total-item">
              <span className="total-label">Total Volume (1h):</span>
              <span className="total-value">${formatVolume(stats.overall?.oneHour || '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Time Stats Section */}
      <div className="time-period-section">
        <h3 className="time-period-header">All Time Statistics ({timePeriodLabel})</h3>
        
        {/* Per Token Stats - All Time */}
        <div className="stats-section">
          <h4>Per Token ({timePeriodLabel})</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Kyber Swap</th>
                <th>ZeroX</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {tokenNames.map((tokenName) => {
                const tokenStats = stats.perToken[tokenName] || {};
                const kyber24h = tokenStats.kyberSwap?.twentyFourHours || '0';
                const zeroX24h = tokenStats.zeroX?.twentyFourHours || '0';
                const total24h = (BigInt(kyber24h) + BigInt(zeroX24h)).toString();
                const displayName = tokenName === 'sol' ? 'SOL' : tokenName.toUpperCase();

                return (
                  <tr key={tokenName}>
                    <td className="token-name">{displayName}</td>
                    <td>${formatVolume(kyber24h)}</td>
                    <td>${formatVolume(zeroX24h)}</td>
                    <td className="total-cell">${formatVolume(total24h)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Per Aggregator Stats - All Time */}
        <div className="stats-section">
          <h4>Per Aggregator ({timePeriodLabel})</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Aggregator</th>
                <th>WETH</th>
                <th>CBBTC</th>
                <th>SOL</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {aggregatorNames.map((aggName) => {
                const aggStats = stats.perAggregator[aggName] || {};
                const weth24h = aggStats.weth?.twentyFourHours || '0';
                const cbbtc24h = aggStats.cbbtc?.twentyFourHours || '0';
                const sol24h = aggStats.sol?.twentyFourHours || '0';
                const total24h = (BigInt(weth24h) + BigInt(cbbtc24h) + BigInt(sol24h)).toString();

                return (
                  <tr key={aggName}>
                    <td className="aggregator-name">
                      {aggName === 'kyberSwap' ? 'Kyber Swap' : 'ZeroX'}
                    </td>
                    <td>${formatVolume(weth24h)}</td>
                    <td>${formatVolume(cbbtc24h)}</td>
                    <td>${formatVolume(sol24h)}</td>
                    <td className="total-cell">${formatVolume(total24h)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Overall Total - All Time */}
        <div className="stats-section">
          <div className="totals-card">
            <div className="total-item">
              <span className="total-label">Total Volume ({timePeriodLabel}):</span>
              <span className="total-value">${formatVolume(stats.overall?.twentyFourHours || '0')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
