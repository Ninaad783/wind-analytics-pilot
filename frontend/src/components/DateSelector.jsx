import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function DateSelector({
  availableDates,
  selectedDate,
  onDateChange,
  cutoffHour,
  onCutoffChange,
  isLoading
}) {
  const currentIndex = availableDates.indexOf(selectedDate);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < availableDates.length - 1 && currentIndex !== -1;

  const handlePrev = () => {
    if (hasPrev) onDateChange(availableDates[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onDateChange(availableDates[currentIndex + 1]);
  };

  const presets = [
    { label: 'Jan 15 (Benchmark Mid-Month)', date: '2026-01-15' },
    { label: 'Jan 08 (Missing Telemetry Test)', date: '2026-01-08' },
    { label: 'Jan 19 (Storm Ramp)', date: '2026-01-19' },
    { label: 'Jan 26 (Calm Lull)', date: '2026-01-26' },
  ];

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Date Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Calendar size={18} color="var(--primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>Delivery Date:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={handlePrev}
              disabled={!hasPrev || isLoading}
              className="btn btn-secondary"
              style={{ padding: '0.5rem', minWidth: '34px', opacity: hasPrev ? 1 : 0.4 }}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <select
              aria-label="Select delivery date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={isLoading}
              className="select-input mono"
              style={{ fontWeight: 600, minWidth: '150px' }}
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={handleNext}
              disabled={!hasNext || isLoading}
              className="btn btn-secondary"
              style={{ padding: '0.5rem', minWidth: '34px', opacity: hasNext ? 1 : 0.4 }}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Cutoff Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <SlidersHorizontal size={16} color="var(--accent-warning)" />
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>Decision Cutoff (D-1):</span>
          </div>

          <select
            aria-label="Select decision cutoff"
            value={cutoffHour}
            onChange={(e) => onCutoffChange(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="select-input"
            style={{ minWidth: '240px', fontWeight: 500 }}
          >
            <option value={17}>17:00 UTC (Day-Ahead Wholesale Close)</option>
            <option value={12}>12:00 UTC (Day-Ahead Exchange Auction)</option>
            <option value={14}>14:00 UTC (Bilateral Notification)</option>
            <option value={9}>09:00 UTC (Early Morning Run)</option>
          </select>
        </div>
      </div>

      {/* Preset Pills */}
      <div style={{
        marginTop: '0.9rem',
        paddingTop: '0.85rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          <Sparkles size={13} color="var(--primary)" />
          <span>Quick Scenarios:</span>
        </div>
        {presets.map((p) => {
          const isSelected = selectedDate === p.date;
          return (
            <button
              key={p.date}
              onClick={() => onDateChange(p.date)}
              disabled={isLoading}
              style={{
                background: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                border: `1px solid ${isSelected ? '#93c5fd' : 'var(--border-color)'}`,
                borderRadius: '7px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isSelected ? '0 1px 3px rgba(37, 99, 235, 0.12)' : 'none'
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
