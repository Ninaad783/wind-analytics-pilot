import React, { useState, useEffect } from 'react';
import { Wind, Clock, ShieldCheck, BarChart3 } from 'lucide-react';

export default function Header({ dataSource, onOpenMonthlySummary }) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.875rem',
        paddingBottom: '0.875rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #10b981)',
            padding: '0.625rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
            <Wind size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              UK Wind Generation Forecasting
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Elexon BMRS <span style={{ color: 'var(--accent-actual)', fontWeight: 600 }}>FUELHH</span> vs <span style={{ color: 'var(--accent-forecast)', fontWeight: 600 }}>WINDFOR</span> Day-Ahead Decision Analytics
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-card)',
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <Clock size={14} color="var(--primary)" />
            <span className="mono">{utcTime || 'Clock synchronizing...'}</span>
          </div>

          <div className={`badge ${dataSource?.includes('LIVE') ? 'badge-green' : 'badge-blue'}`}>
            <ShieldCheck size={12} />
            <span>{dataSource || 'BENCHMARK READY'}</span>
          </div>

          <button
            onClick={onOpenMonthlySummary}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            <BarChart3 size={15} />
            <span>Jan 2026 Overview</span>
          </button>
        </div>
      </div>
    </header>
  );
}
