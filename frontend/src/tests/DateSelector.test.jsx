import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateSelector from '../components/DateSelector';

describe('DateSelector Component', () => {
  const dates = ['2026-01-01', '2026-01-02', '2026-01-03'];

  it('renders dates and responds to selection changes', () => {
    const handleDateChange = vi.fn();
    const handleCutoffChange = vi.fn();

    render(
      <DateSelector
        availableDates={dates}
        selectedDate="2026-01-02"
        onDateChange={handleDateChange}
        cutoffHour={17}
        onCutoffChange={handleCutoffChange}
        isLoading={false}
      />
    );

    const select = screen.getByRole('combobox', { name: 'Select delivery date' });
    expect(select.value).toBe('2026-01-02');

    fireEvent.change(select, { target: { value: '2026-01-03' } });
    expect(handleDateChange).toHaveBeenCalledWith('2026-01-03');
  });

  it('triggers cutoff change handler', () => {
    const handleCutoffChange = vi.fn();

    render(
      <DateSelector
        availableDates={dates}
        selectedDate="2026-01-02"
        onDateChange={() => {}}
        cutoffHour={17}
        onCutoffChange={handleCutoffChange}
        isLoading={false}
      />
    );

    const cutoffSelect = screen.getByRole('combobox', { name: 'Select decision cutoff' });
    fireEvent.change(cutoffSelect, { target: { value: '12' } });
    expect(handleCutoffChange).toHaveBeenCalledWith(12);
  });
});
