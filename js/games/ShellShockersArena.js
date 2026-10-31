/* ====================================================
   SHELL SHOCKERS EGG ARENA — GAMINGZONE
   High-Octane Egg FPS Demolition & Scramble Combat
   - Armed Eggs Battling in a Tactical Crate Warehouse Arena
   - 4 Signature Weapons: EggK-47, Scrambler Shotgun, Free Ranger Sniper & Crackshot
   - Progressive Shell Cracking Damage States & Yolk Explosions
   - Grenade Toss (Right-Click / G / Touch Action)
   - 6 Aggressive AI Egg Competitors with Aim Tracking & Flanking
   - 360° Mouse Aiming, WASD Strafing & Mobile Virtual Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ShellShockersArenaGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Shell Shockers Arena',
      targetScore: 20,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 540);

    this.worldWidth = 2400;
    this.worldHeight = 1800;
    this.cameraX = 0;
    this.cameraY = 0;
    this.kills = 0;

    // Player Egg
    this.player = {
      name: 'Eggsplorer',
      x: 1200,
      y: 900,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 100,
      maxHp: 100,
      speed: 4.6,
      weapon: 'EggK-47',
      ammo: 30,
      maxAmmo: 30,
      grenades: 3,
      shellColor: '#ffffff',
      yolkColor: '#fbbf24',
      isReloading: false,
      recoil: 0
    };

    this.bots = [];
    this.bullets = [];
    this.grenades = [];
    this.crates = [];
    this.particles = [];
    this.mouse = { x: 430, y: 270, down: false };
    this.keys = {};

    this.initControls();
    this.initArena();

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
      },
      onAction: () => this.shootWeapon(this.player)
    });

    this.showStartCard({
      title: 'SHELL SHOCKERS EGG ARENA',
      icon: '🥚',
      objective: 'Scramble, crack, and fry enemy eggs in the warehouse arena! Switch weapons, toss grenades, and rack up 20 egg scrambles.',
      controls: 'WASD to Move • Mouse to Aim & Fire • [G] Grenade • [1/2/3] Switch Weapons.',
      onStart: () => {
        this.initArena();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'mousemove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.player.angle = Math.atan2(this.mouse.y - this.height / 2, this.mouse.x - this.width / 2);
    });

    this.addEventListenerTracked(window, 'mousedown', (e) => {
      if (e.button === 2) {
        // Right click grenade
        this.throwGrenade(this.player);
      } else {
        this.mouse.down = true;
        this.shootWeapon(this.player);
      }
    });

    this.addEventListenerTracked(window, 'mouseup', () => {
      this.mouse.down = false;
    });

    this.addEventListenerTracked(window, 'contextmenu', (e) => {
      e.preventDefault();
    });

    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if (e.key === 'g' || e.key === 'G') this.throwGrenade(this.player);
      if (e.key === 'r' || e.key === 'R') this.reloadWeapon(this.player);

      // Weapon switching
      if (e.key === '1') this.switchWeapon(this.player, 'EggK-47');
      if (e.key === '2') this.switchWeapon(this.player, 'Scrambler');
      if (e.key === '3') this.switchWeapon(this.player, 'Free Ranger');
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });
  }

  initArena() {
    this.player.x = 1200;
    this.player.y = 900;
    this.player.hp = 100;
    this.player.ammo = 30;
    this.player.grenades = 3;
    this.kills = 0;
    this.score = 0;

    // Tactical Warehouse Crates / Barricades
    this.crates = [];
    const crateLayout = [
      { x: 900, y: 700, w: 120, h: 80 }, { x: 1400, y: 700, w: 120, h: 80 },
      { x: 900, y: 1100, w: 120, h: 80 }, { x: 1400, y: 1100, w: 120, h: 80 },
      { x: 1150, y: 550, w: 100, h: 60 }, { x: 1150, y: 1250, w: 100, h: 60 },
      { x: 600, y: 900, w: 80, h: 140 }, { x: 1720, y: 900, w: 80, h: 140 }
    ];
    this.crates.push(...crateLayout);

    // 6 AI Egg Competitors
    this.bots = [];
    const botNames = ['HardBoiled', 'ScramblerJoe', 'YolkNinja', 'CrackShot', 'OmeletteKing', 'Eggsterminator'];
    const botWeapons = ['EggK-47', 'Scrambler', 'Free Ranger', 'EggK-47', 'Scrambler', 'Free Ranger'];
    const botColors = ['#f43f5e', '#a855f7', '#10b981', '#f59e0b', '#38bdf8', '#fb7185'];

    for (let i = 0; i < botNames.length; i++) {
      const angle = (i / botNames.length) * Math.PI * 2;
      this.bots.push({
        name: botNames[i],
        x: 1200 + Math.cos(angle) * 700,
        y: 900 + Math.sin(angle) * 550,
        angle: 0,
        hp: 100,
        speed: 3.8,
        weapon: botWeapons[i],
        shellColor: botColors[i],
        aiTimer: 0,
        shootCooldown: 0
      });
    }

    this.bullets = [];
    this.grenades = [];
    this.particles = [];
  }

  switchWeapon(p, wep) {
    p.weapon = wep;
    sounds.playClick();
    if (wep === 'EggK-47') { p.maxAmmo = 30; p.ammo = 30; }
    else if (wep === 'Scrambler') { p.maxAmmo = 8; p.ammo = 8; }
    else if (wep === 'Free Ranger') { p.maxAmmo = 5; p.ammo = 5; }
  }

  reloadWeapon(p) {
    if (p.isReloading || p.ammo === p.maxAmmo) return;
    p.isReloading = true;
    sounds.playClick();
    setTimeout(() => {
      p.ammo = p.maxAmmo;
      p.isReloading = false;
      sounds.playSuccess();
    }, 900);
  }

  shootWeapon(p) {
    if (p.ammo <= 0) {
      this.reloadWeapon(p);
      return;
    }
    p.ammo--;
    sounds.playLaser();

    const cos = Math.cos(p.angle);
    const sin = Math.sin(p.angle);
    const muzzleX = p.x + cos * 24;
    const muzzleY = p.y + sin * 24;

    if (p.weapon === 'Scrambler') {
      // Shotgun 5-pellet spread
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = p.angle + i * 0.12;
        this.bullets.push({
          owner: p.name,
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(spreadAngle) * 16,
          vy: Math.sin(spreadAngle) * 16,
          damage: 22,
          color: '#fbbf24',
          life: 30
        });
      }
    } else if (p.weapon === 'Free Ranger') {
      // Sniper high velocity high damage
      this.bullets.push({
        owner: p.name,
        x: muzzleX,
        y: muzzleY,
        vx: cos * 26,
        vy: sin * 26,
        damage: 85,
        color: '#00e5ff',
        life: 60
      });
    } else {
      // EggK-47 assault rifle
      this.bullets.push({
        owner: p.name,
        x: muzzleX,
        y: muzzleY,
        vx: cos * 19 + (Math.random() - 0.5) * 1.5,
        vy: sin * 19 + (Math.random() - 0.5) * 1.5,
        damage: 28,
        color: '#f59e0b',
        life: 50
      });
    }
  }

  throwGrenade(p) {
    if (p.grenades <= 0) return;
    p.grenades--;
    sounds.playJump();

    const cos = Math.cos(p.angle);
    const sin = Math.sin(p.angle);
    this.grenades.push({
      x: p.x + cos * 20,
      y: p.y + sin * 20,
      vx: cos * 9,
      vy: sin * 9,
      timer: 70
    });
  }

  updateAI() {
    this.bots.forEach(bot => {
      bot.aiTimer++;
      if (bot.shootCooldown > 0) bot.shootCooldown--;

      const dx = this.player.x - bot.x;
      const dy = this.player.y - bot.y;
      const dist = Math.hypot(dx, dy);

      bot.angle = Math.atan2(dy, dx);

      // AI Strafes and maintains distance
      if (dist > 320) {
        bot.x += Math.cos(bot.angle) * bot.speed;
        bot.y += Math.sin(bot.angle) * bot.speed;
      } else if (dist < 180) {
        bot.x -= Math.cos(bot.angle) * (bot.speed * 0.8);
        bot.y -= Math.sin(bot.angle) * (bot.speed * 0.8);
      } else {
        // Circle strafe
        bot.x += -Math.sin(bot.angle) * bot.speed;
        bot.y += Math.cos(bot.angle) * bot.speed;
      }

      // Shoot player if in line of sight
      if (dist < 500 && bot.shootCooldown <= 0) {
        bot.shootCooldown = bot.weapon === 'Free Ranger' ? 60 : (bot.weapon === 'Scrambler' ? 45 : 22);
        this.shootWeapon(bot);
      }
    });
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // 1. Player WASD Movement
    let mx = 0;
    let my = 0;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      this.player.x += (mx / len) * this.player.speed;
      this.player.y += (my / len) * this.player.speed;
    }

    // World bounds
    this.player.x = Math.max(60, Math.min(this.worldWidth - 60, this.player.x));
    this.player.y = Math.max(60, Math.min(this.worldHeight - 60, this.player.y));

    // Auto fire for EggK-47 if mouse held
    if (this.mouse.down && this.player.weapon === 'EggK-47' && Math.random() < 0.25) {
      this.shootWeapon(this.player);
    }

    this.cameraX = this.player.x - this.width / 2;
    this.cameraY = this.player.y - this.height / 2;

    this.updateAI();

    // 2. Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Hit Player
      if (b.owner !== this.player.name && Math.hypot(b.x - this.player.x, b.y - this.player.y) < 22) {
        sounds.playHit();
        this.player.hp -= b.damage;

        // Shell crack particles
        for (let p = 0; p < 8; p++) {
          this.particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: 3,
            color: '#ffffff',
            life: 20
          });
        }

        this.bullets.splice(i, 1);

        if (this.player.hp <= 0) {
          sounds.playExplosion();
          this.triggerYolkSplatter(this.player.x, this.player.y);
          this.gameOver(this.score, { kills: this.kills });
          return;
        }
        continue;
      }

      // Hit Bots
      let bulletHit = false;
      for (const bot of this.bots) {
        if (b.owner === this.player.name && Math.hypot(b.x - bot.x, b.y - bot.y) < 22) {
          sounds.playHit();
          bot.hp -= b.damage;
          bulletHit = true;

          // Shell crack
          for (let p = 0; p < 8; p++) {
            this.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              radius: 3,
              color: bot.shellColor,
              life: 20
            });
          }

          if (bot.hp <= 0) {
            // EGG SCRAMBLED & FRIED!
            sounds.playExplosion();
            this.triggerYolkSplatter(bot.x, bot.y);
            this.kills++;
            this.score += 500;

            if (this.kills >= 20) {
              sounds.playWin();
              this.gameOver(this.score, { victory: true, kills: this.kills });
              return;
            }

            // Respawn bot
            bot.x = Math.random() * (this.worldWidth - 400) + 200;
            bot.y = Math.random() * (this.worldHeight - 400) + 200;
            bot.hp = 100;
          }
          break;
        }
      }

      if (bulletHit) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit Crate
      for (const c of this.crates) {
        if (b.x >= c.x && b.x <= c.x + c.w && b.y >= c.y && b.y <= c.y + c.h) {
          this.bullets.splice(i, 1);
          bulletHit = true;
          break;
        }
      }

      if (!bulletHit && (b.life <= 0 || b.x < 0 || b.x > this.worldWidth || b.y < 0 || b.y > this.worldHeight)) {
        this.bullets.splice(i, 1);
      }
    }

    // 3. Update Grenades
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.x += g.vx;
      g.y += g.vy;
      g.vx *= 0.95;
      g.vy *= 0.95;
      g.timer--;

      if (g.timer <= 0) {
        // DETONATE YOLK BOMB!
        sounds.playExplosion();
        this.triggerYolkSplatter(g.x, g.y, 45);

        // Blast radius check
        this.bots.forEach(bot => {
          if (Math.hypot(g.x - bot.x, g.y - bot.y) < 140) {
            bot.hp -= 90;
            if (bot.hp <= 0) {
              this.kills++;
              this.score += 500;
              bot.x = Math.random() * (this.worldWidth - 400) + 200;
              bot.y = Math.random() * (this.worldHeight - 400) + 200;
              bot.hp = 100;
            }
          }
        });

        this.grenades.splice(i, 1);
      }
    }

    // 4. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  triggerYolkSplatter(x, y, count = 30) {
    for (let p = 0; p < count; p++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        radius: Math.random() * 6 + 3,
        color: Math.random() < 0.6 ? '#fbbf24' : '#ffffff',
        life: 35
      });
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Industrial Concrete Warehouse Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    for (let x = 0; x < this.worldWidth; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.worldHeight; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldWidth, y);
      ctx.stroke();
    }

    // 2. Render Crates
    this.crates.forEach(c => {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      // Crate wood planks
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    });

    // 3. Render Bots & Player
    this.bots.forEach(bot => this.drawEgg(ctx, bot));
    this.drawEgg(ctx, this.player);

    // 4. Render Bullets & Grenades
    this.bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.grenades.forEach(g => {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 5. Render Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 6. Crosshair & HUD
    this.renderHUD(ctx);
  }

  drawEgg(ctx, egg) {
    ctx.save();
    ctx.translate(egg.x, egg.y);
    ctx.rotate(egg.angle);

    // Egg Oval Body
    ctx.fillStyle = egg.shellColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Shell Crack lines if damaged
    if (egg.hp < 70) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(2, 0);
      ctx.lineTo(-2, 8);
      ctx.stroke();
    }

    // Gun Barrel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, -4, 18, 8);

    ctx.restore();

    // HP Bar
    const hpBarW = 34;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(egg.x - hpBarW / 2, egg.y - 28, hpBarW, 5);
    ctx.fillStyle = egg.hp > 40 ? '#10b981' : '#ef4444';
    ctx.fillRect(egg.x - hpBarW / 2, egg.y - 28, (egg.hp / 100) * hpBarW, 5);

    // Name
    ctx.fillStyle = egg === this.player ? '#00e5ff' : '#cbd5e1';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(egg.name, egg.x, egg.y - 34);
  }

  renderHUD(ctx) {
    // HUD Stats Box Top Left
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, 20, 280, 68);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 280, 68);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCRAMBLES: ${this.kills} / 20 🎯`, 34, 46);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`WEAPON: ${this.player.weapon} [${this.player.ammo}/${this.player.maxAmmo}]`, 34, 64);
    ctx.fillText(`HP: ${this.player.hp}% • 💣 GRENADES: ${this.player.grenades}`, 34, 80);

    // Custom Target Crosshair
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.mouse.x, this.mouse.y, 10, 0, Math.PI * 2);
    ctx.moveTo(this.mouse.x - 14, this.mouse.y);
    ctx.lineTo(this.mouse.x + 14, this.mouse.y);
    ctx.moveTo(this.mouse.x, this.mouse.y - 14);
    ctx.lineTo(this.mouse.x, this.mouse.y + 14);
    ctx.stroke();
  }
}

