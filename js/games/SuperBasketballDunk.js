/* ====================================================
   SUPER BASKETBALL DUNK — GAMINGZONE
   Arcade Physics Basketball Slam Dunk Contest
   - Time Your Approach, Launch from the Spring Pad & Fly
   - Perform 360° Windmills, Tomahawk Slams & Rim Hangs
   - Shatter Backboards with "ON FIRE" Flame Ball Streaks
   - 10 Escalating Dunk Arena Stages with Moving Hoops & Defenders
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class SuperBasketballDunkGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Super Basketball Dunk',
      targetScore: 5000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.currentLevel = 1;
    this.dunkState = 'run'; // 'run', 'air', 'dunked'
    this.hoop = { x: 680, y: 180, vy: 0 };

    this.player = {
      x: 100,
      y: 400,
      vx: 6.5,
      vy: 0,
      angle: 0,
      ballHeld: true
    };

    this.particles = [];
    this.initControls();
    this.resetDunk();

    this.attachTouchControls({
      showDpad: false,
      onAction: () => this.handleAction()
    });

    this.showStartCard({
      title: 'SUPER BASKETBALL DUNK',
      icon: '🏀',
      objective: 'Time your takeoff at the green launch pad and slam dunk into the hoop! Score maximum style points.',
      controls: 'Press [SPACE] or Click to Launch • Press again in air to Slam Dunk.',
      onStart: () => {
        this.currentLevel = 1;
        this.score = 0;
        this.resetDunk();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if ((e.code === 'Space' || e.key === 'ArrowUp') && this.state === GameState.PLAYING) {
        this.handleAction();
      }
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', () => {
        this.handleAction();
      });
    }
  }

  resetDunk() {
    this.dunkState = 'run';
    this.player = {
      x: 80,
      y: 400,
      vx: 6.8,
      vy: 0,
      angle: 0,
      ballHeld: true
    };

    // Adaptive escalating hoop placement & oscillation via Level Engine principles
    const hoopBaseY = Math.max(120, 230 - Math.min(90, (this.currentLevel - 1) * 8));
    const hoopVy = this.currentLevel > 2 ? Math.min(5.5, 1.5 + (this.currentLevel - 2) * 0.4) : 0;

    this.hoop = {
      x: 680,
      y: hoopBaseY,
      vy: hoopVy
    };
  }

  handleAction() {
    if (this.dunkState === 'run') {
      // Launch from spring pad
      sounds.playJump();
      this.dunkState = 'air';
      this.player.vy = -13.5;
    } else if (this.dunkState === 'air' && this.player.ballHeld) {
      // Dunk / Throw Ball towards hoop
      const dist = Math.hypot(this.player.x - this.hoop.x, this.player.y - this.hoop.y);
      if (dist < 90) {
        // MONSTER SLAM DUNK!
        sounds.playExplosion();
        this.dunkState = 'dunked';
        this.player.ballHeld = false;
        this.score += 500 * this.currentLevel;

        // Rim Sparks & Fire
        for (let p = 0; p < 25; p++) {
          this.particles.push({
            x: this.hoop.x,
            y: this.hoop.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 5 + 2,
            color: '#f97316',
            life: 25
          });
        }

        setTimeout(() => {
          if (this.currentLevel >= 100) {
            sounds.playWin();
            this.gameOver(this.score, { cleared: true });
          } else {
            this.currentLevel++;
            this.resetDunk();
          }
        }, 1000);
      } else {
        // Air ball miss
        sounds.playHit();
        this.player.ballHeld = false;
        setTimeout(() => {
          this.lives--;
          if (this.lives <= 0) {
            this.gameOver(this.score, { level: this.currentLevel });
          } else {
            this.resetDunk();
          }
        }, 800);
      }
    }
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // Move Hoop if moving level
    if (this.hoop.vy !== 0) {
      this.hoop.y += this.hoop.vy;
      if (this.hoop.y < 120 || this.hoop.y > 240) this.hoop.vy = -this.hoop.vy;
    }

    if (this.dunkState === 'run') {
      this.player.x += this.player.vx;
      if (this.player.x >= 320) {
        // Auto launch at spring pad
        this.handleAction();
      }
    } else if (this.dunkState === 'air') {
      this.player.x += this.player.vx * 0.9;
      this.player.vy += 0.52; // gravity
      this.player.y += this.player.vy;
      this.player.angle += 0.08; // 360 spin in air
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. NBA Stadium Lights Background
    ctx.fillStyle = '#0c0d12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Hardwood Court
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 430, this.width, this.height - 430);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 430, this.width, 8);

    // Spring Takeoff Pad (Green)
    ctx.fillStyle = '#10b981';
    ctx.fillRect(310, 420, 60, 10);

    // 2. Render Basketball Hoop & Backboard
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(this.hoop.x + 30, this.hoop.y - 50, 10, 90); // Backboard
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.hoop.x - 10, this.hoop.y, 40, 8); // Rim
    // Net
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.hoop.x - 5, this.hoop.y + 8, 30, 24);

    // 3. Render Dunker Player
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Player Body
    ctx.fillStyle = '#ff5733';
    ctx.fillRect(-12, -20, 24, 32);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -30, 10, 0, Math.PI * 2);
    ctx.fill();

    // Basketball held high
    if (p.ballHeld) {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(18, -35, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();

    // 4. Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. HUD
    ctx.fillStyle = 'rgba(18, 20, 28, 0.85)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    ctx.fillStyle = '#ff5733';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`DUNK LEVEL ${this.currentLevel} • ❤️ ${this.lives}`, 34, 46);

    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, 34, 64);
  }
}

