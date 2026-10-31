/* ====================================================
   MOTO XTREME — GAMINGZONE
   Physics Dirt Bike Trials with Stunt Flips, Spring Suspension,
   Ramp Gap Jumps, Wheelies & Full Touch/Keyboard Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class MotoXtremeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Moto Xtreme',
      targetScore: 2000,
      targetDistance: 1500,
      ...config
    });

    this.distance = 0;
    this.targetDist = this.config.targetDistance || 1500;
    this.flips = 0;

    // Dirt Bike Physics State
    this.bike = {
      x: 140,
      y: 350,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVel: 0,
      speed: 0,
      onGround: true,
      lastRot: 0,
      crashed: false
    };

    this.keys = { gas: false, brake: false, leanLeft: false, leanRight: false };
    this.terrain = [];
    this.coins = [];
    this.particles = [];
    this.announcements = [];
    this.cameraX = 0;

    this.createCanvas(740, 520);
    this.generateTerrain();
    this.initMotoControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'RIGHT') this.keys.gas = pressed;
        if (dir === 'LEFT') this.keys.brake = pressed;
        if (dir === 'UP') this.keys.leanRight = pressed;
        if (dir === 'DOWN') this.keys.leanLeft = pressed;
      },
      actionLabel: 'GAS',
      onAction: (pressed) => {
        this.keys.gas = pressed;
      }
    });

    this.showStartCard({
      title: 'MOTO XTREME',
      icon: '🏍️',
      objective: `Race your dirt bike across ${this.targetDist}m of rugged motocross terrain! Perform mid-air backflips for stunt bonuses.`,
      controls: 'D / Right Arrow = Gas, A / Left Arrow = Brake, W/S = Lean Forward / Back.',
      onStart: () => this.start()
    });
  }

  generateTerrain() {
    this.terrain = [];
    this.coins = [];
    let curY = 380;

    for (let x = 0; x < 3000; x += 35) {
      if (x > 250) {
        curY += (Math.sin(x * 0.015) * 28) + (Math.cos(x * 0.035) * 18);
        curY = Math.max(260, Math.min(440, curY));
      }
      this.terrain.push({ x, y: curY });

      // Star collectibles on hill crests
      if (x > 200 && Math.random() < 0.35) {
        this.coins.push({ x, y: curY - 50, collected: false });
      }
    }
  }

  initMotoControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING || this.bike.crashed) return;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.gas = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.brake = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.leanRight = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.leanLeft = true;
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.gas = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.brake = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.leanRight = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.leanLeft = false;
    });
  }

  getGroundHeight(x) {
    const idx = Math.floor(x / 35);
    if (idx < 0) return 380;
    if (idx >= this.terrain.length - 1) return 380;

    const t1 = this.terrain[idx];
    const t2 = this.terrain[idx + 1];
    const ratio = (x - t1.x) / 35;
    return t1.y + (t2.y - t1.y) * ratio;
  }

  update(dt) {
    if (this.bike.crashed) return;

    // Throttle & Brakes
    if (this.keys.gas) {
      this.bike.speed = Math.min(480, this.bike.speed + 420 * dt);
      // Dirt exhaust particles
      if (this.bike.onGround && Math.random() < 0.4) {
        this.particles.push({
          x: this.bike.x - 22,
          y: this.bike.y + 12,
          vx: -120 + (Math.random() - 0.5) * 40,
          vy: -40 + (Math.random() - 0.5) * 40,
          color: '#ca8a04',
          life: 0.3
        });
      }
    } else if (this.keys.brake) {
      this.bike.speed = Math.max(0, this.bike.speed - 500 * dt);
    } else {
      this.bike.speed = Math.max(0, this.bike.speed - 120 * dt);
    }

    // Lean / Air Rotation
    if (this.keys.leanRight) this.bike.angularVel += 5.5 * dt;
    if (this.keys.leanLeft) this.bike.angularVel -= 5.5 * dt;

    this.bike.angularVel *= 0.94;
    this.bike.angle += this.bike.angularVel * dt;

    // Check Full 360 Stunt Flip in Air
    if (!this.bike.onGround) {
      if (Math.abs(this.bike.angle - this.bike.lastRot) >= Math.PI * 1.9) {
        this.flips++;
        this.score += 350;
        sounds.playWin();
        this.announcements.push({ text: 'BACKFLIP! +350 🔥', y: 160, alpha: 1 });
        this.spawnBurst(this.bike.x, this.bike.y, '#ffd166', 15);
        this.bike.lastRot = this.bike.angle;
      }
    } else {
      this.bike.lastRot = this.bike.angle;
    }

    // Forward Velocity
    this.bike.vx = Math.cos(this.bike.angle) * this.bike.speed;
    this.bike.x += this.bike.vx * dt;

    // Gravity
    this.bike.vy += 850 * dt;
    this.bike.y += this.bike.vy * dt;

    // Ground Collision
    const groundY = this.getGroundHeight(this.bike.x) - 18;

    if (this.bike.y >= groundY) {
      this.bike.y = groundY;
      this.bike.vy = 0;
      this.bike.onGround = true;

      // Crash if upside down on landing
      const normalizedAngle = Math.abs(Math.sin(this.bike.angle));
      if (normalizedAngle > 0.85) {
        this.bike.crashed = true;
        sounds.playHit();
        this.spawnBurst(this.bike.x, this.bike.y, '#ef4444', 24);

        this.setTimeout(() => {
          this.finishGame(this.score, { isVictory: false });
        }, 1000);
        return;
      }

      // Settle angle toward slope
      const slopeAngle = Math.atan2(
        this.getGroundHeight(this.bike.x + 20) - this.getGroundHeight(this.bike.x - 20),
        40
      );
      this.bike.angle += (slopeAngle - this.bike.angle) * 0.15;
    } else {
      this.bike.onGround = false;
    }

    // Distance & Score
    this.distance = Math.round(this.bike.x);
    this.score = Math.round(this.distance * 0.8 + this.flips * 350);

    // Camera follow
    this.cameraX = this.bike.x - 180;

    // Check Coin Collection
    this.coins.forEach(c => {
      if (!c.collected && Math.hypot(this.bike.x - c.x, this.bike.y - c.y) < 32) {
        c.collected = true;
        this.score += 80;
        sounds.playCoin();
        this.spawnBurst(c.x, c.y, '#ffd166', 8);
      }
    });

    // Check Victory Finish Line
    if (this.distance >= this.targetDist) {
      sounds.playWin();
      this.score += 1000;
      this.finishGame(this.score, { isVictory: true, flips: this.flips });
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Announcements
    for (let i = this.announcements.length - 1; i >= 0; i--) {
      const a = this.announcements[i];
      a.y -= 25 * dt;
      a.alpha -= dt * 0.9;
      if (a.alpha <= 0) this.announcements.splice(i, 1);
    }
  }

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Motocross Canyon Sky
    const sky = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    sky.addColorStop(0, '#0284c7');
    sky.addColorStop(0.5, '#38bdf8');
    sky.addColorStop(1, '#ca8a04');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // Draw Dirt Terrain Line & Fill
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(0, this.baseHeight);
    this.terrain.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(this.terrain[this.terrain.length - 1].x, this.baseHeight);
    ctx.closePath();
    ctx.fill();

    // Grass Top Crest
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 6;
    ctx.beginPath();
    this.terrain.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Draw Coins
    this.coins.forEach(c => {
      if (!c.collected) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', c.x, c.y);
      }
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Dirt Bike & Rider
    ctx.save();
    ctx.translate(this.bike.x, this.bike.y);
    ctx.rotate(this.bike.angle);

    // Front & Rear Knobby Wheels
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(-20, 10, 11, 0, Math.PI * 2);
    ctx.arc(20, 10, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bike Frame (Neon Orange)
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-20, 10);
    ctx.lineTo(0, -6);
    ctx.lineTo(16, -10);
    ctx.lineTo(20, 10);
    ctx.stroke();

    // Handlebars
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, -18);
    ctx.lineTo(16, -10);
    ctx.stroke();

    // Stickman Motocross Rider
    ctx.strokeStyle = '#0284c7';
    ctx.fillStyle = '#0284c7';
    ctx.lineWidth = 3;

    // Torso & Helmet
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, -26);
    ctx.stroke();

    // Helmet Head
    ctx.beginPath();
    ctx.arc(6, -34, 7, 0, Math.PI * 2);
    ctx.fill();

    // Arms to Handlebar
    ctx.beginPath();
    ctx.moveTo(4, -22);
    ctx.lineTo(12, -18);
    ctx.stroke();

    ctx.restore();

    ctx.restore();

    // Draw Announcements
    this.announcements.forEach(a => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.font = '900 32px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(a.text, this.baseWidth / 2, a.y);
      ctx.restore();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🏍️ DISTANCE: ${this.distance}m / ${this.targetDist}m`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`FLIPS: ${this.flips}🔥`, this.baseWidth - 24, 34);
  }
}
