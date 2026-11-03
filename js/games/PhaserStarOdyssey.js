/* ====================================================
   PHASER STAR ODYSSEY — RETRO ARCADE SPACE RUNNER
   Inspired by design1online/phaser3-es6-webpack-template
   High-speed cosmic dodging, dual photon blasters,
   asteroid fields, plasma energy cores & multiplier combos.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PhaserStarOdysseyGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Phaser Star Odyssey',
      targetScore: 4000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.ship = {
      x: 120,
      y: 260,
      vx: 0,
      vy: 0,
      speed: 340,
      width: 44,
      height: 28,
      shields: 100,
      maxShields: 100,
      fireTimer: 0
    };

    this.stars = [];
    this.lasers = [];
    this.asteroids = [];
    this.orbs = [];
    this.particles = [];
    this.multiplier = 1;
    this.comboTimer = 0;
    this.keys = {};

    this.initStars();
    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (dir === 'UP') this.keys['ArrowUp'] = pressed;
        if (dir === 'DOWN') this.keys['ArrowDown'] = pressed;
        if (dir === 'LEFT') this.keys['ArrowLeft'] = pressed;
        if (dir === 'RIGHT') this.keys['ArrowRight'] = pressed;
      },
      onAction: (pressed) => {
        if (pressed) this.fireLasers();
      },
      actionLabel: '💥 BLASTER',
      showDpad: true
    });

    this.showStartCard({
      title: 'PHASER STAR ODYSSEY',
      icon: '🚀',
      objective: 'Navigate the cosmic asteroid belt, blast obstacles, and gather plasma cores for massive score multipliers!',
      controls: 'WASD / Arrow Keys to Steer • SPACE / Click to Fire Blasters'
    });
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.baseWidth,
        y: Math.random() * this.baseHeight,
        speed: 40 + Math.random() * 180,
        r: Math.random() * 2 + 0.5,
        color: Math.random() < 0.2 ? '#00e5ff' : '#ffffff'
      });
    }
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.fireLasers();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      this.fireLasers();
    });
  }

  fireLasers() {
    if (this.state !== GameState.PLAYING) return;
    if (this.ship.fireTimer > 0) return;

    this.ship.fireTimer = 0.16;
    sounds.playHit?.();

    // Dual photon blasters
    this.lasers.push({
      x: this.ship.x + 30,
      y: this.ship.y - 10,
      vx: 750,
      vy: 0,
      r: 3
    });
    this.lasers.push({
      x: this.ship.x + 30,
      y: this.ship.y + 10,
      vx: 750,
      vy: 0,
      r: 3
    });
  }

  spawnAsteroid() {
    const r = 16 + Math.random() * 22;
    this.asteroids.push({
      x: this.baseWidth + 40,
      y: Math.random() * (this.baseHeight - 80) + 40,
      vx: -(140 + Math.random() * 160),
      r: r,
      hp: Math.ceil(r / 10),
      rot: 0,
      vRot: (Math.random() - 0.5) * 3
    });
  }

  spawnOrb() {
    this.orbs.push({
      x: this.baseWidth + 30,
      y: Math.random() * (this.baseHeight - 80) + 40,
      vx: -180,
      r: 10
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Ship steering
    let dy = 0;
    let dx = 0;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) dy -= 1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) dy += 1;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) dx -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx += 1;

    this.ship.x += dx * this.ship.speed * dt;
    this.ship.y += dy * this.ship.speed * dt;

    // Boundaries
    this.ship.x = Math.max(30, Math.min(this.baseWidth - 100, this.ship.x));
    this.ship.y = Math.max(30, Math.min(this.baseHeight - 30, this.ship.y));

    if (this.ship.fireTimer > 0) this.ship.fireTimer -= dt;

    // Thruster engine particles
    if (Math.random() < 0.8) {
      this.particles.push({
        x: this.ship.x - 20,
        y: this.ship.y + (Math.random() - 0.5) * 8,
        vx: -(120 + Math.random() * 80),
        vy: (Math.random() - 0.5) * 20,
        life: 0.25,
        maxLife: 0.25,
        color: '#00e5ff',
        r: 3
      });
    }

    // Stars parallax
    for (const star of this.stars) {
      star.x -= star.speed * dt;
      if (star.x < 0) {
        star.x = this.baseWidth;
        star.y = Math.random() * this.baseHeight;
      }
    }

    // Spawner timers
    if (Math.random() < 0.04) this.spawnAsteroid();
    if (Math.random() < 0.02) this.spawnOrb();

    // Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.x += l.vx * dt;
      if (l.x > this.baseWidth) {
        this.lasers.splice(i, 1);
        continue;
      }

      // Check hit asteroids
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const ast = this.asteroids[j];
        if (Math.hypot(l.x - ast.x, l.y - ast.y) < ast.r + l.r) {
          ast.hp--;
          this.lasers.splice(i, 1);
          sounds.playHit?.();

          // Spark particles
          for (let p = 0; p < 5; p++) {
            this.particles.push({
              x: ast.x,
              y: ast.y,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 140,
              life: 0.25,
              maxLife: 0.25,
              color: '#f59e0b',
              r: 2.5
            });
          }

          if (ast.hp <= 0) {
            this.score += 100 * this.multiplier;
            this.multiplier = Math.min(5, this.multiplier + 1);
            this.comboTimer = 2.5;
            this.asteroids.splice(j, 1);
            sounds.playScore?.();
          }
          break;
        }
      }
    }

    // Asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.x += ast.vx * dt;
      ast.rot += ast.vRot * dt;

      // Ship collision
      if (Math.hypot(ast.x - this.ship.x, ast.y - this.ship.y) < ast.r + 18) {
        this.ship.shields -= 30;
        this.multiplier = 1;
        this.asteroids.splice(i, 1);
        sounds.playCrash?.();

        if (this.ship.shields <= 0) {
          this.finishGame(this.score, { reason: 'Ship Destroyed by Asteroid Collision' });
          return;
        }
        continue;
      }

      if (ast.x < -60) {
        this.asteroids.splice(i, 1);
      }
    }

    // Orbs
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      orb.x += orb.vx * dt;

      if (Math.hypot(orb.x - this.ship.x, orb.y - this.ship.y) < orb.r + 22) {
        this.score += 250 * this.multiplier;
        this.ship.shields = Math.min(this.ship.maxShields, this.ship.shields + 15);
        this.orbs.splice(i, 1);
        sounds.playLevelUp?.();
        continue;
      }

      if (orb.x < -30) {
        this.orbs.splice(i, 1);
      }
    }

    // Multiplier combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.multiplier = 1;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Deep cosmic space gradient
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (const star of this.stars) {
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lasers
    for (const l of this.lasers) {
      ctx.save();
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(l.x - 8, l.y - 2, 16, 4);
      ctx.restore();
    }

    // Asteroids
    for (const ast of this.asteroids) {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rot);
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ast.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Orbs
    for (const orb of this.orbs) {
      ctx.save();
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Ship
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(this.ship.x + 22, this.ship.y);
    ctx.lineTo(this.ship.x - 18, this.ship.y - 14);
    ctx.lineTo(this.ship.x - 10, this.ship.y);
    ctx.lineTo(this.ship.x - 18, this.ship.y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(this.ship.x + 4, this.ship.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // HUD Glass
    ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
    ctx.fillRect(16, 12, 280, 52);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(16, 12, 280, 52);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('SHIELDS', 26, 32);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(80, 22, 140, 12);
    ctx.fillStyle = this.ship.shields > 30 ? '#00e5ff' : '#ef4444';
    ctx.fillRect(80, 22, 140 * (this.ship.shields / this.ship.maxShields), 12);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`MULTIPLIER: x${this.multiplier}`, 26, 52);

    ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
    ctx.fillRect(w - 200, 12, 184, 52);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(w - 200, 12, 184, 52);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score}`, w - 184, 44);
  }
}

export default PhaserStarOdysseyGame;
