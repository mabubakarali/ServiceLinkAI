import React from 'react';

export function MatchPanel({ rankedProviders, selectedProvider }) {
  return (
    <section className="panel-surface match-panel" aria-labelledby="match-heading">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Matching arena</div>
          <h3 id="match-heading">Explainable provider ranking</h3>
        </div>
        <div className="panel-chip" aria-label="Ranking matrix type">8-factor scoring matrix</div>
      </div>

      {rankedProviders.length === 0 ? (
        <div className="empty-state compact">
          <div className="empty-state-orb" aria-hidden="true" />
          <div>
            <strong>Awaiting provider discovery</strong>
            <p>Provider cards will appear here once the matching agent completes its discovery pass.</p>
          </div>
        </div>
      ) : (
        <div className="provider-list" role="list">
          {rankedProviders.map((p, idx) => {
            const isSelected = selectedProvider?.id === p.id;
            const scoreWidth = Math.max(Math.min(p.score, 100), 0);

            return (
              <article key={p.id} role="listitem" className={`provider-card ${isSelected ? 'selected' : ''}`} style={{ '--score-width': `${scoreWidth}%`, '--delay': `${idx * 70}ms` }} tabIndex="0">
                <div className="provider-header">
                  <div>
                    <div className="provider-name-row">
                      <h4>{p.name}</h4>
                      {isSelected && <span className="selected-chip" role="status">Selected</span>}
                    </div>
                    <div className="provider-subcopy">Fairness aware, performance weighted match</div>
                  </div>
                  <div className="provider-score" aria-label={`Score: ${p.score}`}>{p.score}</div>
                </div>

                <div className="score-bar" aria-hidden="true">
                  <div className="score-fill" />
                </div>

                <div className="provider-metrics" aria-label="Provider metrics breakdown">
                  <span>Dist {p?.displayScores?.dist ?? p?.baseDistance?.toFixed(1) ?? 'N/A'} km</span>
                  <span>Rate {p?.displayScores?.rate ?? p?.rating?.toFixed(1) ?? 'N/A'} ★</span>
                  <span>Skill {p?.displayScores?.skill ?? 'N/A'}</span>
                  <span>Rel {p?.displayScores?.rel ?? 'N/A'}</span>
                </div>

                <div className="provider-reasoning">
                  <strong>{isSelected ? 'Why selected' : 'Why rejected'}</strong>
                  <p>{isSelected ? p.whySelected : p.whyRejected}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
