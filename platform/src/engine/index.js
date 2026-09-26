// Survival-statistics engine: pure ES modules, no dependencies, no DOM.
export { kaplanMeier } from './km.js';
export { logRank } from './logrank.js';
export { coxPH, concordanceIndex, efronLogLik } from './cox.js';
export { schoenfeldTest, schoenfeldResiduals, averageRanks, lifelinesRankTransform } from './schoenfeld.js';
export { metaRandomEffects } from './meta.js';
export { describe, quantile, AGE_BANDS, ageBand } from './describe.js';
export {
  erf, erfc, normSf, normCdf, normPdf, normQuantile,
  lgamma, gammaP, gammaQ, chi2Sf, chi2Cdf,
  lbeta, betaInc, tCdf, tSf, tPdf, tQuantile,
} from './dist.js';
