/* ====================================================
   NEON AIR STRIKE 1945 — GAMINGZONE
   WWII Arcade Air Combat with Parallax Islands, Enemy Formations,
   Powerup Drops, Boss Zeppelins & Responsive Touch/Keyboard
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class NeonAirStrike1945Game extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Neon Air Strike 1945',
      targetScore: 2500,
      lives: 3,
      ...config
    });

    this.player = {
      x: 0,
      y: 0,
      width: 46,
      height: 42,
      speed: 340,
      powerLevel: 1
    };

    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.particles = [];
    this.clouds = [];
    this.islands = [];

    this.shootTimer = 0;
    this.spawnTimer = 0;
    this.wave = 1;

    this.keys = { left: false, right: false, up: false, down: false };

    this.createCanvas(540, 680);
    this.initWorld();
    this.initAirControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
        if (dir === 'UP') this.keys.up = pressed;
        if (dir === 'DOWN') this.keys.down = pressed;
      }
    });

    this.showStartCard({
      title: 'NEON AIR STRIKE 1945',
      icon: '🛩️',
      objective: 'Scramble your WWII fighter into combat! Down enemy fighter squadrons and dreadnought bombers over the Pacific.',
      controls: 'Drag your plane with finger/mouse, or use Arrow Keys / WASD.',
      onStart: () => this.start()
    });
  }

  initWorld() {
    this.player.x = (this.baseWidth - this.player.width) / 2;
    this.player.y = this.baseHeight - 110;
    this.player.powerLevel = 1;
    this.lives = 3;

    // Tropical Islands
    this.islands = [
      { x: 120, y: 100, radius: 45, speed: 45 },
      { x: 380, y: 380, radius: 60, speed: 45 },
      { x: 220, y: 550, radius: 35, speed: 45 }
    ];

    // Clouds
    this.clouds = [
      { x: 60, y: 50, radius: 35, speed: 90 },
      { x: 320, y: 220, radius: 45, speed: 110 },
      { x: 440, y: 500, radius: 40, speed: 85 }
    ];
  }

  initAirControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
    });

    // Touch & Pointer Drag
    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this.player.x = Math.max(10, Math.min(this.baseWidth - this.player.width - 10, mx - this.player.width / 2));
      this.player.y = Math.max(60, Math.min(this.baseHeight - this.player.height - 20, my - this.player.height / 2));
    });
  }

  fireBullets() {
    const cx = this.player.x + this.player.width / 2;
    const cy = this.player.y;

    if (this.player.powerLevel === 1) {
      this.bullets.push({ x: cx - 10, y: cy, vy: -780, vx: 0 });
      this.bullets.push({ x: cx + 10, y: cy, vy: -780, vx: 0 });
    } else {
      this.bullets.push({ x: cx - 12, y: cy, vy: -780, vx: -80 });
      this.bullets.push({ x: cx, y: cy, vy: -780, vx: 0 });
      this.bullets.push({ x: cx + 12, y: cy, vy: -780, vx: 80 });
    }
    sounds.playPowerup();
  }

  spawnEnemies() {
    const isHeavy = Math.random() < 0.25;
    this.enemies.push({
      x: 40 + Math.random() * (this.baseWidth - 120),
      y: -50,
      width: isHeavy ? 54 : 36,
      height: isHeavy ? 54 : 36,
      vy: isHeavy ? 100 : 170 + Math.random() * 50,
      hp: isHeavy ? 70 : 25,
      maxHp: isHeavy ? 70 : 25,
      isHeavy,
      shootTimer: 0
    });
  }

  update(dt) {
    // Parallax background islands and clouds
    this.islands.forEach(isl => {
      isl.y += isl.speed * dt;
      if (isl.y > this.baseHeight + isl.radius) {
        isl.y = -isl.radius;
        isl.x = Math.random() * this.baseWidth;
      }
    });

    this.clouds.forEach(cl => {
      cl.y += cl.speed * dt;
      if (cl.y > this.baseHeight + cl.radius) {
        cl.y = -cl.radius;
        cl.x = Math.random() * this.baseWidth;
      }
    });

    // Player keyboard movement
    let moveX = 0;
    let moveY = 0;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;
    if (this.keys.up) moveY -= 1;
    if (this.keys.down) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      this.player.x += moveX * this.player.speed * dt;
      this.player.y += moveY * this.player.speed * dt;
      this.player.x = Math.max(10, Math.min(this.baseWidth - this.player.width - 10, this.player.x));
      this.player.y = Math.max(60, Math.min(this.baseHeight - this.player.height - 20, this.player.y));
    }

    // Auto Machine Gun Fire
    this.shootTimer += dt;
    if (this.shootTimer >= 0.16) {
      this.shootTimer = 0;
      this.fireBullets();
    }

    // Spawn Enemy Waves
    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.0) {
      this.spawnTimer = 0;
      this.spawnEnemies();
    }

    // Update Player Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -20) this.bullets.splice(i, 1);
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.vy * dt;

      // Heavy enemies fire back
      if (e.isHeavy) {
        e.shootTimer += dt;
        if (e.shootTimer >= 1.4) {
          e.shootTimer = 0;
          this.enemyBullets.push({
            x: e.x + e.width / 2,
            y: e.y + e.height,
            vx: 0,
            vy: 240
          });
        }
      }

      // Check bullet hits on enemy
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (
          b.x >= e.x && b.x <= e.x + e.width &&
          b.y >= e.y && b.y <= e.y + e.height
        ) {
          e.hp -= 20;
          this.bullets.splice(j, 1);

          if (e.hp <= 0) {
            this.score += e.isHeavy ? 200 : 70;
            sounds.playWin();
            this.spawnExplosion(e.x + e.width / 2, e.y + e.height / 2, '#f59e0b', 16);

            if (Math.random() < 0.25) {
              this.player.powerLevel = Math.min(2, this.player.powerLevel + 1);
            }

            this.enemies.splice(i, 1);
            break;
          }
        }
      }

      // Enemy hit player
      if (
        this.player.x < e.x + e.width &&
        this.player.x + this.player.width > e.x &&
        this.player.y < e.y + e.height &&
        this.player.y + this.player.height > e.y
      ) {
        this.lives--;
        sounds.playHit();
        this.spawnExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ef4444', 18);
        this.enemies.splice(i, 1);

        if (this.lives <= 0) {
          this.finishGame(this.score, { isVictory: false });
          return;
        }
      }

      if (e.y > this.baseHeight + 40) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;

      // Hit player
      if (
        eb.x >= this.player.x && eb.x <= this.player.x + this.player.width &&
        eb.y >= this.player.y && eb.y <= this.player.y + this.player.height
      ) {
        this.lives--;
        sounds.playHit();
        this.enemyBullets.splice(i, 1);

        if (this.lives <= 0) {
          this.finishGame(this.score, { isVictory: false });
          return;
        }
        continue;
      }

      if (eb.y > this.baseHeight + 20) this.enemyBullets.splice(i, 1);
    }

    // Check Victory Target
    if (this.score >= this.config.targetScore) {
      sounds.playWin();
      this.finishGame(this.score, { isVictory: true });
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnExplosion(x, y, color, count = 12) {
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

    // Pacific Ocean Blue Background
    const ocean = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    ocean.addColorStop(0, '#0284c7');
    ocean.addColorStop(1, '#0369a1');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Draw Islands
    this.islands.forEach(isl => {
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(isl.x, isl.y, isl.radius, 0, Math.PI * 2);
      ctx.fill();

      // Sandy beach rim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // Draw Clouds (Translucent White)
    this.clouds.forEach(cl => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, cl.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Bullets (Golden tracers)
    ctx.fillStyle = '#ffd166';
    this.bullets.forEach(b => {
      ctx.fillRect(b.x - 2, b.y, 4, 14);
    });

    // Draw Enemy Bullets (Red tracers)
    ctx.fillStyle = '#ef4444';
    this.enemyBullets.forEach(eb => {
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Enemies (Dark Fighter Planes)
    this.enemies.forEach(e => {
      ctx.fillStyle = e.isHeavy ? '#450a0a' : '#1e293b';
      ctx.beginPath();
      ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Wing crossbar
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + e.height / 2);
      ctx.lineTo(e.x + e.width, e.y + e.height / 2);
      ctx.stroke();
    });

    // Draw Player Fighter Plane
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    // Wings
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(px, py + ph * 0.6);
    ctx.lineTo(px + pw, py + ph * 0.6);
    ctx.lineTo(px + pw * 0.6, py + ph * 0.4);
    ctx.lineTo(px + pw * 0.4, py + ph * 0.4);
    ctx.closePath();
    ctx.fill();

    // Fuselage
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(px + pw / 2, py + ph / 2, 8, ph / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Propeller blur
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(px + pw / 2, py, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    ctx.fillText(`🛩️ PACIFIC: ${this.score}`, 24, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`LIVES: ${'❤️'.repeat(Math.max(0, this.lives))}`, this.baseWidth - 24, 34);
  }
}
