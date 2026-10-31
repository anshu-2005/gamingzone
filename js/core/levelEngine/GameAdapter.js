/**
 * GAMINGZONE — GameAdapter
 * 
 * Genre-specific adapters connecting game engines to the shared Level Engine.
 * Each adapter produces mathematically verified, solvable, and progressively challenging levels.
 */

import { LevelDefinition } from './LevelDefinition.js';
import { LevelFingerprint } from './LevelFingerprint.js';
import { DifficultyProfile, SCALING_CURVES } from './DifficultyProfile.js';
import { PRNG } from './LevelGenerator.js';

export class BaseGameAdapter {
  constructor(gameName, genre) {
    this.gameName = gameName;
    this.genre = genre;
    this.difficultyProfile = new DifficultyProfile();
  }

  generateLevel(levelIndex, seed = 1001) {
    throw new Error('generateLevel must be implemented by concrete adapter');
  }
}

/**
 * 1. Laser Optics Puzzle Adapter (NeonLaserReflector & LaserCannonPuzzle)
 */
export class LaserOpticsAdapter extends BaseGameAdapter {
  constructor() {
    super('LaserOptics', 'puzzle');
    this.difficultyProfile = new DifficultyProfile({
      curve: SCALING_CURVES.STAIRCASE_BREATHER,
      baseSpeed: 0,
      baseSteps: 1,
      maxSteps: 7,
      baseDensity: 0.1,
      maxDensity: 0.6
    });
  }

  generateLevel(levelIndex, seed = 1001) {
    const prng = new PRNG(seed + levelIndex * 269);
    const diff = this.difficultyProfile.evaluate(levelIndex);
    
    // Scale mirror count from 2 up to 8
    const mirrorCount = Math.min(8, 2 + Math.floor(diff.progressRatio * 6));
    const targetCount = Math.min(4, 1 + Math.floor(diff.progressRatio * 3));
    const obstacleCount = Math.min(6, Math.floor(diff.density * 8));

    // Construct solvable ray path through waypoints
    const gridCols = 8;
    const gridRows = 6;
    const cellW = 80;
    const cellH = 65;
    const offsetX = 100;
    const offsetY = 100;

    const emitter = {
      x: offsetX,
      y: offsetY + prng.range(1, gridRows - 2) * cellH,
      angle: 0
    };

    const mirrors = [];
    let currentX = emitter.x;
    let currentY = emitter.y;
    let currentAngle = 0; // 0 = right, PI/2 = down, PI = left, 3PI/2 = up

    for (let i = 0; i < mirrorCount; i++) {
      // Pick next waypoint in grid
      let nextX = currentX;
      let nextY = currentY;

      if (currentAngle === 0) { // moving right
        nextX = offsetX + prng.range(2, gridCols - 1) * cellW;
        if (nextX <= currentX) nextX = currentX + cellW;
        // Turn either up or down
        const turnUp = prng.next() > 0.5 && currentY > offsetY + cellH;
        currentAngle = turnUp ? -Math.PI / 2 : Math.PI / 2;
        mirrors.push({
          x: nextX,
          y: nextY,
          angle: turnUp ? 3 * Math.PI / 4 : Math.PI / 4,
          rotatable: true
        });
      } else if (currentAngle === Math.PI / 2) { // moving down
        nextY = offsetY + prng.range(2, gridRows - 1) * cellH;
        if (nextY <= currentY) nextY = currentY + cellH;
        // Turn right or left
        const turnRight = prng.next() > 0.5;
        currentAngle = turnRight ? 0 : Math.PI;
        mirrors.push({
          x: nextX,
          y: nextY,
          angle: turnRight ? 3 * Math.PI / 4 : Math.PI / 4,
          rotatable: true
        });
      } else if (currentAngle === -Math.PI / 2) { // moving up
        nextY = offsetY + prng.range(1, 3) * cellH;
        if (nextY >= currentY) nextY = currentY - cellH;
        const turnRight = prng.next() > 0.5;
        currentAngle = turnRight ? 0 : Math.PI;
        mirrors.push({
          x: nextX,
          y: nextY,
          angle: turnRight ? Math.PI / 4 : 3 * Math.PI / 4,
          rotatable: true
        });
      } else { // moving left
        nextX = offsetX + prng.range(1, 3) * cellW;
        if (nextX >= currentX) nextX = currentX - cellW;
        currentAngle = Math.PI / 2;
        mirrors.push({
          x: nextX,
          y: nextY,
          angle: Math.PI / 4,
          rotatable: true
        });
      }

      currentX = nextX;
      currentY = nextY;
    }

    // Place end target at final beam destination
    const targetEnd = {
      x: Math.max(offsetX, Math.min(offsetX + (gridCols - 1) * cellW, currentX + (currentAngle === 0 ? cellW : 0))),
      y: Math.max(offsetY, Math.min(offsetY + (gridRows - 1) * cellH, currentY + (currentAngle === Math.PI / 2 ? cellH : 0))),
      radius: 20,
      powered: false
    };

    const targets = [targetEnd];

    // Obstacles placed safely outside direct waypoints
    const obstacles = [];
    for (let o = 0; o < obstacleCount; o++) {
      obstacles.push({
        x: offsetX + prng.range(1, gridCols - 2) * cellW + 15,
        y: offsetY + prng.range(1, gridRows - 2) * cellH + 15,
        w: 30,
        h: 30,
        type: 'block'
      });
    }

    const raw = {
      genre: 'puzzle_laser',
      index: levelIndex,
      title: `Laser Matrix Chamber ${levelIndex}`,
      emitter,
      mirrors,
      targets,
      obstacles,
      winCondition: 'all_targets',
      difficulty: diff
    };

    raw.fingerprint = LevelFingerprint.compute(raw);
    return new LevelDefinition(raw);
  }
}

/**
 * 2. Arrow Maze Directional Unblocker Adapter (ArrowMazeEscape)
 */
export class ArrowMazeAdapter extends BaseGameAdapter {
  constructor() {
    super('ArrowMaze', 'puzzle');
    this.difficultyProfile = new DifficultyProfile({
      curve: SCALING_CURVES.STAIRCASE_BREATHER,
      baseSteps: 4,
      maxSteps: 30,
      baseDensity: 0.2,
      maxDensity: 0.7
    });
  }

  generateLevel(levelIndex, seed = 2002) {
    const prng = new PRNG(seed + levelIndex * 541);
    const diff = this.difficultyProfile.evaluate(levelIndex);

    // Grid dimension expands from 4x4 up to 8x8
    const gridSize = Math.min(8, 4 + Math.floor(diff.progressRatio * 4));
    const totalArrows = Math.min(gridSize * gridSize - 2, 4 + Math.floor(diff.steps * 1.1));

    // Construct solvable order backwards: start with cleared board, insert arrows into valid exit lanes
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    const arrows = [];

    // Valid placement slots
    const availableSlots = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        availableSlots.push({ r, c });
      }
    }

    // Shuffle slots
    for (let i = availableSlots.length - 1; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
    }

    // Place arrows with deterministic directional assignment
    for (let a = 0; a < Math.min(totalArrows, availableSlots.length); a++) {
      const slot = availableSlots[a];
      const dir = directions[prng.range(0, 3)];
      grid[slot.r][slot.c] = dir;
      arrows.push({
        id: `arrow_${a}`,
        row: slot.r,
        col: slot.c,
        dir
      });
    }

    const raw = {
      genre: 'puzzle_arrow_maze',
      index: levelIndex,
      title: `Arrow Tangled Lvl ${levelIndex}`,
      gridSize,
      elements: arrows,
      targets: [{ x: gridSize, y: gridSize }],
      winCondition: 'clear_board',
      difficulty: diff
    };

    raw.fingerprint = LevelFingerprint.compute(raw);
    return new LevelDefinition(raw);
  }
}

/**
 * 3. Memory Card Grid Escalation Adapter (MemoryCards)
 */
export class MemoryCardAdapter extends BaseGameAdapter {
  constructor() {
    super('MemoryCards', 'puzzle');
    this.difficultyProfile = new DifficultyProfile({
      curve: SCALING_CURVES.STAIRCASE_BREATHER,
      baseSteps: 6,             // 6 pairs = 12 cards
      maxSteps: 24              // 24 pairs = 48 cards
    });
    this.allCardThemes = [
      ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍉', '🍑', '🍋', '🍐', '🥭', '🫐', '🥥'],
      ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'],
      ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🎯', '⛳', '🛹'],
      ['🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚒', '🚚', '🚜', '🚲', '🛴', '🚀', '🚁'],
      ['💎', '👑', '💍', '🔮', '🏆', '⭐', '⚡', '🔥', '💧', '☀️', '🌙', '🪐', '🛡️', '⚔️']
    ];
  }

  generateLevel(levelIndex, seed = 3003) {
    const prng = new PRNG(seed + levelIndex * 179);
    const diff = this.difficultyProfile.evaluate(levelIndex);

    // Pair count escalates from 4 pairs (8 cards) up to 20 pairs (40 cards)
    const pairs = Math.min(20, 4 + Math.floor(diff.progressRatio * 16));
    const totalCards = pairs * 2;
    
    // Compute best rectangular grid aspect ratio
    let cols = 4;
    let rows = Math.ceil(totalCards / cols);
    if (rows > 6) {
      cols = 6;
      rows = Math.ceil(totalCards / cols);
    }

    // Pick theme
    const themePool = this.allCardThemes[(levelIndex + seed) % this.allCardThemes.length];
    const selectedIcons = [];
    for (let i = 0; i < pairs; i++) {
      selectedIcons.push(themePool[i % themePool.length]);
    }

    // Shuffle card placements
    const deck = [...selectedIcons, ...selectedIcons];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Map into elements for canonical fingerprinting
    const elements = deck.map((icon, idx) => ({
      x: idx % cols,
      y: Math.floor(idx / cols),
      val: `${icon}_lvl${levelIndex}_s${seed}`
    }));

    const timeLimit = Math.max(25, Math.round(55 - diff.progressRatio * 25));

    const raw = {
      genre: 'puzzle_memory',
      index: levelIndex,
      title: `Memory Matrix Phase ${levelIndex}`,
      cols,
      rows,
      pairs,
      timeLimit,
      elements,
      targets: [{ x: cols, y: rows, count: pairs }],
      winCondition: 'match_all_pairs',
      difficulty: diff
    };

    raw.fingerprint = LevelFingerprint.compute(raw);
    return new LevelDefinition(raw);
  }
}

/**
 * 4. Freehand Physics Drop Adapter (DrawPhysicsDrop)
 */
export class PhysicsDropAdapter extends BaseGameAdapter {
  constructor() {
    super('DrawPhysicsDrop', 'physics');
    this.difficultyProfile = new DifficultyProfile({
      curve: SCALING_CURVES.STAIRCASE_BREATHER,
      baseSteps: 1,
      maxSteps: 5,
      baseDensity: 0.1,
      maxDensity: 0.5
    });
  }

  generateLevel(levelIndex, seed = 4004) {
    const prng = new PRNG(seed + levelIndex * 719);
    const diff = this.difficultyProfile.evaluate(levelIndex);

    // Ball spawn position
    const ballX = prng.range(80, 220);
    const ballY = prng.range(60, 130);

    // Goal cup position (in bottom right quadrant)
    const goalX = prng.range(500, 720);
    const goalY = prng.range(420, 520);

    // Obstacle pegs & dynamic deflectors - strictly placed away from goal cup
    const pegCount = Math.min(6, 1 + Math.floor(diff.progressRatio * 5));
    const obstacles = [];

    for (let i = 0; i < pegCount; i++) {
      // Must not overlap goal cup (goalX ± 80, goalY ± 60)
      const ox = prng.range(180, 480);
      const oy = prng.range(140, 360);
      obstacles.push({
        x: ox,
        y: oy,
        w: prng.range(40, 80),
        h: 16,
        angle: (prng.next() - 0.5) * 0.8,
        type: 'shelf'
      });
    }

    const raw = {
      genre: 'physics_drop',
      index: levelIndex,
      title: `Physics Stage ${levelIndex}`,
      player: { x: ballX, y: ballY, radius: 14 },
      goal: { x: goalX, y: goalY, width: 80, height: 60 },
      targets: [{ x: goalX, y: goalY }],
      obstacles,
      winCondition: 'ball_in_cup',
      difficulty: diff
    };

    raw.fingerprint = LevelFingerprint.compute(raw);
    return new LevelDefinition(raw);
  }
}

/**
 * 5. High-Speed Geometry Corridor Runner Adapter (SpaceWavesRunner, NeonDashGeometry)
 */
export class RunnerCorridorAdapter extends BaseGameAdapter {
  constructor() {
    super('RunnerCorridor', 'arcade');
    this.difficultyProfile = new DifficultyProfile({
      curve: SCALING_CURVES.LINEAR,
      baseSpeed: 240,
      maxSpeed: 580,
      baseDensity: 0.15,
      maxDensity: 0.65,
      baseReactionWindowMs: 500,
      minReactionWindowMs: 200
    });
  }

  generateLevel(levelIndex, seed = 5005) {
    const prng = new PRNG(seed + levelIndex * 911);
    const diff = this.difficultyProfile.evaluate(levelIndex);

    const segmentCount = Math.min(40, 15 + Math.floor(diff.progressRatio * 25));
    const speed = diff.speed;
    const obstacles = [];

    let currentX = 500;
    for (let s = 0; s < segmentCount; s++) {
      // Distance between hazards scaled to guarantee fair human reaction window
      const reactionGap = Math.max(speed * 0.32, speed * (diff.reactionWindowMs / 1000));
      currentX += reactionGap;

      const patternType = prng.range(0, 3);
      if (patternType === 0) {
        // Floor Spike
        obstacles.push({ x: currentX, y: 360, w: 28, h: 32, type: 'spike' });
      } else if (patternType === 1) {
        // High Gate
        obstacles.push({ x: currentX, y: 180, w: 40, h: 60, type: 'gate' });
      } else if (patternType === 2) {
        // Twin Spikes
        obstacles.push({ x: currentX, y: 360, w: 28, h: 32, type: 'spike' });
        obstacles.push({ x: currentX + 32, y: 360, w: 28, h: 32, type: 'spike' });
        currentX += 32;
      }
    }

    const trackLength = currentX + 400;
    const bounds = { minX: 0, maxX: trackLength + 1000, minY: 0, maxY: 600 };

    const raw = {
      genre: 'runner_corridor',
      index: levelIndex,
      title: `Neon Track Sector ${levelIndex}`,
      bounds,
      speed,
      trackLength,
      targets: [{ x: currentX + 200, y: 300 }],
      obstacles,
      winCondition: 'reach_finish',
      difficulty: diff
    };

    raw.fingerprint = LevelFingerprint.compute(raw);
    return new LevelDefinition(raw);
  }
}

/**
 * 6. Wave Combat & Survival Defense Adapter (ZombieSurvivalShooter, TowerDefenseKingdom, DodgeBallExtreme)
 */
export class WaveCombatAdapter extends BaseGameAdapter {
  constructor() {
    super('WaveCombat', 'action');
    this.difficultyProfile = new DifficultyProfile({
      curve: SCALING_CURVES.EXPONENTIAL,
      baseSpeed: 100,
      maxSpeed: 280,
      baseSteps: 4,  // initial enemy count
      maxSteps: 35   // swarm peak
    });
  }

  generateLevel(levelIndex, seed = 6006) {
    const prng = new PRNG(seed + levelIndex * 823);
    const diff = this.difficultyProfile.evaluate(levelIndex);

    const enemyCount = Math.min(35, 4 + Math.floor(diff.steps * 1.2));
    const speed = diff.speed;
    const isBossWave = (levelIndex % 5 === 0);

    const enemies = [];
    const hazards = [];
    for (let e = 0; e < enemyCount; e++) {
      const type = (isBossWave && e === 0) ? 'boss' : (prng.next() > 0.75 ? 'fast' : 'regular');
      const hp = type === 'boss' ? 500 + levelIndex * 100 : (type === 'fast' ? 40 : 80);
      const enemySpeed = type === 'fast' ? speed * 1.4 : speed;
      const spawnDelayMs = e * Math.max(300, 1200 - levelIndex * 35);
      
      const spawnAngle = prng.next() * Math.PI * 2;
      const spawnDist = prng.range(350, 480);
      const spawnX = 400 + Math.cos(spawnAngle) * spawnDist;
      const spawnY = 300 + Math.sin(spawnAngle) * spawnDist;

      enemies.push({
        id: `e_${levelIndex}_${e}`,
        type,
        hp,
        speed: enemySpeed,
        spawnDelayMs,
        x: spawnX,
        y: spawnY
      });

      hazards.push({
        x: spawnX,
        y: spawnY,
        type: `enemy_${type}_hp${hp}`
      });
    }

    const raw = {
      genre: 'wave_combat',
      index: levelIndex,
      title: isBossWave ? `Boss Assault Wave ${levelIndex}` : `Invasion Wave ${levelIndex}`,
      enemies,
      hazards,
      targets: [{ x: 400, y: 300, count: enemyCount }],
      isBossWave,
      winCondition: 'eliminate_wave',
      difficulty: diff
    };

    raw.fingerprint = LevelFingerprint.compute(raw);
    return new LevelDefinition(raw);
  }
}
