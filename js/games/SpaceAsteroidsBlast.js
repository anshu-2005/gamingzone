/* ====================================================
   SPACE ASTEROIDS BLAST — GAMINGZONE
   Arcade Vector Space Physics, Asteroid Splitting Hierarchy,
   Inertia Thrust Trails, Screen Wrap & Virtual Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class SpaceAsteroidsBlastGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Space Asteroids Blast',
      targetScore: 2500,
      lives: 3,
      ...config
    });

    this.ship = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      rotSpeed: 3.8,
      thrust: 320,
      invulnTimer: 2.0
    };

    this.lasers = [];
    this.asteroids = [];
    this.particles = [];
    this.thrusterParticles = [];
    this.wave = 1;

    this.keys = { left: false, right: false, thrust: false, fire: false };

    this.createCanvas(680, 520);
    this.resetShip();
    this.spawnAsteroidWave(4);
    this.initAsteroidControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
        if (dir === 'UP') this.keys.thrust = pressed;
      },
      actionLabel: 'FIRE',
      onAction: (pressed) => {
        if (pressed) this.fireLaser();
      }
    });

    this.showStartCard({
      title: 'SPACE ASTEROIDS BLAST',
      icon: '☄️',
      objective: 'Blast drifting space asteroids before they collide with your ship! Large rocks shatter into smaller, faster fragments.',
      controls: 'Left/Right to rotate, Up/W to thrust, Space to fire lasers.',
      onStart: () => this.start()
    });
  }

  resetShip() {
    this.ship.x = this.baseWidth / 2;
    this.ship.y = this.baseHeight / 2;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.angle = -Math.PI / 2;
    this.ship.invulnTimer = 2.0;
  }

  spawnAsteroidWave(count) {
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.random() * this.baseWidth;
        y = Math.random() * this.baseHeight;
      } while (Math.hypot(x - this.baseWidth / 2, y - this.baseHeight / 2) < 140);

      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 40;

      this.asteroids.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 36, // Large
        tier: 3,
        points: this.generateAsteroidPoints(36)
      });
    }
  }

  generateAsteroidPoints(radius) {
    const pts = [];
    const numPts = 10;
    for (let i = 0; i < numPts; i++) {
      const angle = (i / numPts) * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4);
      pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return pts;
  }

  initAsteroidControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.thrust = true;
      if (e.code === 'Space' || e.key === ' ') {
        this.fireLaser();
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.thrust = false;
    });
  }

  fireLaser() {
    if (this.lasers.length >= 6) return;

    sounds.playLaser();
    this.lasers.push({
      x: this.ship.x + Math.cos(this.ship.angle) * 20,
      y: this.ship.y + Math.sin(this.ship.angle) * 20,
      vx: Math.cos(this.ship.angle) * 600,
      vy: Math.sin(this.ship.angle) * 600,
      life: 0.9
    });
  }

  update(dt) {
    // Ship Rotation & Thrust
    if (this.keys.left) this.ship.angle -= this.ship.rotSpeed * dt;
    if (this.keys.right) this.ship.angle += this.ship.rotSpeed * dt;

    if (this.keys.thrust) {
      this.ship.vx += Math.cos(this.ship.angle) * this.ship.thrust * dt;
      this.ship.vy += Math.sin(this.ship.angle) * this.ship.thrust * dt;

      // Thruster exhaust particles
      this.thrusterParticles.push({
        x: this.ship.x - Math.cos(this.ship.angle) * 16,
        y: this.ship.y - Math.sin(this.ship.angle) * 16,
        vx: -Math.cos(this.ship.angle) * 120 + (Math.random() - 0.5) * 40,
        vy: -Math.sin(this.ship.angle) * 120 + (Math.random() - 0.5) * 40,
        life: 0.25
      });
    }

    // Inertial Space Friction
    this.ship.vx *= 0.985;
    this.ship.vy *= 0.985;

    this.ship.x = (this.ship.x + this.ship.vx * dt + this.baseWidth) % this.baseWidth;
    this.ship.y = (this.ship.y + this.ship.vy * dt + this.baseHeight) % this.baseHeight;

    if (this.ship.invulnTimer > 0) this.ship.invulnTimer -= dt;

    // Update Thruster Particles
    for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
      const tp = this.thrusterParticles[i];
      tp.x += tp.vx * dt;
      tp.y += tp.vy * dt;
      tp.life -= dt;
      if (tp.life <= 0) this.thrusterParticles.splice(i, 1);
    }

    // Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.x = (l.x + l.vx * dt + this.baseWidth) % this.baseWidth;
      l.y = (l.y + l.vy * dt + this.baseHeight) % this.baseHeight;
      l.life -= dt;

      if (l.life <= 0) {
        this.lasers.splice(i, 1);
        continue;
      }

      // Check Laser Collision with Asteroids
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const a = this.asteroids[j];
        if (Math.hypot(l.x - a.x, l.y - a.y) <= a.radius) {
          // Hit asteroid!
          this.lasers.splice(i, 1);
          sounds.playWin();

          const pts = a.tier === 3 ? 50 : (a.tier === 2 ? 100 : 150);
          this.score += pts;
          this.spawnExplosion(a.x, a.y, '#00e5ff', 12);

          // Split asteroid if tier > 1
          if (a.tier > 1) {
            for (let s = 0; s < 2; s++) {
              const splitAngle = Math.random() * Math.PI * 2;
              const newRadius = a.tier === 3 ? 22 : 14;
              this.asteroids.push({
                x: a.x,
                y: a.y,
                vx: Math.cos(splitAngle) * (a.tier === 3 ? 80 : 130),
                vy: Math.sin(splitAngle) * (a.tier === 3 ? 80 : 130),
                radius: newRadius,
                tier: a.tier - 1,
                points: this.generateAsteroidPoints(newRadius)
              });
            }
          }

          this.asteroids.splice(j, 1);
          break;
        }
      }
    }

    // Update Asteroids & Ship Collisions
    for (let i = 0; i < this.asteroids.length; i++) {
      const a = this.asteroids[i];
      a.x = (a.x + a.vx * dt + this.baseWidth) % this.baseWidth;
      a.y = (a.y + a.vy * dt + this.baseHeight) % this.baseHeight;

      // Ship collision
      if (this.ship.invulnTimer <= 0 && Math.hypot(a.x - this.ship.x, a.y - this.ship.y) <= a.radius + 12) {
        this.lives--;
        sounds.playHit();
        this.spawnExplosion(this.ship.x, this.ship.y, '#ef4444', 20);

        if (this.lives <= 0) {
          this.finishGame(this.score, { isVictory: false });
          return;
        } else {
          this.resetShip();
        }
      }
    }

    // Check Wave Cleared
    if (this.asteroids.length === 0) {
      sounds.playLevelUp();
      this.score += 500;
      this.wave++;
      this.spawnAsteroidWave(4 + this.wave);
      this.ship.invulnTimer = 2.0;

      if (this.score >= this.config.targetScore) {
        this.finishGame(this.score, { isVictory: true });
      }
    }

    // Update Explosion Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.5) * 240,
        color,
        life: 0.4
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Dark Vector Cosmos
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`☄️ WAVE: ${this.wave}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`SHIPS: ${'🚀'.repeat(Math.max(0, this.lives))}`, this.baseWidth - 24, 34);

    // Draw Asteroids
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    this.asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      a.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Draw Lasers
    ctx.fillStyle = '#00e5ff';
    this.lasers.forEach(l => {
      ctx.beginPath();
      ctx.arc(l.x, l.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Thruster Flame Particles
    this.thrusterParticles.forEach(tp => {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Explosion Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Spaceship
    ctx.save();
    ctx.translate(this.ship.x, this.ship.y);
    ctx.rotate(this.ship.angle);

    // Invulnerability shield glow
    if (this.ship.invulnTimer > 0) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ship Vector Triangle
    ctx.strokeStyle = '#00e5ff';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
