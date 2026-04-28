import { useState, useEffect } from 'react';
import { formatUnits } from 'ethers';
import {
  getProvider,
  getSlippageStepsContract,
  getTargetBalanceContract,
  getMexicanPricerContract,
  TOKENS,
  TOKEN_DECIMALS,
  TARGET_BALANCE_CONTRACT_ADDRESS,
  CONFIGURATION_TOKEN_KEYS,
  MEXICAN_PRICER_KYBER_ADDRESS,
  MEXICAN_PRICER_ZEROX_ADDRESS,
  MEXICAN_PRICER_OKX_ADDRESS,
  SANITY_PNL_ADDRESS,
  CIRCUIT_BREAKER_ADDRESS,
  CIRCUIT_BREAKER_ABI,
  MEXICAN_PRICER_ABI
} from '../utils/contract';
import swapImplV2Abi from '../data/abis/SwapImplV2.json';
import quoteImplAbi from '../data/abis/QuoteImpl.json';
import whitelistSignersAbi from '../data/abis/WhitelistSigners.json';
import sanityPnlAbi from '../data/abis/SanityPnl.json';
import '../App.css';

const REFERENCE_ABIS_FOR_COPY = [
  { name: 'SwapImplV2', abi: swapImplV2Abi },
  { name: 'QuoteImpl', abi: quoteImplAbi },
  { name: 'MexicanPricerV6', abi: MEXICAN_PRICER_ABI },
  { name: 'WhitelistSigners', abi: whitelistSignersAbi },
  { name: 'SanityPnl', abi: sanityPnlAbi },
  { name: 'CircuitBreaker', abi: CIRCUIT_BREAKER_ABI }
];

const SWAP_IMPL_V2_ADDRESS = '0xc2Be7B94d5498b1acEb914F3a1dec4Ce502d235F';
const QUOTE_IMPL_ADDRESS = '0x3F1aa1C608544e4DE647F0aFE90e471edB239A74';
const WHITELIST_SIGNERS_ADDRESS =
  '0xCa369e97cc161c3c3a7368f9bC55A47F36a0A91E';
const UNISIG_ADDRESS = '0x351Bb653A688a26e263A0AFaf74cbf8854E32Cea';
const UNISIG_SAFE_URL =
  'https://app.safe.global/apps/open?safe=base:0x351Bb653A688a26e263A0AFaf74cbf8854E32Cea';

const IMBALANCE_UPDATE_ROLE =
  '0x760974e959e60229fb4642c0b3ec64295da2f09d5abe0949f08577aeaac009f4';

const PROP_AMM_WRAPPER_ADDRESS =
  '0xd35C6717cCa1E04696B694DCb1643Ac3620D2152';
const KYBERSWAP_AGGREGATOR_ADDRESS =
  '0x8F10B468b06c6FD214B65F87778827F7D113f996';
const ZEROX_NORMAL_AGGREGATOR_ADDRESS =
  '0x7747F8D2a76BD6345Cc29622a946A929647F2359';
const OKX_AGGREGATOR_ADDRESS =
  '0x0Bf54dd1664E14A01fc8aC3Abe8DD630ea9344D8';

const XBASE_DECIMALS = {
  weth: 18,
  cbbtc: 8,
  virtual: 18
};

const XBASE_TITLE = {
  weth: 'weth',
  cbbtc: 'cbbtc',
  virtual: 'virtual'
};

const SLIPPAGE_CURVE_RESOLUTION = 18;

const MEXICAN_PRICER_SOURCES = [
  {
    key: 'kyber',
    title: 'Kyber Swap',
    address: MEXICAN_PRICER_KYBER_ADDRESS
  },
  { key: 'zeroX', title: '0x', address: MEXICAN_PRICER_ZEROX_ADDRESS },
  { key: 'okX', title: 'OKX', address: MEXICAN_PRICER_OKX_ADDRESS }
];

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

function formatMexicanPricerRow(cfg, oddsYes, oddsNo) {
  const avg =
    cfg && typeof cfg === 'object' && 'avgNormalP' in cfg ? cfg.avgNormalP : cfg[0];
  const std =
    cfg && typeof cfg === 'object' && 'stdNormalP' in cfg ? cfg.stdNormalP : cfg[1];
  const gasPenaltyFixedRaw =
    cfg && typeof cfg === 'object' && 'gasPenaltyFixed' in cfg
      ? cfg.gasPenaltyFixed
      : cfg[2];
  const gasPenaltySlopeRaw =
    cfg && typeof cfg === 'object' && 'gasPenaltySlope' in cfg
      ? cfg.gasPenaltySlope
      : cfg[3];
  const gasPenaltyCutoffRaw =
    cfg && typeof cfg === 'object' && 'gasPenaltyCutoff' in cfg
      ? cfg.gasPenaltyCutoff
      : cfg[4];

  const fixed =
    cfg && typeof cfg === 'object' && 'fixedFee' in cfg ? cfg.fixedFee : cfg[5];
  const antiPRaw =
    cfg && typeof cfg === 'object' && 'antiP' in cfg ? cfg.antiP : cfg[6];
  const antiPThresholdRaw =
    cfg && typeof cfg === 'object' && 'antiPThreshold' in cfg
      ? cfg.antiPThreshold
      : cfg[7];

  const yes = toBigInt(oddsYes);
  const no = toBigInt(oddsNo);
  const sum = yes + no;
  let oddsYesPercent;
  if (sum === 0n) {
    oddsYesPercent = '—';
  } else {
    const pct = (Number(yes) / Number(sum)) * 100;
    oddsYesPercent = `${pct.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    })}%`;
  }

  return {
    avgNormalPBps: Number(toBigInt(avg)) / 100,
    stdNormalPBps: Number(toBigInt(std)) / 100,
    gasPenaltyFixedBps: Number(toBigInt(gasPenaltyFixedRaw)) / 100,
    gasPenaltySlopeBpsPer001Gwei: Number(toBigInt(gasPenaltySlopeRaw)) / 100,
    gasPenaltyCutoffGwei: Number(toBigInt(gasPenaltyCutoffRaw)) / 1e9,
    fixedFeeBps: Number(toBigInt(fixed)) / 100,
    oddsYesPercent,
    antiPBps: Number(toBigInt(antiPRaw)) / 100,
    antiPThresholdUsd: formatMexicanAntiPThresholdUsd(antiPThresholdRaw)
  };
}

function formatMexicanAntiPThresholdUsd(raw) {
  const n = Number(toBigInt(raw));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  }).format(n);
}

async function loadMexicanPricerSnapshot(provider) {
  const kyber = getMexicanPricerContract(provider, MEXICAN_PRICER_KYBER_ADDRESS);
  const zeroX = getMexicanPricerContract(provider, MEXICAN_PRICER_ZEROX_ADDRESS);
  const okX = getMexicanPricerContract(provider, MEXICAN_PRICER_OKX_ADDRESS);
  const [kCfg, kYes, kNo, zCfg, zYes, zNo, oCfg, oYes, oNo] = await Promise.all([
    kyber.config(),
    kyber.oddsForYes(),
    kyber.oddsForNo(),
    zeroX.config(),
    zeroX.oddsForYes(),
    zeroX.oddsForNo(),
    okX.config(),
    okX.oddsForYes(),
    okX.oddsForNo()
  ]);
  return {
    kyber: formatMexicanPricerRow(kCfg, kYes, kNo),
    zeroX: formatMexicanPricerRow(zCfg, zYes, zNo),
    okX: formatMexicanPricerRow(oCfg, oYes, oNo)
  };
}

function formatBpsDisplay(n) {
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  })} bps`;
}

function formatBpsPer001GweiDisplay(n) {
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  })} bps / 0.001 gwei`;
}

function formatGweiDisplay(n) {
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 9
  })} gwei`;
}

export function Configuration() {
  const [stepsByToken, setStepsByToken] = useState({});
  const [curveByToken, setCurveByToken] = useState({});
  const [mexicanPricer, setMexicanPricer] = useState(null);
  const [abiCopyMessage, setAbiCopyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function handleCopyAbi(name, abi) {
    const text = JSON.stringify(abi, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setAbiCopyMessage(`Copied ${name} ABI`);
      window.setTimeout(() => setAbiCopyMessage(''), 2500);
    } catch {
      setAbiCopyMessage('Could not copy — check browser permissions');
      window.setTimeout(() => setAbiCopyMessage(''), 4000);
    }
  }

  // Load once per visit: no interval or polling. Re-fetch only when the user
  // navigates away and opens this page again (component remount).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const provider = getProvider();
        const stepsContract = getSlippageStepsContract(provider);
        const curveContract = getTargetBalanceContract(provider);

        const tokenWork = (async () => {
          const stepsNext = {};
          const curveNext = {};

          await Promise.all(
            CONFIGURATION_TOKEN_KEYS.map(async (tokenKey) => {
              const addr = TOKENS[tokenKey];
              const dec = TOKEN_DECIMALS[tokenKey];

              const [raw, capRaw, targetRaw, curveRes] = await Promise.all([
                stepsContract.getSlippageTokenData(addr),
                curveContract.caps(addr),
                curveContract.tokenTargetBalance(addr),
                curveContract.slippageCurve(addr)
              ]);

              stepsNext[tokenKey] = formatSlippageRow(raw, tokenKey);

              const a =
                curveRes && typeof curveRes === 'object' && 'a' in curveRes
                  ? curveRes.a
                  : curveRes[0];
              const b =
                curveRes && typeof curveRes === 'object' && 'b' in curveRes
                  ? curveRes.b
                  : curveRes[1];

              curveNext[tokenKey] = {
                cap: formatUnits(capRaw, dec),
                target: formatUnits(targetRaw, dec),
                a: formatUnits(a, SLIPPAGE_CURVE_RESOLUTION),
                b: formatUnits(b, SLIPPAGE_CURVE_RESOLUTION)
              };
            })
          );

          return { stepsNext, curveNext };
        })();

        const mexicanWork = loadMexicanPricerSnapshot(provider);

        const [{ stepsNext, curveNext }, mexicanData] = await Promise.all([
          tokenWork,
          mexicanWork
        ]);

        if (!cancelled) {
          setStepsByToken(stepsNext);
          setCurveByToken(curveNext);
          setMexicanPricer(mexicanData);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e?.message || 'Failed to load configuration data');
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
        <h1>Configuration</h1>
        <p className="steps-contract">
          Steps contract:{' '}
          <code className="steps-address">
            0x3F1aa1C608544e4DE647F0aFE90e471edB239A74
          </code>
        </p>
      </header>

      {loading && (
        <div className="steps-loading">
          <div className="spinner" />
          <p>Loading…</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <h2 className="config-section-heading">Steps</h2>

          {CONFIGURATION_TOKEN_KEYS.map((tokenKey) => {
            const row = stepsByToken[tokenKey];
            if (!row) return null;

            return (
              <section key={`steps-${tokenKey}`} className="steps-token-section">
                <h3 className="steps-token-title">{tokenLabel(tokenKey)}</h3>
                <p className="steps-token-address">
                  <code>{TOKENS[tokenKey]}</code>
                </p>

                <div className="steps-grid">
                  <div className="steps-block">
                    <h4 className="steps-block-heading">USDC (÷ 1e6)</h4>
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
                    <h4 className="steps-block-heading">bps</h4>
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
                    <h4 className="steps-block-heading">
                      {XBASE_TITLE[tokenKey]} (÷ 1e
                      {XBASE_DECIMALS[tokenKey]})
                    </h4>
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
                    <h4 className="steps-block-heading">bps</h4>
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

          <h2 className="config-section-heading">Imbalance curve</h2>
          <p className="steps-contract config-imbalance-intro">
            Contract:{' '}
            <code className="steps-address">{TARGET_BALANCE_CONTRACT_ADDRESS}</code>
            <br />
            <span className="config-imbalance-note">
              Cap and target use token decimals; curve <code>a</code> and <code>b</code> are shown after
              dividing by 1e{SLIPPAGE_CURVE_RESOLUTION}.
            </span>
          </p>

          {CONFIGURATION_TOKEN_KEYS.map((tokenKey) => {
            const c = curveByToken[tokenKey];
            if (!c) return null;
            const dec = TOKEN_DECIMALS[tokenKey];

            return (
              <section key={`curve-${tokenKey}`} className="steps-token-section curve-token-section">
                <h3 className="steps-token-title">{tokenLabel(tokenKey)}</h3>
                <p className="steps-token-address">
                  <code>{TOKENS[tokenKey]}</code>
                </p>

                <dl className="curve-dl">
                  <dt>
                    caps (÷ 1e{dec})
                  </dt>
                  <dd>{c.cap}</dd>
                  <dt>
                    tokenTargetBalance (÷ 1e{dec})
                  </dt>
                  <dd>{c.target}</dd>
                  <dt>
                    slippageCurve <code>a</code> (÷ 1e{SLIPPAGE_CURVE_RESOLUTION})
                  </dt>
                  <dd>
                    <code>{c.a}</code>
                  </dd>
                  <dt>
                    slippageCurve <code>b</code> (÷ 1e{SLIPPAGE_CURVE_RESOLUTION})
                  </dt>
                  <dd>
                    <code>{c.b}</code>
                  </dd>
                </dl>
              </section>
            );
          })}

          <h2 className="config-section-heading">Mexican pricer</h2>
          <div className="mexican-pricer-grid">
            {mexicanPricer &&
              MEXICAN_PRICER_SOURCES.map(({ key, title, address }) => {
                const row = mexicanPricer[key];
                if (!row) return null;
                return (
                  <section key={key} className="mexican-pricer-card">
                    <h3 className="mexican-pricer-title">{title}</h3>
                    <p className="steps-token-address">
                      <code>{address}</code>
                    </p>
                    <dl className="curve-dl mexican-pricer-dl">
                      <dt>avgNormalP (bps, on-chain / 100)</dt>
                      <dd>{formatBpsDisplay(row.avgNormalPBps)}</dd>
                      <dt>stdNormalP (bps, on-chain / 100)</dt>
                      <dd>{formatBpsDisplay(row.stdNormalPBps)}</dd>
                      <dt>fixedFee (bps, on-chain / 100)</dt>
                      <dd>{formatBpsDisplay(row.fixedFeeBps)}</dd>
                      <dt>Odds for yes</dt>
                      <dd>
                        <code>{row.oddsYesPercent}</code>
                        <span className="mexican-pricer-odds-hint">
                          {' '}
                          (oddsForYes / (oddsForYes + oddsForNo))
                        </span>
                      </dd>
                      <dt>gasPenaltyFixed (bps, on-chain / 100)</dt>
                      <dd>{formatBpsDisplay(row.gasPenaltyFixedBps)}</dd>
                      <dt>gasPenaltyCutoff (gwei, on-chain / 1e9)</dt>
                      <dd>{formatGweiDisplay(row.gasPenaltyCutoffGwei)}</dd>
                      <dt>gasPenaltySlope (bps per 0.001 gwei, on-chain / 100)</dt>
                      <dd>{formatBpsPer001GweiDisplay(row.gasPenaltySlopeBpsPer001Gwei)}</dd>
                      <dt>antiP (bps, on-chain / 100)</dt>
                      <dd>{formatBpsDisplay(row.antiPBps)}</dd>
                      <dt>antiPThreshold ($)</dt>
                      <dd>{row.antiPThresholdUsd}</dd>
                    </dl>
                  </section>
                );
              })}
          </div>

          <h2 className="config-section-heading">Useful addresses</h2>
          <dl className="curve-dl useful-addresses-dl">
            <dt>WETH</dt>
            <dd>
              <code>{TOKENS.weth}</code>
            </dd>
            <dt>cbbtc</dt>
            <dd>
              <code>{TOKENS.cbbtc}</code>
            </dd>
            <dt>virtual</dt>
            <dd>
              <code>{TOKENS.virtual}</code>
            </dd>
            <dt>SwapImplV2</dt>
            <dd>
              <code>{SWAP_IMPL_V2_ADDRESS}</code>
            </dd>
            <dt>QuoteImpl</dt>
            <dd>
              <code>{QUOTE_IMPL_ADDRESS}</code>
            </dd>
            <dt>PropAMMWrapper</dt>
            <dd>
              <code>{PROP_AMM_WRAPPER_ADDRESS}</code>
            </dd>
            <dt>Circuit breaker</dt>
            <dd>
              <code>{CIRCUIT_BREAKER_ADDRESS}</code>
            </dd>
            <dt>kyberswap</dt>
            <dd>
              <code>{KYBERSWAP_AGGREGATOR_ADDRESS}</code>
            </dd>
            <dt>0x normal</dt>
            <dd>
              <code>{ZEROX_NORMAL_AGGREGATOR_ADDRESS}</code>
            </dd>
            <dt>okx</dt>
            <dd>
              <code>{OKX_AGGREGATOR_ADDRESS}</code>
            </dd>
            <dt>WhitelistSigners</dt>
            <dd>
              <code>{WHITELIST_SIGNERS_ADDRESS}</code>
            </dd>
            <dt>SanityPnl</dt>
            <dd>
              <code>{SANITY_PNL_ADDRESS}</code>
            </dd>
            <dt>unisig</dt>
            <dd>
              <a
                className="config-useful-link"
                href={UNISIG_SAFE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {UNISIG_ADDRESS}
              </a>
            </dd>
            <dt>Imbalance Update role</dt>
            <dd>
              <code>{IMBALANCE_UPDATE_ROLE}</code>
            </dd>
          </dl>

          <h2 className="config-section-heading">ABIs</h2>
          <p className="config-abi-hint">
            Click a contract name to copy its ABI as JSON to the clipboard.
          </p>
          <ul className="config-abi-list">
            {REFERENCE_ABIS_FOR_COPY.map(({ name, abi }) => (
              <li key={name}>
                <button
                  type="button"
                  className="config-abi-btn"
                  onClick={() => handleCopyAbi(name, abi)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
          {abiCopyMessage ? (
            <p className="config-abi-toast" role="status">
              {abiCopyMessage}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export default Configuration;
