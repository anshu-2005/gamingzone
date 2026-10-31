/* ====================================================
   CYBER CAR DRIFT — GAMINGZONE
   Top-Down Neon Grand Prix Circuit with Lateral Slip Angles,
   Countersteering, Tire Burnout Smoke, Drift Multipliers & Touch
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CyberCarDriftGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Cyber Car Drift',
      targetScore: 2500,
      timeLimit: 50,
      ...config
    });

    this.car = {
      x: 360,
      y: 440,
      angle: 0,
      speed: 0,
      maxSpeed: 380,
      accel: 280,
      friction: 0.965,
      steerAngle: 0,
      isDrifting: false
    };

    this.driftPoints = 0;
    this.driftMultiplier = 1;
    this.laps = 1;

    this.skidMarks = [];
    this.particles = [];
    this.coins = [];
    this.keys = { left: false, right: false, up: false, down: false, handbrake: false };

    this.createCanvas(720, 540);
    this.initTrackItems();
    this.initDriftControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
        if (dir === 'UP') this.keys.up = pressed;
        if (dir === 'DOWN') this.keys.down = pressed;
      },
      actionLabel: 'HANDBRAKE',
      onAction: (pressed) => {
        this.keys.handbrake = pressed;
      }
    });

    this.showStartCard({
      title: 'CYBER CAR DRIFT',
      icon: '🏎️',
      objective: 'Drift through the illuminated neon corners to rack up massive multiplier points before time runs out!',
      controls: 'W/Up Arrow = Gas, S/Down = Brake, A/D = Steer, Space = Handbrake Drift.',
      onStart: () => this.start()
    });
  }

  initTrackItems() {
    this.coins = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      this.coins.push({
        x: this.baseWidth / 2 + Math.cos(angle) * 230,
        y: this.baseHeight / 2 + Math.sin(angle) * 160,
        collected: false
      });
    }
  }

  initDriftControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
      if (e.code === 'Space' || e.key === ' ') {
        this.keys.handbrake = true;
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
      if (e.code === 'Space' || e.key === ' ') this.keys.handbrake = false;
    });
  }

  update(dt) {
    // Throttle & Brakes
    if (this.keys.up) {
      this.car.speed = Math.min(this.car.maxSpeed, this.car.speed + this.car.accel * dt);
    } else if (this.keys.down) {
      this.car.speed = Math.max(-120, this.car.speed - 360 * dt);
    } else {
      this.car.speed *= Math.pow(this.car.friction, dt * 60);
    }

    // Steering & Lateral Slip
    if (Math.abs(this.car.speed) > 10) {
      const turnRate = this.keys.handbrake ? 4.2 : 2.8;
      if (this.keys.left) this.car.angle -= turnRate * dt;
      if (this.keys.right) this.car.angle += turnRate * dt;
    }

    // Handbrake Drifting
    const isDrifting = this.keys.handbrake && Math.abs(this.car.speed) > 120;
    this.car.isDrifting = isDrifting;

    if (isDrifting) {
      this.driftPoints += 60 * dt;
      this.driftMultiplier = Math.min(5, this.driftMultiplier + dt * 0.4);
      this.score += Math.round(40 * this.driftMultiplier * dt);

      // Burnout smoke particles
      if (Math.random() < 0.5) {
        this.particles.push({
          x: this.car.x - Math.cos(this.car.angle) * 16,
          y: this.car.y - Math.sin(this.car.angle) * 16,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          color: '#00e5ff',
          life: 0.3
        });
      }
    } else {
      this.driftMultiplier = Math.max(1, this.driftMultiplier - dt * 0.8);
    }

    // Position updates
    this.car.x += Math.cos(this.car.angle) * this.car.speed * dt;
    this.car.y += Math.sin(this.car.angle) * this.car.speed * dt;

    // Track Boundary Bounces
    const minX = 40;
    const maxX = this.baseWidth - 40;
    const minY = 70;
    const maxY = this.baseHeight - 30;

    if (this.car.x < minX || this.car.x > maxX || this.car.y < minY || this.car.y > maxY) {
      this.car.speed = -this.car.speed * 0.5;
      sounds.playHit();
      this.car.x = Math.max(minX, Math.min(maxX, this.car.x));
      this.car.y = Math.max(minY, Math.min(maxY, this.car.y));
    }

    // Check Coin Pickups
    this.coins.forEach(c => {
      if (!c.collected && Math.hypot(this.car.x - c.x, this.car.y - c.y) < 28) {
        c.collected = true;
        this.score += 80;
        sounds.playCoin();
      }
    });

    // Time Limit Countdown
    if (this.timeLeft > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore });
      }
    }

    // Check Victory
    if (this.score >= this.config.targetScore) {
      sounds.playWin();
      this.finishGame(this.score, { isVictory: true });
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

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Neon Circuit Arena
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Outer Asphalt Oval Track
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(this.baseWidth / 2, this.baseHeight / 2 + 15, 300, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Infield Grass Island
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.ellipse(this.baseWidth / 2, this.baseHeight / 2 + 15, 170, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red & White Kerb Borders
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(this.baseWidth / 2, this.baseHeight / 2 + 15, 300, 200, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffd166';
    ctx.beginPath();
    ctx.ellipse(this.baseWidth / 2, this.baseHeight / 2 + 15, 170, 110, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Checkered Start / Finish Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(this.baseWidth / 2, 415);
    ctx.lineTo(this.baseWidth / 2, 515);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Coins
    this.coins.forEach(c => {
      if (!c.collected) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Draw Smoke Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Drift Car
    ctx.save();
    ctx.translate(this.car.x, this.car.y);
    ctx.rotate(this.car.angle);

    // Car Chassis (Cyan Supercar)
    ctx.fillStyle = this.car.isDrifting ? '#ff007f' : '#00e5ff';
    ctx.beginPath();
    ctx.roundRect(-22, -12, 44, 24, 6);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -8, 16, 16);

    // Headlights
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(20, -10, 3, 5);
    ctx.fillRect(20, 5, 3, 5);

    ctx.restore();

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🏎️ DRIFT: ${Math.round(this.driftMultiplier * 10) / 10}x 🔥`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.timeLeft < 10 ? '#ef4444' : '#10b981';
    ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)}s`, this.baseWidth - 24, 34);
  }
}
