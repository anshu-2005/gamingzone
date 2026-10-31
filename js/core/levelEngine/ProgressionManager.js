/**
 * GAMINGZONE — ProgressionManager
 * 
 * Manages player progression, level history, repetition detection, and persistence.
 * Prevents consecutive duplicates and enforces rolling-history uniqueness.
 */

import { LevelFingerprint } from './LevelFingerprint.js';

export class ProgressionManager {
  /**
   * @param {string} gameId 
   * @param {Object} options 
   */
  constructor(gameId, options = {}) {
    this.gameId = gameId || 'generic_game';
    this.maxHistorySize = options.maxHistorySize || 50;
    this.storageKey = `gz_prog_${this.gameId}`;
    
    // In-memory state
    this.currentLevelIndex = 1;
    this.highestUnlocked = 1;
    this.historyFingerprints = [];
    this.levelScores = {};
    this.levelStars = {};

    this.load();
  }

  /**
   * Load progression from local storage
   */
  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.currentLevelIndex = Math.max(1, parsed.currentLevelIndex || 1);
          this.highestUnlocked = Math.max(this.currentLevelIndex, parsed.highestUnlocked || 1);
          this.historyFingerprints = Array.isArray(parsed.historyFingerprints) ? parsed.historyFingerprints.slice(-this.maxHistorySize) : [];
          this.levelScores = parsed.levelScores || {};
          this.levelStars = parsed.levelStars || {};
        }
      }
    } catch (e) {
      console.warn(`[ProgressionManager] Failed to load progress for ${this.gameId}:`, e);
    }
  }

  /**
   * Save progression to local storage
   */
  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = {
          currentLevelIndex: this.currentLevelIndex,
          highestUnlocked: this.highestUnlocked,
          historyFingerprints: this.historyFingerprints.slice(-this.maxHistorySize),
          levelScores: this.levelScores,
          levelStars: this.levelStars,
          updatedAt: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (e) {}
  }

  /**
   * Register a level instance and verify uniqueness against history
   * @param {Object|string} levelDefOrFp 
   * @returns {{ isUnique: boolean, isConsecutiveDuplicate: boolean }}
   */
  registerLevel(levelDefOrFp) {
    const fp = typeof levelDefOrFp === 'string'
      ? levelDefOrFp
      : (levelDefOrFp.fingerprint || LevelFingerprint.compute(levelDefOrFp));

    const lastFp = this.historyFingerprints[this.historyFingerprints.length - 1];
    const isConsecutiveDuplicate = Boolean(lastFp && lastFp === fp);
    const isUnique = !this.historyFingerprints.includes(fp);

    // Push into rolling history
    this.historyFingerprints.push(fp);
    if (this.historyFingerprints.length > this.maxHistorySize) {
      this.historyFingerprints.shift();
    }
    this.save();

    return {
      isUnique,
      isConsecutiveDuplicate
    };
  }

  /**
   * Check if candidate fingerprint would duplicate recent history without recording it
   * @param {string} fp 
   * @returns {boolean}
   */
  isDuplicate(fp) {
    return this.historyFingerprints.includes(fp);
  }

  /**
   * Advance to the next level
   * @param {number} scoreForCompletedLevel 
   * @param {number} stars 
   * @returns {number} new current level index
   */
  advanceLevel(scoreForCompletedLevel = 0, stars = 3) {
    this.levelScores[this.currentLevelIndex] = Math.max(scoreForCompletedLevel, this.levelScores[this.currentLevelIndex] || 0);
    this.levelStars[this.currentLevelIndex] = Math.max(stars, this.levelStars[this.currentLevelIndex] || 0);

    this.currentLevelIndex++;
    if (this.currentLevelIndex > this.highestUnlocked) {
      this.highestUnlocked = this.currentLevelIndex;
    }
    this.save();
    return this.currentLevelIndex;
  }

  /**
   * Reset progression
   * @param {boolean} clearHistory 
   */
  reset(clearHistory = false) {
    this.currentLevelIndex = 1;
    if (clearHistory) {
      this.highestUnlocked = 1;
      this.historyFingerprints = [];
      this.levelScores = {};
      this.levelStars = {};
    }
    this.save();
  }
}

