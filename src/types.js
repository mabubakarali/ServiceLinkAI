/**
 * @typedef {Object} ProviderBreakdown
 * @property {number} distanceScore
 * @property {number} ratingScore
 * @property {number} skillScore
 * @property {number} reliabilityScore
 */

/**
 * @typedef {Object} Provider
 * @property {string} id
 * @property {string} name
 * @property {number} score
 * @property {ProviderBreakdown} breakdown
 * @property {string} whySelected
 * @property {string} whyRejected
 */

/**
 * @typedef {Object} OrchestratorState
 * @property {string} status
 * @property {number} serviceProgress
 * @property {number} failures
 * @property {number} overrides
 * @property {Array<Provider>} rankedProviders
 * @property {Provider|null} selectedProvider
 * @property {boolean} feedbackProcessed
 * @property {Array<Object>} logs
 */

export {};
