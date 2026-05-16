import React from 'react';
import { eventBus, EVENTS } from '../engine/index.js';

export function FeedbackOverlay({ isVisible, feedbackProcessed }) {
  if (!isVisible || feedbackProcessed) return null;

  return (
    <div className="feedback-overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div className="card feedback-modal">
        <div className="feedback-mark" aria-hidden="true">🌟</div>
        <h2 id="feedback-title">Service Completed</h2>
        <p>Your feedback helps the system refine future provider matches. Please rate the experience.</p>
        <div className="rating-row" role="group" aria-label="Rating buttons">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => {
                eventBus.emit(EVENTS.FEEDBACK_COLLECTED, { rating: star, agent: 'User', trace: `User provided ${star}-star feedback.` });
              }}
              className="rating-button"
              aria-label={`Rate ${star} stars`}
            >
              {star}
            </button>
          ))}
        </div>
        <div className="feedback-footer">Agent reputation engine awaiting input</div>
      </div>
    </div>
  );
}
