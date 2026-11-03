import { GameEngineBase } from '../core/GameEngineBase.js';

export class MissileEscapePilot extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Missile Escape: Stunt Pilot';
    this.score = 0;
    this.stars = 0;
    this.missilesDodged = 0;
    this.gameOver = false;

    this.plane = {
      x: 500,
      y: 280,
      angle: -Math.PI / 2,
      speed: 210,
      turnSpeed: 3.5,
      hasShield: false,
      shieldTime: 0
    };

    this.keys = { left: false, right: false };
    this.missiles = [];
    this.starsList = [];
    this.particles = [];
    this.smokeTrails = [];
    this.spawnTimer = 1.0;
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
    });

    this.showStartCard(
      'MISSILE ESCAPE: STUNT PILOT',
      'The viral aerial evasion classic! Pilot an agile stunt plane dodging heat-seeking missiles. Steer in sharp loops [A/D or Left/Right] to trick missiles into colliding with each other! Grab Stars and Shield powerups.',
      'TAKE FLIGHT'
    );
  }

  restart() {
    this.score = 0;
    this.stars = 0;
    this.missilesDodged = 0;
    this.gameOver = false;
    this.plane.x = 500;
    this.plane.y = 280;
    this.plane.angle = -Math.PI / 2;
    this.plane.hasShield = false;
    this.missiles = [];
    this.starsList = [];
    this.particles = [];
    this.smokeTrails = [];
    this.spawnTimer = 1.0;
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    // Plane Steering
    if (this.keys.left) this.plane.angle -= this.plane.turnSpeed * dt;
    if (this.keys.right) this.plane.angle += this.plane.turnSpeed * dt;

    // Move plane
    this.plane.x += Math.cos(this.plane.angle) * this.plane.speed * dt;
    this.plane.y += Math.sin(this.plane.angle) * this.plane.speed * dt;

    // Wrap around screen boundaries
    if (this.plane.x < 0) this.plane.x = 1000;
    if (this.plane.x > 1000) this.plane.x = 0;
    if (this.plane.y < 60) this.plane.y = 562;
    if (this.plane.y > 562) this.plane.y = 60;

    // Plane smoke trail
    this.smokeTrails.push({
      x: this.plane.x - Math.cos(this.plane.angle) * 16,
      y: this.plane.y - Math.sin(this.plane.angle) * 16,
      radius: 5,
      life: 0.5,
      color: 'rgba(255, 255, 255, 0.4)'
    });

    // Score over time
    this.score += Math.round(dt * 15);

    // Spawn missiles
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(1.2, 3.0 - (this.score / 600));

      // Spawn at edge
      const edge = Math.floor(Math.random() * 4);
      let mx = 0, my = 0;
      if (edge === 0) { mx = Math.random() * 1000; my = 60; }
      else if (edge === 1) { mx = 1000; my = Math.random() * 500 + 60; }
      else if (edge === 2) { mx = Math.random() * 1000; my = 562; }
      else { mx = 0; my = Math.random() * 500 + 60; }

      const angle = Math.atan2(this.plane.y - my, this.plane.x - mx);
      this.missiles.push({
        x: mx,
        y: my,
        angle,
        speed: 175 + Math.random() * 25,
        turnRate: 2.2
      });
    }

    // Spawn stars
    if (Math.random() < 0.02 && this.starsList.length < 5) {
      this.starsList.push({
        x: 60 + Math.random() * 880,
        y: 100 + Math.random() * 400
      });
    }

    // Collect stars
    for (let i = this.starsList.length - 1; i >= 0; i--) {
      const s = this.starsList[i];
      if (Math.hypot(this.plane.x - s.x, this.plane.y - s.y) < 32) {
        this.stars++;
        this.score += 200;
        this.starsList.splice(i, 1);
      }
    }

    // Update missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];

      // Homing angle calculation
      const targetAngle = Math.atan2(this.plane.y - m.y, this.plane.x - m.x);
      let diff = targetAngle - m.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      m.angle += Math.sign(diff) * Math.min(Math.abs(diff), m.turnRate * dt);
      m.x += Math.cos(m.angle) * m.speed * dt;
      m.y += Math.sin(m.angle) * m.speed * dt;

      // Missile smoke
      this.smokeTrails.push({
        x: m.x - Math.cos(m.angle) * 12,
        y: m.y - Math.sin(m.angle) * 12,
        radius: 3.5,
        life: 0.35,
        color: 'rgba(239, 68, 68, 0.5)'
      });

      // Hit plane check
      if (Math.hypot(this.plane.x - m.x, this.plane.y - m.y) < 22) {
        this.gameOver = true;
        this.explode(this.plane.x, this.plane.y);
        break;
      }
    }

    // Missile to missile collision check!
    for (let i = 0; i < this.missiles.length; i++) {
      for (let j = i + 1; j < this.missiles.length; j++) {
        const m1 = this.missiles[i];
        const m2 = this.missiles[j];
        if (Math.hypot(m1.x - m2.x, m1.y - m2.y) < 24) {
          // Missiles collided!
          this.explode((m1.x + m2.x) / 2, (m1.y + m2.y) / 2);
          this.missilesDodged += 2;
          this.score += 450;
          this.missiles.splice(j, 1);
          this.missiles.splice(i, 1);
          break;
        }
      }
    }

    // Smoke trails update
    for (let i = this.smokeTrails.length - 1; i >= 0; i--) {
      const st = this.smokeTrails[i];
      st.life -= dt;
      st.radius += dt * 4;
      if (st.life <= 0) this.smokeTrails.splice(i, 1);
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

  explode(x, y) {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: Math.random() < 0.5 ? '#f59e0b' : '#ef4444',
        life: 0.6
      });
    }
  }

  onRender(ctx) {
    // Aerial Blue Sky with Clouds
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 562);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1000, 562);

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('✈️ MISSILE ESCAPE: STUNT PILOT', 30, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  DODGED: ${this.missilesDodged}  |  ⭐ ${this.stars}`, 970, 38);

    // Render Smoke Trails
    for (const st of this.smokeTrails) {
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Stars
    for (const s of this.starsList) {
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', s.x, s.y + 8);
    }

    // Render Missiles
    for (const m of this.missiles) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);

      // Rocket fuselage
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, -4, 24, 8);
      // Nose cone
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(12, -4); ctx.lineTo(20, 0); ctx.lineTo(12, 4);
      ctx.closePath();
      ctx.fill();
      // Fins
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -7, 6, 14);

      ctx.restore();
    }

    // Render Stunt Plane
    if (!this.gameOver) {
      ctx.save();
      ctx.translate(this.plane.x, this.plane.y);
      ctx.rotate(this.plane.angle);

      // Plane Body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-4, -18, 8, 36);

      // Tail
      ctx.fillRect(-16, -9, 4, 18);

      // Propeller hub
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(18, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Render Explosions
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Controls guide at bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, 520, 1000, 42);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 STEER: Use [A / D] or [Left / Right Arrow] keys to make tight evasion loops!', 500, 545);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PLANE SHOT DOWN!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`FINAL SCORE: ${this.score}  |  MISSILES DESTROYED: ${this.missilesDodged}`, 500, 290);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('FLY AGAIN', 500, 362);
    }
  }
}

