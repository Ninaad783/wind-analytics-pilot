import React, { useState } from 'react';
import { Download, Filter, Search, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export default function SettlementTable({ periods, targetDate }) {
  const [filter, setFilter] = useState('ALL');
  const [searchSp, setSearchSp] = useState('');

  const filteredPeriods = periods.filter((p) => {
    if (searchSp && !p.settlement_period.toString().includes(searchSp)) {
      return false;
    }
    if (filter === 'VALID') return p.is_valid_pair;
    if (filter === 'MISSING') return !p.is_valid_pair;
    if (filter === 'HIGH_ERROR') return p.abs_error_mw !== null && p.abs_error_mw > 1000.0;
    return true;
  });

  const exportCsv = () => {
    const headers = [
      'SettlementDate',
      'SettlementPeriod',
      'StartTimeUTC',
      'EndTimeUTC',
      'ActualGenerationMW',
      'DayAheadForecastMW',
      'ForecastPublishTimeUTC',
      'ErrorMW',
      'AbsoluteErrorMW',
      'QualityFlags'
    ];

    const rows = periods.map((p) => [
      p.settlement_date,
      p.settlement_period,
      p.start_time_utc,
      p.end_time_utc,
      p.actual_mw ?? '',
      p.forecast_mw ?? '',
      p.forecast_publish_time_utc ?? '',
      p.error_mw ?? '',
      p.abs_error_mw ?? '',
      p.data_quality_flags.join(';')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `uk_wind_analysis_${targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
            Settlement Period Granular Audit Table
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredPeriods.length} of {periods.length} half-hourly settlement intervals
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search by SP */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Filter SP (1-48)..."
              value={searchSp}
              onChange={(e) => setSearchSp(e.target.value)}
              className="text-input"
              style={{ width: '130px', paddingLeft: '1.75rem', fontSize: '0.775rem' }}
            />
            <Search size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          </div>

          {/* Quick Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="select-input"
            style={{ fontSize: '0.775rem' }}
          >
            <option value="ALL">All Periods (48)</option>
            <option value="VALID">Valid Complete Pairs</option>
            <option value="MISSING">Missing Telemetry</option>
            <option value="HIGH_ERROR">High Deviation (&gt; 1000 MW)</option>
          </select>

          {/* CSV Export */}
          <button onClick={exportCsv} className="btn btn-secondary" style={{ fontSize: '0.775rem' }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SP</th>
              <th>Delivery Window (UTC)</th>
              <th>Publish Time (UTC)</th>
              <th>Actual (FUELHH)</th>
              <th>Forecast (WINDFOR)</th>
              <th>Error (MW)</th>
              <th>Abs Error (MW)</th>
              <th>Status Flags</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeriods.map((p) => {
              const startStr = new Date(p.start_time_utc).toISOString().substring(11, 16);
              const endStr = new Date(p.end_time_utc).toISOString().substring(11, 16);
              const pubStr = p.forecast_publish_time_utc
                ? new Date(p.forecast_publish_time_utc).toISOString().replace('T', ' ').substring(0, 16)
                : '—';

              return (
                <tr key={p.settlement_period}>
                  <td className="mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    SP {p.settlement_period}
                  </td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>
                    {startStr} – {endStr}
                  </td>
                  <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    {pubStr}
                  </td>
                  <td className="mono" style={{ fontWeight: 600, color: p.actual_mw !== null ? 'var(--accent-actual)' : 'var(--accent-error)' }}>
                    {p.actual_mw !== null ? `${p.actual_mw.toLocaleString()} MW` : 'MISSING'}
                  </td>
                  <td className="mono" style={{ fontWeight: 600, color: p.forecast_mw !== null ? 'var(--accent-forecast)' : 'var(--accent-error)' }}>
                    {p.forecast_mw !== null ? `${p.forecast_mw.toLocaleString()} MW` : 'MISSING'}
                  </td>
                  <td className="mono" style={{
                    fontWeight: 600,
                    color: p.error_mw !== null ? (p.error_mw > 0 ? 'var(--accent-error)' : '#93c5fd') : 'var(--text-subtle)'
                  }}>
                    {p.error_mw !== null ? `${p.error_mw > 0 ? '+' : ''}${p.error_mw.toFixed(1)}` : '—'}
                  </td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>
                    {p.abs_error_mw !== null ? p.abs_error_mw.toFixed(1) : '—'}
                  </td>
                  <td>
                    {p.is_valid_pair ? (
                      <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                        <CheckCircle size={10} /> Valid
                      </span>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                        <AlertTriangle size={10} /> {p.data_quality_flags[0] || 'Incomplete'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
