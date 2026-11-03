import { GameEngineBase } from '../core/GameEngineBase.js';

export class StarFighterAce extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Star Fighter: Deep Space Ace';
    this.score = 0;
    this.hull = 100;
    this.torpedoes = 3;
    this.wave = 1;
    this.gameOver = false;

    // Cockpit reticle
    this.crosshair = { x: 500, y: 280 };
    this.stars = [];
    this.enemies = [];
    this.lasers = [];
    this.particles = [];
    this.spawnTimer = 1.0;
  }

  onInit() {
    this.createCanvas();
    this.setupStars();

    this.addEventListenerTracked(this.canvas, 'mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.crosshair.x = (e.clientX - rect.left) * scaleX;
      this.crosshair.y = (e.clientY - rect.top) * scaleY;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
      else this.fireBlasters();
    });

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.fireBlasters();
      } else if (e.code === 'KeyE') {
        this.fireTorpedo();
      }
    });

    this.showStartCard(
      'STAR FIGHTER: DEEP SPACE ACE',
      'Tactical starfighter dogfighting! Aim crosshair with mouse, click or [Space] to fire twin plasma blasters, press [E] for guided photon torpedoes. Defend the outer sector against enemy interceptors!',
      'LAUNCH FIGHTER'
    );
  }

  setupStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 600,
        z: Math.random() * 1000
      });
    }
  }

  restart() {
    this.score = 0;
    this.hull = 100;
    this.torpedoes = 3;
    this.wave = 1;
    this.gameOver = false;
    this.enemies = [];
    this.lasers = [];
    this.particles = [];
    this.spawnTimer = 1.0;
  }

  fireBlasters() {
    if (this.gameOver) return;
    // Left & Right wing cannons
    this.lasers.push({
      x: this.crosshair.x - 45,
      y: 530,
      targetX: this.crosshair.x - 5,
      targetY: this.crosshair.y,
      life: 0.25
    });
    this.lasers.push({
      x: this.crosshair.x + 45,
      y: 530,
      targetX: this.crosshair.x + 5,
      targetY: this.crosshair.y,
      life: 0.25
    });

    // Check hit
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (Math.hypot(this.crosshair.x - e.x, this.crosshair.y - e.y) < e.size) {
        e.hp--;
        if (e.hp <= 0) {
          this.explode(e.x, e.y, '#ef4444');
          this.score += 250;
          this.enemies.splice(i, 1);
        }
        break;
      }
    }
  }

  fireTorpedo() {
    if (this.torpedoes <= 0 || this.gameOver) return;
    this.torpedoes--;
    // Clear all visible enemies in blast
    for (const e of this.enemies) {
      this.explode(e.x, e.y, '#38bdf8');
      this.score += 200;
    }
    this.enemies = [];
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    // Warp stars forward
    const warpSpeed = 400 * dt;
    for (const s of this.stars) {
      s.z -= warpSpeed;
      if (s.z <= 10) {
        s.z = 1000;
        s.x = (Math.random() - 0.5) * 1000;
        s.y = (Math.random() - 0.5) * 600;
      }
    }

    // Spawn enemy starfighters
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.8, 2.5 - this.wave * 0.2);
      this.enemies.push({
        x: 200 + Math.random() * 600,
        y: 120 + Math.random() * 300,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 100,
        size: 32,
        hp: 2,
        fireCooldown: 1.2 + Math.random() * 1.5
      });
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Bounce screen edges
      if (e.x < 120 || e.x > 880) e.vx *= -1;
      if (e.y < 80 || e.y > 440) e.vy *= -1;

      // Enemy fire
      e.fireCooldown -= dt;
      if (e.fireCooldown <= 0) {
        e.fireCooldown = 1.8;
        this.hull -= 10;
        this.explode(500, 520, '#f59e0b');
        if (this.hull <= 0) {
          this.hull = 0;
          this.gameOver = true;
        }
      }
    }

    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].life -= dt;
      if (this.lasers[i].life <= 0) this.lasers.splice(i, 1);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  explode(x, y, color) {
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color,
        life: 0.6
      });
    }
  }

  onRender(ctx) {
    // Deep cockpit space view
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, 1000, 562);

    // Warp Stars
    ctx.fillStyle = '#ffffff';
    for (const s of this.stars) {
      const px = 500 + (s.x / s.z) * 500;
      const py = 280 + (s.y / s.z) * 500;
      const size = Math.max(1, (1 - s.z / 1000) * 3);
      if (px >= 0 && px <= 1000 && py >= 0 && py <= 562) {
        ctx.fillRect(px, py, size, size);
      }
    }

    // Render Enemies
    for (const e of this.enemies) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      // Fighter hexagon
      ctx.moveTo(e.x, e.y - e.size / 2);
      ctx.lineTo(e.x + e.size, e.y);
      ctx.lineTo(e.x + e.size / 2, e.y + e.size / 2);
      ctx.lineTo(e.x - e.size / 2, e.y + e.size / 2);
      ctx.lineTo(e.x - e.size, e.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Wing engines
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(e.x - e.size + 4, e.y - 2, 4, 4);
      ctx.fillRect(e.x + e.size - 8, e.y - 2, 4, 4);
    }

    // Lasers
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    for (const l of this.lasers) {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.targetX, l.targetY);
      ctx.stroke();
    }

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cockpit Canopy Frame
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(150, 180); ctx.lineTo(850, 180); ctx.lineTo(1000, 0);
    ctx.moveTo(150, 180); ctx.lineTo(180, 562);
    ctx.moveTo(850, 180); ctx.lineTo(820, 562);
    ctx.stroke();

    // Crosshair Reticle
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.crosshair.x, this.crosshair.y, 22, 0, Math.PI * 2);
    ctx.moveTo(this.crosshair.x - 30, this.crosshair.y); ctx.lineTo(this.crosshair.x - 8, this.crosshair.y);
    ctx.moveTo(this.crosshair.x + 8, this.crosshair.y); ctx.lineTo(this.crosshair.x + 30, this.crosshair.y);
    ctx.moveTo(this.crosshair.x, this.crosshair.y - 30); ctx.lineTo(this.crosshair.x, this.crosshair.y - 8);
    ctx.moveTo(this.crosshair.x, this.crosshair.y + 8); ctx.lineTo(this.crosshair.x, this.crosshair.y + 30);
    ctx.stroke();

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 58);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🚀 STAR FIGHTER: DEEP SPACE ACE', 30, 38);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  HULL: ${this.hull}%  |  TORPEDOES [E]: ${this.torpedoes}`, 970, 38);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STARFIGHTER DESTROYED!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`FINAL DOGFIGHT SCORE: ${this.score}`, 500, 290);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('RELAUNCH FIGHTER', 500, 362);
    }
  }
}
