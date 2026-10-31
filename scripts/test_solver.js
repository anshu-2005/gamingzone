// Level generator and solver validator for Arrow Maze Escape
import fs from 'fs';

const DIRS = {
  UP: { dr: -1, dc: 0, name: 'UP', opp: 'DOWN' },
  DOWN: { dr: 1, dc: 0, name: 'DOWN', opp: 'UP' },
  LEFT: { dr: 0, dc: -1, name: 'LEFT', opp: 'RIGHT' },
  RIGHT: { dr: 0, dc: 1, name: 'RIGHT', opp: 'LEFT' }
};

export class LevelSolver {
  static solve(gridR, gridC, arrows) {
    let remaining = arrows.map(a => ({
      id: a.id,
      cells: [...a.cells],
      headDir: a.headDir
    }));

    const sequence = [];

    while (remaining.length > 0) {
      // Build occupancy
      const occ = new Map();
      for (const a of remaining) {
        for (const c of a.cells) {
          occ.set(`${c.r},${c.c}`, a.id);
        }
      }

      const free = [];
      for (const a of remaining) {
        const head = a.cells[a.cells.length - 1];
        const d = DIRS[a.headDir];
        let r = head.r + d.dr;
        let c = head.c + d.dc;
        let blocked = false;

        while (r >= 0 && r < gridR && c >= 0 && c < gridC) {
          const occupier = occ.get(`${r},${c}`);
          if (occupier && occupier !== a.id) {
            blocked = true;
            break;
          }
          r += d.dr;
          c += d.dc;
        }

        if (!blocked) {
          free.push(a);
        }
      }

      if (free.length === 0) {
        return { solvable: false, sequence, remaining: remaining.length };
      }

      // Pick free arrow
      const pick = free[0];
      sequence.push(pick.id);
      remaining = remaining.filter(a => a.id !== pick.id);
    }

    return { solvable: true, sequence };
  }
}

console.log('LevelSolver loaded.');

