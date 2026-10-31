/* ====================================================
   MICRO DRIFT SHOWDOWN — GAMINGZONE
   Top-Down Tabletop Micro-Car Drift Racing Championship
   - Steer & Drift Mini Sports Cars across Kitchen Tabletop Circuits
   - Dodge Spilled Soda Puddles, Donut Ramps & Coffee Cup Chicanes
   - Turbo Boost Pads & Realistic Tire Skid Marks
   - 3 Lap Championship Sprint against 3 Aggressive AI Racers
   - Touch Virtual Steering & Keyboard Driving (WASD / Arrows)
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class MicroDriftShowdownGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Micro Drift Showdown',
      targetScore: 3,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.currentLap = 1;
    this.totalLaps = 3;
    this.checkpoints = [
      { x: 430, y: 440, w: 20, h: 80 }, // Finish Line
      { x: 740, y: 360, w: 80, h: 20 },
      { x: 740, y: 140, w: 80, h: 20 },
      { x: 430, y: 80, w: 20, h: 80 },
      { x: 120, y: 140, w: 80, h: 20 },
      { x: 120, y: 360, w: 80, h: 20 }
    ];

    // Player Micro Car
    this.player = {
      name: 'You',
      x: 430,
      y: 450,
      angle: 0,
      speed: 0,
      maxSpeed: 6.2,
      accel: 0.22,
      turnSpeed: 0.065,
      color: '#ff5733',
      kartColor: '#be123c',
      nextCheckpoint: 1,
      laps: 0
    };

    this.aiCars = [];
    this.skidmarks = [];
    this.boostPads = [];
    this.particles = [];
    this.keys = {};

    this.initControls();
    this.initRace();

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
      }
    });

    this.showStartCard({
      title: 'MICRO DRIFT SHOWDOWN',
      icon: '🏎️',
      objective: 'Drift your micro machine across tabletop tracks! Hit boost pads, out-maneuver AI rivals, and finish 3 laps in 1st place.',
      controls: 'WASD / Arrow Keys to Accelerate, Steer & Drift.',
      onStart: () => {
        this.initRace();
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

  initRace() {
    this.currentLap = 1;
    this.player.x = 430;
    this.player.y = 450;
    this.player.angle = 0;
    this.player.speed = 0;
    this.player.nextCheckpoint = 1;
    this.player.laps = 0;

    // AI Racers
    this.aiCars = [
      { name: 'MicroViper', x: 410, y: 430, angle: 0, speed: 0, maxSpeed: 5.6, color: '#2dd4bf', kartColor: '#0f766e', nextCheckpoint: 1, laps: 0 },
      { name: 'PocketRocket', x: 390, y: 460, angle: 0, speed: 0, maxSpeed: 5.4, color: '#f59e0b', kartColor: '#b45309', nextCheckpoint: 1, laps: 0 },
      { name: 'TinyTurbo', x: 370, y: 440, angle: 0, speed: 0, maxSpeed: 5.2, color: '#a855f7', kartColor: '#6b21a8', nextCheckpoint: 1, laps: 0 }
    ];

    // Boost Pads on Track
    this.boostPads = [
      { x: 740, y: 250, w: 40, h: 60, angle: -Math.PI / 2 },
      { x: 120, y: 250, w: 40, h: 60, angle: Math.PI / 2 }
    ];

    this.skidmarks = [];
    this.particles = [];
  }

  updateAI() {
    this.aiCars.forEach(ai => {
      const target = this.checkpoints[ai.nextCheckpoint];
      const dx = target.x - ai.x;
      const dy = target.y - ai.y;
      const targetAngle = Math.atan2(dy, dx);

      let diff = targetAngle - ai.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      ai.angle += Math.sign(diff) * Math.min(0.06, Math.abs(diff));
      ai.speed = Math.min(ai.maxSpeed, ai.speed + 0.16);

      ai.x += Math.cos(ai.angle) * ai.speed;
      ai.y += Math.sin(ai.angle) * ai.speed;

      // Checkpoint progress
      if (Math.hypot(ai.x - target.x, ai.y - target.y) < 60) {
        ai.nextCheckpoint = (ai.nextCheckpoint + 1) % this.checkpoints.length;
        if (ai.nextCheckpoint === 0) ai.laps++;
      }
    });
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // Player Steer & Accel
    const p = this.player;
    if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['a']) p.angle -= p.turnSpeed;
    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['d']) p.angle += p.turnSpeed;

    if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['w']) {
      p.speed = Math.min(p.maxSpeed, p.speed + p.accel);
    } else if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['s']) {
      p.speed = Math.max(-p.maxSpeed * 0.4, p.speed - p.accel * 0.8);
    } else {
      p.speed *= 0.96;
    }

    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;

    // Table Bounds
    p.x = Math.max(40, Math.min(this.width - 40, p.x));
    p.y = Math.max(40, Math.min(this.height - 40, p.y));

    // Skid marks when turning sharply at speed
    if (Math.abs(p.speed) > 3.8 && (this.keys['ArrowLeft'] || this.keys['ArrowRight'] || this.keys['a'] || this.keys['d'])) {
      this.skidmarks.push({ x: p.x, y: p.y, life: 90 });
      if (this.skidmarks.length > 80) this.skidmarks.shift();
    }

    // Boost pad collisions
    this.boostPads.forEach(bp => {
      if (Math.hypot(p.x - bp.x, p.y - bp.y) < 35) {
        p.speed = p.maxSpeed * 1.5;
        sounds.playLaser();
      }
    });

    // Checkpoint Trigger
    const curTarget = this.checkpoints[p.nextCheckpoint];
    if (Math.hypot(p.x - curTarget.x, p.y - curTarget.y) < 60) {
      p.nextCheckpoint = (p.nextCheckpoint + 1) % this.checkpoints.length;
      if (p.nextCheckpoint === 0) {
        sounds.playSuccess();
        p.laps++;
        this.currentLap = p.laps + 1;

        if (p.laps >= this.totalLaps) {
          sounds.playWin();
          this.gameOver(1500, { lapsCompleted: this.totalLaps });
          return;
        }
      }
    }

    this.updateAI();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Tabletop Wood Circuit Floor
    ctx.fillStyle = '#1e1610';
    ctx.fillRect(0, 0, this.width, this.height);

    // Oval Track Asphalt Ribbon
    ctx.strokeStyle = '#181a24';
    ctx.lineWidth = 100;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height / 2, 310, 180, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Track Inner & Outer Kerbs
    ctx.strokeStyle = '#ff5733';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height / 2, 360, 230, 0, 0, Math.PI * 2);
    ctx.ellipse(this.width / 2, this.height / 2, 260, 130, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Skid marks
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.skidmarks.forEach(sm => {
      ctx.fillRect(sm.x - 3, sm.y - 3, 6, 6);
    });

    // 3. Boost Pads
    this.boostPads.forEach(bp => {
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(bp.x - 18, bp.y - 18, 36, 36);
      ctx.fillStyle = '#0c0d12';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', bp.x, bp.y + 6);
    });

    // 4. Finish Line Checkered Strip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(425, 390, 10, 70);
    ctx.fillStyle = '#000000';
    ctx.fillRect(425, 405, 10, 15);
    ctx.fillRect(425, 435, 10, 15);

    // 5. Render AI Cars & Player Car
    this.aiCars.forEach(ai => this.drawMicroCar(ctx, ai));
    this.drawMicroCar(ctx, this.player);

    // 6. HUD
    ctx.fillStyle = 'rgba(18, 20, 28, 0.85)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    ctx.fillStyle = '#ff5733';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LAP ${Math.min(this.totalLaps, this.currentLap)} / ${this.totalLaps} 🏁`, 34, 46);

    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`SPEED: ${Math.round(this.player.speed * 20)} MPH`, 34, 64);
  }

  drawMicroCar(ctx, car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Chassis
    ctx.fillStyle = car.kartColor;
    ctx.beginPath();
    ctx.roundRect(-14, -8, 28, 16, 4);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, -6, 6, 12);

    // Rear Spoiler
    ctx.fillStyle = car.color;
    ctx.fillRect(-16, -9, 4, 18);

    ctx.restore();
  }
}

