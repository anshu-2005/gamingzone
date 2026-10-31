/**
 * GAMINGZONE — DifficultyProfile
 * 
 * Computes, manages, and validates difficulty curves across levels 1..N.
 * Guarantees monotonic progression with explicit intentional breather stages.
 * Provides measurable challenge indicators: hazard density, reaction window, path steps, composite score.
 */

export const SCALING_CURVES = {
  LINEAR: 'LINEAR',
  LOGARITHMIC: 'LOGARITHMIC',
  EXPONENTIAL: 'EXPONENTIAL',
  STAIRCASE_BREATHER: 'STAIRCASE_BREATHER' // 3 intensifying levels + 1 planned breather
};

export class DifficultyProfile {
  /**
   * @param {Object} options 
   */
  constructor(options = {}) {
    this.curve = options.curve || SCALING_CURVES.STAIRCASE_BREATHER;
    this.baseSpeed = options.baseSpeed || 200; // pixels per sec
    this.maxSpeed = options.maxSpeed || 650;
    this.baseDensity = options.baseDensity || 0.15; // 0..1
    this.maxDensity = options.maxDensity || 0.75;
    this.baseReactionWindowMs = options.baseReactionWindowMs || 650; // ms to react
    this.minReactionWindowMs = options.minReactionWindowMs || 220; // human minimum
    this.baseSteps = options.baseSteps || 3;
    this.maxSteps = options.maxSteps || 25;
    this.breatherInterval = options.breatherInterval || 4; // every 4th level is breather
    this.breatherRelief = options.breatherRelief || 0.35; // 35% easier than peak
  }

  /**
   * Compute difficulty parameters for a 1-based level index
   * @param {number} levelIndex 
   * @returns {Object} { progressRatio, isBreather, speed, density, reactionWindowMs, steps, score }
   */
  evaluate(levelIndex) {
    const lvl = Math.max(1, Math.floor(levelIndex));
    let progressRatio = 0; // 0..1

    if (this.curve === SCALING_CURVES.LINEAR) {
      progressRatio = Math.min(1, (lvl - 1) / 50);
    } else if (this.curve === SCALING_CURVES.LOGARITHMIC) {
      progressRatio = Math.min(1, Math.log10(lvl * 1.5) / Math.log10(60));
    } else if (this.curve === SCALING_CURVES.EXPONENTIAL) {
      progressRatio = Math.min(1, Math.pow((lvl - 1) / 45, 1.4));
    } else {
      // STAIRCASE_BREATHER: Staircase ascent with every Nth level as a breather
      const cycle = (lvl - 1) % this.breatherInterval;
      const tier = Math.floor((lvl - 1) / this.breatherInterval);
      const isBreather = cycle === (this.breatherInterval - 1) && lvl > 2;

      let baseRatio = Math.min(0.95, (tier * 0.12) + (cycle * 0.04));
      if (isBreather) {
        baseRatio = Math.max(0.08, baseRatio * (1 - this.breatherRelief));
      }
      progressRatio = Math.max(0, Math.min(1, baseRatio));
      
      const speed = Math.round(this.baseSpeed + (this.maxSpeed - this.baseSpeed) * progressRatio);
      const density = parseFloat((this.baseDensity + (this.maxDensity - this.baseDensity) * progressRatio).toFixed(3));
      const reactionWindowMs = Math.round(this.baseReactionWindowMs - (this.baseReactionWindowMs - this.minReactionWindowMs) * progressRatio);
      const steps = Math.min(this.maxSteps, Math.round(this.baseSteps + (this.maxSteps - this.baseSteps) * progressRatio));
      const compositeScore = Math.round(progressRatio * 1000);

      return {
        level: lvl,
        curve: this.curve,
        progressRatio: parseFloat(progressRatio.toFixed(3)),
        isBreather,
        speed,
        density,
        reactionWindowMs,
        steps,
        compositeScore
      };
    }

    const speed = Math.round(this.baseSpeed + (this.maxSpeed - this.baseSpeed) * progressRatio);
    const density = parseFloat((this.baseDensity + (this.maxDensity - this.baseDensity) * progressRatio).toFixed(3));
    const reactionWindowMs = Math.round(this.baseReactionWindowMs - (this.baseReactionWindowMs - this.minReactionWindowMs) * progressRatio);
    const steps = Math.min(this.maxSteps, Math.round(this.baseSteps + (this.maxSteps - this.baseSteps) * progressRatio));
    const compositeScore = Math.round(progressRatio * 1000);

    return {
      level: lvl,
      curve: this.curve,
      progressRatio: parseFloat(progressRatio.toFixed(3)),
      isBreather: false,
      speed,
      density,
      reactionWindowMs,
      steps,
      compositeScore
    };
  }

  /**
   * Validate that a sequence of levels is properly escalating without unintended drops
   * @param {Array<Object>} evaluations 
   * @returns {{ valid: boolean, errors: Array<string> }}
   */
  static validateProgression(evaluations = []) {
    const errors = [];
    if (evaluations.length < 2) return { valid: true, errors: [] };

    for (let i = 1; i < evaluations.length; i++) {
      const prev = evaluations[i - 1];
      const curr = evaluations[i];

      // If neither is an intentional breather, difficulty must not drop substantially (> 50 points)
      if (!curr.isBreather && !prev.isBreather) {
        if (curr.compositeScore < prev.compositeScore - 20) {
          errors.push(`Accidental difficulty drop at level ${curr.level} (${curr.compositeScore}) vs level ${prev.level} (${prev.compositeScore})`);
        }
      }

      // Check for human minimum reaction window
      if (curr.reactionWindowMs < 180) {
        errors.push(`Unfair reaction window ${curr.reactionWindowMs}ms at level ${curr.level} (below 180ms threshold)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

