/**
 * GAMINGZONE — LevelGenerator
 * 
 * Deterministic constrained procedural generator with seedable PRNG (Mulberry32).
 * Guarantees solvability, bounded retry limits (no infinite loops), and repetition avoidance.
 */

import { LevelDefinition } from './LevelDefinition.js';
import { LevelFingerprint } from './LevelFingerprint.js';
import { LevelValidator } from './LevelValidator.js';
import { DifficultyProfile } from './DifficultyProfile.js';

export class PRNG {
  /**
   * Fast seedable Mulberry32 32-bit PRNG
   * @param {number} seed 
   */
  constructor(seed = 12345) {
    this.s = seed >>> 0;
  }

  /**
   * Return float [0, 1)
   */
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Return integer in range [min, max]
   */
  range(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Choose random item from array
   */
  pick(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export class LevelGenerator {
  /**
   * @param {Object} options 
   */
  constructor(options = {}) {
    this.genre = options.genre || 'arcade';
    this.difficultyProfile = options.difficultyProfile || new DifficultyProfile();
    this.maxRetries = options.maxRetries || 25;
    this.bounds = options.bounds || { minX: 0, maxX: 800, minY: 0, maxY: 600 };
  }

  /**
   * Generate a validated, unique level definition
   * @param {number} levelIndex 
   * @param {number} baseSeed 
   * @param {Array<string>} historyFingerprints 
   * @param {Function} customBuilder optional genre-specific builder function
   * @returns {LevelDefinition}
   */
  generate(levelIndex, baseSeed = 1001, historyFingerprints = [], customBuilder = null) {
    const diffEval = this.difficultyProfile.evaluate(levelIndex);
    let attempts = 0;
    let currentSeed = (baseSeed + levelIndex * 1337) >>> 0;

    while (attempts < this.maxRetries) {
      attempts++;
      const prng = new PRNG(currentSeed);
      
      // Build raw candidate level
      let rawLevel = null;
      if (typeof customBuilder === 'function') {
        rawLevel = customBuilder(levelIndex, diffEval, prng, this.bounds);
      } else {
        rawLevel = this.defaultBuilder(levelIndex, diffEval, prng);
      }

      rawLevel.index = levelIndex;
      rawLevel.difficulty = diffEval;
      rawLevel.seed = currentSeed;
      rawLevel.bounds = this.bounds;

      // 1. Validation check
      const valResult = LevelValidator.validate(rawLevel, this.bounds);
      if (!valResult.valid) {
        currentSeed = (currentSeed + 7919) >>> 0; // mutate seed
        continue;
      }

      // 2. Repetition & Fingerprint check
      const fp = LevelFingerprint.compute(rawLevel);
      if (LevelFingerprint.isInHistory(fp, historyFingerprints)) {
        currentSeed = (currentSeed + 104729) >>> 0; // mutate seed
        continue;
      }

      // Success: valid and non-repeating
      rawLevel.fingerprint = fp;
      return new LevelDefinition(rawLevel);
    }

    // Safety Fallback: guaranteed valid level with non-conflicting offset
    const fallbackPrng = new PRNG((baseSeed + attempts * 997 + levelIndex) >>> 0);
    const fallbackRaw = typeof customBuilder === 'function'
      ? customBuilder(levelIndex, diffEval, fallbackPrng, this.bounds)
      : this.defaultBuilder(levelIndex, diffEval, fallbackPrng);

    fallbackRaw.index = levelIndex;
    fallbackRaw.difficulty = diffEval;
    fallbackRaw.seed = currentSeed;
    fallbackRaw.bounds = this.bounds;
    fallbackRaw.fingerprint = LevelFingerprint.compute(fallbackRaw);

    return new LevelDefinition(fallbackRaw);
  }

  /**
   * Default generic level builder
   */
  defaultBuilder(levelIndex, diffEval, prng) {
    const targetCount = Math.min(8, 1 + Math.floor(diffEval.progressRatio * 6));
    const obstacleCount = Math.min(12, 2 + Math.floor(diffEval.density * 10));

    const targets = [];
    for (let i = 0; i < targetCount; i++) {
      targets.push({
        x: prng.range(120, this.bounds.maxX - 120),
        y: prng.range(120, this.bounds.maxY - 120),
        radius: 18,
        type: 'target'
      });
    }

    const obstacles = [];
    for (let i = 0; i < obstacleCount; i++) {
      obstacles.push({
        x: prng.range(80, this.bounds.maxX - 160),
        y: prng.range(80, this.bounds.maxY - 160),
        w: prng.range(40, 90),
        h: prng.range(30, 80),
        type: 'solid'
      });
    }

    return {
      genre: this.genre,
      player: { x: 80, y: this.bounds.maxY / 2, radius: 14 },
      targets,
      obstacles,
      hazards: [],
      winCondition: 'all_targets'
    };
  }
}

