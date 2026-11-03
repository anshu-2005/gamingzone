import { GameEngineBase } from '../core/GameEngineBase.js';

export class SpeedCubeRush extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Speed Cube: Neon Obstacle Rush';
    this.score = 0;
    this.speed = 1.0;
    this.playerX = 0; // -1 to 1 (lane space)
    this.targetX = 0;
    this.obstacles = [];
    this.particles = [];
    this.gameOver = false;
    this.spawnTimer = 0;
    this.distance = 0;
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.targetX = Math.max(-0.85, this.targetX - 0.35);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.targetX = Math.min(0.85, this.targetX + 0.35);
    });

    this.addEventListenerTracked(this.canvas, 'mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.targetX = Math.max(-0.85, Math.min(0.85, normX * 0.9));
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
    });

    this.showStartCard(
      'SPEED CUBE RUSH',
      'Hypercasual high-speed 3D obstacle runner! Steer your glowing quantum cube with Left/Right arrows, A/D, or mouse. Dodge geometric neon blocks at blistering velocity!',
      'RUSH FORWARD'
    );
  }

  restart() {
    this.score = 0;
    this.speed = 1.0;
    this.playerX = 0;
    this.targetX = 0;
    this.obstacles = [];
    this.gameOver = false;
    this.distance = 0;
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    this.speed += dt * 0.04;
    this.distance += dt * this.speed * 40;
    this.score += Math.round(dt * this.speed * 10);

    // Smooth player lane transition
    this.playerX += (this.targetX - this.playerX) * 14 * dt;

    // Spawn obstacles
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.35, 1.1 / this.speed);
      const lane = -0.75 + Math.random() * 1.5;
      const width = 0.3 + Math.random() * 0.25;
      this.obstacles.push({
        x: lane,
        z: 1.0, // 1.0 = far horizon, 0.0 = player depth
        width,
        color: Math.random() < 0.5 ? '#ef4444' : '#ec4899'
      });
    }

    // Move obstacles towards camera
    const zSpeed = 0.55 * this.speed;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= zSpeed * dt;

      // Collision check near player (z near 0.08)
      if (obs.z <= 0.12 && obs.z >= 0.02) {
        if (Math.abs(this.playerX - obs.x) < (obs.width / 2 + 0.12)) {
          this.gameOver = true;
          // Spawn explosion
          for (let p = 0; p < 40; p++) {
            this.particles.push({
              x: 500 + this.playerX * 360,
              y: 440,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              color: '#38bdf8',
              life: 0.8
            });
          }
        }
      }

      if (obs.z < -0.1) {
        this.obstacles.splice(i, 1);
      }
    }

    // Particle updates
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  onRender(ctx) {
    // Cyberpunk Horizon
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 562);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.4, '#1e1b4b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 562);

    const horizonY = 180;
    const vpX = 500;

    // 3D Perspective Road Grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 1.5;

    // Perspective lane lines
    for (let lane = -1; lane <= 1; lane += 0.25) {
      const startX = vpX + lane * 40;
      const endX = vpX + lane * 520;
      ctx.beginPath();
      ctx.moveTo(startX, horizonY);
      ctx.lineTo(endX, 562);
      ctx.stroke();
    }

    // Moving horizontal grid bars
    const offset = (this.distance % 40) / 40;
    for (let z = 0.05; z <= 1.0; z += 0.1) {
      const actualZ = (z + offset * 0.1) % 1.0;
      const y = horizonY + Math.pow(1 - actualZ, 2.2) * (562 - horizonY);
      const span = (1 - actualZ) * 520;
      ctx.beginPath();
      ctx.moveTo(vpX - span, y);
      ctx.lineTo(vpX + span, y);
      ctx.stroke();
    }

    // Sort and render obstacles from back to front
    const sortedObs = [...this.obstacles].sort((a, b) => b.z - a.z);
    for (const obs of sortedObs) {
      const scale = Math.pow(1 - obs.z, 2.2);
      const y = horizonY + scale * (562 - horizonY);
      const x = vpX + obs.x * (scale * 520);
      const w = obs.width * (scale * 520);
      const h = scale * 55;

      ctx.fillStyle = obs.color;
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - w / 2, y - h, w, h);
    }

    // Render Player Glowing Cube
    const pScale = 0.95;
    const pY = 440;
    const pX = vpX + this.playerX * (pScale * 520);
    const cubeSize = 36;

    if (!this.gameOver) {
      // Glow
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(pX - cubeSize / 2, pY - cubeSize, cubeSize, cubeSize, 6);
      ctx.fill();

      // Inner quantum core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pX - 6, pY - cubeSize / 2 - 6, 12, 12);
      ctx.shadowBlur = 0;
    }

    // Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ SPEED CUBE RUSH', 30, 38);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  SPEED: ${this.speed.toFixed(1)}x  |  DIST: ${Math.round(this.distance)}m`, 970, 38);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CUBE SHATTERED!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`FINAL SCORE: ${this.score}`, 500, 290);

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('RETRY RUSH', 500, 362);
    }
  }
}
