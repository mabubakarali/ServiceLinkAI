import { eventBus, EVENTS } from '../EventBus.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "mock-key");

class IntentAgent {
  constructor() {
    eventBus.subscribe(EVENTS.REQUEST_RECEIVED, this.handleInput.bind(this));
  }

  async handleInput(payload) {
    const input = payload.input;
    let intent = null;
    let confidence = 0;
    let isFallback = false;
    let retryCount = 0;

    // 1. Gemini Try/Retry Loop
    while (retryCount < 2 && !intent) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
        You are an Intent Parsing agent for a Pakistani service economy platform.
        Analyze this user request (Urdu, Roman Urdu, or English): "${input}"
        
        Extract the following and return ONLY a valid JSON object:
        {
          "service": "One of: AC Repair, Plumbing, Electrician, Beautician, Mechanic, Unknown",
          "urgency": "High, Medium, Low",
          "budget": "Number or null",
          "constraints": ["Array of constraints"],
          "confidenceScores": {
            "service": 0-100,
            "urgency": 0-100,
            "location": 0-100
          }
        }
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.startsWith('```json')) text = text.substring(7, text.length - 3).trim();
        
        const parsed = JSON.parse(text);
        
        // Strict Validation
        if (!parsed.service || !parsed.urgency || !parsed.confidenceScores) {
          throw new Error("Invalid Schema");
        }
        
        intent = parsed;
        // Fix: Confidence should be based on service detection, not dragged down by lack of explicit urgency
        confidence = intent.confidenceScores.service / 100;

      } catch (error) {
        retryCount++;
      }
    }

    // 2. Fallback Heuristic Parser
    if (!intent) {
      isFallback = true;
      const lowInput = input.toLowerCase();
      intent = { service: 'Unknown', urgency: 'Medium', budget: null, constraints: [], confidenceScores: { service: 40, urgency: 50, location: 0 } };
      
      eventBus.emit(EVENTS.SYSTEM_LOG, {
        agent: 'IntentAgent', action: 'FALLBACK_ACTIVATED',
        trace: `LLM service unavailable or failed to parse. Activating lightweight heuristic fallback engine.`,
        toolUsed: 'Reason: Regex Engine Fallback'
      });
      
      if (lowInput.includes('ac') || lowInput.includes('cooling') || lowInput.includes('inverter')) { intent.service = 'AC Repair'; intent.confidenceScores.service = 95; }
      else if (lowInput.includes('plumb') || lowInput.includes('pipe') || lowInput.includes('leak')) { intent.service = 'Plumbing'; intent.confidenceScores.service = 95; }
      else if (lowInput.includes('mechanic') || lowInput.includes('car') || lowInput.includes('gari') || lowInput.includes('engine')) { intent.service = 'Car Mechanic'; intent.confidenceScores.service = 95; }
      else if (lowInput.includes('electric') || lowInput.includes('bijli') || lowInput.includes('fan') || lowInput.includes('wiring')) { intent.service = 'Electrician'; intent.confidenceScores.service = 95; }
      else if (lowInput.includes('carpenter') || lowInput.includes('wood') || lowInput.includes('furniture') || lowInput.includes('lakri')) { intent.service = 'Carpenter'; intent.confidenceScores.service = 95; }
      else if (lowInput.includes('electric') || lowInput.includes('wire')) { intent.service = 'Electrician'; intent.confidenceScores.service = 95; }

      if (lowInput.includes('urgent') || lowInput.includes('jaldi')) { intent.urgency = 'High'; intent.confidenceScores.urgency = 95; }
      else if (lowInput.includes('kal') || lowInput.includes('subah')) { intent.urgency = 'Medium'; intent.confidenceScores.urgency = 85; }
      
      // Fix: Confidence is primarily driven by whether we correctly identified the service
      confidence = intent.confidenceScores.service / 100;
    }

    // 3. Clarification Logic
    if (confidence < 0.70 || intent.service === 'Unknown') {
      eventBus.emit('CLARIFICATION_REQUESTED', {
        agent: 'IntentAgent',
        trace: `Confidence (${(confidence*100).toFixed(0)}%) is below 70% threshold. Halting workflow to ask user for clarification.`,
        confidence: confidence,
        toolUsed: isFallback ? 'FallbackParser' : 'Gemini API',
        intent
      });
      return; // HALT
    }

    // 4. Complexity Classification
    let complexity = 'Basic';
    const complexKeywords = ['inverter', 'installation', 'gas refill', 'leakage', 'complete wiring', 'board replacement'];
    if (complexKeywords.some(kw => input.toLowerCase().includes(kw))) {
      complexity = 'Complex';
    } else if (input.length > 50) {
      complexity = 'Intermediate';
    }

    eventBus.emit(EVENTS.COMPLEXITY_CLASSIFIED, {
      agent: 'IntentAgent',
      trace: `Classified job complexity as: ${complexity}.`,
      confidence: 0.95,
      toolUsed: 'Reason: Heuristic Complexity Mapping',
      complexity
    });

    // 5. Emit Success
    eventBus.emit(EVENTS.INTENT_PARSED, { 
      agent: 'IntentAgent',
      trace: `Successfully extracted structured intent. Ready for planning.`,
      confidence: confidence,
      toolUsed: isFallback ? 'Reason: Employed heuristic fallback regex' : 'Reason: Extracted structured context using LLM',
      decisionOutput: JSON.stringify({ ...intent, complexity }),
      intent: { ...intent, complexity }
    });
  }
}

export const intentAgent = new IntentAgent();
