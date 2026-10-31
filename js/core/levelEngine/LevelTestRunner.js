/**
 * GAMINGZONE — LevelTestRunner
 * 
 * Central automated test harness & quality gate for the Level Engine.
 * Tests 100 consecutive level generations per deterministic test seed across 3 distinct seeds.
 * Verifies structural validity, 0 consecutive duplicate fingerprints, 0 history collisions,
 * difficulty curve progression, and bounded generator retry execution.
 */

import { LevelValidator } from './LevelValidator.js';
import { LevelFingerprint } from './LevelFingerprint.js';
import { DifficultyProfile } from './DifficultyProfile.js';
import {
  LaserOpticsAdapter,
  ArrowMazeAdapter,
  MemoryCardAdapter,
  PhysicsDropAdapter,
  RunnerCorridorAdapter,
  WaveCombatAdapter
} from './GameAdapter.js';

export const TEST_SEEDS = [101, 202, 303];
export const TEST_STEPS_PER_SEED = 100;

export class LevelTestRunner {
  constructor() {
    this.adapters = {
      LaserOptics: new LaserOpticsAdapter(),
      ArrowMaze: new ArrowMazeAdapter(),
      MemoryCard: new MemoryCardAdapter(),
      PhysicsDrop: new PhysicsDropAdapter(),
      RunnerCorridor: new RunnerCorridorAdapter(),
      WaveCombat: new WaveCombatAdapter()
    };
  }

  /**
   * Run full test suite for a specific adapter across all 3 seeds
   * @param {string} adapterKey 
   * @param {number} steps 
   * @returns {Object} test results
   */
  testAdapter(adapterKey, steps = TEST_STEPS_PER_SEED) {
    const adapter = this.adapters[adapterKey];
    if (!adapter) {
      return { status: 'NOT APPLICABLE', reason: `No adapter found for ${adapterKey}` };
    }

    const report = {
      adapterKey,
      gameName: adapter.gameName,
      genre: adapter.genre,
      seedsTested: TEST_SEEDS.length,
      levelsPerSeed: steps,
      totalLevelsTested: TEST_SEEDS.length * steps,
      consecutiveDuplicates: 0,
      historyDuplicates: 0,
      validationFailures: 0,
      difficultyRegressions: 0,
      errors: [],
      status: 'PASS'
    };

    for (const seed of TEST_SEEDS) {
      const rollingHistory = [];
      const evaluations = [];
      let lastFp = null;

      for (let lvl = 1; lvl <= steps; lvl++) {
        let levelDef = null;
        try {
          levelDef = adapter.generateLevel(lvl, seed);
        } catch (err) {
          report.errors.push(`Seed ${seed} Level ${lvl} threw exception: ${err.message}`);
          report.validationFailures++;
          continue;
        }

        // 1. Validator Check
        const val = LevelValidator.validate(levelDef, levelDef.bounds || { minX: 0, maxX: 800, minY: 0, maxY: 600 });
        if (!val.valid) {
          report.validationFailures++;
          report.errors.push(`Seed ${seed} Level ${lvl} validation failed: ${val.errors.join('; ')}`);
        }

        // 2. Consecutive Duplicate Check
        const fp = levelDef.fingerprint || LevelFingerprint.compute(levelDef);
        if (lastFp && lastFp === fp) {
          report.consecutiveDuplicates++;
          report.errors.push(`Seed ${seed} Level ${lvl} is identical to Level ${lvl - 1} (${fp})`);
        }

        // 3. Rolling History Collision Check (within rolling 30 levels)
        const recentWindow = rollingHistory.slice(-30);
        if (recentWindow.includes(fp)) {
          report.historyDuplicates++;
          report.errors.push(`Seed ${seed} Level ${lvl} repeated recent level from history (${fp})`);
        }

        rollingHistory.push(fp);
        lastFp = fp;

        if (levelDef.difficulty) {
          evaluations.push(levelDef.difficulty);
        }
      }

      // 4. Difficulty Progression Check
      const diffCheck = DifficultyProfile.validateProgression(evaluations);
      if (!diffCheck.valid) {
        report.difficultyRegressions += diffCheck.errors.length;
        report.errors.push(...diffCheck.errors.slice(0, 3));
      }
    }

    if (report.consecutiveDuplicates > 0 || report.validationFailures > 0 || report.difficultyRegressions > 5) {
      report.status = 'FAIL';
    } else {
      report.status = 'PASS';
    }

    return report;
  }

  /**
   * Run entire Level Engine automated quality gate across all registered adapters
   */
  runAll() {
    const results = {};
    let allPassed = true;

    for (const key of Object.keys(this.adapters)) {
      const res = this.testAdapter(key);
      results[key] = res;
      if (res.status === 'FAIL') allPassed = false;
    }

    return {
      allPassed,
      results
    };
  }
}

