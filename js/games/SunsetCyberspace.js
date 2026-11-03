import { GameEngineBase } from '../core/GameEngineBase.js';

export class SunsetCyberspace extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Sunset Cyberspace: Retro Runner';
    this.score = 0;
    this.speed = 1.0;
    this.lane = 0; // -1, 0, 1
    this.laneSmooth = 0;
    this.cassettes = 0;
    this.distance = 0;
    this.gameOver = false;
    this.obstacles = [];
    this.collectibles = [];
    this.spawnTimer = 0;
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.lane = Math.max(-1, this.lane - 1);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.lane = Math.min(1, this.lane + 1);
    });

    this.addEventListenerTracked(this.canvas, 'click', (e) => {
      if (this.gameOver) {
        this.restart();
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 1000;
      if (mx < 400) this.lane = Math.max(-1, this.lane - 1);
      else if (mx > 600) this.lane = Math.min(1, this.lane + 1);
    });

    this.showStartCard(
      'SUNSET CYBERSPACE',
      'Hypnotic 80s retrowave synthwave runner! Glide through the glowing neon grid towards the cybernetic sunset. Switch lanes [A/D or Arrows] to dodge digital pyramids and collect retro cassettes!',
      'ENTER CYBERSPACE'
    );
  }

  restart() {
    this.score = 0;
    this.speed = 1.0;
    this.lane = 0;
    this.laneSmooth = 0;
    this.cassettes = 0;
    this.distance = 0;
    this.gameOver = false;
    this.obstacles = [];
    this.collectibles = [];
    this.spawnTimer = 0;
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    this.speed += dt * 0.035;
    this.distance += dt * this.speed * 45;
    this.score += Math.round(dt * this.speed * 12);

    this.laneSmooth += (this.lane - this.laneSmooth) * 15 * dt;

    // Spawn obstacles & cassettes
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.4, 1.2 / this.speed);
      const l = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

      if (Math.random() < 0.3) {
        // Cassette
        this.collectibles.push({ lane: l, z: 1.0 });
      } else {
        // Obstacle pyramid
        this.obstacles.push({ lane: l, z: 1.0 });
      }
    }

    const zRate = 0.5 * this.speed;

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= zRate * dt;

      // Collision check near player
      if (obs.z <= 0.12 && obs.z >= 0.02) {
        if (Math.abs(this.laneSmooth - obs.lane) < 0.45) {
          this.gameOver = true;
          break;
        }
      }
      if (obs.z < -0.1) this.obstacles.splice(i, 1);
    }

    // Move collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.z -= zRate * dt;

      if (col.z <= 0.15 && col.z >= 0.0) {
        if (Math.abs(this.laneSmooth - col.lane) < 0.5) {
          this.cassettes++;
          this.score += 250;
          this.collectibles.splice(i, 1);
          continue;
        }
      }
      if (col.z < -0.1) this.collectibles.splice(i, 1);
    }
  }

  onRender(ctx) {
    // Synthwave Sunset Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#0f051d');
    sky.addColorStop(0.6, '#3b0764');
    sky.addColorStop(1, '#831843');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1000, 260);

    // Glowing Neon Retrowave Sun
    const sunGrad = ctx.createLinearGradient(500, 110, 500, 260);
    sunGrad.addColorStop(0, '#fde047');
    sunGrad.addColorStop(0.5, '#f43f5e');
    sunGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(500, 210, 80, Math.PI, 0, false);
    ctx.fill();

    // Horizontal sun laser blinds
    ctx.fillStyle = '#0f051d';
    for (let y = 160; y < 220; y += 10) {
      ctx.fillRect(410, y, 180, 3);
    }

    // Horizon Grid Floor
    ctx.fillStyle = '#090014';
    ctx.fillRect(0, 260, 1000, 302);

    // Perspective wireframe grid
    const vpX = 500;
    const horizonY = 260;
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.5;

    // Longitudinal grid lines
    for (let l = -3; l <= 3; l++) {
      const startX = vpX + l * 20;
      const endX = vpX + l * 280;
      ctx.beginPath();
      ctx.moveTo(startX, horizonY);
      ctx.lineTo(endX, 562);
      ctx.stroke();
    }

    // Transverse moving grid lines
    const offset = (this.distance % 30) / 30;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    for (let z = 0.05; z <= 1.0; z += 0.08) {
      const actualZ = (z + offset * 0.08) % 1.0;
      const y = horizonY + Math.pow(1 - actualZ, 2.5) * (562 - horizonY);
      const span = (1 - actualZ) * 600;
      ctx.beginPath();
      ctx.moveTo(vpX - span, y);
      ctx.lineTo(vpX + span, y);
      ctx.stroke();
    }

    // Render Obstacles (Neon Pyramids)
    for (const obs of this.obstacles) {
      const scale = Math.pow(1 - obs.z, 2.5);
      const y = horizonY + scale * (562 - horizonY);
      const x = vpX + obs.lane * (scale * 280);
      const size = scale * 50;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size / 2, y);
      ctx.lineTo(x + size / 2, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Render Collectibles (Cassette tapes)
    for (const col of this.collectibles) {
      const scale = Math.pow(1 - col.z, 2.5);
      const y = horizonY + scale * (562 - horizonY);
      const x = vpX + col.lane * (scale * 280);
      const size = scale * 40;

      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(x - size / 2, y - size * 0.6, size, size * 0.6);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(10, Math.round(size * 0.4))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('📼', x, y - size * 0.1);
    }

    // Render Player Cyber Hovercraft
    const pY = 490;
    const pX = vpX + this.laneSmooth * 280;

    if (!this.gameOver) {
      // Glow
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 16;

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(pX, pY - 26);
      ctx.lineTo(pX - 28, pY + 12);
      ctx.lineTo(pX, pY + 4);
      ctx.lineTo(pX + 28, pY + 12);
      ctx.closePath();
      ctx.fill();

      // Cockpit glow
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(pX, pY - 8, 6, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 58);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌆 SUNSET CYBERSPACE', 30, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  DIST: ${Math.round(this.distance)}m  |  📼 ${this.cassettes}`, 970, 38);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GRID COLLISION!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`DISTANCE REACHED: ${Math.round(this.distance)}m`, 500, 290);

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('RESTART RUN', 500, 362);
    }
  }
}

