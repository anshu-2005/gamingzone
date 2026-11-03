import { GameEngineBase } from '../core/GameEngineBase.js';

export class LegendWings extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Legend Wings: Sky Striker';
    this.score = 0;
    this.bombs = 2;
    this.hull = 100;
    this.fireLevel = 1;
    this.gameOver = false;

    this.player = {
      x: 500,
      y: 460,
      speed: 320,
      w: 36,
      h: 36
    };

    this.keys = { left: false, right: false, up: false, down: false };
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.spawnTimer = 0.8;
    this.fireTimer = 0;
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
      if (e.code === 'Space') this.triggerBomb();
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
    });

    this.addEventListenerTracked(this.canvas, 'mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.player.x = (e.clientX - rect.left) * scaleX;
      this.player.y = (e.clientY - rect.top) * scaleY;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
      else this.triggerBomb();
    });

    this.showStartCard(
      'LEGEND WINGS: SKY STRIKER',
      'Vertical arcade bullet-hell shooter! Move your winged striker with Mouse or [WASD / Arrows]. Auto-fires plasma streams! Press [Space] or Click to release mega bombs that clear the screen!',
      'LAUNCH STRIKER'
    );
  }

  restart() {
    this.score = 0;
    this.bombs = 2;
    this.hull = 100;
    this.fireLevel = 1;
    this.gameOver = false;
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.spawnTimer = 0.8;
  }

  triggerBomb() {
    if (this.bombs <= 0 || this.gameOver) return;
    this.bombs--;
    for (const e of this.enemies) {
      this.explode(e.x, e.y, '#f59e0b');
      this.score += 250;
    }
    this.enemies = [];
    this.enemyBullets = [];
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    // Player bounds
    this.player.x = Math.max(160, Math.min(840, this.player.x));
    this.player.y = Math.max(100, Math.min(520, this.player.y));

    // Auto-fire player lasers
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = 0.12;
      this.bullets.push({ x: this.player.x - 12, y: this.player.y - 15, vy: -550 });
      this.bullets.push({ x: this.player.x + 12, y: this.player.y - 15, vy: -550 });
      if (this.fireLevel >= 2) {
        this.bullets.push({ x: this.player.x - 22, y: this.player.y - 10, vy: -520, vx: -80 });
        this.bullets.push({ x: this.player.x + 22, y: this.player.y - 10, vy: -520, vx: 80 });
      }
    }

    // Spawn enemies
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.65;
      this.enemies.push({
        x: 200 + Math.random() * 600,
        y: 60,
        vx: (Math.random() - 0.5) * 120,
        vy: 110 + Math.random() * 60,
        radius: 16,
        hp: 3,
        fireCooldown: 0.8 + Math.random() * 0.8
      });
    }

    // Update player bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * dt;
      if (b.vx) b.x += b.vx * dt;

      // Enemy hit check
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 6) {
          e.hp--;
          this.bullets.splice(i, 1);
          if (e.hp <= 0) {
            this.explode(e.x, e.y, '#f59e0b');
            this.score += 200;
            if (Math.random() < 0.2) {
              this.powerups.push({ x: e.x, y: e.y, vy: 80 });
            }
            this.enemies.splice(j, 1);
          }
          break;
        }
      }

      if (b.y < 50) this.bullets.splice(i, 1);
    }

    // Update enemies & enemy bullets
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < 180 || e.x > 820) e.vx *= -1;

      e.fireCooldown -= dt;
      if (e.fireCooldown <= 0) {
        e.fireCooldown = 1.4;
        this.enemyBullets.push({ x: e.x, y: e.y + 12, vy: 220 });
      }

      if (e.y > 540) this.enemies.splice(i, 1);
    }

    // Update enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.y += eb.vy * dt;

      // Hit player
      if (Math.hypot(eb.x - this.player.x, eb.y - this.player.y) < 18) {
        this.hull -= 20;
        this.enemyBullets.splice(i, 1);
        if (this.hull <= 0) {
          this.hull = 0;
          this.gameOver = true;
          this.explode(this.player.x, this.player.y, '#38bdf8');
          break;
        }
        continue;
      }

      if (eb.y > 540) this.enemyBullets.splice(i, 1);
    }

    // Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += pu.vy * dt;
      if (Math.hypot(pu.x - this.player.x, pu.y - this.player.y) < 26) {
        this.fireLevel = 2;
        this.score += 300;
        this.powerups.splice(i, 1);
        continue;
      }
      if (pu.y > 540) this.powerups.splice(i, 1);
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
    // Vertical Scrolling Sky/Clouds
    const sky = ctx.createLinearGradient(0, 0, 0, 562);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(1, '#1e293b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1000, 562);

    // Play corridor borders
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(150, 0, 700, 562);

    // Player Bullets
    ctx.fillStyle = '#38bdf8';
    for (const b of this.bullets) {
      ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
    }

    // Enemy Bullets
    ctx.fillStyle = '#ef4444';
    for (const eb of this.enemyBullets) {
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemies
    for (const e of this.enemies) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + e.radius);
      ctx.lineTo(e.x - e.radius, e.y - e.radius);
      ctx.lineTo(e.x + e.radius, e.y - e.radius);
      ctx.closePath();
      ctx.fill();
    }

    // Powerups
    ctx.fillStyle = '#10b981';
    for (const pu of this.powerups) {
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P', pu.x, pu.y + 4);
    }

    // Player Winged Fighter
    if (!this.gameOver) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      // Golden Angelic Wings
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-32, 12);
      ctx.lineTo(-12, 10);
      ctx.lineTo(0, 20);
      ctx.lineTo(12, 10);
      ctx.lineTo(32, 12);
      ctx.closePath();
      ctx.fill();

      // Fuselage
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🪽 LEGEND WINGS: SKY STRIKER', 30, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  HULL: ${this.hull}%  |  BOMBS [Space]: ${this.bombs}`, 970, 38);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WING SHOT DOWN!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`FINAL SCORE: ${this.score}`, 500, 290);

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('SORTIE AGAIN', 500, 362);
    }
  }
}
