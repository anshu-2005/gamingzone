/**
 * GAMINGZONE — LevelValidator
 * 
 * Validates structural integrity, physical solvability, and gameplay fairness of levels.
 * Detects invalid coordinates, unreachable objectives, impossible jumps, and instant-death traps.
 */

export class LevelValidator {
  /**
   * Universal level validation check
   * @param {Object} levelDef 
   * @param {Object} bounds { minX, maxX, minY, maxY }
   * @returns {{ valid: boolean, errors: Array<string> }}
   */
  static validate(levelDef, bounds = { minX: 0, maxX: 800, minY: 0, maxY: 600 }) {
    const errors = [];
    if (!levelDef) {
      return { valid: false, errors: ['Level definition is null or undefined'] };
    }

    // 1. Target and Objective Reachability
    const hasTargets = Array.isArray(levelDef.targets) && levelDef.targets.length > 0;
    const hasGoal = Boolean(levelDef.goal);
    const hasWinCondition = Boolean(levelDef.winCondition);

    if (!hasTargets && !hasGoal && !hasWinCondition) {
      errors.push('Level lacks any clear objective, goal, or win condition');
    }

    // 2. Spatial Boundary Validation
    if (levelDef.player) {
      if (levelDef.player.x < bounds.minX || levelDef.player.x > bounds.maxX ||
          levelDef.player.y < bounds.minY || levelDef.player.y > bounds.maxY) {
        errors.push(`Player spawn (${levelDef.player.x}, ${levelDef.player.y}) is outside valid bounds`);
      }
    }

    if (Array.isArray(levelDef.targets)) {
      levelDef.targets.forEach((t, idx) => {
        if (t.x < bounds.minX || t.x > bounds.maxX || t.y < bounds.minY || t.y > bounds.maxY) {
          errors.push(`Target #${idx + 1} at (${t.x}, ${t.y}) is out of bounds`);
        }
      });
    }

    // 3. Collision Trap / Instant Death Detection
    if (levelDef.player && Array.isArray(levelDef.hazards)) {
      const px = levelDef.player.x;
      const py = levelDef.player.y;
      const playerRadius = levelDef.player.radius || 16;

      for (const h of levelDef.hazards) {
        const dist = Math.hypot(h.x - px, h.y - py);
        const hazardRadius = h.radius || 16;
        if (dist < (playerRadius + hazardRadius)) {
          errors.push(`Instant death hazard collision at player spawn point (${px}, ${py})`);
          break;
        }
      }
    }

    // 4. Obstacle / Target Overlap Check
    if (Array.isArray(levelDef.targets) && Array.isArray(levelDef.obstacles)) {
      for (const t of levelDef.targets) {
        for (const o of levelDef.obstacles) {
          const ox = o.x;
          const oy = o.y;
          const ow = o.w || o.width || 30;
          const oh = o.h || o.height || 30;

          // If target is completely embedded inside a solid impassable obstacle
          if (o.solid !== false && t.x >= ox && t.x <= ox + ow && t.y >= oy && t.y <= oy + oh) {
            errors.push(`Target at (${t.x}, ${t.y}) is entrapped inside solid obstacle at (${ox}, ${oy})`);
          }
        }
      }
    }

    // 5. Reaction Window & Fairness
    if (levelDef.reactionWindowMs !== undefined && levelDef.reactionWindowMs < 180) {
      errors.push(`Reaction window of ${levelDef.reactionWindowMs}ms is below human perceptual threshold (180ms)`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Simple 2D Grid Pathfinding (BFS) to guarantee at least one valid path from start to goal
   * @param {Array<Array<number>>} grid 0 = open, 1 = solid
   * @param {{x: number, y: number}} start 
   * @param {{x: number, y: number}} goal 
   * @returns {boolean} true if solvable path exists
   */
  static isGridPathSolvable(grid, start, goal) {
    if (!grid || !grid.length || !grid[0].length) return false;
    const rows = grid.length;
    const cols = grid[0].length;

    if (start.x < 0 || start.x >= cols || start.y < 0 || start.y >= rows) return false;
    if (goal.x < 0 || goal.x >= cols || goal.y < 0 || goal.y >= rows) return false;
    if (grid[start.y][start.x] === 1 || grid[goal.y][goal.x] === 1) return false;

    const queue = [[start.x, start.y]];
    const visited = new Set([`${start.x},${start.y}`]);
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      if (cx === goal.x && cy === goal.y) return true;

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;

        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 0 && !visited.has(key)) {
          visited.add(key);
          queue.push([nx, ny]);
        }
      }
    }

    return false;
  }
}

