import React, { useState } from 'react';
import { Info, HelpCircle, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CutoffExplainer({ cutoffTimeUtc, cutoffDescription }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      background: 'rgba(31, 41, 55, 0.4)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      marginBottom: '1.25rem',
      fontSize: '0.85rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#93c5fd' }}>
          <Info size={16} />
          <span style={{ fontWeight: 600 }}>Decision Cutoff & Look-Ahead Bias Prevention:</span>
          <span className="mono" style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>
            {cutoffTimeUtc ? new Date(cutoffTimeUtc).toUTCString().replace('GMT', 'UTC') : 'Loading...'}
          </span>
        </div>

        <button style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          lineHeight: '1.6'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Trading Decision Rule:</strong> {cutoffDescription}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6ee7b7', fontWeight: 600, marginBottom: '0.25rem' }}>
                <CheckCircle2 size={14} />
                <span>Eligible Forecasts (Included)</span>
              </div>
              <p style={{ fontSize: '0.775rem' }}>
                Only forecast runs published on or before the cutoff time (e.g. 16:30 UTC D-1) are eligible. For each delivery half-hour, the latest eligible publication is used.
              </p>
            </div>

            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fda4af', fontWeight: 600, marginBottom: '0.25rem' }}>
                <AlertCircle size={14} />
                <span>Intraday Forecasts (Excluded)</span>
              </div>
              <p style={{ fontSize: '0.775rem' }}>
                Forecasts published after the decision time (e.g., 21:00 UTC D-1 or day-of runs) are discarded. Including them would introduce <em>look-ahead bias</em>, falsely exaggerating day-ahead accuracy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
