/* ====================================================
   RACING WORLD 3D TURBO — HIGH SPEED HIGHWAY TRACK
   Inspired by VladimirBalun/RacingWorld (3D Racing Game)
   Pseudo-3D perspective road curves, rival supercar traffic,
   nitro boosts, checkpoint gates, and 300+ km/h speedometers!
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class RacingWorld3DGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Racing World 3D Turbo',
      targetScore: 5000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.playerX = 0; // -1 to 1 across road
    this.speed = 0;
    this.maxSpeed = 320;
    this.accel = 180;
    this.nitro = 100;
    this.isNitro = false;
    this.roadPosition = 0;
    this.curve = 0;
    this.targetCurve = 0;
    this.curveTimer = 0;

    this.traffic = [];
    this.particles = [];
    this.checkpointTime = 40;
    this.keys = {};

    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys['ArrowLeft'] = pressed;
        if (dir === 'RIGHT') this.keys['ArrowRight'] = pressed;
        if (dir === 'UP') this.keys['ArrowUp'] = pressed;
        if (dir === 'DOWN') this.keys['ArrowDown'] = pressed;
      },
      onAction: (pressed) => {
        this.isNitro = pressed;
      },
      actionLabel: '🔥 NITRO',
      showDpad: true
    });

    this.showStartCard({
      title: 'RACING WORLD 3D TURBO',
      icon: '🏎️',
      objective: 'Overtake rival supercars, hit checkpoints before time expires, and ignite Nitro for top speed!',
      controls: 'WASD / Arrows to Steer & Accelerate • SPACE for Nitro Boost'
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.isNitro = true;
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
      if (e.code === 'Space') {
        this.isNitro = false;
      }
    });
  }

  spawnTraffic() {
    const lanes = [-0.6, -0.2, 0.2, 0.6];
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#a855f7'];
    this.traffic.push({
      x: lanes[Math.floor(Math.random() * lanes.length)],
      z: 1000,
      speed: 120 + Math.random() * 80,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Checkpoint countdown
    this.checkpointTime -= dt;
    if (this.checkpointTime <= 0) {
      sounds.playCrash?.();
      this.finishGame(this.score, { reason: 'Time Out: Missed Checkpoint Gate' });
      return;
    }

    // Steering
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.playerX -= 1.6 * dt;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.playerX += 1.6 * dt;
    }
    this.playerX = Math.max(-0.95, Math.min(0.95, this.playerX));

    // Acceleration & Nitro
    let targetSpeed = 220;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      targetSpeed = 280;
    }
    if (this.isNitro && this.nitro > 0) {
      targetSpeed = 380;
      this.nitro = Math.max(0, this.nitro - 35 * dt);
      sounds.playJump?.();

      // Nitro exhaust flame particles
      for (let p = 0; p < 3; p++) {
        this.particles.push({
          x: this.baseWidth / 2 + this.playerX * 220 + (Math.random() - 0.5) * 20,
          y: 460,
          vx: (Math.random() - 0.5) * 40,
          vy: 80 + Math.random() * 80,
          life: 0.2,
          maxLife: 0.2,
          color: '#00e5ff'
        });
      }
    } else {
      this.nitro = Math.min(100, this.nitro + 12 * dt);
    }

    if (this.speed < targetSpeed) this.speed += this.accel * dt;
    else this.speed -= this.accel * 0.8 * dt;

    this.roadPosition += this.speed * dt;
    this.score += Math.round(this.speed * dt * 0.15);

    // Road curve dynamics
    this.curveTimer -= dt;
    if (this.curveTimer <= 0) {
      this.curveTimer = 3 + Math.random() * 4;
      this.targetCurve = (Math.random() - 0.5) * 1.8;
    }
    this.curve += (this.targetCurve - this.curve) * 2 * dt;

    // Traffic spawner
    if (Math.random() < 0.035 && this.traffic.length < 6) {
      this.spawnTraffic();
    }

    // Move Traffic
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      car.z -= (this.speed - car.speed) * dt * 2;

      // Collision check
      if (car.z < 80 && car.z > -40) {
        if (Math.abs(this.playerX - car.x) < 0.28) {
          sounds.playCrash?.();
          this.speed = 80;
          this.score = Math.max(0, this.score - 200);
          this.traffic.splice(i, 1);
          continue;
        }
      }

      if (car.z < -100) {
        this.traffic.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Horizon & Sky
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, w, h * 0.45);

    // Distant mountain ridge
    ctx.fillStyle = '#075985';
    ctx.beginPath();
    ctx.arc(200, h * 0.45 + 50, 180, 0, Math.PI * 2);
    ctx.arc(600, h * 0.45 + 80, 240, 0, Math.PI * 2);
    ctx.fill();

    // Road Ground (Grass sides)
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    // 3D Perspective Road scanlines
    const horizonY = h * 0.45;
    const roadBottomW = w * 0.82;
    const roadTopW = w * 0.06;

    for (let y = horizonY; y < h; y += 4) {
      const percent = (y - horizonY) / (h - horizonY);
      const roadW = roadTopW + (roadBottomW - roadTopW) * percent;
      const roadCenter = w / 2 + this.curve * (1 - percent) * 160;

      // Asphalt
      ctx.fillStyle = Math.floor((this.roadPosition + y) / 24) % 2 === 0 ? '#1e293b' : '#334155';
      ctx.fillRect(roadCenter - roadW / 2, y, roadW, 4);

      // Rumble Strips
      const rumbleW = roadW * 0.08;
      ctx.fillStyle = Math.floor((this.roadPosition + y) / 24) % 2 === 0 ? '#ef4444' : '#ffffff';
      ctx.fillRect(roadCenter - roadW / 2 - rumbleW, y, rumbleW, 4);
      ctx.fillRect(roadCenter + roadW / 2, y, rumbleW, 4);
    }

    // Render Traffic
    for (const car of this.traffic) {
      if (car.z <= 0) continue;
      const percent = (1000 - car.z) / 1000;
      if (percent < 0 || percent > 1) continue;

      const y = horizonY + (h - horizonY) * percent;
      const roadW = roadTopW + (roadBottomW - roadTopW) * percent;
      const roadCenter = w / 2 + this.curve * (1 - percent) * 160;
      const x = roadCenter + car.x * (roadW / 2);
      const carScale = 16 + 50 * percent;

      ctx.fillStyle = car.color;
      ctx.fillRect(x - carScale / 2, y - carScale * 0.6, carScale, carScale * 0.6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - carScale / 2 + 2, y - 4, carScale * 0.3, 3);
      ctx.fillRect(x + carScale / 2 - carScale * 0.3 - 2, y - 4, carScale * 0.3, 3);
    }

    // Nitro exhaust particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Supercar
    const pX = w / 2 + this.playerX * (roadBottomW / 2.3);
    const pY = h - 70;
    const pW = 86;
    const pH = 44;

    ctx.save();
    ctx.fillStyle = '#00e5ff'; // Neon Cyber Turquoise Supercar
    ctx.fillRect(pX - pW / 2, pY, pW, pH);
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(pX - pW / 2 + 12, pY + 6, pW - 24, pH - 18);

    // Taillights
    ctx.fillStyle = '#ff0033';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 8;
    ctx.fillRect(pX - pW / 2 + 4, pY + pH - 8, 22, 6);
    ctx.fillRect(pX + pW / 2 - 26, pY + pH - 8, 22, 6);
    ctx.restore();

    // Top Speedometer & HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 52);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillText(`${Math.round(this.speed)} KM/H`, 24, 34);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score}`, 220, 34);

    ctx.fillStyle = this.checkpointTime < 10 ? '#ef4444' : '#10b981';
    ctx.fillText(`TIME: ⏱️ ${Math.ceil(this.checkpointTime)}s`, 420, 34);

    // Nitro Bar
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('NITRO', 600, 34);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(660, 22, 140, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(660, 22, 140 * (this.nitro / 100), 12);
  }
}

export default RacingWorld3DGame;

