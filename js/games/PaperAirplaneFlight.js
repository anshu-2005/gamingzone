/* ====================================================
   PAPER AIRPLANE FLIGHT — AERODYNAMIC GLIDER ADVENTURE
   Thermals, Golden Speed Boost Rings, Parallax Clouds,
   Altitude Management, Flight Upgrades & Full Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PaperAirplaneFlightGame extends GameEngineBase {
  constructor(container, onGameOver, config = {}) {
    super(container, onGameOver, Object.assign({
      title: 'Paper Airplane Glider',
      targetScore: 2500
    }, config));

    this.baseWidth = 720;
    this.baseHeight = 480;
    this.createCanvas(this.baseWidth, this.baseHeight);

    this.distance = 0;
    this.highDistance = 0;
    this.fuel = 100;
    this.maxFuel = 100;
    this.boostActive = false;

    // Plane flight physics
    this.plane = {
      x: 160,
      y: 200,
      vx: 6,
      vy: 0,
      angle: 0,
      wingTilt: 0,
      trail: []
    };

    // World Elements (Thermals, Boost Rings, Birds, Clouds)
    this.rings = [];
    this.clouds = [];
    this.thermals = [];
    this.stars = [];
    this.particles = [];

    this.initWorld();
    this.initControls();

    this.showStartCard({
      title: 'Paper Airplane Flight',
      icon: '✈️',
      objective: 'Glide across scenic horizons! Ride golden booster rings and warm thermals to maximize your flight distance.',
      controls: '<b>Desktop:</b> Hold [SPACE] or [W/↑] to pitch up & boost • Release to glide down<br><b>Mobile:</b> Touch & Hold canvas to boost',
      onStart: () => {
        this.reset();
        this.start();
      }
    });
  }

  initWorld() {
    // Generate initial clouds
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * this.baseWidth * 2,
        y: 40 + Math.random() * 180,
        speed: 0.8 + Math.random() * 1.2,
        size: 30 + Math.random() * 40
      });
    }

    // Generate initial booster rings & thermals
    this.spawnWorldChunk(300);
  }

  spawnWorldChunk(startX) {
    for (let x = startX; x < startX + 1200; x += 180) {
      if (Math.random() < 0.6) {
        // Booster Ring
        this.rings.push({
          x,
          y: 80 + Math.random() * 260,
          radius: 26,
          collected: false
        });
      } else if (Math.random() < 0.4) {
        // Thermal Lift Column
        this.thermals.push({
          x,
          y: 200 + Math.random() * 150,
          width: 50,
          height: 180,
          lift: -4.5
        });
      }

      // Collectible Stars
      if (Math.random() < 0.5) {
        this.stars.push({
          x: x + 90,
          y: 70 + Math.random() * 280,
          collected: false
        });
      }
    }
  }

  initControls() {
    const handleBoost = (active) => {
      if (this.state !== GameState.PLAYING) return;
      this.boostActive = active;
      if (active && this.fuel > 0) {
        sounds.playPowerup();
      }
    };

    // Pointer events on canvas
    this.addListener(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      handleBoost(true);
    });
    this.addListener(this.canvas, 'pointerup', (e) => {
      e.preventDefault();
      handleBoost(false);
    });
    this.addListener(this.canvas, 'pointercancel', (e) => {
      e.preventDefault();
      handleBoost(false);
    });

    // Keyboard events
    this.addListener(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleBoost(true);
      }
    });
    this.addListener(window, 'keyup', (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleBoost(false);
      }
    });
  }

  reset() {
    this.plane.x = 160;
    this.plane.y = 180;
    this.plane.vx = 7;
    this.plane.vy = -1;
    this.plane.angle = 0;
    this.plane.trail = [];
    this.distance = 0;
    this.fuel = this.maxFuel;
    this.boostActive = false;
    this.rings = [];
    this.thermals = [];
    this.stars = [];
    this.particles = [];
    this.spawnWorldChunk(400);
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Boost & Aerodynamics
    if (this.boostActive && this.fuel > 0) {
      this.plane.vy -= 12 * dt;
      this.plane.vx = Math.min(13, this.plane.vx + 6 * dt);
      this.fuel = Math.max(0, this.fuel - 28 * dt);
      this.spawnExhaust(this.plane.x - 20, this.plane.y);
    } else {
      // Natural Gliding Gravity
      this.plane.vy += 8.5 * dt;
      this.plane.vx = Math.max(5.5, this.plane.vx - 1.2 * dt);
      // Gentle fuel recharge on glide
      this.fuel = Math.min(this.maxFuel, this.fuel + 10 * dt);
    }

    // Terminal velocity clamp
    this.plane.vy = Math.max(-8, Math.min(8.5, this.plane.vy));
    this.plane.y += this.plane.vy * 40 * dt;
    this.plane.angle = Math.atan2(this.plane.vy, this.plane.vx) * 0.7;

    // Advance Distance
    const distDelta = Math.round(this.plane.vx * 35 * dt);
    this.distance += distDelta;
    this.score = this.distance;

    // Trail
    this.plane.trail.push({ x: this.plane.x - 20, y: this.plane.y, alpha: 0.8 });
    if (this.plane.trail.length > 25) this.plane.trail.shift();

    // Scroll World based on forward speed
    const scrollX = this.plane.vx * 40 * dt;
    this.rings.forEach(r => r.x -= scrollX);
    this.thermals.forEach(t => t.x -= scrollX);
    this.stars.forEach(s => s.x -= scrollX);
    this.clouds.forEach(c => c.x -= scrollX * 0.4);

    // Clean passed world elements
    this.rings = this.rings.filter(r => r.x > -60);
    this.thermals = this.thermals.filter(t => t.x > -100);
    this.stars = this.stars.filter(s => s.x > -60);
    this.clouds.forEach(c => {
      if (c.x < -120) c.x = this.baseWidth + 80 + Math.random() * 200;
    });

    // Check Chunk Generation
    const lastRingX = this.rings.length > 0 ? this.rings[this.rings.length - 1].x : 0;
    if (lastRingX < this.baseWidth + 300) {
      this.spawnWorldChunk(lastRingX + 200);
    }

    // Collision with Booster Rings
    for (const ring of this.rings) {
      if (!ring.collected && Math.hypot(this.plane.x - ring.x, this.plane.y - ring.y) < ring.radius + 15) {
        ring.collected = true;
        this.plane.vx = 14; // Speed boost!
        this.plane.vy = -3.5;
        this.fuel = Math.min(this.maxFuel, this.fuel + 40);
        sounds.playPowerup();
        this.spawnBurst(ring.x, ring.y, '#ffd166');
      }
    }

    // Collision with Thermals (Warm Updraft)
    for (const th of this.thermals) {
      if (this.plane.x >= th.x && this.plane.x <= th.x + th.width &&
          this.plane.y >= th.y - th.height && this.plane.y <= th.y) {
        this.plane.vy = th.lift;
        this.plane.angle = -0.3;
      }
    }

    // Collect Stars
    for (const s of this.stars) {
      if (!s.collected && Math.hypot(this.plane.x - s.x, this.plane.y - s.y) < 24) {
        s.collected = true;
        this.distance += 150;
        sounds.playCoin();
        this.spawnBurst(s.x, s.y, '#ffd166');
      }
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Ceiling clamp
    if (this.plane.y < 30) {
      this.plane.y = 30;
      this.plane.vy = 1;
    }

    // Ground Crash (Touchdown)
    if (this.plane.y >= this.baseHeight - 55) {
      this.plane.y = this.baseHeight - 55;
      sounds.playHit();
      this.finishGame(this.distance, {
        isVictory: this.distance >= 1500,
        stars: this.distance >= 3000 ? 3 : (this.distance >= 1500 ? 2 : 1),
        coinsEarned: Math.round(this.distance * 0.08)
      });
    }
  }

  spawnExhaust(x, y) {
    this.particles.push({
      x,
      y,
      vx: -Math.random() * 3 - 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 4 + 2,
      color: '#00e5ff',
      alpha: 0.8
    });
  }

  spawnBurst(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: Math.random() * 4 + 3,
        color,
        alpha: 1
      });
    }
  }

  render(ctx) {
    // Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    sky.addColorStop(0, '#0284c7');
    sky.addColorStop(0.5, '#38bdf8');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (const c of this.clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.6, c.y - c.size * 0.2, c.size * 0.7, 0, Math.PI * 2);
      ctx.arc(c.x - c.size * 0.6, c.y, c.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thermals (Swirling Updrafts)
    for (const th of this.thermals) {
      const grad = ctx.createLinearGradient(th.x, th.y, th.x, th.y - th.height);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(th.x, th.y - th.height, th.width, th.height);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillText('▲ LIFT', th.x + 4, th.y - 20);
    }

    // Booster Rings
    for (const ring of this.rings) {
      if (ring.collected) continue;
      ctx.save();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Ring pulse
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius - 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Collectible Stars
    for (const s of this.stars) {
      if (s.collected) continue;
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.font = '22px sans-serif';
      ctx.fillText('⭐', s.x - 11, s.y + 8);
      ctx.restore();
    }

    // Vapor Trail
    for (let i = 0; i < this.plane.trail.length; i++) {
      const pt = this.plane.trail[i];
      pt.x -= 2;
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha * (i / this.plane.trail.length)})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Ground Hills & Grass
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, this.baseHeight - 50, this.baseWidth, 50);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, this.baseHeight - 55, this.baseWidth, 8);

    // Draw Origami Paper Airplane
    ctx.save();
    ctx.translate(this.plane.x, this.plane.y);
    ctx.rotate(this.plane.angle);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 8;

    // Folded Paper Wings
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(28, 0); // Nose tip
    ctx.lineTo(-24, -14); // Left wingtip
    ctx.lineTo(-12, 0); // Keel fold
    ctx.closePath();
    ctx.fill();

    // Bottom wing fold
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(-24, 14); // Right wingtip
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();

    // Center crease line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(-24, 0);
    ctx.stroke();

    ctx.restore();

    // HUD Display
    this.renderHUD(ctx);
  }

  renderHUD(ctx) {
    // Distance Counter Banner
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(20, 16, 260, 48);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 16, 260, 48);

    ctx.font = '900 24px Lilita One, Outfit, sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`${this.distance} M`, 34, 48);

    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('DISTANCE GLIDED', 34, 30);

    // Boost/Fuel Meter
    const fuelX = this.baseWidth - 200;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(fuelX, 16, 180, 24);
    ctx.fillStyle = this.fuel > 25 ? '#00e5ff' : '#f43f5e';
    ctx.fillRect(fuelX + 2, 18, (this.fuel / this.maxFuel) * 176, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(fuelX, 16, 180, 24);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText('🚀 BOOST STAMINA', fuelX + 10, 32);

    ctx.restore();
  }
}
