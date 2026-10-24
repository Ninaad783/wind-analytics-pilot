import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ForecastChart from '../components/ForecastChart';

describe('ForecastChart Component', () => {
  const mockPeriods = [
    {
      settlement_date: '2026-01-15',
      settlement_period: 1,
      start_time_utc: '2026-01-15T00:00:00Z',
      end_time_utc: '2026-01-15T00:30:00Z',
      actual_mw: 8000.0,
      forecast_mw: 8200.0,
      forecast_publish_time_utc: '2026-01-14T16:30:00Z',
      error_mw: 200.0,
      abs_error_mw: 200.0,
      is_valid_pair: true,
      data_quality_flags: ['VALID_MATCHED_PAIR']
    },
    {
      settlement_date: '2026-01-15',
      settlement_period: 2,
      start_time_utc: '2026-01-15T00:30:00Z',
      end_time_utc: '2026-01-15T01:00:00Z',
      actual_mw: 8100.0,
      forecast_mw: 7900.0,
      forecast_publish_time_utc: '2026-01-14T16:30:00Z',
      error_mw: -200.0,
      abs_error_mw: 200.0,
      is_valid_pair: true,
      data_quality_flags: ['VALID_MATCHED_PAIR']
    }
  ];

  it('renders chart title, legends, and svg canvas', () => {
    render(<ForecastChart periods={mockPeriods} targetDate="2026-01-15" />);

    expect(screen.getByText('Day-Ahead Wind Generation vs. Actual Output')).toBeInTheDocument();
    expect(screen.getByText('Actual (FUELHH)')).toBeInTheDocument();
    expect(screen.getByText('Forecast (WINDFOR)')).toBeInTheDocument();
    expect(screen.getByText('Error Delta Band')).toBeInTheDocument();
  });
});
