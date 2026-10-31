/* ====================================================
   NEON LASER REFLECTOR — GAMINGZONE EXPANDED EDITION
   Optic Laser Beam Routing & Reflection Puzzle
   - 52 Curated, 100% Mathematically Verified Levels
   - 5 Chapters: Optic Awakening, Cyber Circuit Routing,
     Quantum Obstacles, Prism Beam Splitting, Matrix Grandmaster
   - Rotatable Mirrors (90° increments), Absorbing Barriers, Prisms
   - Multi-Target Crystal Sensors, Particle Glow & Laser Dispersion
   - Level Selector, Chapter Progress, Reset & Hint System
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';
import { LASER_LEVELS, LASER_CHAPTERS } from '../data/laserLevels.js';
import { PRNG } from '../core/levelEngine/index.js';

export class NeonLaserReflectorGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Neon Laser Reflector',
      targetScore: 50000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.currentLevel = 1;
    this.totalLevels = LASER_LEVELS.length;
    this.gridCols = 10;
    this.gridRows = 6;
    this.cellSize = 64;
    this.gridOffsetX = 110;
    this.gridOffsetY = 72;

    this.emitter = { col: 0, row: 2, dir: 'RIGHT' };
    this.mirrors = [];
    this.targets = [];
    this.blocks = [];
    this.prisms = [];
    this.beamSegments = [];
    this.particles = [];
    this.isClearing = false;
    this.clearTimer = null;

    // Hint system
    this.hintsRemaining = 3;

    // Progress persistence
    this.highestUnlockedLevel = 1;
    try {
      const saved = localStorage.getItem('gz_laser_unlocked');
      if (saved) this.highestUnlockedLevel = Math.max(1, parseInt(saved, 10));
    } catch (e) {}

    this.initControls();
    this.loadLevel(this.currentLevel);

    this.attachTouchControls({
      showDpad: false,
      onAction: () => this.rotateSelectedMirror()
    });

    this.showStartCard({
      title: 'NEON LASER REFLECTOR',
      icon: '⚡',
      objective: 'Click or tap mirror cubes to rotate them 90°! Reflect the laser beam to power all target crystals across 52 cyber chambers.',
      controls: 'Click mirror to rotate • Press [R] to Reset • Press [H] for Hint.',
      onStart: () => {
        this.currentLevel = 1;
        this.score = 0;
        this.loadLevel(1);
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        sounds.playClick?.();
        this.loadLevel(this.currentLevel);
      } else if (e.key === 'h' || e.key === 'H') {
        this.useHint();
      } else if (e.key === 'n' && e.ctrlKey) {
        // Dev jump next
        if (this.currentLevel < this.totalLevels) {
          this.loadLevel(this.currentLevel + 1);
        }
      }
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', (e) => {
        if (this.state !== GameState.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check Click on Top Bar Buttons (Reset, Hint)
        if (clickY <= 50) {
          if (clickX >= 640 && clickX <= 730) {
            // Hint Button
            this.useHint();
            return;
          } else if (clickX >= 745 && clickX <= 830) {
            // Reset Button
            sounds.playClick?.();
            this.loadLevel(this.currentLevel);
            return;
          }
        }

        // Check Mirror Clicks
        const col = Math.floor((clickX - this.gridOffsetX) / this.cellSize);
        const row = Math.floor((clickY - this.gridOffsetY) / this.cellSize);

        for (const m of this.mirrors) {
          if (m.col === col && m.row === row) {
            sounds.playClick?.();
            // Rotate mirror 90 degrees
            m.angle = (m.angle + 90) % 360;
            this.createMirrorSparkles(col, row);
            this.recalculateLaser();
            break;
          }
        }
      });
    }
  }

  useHint() {
    if (this.hintsRemaining <= 0) return;
    const unsettled = this.mirrors.find(m => m.angle !== m.solution && (m.angle + 180) % 360 !== m.solution);
    if (unsettled) {
      unsettled.angle = unsettled.solution;
      this.hintsRemaining--;
      sounds.playCoin?.();
      this.createMirrorSparkles(unsettled.col, unsettled.row);
      this.recalculateLaser();
    }
  }

  rotateSelectedMirror() {
    if (this.mirrors.length > 0) {
      this.mirrors[0].angle = (this.mirrors[0].angle + 90) % 360;
      this.recalculateLaser();
    }
  }

  loadLevel(lvl) {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
    this.isClearing = false;

    // Progression beyond curated campaign uses procedurally generated unique levels
    this.currentLevel = Math.max(1, lvl);

    // Update persistence
    if (this.currentLevel > this.highestUnlockedLevel) {
      this.highestUnlockedLevel = this.currentLevel;
      try {
        localStorage.setItem('gz_laser_unlocked', String(this.highestUnlockedLevel));
      } catch (e) {}
    }

    let lvlData = LASER_LEVELS[this.currentLevel - 1];
    if (!lvlData) {
      // Procedurally generate unique non-repeating optical puzzle
      const prng = new PRNG(this.currentLevel * 313);
      const row1 = prng.range(1, 2);
      const row2 = prng.range(4, 5);
      const colM1 = prng.range(2, 4);
      const colM2 = prng.range(5, 7);
      const colTarget = 9;

      lvlData = {
        id: this.currentLevel,
        chapter: 5,
        title: `Quantum Infinite Lvl ${this.currentLevel}`,
        emitter: { col: 0, row: row1, dir: 'RIGHT' },
        mirrors: [
          { col: colM1, row: row1, angle: 45, solution: 135 },
          { col: colM1, row: row2, angle: 45, solution: 135 },
          { col: colM2, row: row2, angle: 45, solution: 135 },
          { col: colM2, row: row1, angle: 45, solution: 135 }
        ],
        targets: [{ col: colTarget, row: row1 }],
        blocks: [{ col: Math.floor((colM1 + colM2) / 2), row: 3 }],
        prisms: []
      };
    }

    this.emitter = { ...lvlData.emitter };
    this.mirrors = lvlData.mirrors.map(m => ({ ...m }));
    this.targets = lvlData.targets.map(t => ({ ...t, hit: false }));
    this.blocks = (lvlData.blocks || []).map(b => ({ ...b }));
    this.prisms = (lvlData.prisms || []).map(p => ({ ...p }));
    this.beamSegments = [];
    this.particles = [];

    this.recalculateLaser(false); // initial trace without triggering premature victory
  }

  createMirrorSparkles(col, row) {
    const cx = this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
    const cy = this.gridOffsetY + row * this.cellSize + this.cellSize / 2;
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color: '#00e5ff'
      });
    }
  }

  recalculateLaser(checkWin = true) {
    this.beamSegments = [];
    this.targets.forEach(t => t.hit = false);

    const maxBounces = 30;
    const queue = [{
      col: this.emitter.col,
      row: this.emitter.row,
      dir: this.emitter.dir,
      bounces: 0
    }];

    while (queue.length > 0) {
      const ray = queue.shift();
      let { col, row, dir, bounces } = ray;

      let startX = this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
      let startY = this.gridOffsetY + row * this.cellSize + this.cellSize / 2;

      while (bounces < maxBounces) {
        bounces++;
        let nextCol = col;
        let nextRow = row;

        if (dir === 'RIGHT') nextCol++;
        else if (dir === 'LEFT') nextCol--;
        else if (dir === 'DOWN') nextRow++;
        else if (dir === 'UP') nextRow--;

        // Grid boundaries check
        if (nextCol < 0 || nextCol >= this.gridCols || nextRow < 0 || nextRow >= this.gridRows) {
          const endX = this.gridOffsetX + (nextCol < 0 ? 0 : Math.min(this.gridCols, nextCol)) * this.cellSize;
          const endY = this.gridOffsetY + (nextRow < 0 ? 0 : Math.min(this.gridRows, nextRow)) * this.cellSize;
          this.beamSegments.push({ x1: startX, y1: startY, x2: endX, y2: endY });
          break;
        }

        col = nextCol;
        row = nextRow;
        const endX = this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
        const endY = this.gridOffsetY + row * this.cellSize + this.cellSize / 2;
        this.beamSegments.push({ x1: startX, y1: startY, x2: endX, y2: endY });
        startX = endX;
        startY = endY;

        // Obstacle block collision
        if (this.blocks.some(b => b.col === col && b.row === row)) {
          break;
        }

        // Target Crystal Hit
        for (const t of this.targets) {
          if (t.col === col && t.row === row) {
            t.hit = true;
          }
        }

        // Prism Beam Splitter
        if (this.prisms.some(p => p.col === col && p.row === row)) {
          const splitDir = (dir === 'RIGHT' || dir === 'LEFT') ? (row >= 3 ? 'UP' : 'DOWN') : 'RIGHT';
          queue.push({ col, row, dir: splitDir, bounces });
          // Primary continues straight
          continue;
        }

        // Mirror Reflection
        const mirror = this.mirrors.find(m => m.col === col && m.row === row);
        if (mirror) {
          const isSlash = (mirror.angle === 45 || mirror.angle === 225);
          if (isSlash) {
            // Slash '/' reflection
            if (dir === 'RIGHT') dir = 'UP';
            else if (dir === 'UP') dir = 'RIGHT';
            else if (dir === 'LEFT') dir = 'DOWN';
            else if (dir === 'DOWN') dir = 'LEFT';
          } else {
            // Backslash '\' reflection (135 or 315)
            if (dir === 'RIGHT') dir = 'DOWN';
            else if (dir === 'DOWN') dir = 'RIGHT';
            else if (dir === 'UP') dir = 'LEFT';
            else if (dir === 'LEFT') dir = 'UP';
          }
        }
      }
    }

    // Check Level Complete
    if (checkWin && !this.isClearing && this.targets.length > 0 && this.targets.every(t => t.hit)) {
      this.isClearing = true;
      sounds.playWin?.();
      this.score += 1000 + (this.currentLevel * 250);

      this.clearTimer = setTimeout(() => {
        if (this.currentLevel >= this.totalLevels) {
          this.gameOver(this.score, { cleared: true, totalLevels: this.totalLevels });
        } else {
          this.loadLevel(this.currentLevel + 1);
        }
      }, 750);
    }
  }

  getCurrentChapter() {
    for (const ch of LASER_CHAPTERS) {
      if (this.currentLevel >= ch.start && this.currentLevel <= ch.end) {
        return ch;
      }
    }
    return LASER_CHAPTERS[0];
  }

  update(delta) {
    // Particle updates
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= delta * 2;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Dark Cyber Matrix Background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Grid Floor
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const x = this.gridOffsetX + c * this.cellSize;
        const y = this.gridOffsetY + r * this.cellSize;

        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(22, 27, 38, 0.7)' : 'rgba(16, 20, 30, 0.85)';
        ctx.fillRect(x, y, this.cellSize, this.cellSize);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.cellSize, this.cellSize);
      }
    }

    // 3. Render Obstacle Blocks
    this.blocks.forEach(b => {
      const bx = this.gridOffsetX + b.col * this.cellSize;
      const by = this.gridOffsetY + b.row * this.cellSize;
      ctx.fillStyle = '#1e2538';
      ctx.fillRect(bx + 4, by + 4, this.cellSize - 8, this.cellSize - 8);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 4, by + 4, this.cellSize - 8, this.cellSize - 8);

      // Warning hazard stripes
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + 12, by + 12);
      ctx.lineTo(bx + this.cellSize - 12, by + this.cellSize - 12);
      ctx.stroke();
    });

    // 4. Render Laser Emitter
    const emX = this.gridOffsetX + this.emitter.col * this.cellSize + this.cellSize / 2;
    const emY = this.gridOffsetY + this.emitter.row * this.cellSize + this.cellSize / 2;
    ctx.fillStyle = '#ff5733';
    ctx.fillRect(emX - 16, emY - 16, 32, 32);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(emX - 16, emY - 16, 32, 32);

    // Emitter Cannon Tip
    ctx.fillStyle = '#ff8a50';
    ctx.beginPath();
    ctx.arc(emX + 16, emY, 6, 0, Math.PI * 2);
    ctx.fill();

    // 5. Render Laser Beams
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14;
    this.beamSegments.forEach(b => {
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // 6. Render Prisms (Splitters)
    this.prisms.forEach(p => {
      const px = this.gridOffsetX + p.col * this.cellSize + this.cellSize / 2;
      const py = this.gridOffsetY + p.row * this.cellSize + this.cellSize / 2;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py - 20);
      ctx.lineTo(px + 18, py + 16);
      ctx.lineTo(px - 18, py + 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 7. Render Target Crystals
    this.targets.forEach(t => {
      const tx = this.gridOffsetX + t.col * this.cellSize + this.cellSize / 2;
      const ty = this.gridOffsetY + t.row * this.cellSize + this.cellSize / 2;

      ctx.fillStyle = t.hit ? '#10b981' : '#334155';
      ctx.beginPath();
      ctx.arc(tx, ty, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = t.hit ? '#34d399' : '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (t.hit) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // 8. Render Rotatable Mirrors
    this.mirrors.forEach(m => {
      const mx = this.gridOffsetX + m.col * this.cellSize + this.cellSize / 2;
      const my = this.gridOffsetY + m.row * this.cellSize + this.cellSize / 2;

      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate((m.angle * Math.PI) / 180);

      // Base Housing
      ctx.fillStyle = '#172033';
      ctx.fillRect(-22, -22, 44, 44);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-22, -22, 44, 44);

      // Angled Mirror Glass Strip
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(-16, 16);
      ctx.lineTo(16, -16);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    // 9. Render Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 10. Top Header & HUD
    const ch = this.getCurrentChapter();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ NEON LASER REFLECTOR • LEVEL ${this.currentLevel} / ${this.totalLevels}`, 30, 36);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`CH.${ch.id}: ${ch.name.toUpperCase()}`, 30, 52);

    // Top Right Controls (Hint & Reset)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(640, 16, 90, 32);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(640, 16, 90, 32);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💡 Hint (${this.hintsRemaining})`, 685, 37);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(745, 16, 85, 32);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(745, 16, 85, 32);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('🔄 Reset', 787, 37);

    // Footer instruction
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Click any mirror to rotate 90° • Route beam into green target crystals', 30, 485);
  }

  destroy() {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
    super.destroy();
  }
}
