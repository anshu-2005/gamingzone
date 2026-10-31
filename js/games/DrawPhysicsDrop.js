/* ====================================================
   DRAW PHYSICS DROP — GAMINGZONE
   Freehand Line Drawing Gravity & Geometry Puzzle
   - Draw Rigid Ramps & Deflectors with Finger / Mouse
   - Guide the Bouncy Ball into the Neon Goal Basket
   - Dynamic 2D Segment-Circle Collision Physics
   - 10 Handcrafted Creative Physics Stages
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';
import { PhysicsDropAdapter } from '../core/levelEngine/index.js';

const physicsAdapter = new PhysicsDropAdapter();

export class DrawPhysicsDropGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Draw Physics Drop',
      targetScore: 2000,
      ...config
    });

    this.createCanvas(800, 560);

    this.level = 1;
    this.maxLevels = 50;
    this.drawnLines = []; // Array of { points: [{x, y}] }
    this.currentLine = null;
    this.ink = 100;

    this.ball = { x: 120, y: 80, vx: 0, vy: 0, radius: 12, startX: 120, startY: 80 };
    this.goal = { x: 680, y: 440, w: 70, h: 50 };
    this.obstacles = [];

    this.loadLevel(this.level);
    this.initDrawControls();

    this.showStartCard({
      title: 'DRAW PHYSICS DROP',
      icon: '✏️',
      objective: 'Draw solid ramps and slopes to guide the rolling physics ball into the neon target basket!',
      controls: 'Click & Drag to draw lines. Press "R" or Reset button to retry.',
      onStart: () => this.start()
    });
  }

  loadLevel(lvl) {
    this.drawnLines = [];
    this.ink = 100;

    if (lvl === 1) {
      this.ball = { x: 120, y: 80, vx: 0, vy: 0, radius: 12, startX: 120, startY: 80 };
      this.goal = { x: 680, y: 460, w: 70, h: 40 };
      this.obstacles = [{ x: 380, y: 220, w: 30, h: 260 }];
    } else if (lvl === 2) {
      this.ball = { x: 200, y: 80, vx: 0, vy: 0, radius: 12, startX: 200, startY: 80 };
      this.goal = { x: 140, y: 460, w: 70, h: 40 };
      this.obstacles = [
        { x: 340, y: 160, w: 30, h: 320 },
        { x: 500, y: 260, w: 30, h: 220 }
      ];
    } else {
      // Procedurally generate unique physics stage via Level Engine
      const generated = physicsAdapter.generateLevel(lvl, 4004);
      this.ball = {
        x: generated.player.x,
        y: generated.player.y,
        vx: 0,
        vy: 0,
        radius: 12,
        startX: generated.player.x,
        startY: generated.player.y
      };
      this.goal = {
        x: generated.goal.x,
        y: generated.goal.y,
        w: generated.goal.width || 70,
        h: generated.goal.height || 40
      };
      this.obstacles = generated.obstacles.map(o => ({
        x: o.x,
        y: o.y,
        w: o.w || 50,
        h: o.h || 20
      }));
    }
  }

  initDrawControls() {
    const startDraw = (clientX, clientY) => {
      if (this.state !== GameState.PLAYING || this.ink <= 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      // Ignore click inside UI reset button (top-right x: 680, y: 15)
      if (x >= 680 && y <= 55) {
        this.resetLevel();
        return;
      }

      this.currentLine = [{ x, y }];
    };

    const moveDraw = (clientX, clientY) => {
      if (!this.currentLine || this.ink <= 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      const last = this.currentLine[this.currentLine.length - 1];
      const dist = Math.hypot(x - last.x, y - last.y);
      if (dist > 8) {
        this.currentLine.push({ x, y });
        this.ink = Math.max(0, this.ink - dist * 0.15);
      }
    };

    const endDraw = () => {
      if (this.currentLine && this.currentLine.length > 1) {
        sounds.playClick();
        this.drawnLines.push(this.currentLine);
      }
      this.currentLine = null;
    };

    this.addEventListenerTracked(this.canvas, 'mousedown', (e) => startDraw(e.clientX, e.clientY));
    this.addEventListenerTracked(this.canvas, 'mousemove', (e) => moveDraw(e.clientX, e.clientY));
    this.addEventListenerTracked(this.canvas, 'mouseup', endDraw);

    this.addEventListenerTracked(this.canvas, 'touchstart', (e) => {
      if (e.touches[0]) {
        e.preventDefault();
        startDraw(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    this.addEventListenerTracked(this.canvas, 'touchmove', (e) => {
      if (e.touches[0]) {
        moveDraw(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    this.addEventListenerTracked(this.canvas, 'touchend', endDraw);

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.key.toLowerCase() === 'r') this.resetLevel();
    });
  }

  resetLevel() {
    sounds.playClick();
    this.ball.x = this.ball.startX;
    this.ball.y = this.ball.startY;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.drawnLines = [];
    this.ink = 100;
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Gravity
    this.ball.vy += 0.32;
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    this.ball.vx *= 0.99;

    // Screen Boundary
    if (this.ball.x < this.ball.radius) {
      this.ball.x = this.ball.radius;
      this.ball.vx = -this.ball.vx * 0.6;
    }
    if (this.ball.x > this.baseWidth - this.ball.radius) {
      this.ball.x = this.baseWidth - this.ball.radius;
      this.ball.vx = -this.ball.vx * 0.6;
    }

    // Floor (Drop below = restart)
    if (this.ball.y > this.baseHeight) {
      sounds.playHit();
      this.resetLevel();
      return;
    }

    // Obstacle collisions
    this.obstacles.forEach(obs => {
      if (this.ball.x > obs.x - this.ball.radius && this.ball.x < obs.x + obs.w + this.ball.radius &&
          this.ball.y > obs.y - this.ball.radius && this.ball.y < obs.y + obs.h + this.ball.radius) {
        this.ball.vy = -this.ball.vy * 0.5;
        this.ball.vx = -this.ball.vx * 0.5;
        this.ball.y -= 2;
      }
    });

    // Drawn lines collision
    const allLines = [...this.drawnLines];
    if (this.currentLine) allLines.push(this.currentLine);

    allLines.forEach(line => {
      for (let i = 0; i < line.length - 1; i++) {
        const p1 = line[i];
        const p2 = line[i + 1];
        this.resolveLineCollision(p1, p2);
      }
    });

    // Goal Basket Collision
    if (this.ball.x > this.goal.x && this.ball.x < this.goal.x + this.goal.w &&
        this.ball.y > this.goal.y && this.ball.y < this.goal.y + this.goal.h) {
      sounds.playVictory();
      this.score += 500;
      this.level++;
      if (this.level <= this.maxLevels) {
        this.loadLevel(this.level);
      } else {
        this.gameOver(true);
      }
    }
  }

  resolveLineCollision(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const u = ((this.ball.x - p1.x) * dx + (this.ball.y - p1.y) * dy) / (len * len);
    const clampU = Math.max(0, Math.min(1, u));

    const nearX = p1.x + clampU * dx;
    const nearY = p1.y + clampU * dy;

    const dist = Math.hypot(this.ball.x - nearX, this.ball.y - nearY);
    if (dist < this.ball.radius + 3) {
      sounds.playHit();
      // Normal vector
      const nx = (this.ball.x - nearX) / (dist || 1);
      const ny = (this.ball.y - nearY) / (dist || 1);

      // Separate
      this.ball.x = nearX + nx * (this.ball.radius + 3);
      this.ball.y = nearY + ny * (this.ball.radius + 3);

      // Reflect velocity
      const dot = this.ball.vx * nx + this.ball.vy * ny;
      this.ball.vx = (this.ball.vx - 2 * dot * nx) * 0.65;
      this.ball.vy = (this.ball.vy - 2 * dot * ny) * 0.65;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Grid blueprint background
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.baseWidth; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.baseHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.baseHeight; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.baseWidth, y);
      ctx.stroke();
    }

    // Goal Basket
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h, [0, 0, 16, 16]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = '700 12px "Outfit", sans-serif';
    ctx.fillText('GOAL', this.goal.x + 18, this.goal.y + 26);

    // Obstacles
    this.obstacles.forEach(obs => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    });

    // Drawn Lines
    const drawLineList = [...this.drawnLines];
    if (this.currentLine) drawLineList.push(this.currentLine);

    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawLineList.forEach(line => {
      if (line.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(line[i].x, line[i].y);
      }
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Header HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 18px "Outfit", sans-serif';
    ctx.fillText(`Level ${this.level} / ${this.maxLevels}`, 30, 36);

    // Ink Gauge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(170, 22, 160, 14);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(170, 22, 160 * (this.ink / 100), 14);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillText('Ink', 145, 34);

    // Reset Button
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.baseWidth - 110, 15, 80, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = '700 12px "Outfit", sans-serif';
    ctx.fillText('🔄 RESET', this.baseWidth - 98, 33);
  }
}

