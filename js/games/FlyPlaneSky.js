import { GameEngineBase } from '../core/GameEngineBase.js';

export class FlyPlaneSky extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Fly Plane Fly: Sky Obstacles';
    this.score = 0;
    this.distance = 0;
    this.gameOver = false;
    this.gameStarted = false;

    this.plane = {
      x: 180,
      y: 280,
      vy: 0,
      angle: 0,
      gravity: 520,
      lift: -280,
      radius: 18
    };

    this.obstacles = [];
    this.rings = [];
    this.clouds = [];
    this.particles = [];
    this.smokeTrail = [];

    this.spawnTimer = 0;
    this.ringTimer = 0;
    this.speed = 220;

    this.isThrusting = false;
  }

  onInit() {
    this.createCanvas();

    // Populate initial clouds
    for (let i = 0; i < 12; i++) {
      this.clouds.push({
        x: Math.random() * this.baseWidth,
        y: 40 + Math.random() * 220,
        speed: 20 + Math.random() * 40,
        scale: 0.6 + Math.random() * 0.9,
        alpha: 0.25 + Math.random() * 0.35
      });
    }

    const startThrust = (e) => {
      if (e) e.preventDefault();
      if (this.gameOver) {
        this.restart();
        return;
      }
      this.gameStarted = true;
      this.isThrusting = true;
      this.plane.vy = this.plane.lift;
      this.spawnSmokeBurst();
    };

    const stopThrust = () => {
      this.isThrusting = false;
    };

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        startThrust(e);
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        stopThrust();
      }
    });

    this.addEventListenerTracked(this.canvas, 'mousedown', startThrust);
    this.addEventListenerTracked(this.canvas, 'mouseup', stopThrust);
    this.addEventListenerTracked(this.canvas, 'touchstart', startThrust, { passive: false });
    this.addEventListenerTracked(this.canvas, 'touchend', stopThrust);
  }

  spawnSmokeBurst() {
    for (let i = 0; i < 4; i++) {
      this.smokeTrail.push({
        x: this.plane.x - 22,
        y: this.plane.y + (Math.random() - 0.5) * 8,
        vx: -80 - Math.random() * 40,
        vy: (Math.random() - 0.5) * 40,
        radius: 5 + Math.random() * 5,
        alpha: 0.7,
        life: 0.45
      });
    }
  }

  restart() {
    this.score = 0;
    this.distance = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.plane.y = 280;
    this.plane.vy = 0;
    this.plane.angle = 0;
    this.speed = 220;
    this.obstacles = [];
    this.rings = [];
    this.particles = [];
    this.smokeTrail = [];
    this.spawnTimer = 0;
    this.ringTimer = 0;
  }

  onUpdate(dt) {
    if (!this.gameStarted) {
      this.plane.y = 280 + Math.sin(Date.now() / 250) * 15;
      this.plane.angle = Math.sin(Date.now() / 250) * 0.1;
      return;
    }

    if (this.gameOver) return;

    this.distance += this.speed * dt;
    this.score += Math.floor(dt * 10);
    this.speed = Math.min(360, 220 + this.distance * 0.015);

    // Plane physics
    this.plane.vy += this.plane.gravity * dt;
    if (this.isThrusting) {
      this.plane.vy += this.plane.lift * 2.2 * dt;
    }
    this.plane.vy = Math.max(-340, Math.min(380, this.plane.vy));
    this.plane.y += this.plane.vy * dt;

    // Angle calculation based on vertical velocity
    const targetAngle = Math.atan2(this.plane.vy, this.speed * 0.9);
    this.plane.angle += (targetAngle - this.plane.angle) * 8 * dt;

    // Smoke trail
    if (Math.random() < 0.6) {
      this.smokeTrail.push({
        x: this.plane.x - 22,
        y: this.plane.y,
        vx: -this.speed * 0.5,
        vy: (Math.random() - 0.5) * 20,
        radius: 4 + Math.random() * 4,
        alpha: 0.6,
        life: 0.5
      });
    }

    // Boundary check
    if (this.plane.y < 20 || this.plane.y > this.baseHeight - 20) {
      this.triggerGameOver();
    }

    // Clouds
    for (const c of this.clouds) {
      c.x -= (c.speed + this.speed * 0.15) * dt;
      if (c.x < -150) {
        c.x = this.baseWidth + 50;
        c.y = 30 + Math.random() * 240;
      }
    }

    // Spawn Spire Obstacles
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const gap = Math.max(140, 190 - (this.distance * 0.008));
      const minTopHeight = 60;
      const maxTopHeight = this.baseHeight - gap - 60;
      const topHeight = minTopHeight + Math.random() * (maxTopHeight - minTopHeight);

      this.obstacles.push({
        x: this.baseWidth + 50,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        width: 65,
        passed: false
      });
      this.spawnTimer = Math.max(1.5, 2.8 - (this.distance * 0.0003));
    }

    // Spawn bonus rings
    this.ringTimer -= dt;
    if (this.ringTimer <= 0) {
      this.rings.push({
        x: this.baseWidth + 70,
        y: 120 + Math.random() * (this.baseHeight - 240),
        radius: 26,
        collected: false
      });
      this.ringTimer = 3.5 + Math.random() * 2.5;
    }

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed * dt;

      // Score for passing
      if (!obs.passed && obs.x + obs.width < this.plane.x) {
        obs.passed = true;
        this.score += 50;
      }

      // Collision box test
      if (
        this.plane.x + this.plane.radius > obs.x &&
        this.plane.x - this.plane.radius < obs.x + obs.width
      ) {
        if (this.plane.y - this.plane.radius < obs.topHeight || this.plane.y + this.plane.radius > obs.bottomY) {
          this.triggerGameOver();
        }
      }

      if (obs.x < -100) this.obstacles.splice(i, 1);
    }

    // Update rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.x -= this.speed * dt;

      const dx = this.plane.x - r.x;
      const dy = this.plane.y - r.y;
      const dist = Math.hypot(dx, dy);

      if (!r.collected && dist < this.plane.radius + r.radius) {
        r.collected = true;
        this.score += 150;
        for (let p = 0; p < 12; p++) {
          this.particles.push({
            x: r.x,
            y: r.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            radius: 3 + Math.random() * 3,
            color: '#facc15',
            alpha: 1,
            life: 0.6
          });
        }
      }

      if (r.x < -60 || r.collected) {
        this.rings.splice(i, 1);
      }
    }

    // Update smoke trail
    for (let i = this.smokeTrail.length - 1; i >= 0; i--) {
      const s = this.smokeTrail[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      s.alpha = Math.max(0, s.life / 0.5);
      s.radius += 8 * dt;
      if (s.life <= 0) this.smokeTrail.splice(i, 1);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.6);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  triggerGameOver() {
    this.gameOver = true;
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.plane.x,
        y: this.plane.y,
        vx: (Math.random() - 0.5) * 350,
        vy: (Math.random() - 0.5) * 350,
        radius: 4 + Math.random() * 5,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        alpha: 1,
        life: 0.8
      });
    }
  }

  onRender(ctx) {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    skyGrad.addColorStop(0, '#0c4a6e');
    skyGrad.addColorStop(0.5, '#0284c7');
    skyGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Distant mountain silhouettes
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(0, this.baseHeight);
    for (let x = 0; x <= this.baseWidth; x += 60) {
      const my = this.baseHeight - 120 + Math.sin((x + this.distance * 0.15) * 0.008) * 45;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(this.baseWidth, this.baseHeight);
    ctx.closePath();
    ctx.fill();

    // Render clouds
    for (const c of this.clouds) {
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 25 * c.scale, 0, Math.PI * 2);
      ctx.arc(c.x + 22 * c.scale, c.y - 10 * c.scale, 30 * c.scale, 0, Math.PI * 2);
      ctx.arc(c.x + 50 * c.scale, c.y, 22 * c.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Obstacles (Cliff Spire Pillars)
    for (const obs of this.obstacles) {
      // Top Spire
      const topGrad = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
      topGrad.addColorStop(0, '#334155');
      topGrad.addColorStop(0.5, '#475569');
      topGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = topGrad;

      // Top pillar
      ctx.beginPath();
      ctx.moveTo(obs.x, 0);
      ctx.lineTo(obs.x + obs.width, 0);
      ctx.lineTo(obs.x + obs.width - 8, obs.topHeight);
      ctx.lineTo(obs.x + 8, obs.topHeight);
      ctx.closePath();
      ctx.fill();

      // Top warning edge
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(obs.x + 6, obs.topHeight - 10, obs.width - 12, 10);

      // Bottom pillar
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.moveTo(obs.x + 8, obs.bottomY);
      ctx.lineTo(obs.x + obs.width - 8, obs.bottomY);
      ctx.lineTo(obs.x + obs.width, this.baseHeight);
      ctx.lineTo(obs.x, this.baseHeight);
      ctx.closePath();
      ctx.fill();

      // Bottom warning edge
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(obs.x + 6, obs.bottomY, obs.width - 12, 10);
    }

    // Render aero rings
    for (const r of this.rings) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, 14, r.radius, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.fill();
      ctx.restore();
    }

    // Smoke trail
    for (const s of this.smokeTrail) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Airplane
    if (!this.gameOver) {
      ctx.save();
      ctx.translate(this.plane.x, this.plane.y);
      ctx.rotate(this.plane.angle);

      // Propeller blur
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(22, 0, 14, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      // Plane Body
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Plane Belly / Stripe
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(2, 3, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cockpit windshield
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(6, -4, 6, Math.PI, 0);
      ctx.fill();

      // Main Wing
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.lineTo(2, -18);
      ctx.lineTo(12, -18);
      ctx.lineTo(4, 2);
      ctx.closePath();
      ctx.fill();

      // Tail Fin
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-24, -14);
      ctx.lineTo(-17, -14);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Top HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(16, 16, 220, 50);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, 220, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 32, 48);

    // Overlay for initial start
    if (!this.gameStarted) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FLY PLANE FLY: SKY OBSTACLES', this.baseWidth / 2, this.baseHeight / 2 - 40);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('Press SPACE, UP, or Click/Tap to Fly & Climb', this.baseWidth / 2, this.baseHeight / 2 + 10);
      ctx.fillText('Dodge cliff spires & collect glowing rings for high scores!', this.baseWidth / 2, this.baseHeight / 2 + 40);
    }

    // Game Over Overlay
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH LANDING!', this.baseWidth / 2, this.baseHeight / 2 - 30);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '24px "Segoe UI", sans-serif';
      ctx.fillText(`Final Score: ${this.score}`, this.baseWidth / 2, this.baseHeight / 2 + 15);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('Press SPACE, UP, or Tap to Fly Again', this.baseWidth / 2, this.baseHeight / 2 + 65);
    }
  }
}
