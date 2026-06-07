import {
  formatVolume,
  TOKENS,
  AGGREGATORS,
  AGGREGATOR_DISPLAY_NAMES
} from '../utils/contract.js';

function isNonZeroVolume(value) {
  return value != null && value !== '0' && BigInt(value) !== 0n;
}

function getActiveAggregators(stats, period, aggregatorNames, tokenNames) {
  return aggregatorNames.filter((aggName) =>
    tokenNames.some((tokenName) =>
      isNonZeroVolume(stats.perToken[tokenName]?.[aggName]?.[period])
    )
  );
}

function getActiveTokens(stats, period, aggregatorNames, tokenNames) {
  return tokenNames.filter((tokenName) =>
    aggregatorNames.some((aggName) =>
      isNonZeroVolume(stats.perToken[tokenName]?.[aggName]?.[period])
    )
  );
}

function tokenDisplayName(tokenName) {
  return tokenName === 'virtual' ? 'Virtual' : tokenName.toUpperCase();
}

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
  const activeAggregators1h = getActiveAggregators(
    stats,
    'oneHour',
    aggregatorNames,
    tokenNames
  );
  const activeTokens1h = getActiveTokens(
    stats,
    'oneHour',
    aggregatorNames,
    tokenNames
  );
  const activeAggregators24h = getActiveAggregators(
    stats,
    'twentyFourHours',
    aggregatorNames,
    tokenNames
  );
  const activeTokens24h = getActiveTokens(
    stats,
    'twentyFourHours',
    aggregatorNames,
    tokenNames
  );
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
                {activeAggregators1h.map((aggName) => (
                  <th key={aggName}>{AGGREGATOR_DISPLAY_NAMES[aggName]}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {activeTokens1h.map((tokenName) => {
                const tokenStats = stats.perToken[tokenName] || {};
                const total1h = activeAggregators1h
                  .reduce(
                    (sum, aggName) =>
                      sum + BigInt(tokenStats[aggName]?.oneHour || '0'),
                    0n
                  )
                  .toString();
                return (
                  <tr key={tokenName}>
                    <td className="token-name">{tokenDisplayName(tokenName)}</td>
                    {activeAggregators1h.map((aggName) => (
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
                {activeTokens1h.map((tokenName) => (
                  <th key={tokenName}>{tokenDisplayName(tokenName)}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {activeAggregators1h.map((aggName) => {
                const aggStats = stats.perAggregator[aggName] || {};
                const total1h = activeTokens1h
                  .reduce(
                    (sum, tokenName) =>
                      sum + BigInt(aggStats[tokenName]?.oneHour || '0'),
                    0n
                  )
                  .toString();

                return (
                  <tr key={aggName}>
                    <td className="aggregator-name">{AGGREGATOR_DISPLAY_NAMES[aggName]}</td>
                    {activeTokens1h.map((tokenName) => (
                      <td key={tokenName}>
                        ${formatVolume(aggStats[tokenName]?.oneHour || '0')}
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
                {activeAggregators24h.map((aggName) => (
                  <th key={aggName}>{AGGREGATOR_DISPLAY_NAMES[aggName]}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {activeTokens24h.map((tokenName) => {
                const tokenStats = stats.perToken[tokenName] || {};
                const total24h = activeAggregators24h
                  .reduce(
                    (sum, aggName) =>
                      sum + BigInt(tokenStats[aggName]?.twentyFourHours || '0'),
                    0n
                  )
                  .toString();
                return (
                  <tr key={tokenName}>
                    <td className="token-name">{tokenDisplayName(tokenName)}</td>
                    {activeAggregators24h.map((aggName) => (
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
                {activeTokens24h.map((tokenName) => (
                  <th key={tokenName}>{tokenDisplayName(tokenName)}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {activeAggregators24h.map((aggName) => {
                const aggStats = stats.perAggregator[aggName] || {};
                const total24h = activeTokens24h
                  .reduce(
                    (sum, tokenName) =>
                      sum + BigInt(aggStats[tokenName]?.twentyFourHours || '0'),
                    0n
                  )
                  .toString();

                return (
                  <tr key={aggName}>
                    <td className="aggregator-name">{AGGREGATOR_DISPLAY_NAMES[aggName]}</td>
                    {activeTokens24h.map((tokenName) => (
                      <td key={tokenName}>
                        ${formatVolume(aggStats[tokenName]?.twentyFourHours || '0')}
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
