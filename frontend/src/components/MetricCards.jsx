import React from 'react';
import { Activity, TrendingUp, TrendingDown, Gauge, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MetricCards({ metrics }) {
  if (!metrics) return null;

  const {
    mae_mw,
    rmse_mw,
    bias_mw,
    total_actual_mwh,
    total_forecast_mwh,
    valid_periods,
    total_periods,
    missing_actual_count,
    missing_forecast_count,
    data_quality_score,
    bias_interpretation
  } = metrics;

  const isOverForecasting = bias_mw !== null && bias_mw > 25.0;
  const isUnderForecasting = bias_mw !== null && bias_mw < -25.0;

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div className="grid-cols-4">
        {/* MAE Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Mean Absolute Error (MAE)
            </span>
            <Activity size={16} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>
              {mae_mw !== null ? mae_mw.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>MW</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.35rem' }}>
            Average absolute deviation per half-hour period: <code className="mono">mean(|fc - act|)</code>
          </p>
        </div>

        {/* RMSE Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Root Mean Squared Error (RMSE)
            </span>
            <Gauge size={16} color="#a855f7" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>
              {rmse_mw !== null ? rmse_mw.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>MW</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.35rem' }}>
            Penalizes large outlier forecast busts: <code className="mono">sqrt(mean((fc - act)²))</code>
          </p>
        </div>

        {/* Forecast Bias Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Forecast Bias (Mean Error)
            </span>
            {isOverForecasting ? (
              <TrendingUp size={16} color="var(--accent-error)" />
            ) : isUnderForecasting ? (
              <TrendingDown size={16} color="var(--accent-forecast)" />
            ) : (
              <CheckCircle size={16} color="var(--accent-actual)" />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="mono" style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: isOverForecasting ? 'var(--accent-error)' : (isUnderForecasting ? '#93c5fd' : 'var(--accent-actual)')
            }}>
              {bias_mw !== null ? (bias_mw > 0 ? `+${bias_mw.toFixed(1)}` : bias_mw.toFixed(1)) : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>MW</span>
            <span className={`badge ${isOverForecasting ? 'badge-red' : (isUnderForecasting ? 'badge-blue' : 'badge-green')}`} style={{ marginLeft: 'auto' }}>
              {isOverForecasting ? 'Over-fc' : (isUnderForecasting ? 'Under-fc' : 'Balanced')}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.35rem' }}>
            Sign: <code className="mono">mean(forecast - actual)</code>
          </p>
        </div>

        {/* Energy & Quality Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Data Quality & Volume
            </span>
            <Zap size={16} color="var(--accent-actual)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>
                {data_quality_score !== null ? `${data_quality_score}%` : '—'}
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {valid_periods}/{total_periods} periods matched
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-actual)' }}>
                Act: {total_actual_mwh ? total_actual_mwh.toLocaleString() : '0'} MWh
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-forecast)' }}>
                Fc: {total_forecast_mwh ? total_forecast_mwh.toLocaleString() : '0'} MWh
              </div>
            </div>
          </div>
          {(missing_actual_count > 0 || missing_forecast_count > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', color: 'var(--accent-warning)', fontSize: '0.7rem' }}>
              <AlertTriangle size={12} />
              <span>{missing_actual_count} missing act / {missing_forecast_count} missing fc</span>
            </div>
          )}
        </div>
      </div>

      {/* Commercial Interpretation Banner */}
      {bias_interpretation && (
        <div style={{
          marginTop: '0.75rem',
          background: 'rgba(17, 24, 39, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.625rem 1rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Commercial Impact:</span>
          <span>{bias_interpretation}</span>
        </div>
      )}
    </div>
  );
}
