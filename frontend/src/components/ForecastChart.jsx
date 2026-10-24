import React, { useState, useMemo } from 'react';

export default function ForecastChart({ periods, targetDate }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showErrorArea, setShowErrorArea] = useState(true);

  // SVG Chart Dimensions
  const width = 1100;
  const height = 400;
  const padding = { top: 30, right: 30, bottom: 50, left: 75 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute maximum MW for scale
  const maxMw = useMemo(() => {
    let maxVal = 1000;
    periods.forEach((p) => {
      if (p.actual_mw !== null && p.actual_mw > maxVal) maxVal = p.actual_mw;
      if (p.forecast_mw !== null && p.forecast_mw > maxVal) maxVal = p.forecast_mw;
    });
    return Math.ceil((maxVal * 1.15) / 1000) * 1000;
  }, [periods]);

  // Coordinate mappers
  const getX = (sp) => padding.left + ((sp - 1) / (periods.length - 1 || 1)) * chartWidth;
  const getY = (val) => padding.top + chartHeight - (val / maxMw) * chartHeight;

  // Build SVG paths for Actual and Forecast lines
  const { actualPath, forecastPath, areaPath } = useMemo(() => {
    let actD = '';
    let fcD = '';
    const validPairs = [];

    periods.forEach((p) => {
      const x = getX(p.settlement_period);

      if (p.actual_mw !== null) {
        const yAct = getY(p.actual_mw);
        actD += `${actD ? ' L' : 'M'} ${x} ${yAct}`;
      }

      if (p.forecast_mw !== null) {
        const yFc = getY(p.forecast_mw);
        fcD += `${fcD ? ' L' : 'M'} ${x} ${yFc}`;
      }

      if (p.actual_mw !== null && p.forecast_mw !== null) {
        validPairs.push({ x, yAct: getY(p.actual_mw), yFc: getY(p.forecast_mw) });
      }
    });

    let areaD = '';
    if (validPairs.length > 0) {
      areaD = `M ${validPairs[0].x} ${validPairs[0].yAct}`;
      for (let i = 1; i < validPairs.length; i++) {
        areaD += ` L ${validPairs[i].x} ${validPairs[i].yAct}`;
      }
      for (let i = validPairs.length - 1; i >= 0; i--) {
        areaD += ` L ${validPairs[i].x} ${validPairs[i].yFc}`;
      }
      areaD += ' Z';
    }

    return { actualPath: actD, forecastPath: fcD, areaPath: areaD };
  }, [periods, maxMw]);

  const yTicks = [0, maxMw * 0.25, maxMw * 0.5, maxMw * 0.75, maxMw];
  const xTicks = [1, 6, 12, 18, 24, 30, 36, 42, 48];

  const activePeriod = hoveredIndex !== null ? periods[hoveredIndex] : null;

  return (
    <div className="card" style={{ marginBottom: '1.25rem', position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Day-Ahead Wind Generation vs. Actual Output
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            48 Half-Hourly Settlement Periods • Delivery Date: {targetDate}
          </p>
        </div>

        {/* Legend & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-actual)', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Actual (FUELHH)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-forecast)', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Forecast (WINDFOR)</span>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.825rem',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={showErrorArea}
              onChange={(e) => setShowErrorArea(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>Error Delta Band</span>
          </label>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '650px' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Background Grid Lines */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-subtle)"
                  fontSize="11"
                  className="mono"
                  fontWeight="500"
                >
                  {tick.toLocaleString()} MW
                </text>
              </g>
            );
          })}

          {/* X Axis & Ticks */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {xTicks.map((sp) => {
            const x = getX(sp);
            const hour = Math.floor((sp - 1) / 2);
            const min = (sp - 1) % 2 === 0 ? '00' : '30';
            return (
              <g key={sp}>
                <line
                  x1={x}
                  y1={padding.top + chartHeight}
                  x2={x}
                  y2={padding.top + chartHeight + 6}
                  stroke="#cbd5e1"
                />
                <text
                  x={x}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="11"
                  className="mono"
                  fontWeight="600"
                >
                  SP {sp}
                </text>
                <text
                  x={x}
                  y={padding.top + chartHeight + 34}
                  textAnchor="middle"
                  fill="var(--text-subtle)"
                  fontSize="9.5"
                  className="mono"
                >
                  {`${hour.toString().padStart(2, '0')}:${min}`}
                </text>
              </g>
            );
          })}

          {/* Shaded Error Delta Area */}
          {showErrorArea && areaPath && (
            <path
              d={areaPath}
              fill="rgba(225, 29, 72, 0.08)"
              stroke="none"
              style={{ transition: 'opacity 0.25s ease' }}
            />
          )}

          {/* Forecast WINDFOR Line */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="var(--accent-forecast)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Actual FUELHH Line */}
          {actualPath && (
            <path
              d={actualPath}
              fill="none"
              stroke="var(--accent-actual)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Hover Columns & Crosshairs */}
          {periods.map((p, idx) => {
            const x = getX(p.settlement_period);
            const colWidth = chartWidth / periods.length;
            const isHovered = hoveredIndex === idx;

            return (
              <g key={p.settlement_period}>
                <rect
                  x={x - colWidth / 2}
                  y={padding.top}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                />

                {isHovered && (
                  <>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + chartHeight}
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    {p.actual_mw !== null && (
                      <circle
                        cx={x}
                        cy={getY(p.actual_mw)}
                        r="5.5"
                        fill="var(--accent-actual)"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                    )}

                    {p.forecast_mw !== null && (
                      <circle
                        cx={x}
                        cy={getY(p.forecast_mw)}
                        r="5.5"
                        fill="var(--accent-forecast)"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Tooltip Detail Box */}
      {activePeriod && (
        <div style={{
          marginTop: '0.85rem',
          padding: '0.85rem 1.15rem',
          background: '#ffffff',
          border: '1px solid var(--border-strong)',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span className="badge badge-blue">SP {activePeriod.settlement_period}</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Delivery Half-Hour: {new Date(activePeriod.start_time_utc).toISOString().substring(11, 16)} – {new Date(activePeriod.end_time_utc).toISOString().substring(11, 16)} UTC
              </span>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
              Forecast Published: {activePeriod.forecast_publish_time_utc ? new Date(activePeriod.forecast_publish_time_utc).toUTCString().replace('GMT', 'UTC') : 'Missing'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--accent-actual)', textTransform: 'uppercase', fontWeight: 600 }}>Actual (FUELHH)</div>
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {activePeriod.actual_mw !== null ? `${activePeriod.actual_mw.toLocaleString()} MW` : 'MISSING'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--accent-forecast)', textTransform: 'uppercase', fontWeight: 600 }}>Day-Ahead Forecast</div>
              <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {activePeriod.forecast_mw !== null ? `${activePeriod.forecast_mw.toLocaleString()} MW` : 'MISSING'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--accent-error)', textTransform: 'uppercase', fontWeight: 600 }}>Error (fc - act)</div>
              <div className="mono" style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: activePeriod.error_mw !== null ? (activePeriod.error_mw > 0 ? 'var(--accent-error)' : 'var(--primary)') : 'var(--text-subtle)'
              }}>
                {activePeriod.error_mw !== null ? `${activePeriod.error_mw > 0 ? '+' : ''}${activePeriod.error_mw.toFixed(1)} MW` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
