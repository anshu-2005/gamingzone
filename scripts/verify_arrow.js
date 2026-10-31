import { DatabaseSync } from 'node:sqlite';
import { ArrowSolver } from '../js/games/ArrowMazeEscape.js';
import { ARROW_MAZE_LEVELS } from '../js/data/arrowMazeLevels.js';

const db = new DatabaseSync('data/gamingzone.db');
const game = db.prepare("SELECT id, slug, title, engine, status, controls, description FROM games WHERE id = 'game_arrow_maze_escape'").get();
console.log('Arrow Game in DB:', game);

console.log('\n--- Verifying All 60 Shipped Levels with ArrowSolver ---');
let solvedCount = 0;
let failedLevels = [];

for (const lvl of ARROW_MAZE_LEVELS) {
  const result = ArrowSolver.solve(lvl.grid.rows, lvl.grid.cols, lvl.arrows);
  if (result.solvable && result.sequence.length === lvl.arrows.length) {
    solvedCount++;
  } else {
    failedLevels.push({ lvl: lvl.level, result });
  }
}

console.log(`Verified Solvable: ${solvedCount} / ${ARROW_MAZE_LEVELS.length}`);
if (failedLevels.length > 0) {
  console.error('Failed levels:', failedLevels);
  process.exit(1);
} else {
  console.log('✅ ALL 60 LEVELS ARE 100% SOLVABLE & GUARANTEED!');
}

