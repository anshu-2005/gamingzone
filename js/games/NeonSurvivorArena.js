/* ====================================================
   NEON SURVIVOR ARENA — GAMINGZONE
   Top-Down Bullet-Heaven Swarm Survival Action
   - Auto-Fire Blasters & Orbiting EMP Shields
   - Endless Waves of Geometric Neon Swarms & Bosses
   - XP Crystal Harvesting, Level-Up Upgrades & Perks
   - Responsive Touch Virtual Joystick & WASD Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class NeonSurvivorArenaGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Neon Survivor Arena',
      targetScore: 20000,
      lives: 1,
      ...config
    });

    this.createCanvas(800, 560);

    // Player State
    this.player = {
      x: 400,
      y: 280,
      vx: 0,
      vy: 0,
      speed: 4,
      hp: 100,
      maxHp: 100,
      xp: 0,
      nextXp: 15,
      lvl: 1,
      radius: 16,
      fireCooldown: 0,
      fireRate: 20, // frames
      bulletSpeed: 9,
      bulletDamage: 25,
      shieldActive: true,
      shieldAngle: 0
    };

    this.keys = {};
    this.enemies = [];
    this.bullets = [];
    this.xpOrbs = [];
    this.particles = [];
    this.surviveTimer = 0;
    this.spawnTimer = 0;

    this.initControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) {
          if (dir === 'UP' || dir === 'DOWN') this.player.vy = 0;
          if (dir === 'LEFT' || dir === 'RIGHT') this.player.vx = 0;
          return;
        }
        if (dir === 'UP') this.player.vy = -this.player.speed;
        if (dir === 'DOWN') this.player.vy = this.player.speed;
        if (dir === 'LEFT') this.player.vx = -this.player.speed;
        if (dir === 'RIGHT') this.player.vx = this.player.speed;
      }
    });

    this.showStartCard({
      title: 'NEON SURVIVOR ARENA',
      icon: '⚔️',
      objective: 'Survive the endless neon alien horde! Your ship auto-fires at the nearest foes. Collect blue XP orbs to level up and gain power.',
      controls: 'WASD / Arrow Keys or Virtual D-Pad to navigate.',
      onStart: () => this.start()
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    this.surviveTimer += dt || 0.016;
    this.score = Math.floor(this.surviveTimer * 50 + (this.player.lvl - 1) * 300);

    // Keyboard Movement
    let dx = 0;
    let dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      this.player.x += dx * this.player.speed;
      this.player.y += dy * this.player.speed;
    } else {
      this.player.x += this.player.vx;
      this.player.y += this.player.vy;
    }

    // Keep within arena bounds
    this.player.x = Math.max(20, Math.min(this.baseWidth - 20, this.player.x));
    this.player.y = Math.max(20, Math.min(this.baseHeight - 20, this.player.y));

    // Shield Orbit
    this.player.shieldAngle += 0.06;

    // Auto-Targeting Blaster
    this.player.fireCooldown--;
    if (this.player.fireCooldown <= 0 && this.enemies.length > 0) {
      // Find closest enemy
      let closest = null;
      let minDist = Infinity;
      for (const en of this.enemies) {
        const d = Math.hypot(en.x - this.player.x, en.y - this.player.y);
        if (d < minDist) {
          minDist = d;
          closest = en;
        }
      }

      if (closest && minDist < 450) {
        const angle = Math.atan2(closest.y - this.player.y, closest.x - this.player.x);
        sounds.playLaser();
        this.bullets.push({
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(angle) * this.player.bulletSpeed,
          vy: Math.sin(angle) * this.player.bulletSpeed,
          radius: 5,
          life: 60
        });
        this.player.fireCooldown = this.player.fireRate;
      }
    }

    // Bullets update
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.life <= 0 || b.x < 0 || b.x > this.baseWidth || b.y < 0 || b.y > this.baseHeight) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const en = this.enemies[j];
        if (Math.hypot(en.x - b.x, en.y - b.y) < en.radius + b.radius) {
          en.hp -= this.player.bulletDamage;
          this.bullets.splice(i, 1);

          // Hit spark
          this.createSparks(en.x, en.y, '#00e5ff', 3);

          if (en.hp <= 0) {
            sounds.playExplode();
            this.createSparks(en.x, en.y, en.color, 8);
            this.xpOrbs.push({ x: en.x, y: en.y, val: en.xpVal });
            this.enemies.splice(j, 1);
          }
          break;
        }
      }
    }

    // Enemy Spawning
    this.spawnTimer++;
    const spawnRate = Math.max(25, 70 - Math.floor(this.surviveTimer * 0.8));
    if (this.spawnTimer >= spawnRate) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Enemy Movement & Collision
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      const angle = Math.atan2(this.player.y - en.y, this.player.x - en.x);
      en.x += Math.cos(angle) * en.speed;
      en.y += Math.sin(angle) * en.speed;

      // Contact with player
      if (Math.hypot(en.x - this.player.x, en.y - this.player.y) < en.radius + this.player.radius) {
        this.player.hp -= en.damage;
        sounds.playHit();
        this.createSparks(this.player.x, this.player.y, '#ef4444', 5);

        if (this.player.hp <= 0) {
          this.gameOver(false);
          return;
        }
      }

      // Contact with orbiting shield
      const shieldX = this.player.x + Math.cos(this.player.shieldAngle) * 45;
      const shieldY = this.player.y + Math.sin(this.player.shieldAngle) * 45;
      if (Math.hypot(en.x - shieldX, en.y - shieldY) < en.radius + 10) {
        en.hp -= 2;
        this.createSparks(shieldX, shieldY, '#a855f7', 2);
        if (en.hp <= 0) {
          this.enemies.splice(i, 1);
          this.xpOrbs.push({ x: en.x, y: en.y, val: en.xpVal });
        }
      }
    }

    // XP Orbs vacuum collection
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      const dist = Math.hypot(orb.x - this.player.x, orb.y - this.player.y);
      if (dist < 120) {
        const a = Math.atan2(this.player.y - orb.y, this.player.x - orb.x);
        orb.x += Math.cos(a) * 8;
        orb.y += Math.sin(a) * 8;
      }
      if (dist < this.player.radius + 10) {
        sounds.playScore();
        this.player.xp += orb.val;
        this.xpOrbs.splice(i, 1);

        if (this.player.xp >= this.player.nextXp) {
          this.levelUp();
        }
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  levelUp() {
    this.player.lvl++;
    this.player.xp -= this.player.nextXp;
    this.player.nextXp = Math.floor(this.player.nextXp * 1.45);
    this.player.maxHp += 15;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
    this.player.fireRate = Math.max(8, this.player.fireRate - 2);
    sounds.playLevelUp();
    this.createSparks(this.player.x, this.player.y, '#ffd166', 20);
  }

  spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * this.baseWidth; y = -20; }
    else if (edge === 1) { x = this.baseWidth + 20; y = Math.random() * this.baseHeight; }
    else if (edge === 2) { x = Math.random() * this.baseWidth; y = this.baseHeight + 20; }
    else { x = -20; y = Math.random() * this.baseHeight; }

    const isFast = Math.random() > 0.7;
    this.enemies.push({
      x, y,
      hp: isFast ? 30 : 60,
      maxHp: isFast ? 30 : 60,
      speed: isFast ? 2.6 : 1.6,
      radius: isFast ? 12 : 16,
      damage: isFast ? 0.4 : 0.8,
      xpVal: isFast ? 2 : 4,
      color: isFast ? '#ec4899' : '#e11d48'
    });
  }

  createSparks(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color,
        life: 1,
        radius: Math.random() * 3 + 2
      });
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark grid background
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.baseWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.baseHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.baseHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.baseWidth, y);
      ctx.stroke();
    }

    // Render XP Orbs
    this.xpOrbs.forEach(orb => {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Render Bullets
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    this.bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Render Enemies
    this.enemies.forEach(en => {
      ctx.fillStyle = en.color;
      ctx.shadowColor = en.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
      ctx.fill();

      // Enemy HP bar
      if (en.hp < en.maxHp) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(en.x - 14, en.y - en.radius - 8, 28, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(en.x - 14, en.y - en.radius - 8, 28 * (en.hp / en.maxHp), 4);
      }
    });
    ctx.shadowBlur = 0;

    // Render Orbiting Shield
    const sx = this.player.x + Math.cos(this.player.shieldAngle) * 45;
    const sy = this.player.y + Math.sin(this.player.shieldAngle) * 45;
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Render Player
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Render Sparks
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // HUD Top Bar
    const seconds = Math.floor(this.surviveTimer);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px "Outfit", sans-serif';
    ctx.fillText(`⏱️ ${timeStr}`, 30, 40);

    ctx.fillStyle = '#ffd166';
    ctx.fillText(`LVL ${this.player.lvl}`, 160, 40);

    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`Score: ${this.score.toLocaleString()}`, 270, 40);

    // Player HP Bar
    const hpPct = Math.max(0, this.player.hp / this.player.maxHp);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(30, 55, 200, 10);
    ctx.fillStyle = hpPct > 0.3 ? '#10b981' : '#ef4444';
    ctx.fillRect(30, 55, 200 * hpPct, 10);

    // Player XP Bar (Across top of screen)
    const xpPct = Math.min(1, this.player.xp / this.player.nextXp);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, this.baseWidth * xpPct, 6);
  }
}

