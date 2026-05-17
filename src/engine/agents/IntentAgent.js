import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';

class IntentAgent {
  constructor() {
    eventBus.subscribe(EVENTS.REQUEST_RECEIVED, this.handleInput.bind(this));
  }

  async handleInput(payload) {
    const { input } = payload;
    let intent = null;

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const model_name = "gemini-2.5-flash";
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI((import.meta.env.VITE_GEMINI_API_KEY || "mock-key").trim());
      const model = genAI.getGenerativeModel({ model: model_name });

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
          "constraints": ["list of specific keywords from request e.g. inverter, gas refill, bridal"],
          "timeType": "ARRIVAL_TIME or DEADLINE",
          "eventTime": "HH:mm or null",
          "suggestedStartTime": "HH:mm (If DEADLINE, subtract: Beauty 4h, Mechanic/AC 1.5h. If ARRIVAL_TIME, return eventTime)",
          "confidenceScores": { "service": 0-100, "urgency": 0-100 }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if (text.startsWith('```')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      intent = JSON.parse(text);

      // Check confidence and trigger clarification if low
      const serviceConf = intent.confidenceScores?.service || 100;
      if (serviceConf < 70 || intent.service === 'Unknown') {
        eventBus.emit(EVENTS.CLARIFICATION_REQUESTED, {
          agent: 'IntentAgent',
          trace: `LOW CONFIDENCE (${serviceConf}%): Could not reliably identify service. Was this about AC Repair, Plumbing, or Electrician work?`,
          confidence: serviceConf / 100,
          toolUsed: 'Reason: Confidence Threshold Check'
        });
        return;
      }

    } catch (err) {
      eventBus.emit(EVENTS.SYSTEM_LOG, {
        agent: 'IntentAgent', action: 'LLM_FALLBACK',
        trace: `LLM Connection Issue: ${err.message}. Activating Heuristic Fallback Engine.`,
        confidence: 1.0, toolUsed: 'Diagnostics'
      });
      intent = this.fallbackParse(input);

      // Check fallback confidence too
      if (intent.service === 'Unknown') {
        eventBus.emit(EVENTS.CLARIFICATION_REQUESTED, {
          agent: 'IntentAgent',
          trace: `LOW CONFIDENCE (40%): Service type unclear from request. Could you clarify: AC Repair, Plumbing, Electrician, Mechanic, or Beautician?`,
          confidence: 0.4,
          toolUsed: 'Reason: Confidence Threshold Check'
        });
        return;
      }
    }

    // Emit INTENT_PARSED first — complexity is then derived FROM the parsed intent
    eventBus.emit(EVENTS.INTENT_PARSED, { 
        intent: { ...intent, complexity: intent.complexity },
        agent: 'IntentAgent',
        trace: `Successfully parsed intent. Service: ${intent.service}. Scheduling Strategy: ${intent.timeType === 'DEADLINE' ? `Backtracking (Finish-by-Deadline). Provider must arrive by ${intent.suggestedStartTime} to complete before ${intent.eventTime}` : 'Direct Arrival (On-Time)'}.`,
        confidence: (intent.confidenceScores?.service || 95) / 100,
        toolUsed: 'gemini-2.5-flash Temporal Reasoning'
    });

    // Classify complexity AFTER intent is broadcast (correct logical order)
    this.classifyComplexity(intent, input);
  }

  fallbackParse(input) {
    const lowInput = input.toLowerCase();
    const intent = {
      service: 'Unknown', urgency: 'Medium', location: 'Unknown', constraints: [],
      timeType: 'ARRIVAL_TIME', eventTime: null, suggestedStartTime: null, 
      confidenceScores: { service: 40, urgency: 50 }
    };

    // ── FUZZY MATCHING: consonant-skeleton normalization for misspellings ──────
    // Strips vowels and collapses repeated chars for phonetic similarity matching
    const toSkeleton = (s) => s.replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1');
    const skeleton = toSkeleton(lowInput);
    const fuzzyPatterns = [
      { service: 'AC Repair',    patterns: ['ac', 'cool', 'invrt', 'invtr', 'chlr', 'kllr', 'aircnd'] },
      { service: 'Plumbing',     patterns: ['plmb', 'plmr', 'ppln', 'lkge', 'lkj', 'drng', 'nllk'] },
      { service: 'Mechanic',     patterns: ['mchn', 'mknk', 'mcnc', 'grj', 'krgr', 'crmchn'] },
      { service: 'Beautician',   patterns: ['btcn', 'btshn', 'mkp', 'brdl', 'bytn', 'byti'] },
      { service: 'Electrician',  patterns: ['lctr', 'lktr', 'bjl', 'wrng', 'wrng'] },
    ];

    for (const { service, patterns } of fuzzyPatterns) {
      if (patterns.some(p => skeleton.includes(p))) {
        intent.service = service;
        intent.confidenceScores.service = 78; // fuzzy confidence slightly lower
        break;
      }
    }

    if (lowInput.includes('ac') || lowInput.includes('cool') || lowInput.includes('inverter')) {
      intent.service = 'AC Repair'; intent.confidenceScores.service = 92;
      if (lowInput.includes('inverter')) intent.constraints.push('inverter');
      if (lowInput.includes('gas')) intent.constraints.push('gas refill');
    } else if (lowInput.includes('plumb') || lowInput.includes('pipe') || lowInput.includes('leakage')) {
      intent.service = 'Plumbing'; intent.confidenceScores.service = 90;
    } else if (lowInput.includes('mechanic') || lowInput.includes('car') || lowInput.includes('gari')) {
      intent.service = 'Mechanic'; intent.confidenceScores.service = 92;
    } else if (lowInput.includes('beauty') || lowInput.includes('makeup') || lowInput.includes('shaadi') || lowInput.includes('bridal')) {
      intent.service = 'Beautician'; intent.confidenceScores.service = 91;
      if (lowInput.includes('bridal') || lowInput.includes('shaadi')) intent.constraints.push('bridal');
    } else if (lowInput.includes('electric') || lowInput.includes('bijli') || lowInput.includes('wiring')) {
      intent.service = 'Electrician'; intent.confidenceScores.service = 90;
    }

    // Location detection: Universal sector regex + named areas
    const sectorMatch = lowInput.match(/([a-i])\s*[- ]?\s*(\d{1,2})/);
    if (sectorMatch) intent.location = `${sectorMatch[1].toUpperCase()}-${sectorMatch[2]}`;
    else {
      ['bahria', 'dha', 'gulberg', 'rawalpindi', 'islamabad', 'pwd', 'cbr', 'naval'].forEach(loc => {
        if (lowInput.includes(loc)) intent.location = loc.charAt(0).toUpperCase() + loc.slice(1);
      });
    }

    if (lowInput.includes('urgent') || lowInput.includes('jaldi') || lowInput.includes('abhi')) {
      intent.urgency = 'High'; intent.confidenceScores.urgency = 95;
    }

    // Time detection + deadline vs arrival logic
    const timeMatch = lowInput.match(/(\d{1,2})\s*(?:am|pm|baje)/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      if (lowInput.includes('pm') && hour < 12) hour += 12;
      intent.eventTime = `${hour.toString().padStart(2, '0')}:00`;
      
      const isDeadline = lowInput.includes('ponchna') || lowInput.includes('jana') || 
                         lowInput.includes('shaadi') || lowInput.includes('baraat') ||
                         lowInput.includes('interview') || lowInput.includes('office');
      if (isDeadline) {
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
    const complexKeywords = ['inverter', 'installation', 'gas refill', 'leakage', 'bridal', 'wedding', 'complete wiring'];
    if (complexKeywords.some(kw => input.toLowerCase().includes(kw))) complexity = 'Complex';
    else if (['Beautician', 'Mechanic', 'AC Repair'].includes(intent.service)) complexity = 'Complex';
    else if (input.length > 80) complexity = 'Intermediate';
    
    intent.complexity = complexity;

    eventBus.emit(EVENTS.COMPLEXITY_CLASSIFIED, { 
        complexity,
        agent: 'IntentAgent',
        trace: `Classified job complexity as: ${complexity}. Reasoning: ${intent.service} with ${intent.constraints?.length || 0} constraint(s) — requires specialist-grade matching.`,
        confidence: 0.95,
        toolUsed: 'Heuristic Complexity Mapping'
    });
  }
}

export const intentAgent = new IntentAgent();
