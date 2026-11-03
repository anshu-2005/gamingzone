import { GameEngineBase } from '../core/GameEngineBase.js';

export class AstroLoopOrbital extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Astro Loop: Orbital Roguelike';
    this.score = 0;
    this.orbitAngle = 0;
    this.orbitRadius = 180;
    this.centerX = 500;
    this.centerY = 280;
    this.hull = 100;
    this.wave = 1;
    this.gameOver = false;

    this.keys = { left: false, right: false };
    this.lasers = [];
    this.enemies = [];
    this.particles = [];
    this.spawnTimer = 1.0;
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.fireLaser();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
      else this.fireLaser();
    });

    this.showStartCard(
      'ASTRO LOOP: ORBITAL ROGUELIKE',
      'Circular orbit tactical space shooter! Orbit around the planet core using [A/D or Arrows]. Fire plasma cannons [Space/W or Click] outward at descending asteroid storms and alien attack ships!',
      'COMMENCE PATROL'
    );
  }

  restart() {
    this.score = 0;
    this.orbitAngle = 0;
    this.hull = 100;
    this.wave = 1;
    this.gameOver = false;
    this.lasers = [];
    this.enemies = [];
    this.particles = [];
    this.spawnTimer = 1.0;
  }

  fireLaser() {
    if (this.gameOver) return;
    const px = this.centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
    const py = this.centerY + Math.sin(this.orbitAngle) * this.orbitRadius;

    // Fire directly outward from center
    this.lasers.push({
      x: px,
      y: py,
      vx: Math.cos(this.orbitAngle) * 550,
      vy: Math.sin(this.orbitAngle) * 550,
      life: 1.2
    });
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    // Orbit steering
    const turnSpeed = 3.2;
    if (this.keys.left) this.orbitAngle -= turnSpeed * dt;
    if (this.keys.right) this.orbitAngle += turnSpeed * dt;

    // Spawn incoming threats
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.6, 2.0 - (this.wave * 0.15));

      const angle = Math.random() * Math.PI * 2;
      const dist = 380;
      const isShip = Math.random() < 0.35;

      this.enemies.push({
        x: this.centerX + Math.cos(angle) * dist,
        y: this.centerY + Math.sin(angle) * dist,
        speed: (isShip ? 90 : 65) + this.wave * 5,
        radius: isShip ? 14 : 18,
        hp: isShip ? 2 : 1,
        isShip,
        color: isShip ? '#ef4444' : '#94a3b8'
      });
    }

    // Move lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.life -= dt;
      if (l.life <= 0) this.lasers.splice(i, 1);
    }

    // Move enemies towards planet center
    const px = this.centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
    const py = this.centerY + Math.sin(this.orbitAngle) * this.orbitRadius;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const toCenterX = this.centerX - e.x;
      const toCenterY = this.centerY - e.y;
      const dist = Math.hypot(toCenterX, toCenterY);

      e.x += (toCenterX / dist) * e.speed * dt;
      e.y += (toCenterY / dist) * e.speed * dt;

      // Laser collision
      for (let j = this.lasers.length - 1; j >= 0; j--) {
        const l = this.lasers[j];
        if (Math.hypot(e.x - l.x, e.y - l.y) < e.radius + 6) {
          e.hp--;
          this.lasers.splice(j, 1);
          if (e.hp <= 0) {
            this.explode(e.x, e.y, e.color);
            this.score += e.isShip ? 250 : 100;
            this.enemies.splice(i, 1);
            break;
          }
        }
      }

      // Collision with player ship
      if (Math.hypot(e.x - px, e.y - py) < e.radius + 12) {
        this.hull -= 25;
        this.explode(e.x, e.y, '#ef4444');
        this.enemies.splice(i, 1);
        if (this.hull <= 0) {
          this.hull = 0;
          this.gameOver = true;
          this.explode(px, py, '#38bdf8');
          break;
        }
        continue;
      }

      // Reached core
      if (dist < 40) {
        this.hull -= 15;
        this.enemies.splice(i, 1);
        if (this.hull <= 0) {
          this.hull = 0;
          this.gameOver = true;
        }
      }
    }

    // Particle update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  explode(x, y, color) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color,
        life: 0.5
      });
    }
  }

  onRender(ctx) {
    // Deep Space Background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, 1000, 562);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137) % 1000;
      const sy = (i * 93) % 562;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Planetary Core
    const coreGrad = ctx.createRadialGradient(this.centerX, this.centerY, 10, this.centerX, this.centerY, 40);
    coreGrad.addColorStop(0, '#38bdf8');
    coreGrad.addColorStop(0.8, '#0369a1');
    coreGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 36, 0, Math.PI * 2);
    ctx.fill();

    // Orbital Ring Perimeter Line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Render Lasers
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    for (const l of this.lasers) {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x + l.vx * 0.04, l.y + l.vy * 0.04);
      ctx.stroke();
    }

    // Render Enemies
    for (const e of this.enemies) {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Render Player Starfighter
    if (!this.gameOver) {
      const px = this.centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
      const py = this.centerY + Math.sin(this.orbitAngle) * this.orbitRadius;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.orbitAngle);

      // Ship triangle facing outward
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();

      // Wing glow
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🛸 ASTRO LOOP: ORBITAL ROGUELIKE', 30, 38);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  HULL: ${this.hull}%`, 970, 38);

    // Controls
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 520, 1000, 42);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 CONTROLS: [A / D] or [Arrows] Orbit Clockwise/Counter • [Space / Click] Fire Lasers Outward', 500, 545);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PLANETARY DEFENSE BREACHED!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`FINAL SCORE: ${this.score}`, 500, 290);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('ENGAGE AGAIN', 500, 362);
    }
  }
}

