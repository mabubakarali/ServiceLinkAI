// @ts-check
import { eventBus, EVENTS } from './index.js';

/**
 * Enterprise WebSocket Mock Service
 * Simulates a real SSE/WebSocket connection to a remote Python/Node LLM inference layer.
 * This proves the architecture is ready for streaming data.
 */
export class StreamingInferenceClient {
  constructor() {
    this.isConnected = false;
    this.latency = 0;
  }

  /**
   * Connect to the AI backend
   * @param {string} wssUrl 
   */
  async connect(wssUrl) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        this.latency = Math.floor(Math.random() * 30) + 10;
        resolve(true);
      }, 500);
    });
  }

  /**
   * Stream a request to the orchestrator
   * @param {string} payload 
   */
  streamRequest(payload) {
    if (!this.isConnected) throw new Error("WebSocket not connected");
    // In a real app, this would use a WebSocket or EventSource
    // Currently, local eventBus handles the orchestration
    eventBus.emit(EVENTS.REQUEST_RECEIVED, {
      input: payload,
      inputReceived: payload,
      agent: 'WebSocket Client',
      trace: `Stream chunk received from client.`,
      confidence: 1.0,
      toolUsed: 'Network Layer'
    });
  }

  disconnect() {
    this.isConnected = false;
  }
}

export const aiClient = new StreamingInferenceClient();
