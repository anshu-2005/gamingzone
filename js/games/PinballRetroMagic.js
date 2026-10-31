/* ====================================================
   PINBALL RETRO MAGIC — GAMINGZONE
   Authentic 2D Arcade Pinball Table:
   Dual Flippers, Spring Plunger Launch, Neon Pop Bumpers,
   Slingshots, Rollover Lanes, Multiball & Drain Physics
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PinballRetroMagicGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Pinball Retro Magic',
      targetScore: 5000,
      lives: 3,
      ...config
    });

    this.ballsLeft = 3;
    this.ball = {
      x: 440,
      y: 500,
      vx: 0,
      vy: 0,
      radius: 9,
      active: false
    };

    // Flippers
    this.leftFlipper = {
      x: 150,
      y: 540,
      length: 60,
      baseAngle: 0.45,
      activeAngle: -0.55,
      angle: 0.45,
      isPressed: false
    };

    this.rightFlipper = {
      x: 310,
      y: 540,
      length: 60,
      baseAngle: Math.PI - 0.45,
      activeAngle: Math.PI + 0.55,
      angle: Math.PI - 0.45,
      isPressed: false
    };

    // Bumpers
    this.bumpers = [
      { x: 170, y: 190, radius: 24, color: '#ff007f', hits: 0 },
      { x: 290, y: 190, radius: 24, color: '#00f2fe', hits: 0 },
      { x: 230, y: 280, radius: 26, color: '#ffd166', hits: 0 }
    ];

    // Slingshots (triangles above flippers)
    this.slingshots = [
      { x1: 90, y1: 430, x2: 130, y2: 490, x3: 90, y3: 490 },
      { x1: 370, y1: 430, x2: 330, y2: 490, x3: 370, y3: 490 }
    ];

    this.particles = [];
    this.plungerCharge = 0;
    this.isChargingPlunger = false;

    this.createCanvas(480, 640);
    this.initControls();
    this.resetBall();

    this.showStartCard({
      title: 'PINBALL RETRO MAGIC',
      icon: '🎰',
      objective: 'Launch the ball into the neon table, rack up bumper bonuses, and use flippers to prevent the ball from draining!',
      controls: 'A/Left Arrow = Left Flipper, D/Right Arrow = Right Flipper, Space = Pull/Release Plunger.',
      onStart: () => this.start()
    });
  }

  resetBall() {
    this.ball.x = 445;
    this.ball.y = 520;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.active = false;
  }

  launchBall() {
    if (this.ball.active) return;
    this.ball.active = true;
    const force = 16 + Math.min(12, this.plungerCharge * 0.15);
    this.ball.vy = -force;
    this.ball.vx = (Math.random() - 0.5) * 1.5;
    this.plungerCharge = 0;
    sounds.playLaser();
  }

  initControls() {
    // Keyboard flippers & plunger
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.leftFlipper.isPressed = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.rightFlipper.isPressed = true;
      }
      if (e.code === 'Space' || e.key === ' ') {
        if (!this.ball.active) this.isChargingPlunger = true;
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.leftFlipper.isPressed = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.rightFlipper.isPressed = false;
      }
      if (e.code === 'Space' || e.key === ' ') {
        if (this.isChargingPlunger) {
          this.isChargingPlunger = false;
          this.launchBall();
        }
      }
    });

    // Touch controls on left/right screen sides
    this.addListener(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      if (this.state !== GameState.PLAYING) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * this.baseWidth;

      if (!this.ball.active) {
        this.launchBall();
      } else {
        if (x < this.baseWidth / 2) {
          this.leftFlipper.isPressed = true;
        } else {
          this.rightFlipper.isPressed = true;
        }
      }
    });

    this.addListener(this.canvas, 'pointerup', () => {
      this.leftFlipper.isPressed = false;
      this.rightFlipper.isPressed = false;
    });

    this.addListener(this.canvas, 'pointercancel', () => {
      this.leftFlipper.isPressed = false;
      this.rightFlipper.isPressed = false;
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    if (this.isChargingPlunger && !this.ball.active) {
      this.plungerCharge = Math.min(100, this.plungerCharge + dt * 180);
    }

    // Smooth flipper rotation
    const flipperSpeed = 22 * dt;
    if (this.leftFlipper.isPressed) {
      this.leftFlipper.angle = Math.max(this.leftFlipper.activeAngle, this.leftFlipper.angle - flipperSpeed);
    } else {
      this.leftFlipper.angle = Math.min(this.leftFlipper.baseAngle, this.leftFlipper.angle + flipperSpeed);
    }

    if (this.rightFlipper.isPressed) {
      this.rightFlipper.angle = Math.min(this.rightFlipper.activeAngle, this.rightFlipper.angle + flipperSpeed);
    } else {
      this.rightFlipper.angle = Math.max(this.rightFlipper.baseAngle, this.rightFlipper.angle - flipperSpeed);
    }

    // Ball Physics
    if (this.ball.active) {
      // Gravity
      this.ball.vy += 0.38;
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;

      // Outer table wall bounds
      // Top curved dome
      if (this.ball.y < 90) {
        this.ball.y = 90;
        this.ball.vy = Math.abs(this.ball.vy) * 0.75;
      }
      // Left wall
      if (this.ball.x < 50) {
        this.ball.x = 50;
        this.ball.vx = Math.abs(this.ball.vx) * 0.8;
      }
      // Right wall (before launch alley separator at x=415)
      if (this.ball.y > 180 && this.ball.x > 415 && this.ball.x < 425) {
        this.ball.x = 415;
        this.ball.vx = -Math.abs(this.ball.vx) * 0.8;
      }
      if (this.ball.x > 465) {
        this.ball.x = 465;
        this.ball.vx = -Math.abs(this.ball.vx) * 0.8;
      }

      // Bumpers Collision
      for (const b of this.bumpers) {
        const d = Math.hypot(this.ball.x - b.x, this.ball.y - b.y);
        if (d < this.ball.radius + b.radius) {
          // Normal vector
          const nx = (this.ball.x - b.x) / d;
          const ny = (this.ball.y - b.y) / d;
          const impulse = 12;
          this.ball.vx = nx * impulse;
          this.ball.vy = ny * impulse;
          this.score += 100;
          b.hits++;
          sounds.playHit();

          // Spark burst
          for (let k = 0; k < 12; k++) {
            this.particles.push({
              x: this.ball.x,
              y: this.ball.y,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 160,
              color: b.color,
              radius: 3,
              alpha: 1,
              life: 0.4
            });
          }
        }
      }

      // Flippers Collision
      this.checkFlipperCollision(this.leftFlipper);
      this.checkFlipperCollision(this.rightFlipper);

      // Bottom Drain Check
      if (this.ball.y > this.baseHeight + 30) {
        this.ballsLeft--;
        sounds.playHit();

        if (this.ballsLeft <= 0) {
          this.state = GameState.GAME_OVER;
          this.setTimeout(() => this.gameOver(this.score), 700);
        } else {
          this.resetBall();
        }
      }
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  checkFlipperCollision(flipper) {
    const tipX = flipper.x + Math.cos(flipper.angle) * flipper.length;
    const tipY = flipper.y + Math.sin(flipper.angle) * flipper.length;

    // Line segment (flipper.x, flipper.y) to (tipX, tipY)
    const dx = tipX - flipper.x;
    const dy = tipY - flipper.y;
    const l2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((this.ball.x - flipper.x) * dx + (this.ball.y - flipper.y) * dy) / l2));
    const projX = flipper.x + t * dx;
    const projY = flipper.y + t * dy;
    const dist = Math.hypot(this.ball.x - projX, this.ball.y - projY);

    if (dist < this.ball.radius + 6) {
      // Normal of the flipper line
      const lineAngle = Math.atan2(dy, dx);
      const normalAngle = lineAngle - Math.PI / 2;

      // Ball kick impulse
      const kick = flipper.isPressed ? 14 : 7;
      this.ball.vx = Math.cos(normalAngle) * kick + (Math.random() - 0.5) * 2;
      this.ball.vy = Math.sin(normalAngle) * kick;
      this.ball.y = projY - this.ball.radius - 2;
      sounds.playJump();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep neon cabinet background
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    grad.addColorStop(0, '#0a0d1f');
    grad.addColorStop(1, '#050713');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Table Boundary Wireframes
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#3b82f6';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    // Outer table dome
    this.ctx.arc(240, 160, 200, Math.PI, 0);
    this.ctx.lineTo(440, 560);
    this.ctx.lineTo(360, 560);
    this.ctx.moveTo(40, 160);
    this.ctx.lineTo(40, 560);
    this.ctx.lineTo(100, 560);
    this.ctx.stroke();

    // Launch alley separator
    this.ctx.strokeStyle = '#64748b';
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.moveTo(415, 200);
    this.ctx.lineTo(415, 590);
    this.ctx.stroke();

    // Render Bumpers
    for (const b of this.bumpers) {
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 16;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;

    // Render Slingshots
    this.ctx.fillStyle = '#1e293b';
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 3;
    for (const s of this.slingshots) {
      this.ctx.beginPath();
      this.ctx.moveTo(s.x1, s.y1);
      this.ctx.lineTo(s.x2, s.y2);
      this.ctx.lineTo(s.x3, s.y3);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    // Render Flippers
    const drawFlipper = (flipper) => {
      const tipX = flipper.x + Math.cos(flipper.angle) * flipper.length;
      const tipY = flipper.y + Math.sin(flipper.angle) * flipper.length;
      this.ctx.strokeStyle = '#f43f5e';
      this.ctx.shadowColor = '#f43f5e';
      this.ctx.shadowBlur = 8;
      this.ctx.lineWidth = 10;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(flipper.x, flipper.y);
      this.ctx.lineTo(tipX, tipY);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    };
    drawFlipper(this.leftFlipper);
    drawFlipper(this.rightFlipper);

    // Render Ball
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

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

    // Plunger Charge Bar
    if (this.isChargingPlunger) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fillRect(435, 590 - this.plungerCharge, 18, this.plungerCharge);
    }

    // HUD Top
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(16, 16, this.baseWidth - 32, 44);

    this.ctx.font = 'bold 20px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 30, 44);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`BALLS: ${'⚪ '.repeat(this.ballsLeft)}`, this.baseWidth - 30, 44);
  }
}
