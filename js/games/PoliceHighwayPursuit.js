/* ====================================================
   POLICE HIGHWAY PURSUIT — GAMINGZONE
   High-Speed Highway Interceptor with Flashing Lightbars,
   PIT Maneuver Takedowns, Nitro Tanks & Civilian Traffic
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PoliceHighwayPursuitGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Police Highway Pursuit',
      targetScore: 2000,
      takedowns: 5,
      ...config
    });

    this.takedownsLeft = this.config.takedowns || 5;
    this.totalTakedowns = 0;
    this.roadX = 140;
    this.roadW = 440;

    // Police Cruiser
    this.police = {
      x: 360,
      y: 430,
      width: 44,
      height: 74,
      speed: 380,
      sirenTimer: 0,
      nitro: 100
    };

    this.traffic = [];
    this.particles = [];
    this.roadScroll = 0;
    this.spawnTimer = 0;

    this.keys = { left: false, right: false, nitro: false };

    this.createCanvas(720, 560);
    this.initPoliceControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
      },
      actionLabel: 'NITRO',
      onAction: (pressed) => {
        this.keys.nitro = pressed;
      }
    });

    this.showStartCard({
      title: 'POLICE HIGHWAY PURSUIT',
      icon: '🚔',
      objective: `Perform PIT maneuvers on ${this.takedownsLeft} red getaway vehicles while avoiding civilian commuter traffic!`,
      controls: 'A/D or Left/Right Arrow to steer. Space or Nitro button to accelerate.',
      onStart: () => this.start()
    });
  }

  initPoliceControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.code === 'Space' || e.key === ' ') {
        this.keys.nitro = true;
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
      if (e.code === 'Space' || e.key === ' ') this.keys.nitro = false;
    });

    // Touch Drag
    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const mx = (e.clientX - rect.left) * scaleX;
      this.police.x = Math.max(this.roadX + 24, Math.min(this.roadX + this.roadW - 24, mx));
    });
  }

  spawnTrafficCar() {
    const lanes = [this.roadX + 50, this.roadX + 150, this.roadX + 270, this.roadX + 370];
    const laneX = lanes[Math.floor(Math.random() * lanes.length)];
    const isSuspect = Math.random() < 0.4;

    this.traffic.push({
      x: laneX,
      y: -90,
      width: 42,
      height: 70,
      vy: isSuspect ? 260 : 180,
      isSuspect,
      color: isSuspect ? '#ef4444' : ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 4)],
      hp: isSuspect ? 2 : 1,
      spinAngle: 0,
      spinning: false
    });
  }

  update(dt) {
    // Siren flashing timer
    this.police.sirenTimer += dt * 8;

    // Movement & Nitro
    let speedMult = 1.0;
    if (this.keys.nitro && this.police.nitro > 0) {
      speedMult = 1.45;
      this.police.nitro = Math.max(0, this.police.nitro - 25 * dt);
      if (Math.random() < 0.3) {
        this.particles.push({
          x: this.police.x + (Math.random() - 0.5) * 16,
          y: this.police.y + this.police.height,
          vx: (Math.random() - 0.5) * 30,
          vy: 80,
          color: '#00e5ff',
          life: 0.25
        });
      }
    } else {
      this.police.nitro = Math.min(100, this.police.nitro + 10 * dt);
    }

    if (this.keys.left) this.police.x = Math.max(this.roadX + 24, this.police.x - 320 * dt);
    if (this.keys.right) this.police.x = Math.min(this.roadX + this.roadW - 24, this.police.x + 320 * dt);

    // Highway road scroll
    this.roadScroll = (this.roadScroll + 480 * speedMult * dt) % 60;
    this.score += Math.round(15 * speedMult * dt);

    // Spawning Traffic
    this.spawnTimer += dt;
    if (this.spawnTimer >= 0.85) {
      this.spawnTimer = 0;
      this.spawnTrafficCar();
    }

    // Update Traffic Vehicles
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];

      if (car.spinning) {
        car.spinAngle += 14 * dt;
        car.x += (car.spinAngle > 0 ? 1 : -1) * 120 * dt;
        car.y += 180 * dt;
      } else {
        car.y += (car.vy - (480 * speedMult - 300)) * dt;
      }

      // Check Collision with Police Cruiser
      if (
        !car.spinning &&
        this.police.x - this.police.width / 2 < car.x + car.width / 2 &&
        this.police.x + this.police.width / 2 > car.x - car.width / 2 &&
        this.police.y < car.y + car.height &&
        this.police.y + this.police.height > car.y
      ) {
        if (car.isSuspect) {
          // PIT maneuver takedown!
          car.hp--;
          sounds.playHit();
          this.spawnBurst(car.x, car.y, '#ffd166', 14);

          if (car.hp <= 0) {
            car.spinning = true;
            this.totalTakedowns++;
            this.takedownsLeft--;
            this.score += 400;
            sounds.playWin();

            if (this.takedownsLeft <= 0) {
              this.finishGame(this.score, { isVictory: true, takedowns: this.totalTakedowns });
              return;
            }
          }
        } else {
          // Crashed into civilian car!
          sounds.playHit();
          this.score = Math.max(0, this.score - 150);
          this.spawnBurst(this.police.x, this.police.y, '#ef4444', 16);
          car.spinning = true;
        }
      }

      // Offscreen despawn
      if (car.y > this.baseHeight + 100 || car.y < -150) {
        this.traffic.splice(i, 1);
      }
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
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Green Grass Verge Background
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Asphalt Expressway (4 Lanes)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.roadX, 0, this.roadW, this.baseHeight);

    // Solid Shoulder Lines (Yellow)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.roadX + 4, 0);
    ctx.lineTo(this.roadX + 4, this.baseHeight);
    ctx.moveTo(this.roadX + this.roadW - 4, 0);
    ctx.lineTo(this.roadX + this.roadW - 4, this.baseHeight);
    ctx.stroke();

    // Dashed White Lane Dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([24, 20]);
    ctx.lineDashOffset = -this.roadScroll;

    for (let lane = 1; lane < 4; lane++) {
      const lx = this.roadX + lane * (this.roadW / 4);
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, this.baseHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Traffic Cars
    this.traffic.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y + c.height / 2);
      if (c.spinning) ctx.rotate(c.spinAngle);

      // Chassis
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.roundRect(-c.width / 2, -c.height / 2, c.width, c.height, 6);
      ctx.fill();
      ctx.strokeStyle = '#0a0e17';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-c.width / 2 + 4, -c.height / 2 + 16, c.width - 8, 12);

      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-c.width / 2 + 3, c.height / 2 - 4, 8, 3);
      ctx.fillRect(c.width / 2 - 11, c.height / 2 - 4, 8, 3);

      ctx.restore();
    });

    // Draw Police Cruiser
    const px = this.police.x;
    const py = this.police.y;
    const pw = this.police.width;
    const ph = this.police.height;

    // Cruiser Body (Black and White Interceptor)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(px - pw / 2, py, pw, ph, 8);
    ctx.fill();
    ctx.strokeStyle = '#0a0e17';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Black Hood & Trunk
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - pw / 2, py, pw, 18);
    ctx.fillRect(px - pw / 2, py + ph - 16, pw, 16);

    // Flashing Emergency Lightbar (Red on Left, Blue on Right)
    const isSirenRed = Math.floor(this.police.sirenTimer) % 2 === 0;
    ctx.fillStyle = isSirenRed ? '#ef4444' : '#00e5ff';
    ctx.fillRect(px - 14, py + 26, 12, 6);

    ctx.fillStyle = isSirenRed ? '#00e5ff' : '#ef4444';
    ctx.fillRect(px + 2, py + 26, 12, 6);

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🚔 TAKEDOWNS: ${this.totalTakedowns}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`NITRO: ${Math.round(this.police.nitro)}%`, this.baseWidth - 24, 34);
  }
}
