import { useState, useEffect } from 'react';
import { formatUnits } from 'ethers';
import {
  getProvider,
  getSlippageStepsContract,
  TOKENS,
  STEPS_DISPLAY_TOKEN_KEYS
} from '../utils/contract';
import '../App.css';

const XBASE_DECIMALS = {
  weth: 18,
  cbbtc: 8,
  virtual: 18
};

/** Column title for xBase per token */
const XBASE_TITLE = {
  weth: 'weth',
  cbbtc: 'cbbtc',
  virtual: 'virtual'
};

function toBigInt(v) {
  if (v == null) return 0n;
  return typeof v === 'bigint' ? v : BigInt(v.toString());
}

function formatSlippageRow(raw, tokenKey) {
  const xBaseDec = XBASE_DECIMALS[tokenKey];
  return {
    xQuote: raw.xQuote.map((v) => formatUnits(toBigInt(v), 6)),
    yQuote: raw.yQuote.map((v) => formatUnits(toBigInt(v), 0)),
    xBase: raw.xBase.map((v) => formatUnits(toBigInt(v), xBaseDec)),
    yBase: raw.yBase.map((v) => formatUnits(toBigInt(v), 0)),
    timeSlippageSlope: formatUnits(toBigInt(raw.timeSlippageSlope), 0)
  };
}

function tokenLabel(key) {
  return key === 'virtual' ? 'Virtual' : key.toUpperCase();
}

export function StepsDisplay() {
  const [dataByToken, setDataByToken] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const provider = getProvider();
        const contract = getSlippageStepsContract(provider);
        const next = {};

        await Promise.all(
          STEPS_DISPLAY_TOKEN_KEYS.map(async (tokenKey) => {
            const addr = TOKENS[tokenKey];
            const raw = await contract.getSlippageTokenData(addr);
            if (!cancelled) {
              next[tokenKey] = formatSlippageRow(raw, tokenKey);
            }
          })
        );

        if (!cancelled) {
          setDataByToken(next);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e?.message || 'Failed to load slippage data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="steps-page">
      <header className="steps-header">
        <h1>Steps display</h1>
        <p className="steps-contract">
          Contract:{' '}
          <code className="steps-address">
            0x3F1aa1C608544e4DE647F0aFE90e471edB239A74
          </code>
        </p>
      </header>

      {loading && (
        <div className="steps-loading">
          <div className="spinner" />
          <p>Loading slippage data…</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        STEPS_DISPLAY_TOKEN_KEYS.map((tokenKey) => {
          const row = dataByToken[tokenKey];
          if (!row) return null;

          return (
            <section key={tokenKey} className="steps-token-section">
              <h2 className="steps-token-title">{tokenLabel(tokenKey)}</h2>
              <p className="steps-token-address">
                <code>{TOKENS[tokenKey]}</code>
              </p>

              <div className="steps-grid">
                <div className="steps-block">
                  <h3>USDC (÷ 1e6)</h3>
                  <table className="steps-table">
                    <tbody>
                      {row.xQuote.map((v, i) => (
                        <tr key={`xq-${i}`}>
                          <td className="steps-idx">[{i}]</td>
                          <td className="steps-val">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="steps-block">
                  <h3>bps</h3>
                  <table className="steps-table">
                    <tbody>
                      {row.yQuote.map((v, i) => (
                        <tr key={`yq-${i}`}>
                          <td className="steps-idx">[{i}]</td>
                          <td className="steps-val">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="steps-block">
                  <h3>
                    {XBASE_TITLE[tokenKey]} (÷ 1e
                    {XBASE_DECIMALS[tokenKey]})
                  </h3>
                  <table className="steps-table">
                    <tbody>
                      {row.xBase.map((v, i) => (
                        <tr key={`xb-${i}`}>
                          <td className="steps-idx">[{i}]</td>
                          <td className="steps-val">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="steps-block">
                  <h3>bps</h3>
                  <table className="steps-table">
                    <tbody>
                      {row.yBase.map((v, i) => (
                        <tr key={`yb-${i}`}>
                          <td className="steps-idx">[{i}]</td>
                          <td className="steps-val">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="steps-slope">
                <span className="steps-slope-label">timeSlippageSlope (raw):</span>{' '}
                <code>{row.timeSlippageSlope}</code>
              </div>
            </section>
          );
        })}
    </div>
  );
}
