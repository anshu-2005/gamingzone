/* ====================================================
   BILLIARDS 8-BALL — GAMINGZONE
   Tournament Pool with Momentum Elastic Collisions, Cushion Bounces,
   Wood Cue Stick Aiming, Power Slider & 6 Drop Pockets
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class Billiards8BallGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Billiards 8-Ball',
      targetScore: 1000,
      ...config
    });

    this.tablePadding = 38;

    // 6 Table Drop Pockets
    this.pockets = [
      { x: 42, y: 42, radius: 22 },
      { x: 360, y: 36, radius: 20 },
      { x: 678, y: 42, radius: 22 },
      { x: 42, y: 418, radius: 22 },
      { x: 360, y: 424, radius: 20 },
      { x: 678, y: 418, radius: 22 }
    ];

    this.cueBall = {
      x: 220,
      y: 230,
      vx: 0,
      vy: 0,
      radius: 11,
      isCue: true,
      color: '#ffffff'
    };

    this.balls = [];
    this.aimAngle = 0;
    this.power = 0;
    this.isAiming = false;
    this.pottedCount = 0;

    this.createCanvas(720, 460);
    this.initPoolBalls();
    this.initBilliardsControls();

    this.showStartCard({
      title: 'BILLIARDS 8-BALL',
      icon: '🎱',
      objective: 'Pot all colored pool balls into the 6 corner and side pockets! Avoid scratching the white cue ball.',
      controls: 'Tap and drag backward from the white ball to aim and set cue stick power, then release to strike.',
      onStart: () => this.start()
    });
  }

  initPoolBalls() {
    this.balls = [this.cueBall];
    const colors = [
      '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
      '#f97316', '#10b981', '#7c3aed', '#111827', // 8 is black
      '#eab308'
    ];

    // Classic Triangular Rack
    let colorIdx = 0;
    const startX = 490;
    const startY = 230;

    for (let col = 0; col < 4; col++) {
      for (let row = 0; row <= col; row++) {
        const x = startX + col * 20;
        const y = startY - col * 12 + row * 24;
        this.balls.push({
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 11,
          isCue: false,
          color: colors[colorIdx % colors.length]
        });
        colorIdx++;
      }
    }
  }

  initBilliardsControls() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.areBallsMoving()) return;
      const p = getPos(e);
      if (Math.hypot(p.x - this.cueBall.x, p.y - this.cueBall.y) < 60) {
        this.isAiming = true;
        this.power = 0;
      }
    });

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.isAiming) {
        const p = getPos(e);
        this.aimAngle = Math.atan2(p.y - this.cueBall.y, p.x - this.cueBall.x);
        this.power = Math.min(24, Math.hypot(p.x - this.cueBall.x, p.y - this.cueBall.y) * 0.18);
      }
    });

    this.addListener(this.canvas, 'pointerup', () => {
      if (this.isAiming && this.power > 1.5) {
        // Strike cue ball in opposite direction of drag
        this.cueBall.vx = -Math.cos(this.aimAngle) * this.power * 28;
        this.cueBall.vy = -Math.sin(this.aimAngle) * this.power * 28;
        sounds.playClick();
      }
      this.isAiming = false;
      this.power = 0;
    });
  }

  areBallsMoving() {
    return this.balls.some(b => Math.hypot(b.vx, b.vy) > 8);
  }

  update(dt) {
    // Ball Movement & Table Cushion Collisions
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Table Baize Friction
      b.vx *= Math.pow(0.985, dt * 60);
      b.vy *= Math.pow(0.985, dt * 60);

      if (Math.hypot(b.vx, b.vy) < 6) {
        b.vx = 0;
        b.vy = 0;
      }

      // Cushion Wall Collisions
      const minX = this.tablePadding + b.radius;
      const maxX = this.baseWidth - this.tablePadding - b.radius;
      const minY = this.tablePadding + b.radius;
      const maxY = this.baseHeight - this.tablePadding - b.radius;

      if (b.x <= minX) {
        b.x = minX;
        b.vx = -b.vx * 0.85;
        sounds.playClick();
      } else if (b.x >= maxX) {
        b.x = maxX;
        b.vx = -b.vx * 0.85;
        sounds.playClick();
      }

      if (b.y <= minY) {
        b.y = minY;
        b.vy = -b.vy * 0.85;
        sounds.playClick();
      } else if (b.y >= maxY) {
        b.y = maxY;
        b.vy = -b.vy * 0.85;
        sounds.playClick();
      }

      // Check Drop Pockets
      for (const p of this.pockets) {
        if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius) {
          if (b.isCue) {
            // Scratch foul!
            sounds.playHit();
            b.x = 220;
            b.y = 230;
            b.vx = 0;
            b.vy = 0;
            this.score = Math.max(0, this.score - 100);
          } else {
            // Ball potted!
            this.balls.splice(i, 1);
            this.pottedCount++;
            this.score += 150;
            sounds.playCoin();

            // All colored balls potted
            if (this.balls.length <= 1) {
              sounds.playWin();
              this.finishGame(this.score, { isVictory: true, potted: this.pottedCount });
            }
          }
          break;
        }
      }
    }

    // Ball-to-Ball Elastic Collisions
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const b1 = this.balls[i];
        const b2 = this.balls[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < b1.radius + b2.radius && dist > 0) {
          // Separate overlapping balls
          const overlap = (b1.radius + b2.radius) - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          b1.x -= nx * overlap * 0.5;
          b1.y -= ny * overlap * 0.5;
          b2.x += nx * overlap * 0.5;
          b2.y += ny * overlap * 0.5;

          // Normal & Tangent Velocity Projection
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;

          b1.vx -= p * nx * 0.95;
          b1.vy -= p * ny * 0.95;
          b2.vx += p * nx * 0.95;
          b2.vy += p * ny * 0.95;

          sounds.playClick();
        }
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Mahogany Wood Outer Table Rails
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(10, 10, this.baseWidth - 20, this.baseHeight - 20, 24);
    ctx.fill();

    // Table Baize Cloth (Deep Tournament Green)
    const tX = this.tablePadding;
    const tY = this.tablePadding;
    const tW = this.baseWidth - this.tablePadding * 2;
    const tH = this.baseHeight - this.tablePadding * 2;

    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(tX, tY, tW, tH, 12);
    ctx.fill();
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 3;
    ctx.stroke();

    // White Baulk Line & D-Arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(220, tY);
    ctx.lineTo(220, tY + tH);
    ctx.stroke();

    // Draw 6 Drop Pockets
    this.pockets.forEach(p => {
      ctx.fillStyle = '#0a0e17';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Brass pocket rim
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    // Draw Aiming Guide Line and Cue Stick
    if (this.isAiming && this.power > 1) {
      // Trajectory Projection Line (pointing in direction of strike)
      const aimDirX = -Math.cos(this.aimAngle);
      const aimDirY = -Math.sin(this.aimAngle);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.cueBall.x, this.cueBall.y);
      ctx.lineTo(this.cueBall.x + aimDirX * 220, this.cueBall.y + aimDirY * 220);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Wooden Cue Stick behind cue ball
      const cueDist = this.cueBall.radius + 15 + this.power * 2;
      const stickStartX = this.cueBall.x - aimDirX * cueDist;
      const stickStartY = this.cueBall.y - aimDirY * cueDist;
      const stickEndX = stickStartX - aimDirX * 180;
      const stickEndY = stickStartY - aimDirY * 180;

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(stickStartX, stickStartY);
      ctx.lineTo(stickEndX, stickEndY);
      ctx.stroke();

      // Cue chalk tip
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(stickStartX, stickStartY);
      ctx.lineTo(stickStartX - aimDirX * 8, stickStartY - aimDirY * 8);
      ctx.stroke();
    }

    // Draw Pool Balls
    this.balls.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3D Spherical shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(b.x - 3, b.y - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top HUD
    ctx.font = '900 18px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🎱 POTTED: ${this.pottedCount}`, 30, 28);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.areBallsMoving() ? 'ROLLING...' : 'AIM & STRIKE', this.baseWidth - 30, 28);
  }
}
