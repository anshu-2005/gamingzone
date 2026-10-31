/* ====================================================
   HELICOPTER GUNSHIP — GAMINGZONE
   Side-Scrolling Combat Chopper with Parallax Canyons,
   Rotor Physics, Rocket Salvos, Anti-Air Turrets & Hostage Rescues
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HelicopterGunshipGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Helicopter Gunship',
      targetScore: 2500,
      lives: 3,
      ...config
    });

    this.heli = {
      x: 120,
      y: 240,
      vy: 0,
      width: 52,
      height: 28,
      speed: 280,
      rotorAngle: 0
    };

    this.missiles = [];
    this.enemies = [];
    this.particles = [];
    this.hostages = [];
    this.rescuedCount = 0;
    this.terrainOffset = 0;
    this.spawnTimer = 0;

    this.keys = { up: false, down: false, fire: false };

    this.createCanvas(740, 520);
    this.initHelicopterControls();
    this.spawnHostage();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'UP') this.keys.up = pressed;
        if (dir === 'DOWN') this.keys.down = pressed;
      },
      actionLabel: 'FIRE',
      onAction: (pressed) => {
        if (pressed) this.fireMissile();
      }
    });

    this.showStartCard({
      title: 'HELICOPTER GUNSHIP',
      icon: '🚁',
      objective: 'Fly through hostile canyon airspace, destroy anti-air flak turrets, and rescue stranded soldiers!',
      controls: 'W/S or Up/Down to climb/descend. Space or Tap to fire rockets.',
      onStart: () => this.start()
    });
  }

  spawnHostage() {
    this.hostages.push({
      x: this.baseWidth + 120,
      y: 450,
      rescued: false
    });
  }

  initHelicopterControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
      if (e.code === 'Space' || e.key === ' ') {
        this.fireMissile();
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
    });

    // Touch & Pointer Drag
    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = this.baseHeight / rect.height;
      const my = (e.clientY - rect.top) * scaleY;
      this.heli.y = Math.max(70, Math.min(440, my - this.heli.height / 2));
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      this.fireMissile();
    });
  }

  fireMissile() {
    sounds.playLaser();
    this.missiles.push({
      x: this.heli.x + 40,
      y: this.heli.y + 12,
      vx: 650,
      vy: 0
    });
  }

  spawnEnemy() {
    const isGround = Math.random() < 0.55;
    this.enemies.push({
      x: this.baseWidth + 40,
      y: isGround ? 450 : 120 + Math.random() * 200,
      vx: isGround ? -90 : -220,
      type: isGround ? 'turret' : 'chopper',
      width: isGround ? 32 : 44,
      height: isGround ? 24 : 26,
      hp: isGround ? 2 : 1
    });
  }

  update(dt) {
    this.heli.rotorAngle += 28 * dt;

    // Movement
    if (this.keys.up) this.heli.y = Math.max(70, this.heli.y - this.heli.speed * dt);
    if (this.keys.down) this.heli.y = Math.min(440, this.heli.y + this.heli.speed * dt);

    // Canyon terrain scroll
    this.terrainOffset += 120 * dt;

    // Spawning Enemies
    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.4) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Hostage logic
    this.hostages.forEach(h => {
      h.x -= 120 * dt;
      // Rescue check (heli close to hostage)
      if (!h.rescued && Math.hypot(this.heli.x - h.x, this.heli.y - h.y) <= 60) {
        h.rescued = true;
        this.rescuedCount++;
        this.score += 400;
        sounds.playLevelUp();
        this.spawnExplosion(h.x, h.y, '#ffd166', 15);
      }
    });

    // Clean offscreen hostages
    for (let i = this.hostages.length - 1; i >= 0; i--) {
      if (this.hostages[i].x < -40 || this.hostages[i].rescued) {
        this.hostages.splice(i, 1);
        this.setTimeout(() => this.spawnHostage(), 8000);
      }
    }

    // Update Missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.x += m.vx * dt;

      // Smoke trail
      this.particles.push({
        x: m.x - 8,
        y: m.y,
        vx: -60,
        vy: (Math.random() - 0.5) * 20,
        color: '#94a3b8',
        life: 0.2
      });

      if (m.x > this.baseWidth + 20) {
        this.missiles.splice(i, 1);
        continue;
      }

      // Check Hits on Enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (
          m.x >= e.x && m.x <= e.x + e.width &&
          m.y >= e.y && m.y <= e.y + e.height
        ) {
          e.hp--;
          this.missiles.splice(i, 1);
          sounds.playHit();
          this.spawnExplosion(m.x, m.y, '#f59e0b', 8);

          if (e.hp <= 0) {
            this.score += e.type === 'turret' ? 120 : 180;
            sounds.playWin();
            this.spawnExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ef4444', 18);
            this.enemies.splice(j, 1);
          }
          break;
        }
      }
    }

    // Update Enemies & Heli Collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx * dt;

      // Collision with heli
      if (
        this.heli.x < e.x + e.width &&
        this.heli.x + this.heli.width > e.x &&
        this.heli.y < e.y + e.height &&
        this.heli.y + this.heli.height > e.y
      ) {
        this.lives--;
        sounds.playHit();
        this.spawnExplosion(this.heli.x, this.heli.y, '#ef4444', 20);
        this.enemies.splice(i, 1);

        if (this.lives <= 0) {
          this.finishGame(this.score, { isVictory: false });
          return;
        }
        continue;
      }

      if (e.x < -60) this.enemies.splice(i, 1);
    }

    // Check Victory
    if (this.score >= this.config.targetScore) {
      sounds.playWin();
      this.finishGame(this.score, { isVictory: true, rescued: this.rescuedCount });
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

    // Desert Sunset Sky
    const sky = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    sky.addColorStop(0, '#f97316');
    sky.addColorStop(0.6, '#ea580c');
    sky.addColorStop(1, '#78350f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Distant Canyon Mountain Silhouette
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(0, this.baseHeight);
    for (let x = 0; x <= this.baseWidth; x += 60) {
      const h = Math.sin((x + this.terrainOffset * 0.3) * 0.01) * 60 + 120;
      ctx.lineTo(x, this.baseHeight - h);
    }
    ctx.lineTo(this.baseWidth, this.baseHeight);
    ctx.closePath();
    ctx.fill();

    // Canyon Ground Floor
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 480, this.baseWidth, 40);

    // Draw Hostages
    this.hostages.forEach(h => {
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏃', h.x, h.y + 20);
      ctx.font = '900 10px "Outfit", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.fillText('RESCUE!', h.x, h.y - 2);
    });

    // Draw Missiles
    this.missiles.forEach(m => {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(m.x - 6, m.y - 2, 12, 4);
    });

    // Draw Enemies
    this.enemies.forEach(e => {
      if (e.type === 'turret') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(e.x, e.y + 6, e.width, e.height - 6);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(e.x + e.width / 2, e.y + 6);
        ctx.lineTo(e.x - 8, e.y - 8);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(e.x, e.y, e.width, e.height, 8);
        ctx.fill();
      }
    });

    // Draw Player Helicopter
    const hx = this.heli.x;
    const hy = this.heli.y;

    // Body Fuselage
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(hx, hy, this.heli.width, this.heli.height, 10);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit Window
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.roundRect(hx + 30, hy + 4, 16, 16, 4);
    ctx.fill();

    // Tail Boom & Rotor
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(hx - 24, hy + 8, 26, 6);
    ctx.fillRect(hx - 26, hy - 4, 4, 18);

    // Main Rotor Blades (animated)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const bladeSpan = Math.cos(this.heli.rotorAngle) * 36;
    ctx.moveTo(hx + 24 - bladeSpan, hy - 6);
    ctx.lineTo(hx + 24 + bladeSpan, hy - 6);
    ctx.stroke();

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
    ctx.fillText(`🚁 HOSTAGES: ${this.rescuedCount}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`LIVES: ${'❤️'.repeat(Math.max(0, this.lives))}`, this.baseWidth - 24, 34);
  }
}
