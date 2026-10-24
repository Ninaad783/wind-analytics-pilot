import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export default function DataQualityAlerts({ metrics, warnings }) {
  const hasMissing = metrics && (metrics.missing_actual_count > 0 || metrics.missing_forecast_count > 0);
  const hasWarnings = warnings && warnings.length > 0;

  if (!hasMissing && !hasWarnings) return null;

  return (
    <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {hasMissing && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#92400e',
          fontSize: '0.85rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontWeight: 600 }}>Data Quality Notification:</strong> Detected{' '}
            {metrics.missing_actual_count} settlement period(s) with missing actual generation and{' '}
            {metrics.missing_forecast_count} period(s) with missing forecast.
            <span style={{ color: '#78350f', marginLeft: '0.35rem' }}>
              Missing periods are excluded from MAE and RMSE metrics and are <strong>never</strong> coerced to zero.
            </span>
          </div>
        </div>
      )}

      {hasWarnings && warnings.map((warn, i) => (
        <div key={i} style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#1e40af',
          fontSize: '0.85rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>{warn}</div>
        </div>
      ))}
    </div>
  );
}
