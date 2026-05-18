// @ts-check
import React, { memo, useRef, useEffect, useState } from 'react';
import './App.css';
import { OrchestratorProvider, useOrchestrator } from './context/OrchestratorContext.jsx';
import { NetworkProvider, useNetwork } from './context/NetworkContext.jsx';
import { FeedbackOverlay as FeedbackOverlayComponent } from './components/FeedbackOverlay.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

const FeedbackOverlay = memo(FeedbackOverlayComponent);

// ─── TRACE PANEL (smart auto-scroll) ─────────────────────────────────────────
function TracePanel({ logs }) {
  const ref = useRef(null);
  const [locked, setLocked] = useState(false);   // true = user scrolled up, pause auto-scroll
  const [newCount, setNewCount] = useState(0);    // badge count while locked
  const prevLenRef = useRef(0);

  // Detect manual scroll up → lock auto-scroll
  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom) {
      setLocked(false);
      setNewCount(0);
    } else {
      setLocked(true);
    }
  };

  // When new logs arrive
  useEffect(() => {
    const added = logs.length - prevLenRef.current;
    prevLenRef.current = logs.length;
    if (added <= 0) return;

    if (locked) {
      // Don't scroll — just increment badge
      setNewCount(c => c + added);
    } else {
      // Auto-scroll to bottom
      if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs, locked]);

  const scrollToBottom = () => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    setLocked(false);
    setNewCount(0);
  };

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        className="trace-panel"
        ref={ref}
        role="log"
        aria-live="polite"
        aria-label="Agent reasoning trace"
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div className="trace-empty">
            <div className="trace-orb" aria-hidden="true" />
            <span>Awaiting orchestration — submit a request to begin</span>
          </div>
        ) : (
          logs.map((log, idx) => {
            const t = idx * 3;
            const conf = log.confidence || 0.98;
            const isSession = log.action === 'SESSION_ENDED';
            const isCard = log.trace?.includes('DECISION_CARD');
            return (
              <div key={idx} className={`trace-entry ${isSession ? 'trace-session' : isCard ? 'trace-card' : ''}`}>
                <div className="trace-meta">
                  <span className="trace-agent">{log.agent}</span>
                  <span className="trace-time">T+{t}s</span>
                  <span className={`trace-conf ${conf >= 0.7 ? 'ok' : 'warn'}`}>{(conf * 100).toFixed(0)}%</span>
                </div>
                <div className="trace-event">{log.action}</div>
                {log.toolUsed && <div className="trace-tool">{log.toolUsed}</div>}
                <div className="trace-body">{isCard ? log.trace.replace('DECISION_CARD:\n', '') : log.trace}</div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Floating "scroll to bottom" badge — appears when locked ── */}
      {locked && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to latest events"
          style={{
            position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: '#000', border: 'none', borderRadius: '999px',
            padding: '6px 16px', fontSize: '.75rem', fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', gap: '6px',
            animation: 'reveal-up .3s ease both', zIndex: 10,
            whiteSpace: 'nowrap'
          }}
        >
          ↓ {newCount > 0 ? `${newCount} new event${newCount > 1 ? 's' : ''}` : 'Latest'}
        </button>
      )}
    </div>
  );
}


// ─── LIFECYCLE STEPPER ────────────────────────────────────────────────────────
function Stepper({ steps, status }) {
  const activeIdx = Math.max(steps.findIndex(s => s.key === status), 0);
  return (
    <div className="stepper" role="list" aria-label="Workflow stages">
      {steps.map((step, i) => (
        <div key={step.key} role="listitem" className={`step ${i <= activeIdx ? 'step-done' : ''} ${i === activeIdx ? 'step-active' : ''}`}>
          <div className="step-dot" aria-hidden="true">{i < activeIdx ? '✓' : i + 1}</div>
          <div className="step-text">
            <div className="step-label">{step.label}</div>
            <div className="step-detail">{step.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROVIDER MATCH CARD ─────────────────────────────────────────────────────
function ProviderCard({ p, isSelected, idx }) {
  const scoreWidth = Math.min(Math.max(p.score, 0), 100);
  return (
    <div className={`pcard ${isSelected ? 'pcard-selected' : ''}`} style={{ animationDelay: `${idx * 60}ms` }} tabIndex="0">
      <div className="pcard-top">
        <div>
          <div className="pcard-name">{p.name} {isSelected && <span className="pcard-badge">Selected</span>}</div>
          <div className="pcard-sub">{p.location} · {p.category}</div>
        </div>
        <div className="pcard-score">{p.score}</div>
      </div>
      <div className="pcard-bar" aria-hidden="true"><div className="pcard-fill" style={{ width: `${scoreWidth}%` }} /></div>
      <div className="pcard-metrics">
        <span>{p.displayScores?.dist ?? p.baseDistance?.toFixed(1) ?? '?'} km</span>
        <span>{p.displayScores?.rate ?? p.rating?.toFixed(1) ?? '?'} ★</span>
        <span>Skill {p.displayScores?.skill ?? 'N/A'}</span>
        <span>Rel {p.displayScores?.rel ?? 'N/A'}</span>
        <span>Cancel {p.displayScores?.cancel ?? p.cancellationRate + '%'}</span>
      </div>
      <div className="pcard-reason">
        <strong>{isSelected ? '✓ Why selected' : '✗ Why rejected'}</strong>
        <span>{isSelected ? p.whySelected : p.whyRejected}</span>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard() {
  const { state, userInput, setUserInput, startOrchestration, simulateFailure, workflowSteps } = useOrchestrator();
  const { networkLatency } = useNetwork();
  const [mobileTab, setMobileTab] = useState('overview');

  const statusLabel = state?.status?.replace(/_/g, ' ') || 'IDLE';
  const isRunning = state?.status !== 'IDLE' && state?.status !== 'FINISHED_ALL' && state?.status !== 'AWAITING_USER_CLARIFICATION';
  const intent = state?.extractedIntent;
  const pricing = state?.pricing;
  const checklist = state?.dynamicChecklist;
  const showChecklist = checklist && ['SERVICE_STARTED', 'SERVICE_COMPLETED', 'FINISHED_ALL'].includes(state?.status);
  const ranked = state?.rankedProviders || [];
  const statusTone = state?.needsClarification ? 'warn' : state?.failures > 0 ? 'fail' : state?.status === 'FINISHED_ALL' ? 'ok' : 'neutral';
  const canInjectFailure = state?.failures === 0 && ['ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(state?.status);

  return (
    <div className="dash">
      {/* ── TOP BAR ── */}
      <header className="topbar" aria-label="ServiceLink AI Header">
        <div className="topbar-brand">
          <span className="topbar-icon" aria-hidden="true">⚙</span>
          <div>
            <div className="topbar-kicker">Service Orchestration OS</div>
            <h1 className="topbar-title">ServiceLink AI</h1>
          </div>
        </div>

        <div className="topbar-input-zone">
          <textarea
            className="top-input"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="Describe your service in Urdu, Roman Urdu, or English…"
            aria-label="Service request input"
            rows={2}
          />
        </div>

        <button
          className="btn-run"
          onClick={startOrchestration}
          disabled={isRunning}
          aria-label="Run orchestration"
        >
          ▶ Run
        </button>

        <div className="topbar-metrics" aria-label="System metrics">
          <div className="tmet">
            <span>Status</span>
            <strong className={`pill-${statusTone}`}>{statusLabel}</strong>
          </div>
          <div className="tmet">
            <span>Failures</span>
            <strong className={state?.failures > 0 ? 'pill-fail' : ''}>{state?.failures ?? 0}</strong>
          </div>
          <div className="tmet">
            <span>Network</span>
            <strong style={{ color: networkLatency > 100 ? '#f59e0b' : '#10b981' }}>{networkLatency}ms</strong>
          </div>
          <button
            className="btn-stress"
            onClick={simulateFailure}
            disabled={!canInjectFailure}
            aria-label="Stress test: inject provider cancellation"
            title="Stress Test — Simulate provider cancellation mid-booking"
          >
            ⚠ Simulate Cancellation
          </button>
        </div>
      </header>

      {/* ── MOBILE TAB BAR ── */}
      <nav className="mob-tabs" aria-label="Mobile navigation tabs">
        {[
          { id: 'overview', icon: '📋', label: 'Overview' },
          { id: 'trace',    icon: '🧠', label: 'Trace' },
          { id: 'match',    icon: '🏆', label: 'Providers' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`mob-tab ${mobileTab === tab.id ? 'mob-tab-active' : ''}`}
            onClick={() => setMobileTab(tab.id)}
            aria-label={tab.label}
            aria-selected={mobileTab === tab.id}
          >
            <span className="mob-tab-icon">{tab.icon}</span>
            <span className="mob-tab-label">{tab.label}</span>
            {tab.id === 'trace' && state?.logs?.length > 0 && (
              <span className="mob-tab-badge">{state.logs.length}</span>
            )}
            {tab.id === 'match' && ranked.length > 0 && (
              <span className="mob-tab-badge">{ranked.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ── MOBILE ONLY: Simulate Cancellation — between input and lifecycle ── */}
      <button
        className="btn-stress mob-cancel"
        onClick={simulateFailure}
        disabled={!canInjectFailure}
        aria-label="Stress test: inject provider cancellation"
      >
        ⚠ Simulate Cancellation
      </button>

      {/* ── BODY GRID ── */}
      <div className="body-grid">

        {/* ── COL 1: LIFECYCLE + INTENT + PRICING ── */}
        <aside className={`col-left ${mobileTab !== 'overview' ? 'mob-hidden' : ''}`} aria-label="Lifecycle and intent">
          <div className="panel" aria-labelledby="lifecycle-h">
            <div className="panel-hd">
              <h2 id="lifecycle-h">Lifecycle</h2>
              <span className={`pill pill-${statusTone}`}>{statusLabel}</span>
            </div>
            <div className="progress-bar" role="progressbar" aria-valuenow={state?.serviceProgress ?? 0} aria-valuemin="0" aria-valuemax="100">
              <div className="progress-fill" style={{ width: `${state?.serviceProgress ?? 0}%` }} />
            </div>
            <Stepper steps={workflowSteps} status={state?.status} />
          </div>

          {intent && (
            <div className="panel" aria-labelledby="intent-h">
              <div className="panel-hd"><h2 id="intent-h">Extracted Intent</h2></div>
              <div className="kv-grid">
                <span>Service</span><strong>{intent.service}</strong>
                <span>Urgency</span><strong>{intent.urgency}</strong>
                <span>Complexity</span>
                <strong className={intent.complexity === 'Complex' ? 'text-danger' : 'text-ok'}>{intent.complexity}</strong>
                <span>Location</span><strong>{intent.location}</strong>
                <span>Schedule</span>
                <strong>{intent.timeType === 'DEADLINE'
                  ? `Arrive ${intent.suggestedStartTime} (deadline ${intent.eventTime})`
                  : intent.eventTime || 'ASAP'}</strong>
                <span>Confidence</span>
                <strong className={intent.confidenceScores?.service >= 70 ? 'text-ok' : 'text-danger'}>
                  {intent.confidenceScores?.service ?? '?'}%
                </strong>
              </div>
            </div>
          )}

          {pricing && (
            <div className="panel" aria-labelledby="pricing-h">
              <div className="panel-hd"><h2 id="pricing-h">Pricing Breakdown</h2></div>
              <div className="kv-grid">
                <span>Base Rate</span><strong>Rs {pricing.base}</strong>
                <span>Travel</span><strong>Rs {pricing.travel}</strong>
                <span>Urgency Surge</span><strong className={pricing.urgency > 0 ? 'text-danger' : ''}>Rs {pricing.urgency}</strong>
                <span>Market Surge</span><strong className={pricing.surge > 0 ? 'text-danger' : ''}>Rs {pricing.surge}</strong>
                <span>Variance</span>
                <strong className={pricing.variance > 0 ? 'text-danger' : 'text-ok'}>
                  {pricing.variance > 0 ? '+' : ''}Rs {pricing.variance}
                </strong>
              </div>
              <div className="pricing-total">
                <span>Total</span>
                <strong>Rs {pricing.total}</strong>
              </div>
            </div>
          )}

          {showChecklist && (
            <div className="panel" aria-labelledby="qa-h">
              <div className="panel-hd"><h2 id="qa-h">Quality Audit</h2></div>
              <div className="checklist" role="list">
                {checklist.map((item, i) => (
                  <label key={i} className={`check-item ${item.completed ? 'check-done' : ''}`} role="listitem">
                    <span className="check-icon" aria-hidden="true">{item.completed ? '✓' : '○'}</span>
                    <span>{item.task}</span>
                  </label>
                ))}
              </div>
              <div className="geo-tag">📍 {intent?.location || 'Location verified'}</div>
            </div>
          )}
        </aside>

        {/* ── COL 2: TRACE PANEL ── */}
        <section className={`col-center panel ${mobileTab !== 'trace' ? 'mob-hidden' : ''}`} aria-labelledby="trace-h">
          <div className="panel-hd">
            <h2 id="trace-h">Antigravity Reasoning Trace</h2>
            <span className="panel-chip">Live telemetry · {state?.logs?.length ?? 0} events</span>
          </div>
          <ErrorBoundary>
            <TracePanel logs={state?.logs || []} />
          </ErrorBoundary>
        </section>

        {/* ── COL 3: PROVIDER MATCHING ── */}
        <section className={`col-right panel ${mobileTab !== 'match' ? 'mob-hidden' : ''}`} aria-labelledby="match-h">
          <div className="panel-hd">
            <h2 id="match-h">Provider Matching</h2>
            <span className="panel-chip">8-factor XAI · {ranked.length} candidates</span>
          </div>
          {ranked.length === 0 ? (
            <div className="trace-empty">
              <div className="trace-orb" aria-hidden="true" />
              <span>Providers will appear after discovery</span>
            </div>
          ) : (
            <div className="provider-list" role="list">
              {ranked.map((p, idx) => (
                <ProviderCard
                  key={p.id}
                  p={p}
                  idx={idx}
                  isSelected={state?.selectedProvider?.id === p.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

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
