/* ====================================================
   BRICK BREAKER DELUXE — GAMINGZONE
   Arcade Arkanoid Action:
   Multi-Hit Neon Bricks, Curved Paddle Deflection,
   Powerup Drops (Multi-Ball, Fireball, Wide Paddle, Lasers) & Touch
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class BrickBreakerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Brick Breaker Deluxe',
      targetScore: 1500,
      lives: 3,
      ...config
    });

    this.paddle = {
      x: 310,
      y: 490,
      width: 110,
      height: 16,
      speed: 460,
      hasLaser: false,
      isFireball: false,
      laserTimer: 0
    };

    this.balls = [];
    this.bricks = [];
    this.powerups = [];
    this.particles = [];
    this.lasers = [];
    this.keys = { left: false, right: false };

    this.createCanvas(720, 540);
    this.initLevel();
    this.initControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
      },
      actionLabel: 'FIRE / LAUNCH',
      onAction: () => {
        this.launchBalls();
        this.firePaddleLasers();
      }
    });

    this.showStartCard({
      title: 'BRICK BREAKER DELUXE',
      icon: '🧱',
      objective: 'Shatter all neon bricks! Catch falling powerup capsules to activate Multi-Ball, Fireball, and Paddle Lasers!',
      controls: 'A/D or Mouse/Touch to slide paddle. Space or Tap to launch/fire.',
      onStart: () => this.start()
    });
  }

  initLevel() {
    this.paddle.width = 110;
    this.paddle.x = (this.baseWidth - this.paddle.width) / 2;
    this.paddle.hasLaser = false;
    this.paddle.isFireball = false;

    this.balls = [{
      x: this.baseWidth / 2,
      y: this.paddle.y - 10,
      vx: 0,
      vy: 0,
      radius: 8,
      stuck: true
    }];

    this.bricks = [];
    this.powerups = [];
    this.particles = [];
    this.lasers = [];

    // 5 rows x 9 columns
    const rows = 5;
    const cols = 9;
    const brickW = 68;
    const brickH = 22;
    const padX = (this.baseWidth - (cols * (brickW + 8) - 8)) / 2;
    const padY = 60;
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = r === 0 ? 2 : 1; // Top row requires 2 hits
        this.bricks.push({
          x: padX + c * (brickW + 8),
          y: padY + r * (brickH + 8),
          width: brickW,
          height: brickH,
          hp,
          maxHp: hp,
          color: colors[r]
        });
      }
    }
  }

  launchBalls() {
    for (const b of this.balls) {
      if (b.stuck) {
        b.stuck = false;
        b.vx = 4.5 * (Math.random() > 0.5 ? 1 : -1);
        b.vy = -6.5;
        sounds.playJump();
      }
    }
  }

  firePaddleLasers() {
    if (!this.paddle.hasLaser) return;
    this.lasers.push({ x: this.paddle.x + 10, y: this.paddle.y - 8, vy: -12 });
    this.lasers.push({ x: this.paddle.x + this.paddle.width - 10, y: this.paddle.y - 8, vy: -12 });
    sounds.playLaser();
  }

  initControls() {
    // Keyboard
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        this.launchBalls();
        this.firePaddleLasers();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
    });

    // Mouse / Touch drag on canvas
    const setPaddleX = (clientX) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * this.baseWidth;
      this.paddle.x = Math.max(10, Math.min(this.baseWidth - this.paddle.width - 10, x - this.paddle.width / 2));
    };

    this.addListener(this.canvas, 'pointermove', (e) => setPaddleX(e.clientX));
    this.addListener(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      setPaddleX(e.clientX);
      this.launchBalls();
      this.firePaddleLasers();
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Move Paddle by keyboard
    if (this.keys.left) {
      this.paddle.x = Math.max(10, this.paddle.x - this.paddle.speed * dt);
    }
    if (this.keys.right) {
      this.paddle.x = Math.min(this.baseWidth - this.paddle.width - 10, this.paddle.x + this.paddle.speed * dt);
    }

    // Move Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy;
      if (l.y < 0) {
        this.lasers.splice(i, 1);
        continue;
      }
      // Check laser vs bricks
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const br = this.bricks[j];
        if (l.x >= br.x && l.x <= br.x + br.width && l.y >= br.y && l.y <= br.y + br.height) {
          this.hitBrick(br, j);
          this.lasers.splice(i, 1);
          break;
        }
      }
    }

    // Move Balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];

      if (b.stuck) {
        b.x = this.paddle.x + this.paddle.width / 2;
        b.y = this.paddle.y - b.radius - 2;
        continue;
      }

      b.x += b.vx * 60 * dt;
      b.y += b.vy * 60 * dt;

      // Side Wall Bounces
      if (b.x - b.radius < 0) {
        b.x = b.radius;
        b.vx = Math.abs(b.vx);
        sounds.playHit();
      }
      if (b.x + b.radius > this.baseWidth) {
        b.x = this.baseWidth - b.radius;
        b.vx = -Math.abs(b.vx);
        sounds.playHit();
      }
      // Top Wall Bounce
      if (b.y - b.radius < 0) {
        b.y = b.radius;
        b.vy = Math.abs(b.vy);
        sounds.playHit();
      }

      // Paddle Collision (Curved Angle Deflection)
      if (b.vy > 0 && b.y + b.radius >= this.paddle.y && b.y - b.radius <= this.paddle.y + this.paddle.height) {
        if (b.x >= this.paddle.x - 6 && b.x <= this.paddle.x + this.paddle.width + 6) {
          // Normalized hit position (-1 = left tip, 0 = center, 1 = right tip)
          const hitOffset = (b.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
          const maxAngle = 1.1; // ~63 degrees
          const bounceAngle = hitOffset * maxAngle;
          const speed = Math.hypot(b.vx, b.vy);

          b.vx = speed * Math.sin(bounceAngle);
          b.vy = -speed * Math.cos(bounceAngle);
          b.y = this.paddle.y - b.radius;
          sounds.playJump();
        }
      }

      // Brick Collisions
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const br = this.bricks[j];
        if (b.x + b.radius >= br.x && b.x - b.radius <= br.x + br.width &&
            b.y + b.radius >= br.y && b.y - b.radius <= br.y + br.height) {

          if (!this.paddle.isFireball) {
            // Determine bounce axis
            const prevX = b.x - b.vx * 60 * dt;
            const prevY = b.y - b.vy * 60 * dt;

            if (prevX + b.radius <= br.x || prevX - b.radius >= br.x + br.width) {
              b.vx = -b.vx;
            } else {
              b.vy = -b.vy;
            }
          }

          this.hitBrick(br, j);
          break;
        }
      }

      // Ball Drain at Bottom
      if (b.y > this.baseHeight + 30) {
        this.balls.splice(i, 1);
      }
    }

    // Check If All Balls Lost
    if (this.balls.length === 0) {
      this.lives--;
      sounds.playHit();

      if (this.lives <= 0) {
        this.state = GameState.GAME_OVER;
        this.setTimeout(() => this.gameOver(this.score), 800);
      } else {
        this.balls = [{
          x: this.paddle.x + this.paddle.width / 2,
          y: this.paddle.y - 10,
          vx: 0,
          vy: 0,
          radius: 8,
          stuck: true
        }];
      }
    }

    // Update Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy * 60 * dt;

      // Caught by paddle?
      if (p.y >= this.paddle.y && p.y <= this.paddle.y + this.paddle.height &&
          p.x >= this.paddle.x && p.x <= this.paddle.x + this.paddle.width) {
        this.activatePowerup(p.type);
        this.powerups.splice(i, 1);
        sounds.playCoin();
        continue;
      }

      if (p.y > this.baseHeight + 20) {
        this.powerups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }

    // Win Check
    if (this.bricks.length === 0) {
      this.levelComplete(this.score);
    }
  }

  hitBrick(br, index) {
    br.hp--;
    sounds.playHit();

    if (br.hp <= 0) {
      this.bricks.splice(index, 1);
      this.score += 20;

      // Spawn particles
      for (let k = 0; k < 10; k++) {
        this.particles.push({
          x: br.x + br.width / 2,
          y: br.y + br.height / 2,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          color: br.color,
          radius: 3,
          alpha: 1,
          life: 0.4
        });
      }

      // Chance of powerup drop
      if (Math.random() < 0.22) {
        const types = ['multiball', 'wide', 'laser', 'fireball'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push({
          x: br.x + br.width / 2,
          y: br.y + br.height / 2,
          type,
          vy: 2.5
        });
      }
    }
  }

  activatePowerup(type) {
    if (type === 'multiball') {
      const firstBall = this.balls[0] || { x: this.paddle.x + this.paddle.width / 2, y: this.paddle.y - 12 };
      this.balls.push({
        x: firstBall.x,
        y: firstBall.y,
        vx: 4.5,
        vy: -5.5,
        radius: 8,
        stuck: false
      });
      this.balls.push({
        x: firstBall.x,
        y: firstBall.y,
        vx: -4.5,
        vy: -5.5,
        radius: 8,
        stuck: false
      });
    } else if (type === 'wide') {
      this.paddle.width = 160;
      this.setTimeout(() => { this.paddle.width = 110; }, 9000);
    } else if (type === 'laser') {
      this.paddle.hasLaser = true;
      this.setTimeout(() => { this.paddle.hasLaser = false; }, 8000);
    } else if (type === 'fireball') {
      this.paddle.isFireball = true;
      this.setTimeout(() => { this.paddle.isFireball = false; }, 7000);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep neon arcade background
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    grad.addColorStop(0, '#0a0d1e');
    grad.addColorStop(1, '#030611');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Render Bricks
    for (const br of this.bricks) {
      this.ctx.fillStyle = br.hp > 1 ? '#cbd5e1' : br.color;
      this.ctx.shadowColor = br.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillRect(br.x, br.y, br.width, br.height);
      this.ctx.shadowBlur = 0;

      // Bevel
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(br.x, br.y, br.width, 3);
    }

    // Render Powerups
    for (const p of this.powerups) {
      this.ctx.fillStyle = '#ffd166';
      this.ctx.shadowColor = '#ffd166';
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(p.x - 14, p.y - 8, 28, 16, 6);
      } else {
        this.ctx.rect(p.x - 14, p.y - 8, 28, 16);
      }
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const label = p.type === 'multiball' ? '●●' : (p.type === 'wide' ? '↔' : (p.type === 'laser' ? '⚡' : '🔥'));
      this.ctx.fillText(label, p.x, p.y);
    }

    // Render Lasers
    this.ctx.fillStyle = '#f43f5e';
    this.ctx.shadowColor = '#f43f5e';
    this.ctx.shadowBlur = 10;
    for (const l of this.lasers) {
      this.ctx.fillRect(l.x - 2, l.y, 4, 14);
    }
    this.ctx.shadowBlur = 0;

    // Render Paddle
    this.ctx.fillStyle = this.paddle.isFireball ? '#f97316' : (this.paddle.hasLaser ? '#f43f5e' : '#00f2fe');
    this.ctx.shadowColor = this.ctx.fillStyle;
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    if (this.ctx.roundRect) {
      this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8);
    } else {
      this.ctx.rect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    }
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Paddle Center Core
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(this.paddle.x + this.paddle.width / 2 - 12, this.paddle.y + 3, 24, 4);

    // Render Balls
    for (const b of this.balls) {
      this.ctx.fillStyle = this.paddle.isFireball ? '#f97316' : '#ffffff';
      this.ctx.shadowColor = this.paddle.isFireball ? '#f97316' : '#00f2fe';
      this.ctx.shadowBlur = 12;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
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

    // Top HUD
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(16, 12, this.baseWidth - 32, 40);

    this.ctx.font = 'bold 18px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 32, 38);

    this.ctx.fillStyle = '#00f2fe';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`LIVES: ${'💛 '.repeat(this.lives)}`, this.baseWidth - 32, 38);
  }
}
