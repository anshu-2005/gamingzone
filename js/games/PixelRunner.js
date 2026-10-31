/* ====================================================
   PIXEL RUNNER — GAMINGZONE
   Side-Scrolling Cyberpunk Endless Platformer:
   Double Jump, Slide Under Buzzsaws, Parallax Skyline,
   Speed Escalation, Shield Orbs & Virtual Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PixelRunnerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Pixel Runner',
      targetScore: 1000,
      ...config
    });

    this.groundY = 440;
    this.runner = {
      x: 100,
      y: this.groundY - 36,
      width: 28,
      height: 36,
      vy: 0,
      gravity: 0.65,
      isGrounded: true,
      jumpCount: 0,
      maxJumps: 2,
      isSliding: false,
      slideTimer: 0,
      hasShield: false,
      runAnim: 0
    };

    this.obstacles = [];
    this.coins = [];
    this.particles = [];
    this.distance = 0;
    this.speed = 360;
    this.obstacleTimer = 0;

    this.createCanvas(720, 540);
    this.initWorld();
    this.initControls();

    this.attachTouchControls({
      showDpad: false,
      actionLabel: 'JUMP',
      onAction: () => this.jump()
    });

    this.showStartCard({
      title: 'PIXEL RUNNER',
      icon: '🏃',
      objective: 'Run across the cyber city! Jump or double-jump over spikes and slide under buzzsaws. Collect coins and shields!',
      controls: 'W/Up Arrow/Space = Jump (press twice to Double Jump), S/Down = Slide.',
      onStart: () => this.start()
    });
  }

  initWorld() {
    this.runner.y = this.groundY - 36;
    this.runner.vy = 0;
    this.runner.isGrounded = true;
    this.runner.jumpCount = 0;
    this.runner.isSliding = false;
    this.runner.hasShield = false;

    this.obstacles = [];
    this.coins = [];
    this.particles = [];
    this.distance = 0;
    this.score = 0;
    this.speed = 360;
    this.obstacleTimer = 1.2;
  }

  jump() {
    if (this.state !== GameState.PLAYING) return;
    if (this.runner.jumpCount < this.runner.maxJumps) {
      this.runner.vy = -12.5;
      this.runner.isGrounded = false;
      this.runner.jumpCount++;
      this.runner.isSliding = false;
      sounds.playJump();

      // Jump dust
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: this.runner.x + 14,
          y: this.runner.y + this.runner.height,
          vx: -40 - Math.random() * 40,
          vy: -20 - Math.random() * 30,
          color: '#38bdf8',
          radius: 3,
          alpha: 1,
          life: 0.3
        });
      }
    }
  }

  slide() {
    if (this.state !== GameState.PLAYING) return;
    if (this.runner.isGrounded && !this.runner.isSliding) {
      this.runner.isSliding = true;
      this.runner.slideTimer = 0.55;
      this.runner.height = 18;
      this.runner.y = this.groundY - 18;
      sounds.playJump();
    }
  }

  initControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') {
        e.preventDefault();
        this.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.slide();
      }
    });

    // Touch tap / swipe on canvas
    let touchY = 0;
    this.addListener(this.canvas, 'touchstart', (e) => {
      touchY = e.touches[0].clientY;
    }, { passive: true });

    this.addListener(this.canvas, 'touchend', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const dy = e.changedTouches[0].clientY - touchY;
      if (dy > 30) {
        this.slide();
      } else {
        this.jump();
      }
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    this.distance += this.speed * dt;
    this.score = Math.floor(this.distance / 10);
    this.speed = Math.min(680, 360 + this.score * 0.4);

    // Runner physics
    if (!this.runner.isGrounded) {
      this.runner.vy += this.runner.gravity;
      this.runner.y += this.runner.vy;

      if (this.runner.y >= this.groundY - this.runner.height) {
        this.runner.y = this.groundY - this.runner.height;
        this.runner.vy = 0;
        this.runner.isGrounded = true;
        this.runner.jumpCount = 0;
      }
    }

    // Slide timer
    if (this.runner.isSliding) {
      this.runner.slideTimer -= dt;
      if (this.runner.slideTimer <= 0) {
        this.runner.isSliding = false;
        this.runner.height = 36;
        this.runner.y = this.groundY - 36;
      }
    }

    this.runner.runAnim += dt * 16;

    // Spawn Obstacles
    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      const type = Math.random() < 0.6 ? 'spike' : 'buzzsaw';
      if (type === 'spike') {
        this.obstacles.push({
          x: this.baseWidth + 50,
          y: this.groundY - 26,
          width: 24,
          height: 26,
          type: 'spike'
        });
      } else {
        // High floating buzzsaw (must slide under)
        this.obstacles.push({
          x: this.baseWidth + 50,
          y: this.groundY - 58,
          width: 32,
          height: 32,
          rot: 0,
          type: 'buzzsaw'
        });
      }

      // Occasional coins
      if (Math.random() < 0.5) {
        this.coins.push({
          x: this.baseWidth + 120,
          y: type === 'buzzsaw' ? this.groundY - 14 : this.groundY - 70,
          radius: 8,
          collected: false
        });
      }

      this.obstacleTimer = 1.0 + Math.random() * 1.2;
    }

    // Move Obstacles & Collision Check
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed * dt;
      if (obs.type === 'buzzsaw') obs.rot += 12 * dt;

      // AABB Collision with Runner
      if (this.runner.x + this.runner.width >= obs.x &&
          this.runner.x <= obs.x + obs.width &&
          this.runner.y + this.runner.height >= obs.y &&
          this.runner.y <= obs.y + obs.height) {

        if (this.runner.hasShield) {
          this.runner.hasShield = false;
          this.obstacles.splice(i, 1);
          sounds.playHit();
          continue;
        }

        // Death!
        this.onDeath();
        return;
      }

      if (obs.x < -80) this.obstacles.splice(i, 1);
    }

    // Move Coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.x -= this.speed * dt;

      if (!c.collected && Math.hypot(this.runner.x + 14 - c.x, this.runner.y + 18 - c.y) < 24) {
        c.collected = true;
        this.score += 25;
        sounds.playCoin();

        for (let k = 0; k < 8; k++) {
          this.particles.push({
            x: c.x, y: c.y,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            color: '#ffd166',
            radius: 3, alpha: 1, life: 0.35
          });
        }
      }

      if (c.x < -40) this.coins.splice(i, 1);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  onDeath() {
    this.state = GameState.GAME_OVER;
    sounds.playHit();

    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x: this.runner.x + 14,
        y: this.runner.y + 18,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        color: '#00f2fe',
        radius: 4,
        alpha: 1,
        life: 0.6
      });
    }

    this.setTimeout(() => this.gameOver(this.score), 800);
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Parallax Cyber Sky
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Distant Neon Skyline
    const skylineOffset = (this.distance * 0.15) % 240;
    this.ctx.fillStyle = '#1e1b4b';
    for (let b = -1; b < 6; b++) {
      const bX = b * 150 - skylineOffset;
      this.ctx.fillRect(bX, 220, 100, 220);
      // Windows
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let wy = 240; wy < 400; wy += 24) {
        this.ctx.fillRect(bX + 16, wy, 16, 12);
        this.ctx.fillRect(bX + 50, wy, 16, 12);
      }
      this.ctx.fillStyle = '#1e1b4b';
    }

    // Ground Pavement
    this.ctx.fillStyle = '#334155';
    this.ctx.fillRect(0, this.groundY, this.baseWidth, this.baseHeight - this.groundY);

    // Neon Ground Guideline
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#00f2fe';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.baseWidth, this.groundY);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Render Obstacles
    for (const obs of this.obstacles) {
      if (obs.type === 'spike') {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x, this.groundY);
        this.ctx.lineTo(obs.x + obs.width / 2, obs.y);
        this.ctx.lineTo(obs.x + obs.width, this.groundY);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (obs.type === 'buzzsaw') {
        this.ctx.save();
        this.ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
        this.ctx.rotate(obs.rot);
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.shadowColor = '#f59e0b';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-2, -18, 4, 36);
        this.ctx.fillRect(-18, -2, 36, 4);
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
      }
    }

    // Render Coins
    for (const c of this.coins) {
      if (c.collected) continue;
      this.ctx.fillStyle = '#ffd166';
      this.ctx.shadowColor = '#ffd166';
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Render Runner
    if (this.state === GameState.PLAYING) {
      this.ctx.fillStyle = '#00f2fe';
      this.ctx.shadowColor = '#00f2fe';
      this.ctx.shadowBlur = 10;

      if (this.runner.isSliding) {
        // Sliding posture
        this.ctx.fillRect(this.runner.x, this.runner.y, 42, 18);
      } else {
        // Standing / Running posture
        const legBob = this.runner.isGrounded ? Math.sin(this.runner.runAnim) * 4 : 0;
        this.ctx.fillRect(this.runner.x, this.runner.y + legBob, this.runner.width, this.runner.height - legBob);

        // Cyber Visor
        this.ctx.fillStyle = '#ffd166';
        this.ctx.fillRect(this.runner.x + 14, this.runner.y + 6 + legBob, 12, 6);
      }
      this.ctx.shadowBlur = 0;
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

    // Top HUD
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(16, 16, 200, 44);

    this.ctx.font = 'bold 20px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 30, 44);
  }
}
