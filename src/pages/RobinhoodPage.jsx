import { useEffect, useState } from 'react';
import { fetchRobinhoodSnapshot } from '../utils/robinhood';
import '../App.css';

const ROBINHOOD_BALANCE_SLOT_KEYS = ['weth', 'virtual', 'usdc'];

function tokenBalanceDisplayName(tokenKey) {
  if (tokenKey === 'virtual') return 'Virtual';
  return tokenKey.toUpperCase();
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

function formatUsd(value) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatTokenAmount(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

function valueClassName(value) {
  if (value == null || Number.isNaN(value)) return 'pnl-value';
  return `pnl-value ${value >= 0 ? 'positive' : 'negative'}`;
}

function renderRobinhoodUsdcCube(row) {
  const balance = row?.balance ?? 0;
  return (
    <div key="usdc" className="token-balance-item">
      <div className="token-balance-header">
        <span className="token-balance-name">USDC</span>
      </div>
      <div className="token-balance-details">
        <div className="token-balance-row">
          <span className="token-balance-label">Balance:</span>
          <span className="token-balance-value">{formatTokenAmount(balance)}</span>
        </div>
      </div>
    </div>
  );
}

function renderRobinhoodImbalanceCube(row) {
  return (
    <div key={row.key} className="token-balance-item">
      <div className="token-balance-header">
        <span className="token-balance-name">{tokenBalanceDisplayName(row.key)}</span>
        <span className="token-balance-percentage">{row.percentage.toFixed(2)}%</span>
      </div>
      <div className="token-balance-details">
        <div className="token-balance-row">
          <span className="token-balance-label">Balance:</span>
          <span className="token-balance-value">{formatTokenAmount(row.balance)}</span>
        </div>
        <div className="token-balance-row">
          <span className="token-balance-label">Target:</span>
          <span className="token-balance-value">{formatTokenAmount(row.target)}</span>
        </div>
      </div>
      <div className="token-balance-progress-bar">
        <div
          className="token-balance-progress-fill"
          style={{
            width: `${Math.min(row.percentage, 100)}%`,
            backgroundColor: progressBarColor(row.percentage)
          }}
        />
      </div>
    </div>
  );
}

function renderRobinhoodBalanceSlot(tokenKey, tokensByKey) {
  if (tokenKey === 'usdc') {
    return renderRobinhoodUsdcCube(tokensByKey.usdc);
  }

  const row = tokensByKey[tokenKey];
  if (!row) {
    return (
      <div
        key={tokenKey}
        className="token-balance-item token-balance-item--hole"
        aria-hidden
      />
    );
  }

  return renderRobinhoodImbalanceCube(row);
}

export function RobinhoodPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRobinhoodSnapshot();
        if (!cancelled) setSnapshot(data);
      } catch (e) {
        console.warn('Robinhood snapshot fetch failed:', e);
        if (!cancelled) {
          setSnapshot(null);
          setError(e?.message ?? 'Failed to load Robinhood data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tokensByKey = snapshot
    ? Object.fromEntries(snapshot.tokens.map((row) => [row.key, row]))
    : null;

  return (
    <div className="home-page robinhood-page">
      <header className="app-header">
        <h1>Robinhood Chain</h1>
        <div className="block-info">
          {snapshot?.blockNumber != null && (
            <p>Current Block: {snapshot.blockNumber.toLocaleString()}</p>
          )}
        </div>
      </header>

      {loading && <p className="robinhood-status">Loading Robinhood data…</p>}
      {error && <p className="robinhood-error">{error}</p>}

      {snapshot && tokensByKey && (
        <>
          <div className="wallet-values-grid robinhood-metrics-grid">
            <div className="wallet-value-card">
              <div className="wallet-value-main">
                <div className="wallet-value-main-left">
                  <span className="wallet-value-label">Wallet value</span>
                  <span className="wallet-value-amount">
                    {snapshot.walletValueUsd != null
                      ? `$${snapshot.walletValueUsd.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="wallet-value-card">
              <div className="wallet-value-main">
                <div className="wallet-value-main-left">
                  <span className="wallet-value-label">PnL (current)</span>
                  <span className={`wallet-value-amount ${valueClassName(snapshot.pnlCurrentUsd)}`}>
                    {formatUsd(snapshot.pnlCurrentUsd)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="token-balances-card">
            <h3 className="token-balances-title">Imbalance (Robinhood only)</h3>
            <section className="token-balances-row">
              <h4 className="token-balances-row-title">Robinhood</h4>
              <div className="token-balances-grid token-balances-grid--aligned">
                {ROBINHOOD_BALANCE_SLOT_KEYS.map((tokenKey) =>
                  renderRobinhoodBalanceSlot(tokenKey, tokensByKey)
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default RobinhoodPage;
