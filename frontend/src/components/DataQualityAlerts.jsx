import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function DataQualityAlerts({ metrics, warnings }) {
  const hasMissing = metrics && (metrics.missing_actual_count > 0 || metrics.missing_forecast_count > 0);
  const hasWarnings = warnings && warnings.length > 0;

  if (!hasMissing && !hasWarnings) return null;

  return (
    <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {hasMissing && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#fcd34d',
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontWeight: 600 }}>Data Quality Flag:</strong> Detected{' '}
            {metrics.missing_actual_count} settlement period(s) with missing actual generation and{' '}
            {metrics.missing_forecast_count} period(s) with missing forecast.
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
              Missing periods are excluded from MAE and RMSE metrics and are <strong>never</strong> coerced to zero.
            </span>
          </div>
        </div>
      )}

      {hasWarnings && warnings.map((warn, i) => (
        <div key={i} style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#93c5fd',
          fontSize: '0.85rem'
        }}>
          <Info size={18} style={{ flexShrink: 0 }} />
          <div>{warn}</div>
        </div>
      ))}
    </div>
  );
}
