/* ====================================================
   TANK ARENA WARS — GAMINGZONE
   Tactical Top-Down Tank Combat with Ricochet Shells,
   Destructible Obstacles, Smart Enemy AI & Dual Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class TankArenaWarsGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Tank Arena Wars',
      targetScore: 2500,
      lives: 3,
      ...config
    });

    this.player = {
      x: 100,
      y: 260,
      angle: 0,
      turretAngle: 0,
      speed: 180,
      radius: 20
    };

    this.kills = 0;
    this.targetKills = 6;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];

    // Arena Obstacles
    this.obstacles = [
      { x: 240, y: 120, w: 45, h: 110, destructible: false },
      { x: 240, y: 310, w: 45, h: 110, destructible: false },
      { x: 440, y: 120, w: 45, h: 110, destructible: false },
      { x: 440, y: 310, w: 45, h: 110, destructible: false },
      { x: 340, y: 235, w: 50, h: 65, destructible: true, hp: 3 }
    ];

    this.keys = { up: false, down: false, left: false, right: false };

    this.createCanvas(720, 520);
    this.spawnEnemyWave(2);
    this.initTankControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
        if (dir === 'UP') this.keys.up = pressed;
        if (dir === 'DOWN') this.keys.down = pressed;
      },
      actionLabel: 'FIRE',
      onAction: (pressed) => {
        if (pressed) this.fireShell(this.player, true);
      }
    });

    this.showStartCard({
      title: 'TANK ARENA WARS',
      icon: '🛡️',
      objective: `Eliminate ${this.targetKills} enemy combat tanks! Use walls to ricochet shells around corners.`,
      controls: 'WASD / Arrows to drive and rotate. Space or Click to fire cannon.',
      onStart: () => this.start()
    });
  }

  spawnEnemyWave(count) {
    for (let i = 0; i < count; i++) {
      this.enemies.push({
        x: this.baseWidth - 120,
        y: 120 + i * 260,
        angle: Math.PI,
        speed: 110,
        radius: 20,
        hp: 2,
        fireCooldown: 1.5 + Math.random() * 1.5
      });
    }
  }

  initTankControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.code === 'Space' || e.key === ' ') {
        this.fireShell(this.player, true);
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
    });

    // Mouse Aim Turret & Fire
    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this.player.turretAngle = Math.atan2(my - this.player.y, mx - this.player.x);
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      this.fireShell(this.player, true);
    });
  }

  fireShell(tank, isPlayer = true) {
    const angle = isPlayer ? (tank.turretAngle || tank.angle) : tank.angle;
    const speed = 480;

    sounds.playLaser();
    this.bullets.push({
      x: tank.x + Math.cos(angle) * (tank.radius + 12),
      y: tank.y + Math.sin(angle) * (tank.radius + 12),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      bouncesLeft: 1, // Max 1 bounce before expiration
      life: 2.2,
      isPlayer
    });
  }

  update(dt) {
    // Player Rotation & Movement
    if (this.keys.left) this.player.angle -= 3.2 * dt;
    if (this.keys.right) this.player.angle += 3.2 * dt;

    let moveSpeed = 0;
    if (this.keys.up) moveSpeed = this.player.speed;
    if (this.keys.down) moveSpeed = -this.player.speed * 0.6;

    if (moveSpeed !== 0) {
      const nextX = this.player.x + Math.cos(this.player.angle) * moveSpeed * dt;
      const nextY = this.player.y + Math.sin(this.player.angle) * moveSpeed * dt;

      // Check obstacle collision
      if (!this.checkObstacleCollision(nextX, nextY, this.player.radius)) {
        this.player.x = Math.max(30, Math.min(this.baseWidth - 30, nextX));
        this.player.y = Math.max(70, Math.min(this.baseHeight - 30, nextY));
      }
    }

    // AI Tanks Logic
    this.enemies.forEach(en => {
      const angleToPlayer = Math.atan2(this.player.y - en.y, this.player.x - en.x);
      en.angle += (angleToPlayer - en.angle) * 0.05;

      // Slowly advance toward player
      const nextX = en.x + Math.cos(en.angle) * en.speed * dt;
      const nextY = en.y + Math.sin(en.angle) * en.speed * dt;
      if (!this.checkObstacleCollision(nextX, nextY, en.radius)) {
        en.x = nextX;
        en.y = nextY;
      }

      en.fireCooldown -= dt;
      if (en.fireCooldown <= 0) {
        en.fireCooldown = 2.0 + Math.random() * 1.5;
        this.fireShell(en, false);
      }
    });

    // Update Shells & Ricochet
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Outer Arena Boundaries Bounce
      if (b.x <= 20 || b.x >= this.baseWidth - 20) {
        if (b.bouncesLeft > 0) {
          b.bouncesLeft--;
          b.vx = -b.vx;
          sounds.playClick();
        } else {
          this.bullets.splice(i, 1);
          continue;
        }
      }

      if (b.y <= 60 || b.y >= this.baseHeight - 20) {
        if (b.bouncesLeft > 0) {
          b.bouncesLeft--;
          b.vy = -b.vy;
          sounds.playClick();
        } else {
          this.bullets.splice(i, 1);
          continue;
        }
      }

      // Check Hits on Player
      if (!b.isPlayer && Math.hypot(b.x - this.player.x, b.y - this.player.y) <= this.player.radius) {
        this.lives--;
        sounds.playHit();
        this.spawnExplosion(this.player.x, this.player.y, '#ef4444', 16);
        this.bullets.splice(i, 1);

        if (this.lives <= 0) {
          this.finishGame(this.score, { isVictory: false });
          return;
        }
        continue;
      }

      // Check Hits on Enemies
      if (b.isPlayer) {
        let hitEnemy = false;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const en = this.enemies[j];
          if (Math.hypot(b.x - en.x, b.y - en.y) <= en.radius) {
            en.hp--;
            this.spawnExplosion(b.x, b.y, '#ffd166', 8);
            this.bullets.splice(i, 1);
            hitEnemy = true;

            if (en.hp <= 0) {
              this.kills++;
              this.score += 250;
              sounds.playWin();
              this.spawnExplosion(en.x, en.y, '#f59e0b', 20);
              this.enemies.splice(j, 1);

              if (this.kills >= this.targetKills) {
                this.finishGame(this.score, { isVictory: true });
                return;
              } else if (this.enemies.length === 0) {
                this.spawnEnemyWave(2);
              }
            }
            break;
          }
        }
        if (hitEnemy) continue;
      }
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

  checkObstacleCollision(x, y, radius) {
    return this.obstacles.some(o =>
      x + radius > o.x && x - radius < o.x + o.w &&
      y + radius > o.y && y - radius < o.y + o.h
    );
  }

  spawnExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Concrete Arena Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Outer Arena Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 58, this.baseWidth - 36, this.baseHeight - 76);

    // Draw Obstacles
    this.obstacles.forEach(o => {
      ctx.fillStyle = o.destructible ? '#78716c' : '#1e293b';
      ctx.fillRect(o.x, o.y, o.w, o.h);

      ctx.strokeStyle = o.destructible ? '#a8a29e' : '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

    // Draw Shells
    this.bullets.forEach(b => {
      ctx.fillStyle = b.isPlayer ? '#00e5ff' : '#ef4444';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Enemies (Red Combat Tanks)
    this.enemies.forEach(en => {
      this.drawTank(ctx, en.x, en.y, en.angle, en.angle, '#ef4444', '#991b1b');
    });

    // Draw Player Tank (Cyan Combat Tank)
    this.drawTank(ctx, this.player.x, this.player.y, this.player.angle, this.player.turretAngle || this.player.angle, '#00e5ff', '#0284c7');

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🛡️ KILLS: ${this.kills}/${this.targetKills}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`ARMOR: ${'❤️'.repeat(Math.max(0, this.lives))}`, this.baseWidth - 24, 34);
  }

  drawTank(ctx, x, y, bodyAngle, turretAngle, mainCol, darkCol) {
    ctx.save();
    ctx.translate(x, y);

    // Tracks & Chassis
    ctx.rotate(bodyAngle);
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(-22, -18, 44, 8); // Top track
    ctx.fillRect(-22, 10, 44, 8);  // Bottom track

    ctx.fillStyle = darkCol;
    ctx.beginPath();
    ctx.roundRect(-16, -12, 32, 24, 4);
    ctx.fill();

    // Turret Cannon Barrel
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turretAngle);

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, -3, 24, 6);

    // Turret Dome
    ctx.fillStyle = mainCol;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}
