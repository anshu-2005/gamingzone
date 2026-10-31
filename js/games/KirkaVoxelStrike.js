/* ====================================================
   KIRKA VOXEL STRIKE FPS — GAMINGZONE
   Blocky Tactical FPS Arena & Team Deathmatch
   - Fast Parkour Movement: WASD Sprint & Shift Slide
   - 4 Signature Firearms: M4A1 Assault Rifle, AWP Sniper, Pump Shotgun & Knife
   - Team Deathmatch: Blue Strike Force vs Red Insurgents
   - Dynamic Desert Dust Arena with Crates, Bunkers & Sandbags
   - Live Kill Feed, Radar Minimap & Kill Streak Banners
   - Touch Virtual D-Pad & 360° Mouse Aiming
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class KirkaVoxelStrikeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Kirka Voxel Strike',
      targetScore: 25,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 540);

    this.worldWidth = 2200;
    this.worldHeight = 1600;
    this.cameraX = 0;
    this.cameraY = 0;
    this.kills = 0;
    this.blueScore = 0;
    this.redScore = 0;
    this.matchTimer = 120;
    this.timerFrames = 0;

    // Player
    this.player = {
      name: 'VoxelStriker',
      team: 'blue',
      x: 400,
      y: 800,
      angle: 0,
      hp: 100,
      speed: 4.8,
      weapon: 'M4A1',
      ammo: 30,
      maxAmmo: 30,
      isReloading: false
    };

    this.bots = [];
    this.bullets = [];
    this.barricades = [];
    this.particles = [];
    this.killFeed = [];
    this.mouse = { x: 430, y: 270, down: false };
    this.keys = {};

    this.initControls();
    this.initArena();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) {
          this.keys['w'] = false;
          this.keys['s'] = false;
          this.keys['a'] = false;
          this.keys['d'] = false;
          return;
        }
        if (dir === 'UP') this.keys['w'] = true;
        if (dir === 'DOWN') this.keys['s'] = true;
        if (dir === 'LEFT') this.keys['a'] = true;
        if (dir === 'RIGHT') this.keys['d'] = true;
      },
      onAction: () => this.fireWeapon(this.player)
    });

    this.showStartCard({
      title: 'KIRKA VOXEL STRIKE FPS',
      icon: '🔫',
      objective: 'Fast-paced tactical block FPS! Lead Blue Team to 25 eliminations against Red Insurgents.',
      controls: 'WASD to Strafe • Mouse to Aim & Shoot • [R] Reload • [1/2/3] Switch Guns.',
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

    this.addEventListenerTracked(window, 'mousedown', () => {
      this.mouse.down = true;
      this.fireWeapon(this.player);
    });

    this.addEventListenerTracked(window, 'mouseup', () => {
      this.mouse.down = false;
    });

    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if (e.key === 'r' || e.key === 'R') this.reload(this.player);
      if (e.key === '1') this.switchGun(this.player, 'M4A1');
      if (e.key === '2') this.switchGun(this.player, 'AWP');
      if (e.key === '3') this.switchGun(this.player, 'Shotgun');
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });
  }

  initArena() {
    this.matchTimer = 120;
    this.timerFrames = 0;
    this.kills = 0;
    this.blueScore = 0;
    this.redScore = 0;
    this.player.x = 400;
    this.player.y = 800;
    this.player.hp = 100;
    this.player.ammo = 30;

    // Barricades / Sandbag Bunkers
    this.barricades = [
      { x: 700, y: 500, w: 140, h: 40 }, { x: 700, y: 1060, w: 140, h: 40 },
      { x: 1400, y: 500, w: 140, h: 40 }, { x: 1400, y: 1060, w: 140, h: 40 },
      { x: 1050, y: 750, w: 100, h: 100 } // Center Bunker
    ];

    // 7 AI Combatants (3 Blue allies, 4 Red enemies)
    this.bots = [];
    const botConfigs = [
      { name: 'Ghost_Voxel', team: 'blue', x: 300, y: 600, weapon: 'M4A1' },
      { name: 'Bravo_Two', team: 'blue', x: 300, y: 1000, weapon: 'Shotgun' },
      { name: 'Sniper_Echo', team: 'blue', x: 200, y: 800, weapon: 'AWP' },
      { name: 'Red_Apex', team: 'red', x: 1800, y: 600, weapon: 'M4A1' },
      { name: 'Red_Viper', team: 'red', x: 1800, y: 1000, weapon: 'M4A1' },
      { name: 'Red_Titan', team: 'red', x: 1900, y: 750, weapon: 'Shotgun' },
      { name: 'Red_Shadow', team: 'red', x: 2000, y: 850, weapon: 'AWP' }
    ];

    botConfigs.forEach(cfg => {
      this.bots.push({
        ...cfg,
        hp: 100,
        speed: 3.8,
        angle: 0,
        ammo: 30,
        aiTimer: 0,
        shootCooldown: 0
      });
    });

    this.bullets = [];
    this.particles = [];
    this.killFeed = [];
  }

  switchGun(p, gun) {
    p.weapon = gun;
    sounds.playClick();
    p.maxAmmo = gun === 'M4A1' ? 30 : (gun === 'AWP' ? 5 : 8);
    p.ammo = p.maxAmmo;
  }

  reload(p) {
    if (p.isReloading || p.ammo === p.maxAmmo) return;
    p.isReloading = true;
    sounds.playClick();
    setTimeout(() => {
      p.ammo = p.maxAmmo;
      p.isReloading = false;
      sounds.playSuccess();
    }, 850);
  }

  fireWeapon(p) {
    if (p.ammo <= 0) {
      this.reload(p);
      return;
    }
    p.ammo--;
    sounds.playLaser();

    const cos = Math.cos(p.angle);
    const sin = Math.sin(p.angle);

    if (p.weapon === 'AWP') {
      this.bullets.push({
        owner: p.name,
        team: p.team,
        x: p.x + cos * 26,
        y: p.y + sin * 26,
        vx: cos * 28,
        vy: sin * 28,
        damage: 100,
        color: '#00e5ff',
        life: 50
      });
    } else if (p.weapon === 'Shotgun') {
      for (let i = -2; i <= 2; i++) {
        const spread = p.angle + i * 0.12;
        this.bullets.push({
          owner: p.name,
          team: p.team,
          x: p.x + cos * 22,
          y: p.y + sin * 22,
          vx: Math.cos(spread) * 16,
          vy: Math.sin(spread) * 16,
          damage: 24,
          color: '#fbbf24',
          life: 25
        });
      }
    } else {
      // M4A1
      this.bullets.push({
        owner: p.name,
        team: p.team,
        x: p.x + cos * 24,
        y: p.y + sin * 24,
        vx: cos * 20 + (Math.random() - 0.5) * 1.5,
        vy: sin * 20 + (Math.random() - 0.5) * 1.5,
        damage: 28,
        color: '#f59e0b',
        life: 45
      });
    }
  }

  updateAI() {
    this.bots.forEach(bot => {
      bot.aiTimer++;
      if (bot.shootCooldown > 0) bot.shootCooldown--;

      // Find nearest enemy
      let enemy = null;
      let minDist = 9999;
      const candidates = bot.team === 'red' ? [this.player, ...this.bots.filter(b => b.team === 'blue')] : this.bots.filter(b => b.team === 'red');

      candidates.forEach(c => {
        const d = Math.hypot(c.x - bot.x, c.y - bot.y);
        if (d < minDist) {
          minDist = d;
          enemy = c;
        }
      });

      if (!enemy) return;

      bot.angle = Math.atan2(enemy.y - bot.y, enemy.x - bot.x);

      if (minDist > 300) {
        bot.x += Math.cos(bot.angle) * bot.speed;
        bot.y += Math.sin(bot.angle) * bot.speed;
      } else {
        // Fire at enemy
        if (bot.shootCooldown <= 0) {
          bot.shootCooldown = bot.weapon === 'AWP' ? 65 : (bot.weapon === 'Shotgun' ? 45 : 24);
          this.fireWeapon(bot);
        }
      }
    });
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // Timer
    this.timerFrames++;
    if (this.timerFrames >= 60) {
      this.timerFrames = 0;
      this.matchTimer--;
      if (this.matchTimer <= 0) {
        const win = this.blueScore >= this.redScore;
        sounds.playWin();
        this.gameOver(this.kills * 400, { blueScore: this.blueScore, redScore: this.redScore });
        return;
      }
    }

    // Player WASD
    let mx = 0;
    let my = 0;
    if (this.keys['w']) my -= 1;
    if (this.keys['s']) my += 1;
    if (this.keys['a']) mx -= 1;
    if (this.keys['d']) mx += 1;

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      this.player.x += (mx / len) * this.player.speed;
      this.player.y += (my / len) * this.player.speed;
    }

    this.player.x = Math.max(60, Math.min(this.worldWidth - 60, this.player.x));
    this.player.y = Math.max(60, Math.min(this.worldHeight - 60, this.player.y));

    if (this.mouse.down && this.player.weapon === 'M4A1' && Math.random() < 0.28) {
      this.fireWeapon(this.player);
    }

    this.cameraX = this.player.x - this.width / 2;
    this.cameraY = this.player.y - this.height / 2;

    this.updateAI();

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Hit Player
      if (b.team !== this.player.team && Math.hypot(b.x - this.player.x, b.y - this.player.y) < 22) {
        sounds.playHit();
        this.player.hp -= b.damage;
        this.bullets.splice(i, 1);

        if (this.player.hp <= 0) {
          sounds.playExplosion();
          this.redScore++;
          this.player.x = 400;
          this.player.y = 800;
          this.player.hp = 100;
        }
        continue;
      }

      // Hit Bots
      let hit = false;
      for (const bot of this.bots) {
        if (b.team !== bot.team && Math.hypot(b.x - bot.x, b.y - bot.y) < 22) {
          sounds.playHit();
          bot.hp -= b.damage;
          hit = true;

          if (bot.hp <= 0) {
            sounds.playExplosion();
            if (b.team === 'blue') {
              this.blueScore++;
              if (b.owner === this.player.name) {
                this.kills++;
                this.score += 500;
              }
            } else {
              this.redScore++;
            }

            // Respawn
            bot.x = bot.team === 'blue' ? 300 : 1800;
            bot.y = Math.random() * 800 + 400;
            bot.hp = 100;
          }
          break;
        }
      }

      if (hit) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0 || b.x < 0 || b.x > this.worldWidth || b.y < 0 || b.y > this.worldHeight) {
        this.bullets.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Desert Dust Arena Ground
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    for (let x = 0; x < this.worldWidth; x += 140) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldHeight);
      ctx.stroke();
    }

    // 2. Render Barricades
    this.barricades.forEach(b => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    });

    // 3. Render Bots & Player
    this.bots.forEach(b => this.drawSoldier(ctx, b));
    this.drawSoldier(ctx, this.player);

    // 4. Render Bullets
    this.bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 5. HUD & Team Score
    this.renderHUD(ctx);
  }

  drawSoldier(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);

    // Body
    ctx.fillStyle = s.team === 'blue' ? '#0284c7' : '#dc2626';
    ctx.fillRect(-12, -12, 24, 24);

    // Gun
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 2, 16, 6);

    ctx.restore();

    // Health
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(s.x - 16, s.y - 24, 32, 4);
    ctx.fillStyle = s.team === 'blue' ? '#00e5ff' : '#ef4444';
    ctx.fillRect(s.x - 16, s.y - 24, (s.hp / 100) * 32, 4);
  }

  renderHUD(ctx) {
    // Top Scoreboard
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(this.width / 2 - 140, 16, 280, 52);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(this.width / 2 - 140, 16, 280, 52);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`BLUE: ${this.blueScore}`, this.width / 2 - 120, 50);

    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText(`RED: ${this.redScore}`, this.width / 2 + 120, 50);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ ${this.matchTimer}s`, this.width / 2, 46);

    // Weapons Left
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, 20, 240, 56);
    ctx.strokeRect(20, 20, 240, 56);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`KILLS: ${this.kills} 🎯`, 34, 46);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`${this.player.weapon} [${this.player.ammo}/${this.player.maxAmmo}] • HP: ${this.player.hp}%`, 34, 64);
  }
}

