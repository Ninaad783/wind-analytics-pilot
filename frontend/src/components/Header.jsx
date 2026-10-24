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
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.9rem',
        paddingBottom: '0.9rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #059669)',
            padding: '0.625rem',
            borderRadius: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <Wind size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
              UK Wind Generation Analytics
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Elexon BMRS <span style={{ color: 'var(--accent-actual)', fontWeight: 600 }}>FUELHH</span> vs <span style={{ color: 'var(--accent-forecast)', fontWeight: 600 }}>WINDFOR</span> Day-Ahead Purchasing
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#f8fafc',
            padding: '0.45rem 0.85rem',
            borderRadius: '9px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <Clock size={14} color="var(--primary)" />
            <span className="mono" style={{ fontWeight: 500 }}>{utcTime || 'Clock synchronizing...'}</span>
          </div>

          <div className={`badge ${dataSource?.includes('LIVE') ? 'badge-green' : 'badge-blue'}`}>
            <ShieldCheck size={12} />
            <span>{dataSource || 'BENCHMARK READY'}</span>
          </div>

          <button
            onClick={onOpenMonthlySummary}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
          >
            <BarChart3 size={15} color="var(--primary)" />
            <span>Jan 2026 Overview</span>
          </button>
        </div>
      </div>
    </header>
  );
}
