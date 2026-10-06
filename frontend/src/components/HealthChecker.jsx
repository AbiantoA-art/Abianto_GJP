import React, { useState, useEffect } from 'react';
import { checkApiHealth } from '../services/api';

export const HealthChecker = () => {
  const [healthState, setHealthState] = useState({
    loading: true,
    data: null,
    raw: null,
    latencyMs: null,
    success: false,
    error: null,
    statusCode: null,
    lastChecked: null,
  });

  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const performCheck = async () => {
    setHealthState((prev) => ({ ...prev, loading: true }));
    const result = await checkApiHealth();
    setHealthState({
      loading: false,
      data: result.data || null,
      raw: result.raw || null,
      latencyMs: result.latencyMs,
      success: result.success,
      error: result.error || null,
      statusCode: result.statusCode,
      lastChecked: new Date().toLocaleTimeString(),
    });
  };

  useEffect(() => {
    performCheck();
  }, []);

  const handleCopy = () => {
    if (!healthState.raw) return;
    navigator.clipboard.writeText(JSON.stringify(healthState.raw, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel health-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon cyan-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <h3 className="card-title">Live Backend Health & Connectivity</h3>
            <p className="card-caption">Continuous diagnostic link with Express REST API</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={performCheck}
            disabled={healthState.loading}
            className="action-btn"
            title="Ping Health API"
          >
            <svg
              className={`btn-icon ${healthState.loading ? 'spin' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            {healthState.loading ? 'Pinging...' : 'Ping API'}
          </button>
        </div>
      </div>

      <div className="health-grid">
        {/* API Status Item */}
        <div className="stat-box">
          <span className="stat-label">API Status</span>
          <div className="stat-value-group">
            <span
              className={`status-chip ${
                healthState.loading
                  ? 'chip-pending'
                  : healthState.success
                  ? 'chip-online'
                  : 'chip-offline'
              }`}
            >
              <span className="chip-dot"></span>
              {healthState.loading ? 'Checking...' : healthState.success ? 'Online & Healthy' : 'Offline'}
            </span>
          </div>
          <span className="stat-footnote">
            {healthState.statusCode ? `HTTP ${healthState.statusCode}` : 'Endpoint: /api/health'}
          </span>
        </div>

        {/* Latency Item */}
        <div className="stat-box">
          <span className="stat-label">Response Latency</span>
          <div className="stat-value-group">
            <span className="metric-number">
              {healthState.latencyMs !== null ? `${healthState.latencyMs} ms` : '--'}
            </span>
          </div>
          <span className="stat-footnote">Round-trip benchmark</span>
        </div>

        {/* Database Status Item */}
        <div className="stat-box">
          <span className="stat-label">MySQL Database Foundation</span>
          <div className="stat-value-group">
            <span
              className={`status-chip ${
                healthState.data?.database?.connected ? 'chip-online' : 'chip-warning'
              }`}
            >
              <span className="chip-dot"></span>
              {healthState.data?.database?.connected
                ? 'Connected'
                : healthState.data?.database?.configured
                ? 'Configured (Pool Ready)'
                : 'Pending Configuration'}
            </span>
          </div>
          <span className="stat-footnote">
            {healthState.data?.database?.details || 'Phase 04 Schema Planned'}
          </span>
        </div>

        {/* Environment Item */}
        <div className="stat-box">
          <span className="stat-label">Server Environment</span>
          <div className="stat-value-group">
            <span className="metric-text">
              {healthState.data?.environment?.toUpperCase() || 'DEVELOPMENT'}
            </span>
          </div>
          <span className="stat-footnote">
            Uptime: {healthState.data?.uptimeSeconds !== undefined ? `${healthState.data.uptimeSeconds}s` : '--'}
          </span>
        </div>
      </div>

      {healthState.error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Connection Warning: {healthState.error}. Ensure backend is running at http://localhost:5000.</span>
        </div>
      )}

      {/* Raw JSON toggle */}
      <div className="raw-response-wrapper">
        <div className="raw-header">
          <button
            className="toggle-raw-btn"
            onClick={() => setShowRaw(!showRaw)}
          >
            <span>{showRaw ? '▾ Hide' : '▸ View'} Raw Health Payload</span>
            <span className="endpoint-tag">GET /api/health</span>
          </button>

          {showRaw && healthState.raw && (
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy JSON'}
            </button>
          )}
        </div>

        {showRaw && healthState.raw && (
          <pre className="json-viewer">
            <code>{JSON.stringify(healthState.raw, null, 2)}</code>
          </pre>
        )}
      </div>

      {healthState.lastChecked && (
        <div className="card-footer-info">
          <span>Last pinged: {healthState.lastChecked}</span>
        </div>
      )}
    </div>
  );
};
