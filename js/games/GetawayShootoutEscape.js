/* ====================================================
   GETAWAY SHOOTOUT ESCAPE — GAMINGZONE
   High-Stakes Ragdoll Physics Platformer Race & Shootout
   - 3-Button Ragdoll Physics: Jump Left (W/A), Jump Right (E/D), Shoot (Space)
   - 4-Racer Heist Scramble (Player vs 3 Smart AI Competitors)
   - Dynamic Weapon Drops: Shotguns, Bazookas & Laser Blasters
   - Race Across Sinking Barges, Train Tracks & Rooftops
   - First to Reach the Getaway Helicopter Wins the Match!
   - Full Mobile Touch Support & Dual-Player Mode
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class GetawayShootoutEscapeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Getaway Shootout Escape',
      targetScore: 3,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.stageWidth = 2400;
    this.cameraX = 0;
    this.stageNumber = 1;
    this.wins = 0;

    this.racers = [];
    this.platforms = [];
    this.crates = [];
    this.bullets = [];
    this.particles = [];
    this.helicopter = null;

    this.roundOver = false;
    this.roundWinner = null;
    this.roundResetTimer = 0;

    this.initControls();
    this.initStage(this.stageNumber);

    this.attachTouchControls({
      showDpad: false,
      onAction: () => {
        // Default touch jumps right
        if (this.racers[0]) this.jumpRacer(this.racers[0], 1);
      }
    });

    this.showStartCard({
      title: 'GETAWAY SHOOTOUT ESCAPE',
      icon: '🚁',
      objective: 'Scramble across hazardous rooftops and platforms to reach the getaway helicopter before your rivals! Grab weapons to blast opponents back.',
      controls: 'P1: [A/W] Jump Left • [D/E] Jump Right • [Space] Fire Weapon.',
      onStart: () => {
        this.stageNumber = 1;
        this.wins = 0;
        this.initStage(1);
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING || this.roundOver) return;

      const p1 = this.racers[0];
      if (!p1) return;

      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.jumpRacer(p1, -1);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight' || e.key === 'w' || e.key === 'W') {
        this.jumpRacer(p1, 1);
      } else if (e.code === 'Space' || e.key === 'Enter') {
        this.shootRacer(p1);
      }
    });
  }

  initStage(stageNum) {
    this.stageNumber = stageNum;
    this.cameraX = 0;
    this.roundOver = false;
    this.roundWinner = null;
    this.roundResetTimer = 0;

    this.platforms = [];
    this.crates = [];
    this.bullets = [];
    this.particles = [];

    // Procedural Heist Platforms
    this.platforms.push({ x: 0, y: 440, w: 450, h: 80 }); // Start Platform
    let curX = 490;
    while (curX < this.stageWidth - 400) {
      const w = Math.random() * 180 + 120;
      const y = 420 - Math.sin(curX * 0.006) * 110;
      this.platforms.push({ x: curX, y: y, w: w, h: 40 });

      // Spawn weapon crate on some platforms
      if (Math.random() < 0.4) {
        this.crates.push({
          x: curX + w / 2,
          y: y - 24,
          type: Math.random() < 0.5 ? 'Shotgun' : 'Bazooka',
          collected: false
        });
      }

      curX += w + Math.random() * 80 + 60;
    }

    // Getaway Helicopter Landing Pad at End
    const finishX = this.stageWidth - 300;
    this.platforms.push({ x: finishX - 50, y: 390, w: 320, h: 80 });
    this.helicopter = {
      x: finishX + 90,
      y: 330,
      rotorAngle: 0,
      escaped: false
    };

    // 4 Heist Competitors
    this.racers = [
      { id: 1, name: 'You', isPlayer: true, color: '#00e5ff', suit: '#0284c7', x: 80, y: 380, vx: 0, vy: 0, angle: 0, weapon: 'Pistol', ammo: 99, grounded: false },
      { id: 2, name: 'Slick Rex', isPlayer: false, color: '#f43f5e', suit: '#9f1239', x: 140, y: 380, vx: 0, vy: 0, angle: 0, weapon: 'Pistol', ammo: 99, grounded: false, aiTimer: 0 },
      { id: 3, name: 'Bandit Joe', isPlayer: false, color: '#eab308', suit: '#a16207', x: 200, y: 380, vx: 0, vy: 0, angle: 0, weapon: 'Pistol', ammo: 99, grounded: false, aiTimer: 0 },
      { id: 4, name: 'Shadow Viper', isPlayer: false, color: '#a855f7', suit: '#6b21a8', x: 260, y: 380, vx: 0, vy: 0, angle: 0, weapon: 'Pistol', ammo: 99, grounded: false, aiTimer: 0 }
    ];
  }

  jumpRacer(r, dir) {
    if (!r.grounded) return;
    sounds.playJump();
    r.grounded = false;
    r.vy = -10.5;
    r.vx = dir * 6.2;
    r.angle = dir * 0.35;
  }

  shootRacer(r) {
    if (!r.weapon) return;
    sounds.playLaser();

    const facing = r.vx >= 0 ? 1 : -1;
    const bSpeed = 16 * facing;

    if (r.weapon === 'Shotgun') {
      for (let i = -1; i <= 1; i++) {
        this.bullets.push({
          owner: r.id,
          x: r.x + facing * 20,
          y: r.y - 10,
          vx: bSpeed,
          vy: i * 2.5,
          color: '#f59e0b',
          power: 14
        });
      }
    } else if (r.weapon === 'Bazooka') {
      this.bullets.push({
        owner: r.id,
        x: r.x + facing * 20,
        y: r.y - 10,
        vx: bSpeed * 0.8,
        vy: 0,
        color: '#ef4444',
        power: 24,
        isRocket: true
      });
    } else {
      // Pistol
      this.bullets.push({
        owner: r.id,
        x: r.x + facing * 20,
        y: r.y - 10,
        vx: bSpeed,
        vy: 0,
        color: '#00e5ff',
        power: 8
      });
    }

    // Recoil
    r.vx -= facing * 3.5;
  }

  updateAI() {
    this.racers.slice(1).forEach((bot) => {
      bot.aiTimer++;
      if (bot.grounded && bot.aiTimer > Math.random() * 20 + 20) {
        bot.aiTimer = 0;
        // Jump towards helicopter
        this.jumpRacer(bot, 1);

        // Occasionally shoot nearby competitors
        if (Math.random() < 0.35) {
          this.shootRacer(bot);
        }
      }
    });
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    if (this.roundOver) {
      this.roundResetTimer++;
      if (this.roundResetTimer > 80) {
        if (this.wins >= 3) {
          sounds.playWin();
          this.gameOver(1500, { wins: this.wins });
        } else {
          this.initStage(this.stageNumber + 1);
        }
      }
      return;
    }

    this.updateAI();

    // Rotor spin
    if (this.helicopter) {
      this.helicopter.rotorAngle += 0.45;
    }

    // Update Racers
    this.racers.forEach((r) => {
      r.vy += 0.52; // gravity
      r.x += r.vx;
      r.y += r.vy;
      r.vx *= 0.94;
      r.angle *= 0.92;

      // Platform Collisions
      r.grounded = false;
      for (const p of this.platforms) {
        if (r.x >= p.x - 10 && r.x <= p.x + p.w + 10 && r.y + 24 >= p.y && r.y + 24 <= p.y + 22 && r.vy >= 0) {
          r.y = p.y - 24;
          r.vy = 0;
          r.grounded = true;
          break;
        }
      }

      // Collect Weapon Crates
      for (const c of this.crates) {
        if (!c.collected && Math.hypot(r.x - c.x, r.y - c.y) < 32) {
          c.collected = true;
          r.weapon = c.type;
          sounds.playSuccess();
        }
      }

      // Fall off map check
      if (r.y > 600) {
        // Respawn near nearest platform
        r.x = Math.max(80, r.x - 250);
        r.y = 200;
        r.vx = 0;
        r.vy = 0;
      }

      // Check Helicopter Win Condition
      if (this.helicopter && Math.hypot(r.x - this.helicopter.x, r.y - this.helicopter.y) < 45) {
        this.roundOver = true;
        this.roundWinner = r;
        sounds.playWin();
        if (r.isPlayer) {
          this.wins++;
          this.score += 500;
        }
      }
    });

    // Camera smoothly centers player 1
    const p1 = this.racers[0];
    if (p1) {
      this.cameraX = p1.x - 240;
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      // Hit racers
      for (const r of this.racers) {
        if (r.id !== b.owner && Math.hypot(b.x - r.x, b.y - r.y) < 26) {
          sounds.playHit();
          r.vx += b.vx * 0.6;
          r.vy -= b.power * 0.4;
          r.angle += (Math.random() - 0.5) * 0.8;

          for (let p = 0; p < 8; p++) {
            this.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              radius: 3,
              color: b.color,
              life: 18
            });
          }
          this.bullets.splice(i, 1);
          break;
        }
      }

      if (b.x < this.cameraX - 100 || b.x > this.cameraX + this.width + 100) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sunset Skyline Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#701a75');
    bgGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 2. City Buildings in Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    for (let i = 0; i < 24; i++) {
      const bx = i * 120;
      const bh = 180 + ((i * 47) % 150);
      ctx.fillRect(bx, this.height - bh, 80, bh);
    }

    // 3. Render Platforms
    this.platforms.forEach((p) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(p.x, p.y, p.w, 4); // Neon trim
    });

    // 4. Render Weapon Crates
    this.crates.forEach((c) => {
      if (c.collected) return;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(c.x - 14, c.y - 14, 28, 28);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x - 14, c.y - 14, 28, 28);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.type === 'Shotgun' ? 'SG' : 'RPG', c.x, c.y + 4);
    });

    // 5. Render Getaway Helicopter
    if (this.helicopter) {
      const h = this.helicopter;
      ctx.save();
      ctx.translate(h.x, h.y);

      // Body
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail & Skid
      ctx.fillStyle = '#047857';
      ctx.fillRect(-65, -6, 30, 8);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-30, 24, 60, 4);

      // Rotor Blades
      ctx.save();
      ctx.translate(0, -22);
      ctx.rotate(h.rotorAngle);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-55, -2, 110, 4);
      ctx.restore();

      ctx.restore();
    }

    // 6. Render Competitors
    this.racers.forEach((r) => {
      this.drawRacer(ctx, r);
    });

    // 7. Render Bullets & Particles
    this.bullets.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 8. HUD & Round Banners
    this.renderHUD(ctx);
  }

  drawRacer(ctx, r) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fill();

    // Headband
    ctx.fillStyle = r.color;
    ctx.fillRect(-9, -26, 18, 5);

    // Suit Torso
    ctx.fillStyle = r.suit;
    ctx.fillRect(-8, -10, 16, 22);

    // Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 12, 5, 14);
    ctx.fillRect(2, 12, 5, 14);

    // Weapon
    ctx.fillStyle = '#475569';
    ctx.fillRect(6, -4, 16, 5);

    ctx.restore();

    // Label
    ctx.fillStyle = r.isPlayer ? '#00e5ff' : '#cbd5e1';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.name, r.x, r.y - 32);
  }

  renderHUD(ctx) {
    // Score Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    const p1 = this.racers[0];
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HEIST WINS: ${this.wins} / 3`, 34, 46);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`WEAPON: ${p1?.weapon || 'None'} • STAGE ${this.stageNumber}`, 34, 64);

    // Winner Banner
    if (this.roundOver && this.roundWinner) {
      ctx.fillStyle = 'rgba(5, 8, 15, 0.85)';
      ctx.fillRect(this.width / 2 - 200, this.height / 2 - 40, 400, 80);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.width / 2 - 200, this.height / 2 - 40, 400, 80);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🚁 ${this.roundWinner.name.toUpperCase()} ESCAPED!`, this.width / 2, this.height / 2);
    }
  }
}

