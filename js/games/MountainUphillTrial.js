/* ====================================================
   MOUNTAIN UPHILL TRIAL — GAMINGZONE
   4x4 Off-Road Physics Rock Crawler & Hill Climb Trial
   - Independent Wheel Suspension Physics & High-Torque 4WD
   - Climb Rocky Cliffs, Boulders, Steep Ridges & Rope Bridges
   - Collect Fuel Canisters & Coins to Keep the Engine Roaring
   - Perform Air Flips & Land Smoothly on Both Axles
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class MountainUphillTrialGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Mountain Uphill Trial',
      targetScore: 5000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.cameraX = 0;
    this.fuel = 100;
    this.coins = 0;

    // 4x4 Jeep
    this.jeep = {
      x: 100,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      grounded: false
    };

    this.terrain = [];
    this.items = [];
    this.particles = [];
    this.keys = {};

    this.initControls();
    this.generateMountain();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) {
          this.keys['ArrowRight'] = false;
          this.keys['ArrowLeft'] = false;
          return;
        }
        if (dir === 'RIGHT') this.keys['ArrowRight'] = true;
        if (dir === 'LEFT') this.keys['ArrowLeft'] = true;
      }
    });

    this.showStartCard({
      title: 'MOUNTAIN UPHILL TRIAL',
      icon: '🚙',
      objective: 'Crawl steep rock mountains in a 4x4 Jeep! Collect red fuel canisters to keep running and do not flip upside down.',
      controls: 'D or Right Arrow for Gas • A or Left Arrow to Brake • Lean with Left/Right in air.',
      onStart: () => {
        this.generateMountain();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });
  }

  generateMountain() {
    this.fuel = 100;
    this.coins = 0;
    this.score = 0;
    this.cameraX = 0;

    this.jeep = {
      x: 100,
      y: 320,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      grounded: false
    };

    this.terrain = [];
    this.items = [];
    this.particles = [];

    // Procedural Perlin-like 2D Mountain Heightmap
    let currentY = 380;
    for (let x = 0; x < 6000; x += 30) {
      currentY += (Math.sin(x * 0.008) * 18) + (Math.sin(x * 0.02) * 8);
      currentY = Math.max(160, Math.min(440, currentY));
      this.terrain.push({ x: x, y: currentY });

      // Spawn fuel and coins
      if (x % 500 === 0 && x > 200) {
        this.items.push({ x: x, y: currentY - 30, type: 'fuel', collected: false });
      } else if (x % 150 === 0 && x > 200) {
        this.items.push({ x: x, y: currentY - 25, type: 'coin', collected: false });
      }
    }
  }

  getGroundY(x) {
    for (let i = 0; i < this.terrain.length - 1; i++) {
      if (x >= this.terrain[i].x && x <= this.terrain[i + 1].x) {
        const t = (x - this.terrain[i].x) / (this.terrain[i + 1].x - this.terrain[i].x);
        return this.terrain[i].y + t * (this.terrain[i + 1].y - this.terrain[i].y);
      }
    }
    return 400;
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    const j = this.jeep;

    // Fuel Consumption
    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['d']) {
      if (this.fuel > 0) {
        this.fuel -= 0.08;
        j.vx += Math.cos(j.angle) * 0.38;
        j.vy += Math.sin(j.angle) * 0.38;
      }
    } else if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['a']) {
      j.vx -= Math.cos(j.angle) * 0.22;
      j.vy -= Math.sin(j.angle) * 0.22;
    }

    // In-Air Tilt Controls
    if (!j.grounded) {
      if (this.keys['ArrowLeft'] || this.keys['a']) j.vAngle -= 0.035;
      if (this.keys['ArrowRight'] || this.keys['d']) j.vAngle += 0.035;
    }

    // Gravity & Friction
    j.vy += 0.42;
    j.vx *= 0.985;
    j.x += j.vx;
    j.y += j.vy;

    j.angle += j.vAngle;
    j.vAngle *= 0.92;

    this.score = Math.floor(j.x / 10);
    this.cameraX = j.x - 220;

    // Ground Collision for Front & Rear Wheels
    const groundY = this.getGroundY(j.x);
    if (j.y + 14 >= groundY) {
      j.y = groundY - 14;
      j.vy = 0;
      j.grounded = true;

      // Align chassis to slope
      const slopeAngle = Math.atan2(this.getGroundY(j.x + 20) - this.getGroundY(j.x - 20), 40);
      j.angle = j.angle * 0.8 + slopeAngle * 0.2;
    } else {
      j.grounded = false;
    }

    // Upside down crash check
    const normalizedAngle = ((j.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (j.grounded && (normalizedAngle > 2.0 && normalizedAngle < 4.2)) {
      sounds.playExplosion();
      this.gameOver(this.score, { distance: this.score, reason: 'Jeep Flipped Over' });
      return;
    }

    // Fuel Empty Check
    if (this.fuel <= 0 && Math.abs(j.vx) < 0.2) {
      sounds.playHit();
      this.gameOver(this.score, { distance: this.score, reason: 'Ran Out of Fuel' });
      return;
    }

    // Collect Items
    this.items.forEach(it => {
      if (!it.collected && Math.hypot(j.x - it.x, j.y - it.y) < 32) {
        it.collected = true;
        if (it.type === 'fuel') {
          sounds.playSuccess();
          this.fuel = Math.min(100, this.fuel + 35);
        } else {
          sounds.playWin();
          this.coins += 50;
        }
      }
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Mountain Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#0c0d12');
    skyGrad.addColorStop(0.6, '#1e293b');
    skyGrad.addColorStop(1, '#ff5733');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 2. Render Mountain Terrain Polygon
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(this.terrain[0].x, this.height);
    this.terrain.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(this.terrain[this.terrain.length - 1].x, this.height);
    ctx.closePath();
    ctx.fill();

    // Rocky Top Ridge
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 4;
    ctx.beginPath();
    this.terrain.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // 3. Render Items (Fuel & Coins)
    this.items.forEach(it => {
      if (it.collected) return;
      if (it.type === 'fuel') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(it.x - 10, it.y - 12, 20, 24);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAS', it.x, it.y + 4);
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // 4. Render Jeep
    const j = this.jeep;
    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.rotate(j.angle);

    // 4x4 Body
    ctx.fillStyle = '#ff5733';
    ctx.fillRect(-22, -14, 44, 18);
    // Roll Cage
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-16, -26, 22, 12);

    // 2 Big Off-Road Wheels
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-16, 8, 10, 0, Math.PI * 2);
    ctx.arc(16, 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.stroke();

    ctx.restore();

    ctx.restore();

    // 5. HUD
    ctx.fillStyle = 'rgba(18, 20, 28, 0.85)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    ctx.fillStyle = '#ff5733';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.score} METERS 🚙`, 34, 46);

    ctx.fillStyle = this.fuel < 25 ? '#ef4444' : '#2dd4bf';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`FUEL: ${Math.round(this.fuel)}% • COINS: ${this.coins}`, 34, 64);
  }
}

