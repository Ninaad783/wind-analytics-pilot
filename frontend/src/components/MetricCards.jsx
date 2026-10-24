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
        <div className="card card-hoverable">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mean Absolute Error (MAE)
            </span>
            <div style={{ background: '#eff6ff', padding: '0.35rem', borderRadius: '7px' }}>
              <Activity size={16} color="var(--primary)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mono" style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {mae_mw !== null ? mae_mw.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Average absolute error: <code className="mono" style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>mean(|fc - act|)</code>
          </p>
        </div>

        {/* RMSE Card */}
        <div className="card card-hoverable">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Root Mean Squared Error
            </span>
            <div style={{ background: '#f5f3ff', padding: '0.35rem', borderRadius: '7px' }}>
              <Gauge size={16} color="#7c3aed" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mono" style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {rmse_mw !== null ? rmse_mw.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Penalizes large outlier misses: <code className="mono" style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>sqrt(mean(e²))</code>
          </p>
        </div>

        {/* Forecast Bias Card */}
        <div className="card card-hoverable">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Forecast Bias (Mean Error)
            </span>
            <div style={{
              background: isOverForecasting ? '#fff1f2' : (isUnderForecasting ? '#eff6ff' : '#ecfdf5'),
              padding: '0.35rem',
              borderRadius: '7px'
            }}>
              {isOverForecasting ? (
                <TrendingUp size={16} color="var(--accent-error)" />
              ) : isUnderForecasting ? (
                <TrendingDown size={16} color="var(--primary)" />
              ) : (
                <CheckCircle size={16} color="var(--accent-actual)" />
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="mono" style={{
              fontSize: '1.9rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: isOverForecasting ? 'var(--accent-error)' : (isUnderForecasting ? 'var(--primary)' : 'var(--accent-actual)')
            }}>
              {bias_mw !== null ? (bias_mw > 0 ? `+${bias_mw.toFixed(1)}` : bias_mw.toFixed(1)) : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>MW</span>
            <span className={`badge ${isOverForecasting ? 'badge-red' : (isUnderForecasting ? 'badge-blue' : 'badge-green')}`} style={{ marginLeft: 'auto' }}>
              {isOverForecasting ? 'Over-fc' : (isUnderForecasting ? 'Under-fc' : 'Balanced')}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Sign: <code className="mono" style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>mean(forecast - actual)</code>
          </p>
        </div>

        {/* Energy & Quality Card */}
        <div className="card card-hoverable">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Data Quality &amp; Volume
            </span>
            <div style={{ background: '#ecfdf5', padding: '0.35rem', borderRadius: '7px' }}>
              <Zap size={16} color="var(--accent-actual)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <span className="mono" style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {data_quality_score !== null ? `${data_quality_score}%` : '—'}
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {valid_periods}/{total_periods} periods matched
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--accent-actual)' }}>
                Act: {total_actual_mwh ? total_actual_mwh.toLocaleString() : '0'} MWh
              </div>
              <div style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--accent-forecast)' }}>
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
          marginTop: '0.85rem',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '0.75rem 1.15rem',
          fontSize: '0.825rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Commercial Impact:</span>
          <span style={{ lineHeight: '1.5' }}>{bias_interpretation}</span>
        </div>
      )}
    </div>
  );
}
