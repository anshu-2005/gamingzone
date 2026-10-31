import { traceLaser } from './verify_laser_levels.js';

// Clean test level 1
const level1 = {
  emitter: { col: 0, row: 2, dir: 'RIGHT' },
  mirrors: [
    { col: 4, row: 2 },
    { col: 4, row: 4 }
  ],
  targets: [{ col: 8, row: 4 }],
  blocks: [],
  prisms: []
};

// Try all angle combinations [45, 135, 225, 315]
function solve(level) {
  const angles = [45, 135];
  const n = level.mirrors.length;
  const total = Math.pow(2, n);

  for (let i = 0; i < total; i++) {
    const combo = [];
    for (let j = 0; j < n; j++) {
      combo.push((i >> j) & 1 ? 135 : 45);
    }
    const res = traceLaser(level, combo);
    if (res.allTargetsHit) {
      return combo;
    }
  }
  return null;
}

console.log('Level 1 solution:', solve(level1));

