/* ====================================================
   MONSTER TRUCK CLIMB — GAMINGZONE
   Heavy Off-Road 4x4 Hill Climber with Giant Bouncy Tires,
   Chassis Spring Suspension, Steep Inclines & Fuel Pickups
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class MonsterTruckClimbGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Monster Truck Climb',
      targetScore: 2000,
      targetDistance: 1200,
      ...config
    });

    this.distance = 0;
    this.targetDist = this.config.targetDistance || 1200;
    this.fuel = 100;

    // Monster Truck Physics State
    this.truck = {
      x: 140,
      y: 340,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVel: 0,
      speed: 0,
      wheelRadius: 22,
      onGround: true,
      crashed: false
    };

    this.keys = { gas: false, brake: false, leanLeft: false, leanRight: false };
    this.terrain = [];
    this.fuelCans = [];
    this.coins = [];
    this.particles = [];
    this.cameraX = 0;

    this.createCanvas(740, 520);
    this.generateRockyTerrain();
    this.initTruckControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'RIGHT') this.keys.gas = pressed;
        if (dir === 'LEFT') this.keys.brake = pressed;
        if (dir === 'UP') this.keys.leanRight = pressed;
        if (dir === 'DOWN') this.keys.leanLeft = pressed;
      },
      actionLabel: 'GAS',
      onAction: (pressed) => {
        this.keys.gas = pressed;
      }
    });

    this.showStartCard({
      title: 'MONSTER TRUCK CLIMB',
      icon: '🚚',
      objective: `Conquer ${this.targetDist}m of steep rocky mountain peaks! Balance your chassis and collect red fuel jerry cans.`,
      controls: 'D / Right Arrow = Gas, A / Left Arrow = Brake, W/S = Tilt Balance.',
      onStart: () => this.start()
    });
  }

  generateRockyTerrain() {
    this.terrain = [];
    this.fuelCans = [];
    this.coins = [];
    let curY = 380;

    for (let x = 0; x < 2800; x += 35) {
      if (x > 250) {
        curY += (Math.sin(x * 0.02) * 32) + (Math.cos(x * 0.04) * 22);
        curY = Math.max(240, Math.min(430, curY));
      }
      this.terrain.push({ x, y: curY });

      // Fuel Cans spaced along course
      if (x > 250 && x % 450 === 0) {
        this.fuelCans.push({ x, y: curY - 45, collected: false });
      } else if (x > 200 && Math.random() < 0.35) {
        this.coins.push({ x, y: curY - 45, collected: false });
      }
    }
  }

  initTruckControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING || this.truck.crashed) return;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.gas = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.brake = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.leanRight = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.leanLeft = true;
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.gas = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.brake = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.leanRight = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.leanLeft = false;
    });
  }

  getGroundHeight(x) {
    const idx = Math.floor(x / 35);
    if (idx < 0) return 380;
    if (idx >= this.terrain.length - 1) return 380;

    const t1 = this.terrain[idx];
    const t2 = this.terrain[idx + 1];
    const ratio = (x - t1.x) / 35;
    return t1.y + (t2.y - t1.y) * ratio;
  }

  update(dt) {
    if (this.truck.crashed) return;

    // Fuel Consumption
    if (this.keys.gas && this.fuel > 0) {
      this.fuel = Math.max(0, this.fuel - 9 * dt);
      this.truck.speed = Math.min(360, this.truck.speed + 320 * dt);

      // Mud / Dust Exhaust Particles
      if (this.truck.onGround && Math.random() < 0.4) {
        this.particles.push({
          x: this.truck.x - 30,
          y: this.truck.y + 18,
          vx: -140 + (Math.random() - 0.5) * 50,
          vy: -30 + (Math.random() - 0.5) * 30,
          color: '#78350f',
          life: 0.35
        });
      }
    } else if (this.keys.brake) {
      this.truck.speed = Math.max(0, this.truck.speed - 420 * dt);
    } else {
      this.truck.speed = Math.max(0, this.truck.speed - 110 * dt);
    }

    // Out of fuel check
    if (this.fuel <= 0 && this.truck.speed < 10) {
      this.finishGame(this.score, { isVictory: false, reason: 'Out of fuel!' });
      return;
    }

    // Tilt / Rotation
    if (this.keys.leanRight) this.truck.angularVel += 4.5 * dt;
    if (this.keys.leanLeft) this.truck.angularVel -= 4.5 * dt;

    this.truck.angularVel *= 0.94;
    this.truck.angle += this.truck.angularVel * dt;

    // Forward drive
    this.truck.vx = Math.cos(this.truck.angle) * this.truck.speed;
    this.truck.x += this.truck.vx * dt;

    // Gravity
    this.truck.vy += 900 * dt;
    this.truck.y += this.truck.vy * dt;

    // Ground Collision (Tire height clearance)
    const groundY = this.getGroundHeight(this.truck.x) - 24;

    if (this.truck.y >= groundY) {
      this.truck.y = groundY;
      this.truck.vy = 0;
      this.truck.onGround = true;

      // Crash if upside down on rocks
      if (Math.abs(Math.sin(this.truck.angle)) > 0.82) {
        this.truck.crashed = true;
        sounds.playHit();
        this.spawnBurst(this.truck.x, this.truck.y, '#ef4444', 24);

        this.setTimeout(() => {
          this.finishGame(this.score, { isVictory: false });
        }, 1000);
        return;
      }

      // Conforms to terrain slope
      const slopeAngle = Math.atan2(
        this.getGroundHeight(this.truck.x + 25) - this.getGroundHeight(this.truck.x - 25),
        50
      );
      this.truck.angle += (slopeAngle - this.truck.angle) * 0.16;
    } else {
      this.truck.onGround = false;
    }

    // Distance & Score
    this.distance = Math.round(this.truck.x);
    this.score = Math.round(this.distance * 0.9);
    this.cameraX = this.truck.x - 180;

    // Fuel Cans Pickups
    this.fuelCans.forEach(fc => {
      if (!fc.collected && Math.hypot(this.truck.x - fc.x, this.truck.y - fc.y) < 38) {
        fc.collected = true;
        this.fuel = Math.min(100, this.fuel + 40);
        this.score += 150;
        sounds.playPowerup();
        this.spawnBurst(fc.x, fc.y, '#ef4444', 12);
      }
    });

    // Coins Pickups
    this.coins.forEach(c => {
      if (!c.collected && Math.hypot(this.truck.x - c.x, this.truck.y - c.y) < 35) {
        c.collected = true;
        this.score += 75;
        sounds.playCoin();
        this.spawnBurst(c.x, c.y, '#ffd166', 8);
      }
    });

    // Finish Line
    if (this.distance >= this.targetDist) {
      sounds.playWin();
      this.score += 1000;
      this.finishGame(this.score, { isVictory: true, distance: this.distance });
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

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Rocky Mountain Sky (Sunset Amber)
    const sky = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    sky.addColorStop(0, '#451a03');
    sky.addColorStop(0.5, '#b45309');
    sky.addColorStop(1, '#fde047');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // Mountain Rock Terrain Fill
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.moveTo(0, this.baseHeight);
    this.terrain.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(this.terrain[this.terrain.length - 1].x, this.baseHeight);
    ctx.closePath();
    ctx.fill();

    // Mountain Crest Rock Line
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    this.terrain.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Draw Fuel Jerry Cans
    this.fuelCans.forEach(fc => {
      if (!fc.collected) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(fc.x - 12, fc.y - 14, 24, 28, 4);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 10px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('GAS', fc.x, fc.y + 4);
      }
    });

    // Draw Gold Coins
    this.coins.forEach(c => {
      if (!c.collected) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Monster Truck
    ctx.save();
    ctx.translate(this.truck.x, this.truck.y);
    ctx.rotate(this.truck.angle);

    // Heavy Suspension Springs
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-24, 8);
    ctx.lineTo(-24, 16);
    ctx.moveTo(24, 8);
    ctx.lineTo(24, 16);
    ctx.stroke();

    // Giant Bouncy Pneumatic Monster Wheels
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(-26, 16, this.truck.wheelRadius, 0, Math.PI * 2);
    ctx.arc(26, 16, this.truck.wheelRadius, 0, Math.PI * 2);
    ctx.fill();

    // Tire Treads
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-26, 16, 10, 0, Math.PI * 2);
    ctx.arc(26, 16, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Raised Truck Chassis Body (Electric Purple / Pink)
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(-34, -14, 68, 22, 6);
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cabin & Windshield
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10, -26, 32, 14);

    // Overhead Rollbar
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, -14);
    ctx.lineTo(-12, -28);
    ctx.lineTo(22, -28);
    ctx.stroke();

    ctx.restore();

    ctx.restore();

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🚚 CLIMB: ${this.distance}m / ${this.targetDist}m`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.fuel < 25 ? '#ef4444' : '#10b981';
    ctx.fillText(`⛽ FUEL: ${Math.round(this.fuel)}%`, this.baseWidth - 24, 34);
  }
}
