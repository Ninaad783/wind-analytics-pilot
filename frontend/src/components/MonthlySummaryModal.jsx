import React, { useState, useEffect } from 'react';
import { X, Calendar, Activity, Zap, CheckCircle, ArrowRight } from 'lucide-react';
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
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              January 2026 Wind Generation Performance Summary
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Executive Aggregate: 31 Delivery Days • 1,488 Half-Hour Settlement Periods
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading January 2026 aggregates...
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--accent-error)', padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px' }}>
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
                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly MAE</div>
                  <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '0.25rem' }}>
                    {overall.mae_mw?.toFixed(1)} MW
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly RMSE</div>
                  <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '0.25rem' }}>
                    {overall.rmse_mw?.toFixed(1)} MW
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Bias</div>
                  <div className="mono" style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: overall.bias_mw > 0 ? 'var(--accent-error)' : '#93c5fd',
                    marginTop: '0.25rem'
                  }}>
                    {overall.bias_mw > 0 ? `+${overall.bias_mw.toFixed(1)}` : overall.bias_mw?.toFixed(1)} MW
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Generation</div>
                  <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-actual)', marginTop: '0.25rem' }}>
                    {(overall.total_actual_mwh / 1000).toFixed(1)} GWh
                  </div>
                </div>
              </div>

              {/* Daily Table */}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
                Daily Breakdown (Click to Inspect)
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
                        <td className="mono" style={{ color: row.bias_mw > 0 ? 'var(--accent-error)' : '#93c5fd' }}>
                          {row.bias_mw > 0 ? `+${row.bias_mw.toFixed(1)}` : row.bias_mw?.toFixed(1)}
                        </td>
                        <td className="mono" style={{ color: 'var(--accent-actual)' }}>
                          {row.total_actual_mwh?.toLocaleString()}
                        </td>
                        <td>
                          <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                            {row.quality_score}%
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 500 }}>
                            View <ArrowRight size={12} />
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
