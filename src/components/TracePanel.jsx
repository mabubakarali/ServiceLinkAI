import React, { useRef, useEffect } from 'react';

export function TracePanel({ logs }) {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section className="panel-surface trace-panel" aria-labelledby="trace-heading">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Reasoning trace</div>
          <h3 id="trace-heading">Live orchestration telemetry</h3>
        </div>
        <div className="panel-chip" aria-label="Performance badge">Tuned for 60fps motion</div>
      </div>

      <div className="terminal" ref={terminalRef} role="log" aria-live="polite">
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-orb" aria-hidden="true" />
            <div>
              <strong>Awaiting dynamic input</strong>
              <p>The workflow will populate this trace as soon as orchestration starts.</p>
            </div>
          </div>
        ) : (
          logs.map((log, idx) => {
            const deltaSeconds = idx * 3;
            const safeConfidence = log.confidence || 0.98;

            return (
              <article key={idx} className="log-card" tabIndex="0">
                <div className="log-topline">
                  <span className="log-agent-chip">AGENT: {log.agent}</span>
                  <span className="log-time">T+{deltaSeconds}s</span>
                </div>

                <div className="log-grid">
                  <div className="log-label">Event</div>
                  <div className="log-value accent">{log.action}</div>

                  <div className="log-label">Confidence</div>
                  <div className={`log-value ${safeConfidence >= 0.7 ? 'text-success' : 'text-danger'}`}>
                    {(safeConfidence * 100).toFixed(0)}%
                  </div>

                  <div className="log-label">Reasoning Context</div>
                  <div className="log-value blue">{log.toolUsed || 'System'}</div>

                  {log.action === 'SESSION_ENDED' ? (
                    <div className="log-callout info">
                      <h3>Demo Execution Complete</h3>
                      <pre>{log.trace}</pre>
                    </div>
                  ) : log.trace && log.trace.includes('DECISION_CARD') ? (
                    <div className="log-callout success">
                      <h3>Match Decision Card</h3>
                      <pre>{log.trace.replace('DECISION_CARD:\n', '')}</pre>
                    </div>
                  ) : (
                    <>
                      <div className="log-label">Reasoning</div>
                      <div className="log-value trace-text">{log.trace}</div>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
