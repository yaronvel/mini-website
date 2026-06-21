import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

function computeYDomain(series) {
  const vals = series
    .map((d) => d.mtm)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (vals.length === 0) return [0, 1];
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  if (minV === maxV) {
    const pad =
      Math.abs(minV) < 1e-15
        ? 1e-6
        : Math.max(Math.abs(minV) * 0.15, 1e-9);
    return [minV - pad, maxV + pad];
  }
  const span = maxV - minV;
  const pad = Math.max(span * 0.1, 1e-12);
  return [minV - pad, maxV + pad];
}

const DOT_RED = '#ef4444';
const DOT_GREEN = '#22c55e';

function valueFill(v) {
  if (typeof v === 'number' && Number.isFinite(v) && v < 0) return DOT_RED;
  return DOT_GREEN;
}

function formatUsd(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  const sign = v >= 0 ? '+' : '';
  return `${sign}$${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function renderMtmDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={valueFill(payload?.mtm)}
      stroke="rgba(0, 0, 0, 0.35)"
      strokeWidth={0.5}
    />
  );
}

function renderMtmActiveDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={valueFill(payload?.mtm)}
      stroke="rgba(255, 255, 255, 0.55)"
      strokeWidth={1}
    />
  );
}

function MtmTooltip({ active, payload }) {
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload;
  return (
    <div className="mtm-hourly-tooltip">
      <div className="mtm-hourly-tooltip-label">{row.label}</div>
      <div className="mtm-hourly-tooltip-row">
        <span>Total</span>
        <span>{formatUsd(row.mtm)}</span>
      </div>
      <div className="mtm-hourly-tooltip-row">
        <span>PropAMM</span>
        <span>{formatUsd(row.propAmm)}</span>
      </div>
      <div className="mtm-hourly-tooltip-row">
        <span>VT</span>
        <span>{formatUsd(row.vt)}</span>
      </div>
      <div className="mtm-hourly-tooltip-row">
        <span>Mainnet</span>
        <span>{formatUsd(row.mainnet)}</span>
      </div>
    </div>
  );
}

export function MtmHourlyChart({ hourlySeries }) {
  const yDomain = useMemo(
    () => computeYDomain(hourlySeries ?? []),
    [hourlySeries]
  );

  if (!hourlySeries?.some((d) => d.mtm != null)) return null;

  function xTickLabel(slot) {
    if (slot === 23) return '1→now';
    return `${24 - slot}→${23 - slot}h`;
  }

  const span = yDomain[1] - yDomain[0];
  const yTickFormat = (v) => {
    if (!Number.isFinite(v)) return '';
    const av = Math.abs(v);
    if (av >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (av >= 1e3) return `${(v / 1e3).toFixed(2)}k`;
    if (span < 10 && av < 10) return v.toFixed(3);
    return v.toFixed(1);
  };

  return (
    <div className="mtm-hourly-chart-wrap">
      <p className="mtm-hourly-chart-caption">Hourly MTM last 24h</p>
      <ResponsiveContainer width="100%" height={240} minHeight={240}>
        <LineChart
          data={hourlySeries}
          margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="slot"
            domain={[0, 23]}
            ticks={[0, 4, 8, 12, 16, 20, 23]}
            tickFormatter={xTickLabel}
            stroke="rgba(255,255,255,0.45)"
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 10 }}
          />
          <YAxis
            domain={yDomain}
            allowDataOverflow={false}
            stroke="rgba(255,255,255,0.45)"
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }}
            tickFormatter={yTickFormat}
            width={56}
          />
          {yDomain[0] < 0 && yDomain[1] > 0 && (
            <ReferenceLine
              y={0}
              stroke="#facc15"
              strokeWidth={2}
              strokeDasharray="6 5"
            />
          )}
          <Tooltip content={<MtmTooltip />} />
          <Line
            type="monotone"
            dataKey="mtm"
            stroke="#64748b"
            strokeWidth={2}
            dot={renderMtmDot}
            activeDot={renderMtmActiveDot}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
