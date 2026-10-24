import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { fetchMonthlySummary } from '../services/api';

export default function MonthlySummaryModal({ isOpen, onClose, onSelectDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !data) {
      setLoading(true);
      fetchMonthlySummary(2026, 1)
        .then((res) => {
          setData(res);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const overall = data?.overall_metrics;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem',
      animation: 'fadeIn 0.2s ease-in-out'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          background: '#f8fafc',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              January 2026 Wind Generation Performance Summary
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Executive Benchmark: 31 Delivery Days • 1,488 Half-Hour Settlement Periods
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.45rem', borderRadius: '50%', minWidth: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.75rem', overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading January 2026 aggregates...
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--accent-error)', padding: '1rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px' }}>
              {error}
            </div>
          )}

          {data && overall && (
            <>
              {/* Aggregated KPI Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Monthly MAE</div>
                  <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {overall.mae_mw?.toFixed(1)} MW
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Monthly RMSE</div>
                  <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {overall.rmse_mw?.toFixed(1)} MW
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Net Bias</div>
                  <div className="mono" style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: overall.bias_mw > 0 ? 'var(--accent-error)' : 'var(--primary)',
                    marginTop: '0.25rem'
                  }}>
                    {overall.bias_mw > 0 ? `+${overall.bias_mw.toFixed(1)}` : overall.bias_mw?.toFixed(1)} MW
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Generation</div>
                  <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-actual)', marginTop: '0.25rem' }}>
                    {(overall.total_actual_mwh / 1000).toFixed(1)} GWh
                  </div>
                </div>
              </div>

              {/* Daily Table */}
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Daily Breakdown (Click to Select)
              </h3>
              <div className="table-container" style={{ maxHeight: '350px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>MAE (MW)</th>
                      <th>RMSE (MW)</th>
                      <th>Bias (MW)</th>
                      <th>Actual (MWh)</th>
                      <th>Data Quality</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily_breakdown.map((row) => (
                      <tr
                        key={row.date}
                        onClick={() => {
                          onSelectDate(row.date);
                          onClose();
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {row.date}
                        </td>
                        <td className="mono">{row.mae_mw?.toFixed(1)}</td>
                        <td className="mono">{row.rmse_mw?.toFixed(1)}</td>
                        <td className="mono" style={{ color: row.bias_mw > 0 ? 'var(--accent-error)' : 'var(--primary)' }}>
                          {row.bias_mw > 0 ? `+${row.bias_mw.toFixed(1)}` : row.bias_mw?.toFixed(1)}
                        </td>
                        <td className="mono" style={{ color: 'var(--accent-actual)', fontWeight: 600 }}>
                          {row.total_actual_mwh?.toLocaleString()}
                        </td>
                        <td>
                          <span className="badge badge-green" style={{ fontSize: '0.675rem' }}>
                            {row.quality_score}%
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontSize: '0.785rem', fontWeight: 600 }}>
                            View <ArrowRight size={13} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
