import { GameEngineBase } from '../core/GameEngineBase.js';

export class BusesFromHell extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Buses From Hell: Dodging Mayhem';
    this.score = 0;
    this.timeSurvived = 0;
    this.gameOver = false;

    this.player = {
      x: 500,
      y: 300,
      vx: 0,
      vy: 0,
      speed: 230,
      radius: 14
    };

    this.keys = { left: false, right: false, up: false, down: false };
    this.buses = [];
    this.warnings = [];
    this.tireTracks = [];
    this.spawnTimer = 1.0;
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
    });

    this.showStartCard(
      'BUSES FROM HELL',
      'The viral Counter-Strike minigame remake! High-speed buses charge across the arena! Watch for red warning laser lanes, dodge incoming buses with [WASD / Arrows], and survive as long as possible!',
      'SURVIVE THE TRAFFIC'
    );
  }

  restart() {
    this.score = 0;
    this.timeSurvived = 0;
    this.gameOver = false;
    this.player.x = 500;
    this.player.y = 300;
    this.buses = [];
    this.warnings = [];
    this.tireTracks = [];
    this.spawnTimer = 1.0;
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    this.timeSurvived += dt;
    this.score += Math.round(dt * 20);

    // Player Movement
    let dx = 0, dy = 0;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071; dy *= 0.7071;
    }

    this.player.x += dx * this.player.speed * dt;
    this.player.y += dy * this.player.speed * dt;

    // Arena bounds
    this.player.x = Math.max(60, Math.min(940, this.player.x));
    this.player.y = Math.max(100, Math.min(500, this.player.y));

    // Spawn bus warnings
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.6, 1.8 - this.timeSurvived * 0.02);

      const isHorizontal = Math.random() < 0.6;
      if (isHorizontal) {
        const laneY = 120 + Math.random() * 360;
        const fromLeft = Math.random() < 0.5;
        this.warnings.push({
          type: 'h',
          y: laneY,
          fromLeft,
          timer: 0.8
        });
      } else {
        const laneX = 100 + Math.random() * 800;
        const fromTop = Math.random() < 0.5;
        this.warnings.push({
          type: 'v',
          x: laneX,
          fromTop,
          timer: 0.8
        });
      }
    }

    // Process warnings -> Launch buses
    for (let i = this.warnings.length - 1; i >= 0; i--) {
      const w = this.warnings[i];
      w.timer -= dt;
      if (w.timer <= 0) {
        // Spawn bus!
        const busSpeed = 550 + Math.random() * 150;
        if (w.type === 'h') {
          this.buses.push({
            x: w.fromLeft ? -160 : 1160,
            y: w.y,
            w: 160,
            h: 56,
            vx: w.fromLeft ? busSpeed : -busSpeed,
            vy: 0,
            color: '#ef4444'
          });
        } else {
          this.buses.push({
            x: w.x,
            y: w.fromTop ? -160 : 660,
            w: 56,
            h: 160,
            vx: 0,
            vy: w.fromTop ? busSpeed : -busSpeed,
            color: '#ef4444'
          });
        }
        this.warnings.splice(i, 1);
      }
    }

    // Update buses & collision
    for (let i = this.buses.length - 1; i >= 0; i--) {
      const b = this.buses[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Tire marks
      this.tireTracks.push({ x: b.x, y: b.y, life: 1.0 });

      // Hit player check (AABB with circle)
      const nearX = Math.max(b.x - b.w / 2, Math.min(this.player.x, b.x + b.w / 2));
      const nearY = Math.max(b.y - b.h / 2, Math.min(this.player.y, b.y + b.h / 2));
      if (Math.hypot(this.player.x - nearX, this.player.y - nearY) < this.player.radius) {
        this.gameOver = true;
        break;
      }

      if (b.x < -200 || b.x > 1200 || b.y < -200 || b.y > 700) {
        this.buses.splice(i, 1);
      }
    }

    // Tire tracks decay
    for (let i = this.tireTracks.length - 1; i >= 0; i--) {
      this.tireTracks[i].life -= dt;
      if (this.tireTracks[i].life <= 0) this.tireTracks.splice(i, 1);
    }
  }

  onRender(ctx) {
    // Asphalt Arena Surface
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1000, 562);

    // Arena boundary lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 80, 920, 440);

    // Caution stripes inside border
    ctx.fillStyle = '#334155';
    ctx.fillRect(40, 80, 920, 440);

    // Warning laser lanes
    for (const w of this.warnings) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      if (w.type === 'h') {
        ctx.fillRect(40, w.y - 28, 920, 56);
        ctx.strokeRect(40, w.y - 28, 920, 56);
      } else {
        ctx.fillRect(w.x - 28, 80, 56, 440);
        ctx.strokeRect(w.x - 28, 80, 56, 440);
      }
      ctx.setLineDash([]);
    }

    // Render Buses
    for (const b of this.buses) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 8);
      ctx.fill();

      // Bus windshield & windows
      ctx.fillStyle = '#38bdf8';
      if (b.w > b.h) {
        // Horizontal bus windows
        ctx.fillRect(b.x - b.w / 2 + 10, b.y - b.h / 2 + 8, b.w - 20, 12);
        ctx.fillRect(b.x - b.w / 2 + 10, b.y + b.h / 2 - 20, b.w - 20, 12);
      } else {
        // Vertical bus windows
        ctx.fillRect(b.x - b.w / 2 + 8, b.y - b.h / 2 + 10, 12, b.h - 20);
        ctx.fillRect(b.x + b.w / 2 - 20, b.y - b.h / 2 + 10, 12, b.h - 20);
      }

      // Headlights
      ctx.fillStyle = '#fde047';
      if (b.vx > 0) ctx.fillRect(b.x + b.w / 2 - 4, b.y - 12, 4, 24);
      else if (b.vx < 0) ctx.fillRect(b.x - b.w / 2, b.y - 12, 4, 24);
      else if (b.vy > 0) ctx.fillRect(b.x - 12, b.y + b.h / 2 - 4, 24, 4);
      else if (b.vy < 0) ctx.fillRect(b.x - 12, b.y - b.h / 2, 24, 4);
    }

    // Render Player Runner
    if (!this.gameOver) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🚌 BUSES FROM HELL', 30, 38);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  SURVIVED: ${Math.floor(this.timeSurvived)}s`, 970, 38);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CRUSHED BY BUS!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`SURVIVAL TIME: ${this.timeSurvived.toFixed(1)}s`, 500, 290);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('TRY AGAIN', 500, 362);
    }
  }
}
