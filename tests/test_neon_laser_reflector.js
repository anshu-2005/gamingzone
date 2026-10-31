/* ====================================================
   NEON LASER REFLECTOR — EXPANDED REGRESSION & QA SUITE
   Verifies:
   - Level 1 & 2 correct solution
   - Level 3 fix verification (previously deadlocked)
   - Multi-chapter progression across all 52 levels
   - Hint system applying verified solutions
   - Clean state resets and safe level transitions
   ==================================================== */

const listeners = [];
class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.width = 860;
    this.height = 520;
    this.className = '';
    this.innerHTML = '';
  }
  appendChild(c) {
    if (c) { c.parentNode = this; this.children.push(c); }
    return c;
  }
  removeChild(c) {
    const idx = this.children.indexOf(c);
    if (idx !== -1) { this.children.splice(idx, 1); c.parentNode = null; }
    return c;
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  querySelector() { return new MockElement('button'); }
  querySelectorAll() { return []; }
  addEventListener(event, handler) { listeners.push({ target: this, event, handler }); }
  removeEventListener() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 860, height: 520 }; }
  getContext() {
    return {
      scale: () => {},
      clearRect: () => {}, fillRect: () => {}, strokeRect: () => {},
      beginPath: () => {}, closePath: () => {}, moveTo: () => {}, lineTo: () => {},
      stroke: () => {}, fill: () => {}, arc: () => {}, save: () => {}, restore: () => {},
      translate: () => {}, rotate: () => {}, fillText: () => {}, measureText: () => ({ width: 50 })
    };
  }
}

globalThis.document = {
  createElement: (tag) => new MockElement(tag),
  getElementById: () => null,
  body: new MockElement('body')
};

globalThis.window = {
  addEventListener: (event, handler) => listeners.push({ target: 'window', event, handler }),
  removeEventListener: () => {},
  devicePixelRatio: 1,
  innerWidth: 1024,
  innerHeight: 768,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id)
};

globalThis.getComputedStyle = () => ({ position: 'relative' });

const { NeonLaserReflectorGame } = await import('../js/games/NeonLaserReflector.js');
const { LASER_LEVELS } = await import('../js/data/laserLevels.js');

console.log('====================================================');
console.log('⚡ NEON LASER REFLECTOR — EXPANDED REGRESSION & QA SUITE');
console.log('====================================================\n');

const mockContainer = new MockElement('div');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// Test 1: Instantiation & Level Count
console.log('--- Test 1: Instantiation & Level Catalog ---');
const game = new NeonLaserReflectorGame(mockContainer, () => {});
assert(game !== null, 'Game instantiated successfully');
assert(game.totalLevels === 52, `Catalog contains 52 curated levels (Found: ${game.totalLevels})`);
assert(game.currentLevel === 1, 'Initial level begins at 1');

// Test 2: Level 1 Solution
console.log('\n--- Test 2: Level 1 Verified Solution ---');
game.loadLevel(1);
game.mirrors.forEach(m => m.angle = m.solution);
game.recalculateLaser(false);
assert(game.targets.every(t => t.hit), 'Level 1 target is 100% powered with solution angles');

// Test 3: Level 2 Solution
console.log('\n--- Test 3: Level 2 Verified Solution ---');
game.loadLevel(2);
game.mirrors.forEach(m => m.angle = m.solution);
game.recalculateLaser(false);
assert(game.targets.every(t => t.hit), 'Level 2 target is 100% powered with solution angles');

// Test 4: Level 3 Fix Verification (Was Unwinnable)
console.log('\n--- Test 4: Level 3 Fix Verification ---');
game.loadLevel(3);
assert(game.mirrors.length > 0, 'Level 3 has valid mirrors');
assert(game.targets.length > 0, 'Level 3 has valid targets');
game.mirrors.forEach(m => m.angle = m.solution);
game.recalculateLaser(false);
assert(game.targets.every(t => t.hit), 'Level 3 is now 100% solvable and no longer deadlocked!');

// Test 5: Multi-Chapter Sampling (Chapters 2, 3, 4, 5)
console.log('\n--- Test 5: Multi-Chapter Solvability Sampling ---');
const sampleLevels = [11, 21, 31, 41, 52];
for (const lvlNum of sampleLevels) {
  game.loadLevel(lvlNum);
  game.mirrors.forEach(m => m.angle = m.solution);
  game.recalculateLaser(false);
  assert(game.targets.every(t => t.hit), `Level ${lvlNum} (Chapter ${game.getCurrentChapter().id}) powers all ${game.targets.length} target crystals`);
}

// Test 6: Hint System
console.log('\n--- Test 6: Hint System Functionality ---');
game.loadLevel(5);
game.mirrors[0].angle = (game.mirrors[0].solution === 45 ? 135 : 45); // Unsettle mirror
const initialHints = game.hintsRemaining;
game.useHint();
assert(game.mirrors[0].angle === game.mirrors[0].solution, 'Hint corrected the unsettled mirror angle to solution');
assert(game.hintsRemaining === initialHints - 1, 'Hint count decremented cleanly');

// Test 7: Reset Level
console.log('\n--- Test 7: Reset Level Functionality ---');
const lvlBefore = game.currentLevel;
game.loadLevel(lvlBefore);
assert(game.currentLevel === lvlBefore, 'Reset restores identical level without skipping');

game.destroy();

console.log('\n====================================================');
console.log(`NEON LASER REFLECTOR TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

process.exit(failed > 0 ? 1 : 0);
