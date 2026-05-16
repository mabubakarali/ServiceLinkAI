// @ts-check
import React, { memo } from 'react';
import './App.css';
import { OrchestratorProvider, useOrchestrator } from './context/OrchestratorContext.jsx';
import { NetworkProvider, useNetwork } from './context/NetworkContext.jsx';
import { Sidebar as SidebarComponent } from './components/Sidebar.jsx';
import { TracePanel as TracePanelComponent } from './components/TracePanel.jsx';
import { MatchPanel as MatchPanelComponent } from './components/MatchPanel.jsx';
import { FeedbackOverlay as FeedbackOverlayComponent } from './components/FeedbackOverlay.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

// Memoize heavy panels to prevent re-renders from network ping updates
const Sidebar = memo(SidebarComponent);
const TracePanel = memo(TracePanelComponent);
const MatchPanel = memo(MatchPanelComponent);
const FeedbackOverlay = memo(FeedbackOverlayComponent);

function Dashboard() {
  const { state } = useOrchestrator();
  const { networkLatency } = useNetwork();
  const statusLabel = state?.status?.replace(/_/g, ' ') || 'INITIALIZING';

  return (
    <div className="app-shell">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>

      <main className="main-content" role="main">
        <header className="hero-bar" aria-label="Main Header">
          <div>
            <div className="hero-kicker">Competition Edition Command Center</div>
            <h2>Antigravity Reasoning Trace</h2>
            <p className="hero-copy">A premium orchestration surface for live agent reasoning, matching decisions, and recovery flows.</p>
          </div>

          <div className="hero-metrics" aria-label="System Metrics">
            <div className="hero-metric">
              <span>Status</span>
              <strong aria-live="polite">{statusLabel}</strong>
            </div>
            <div className="hero-metric">
              <span>Failures</span>
              <strong aria-live="polite">{state?.failures ?? 0}</strong>
            </div>
            <div className="hero-metric">
              <span>Network</span>
              <strong aria-live="polite" style={{ color: networkLatency > 100 ? 'var(--warning-orange)' : 'var(--accent-emerald)' }}>
                {networkLatency}ms
              </strong>
            </div>
          </div>
        </header>

        <ErrorBoundary>
          <TracePanel logs={state?.logs || []} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <MatchPanel rankedProviders={state?.rankedProviders || []} selectedProvider={state?.selectedProvider} />
        </ErrorBoundary>
      </main>

      <ErrorBoundary>
        <FeedbackOverlay 
          isVisible={state?.status === 'SERVICE_COMPLETED' || state?.status === 'FINISHED_ALL'} 
          feedbackProcessed={state?.feedbackProcessed} 
        />
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <OrchestratorProvider>
        <Dashboard />
      </OrchestratorProvider>
    </NetworkProvider>
  );
}
