import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DateSelector from './components/DateSelector';
import CutoffExplainer from './components/CutoffExplainer';
import MetricCards from './components/MetricCards';
import ForecastChart from './components/ForecastChart';
import SettlementTable from './components/SettlementTable';
import DataQualityAlerts from './components/DataQualityAlerts';
import MonthlySummaryModal from './components/MonthlySummaryModal';
import { fetchAvailableDates, fetchForecastAnalysis } from './services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [cutoffHour, setCutoffHour] = useState(17);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);

  // Initial load: fetch dates
  useEffect(() => {
    fetchAvailableDates()
      .then((res) => {
        setAvailableDates(res.available_dates || []);
        if (res.default_date) {
          setSelectedDate(res.default_date);
        }
      })
      .catch((err) => {
        console.error('Error fetching dates:', err);
        // Fallback default
        setAvailableDates(['2026-01-15']);
      });
  }, []);

  // Fetch forecast analysis on date/cutoff change
  const loadAnalysis = useCallback(async (dateToLoad, cutoffToApply) => {
    if (!dateToLoad) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchForecastAnalysis(dateToLoad, cutoffToApply, 0);
      setAnalysisData(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'Failed to load forecast analysis data.');
      setAnalysisData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalysis(selectedDate, cutoffHour);
  }, [selectedDate, cutoffHour, loadAnalysis]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        dataSource={analysisData?.data_source}
        onOpenMonthlySummary={() => setIsMonthlyModalOpen(true)}
      />

      <main className="container" style={{ flex: 1, paddingTop: '1.5rem', paddingBottom: '3rem' }}>
        {/* Controls */}
        <DateSelector
          availableDates={availableDates}
          selectedDate={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
          cutoffHour={cutoffHour}
          onCutoffChange={(h) => setCutoffHour(h)}
          isLoading={isLoading}
        />

        {/* Cutoff Explainer */}
        {analysisData && (
          <CutoffExplainer
            cutoffTimeUtc={analysisData.cutoff_time_utc}
            cutoffDescription={analysisData.cutoff_description}
          />
        )}

        {/* Data Quality & System Alerts */}
        {analysisData && (
          <DataQualityAlerts
            metrics={analysisData.metrics}
            warnings={analysisData.warnings}
          />
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem',
            color: 'var(--text-muted)',
            gap: '0.75rem'
          }}>
            <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>
              Retrieving settlement period generation telemetry &amp; evaluating day-ahead forecasts...
            </span>
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && !isLoading && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#fda4af', fontWeight: 600 }}>
              <AlertCircle size={20} />
              <span>Failed to Load Forecast Data</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
              {errorMessage}
            </p>
            <button
              onClick={() => loadAnalysis(selectedDate, cutoffHour)}
              className="btn btn-primary"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {/* Main Analytics View */}
        {!isLoading && analysisData && (
          <>
            <MetricCards metrics={analysisData.metrics} />
            <ForecastChart periods={analysisData.periods} targetDate={selectedDate} />
            <SettlementTable periods={analysisData.periods} targetDate={selectedDate} />
          </>
        )}
      </main>

      {/* Monthly Summary Modal */}
      <MonthlySummaryModal
        isOpen={isMonthlyModalOpen}
        onClose={() => setIsMonthlyModalOpen(false)}
        onSelectDate={(d) => setSelectedDate(d)}
      />

      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '1.5rem 0',
        textAlign: 'center',
        color: 'var(--text-subtle)',
        fontSize: '0.8rem',
        background: 'var(--bg-surface)'
      }}>
        <div className="container">
          UK Electricity Wind-Generation Forecasting Analytics Platform • Powered by Elexon BMRS FUELHH &amp; WINDFOR Datasets
        </div>
      </footer>
    </div>
  );
}
