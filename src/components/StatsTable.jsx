import {
  formatVolume,
  TOKENS,
  AGGREGATORS,
  AGGREGATOR_DISPLAY_NAMES
} from '../utils/contract.js';

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
  // Only show loading on initial load when there's no data yet
  if (loading && !stats) {
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
          <div className="stats-table-wrapper">
            <table className="stats-table">
            <thead>
              <tr>
                <th>Token</th>
                {aggregatorNames.map((aggName) => (
                  <th key={aggName}>{AGGREGATOR_DISPLAY_NAMES[aggName]}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {tokenNames.map((tokenName) => {
                const tokenStats = stats.perToken[tokenName] || {};
                const total1h = aggregatorNames
                  .reduce(
                    (sum, aggName) =>
                      sum + BigInt(tokenStats[aggName]?.oneHour || '0'),
                    0n
                  )
                  .toString();
                const displayName = tokenName === 'virtual' ? 'Virtual' : tokenName.toUpperCase();

                return (
                  <tr key={tokenName}>
                    <td className="token-name">{displayName}</td>
                    {aggregatorNames.map((aggName) => (
                      <td key={aggName}>
                        ${formatVolume(tokenStats[aggName]?.oneHour || '0')}
                      </td>
                    ))}
                    <td className="total-cell">${formatVolume(total1h)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Per Aggregator Stats - 1h */}
        <div className="stats-section">
          <h4>Per Aggregator (1h)</h4>
          <div className="stats-table-wrapper">
            <table className="stats-table">
            <thead>
              <tr>
                <th>Aggregator</th>
                <th>WETH</th>
                <th>CBBTC</th>
                <th>Virtual</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {aggregatorNames.map((aggName) => {
                const aggStats = stats.perAggregator[aggName] || {};
                const weth1h = aggStats.weth?.oneHour || '0';
                const cbbtc1h = aggStats.cbbtc?.oneHour || '0';
                const virtual1h = aggStats.virtual?.oneHour || '0';
                const total1h = (BigInt(weth1h) + BigInt(cbbtc1h) + BigInt(virtual1h)).toString();

                const displayName = AGGREGATOR_DISPLAY_NAMES[aggName];
                return (
                  <tr key={aggName}>
                    <td className="aggregator-name">{displayName}</td>
                    <td>${formatVolume(weth1h)}</td>
                    <td>${formatVolume(cbbtc1h)}</td>
                    <td>${formatVolume(virtual1h)}</td>
                    <td className="total-cell">${formatVolume(total1h)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
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

      {/* 24h Stats Section */}
      <div className="time-period-section">
        <h3 className="time-period-header">24h Statistics</h3>
        
        {/* Per Token Stats - 24h */}
        <div className="stats-section">
          <h4>Per Token (24h)</h4>
          <div className="stats-table-wrapper">
            <table className="stats-table">
            <thead>
              <tr>
                <th>Token</th>
                {aggregatorNames.map((aggName) => (
                  <th key={aggName}>{AGGREGATOR_DISPLAY_NAMES[aggName]}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {tokenNames.map((tokenName) => {
                const tokenStats = stats.perToken[tokenName] || {};
                const total24h = aggregatorNames
                  .reduce(
                    (sum, aggName) =>
                      sum + BigInt(tokenStats[aggName]?.twentyFourHours || '0'),
                    0n
                  )
                  .toString();
                const displayName = tokenName === 'virtual' ? 'Virtual' : tokenName.toUpperCase();

                return (
                  <tr key={tokenName}>
                    <td className="token-name">{displayName}</td>
                    {aggregatorNames.map((aggName) => (
                      <td key={aggName}>
                        ${formatVolume(tokenStats[aggName]?.twentyFourHours || '0')}
                      </td>
                    ))}
                    <td className="total-cell">${formatVolume(total24h)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Per Aggregator Stats - 24h */}
        <div className="stats-section">
          <h4>Per Aggregator (24h)</h4>
          <div className="stats-table-wrapper">
            <table className="stats-table">
            <thead>
              <tr>
                <th>Aggregator</th>
                <th>WETH</th>
                <th>CBBTC</th>
                <th>Virtual</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {aggregatorNames.map((aggName) => {
                const aggStats = stats.perAggregator[aggName] || {};
                const weth24h = aggStats.weth?.twentyFourHours || '0';
                const cbbtc24h = aggStats.cbbtc?.twentyFourHours || '0';
                const virtual24h = aggStats.virtual?.twentyFourHours || '0';
                const total24h = (BigInt(weth24h) + BigInt(cbbtc24h) + BigInt(virtual24h)).toString();

                const displayName = AGGREGATOR_DISPLAY_NAMES[aggName];
                return (
                  <tr key={aggName}>
                    <td className="aggregator-name">{displayName}</td>
                    <td>${formatVolume(weth24h)}</td>
                    <td>${formatVolume(cbbtc24h)}</td>
                    <td>${formatVolume(virtual24h)}</td>
                    <td className="total-cell">${formatVolume(total24h)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Overall Total - 24h */}
        <div className="stats-section">
          <div className="totals-card">
            <div className="total-item">
              <span className="total-label">Total Volume (24h):</span>
              <span className="total-value">${formatVolume(stats.overall?.twentyFourHours || '0')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
