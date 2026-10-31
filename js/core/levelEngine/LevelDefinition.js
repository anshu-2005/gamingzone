/**
 * GAMINGZONE — LevelDefinition
 * 
 * Formal container representing a verified, playable level instance.
 */

import { LevelFingerprint } from './LevelFingerprint.js';

export class LevelDefinition {
  /**
   * @param {Object} data 
   */
  constructor(data = {}) {
    this.id = data.id || `lvl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.index = data.index || 1;
    this.title = data.title || `Level ${this.index}`;
    this.genre = data.genre || 'arcade';
    this.seed = data.seed || 12345;
    
    // Geometry & Layout
    this.bounds = data.bounds || { minX: 0, maxX: 800, minY: 0, maxY: 600 };
    this.grid = data.grid || null;
    this.player = data.player || null;
    this.goal = data.goal || null;
    
    // Game Entities
    this.targets = Array.isArray(data.targets) ? data.targets : [];
    this.obstacles = Array.isArray(data.obstacles) ? data.obstacles : [];
    this.hazards = Array.isArray(data.hazards) ? data.hazards : [];
    this.mirrors = Array.isArray(data.mirrors) ? data.mirrors : [];
    this.elements = Array.isArray(data.elements) ? data.elements : [];
    
    // Difficulty & Timing
    this.difficulty = data.difficulty || { compositeScore: 100, speed: 200, density: 0.2 };
    this.timeLimit = data.timeLimit || 0; // 0 = unlimited
    this.winCondition = data.winCondition || 'all_targets';
    
    // Metadata & Verification
    this.isAuthored = Boolean(data.isAuthored);
    this.isBreather = Boolean(data.difficulty?.isBreather);
    this.fingerprint = data.fingerprint || LevelFingerprint.compute(this);
  }

  /**
   * Clone level definition
   * @returns {LevelDefinition}
   */
  clone() {
    return new LevelDefinition(JSON.parse(JSON.stringify(this)));
  }

  /**
   * Check if level matches another level by fingerprint
   * @param {LevelDefinition|string} other 
   * @returns {boolean}
   */
  matches(other) {
    const otherFp = typeof other === 'string' ? other : other?.fingerprint;
    return this.fingerprint === otherFp;
  }
}

