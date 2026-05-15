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
      const providers = overrideProviders || orchestrator.getState().discoveredProviders;
      const excludeId = payload.excludeId;

      const state = orchestrator.getState();
      const complexity = state.extractedIntent?.complexity || 'Basic';
      const isComplex = complexity === 'Complex';

      let ranked = providers.map(p => {
        // 6-Factor Weights
        const weights = isComplex ? 
          { dist: 0.10, rate: 0.10, skill: 0.50, rel: 0.10, cancel: 0.10, recency: 0.10 } :
          { dist: 0.15, rate: 0.15, skill: 0.20, rel: 0.20, cancel: 0.15, recency: 0.15 };

        const distanceScore = Math.max(0, 100 - (p.baseDistance * 10)) * weights.dist;
        const ratingScore = (p.rating / 5) * 100 * weights.rate;
        
        const constraints = state.extractedIntent?.constraints || [];
        const hasSkill = constraints.some(c => p.skills.join(',').toLowerCase().includes(c.toLowerCase()));
        const skillScore = (hasSkill ? 100 : 60) * weights.skill;
        
        const reliabilityScore = p.reliability * weights.rel;
        const cancellationScore = (100 - (p.cancellationRate || 0)) * weights.cancel;
        const reviewRecencyScore = (p.reviewRecency || 0) * weights.recency;
        
        const noise = Math.random() * 10; 
        const tieBreaker = parseInt(p.id.replace(/\D/g, '') || '0') * 0.01;
        let total = distanceScore + ratingScore + skillScore + reliabilityScore + cancellationScore + reviewRecencyScore + noise + tieBreaker;
        
        if (p.status !== 'AVAILABLE' || p.id === excludeId) total = 0; 

        return { 
          ...p, 
          score: total.toFixed(1), 
          breakdown: { distanceScore, ratingScore, skillScore, reliabilityScore, cancellationScore, reviewRecencyScore, noise } 
        };
      }).sort((a, b) => b.score - a.score);

      const selected = ranked[0];
      const rejected = ranked.slice(1);

      const hasConflicts = providers.some(p => p.id === excludeId || p.status !== 'AVAILABLE');

      if (hasConflicts && selected.score > 0) {
        selected.whySelected = `Selected as the optimal available candidate after filtering ${providers.length - 1} providers with scheduling conflicts or busy status.`;
      } else {
        selected.whySelected = `Highest overall score (${selected.score}). Optimal balance of skill, proximity, and reliability.`;
      }
      
      rejected.forEach(r => {
        if (r.id === excludeId) r.whyRejected = `Disqualified: Agent detected a scheduling conflict (09:00 AM overlap).`;
        else if (r.status !== 'AVAILABLE') r.whyRejected = `Disqualified: Provider is currently marked as BUSY in the database.`;
        else r.whyRejected = `Lower overall score compared to selected provider.`;
      });

      eventBus.emit(EVENTS.PROVIDER_RANKED, { 
        agent: 'MatchingAgent',
        trace: `Successfully matched ${selected.name} out of ${ranked.length} candidates.`,
        confidence: 0.98,
        toolUsed: 'Reason: Evaluated proximity, reliability, and skill matrix',
        rankedProviders: ranked,
        selectedProvider: selected,
        rejectedProviders: ranked.slice(1)
      });

    }, 1200);
  }
}

export const matchingAgent = new MatchingAgent();
