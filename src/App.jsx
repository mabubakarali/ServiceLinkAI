import { useState, useEffect, useRef } from 'react';
import './App.css';
import { eventBus, EVENTS, orchestrator } from './engine/index.js';

function App() {
  const [state, setState] = useState(orchestrator.getState());
  const [userInput, setUserInput] = useState("Mujhe kal subah 9 baje Bahria Phase 7 mein inverter AC technician chahiye. Cooling bohat kam hai.");
  const terminalRef = useRef(null);

  useEffect(() => {
    const unsubState = eventBus.subscribe(EVENTS.STATE_UPDATED, (payload) => setState(payload.state));
    return () => { unsubState(); };
  }, []);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [state.logs]);

  const startOrchestration = () => {
    eventBus.emit(EVENTS.REQUEST_RECEIVED, { 
      input: userInput,
      inputReceived: userInput,
      agent: 'AppInterface',
      trace: `User initiated new service request.`,
      confidence: 1.0,
      toolUsed: 'Reason: Received raw text from client interface'
    });
  };

  const simulateFailure = () => {
    if (state.selectedProvider) {
      eventBus.emit(EVENTS.PROVIDER_CANCELLED, { 
        providerId: state.selectedProvider.id,
        agent: 'Simulator',
        trace: `USER INJECTED FAILURE: ${state.selectedProvider.name} unexpectedly cancelled the job.`,
        confidence: 1.0,
        toolUsed: 'Reason: External interruption trigger'
      });
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">⚙️</span> ServiceLink AI
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase' }}>Dynamic Input</h3>
          <textarea 
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{ width: '100%', height: '80px', backgroundColor: '#010409', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px', fontSize: '13px', marginBottom: '10px' }}
          />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={startOrchestration} disabled={state.status !== 'IDLE' && state.status !== 'FINISHED_ALL' && state.status !== 'PROCESSING_INTENT' && state.status !== 'AWAITING_USER_CLARIFICATION'}>
            ▶ Run Dynamic Orchestration
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase' }}>Lifecycle State</h3>
          <div className="state-badge" style={{ marginBottom: '10px', backgroundColor: state.needsClarification ? 'rgba(218, 54, 51, 0.2)' : 'rgba(46, 160, 67, 0.2)', color: state.needsClarification ? '#da3633' : 'var(--accent-emerald)', borderColor: state.needsClarification ? '#da3633' : 'var(--accent-emerald)' }}>
            {state.status.replace(/_/g, ' ')}
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${state.serviceProgress}%`, height: '100%', backgroundColor: 'var(--accent-emerald)', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>

        <div className="card" style={{ flexGrow: 1 }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase' }}>Global Context</h3>
          {state.extractedIntent && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--accent-blue)' }}>Agent Extracted Intent</strong>
              <div style={{ fontSize: '13px' }}>Service: {state.extractedIntent.service}</div>
              <div style={{ fontSize: '13px' }}>Urgency: {state.extractedIntent.urgency}</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                Complexity: <span style={{ color: state.extractedIntent.complexity === 'Complex' ? '#da3633' : 'var(--accent-emerald)', fontWeight: 'bold' }}>{state.extractedIntent.complexity || 'Basic'}</span>
              </div>
            </div>
          )}

          {/* Service Quality Loop (Sidebar Integration) */}
          {state.dynamicChecklist && (state.status === 'SERVICE_STARTED' || state.status === 'SERVICE_COMPLETED' || state.status === 'FINISHED_ALL') && (
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '12px', color: 'var(--accent-blue)', fontSize: '12px', textTransform: 'uppercase' }}>Quality Audit</strong>
              <div className="checklist-container">
                {state.dynamicChecklist.map((item, idx) => (
                  <div key={idx} className="checklist-item" style={{ fontSize: '11px', marginBottom: '4px' }}>
                    <input type="checkbox" checked={item.completed} readOnly style={{ width: '12px', height: '12px' }} /> 
                    <span style={{ color: item.completed ? 'var(--accent-emerald)' : 'var(--text-main)', opacity: item.completed ? 1 : 0.6 }}>{item.task}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '12px', fontSize: '9px', color: 'var(--accent-emerald)', fontStyle: 'italic' }}>
                [GEO-TAG: {state.extractedIntent?.location || 'Verified'}]
              </div>
            </div>
          )}

          {state.pricing && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(210, 153, 34, 0.1)', border: '1px solid var(--warning-orange)', borderRadius: '6px' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--warning-orange)' }}>Pricing Transparency</strong>
              <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}><span>Base Fee:</span> <span>Rs {state.pricing.base}</span></div>
              <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}><span>Travel Fee:</span> <span>Rs {state.pricing.travel}</span></div>
              <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}><span>Urgency Surge:</span> <span>Rs {state.pricing.urgency}</span></div>
              <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}><span>Failure Surge:</span> <span>Rs {state.pricing.surge}</span></div>
              {state.pricing.variance !== 0 && <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', color: state.pricing.variance > 0 ? '#da3633' : 'var(--accent-emerald)' }}><span>Market Adj.:</span> <span>{state.pricing.variance > 0 ? '+' : ''}Rs {state.pricing.variance}</span></div>}
              <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
              <div style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}><span>Total:</span> <span>Rs {state.pricing.total}</span></div>
            </div>
          )}
        </div>

        <div className="action-bar" style={{ flexDirection: 'column', gap: '8px' }}>
          <button className="btn btn-danger" onClick={simulateFailure} disabled={state.failures > 0 || (state.status !== 'ASSIGNED' && state.status !== 'EN_ROUTE' && state.status !== 'ARRIVED')}>
            ⚠️ Inject Provider Cancellation
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Antigravity Reasoning Trace</h2>
        </div>

        <div className="terminal" ref={terminalRef}>
          {state.logs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting dynamic input...</div>
          ) : (
            state.logs.map((log, idx) => {
              const deltaSeconds = idx * 3; 
              const safeConfidence = log.confidence || 0.98;

              return (
                <div key={idx} style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>AGENT: {log.agent}</span>
                    <span style={{ color: 'var(--text-muted)' }}>T+{deltaSeconds}s</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '13px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Event:</div>
                    <div style={{ color: 'var(--warning-orange)', fontWeight: 'bold' }}>{log.action}</div>
                    
                    <div style={{ color: 'var(--text-muted)' }}>Confidence:</div>
                    <div style={{ color: safeConfidence >= 0.7 ? 'var(--accent-emerald)' : '#da3633', fontWeight: 'bold' }}>
                      {(safeConfidence * 100).toFixed(0)}%
                    </div>
                    
                    <div style={{ color: 'var(--text-muted)' }}>Reasoning Context:</div>
                    <div style={{ color: '#388bfd' }}>{log.toolUsed || 'System'}</div>
                    
                    {log.action === 'SESSION_ENDED' ? (
                      <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                        <div style={{ backgroundColor: 'rgba(56, 139, 253, 0.1)', border: '1px solid #388bfd', borderRadius: '6px', padding: '16px' }}>
                          <h3 style={{ color: '#388bfd', margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase' }}>Demo Execution Complete</h3>
                          <pre style={{ margin: 0, color: '#e6edf3', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                            {log.trace}
                          </pre>
                        </div>
                      </div>
                    ) : log.trace && log.trace.includes('DECISION_CARD') ? (
                      <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                        <div style={{ backgroundColor: 'rgba(35, 134, 54, 0.1)', border: '1px solid #2ea043', borderRadius: '6px', padding: '16px' }}>
                          <h3 style={{ color: '#2ea043', margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase' }}>Match Decision Card</h3>
                          <pre style={{ margin: 0, color: '#e6edf3', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                            {log.trace.replace('DECISION_CARD:\n', '')}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: 'var(--text-muted)' }}>Reasoning:</div>
                        <div style={{ color: '#e6edf3', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{log.trace}</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Explainable Matching Engine</h3>
          {state.rankedProviders.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>Awaiting provider discovery...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {state.rankedProviders.map((p, idx) => {
                const isSelected = state.selectedProvider?.id === p.id;
                return (
                  <div key={p.id} style={{ padding: '12px', border: `1px solid ${isSelected ? 'var(--accent-emerald)' : 'var(--border-color)'}`, borderRadius: '6px', backgroundColor: isSelected ? 'rgba(46, 160, 67, 0.05)' : 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: isSelected ? 'var(--accent-emerald)' : 'var(--text-main)' }}>{p.name} {isSelected && '(Selected)'}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Score: {p.score}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>Dist: {p.breakdown?.distanceScore.toFixed(1)}</span>
                      <span>Rate: {p.breakdown?.ratingScore.toFixed(1)}</span>
                      <span>Skill: {p.breakdown?.skillScore.toFixed(1)}</span>
                      <span>Rel: {p.breakdown?.reliabilityScore.toFixed(1)}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#e6edf3', backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
                      <strong style={{ color: isSelected ? 'var(--accent-emerald)' : 'var(--warning-orange)' }}>
                        {isSelected ? 'Why Selected: ' : 'Why Rejected: '}
                      </strong>
                      {isSelected ? p.whySelected : p.whyRejected}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {(state.status === 'SERVICE_COMPLETED' || (state.status === 'FINISHED_ALL' && !state.feedbackProcessed)) && !state.feedbackProcessed && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
        }}>
          <div className="card" style={{ width: '400px', textAlign: 'center', padding: '32px', border: '1px solid var(--accent-blue)', boxShadow: '0 0 40px rgba(56, 139, 253, 0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌟</div>
            <h2 style={{ marginBottom: '8px' }}>Service Completed!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Your feedback helps our agents optimize future provider matches. Please rate your experience.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => {
                    eventBus.emit(EVENTS.FEEDBACK_COLLECTED, { rating: star, agent: 'User', trace: `User provided ${star}-star feedback.` });
                  }}
                  style={{ 
                    width: '48px', height: '48px', cursor: 'pointer', backgroundColor: '#21262d', border: '1px solid #30363d', 
                    borderRadius: '50%', color: '#e6edf3', fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    transition: 'transform 0.2s, background-color 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.backgroundColor = 'var(--accent-blue)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#21262d'; }}
                >
                  {star}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--accent-blue)', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Agent Reputation Engine Awaiting Input...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
