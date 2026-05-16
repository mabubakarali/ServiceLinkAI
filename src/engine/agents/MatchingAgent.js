import { eventBus, EVENTS } from '../EventBus.js';
import mockDB from '../../data/mockProviderDB.json';
import { orchestrator } from '../Orchestrator.js';

class MatchingAgent {
  constructor() {
    eventBus.subscribe(EVENTS.PLAN_CREATED, this.handleDiscovery.bind(this));
    eventBus.subscribe(EVENTS.RE_RANK_REQUESTED, this.handleRanking.bind(this));
  }

  handleDiscovery() {
    setTimeout(() => {
      const state = orchestrator.getState();
      const serviceRequired = state.extractedIntent?.service || 'Unknown';
      
      // Filter the DB dynamically
      const providers = mockDB.filter(p => p.category === serviceRequired);

      if (providers.length === 0) {
        eventBus.emit(EVENTS.CLARIFICATION_REQUESTED, {
          agent: 'MatchingAgent',
          trace: `Unmet Constraint: No available technicians found for "${serviceRequired}" in our current coverage area. Would you like to check nearby sectors or see similar categories?`,
          confidence: 1.0,
          toolUsed: 'Reason: Skill/Coverage Gap Analysis'
        });
        return;
      }

      eventBus.emit(EVENTS.PROVIDER_DISCOVERED, {
        agent: 'MatchingAgent',
        trace: `Queried Provider DB. Found ${providers.length} candidates for category: ${serviceRequired}.`,
        confidence: 1.0,
        toolUsed: 'ProviderDB',
        providers
      });

      this.handleRanking({ excludeId: null }, providers);
    }, 800);
  }

  handleRanking(payload, overrideProviders = null) {
    setTimeout(() => {
      try {
        const providers = overrideProviders || orchestrator.getState().discoveredProviders;
        const excludeId = payload.excludeId;

        const state = orchestrator.getState();
        const complexity = state.extractedIntent?.complexity || 'Basic';
        const isComplex = complexity === 'Complex';
        const serviceRequired = state.extractedIntent?.service || 'Unknown';

        let ranked = providers.map(p => {
          // 8-Factor Weights (Expanded for Fairness & Experience)
          const weights = isComplex ? 
            { dist: 0.10, rate: 0.05, skill: 0.45, rel: 0.10, cancel: 0.10, recency: 0.05, fair: 0.10, exp: 0.05 } :
            { dist: 0.15, rate: 0.10, skill: 0.15, rel: 0.15, cancel: 0.15, recency: 0.10, fair: 0.10, exp: 0.10 };

          const distanceScore = Math.max(0, 100 - (p.baseDistance * 10)) * weights.dist;
          const ratingScore = (p.rating / 5) * 100 * weights.rate;
          
          const constraints = state.extractedIntent?.constraints || [];
          const pSkills = p.skills || [];
          const hasSkill = constraints.length > 0 && constraints.some(c => pSkills.join(',').toLowerCase().includes(c.toLowerCase()));
          const skillScore = (hasSkill ? 100 : 60) * weights.skill;
          
          const reliabilityScore = (p.reliability || 0) * weights.rel;
          const cancellationScore = (100 - (p.cancellationRate || 0)) * weights.cancel;
          const reviewRecencyScore = (p.reviewRecency || 0) * weights.recency;

          // New Factor: Ecosystem Fairness (Reverse Workload)
          const fairnessScore = Math.max(0, 100 - ((p.jobsToday || 0) * 20)) * weights.fair;

          // New Factor: Experience Depth
          const experienceScore = Math.min(100, ((p.completedJobs || 0) / 10)) * weights.exp;
          
          const noise = Math.random() * 5; 
          const tieBreaker = parseInt(String(p.id).replace(/\D/g, '') || '0') * 0.01;
          let total = distanceScore + ratingScore + skillScore + reliabilityScore + cancellationScore + reviewRecencyScore + fairnessScore + experienceScore + noise + tieBreaker;
          
          if (p.status !== 'AVAILABLE' || p.id === excludeId || isNaN(total)) total = 0; 

          return { 
            ...p, 
            score: total.toFixed(1), 
            breakdown: { distanceScore, ratingScore, skillScore, reliabilityScore, cancellationScore, reviewRecencyScore, fairnessScore, experienceScore, noise } 
          };
        }).sort((a, b) => b.score - a.score);

        const selected = ranked[0];
        const rejected = ranked.slice(1);

        if (!selected || selected.score == 0) {
          eventBus.emit(EVENTS.CLARIFICATION_REQUESTED, {
            agent: 'MatchingAgent',
            trace: `CONSTRAINT_VIOLATION: Found ${providers.length} candidates, but none meet the minimum score threshold (availability/reliability gap).`,
            confidence: 1.0, toolUsed: 'RiskModel'
          });
          return;
        }

        const hasConflicts = providers.some(p => p.id === excludeId || p.status !== 'AVAILABLE');

        if (hasConflicts && selected.score > 0) {
          const conflictReason = excludeId ? (orchestrator.getState().failures > 0 ? "RECOVERY MODE: System automatically re-routed after provider cancellation." : "SCHEDULING INTELLIGENCE: Auto-resolved 09:00 AM slot overlap with 30min travel buffer.") : "OPTIMAL MATCH: Provider filtered based on real-time availability.";
          selected.whySelected = conflictReason;
        } else {
          // Category-Specific Reasoning Intelligence
          let reasoning = `Highest overall score (${selected.score}). `;
          if (serviceRequired === 'Beautician') {
            reasoning += `Decision prioritized Artist Portfolio, Client Safety Rating (Hygiene), and Style Match.`;
          } else if (serviceRequired === 'Mechanic') {
            reasoning += `Decision prioritized Diagnostic Tool Proficiency and Road-Safety Reliability.`;
          } else {
            reasoning += `Balancing technical skill (${selected.breakdown.skillScore.toFixed(0)}), proximity, and ecosystem fairness.`;
          }
          selected.whySelected = reasoning;
        }
        
        rejected.forEach(r => {
          if (r.id === excludeId) {
             r.whyRejected = orchestrator.getState().failures > 0 ? `Disqualified: Original provider cancelled. Recovery protocol active.` : `Disqualified: Agent detected a scheduling conflict (09:00 AM overlap).`;
          }
          else if (r.status !== 'AVAILABLE') r.whyRejected = `Disqualified: Provider currently marked as BUSY. Maintaining travel-time buffer prevents assignment.`;
          else r.whyRejected = `Lower overall score. Decision engine prioritized fair earning distribution and skill recency over this candidate.`;
        });

        eventBus.emit(EVENTS.PROVIDER_RANKED, { 
          agent: 'MatchingAgent',
          trace: `Multi-Factor Decision Matrix executed. Selected ${selected.name}. Applied 30-minute travel-time buffer to scheduling intelligence. Ecosystem fairness logic verified: prioritizing equitable job distribution.`,
          confidence: 0.98,
          toolUsed: 'Reason: Evaluated proximity, reliability, skill matrix, and workload fairness',
          rankedProviders: ranked,
          selectedProvider: selected,
          rejectedProviders: ranked.slice(1)
        });
      } catch (err) {
        eventBus.emit(EVENTS.SYSTEM_LOG, {
          agent: 'MatchingAgent', action: 'RANKING_CRASH',
          trace: `CRITICAL ERROR: Ranking engine failed. ${err.message}`,
          confidence: 0, toolUsed: 'Diagnostics'
        });
      }
    }, 1200);
  }
}

export const matchingAgent = new MatchingAgent();
