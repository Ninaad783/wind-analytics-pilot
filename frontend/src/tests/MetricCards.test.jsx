import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricCards from '../components/MetricCards';

describe('MetricCards Component', () => {
  const mockMetrics = {
    mae_mw: 22.5,
    rmse_mw: 28.7,
    bias_mw: 12.5,
    mape_percent: 7.2,
    total_actual_mwh: 350.0,
    total_forecast_mwh: 375.0,
    total_periods: 48,
    valid_periods: 48,
    missing_actual_count: 0,
    missing_forecast_count: 0,
    data_quality_score: 100.0,
    bias_interpretation: 'Minimal systematic bias.'
  };

  it('renders MAE, RMSE, and Bias values accurately', () => {
    render(<MetricCards metrics={mockMetrics} />);

    expect(screen.getByText('22.5')).toBeInTheDocument();
    expect(screen.getByText('28.7')).toBeInTheDocument();
    expect(screen.getByText('+12.5')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays over-forecasting badge when bias is significantly positive', () => {
    const overFcMetrics = {
      ...mockMetrics,
      bias_mw: 450.0
    };
    render(<MetricCards metrics={overFcMetrics} />);

    expect(screen.getByText('Over-fc')).toBeInTheDocument();
    expect(screen.getByText('+450.0')).toBeInTheDocument();
  });

  it('displays under-forecasting badge when bias is significantly negative', () => {
    const underFcMetrics = {
      ...mockMetrics,
      bias_mw: -320.0
    };
    render(<MetricCards metrics={underFcMetrics} />);

    expect(screen.getByText('Under-fc')).toBeInTheDocument();
    expect(screen.getByText('-320.0')).toBeInTheDocument();
  });

  it('renders missing period warning when missing data exists', () => {
    const missingMetrics = {
      ...mockMetrics,
      valid_periods: 47,
      missing_actual_count: 1,
      data_quality_score: 97.92
    };
    render(<MetricCards metrics={missingMetrics} />);

    expect(screen.getByText(/1 missing act/i)).toBeInTheDocument();
    expect(screen.getByText('97.92%')).toBeInTheDocument();
  });
});
