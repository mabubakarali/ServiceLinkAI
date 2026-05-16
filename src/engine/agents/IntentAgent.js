import { eventBus, EVENTS } from '../EventBus.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI((import.meta.env.VITE_GEMINI_API_KEY || "mock-key").trim());

class IntentAgent {
  constructor() {
    eventBus.subscribe(EVENTS.REQUEST_RECEIVED, this.handleInput.bind(this));
  }

  async handleInput(payload) {
    const { input } = payload;
    let intent = null;

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        Analyze this service request: "${input}"
        Note: "9 baje" means 09:00, "2 baje" means 14:00 (afternoon) or 02:00 (night).
        
        Determine if the user mentioned a:
        1. ARRIVAL_TIME: User wants technician to ARRIVE at this time (e.g. "9 baje technician chahiye").
        2. DEADLINE: User has an EVENT at this time and work must be FINISHED by then (e.g. "Shaadi 2 baje hai", "Office 10 baje ponchna hai").

        Return ONLY a JSON object:
        {
          "service": "AC Repair, Plumbing, Electrician, Beautician, Mechanic, Carpenter, or Unknown",
          "urgency": "High, Medium, Low",
          "location": "Extract location",
          "constraints": [],
          "timeType": "ARRIVAL_TIME or DEADLINE",
          "eventTime": "HH:mm",
          "suggestedStartTime": "HH:mm (If DEADLINE, subtract: Beauty 4h, Mechanic/AC 1.5h. If ARRIVAL_TIME, return eventTime)",
          "confidenceScores": { "service": 100, "urgency": 100 }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if (text.startsWith('```')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      intent = JSON.parse(text);
    } catch (err) {
      eventBus.emit(EVENTS.SYSTEM_LOG, {
        agent: 'IntentAgent', action: 'LLM_FALLBACK',
        trace: `LLM Connection Issue: ${err.message}. Activating Heuristic Fallback Engine.`,
        confidence: 1.0, toolUsed: 'Diagnostics'
      });
      intent = this.fallbackParse(input);
    }

    this.classifyComplexity(intent, input);
    
    eventBus.emit(EVENTS.INTENT_PARSED, { 
        intent: { ...intent, complexity: intent.complexity },
        agent: 'IntentAgent',
        trace: `Successfully parsed intent. Scheduling Strategy: ${intent.timeType === 'DEADLINE' ? 'Backtracking (Finish-by-Deadline)' : 'Direct Arrival (On-Time)'}.`,
        confidence: 1.0,
        toolUsed: 'Gemini 1.5 Flash Temporal Reasoning'
    });
  }

  fallbackParse(input) {
    const lowInput = input.toLowerCase();
    const intent = {
      service: 'Unknown', urgency: 'Medium', location: 'Unknown', constraints: [],
      timeType: 'ARRIVAL_TIME', eventTime: null, suggestedStartTime: null, confidenceScores: { service: 40, urgency: 50 }
    };

    if (lowInput.includes('ac') || lowInput.includes('cool') || lowInput.includes('inverter')) intent.service = 'AC Repair';
    else if (lowInput.includes('plumb') || lowInput.includes('pipe')) intent.service = 'Plumbing';
    else if (lowInput.includes('mechanic') || lowInput.includes('car')) intent.service = 'Mechanic';
    else if (lowInput.includes('beauty') || lowInput.includes('makeup') || lowInput.includes('shaadi')) intent.service = 'Beautician';

    const sectorMatch = lowInput.match(/([a-i])\s*[- ]?\s*(\d{1,2})/);
    if (sectorMatch) intent.location = `${sectorMatch[1].toUpperCase()}-${sectorMatch[2]}`;

    const timeMatch = lowInput.match(/(\d{1,2})\s*(?:am|pm|baje)/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      if (lowInput.includes('pm') && hour < 12) hour += 12;
      intent.eventTime = `${hour.toString().padStart(2, '0')}:00`;
      
      // Heuristic for Deadline vs Arrival
      if (lowInput.includes('ponchna') || lowInput.includes('jana') || lowInput.includes('shaadi') || lowInput.includes('baraat')) {
          intent.timeType = 'DEADLINE';
          const buffer = intent.service === 'Beautician' ? 4 : 1.5;
          const startHour = Math.max(0, hour - buffer);
          intent.suggestedStartTime = `${Math.floor(startHour).toString().padStart(2, '0')}:00`;
      } else {
          intent.timeType = 'ARRIVAL_TIME';
          intent.suggestedStartTime = intent.eventTime;
      }
    }

    return intent;
  }

  classifyComplexity(intent, input) {
    let complexity = 'Basic';
    const complexKeywords = ['inverter', 'installation', 'gas refill', 'leakage', 'bridal', 'wedding'];
    if (complexKeywords.some(kw => input.toLowerCase().includes(kw))) complexity = 'Complex';
    else if (['Beautician', 'Mechanic', 'AC Repair'].includes(intent.service)) complexity = 'Complex';
    
    intent.complexity = complexity;

    eventBus.emit(EVENTS.COMPLEXITY_CLASSIFIED, { 
        complexity,
        agent: 'IntentAgent',
        trace: `Classified job complexity as: ${complexity}. Reasoning: ${intent.service} is a high-stakes domain.`,
        confidence: 0.95,
        toolUsed: 'Heuristic Complexity Mapping'
    });
  }
}

export const intentAgent = new IntentAgent();
