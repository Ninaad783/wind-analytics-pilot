import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CutoffExplainer({ cutoffTimeUtc, cutoffDescription }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '0.85rem 1.15rem',
      marginBottom: '1.25rem',
      fontSize: '0.85rem',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div style={{
            background: '#eff6ff',
            color: 'var(--primary)',
            padding: '0.3rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Info size={16} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Decision Cutoff &amp; Zero Look-Ahead Bias:</span>
          <span className="mono" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
            {cutoffTimeUtc ? new Date(cutoffTimeUtc).toUTCString().replace('GMT', 'UTC') : 'Loading...'}
          </span>
        </div>

        <button style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'transform 0.2s ease'
        }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div style={{
          marginTop: '0.85rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          lineHeight: '1.6',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <p style={{ marginBottom: '0.65rem' }}>
            <strong style={{ color: 'var(--text-main)' }}>Decision Window Rule:</strong> {cutoffDescription}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.85rem',
            marginTop: '0.5rem'
          }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '9px',
              padding: '0.75rem 0.95rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 600, marginBottom: '0.25rem' }}>
                <CheckCircle2 size={15} color="#16a34a" />
                <span>Eligible Day-Ahead Forecasts (Included)</span>
              </div>
              <p style={{ fontSize: '0.785rem', color: '#14532d' }}>
                Only forecast runs published on or before the cutoff time (e.g. 16:30 UTC D-1) are eligible. For each delivery half-hour, the latest eligible publication is used.
              </p>
            </div>

            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '9px',
              padding: '0.75rem 0.95rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9f1239', fontWeight: 600, marginBottom: '0.25rem' }}>
                <AlertCircle size={15} color="#e11d48" />
                <span>Intraday Forecasts (Excluded)</span>
              </div>
              <p style={{ fontSize: '0.785rem', color: '#881337' }}>
                Forecasts published after the decision cutoff (e.g., 21:00 UTC D-1 or day-of updates) are discarded. Evaluating them would introduce <em>look-ahead bias</em>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
