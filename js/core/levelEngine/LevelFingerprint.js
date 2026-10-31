/**
 * GAMINGZONE — LevelFingerprint
 * 
 * Computes canonical, deterministic gameplay fingerprints.
 * Ignores decorative colors, object IDs, timestamps, and cosmetic styling.
 * Compares structural topology, spatial coordinates, obstacles, hazards, and rules.
 */

export class LevelFingerprint {
  /**
   * Fast deterministic 32-bit FNV-1a hash
   * @param {string} str 
   * @returns {string} 8-character hex hash
   */
  static hashString(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Quantize a numeric coordinate to grid cell / resolution to prevent floating-point noise
   * @param {number} val 
   * @param {number} precision 
   * @returns {number}
   */
  static quantize(val, precision = 4) {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    return Math.round(val / precision) * precision;
  }

  /**
   * Generate canonical fingerprint object for a level
   * @param {Object} rawLevel 
   * @returns {string} canonical fingerprint string
   */
  static compute(rawLevel) {
    if (!rawLevel) return 'empty_level';

    const canonical = {
      genre: rawLevel.genre || 'generic',
      gridSize: rawLevel.gridSize || null,
      playerStart: rawLevel.player ? {
        x: this.quantize(rawLevel.player.x, 8),
        y: this.quantize(rawLevel.player.y, 8)
      } : null,
      targets: Array.isArray(rawLevel.targets)
        ? rawLevel.targets.map(t => ({
            x: this.quantize(t.x, 8),
            y: this.quantize(t.y, 8),
            type: t.type || 'target'
          })).sort((a, b) => (a.x - b.x) || (a.y - b.y))
        : [],
      obstacles: Array.isArray(rawLevel.obstacles)
        ? rawLevel.obstacles.map(o => ({
            x: this.quantize(o.x, 8),
            y: this.quantize(o.y, 8),
            w: this.quantize(o.w || o.width || 0, 8),
            h: this.quantize(o.h || o.height || 0, 8),
            type: o.type || 'solid'
          })).sort((a, b) => (a.x - b.x) || (a.y - b.y) || (a.w - b.w))
        : [],
      hazards: Array.isArray(rawLevel.hazards)
        ? rawLevel.hazards.map(h => ({
            x: this.quantize(h.x, 8),
            y: this.quantize(h.y, 8),
            type: h.type || 'hazard'
          })).sort((a, b) => (a.x - b.x) || (a.y - b.y))
        : [],
      elements: Array.isArray(rawLevel.elements)
        ? rawLevel.elements.map(e => ({
            x: this.quantize(e.x, 8),
            y: this.quantize(e.y, 8),
            val: e.val !== undefined ? e.val : e.dir || e.type || ''
          })).sort((a, b) => (a.x - b.x) || (a.y - b.y))
        : [],
      rules: {
        winCondition: rawLevel.winCondition || 'default',
        hazardSpeed: this.quantize(rawLevel.hazardSpeed || rawLevel.speed || 0, 2),
        timeLimit: rawLevel.timeLimit || 0
      }
    };

    const serialized = JSON.stringify(canonical);
    const hash = this.hashString(serialized);
    return `fp_${rawLevel.genre || 'g'}_${hash}`;
  }

  /**
   * Check if two level fingerprints are identical
   * @param {string} fp1 
   * @param {string} fp2 
   * @returns {boolean}
   */
  static isDuplicate(fp1, fp2) {
    if (!fp1 || !fp2) return false;
    return fp1 === fp2;
  }

  /**
   * Check if candidate fingerprint exists in rolling history
   * @param {string} candidateFp 
   * @param {Array<string>} history 
   * @returns {boolean}
   */
  static isInHistory(candidateFp, history = []) {
    if (!candidateFp || !Array.isArray(history)) return false;
    return history.includes(candidateFp);
  }
}

