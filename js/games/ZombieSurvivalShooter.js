/* ====================================================
   ZOMBIE SURVIVAL SHOOTER — GAMINGZONE
   Top-Down Post-Apocalyptic Arena Shooter with Weapon Switching,
   Horde Escalation, Powerup Crates & Full Touch/Keyboard Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ZombieSurvivalShooterGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Zombie Survival Shooter',
      targetScore: 2500,
      lives: 100, // HP
      ...config
    });

    this.player = {
      x: 0,
      y: 0,
      angle: 0,
      speed: 210,
      radius: 18,
      hp: 100,
      weapon: 'pistol', // pistol, shotgun, rifle
      shotgunAmmo: 18,
      rifleAmmo: 60
    };

    this.bullets = [];
    this.zombies = [];
    this.crates = [];
    this.particles = [];
    this.wave = 1;
    this.spawnTimer = 0;
    this.lastShot = 0;

    this.keys = { up: false, down: false, left: false, right: false, fire: false };

    this.createCanvas(720, 520);
    this.resetPlayer();
    this.spawnZombieWave(6);
    this.initZombieControls();

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
        this.keys.fire = pressed;
        if (pressed) this.shoot();
      }
    });

    this.showStartCard({
      title: 'ZOMBIE SURVIVAL SHOOTER',
      icon: '🧟',
      objective: 'Survive the undead apocalypse! Eliminate zombie hordes, collect weapon crates, and keep your distance.',
      controls: 'WASD / Arrows to walk, Aim with mouse / touch and tap to shoot. Press 1, 2, 3 to switch guns.',
      onStart: () => this.start()
    });
  }

  resetPlayer() {
    this.player.x = this.baseWidth / 2;
    this.player.y = this.baseHeight / 2;
    this.player.hp = 100;
  }

  spawnZombieWave(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 420;
      const isRunner = Math.random() < 0.3;

      this.zombies.push({
        x: this.player.x + Math.cos(angle) * dist,
        y: this.player.y + Math.sin(angle) * dist,
        speed: isRunner ? 120 : 65 + Math.random() * 25,
        hp: isRunner ? 25 : 50,
        maxHp: isRunner ? 25 : 50,
        radius: isRunner ? 14 : 18,
        color: isRunner ? '#ef4444' : '#15803d'
      });
    }
  }

  initZombieControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.key === '1') this.player.weapon = 'pistol';
      if (e.key === '2' && this.player.shotgunAmmo > 0) this.player.weapon = 'shotgun';
      if (e.key === '3' && this.player.rifleAmmo > 0) this.player.weapon = 'rifle';
      if (e.code === 'Space' || e.key === ' ') {
        this.shoot();
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
    });

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this.player.angle = Math.atan2(my - this.player.y, mx - this.player.x);
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      this.shoot();
    });
  }

  shoot() {
    const now = performance.now();
    const fireInterval = this.player.weapon === 'rifle' ? 120 : (this.player.weapon === 'shotgun' ? 450 : 250);
    if (now - this.lastShot < fireInterval) return;
    this.lastShot = now;

    const angle = this.player.angle;
    const bulletSpeed = 580;

    if (this.player.weapon === 'shotgun' && this.player.shotgunAmmo > 0) {
      this.player.shotgunAmmo--;
      // 3-pellet spread
      for (let s = -1; s <= 1; s++) {
        const spreadAngle = angle + s * 0.14;
        this.bullets.push({
          x: this.player.x + Math.cos(angle) * 20,
          y: this.player.y + Math.sin(angle) * 20,
          vx: Math.cos(spreadAngle) * bulletSpeed,
          vy: Math.sin(spreadAngle) * bulletSpeed,
          damage: 35,
          life: 0.5
        });
      }
      sounds.playPowerup();
      if (this.player.shotgunAmmo <= 0) this.player.weapon = 'pistol';

    } else if (this.player.weapon === 'rifle' && this.player.rifleAmmo > 0) {
      this.player.rifleAmmo--;
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 20,
        y: this.player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * (bulletSpeed + 120),
        vy: Math.sin(angle) * (bulletSpeed + 120),
        damage: 28,
        life: 0.9
      });
      sounds.playLaser();
      if (this.player.rifleAmmo <= 0) this.player.weapon = 'pistol';

    } else {
      // Pistol
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 20,
        y: this.player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * bulletSpeed,
        vy: Math.sin(angle) * bulletSpeed,
        damage: 20,
        life: 0.9
      });
      sounds.playPowerup();
    }
  }

  update(dt) {
    // Player Walking
    let moveX = 0;
    let moveY = 0;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;
    if (this.keys.up) moveY -= 1;
    if (this.keys.down) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      this.player.x += (moveX / len) * this.player.speed * dt;
      this.player.y += (moveY / len) * this.player.speed * dt;

      this.player.x = Math.max(25, Math.min(this.baseWidth - 25, this.player.x));
      this.player.y = Math.max(70, Math.min(this.baseHeight - 25, this.player.y));
    }

    // Auto-spawn waves
    this.spawnTimer += dt;
    if (this.spawnTimer >= 4.5) {
      this.spawnTimer = 0;
      this.wave++;
      this.spawnZombieWave(4 + this.wave);
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || b.x < 0 || b.x > this.baseWidth || b.y < 50 || b.y > this.baseHeight) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit Zombie
      for (let j = this.zombies.length - 1; j >= 0; j--) {
        const z = this.zombies[j];
        if (Math.hypot(b.x - z.x, b.y - z.y) <= z.radius) {
          z.hp -= b.damage;
          this.spawnSplatter(b.x, b.y, '#dc2626', 6);
          this.bullets.splice(i, 1);

          if (z.hp <= 0) {
            this.score += 50;
            sounds.playWin();
            this.spawnSplatter(z.x, z.y, '#dc2626', 16);

            // Chance to drop ammo or medkit
            if (Math.random() < 0.2) {
              const types = ['shotgun', 'rifle', 'medkit'];
              this.crates.push({
                x: z.x,
                y: z.y,
                type: types[Math.floor(Math.random() * types.length)]
              });
            }

            this.zombies.splice(j, 1);
          }
          break;
        }
      }
    }

    // Update Zombies & Player Bite
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      const dx = this.player.x - z.x;
      const dy = this.player.y - z.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        z.x += (dx / dist) * z.speed * dt;
        z.y += (dy / dist) * z.speed * dt;
      }

      // Bite Player
      if (dist <= z.radius + this.player.radius) {
        this.player.hp -= 25 * dt;
        if (Math.random() < 0.05) sounds.playHit();

        if (this.player.hp <= 0) {
          sounds.playHit();
          this.finishGame(this.score, { isVictory: false });
          return;
        }
      }
    }

    // Update Crates & Pickup
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];
      if (Math.hypot(c.x - this.player.x, c.y - this.player.y) <= 30) {
        if (c.type === 'shotgun') {
          this.player.shotgunAmmo += 12;
          this.player.weapon = 'shotgun';
        } else if (c.type === 'rifle') {
          this.player.rifleAmmo += 45;
          this.player.weapon = 'rifle';
        } else if (c.type === 'medkit') {
          this.player.hp = Math.min(100, this.player.hp + 40);
        }
        sounds.playPowerup();
        this.score += 80;
        this.crates.splice(i, 1);
      }
    }

    // Check Victory
    if (this.score >= this.config.targetScore) {
      sounds.playWin();
      this.finishGame(this.score, { isVictory: true });
    }

    // Update Blood Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnSplatter(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Graveyard Asphalt Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Draw Crates
    this.crates.forEach(c => {
      ctx.fillStyle = c.type === 'medkit' ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(c.x - 12, c.y - 12, 24, 24, 4);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.type === 'medkit' ? '❤️' : (c.type === 'shotgun' ? '💥' : '⚡'), c.x, c.y);
    });

    // Draw Blood Splatter Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Bullets
    ctx.fillStyle = '#ffd166';
    this.bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Zombies
    this.zombies.forEach(z => {
      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing Red Zombie Eyes
      const eyeAngle = Math.atan2(this.player.y - z.y, this.player.x - z.x);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(z.x + Math.cos(eyeAngle + 0.3) * (z.radius * 0.6), z.y + Math.sin(eyeAngle + 0.3) * (z.radius * 0.6), 2, 0, Math.PI * 2);
      ctx.arc(z.x + Math.cos(eyeAngle - 0.3) * (z.radius * 0.6), z.y + Math.sin(eyeAngle - 0.3) * (z.radius * 0.6), 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Survivor
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);

    // Gun Barrel
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, 6, 18, 5);

    // Shoulders & Head
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Top HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, this.baseWidth, 48);

    ctx.font = '900 18px "Lilita One", sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'left';
    ctx.fillText(`GUN: ${this.player.weapon.toUpperCase()} (${this.player.weapon === 'shotgun' ? this.player.shotgunAmmo : (this.player.weapon === 'rifle' ? this.player.rifleAmmo : '∞')})`, 24, 30);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE: ${this.wave}   •   SCORE: ${this.score}`, this.baseWidth / 2, 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.player.hp < 30 ? '#ef4444' : '#10b981';
    ctx.fillText(`HP: ${Math.max(0, Math.round(this.player.hp))}%`, this.baseWidth - 24, 30);
  }
}
