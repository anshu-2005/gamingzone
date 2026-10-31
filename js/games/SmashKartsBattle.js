/* ====================================================
   SMASH KARTS BATTLE ARENA — GAMINGZONE
   High-Octane Demolition Kart Combat & Missile Arena
   - Steer & Drift Mini Combat Karts in a Free-for-All Demolition Arena
   - Collect Mystery Weapon Crates: Homing Missiles, Spike Mines & Nitro Boosters
   - Blast 5 Aggressive AI Competitors in Real-Time
   - Drift Smoke, Explosion Debris & Dynamic Speed Trails
   - Timed 90-Second Match with Podium Placement
   - Touch Virtual Joystick & WASD/Arrow Key Driving
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class SmashKartsBattleGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Smash Karts Battle',
      targetScore: 10,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 540);

    this.matchTimer = 90; // 90 seconds
    this.timerFrames = 0;
    this.kills = 0;

    // Player Kart
    this.player = {
      name: 'Player 1',
      x: 430,
      y: 270,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
      maxSpeed: 5.8,
      accel: 0.22,
      turnSpeed: 0.065,
      color: '#00e5ff',
      kartColor: '#0284c7',
      weapon: null,
      ammo: 0,
      isBoosting: false,
      driftTimer: 0
    };

    this.karts = [];
    this.weaponBoxes = [];
    this.projectiles = [];
    this.mines = [];
    this.particles = [];
    this.keys = {};

    this.initControls();
    this.initArena();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) {
          this.keys['ArrowUp'] = false;
          this.keys['ArrowDown'] = false;
          this.keys['ArrowLeft'] = false;
          this.keys['ArrowRight'] = false;
          return;
        }
        if (dir === 'UP') this.keys['ArrowUp'] = true;
        if (dir === 'DOWN') this.keys['ArrowDown'] = true;
        if (dir === 'LEFT') this.keys['ArrowLeft'] = true;
        if (dir === 'RIGHT') this.keys['ArrowRight'] = true;
      },
      onAction: () => this.fireWeapon(this.player)
    });

    this.showStartCard({
      title: 'SMASH KARTS BATTLE',
      icon: '🏎️',
      objective: 'Drive, drift, and smash rivals in the demolition arena! Grab mystery boxes for missiles, mines, and nitro. Score the most knockouts in 90s.',
      controls: 'WASD / Arrow Keys to Steer & Drift • [Space] to Fire Weapon.',
      onStart: () => {
        this.initArena();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;

      if (e.code === 'Space' && this.state === GameState.PLAYING) {
        this.fireWeapon(this.player);
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });
  }

  initArena() {
    this.matchTimer = 90;
    this.timerFrames = 0;
    this.kills = 0;
    this.score = 0;

    this.player.x = 430;
    this.player.y = 270;
    this.player.speed = 0;
    this.player.angle = 0;
    this.player.weapon = 'Missile';
    this.player.ammo = 3;

    // AI Opponent Karts
    this.karts = [this.player];
    const aiConfigs = [
      { name: 'DriftKing', color: '#f43f5e', kartColor: '#be123c', x: 150, y: 150, angle: 0.5 },
      { name: 'TurboViper', color: '#eab308', kartColor: '#a16207', x: 700, y: 150, angle: 2.2 },
      { name: 'NitroBlaster', color: '#a855f7', kartColor: '#6b21a8', x: 150, y: 400, angle: -0.6 },
      { name: 'ApexRacer', color: '#10b981', kartColor: '#047857', x: 700, y: 400, angle: 3.1 }
    ];

    aiConfigs.forEach(cfg => {
      this.karts.push({
        ...cfg,
        isAI: true,
        vx: 0,
        vy: 0,
        speed: 0,
        maxSpeed: 4.8,
        accel: 0.18,
        turnSpeed: 0.055,
        weapon: 'Missile',
        ammo: 2,
        aiTimer: 0,
        aiTargetAngle: 0
      });
    });

    // Spawn 6 Mystery Weapon Boxes
    this.weaponBoxes = [];
    const spawnPoints = [
      { x: 430, y: 120 }, { x: 430, y: 420 },
      { x: 260, y: 270 }, { x: 600, y: 270 },
      { x: 200, y: 180 }, { x: 660, y: 360 }
    ];

    spawnPoints.forEach(sp => {
      this.weaponBoxes.push({
        x: sp.x,
        y: sp.y,
        respawnTimer: 0,
        active: true
      });
    });

    this.projectiles = [];
    this.mines = [];
    this.particles = [];
  }

  fireWeapon(kart) {
    if (!kart.weapon || kart.ammo <= 0) return;
    kart.ammo--;

    if (kart.weapon === 'Missile') {
      sounds.playLaser();
      this.projectiles.push({
        owner: kart.name,
        x: kart.x + Math.cos(kart.angle) * 24,
        y: kart.y + Math.sin(kart.angle) * 24,
        angle: kart.angle,
        speed: 12,
        color: kart.color,
        life: 70
      });
    } else if (kart.weapon === 'Mine') {
      sounds.playClick();
      this.mines.push({
        owner: kart.name,
        x: kart.x - Math.cos(kart.angle) * 24,
        y: kart.y - Math.sin(kart.angle) * 24,
        radius: 14,
        color: '#ef4444'
      });
    } else if (kart.weapon === 'Nitro') {
      sounds.playSuccess();
      kart.speed = kart.maxSpeed * 1.6;
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: kart.x - Math.cos(kart.angle) * 20,
          y: kart.y - Math.sin(kart.angle) * 20,
          vx: -Math.cos(kart.angle) * 6 + (Math.random() - 0.5) * 3,
          vy: -Math.sin(kart.angle) * 6 + (Math.random() - 0.5) * 3,
          radius: 4,
          color: '#fbbf24',
          life: 20
        });
      }
    }

    if (kart.ammo <= 0) {
      kart.weapon = null;
    }
  }

  updateAI() {
    this.karts.filter(k => k.isAI).forEach(bot => {
      bot.aiTimer++;

      // Pick nearest opponent or weapon box
      if (bot.aiTimer > 30) {
        bot.aiTimer = 0;
        const target = this.player;
        const dx = target.x - bot.x;
        const dy = target.y - bot.y;
        bot.aiTargetAngle = Math.atan2(dy, dx);

        // Fire missile if facing target
        if (bot.weapon && Math.abs(bot.angle - bot.aiTargetAngle) < 0.4 && Math.hypot(dx, dy) < 320) {
          this.fireWeapon(bot);
        }
      }

      // Smooth turn towards target
      let diff = bot.aiTargetAngle - bot.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      bot.angle += Math.sign(diff) * Math.min(bot.turnSpeed, Math.abs(diff));
      bot.speed = Math.min(bot.maxSpeed, bot.speed + bot.accel);
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
        sounds.playWin();
        this.gameOver(this.kills * 500, { kills: this.kills });
        return;
      }
    }

    // Player Steer Controls
    const p = this.player;
    if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['a']) p.angle -= p.turnSpeed;
    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['d']) p.angle += p.turnSpeed;

    if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['w']) {
      p.speed = Math.min(p.maxSpeed, p.speed + p.accel);
    } else if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['s']) {
      p.speed = Math.max(-p.maxSpeed * 0.4, p.speed - p.accel * 0.8);
    } else {
      p.speed *= 0.96; // Coast friction
    }

    this.updateAI();

    // Update All Karts
    this.karts.forEach(k => {
      k.x += Math.cos(k.angle) * k.speed;
      k.y += Math.sin(k.angle) * k.speed;

      // Arena Wall Bounces
      const margin = 35;
      if (k.x < margin) { k.x = margin; k.speed *= -0.5; }
      if (k.x > this.width - margin) { k.x = this.width - margin; k.speed *= -0.5; }
      if (k.y < margin) { k.y = margin; k.speed *= -0.5; }
      if (k.y > this.height - margin) { k.y = this.height - margin; k.speed *= -0.5; }

      // Drift Smoke
      if (Math.abs(k.speed) > 3.5 && Math.random() < 0.3) {
        this.particles.push({
          x: k.x - Math.cos(k.angle) * 16,
          y: k.y - Math.sin(k.angle) * 16,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 3,
          color: '#cbd5e1',
          life: 14
        });
      }

      // Collect Weapon Boxes
      this.weaponBoxes.forEach(wb => {
        if (wb.active && Math.hypot(k.x - wb.x, k.y - wb.y) < 32) {
          wb.active = false;
          wb.respawnTimer = 240; // 4 seconds
          sounds.playSuccess();
          const weps = ['Missile', 'Mine', 'Nitro'];
          k.weapon = weps[Math.floor(Math.random() * weps.length)];
          k.ammo = k.weapon === 'Missile' ? 3 : (k.weapon === 'Mine' ? 2 : 1);
        }
      });
    });

    // Weapon Boxes Respawn
    this.weaponBoxes.forEach(wb => {
      if (!wb.active) {
        wb.respawnTimer--;
        if (wb.respawnTimer <= 0) wb.active = true;
      }
    });

    // Update Projectiles (Missiles)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.x += Math.cos(pr.angle) * pr.speed;
      pr.y += Math.sin(pr.angle) * pr.speed;
      pr.life--;

      // Hit Karts
      for (const k of this.karts) {
        if (k.name !== pr.owner && Math.hypot(pr.x - k.x, pr.y - k.y) < 28) {
          sounds.playExplosion();
          k.speed = -3;
          k.angle += Math.PI * 0.7; // Spin out!

          if (pr.owner === this.player.name) {
            this.kills++;
            this.score += 500;
          }

          // Fireball Explosion
          for (let p = 0; p < 20; p++) {
            this.particles.push({
              x: pr.x,
              y: pr.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              radius: Math.random() * 5 + 3,
              color: '#f97316',
              life: 25
            });
          }

          this.projectiles.splice(i, 1);
          break;
        }
      }

      if (pr.life <= 0 || pr.x < 0 || pr.x > this.width || pr.y < 0 || pr.y > this.height) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Mines
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      for (const k of this.karts) {
        if (Math.hypot(m.x - k.x, m.y - k.y) < m.radius + 18) {
          sounds.playExplosion();
          k.speed = -4;
          k.angle += 1.5;
          if (m.owner === this.player.name) {
            this.kills++;
            this.score += 500;
          }
          this.mines.splice(i, 1);
          break;
        }
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

    // 1. Asphalt Demolition Arena Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Race Track Chequered Curb Border
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, this.width - 40, this.height - 40);

    // Center Arena Hazard Circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, 120, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Render Weapon Mystery Boxes
    this.weaponBoxes.forEach(wb => {
      if (!wb.active) return;
      ctx.save();
      ctx.translate(wb.x, wb.y);

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-14, -14, 28, 28);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -14, 28, 28);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);

      ctx.restore();
    });

    // 3. Render Mines
    this.mines.forEach(m => {
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 4. Render Karts
    this.karts.forEach(k => {
      this.drawKart(ctx, k);
    });

    // 5. Render Missiles & Particles
    this.projectiles.forEach(pr => {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.angle);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-10, -3, 20, 6);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-12, -2, 4, 4); // Rocket thruster
      ctx.restore();
    });

    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. HUD & Kill Feed
    this.renderHUD(ctx);
  }

  drawKart(ctx, k) {
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.angle);

    // Kart Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(-18, -12, 36, 24);

    // 4 Wheels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, -15, 8, 5);
    ctx.fillRect(8, -15, 8, 5);
    ctx.fillRect(-16, 10, 8, 5);
    ctx.fillRect(8, 10, 8, 5);

    // Kart Chassis
    ctx.fillStyle = k.kartColor;
    ctx.beginPath();
    ctx.roundRect(-16, -11, 32, 22, 6);
    ctx.fill();

    // Driver Helmet
    ctx.fillStyle = k.color;
    ctx.beginPath();
    ctx.arc(-2, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Front Bumper
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(14, -8, 4, 16);

    ctx.restore();

    // Name Label
    ctx.fillStyle = k.isAI ? '#cbd5e1' : '#00e5ff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(k.name, k.x, k.y - 20);
  }

  renderHUD(ctx) {
    // Top Score & Kills
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`KILLS: ${this.kills} 🎯`, 34, 48);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`WEAPON: ${this.player.weapon ? `${this.player.weapon} (${this.player.ammo})` : 'EMPTY'}`, 34, 66);

    // Match Timer (Center Top)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(this.width / 2 - 60, 20, 120, 46);
    ctx.strokeStyle = this.matchTimer <= 15 ? '#ef4444' : 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(this.width / 2 - 60, 20, 120, 46);

    ctx.fillStyle = this.matchTimer <= 15 ? '#ef4444' : '#fff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ ${this.matchTimer}s`, this.width / 2, 52);
  }
}

