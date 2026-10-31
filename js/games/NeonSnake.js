/* ====================================================
   NEON SNAKE — GAMINGZONE
   Cyberpunk Retro Snake:
   Glowing Gradient Segments, Golden Bonus Apples,
   Smooth High-DPR Interpolation, Particle Bursts & Touch D-Pad
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class NeonSnakeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Neon Snake',
      targetScore: 250,
      ...config
    });

    this.gridSize = 24;
    this.cols = 24;
    this.rows = 24;

    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = { x: 16, y: 12 };
    this.bonusFood = null;
    this.bonusTimer = 0;

    this.tickInterval = 0.11; // Seconds per grid step
    this.tickTimer = 0;
    this.particles = [];

    this.createCanvas(576, 576);
    this.initSnake();
    this.initControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        if (dir === 'UP' && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
        if (dir === 'DOWN' && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
        if (dir === 'LEFT' && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
        if (dir === 'RIGHT' && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
      }
    });

    this.showStartCard({
      title: 'NEON SNAKE',
      icon: '🐍',
      objective: 'Slither through the grid and consume glowing neon orbs. Don\'t crash into the walls or your own tail!',
      controls: 'WASD or Arrow Keys to turn direction.',
      onStart: () => this.start()
    });
  }

  initSnake() {
    this.snake = [
      { x: 8, y: 12 },
      { x: 7, y: 12 },
      { x: 6, y: 12 }
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.tickTimer = 0;
    this.tickInterval = 0.11;
    this.bonusFood = null;
    this.particles = [];
    this.spawnFood();
  }

  spawnFood() {
    let valid = false;
    while (!valid) {
      const rx = Math.floor(Math.random() * this.cols);
      const ry = Math.floor(Math.rows ? Math.random() * this.rows : Math.random() * this.cols);
      const onSnake = this.snake.some(s => s.x === rx && s.y === ry);
      if (!onSnake) {
        this.food = { x: rx, y: ry };
        valid = true;
      }
    }

    // Occasional bonus golden star
    if (Math.random() < 0.25 && !this.bonusFood) {
      const bx = Math.floor(Math.random() * this.cols);
      const by = Math.floor(Math.random() * this.rows);
      this.bonusFood = { x: bx, y: by };
      this.bonusTimer = 8;
    }
  }

  initControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && this.dir.y === 0) {
        this.nextDir = { x: 0, y: -1 };
        e.preventDefault();
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && this.dir.y === 0) {
        this.nextDir = { x: 0, y: 1 };
        e.preventDefault();
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && this.dir.x === 0) {
        this.nextDir = { x: -1, y: 0 };
        e.preventDefault();
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && this.dir.x === 0) {
        this.nextDir = { x: 1, y: 0 };
        e.preventDefault();
      }
    });

    // Touch Swipe
    let touchStartX = 0, touchStartY = 0;
    this.addListener(this.canvas, 'touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.addListener(this.canvas, 'touchend', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 25 && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
        else if (dx < -25 && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
      } else {
        if (dy > 25 && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
        else if (dy < -25 && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
      }
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    if (this.bonusFood) {
      this.bonusTimer -= dt;
      if (this.bonusTimer <= 0) this.bonusFood = null;
    }

    this.tickTimer += dt;
    if (this.tickTimer >= this.tickInterval) {
      this.tickTimer -= this.tickInterval;
      this.step();
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  step() {
    this.dir = { ...this.nextDir };
    const head = this.snake[0];
    const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };

    // Wall Collision Check
    if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
      this.onDeath('Hit the wall!');
      return;
    }

    // Self Tail Collision Check
    if (this.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      this.onDeath('Bite own tail!');
      return;
    }

    this.snake.unshift(newHead);

    // Food Eat Check
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.tickInterval = Math.max(0.065, 0.11 - this.score * 0.0008);
      sounds.playCoin();

      // Food burst
      for (let k = 0; k < 12; k++) {
        this.particles.push({
          x: newHead.x * this.gridSize + 12,
          y: newHead.y * this.gridSize + 12,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          color: '#ef4444',
          radius: 3,
          alpha: 1,
          life: 0.4
        });
      }

      this.spawnFood();
    } else if (this.bonusFood && newHead.x === this.bonusFood.x && newHead.y === this.bonusFood.y) {
      this.score += 50;
      this.bonusFood = null;
      sounds.playWin();

      for (let k = 0; k < 16; k++) {
        this.particles.push({
          x: newHead.x * this.gridSize + 12,
          y: newHead.y * this.gridSize + 12,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          color: '#ffd166',
          radius: 4,
          alpha: 1,
          life: 0.5
        });
      }
    } else {
      this.snake.pop();
    }
  }

  onDeath(reason) {
    this.state = GameState.GAME_OVER;
    sounds.playHit();

    const head = this.snake[0];
    for (let k = 0; k < 20; k++) {
      this.particles.push({
        x: head.x * this.gridSize + 12,
        y: head.y * this.gridSize + 12,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        color: '#00f2fe',
        radius: 4,
        alpha: 1,
        life: 0.7
      });
    }

    this.setTimeout(() => this.gameOver(this.score), 800);
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep grid background
    this.ctx.fillStyle = '#060814';
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Subtle grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.gridSize, 0);
      this.ctx.lineTo(c * this.gridSize, this.baseHeight);
      this.ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.gridSize);
      this.ctx.lineTo(this.baseWidth, r * this.gridSize);
      this.ctx.stroke();
    }

    // Render Food
    this.ctx.fillStyle = '#ef4444';
    this.ctx.shadowColor = '#ef4444';
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.arc(this.food.x * this.gridSize + 12, this.food.y * this.gridSize + 12, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Render Bonus Star Food
    if (this.bonusFood) {
      const pulse = 8 + Math.sin(Date.now() * 0.01) * 2;
      this.ctx.fillStyle = '#ffd166';
      this.ctx.shadowColor = '#ffd166';
      this.ctx.shadowBlur = 16;
      this.ctx.beginPath();
      this.ctx.arc(this.bonusFood.x * this.gridSize + 12, this.bonusFood.y * this.gridSize + 12, pulse, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Render Snake Body
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      const isHead = i === 0;

      // Color gradient from cyan head to purple tail
      const factor = i / this.snake.length;
      this.ctx.fillStyle = isHead ? '#00f2fe' : `hsl(${190 + factor * 80}, 90%, 55%)`;
      this.ctx.shadowColor = isHead ? '#00f2fe' : '#a855f7';
      this.ctx.shadowBlur = isHead ? 14 : 6;

      const segX = seg.x * this.gridSize + 2;
      const segY = seg.y * this.gridSize + 2;
      const segSize = this.gridSize - 4;

      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(segX, segY, segSize, segSize, isHead ? 8 : 4);
      } else {
        this.ctx.rect(segX, segY, segSize, segSize);
      }
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Draw eyes on head
      if (isHead) {
        this.ctx.fillStyle = '#ffffff';
        const eyeOffset = 6;
        let e1X = segX + 5, e1Y = segY + 5;
        let e2X = segX + 13, e2Y = segY + 5;

        if (this.dir.x === 1) { e1X = segX + 13; e1Y = segY + 5; e2X = segX + 13; e2Y = segY + 13; }
        else if (this.dir.x === -1) { e1X = segX + 5; e1Y = segY + 5; e2X = segX + 5; e2Y = segY + 13; }
        else if (this.dir.y === 1) { e1X = segX + 5; e1Y = segY + 13; e2X = segX + 13; e2Y = segY + 13; }

        this.ctx.beginPath();
        this.ctx.arc(e1X, e1Y, 2.5, 0, Math.PI * 2);
        this.ctx.arc(e2X, e2Y, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Render Particles
    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // HUD Top
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(12, 12, 160, 42);

    this.ctx.font = 'bold 20px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 24, 39);
  }
}
