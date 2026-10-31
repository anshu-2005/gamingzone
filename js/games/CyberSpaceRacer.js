/* ====================================================
   CYBER SPACE RACER — GAMINGZONE
   F-Zero Style Synthwave Horizon Racer with Hover Speeder Banking,
   Nitro Boost Speedways, Laser Gates & Full Touch/Keyboard Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CyberSpaceRacerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Cyber Space Racer',
      targetScore: 2500,
      lives: 3,
      ...config
    });

    this.playerX = 0; // -1 (left edge) to 1 (right edge)
    this.speed = 480;
    this.distance = 0;
    this.nitroTimer = 0;
    this.roadScroll = 0;

    this.obstacles = [];
    this.boostPads = [];
    this.particles = [];
    this.keys = { left: false, right: false, boost: false };

    this.createCanvas(720, 520);
    this.initRacerControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
      },
      actionLabel: 'NITRO',
      onAction: (pressed) => {
        if (pressed && this.nitroTimer <= 0) {
          this.nitroTimer = 2.5;
          sounds.playLaser();
        }
      }
    });

    this.showStartCard({
      title: 'CYBER SPACE RACER',
      icon: '🛸',
      objective: 'Pilot your anti-gravity hovercraft across the neon synthwave highway! Dodge laser barriers and hit cyan boost pads.',
      controls: 'A/D or Left/Right Arrow to steer. Space to trigger Nitro Boost.',
      onStart: () => this.start()
    });
  }

  initRacerControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.code === 'Space' || e.key === ' ') {
        if (this.nitroTimer <= 0) {
          this.nitroTimer = 2.5;
          sounds.playLaser();
        }
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
    });

    // Touch & Pointer Drag Steer
    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const mx = (e.clientX - rect.left) * scaleX;
      // Convert to -1 to 1 range
      this.playerX = Math.max(-0.85, Math.min(0.85, (mx - this.baseWidth / 2) / (this.baseWidth * 0.38)));
    });
  }

  spawnObstacle() {
    this.obstacles.push({
      xOffset: (Math.random() - 0.5) * 1.6, // -0.8 to 0.8
      z: 1000,
      width: 44,
      color: '#ef4444'
    });
  }

  spawnBoostPad() {
    this.boostPads.push({
      xOffset: (Math.random() - 0.5) * 1.4,
      z: 1000,
      collected: false
    });
  }

  update(dt) {
    // Steer Hovercraft
    if (this.keys.left) this.playerX = Math.max(-0.85, this.playerX - 1.8 * dt);
    if (this.keys.right) this.playerX = Math.min(0.85, this.playerX + 1.8 * dt);

    // Speed & Nitro
    const currentSpeed = this.nitroTimer > 0 ? this.speed * 1.65 : this.speed;
    if (this.nitroTimer > 0) this.nitroTimer -= dt;

    this.distance += currentSpeed * dt;
    this.score = Math.floor(this.distance * 0.5);
    this.roadScroll = (this.roadScroll + currentSpeed * dt * 0.1) % 40;

    // Spawning logic
    if (Math.random() < 0.035) this.spawnObstacle();
    if (Math.random() < 0.018) this.spawnBoostPad();

    // Update 3D Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.z -= currentSpeed * dt;

      // Check collision at player z (z <= 80 && z >= 0)
      if (o.z <= 70 && o.z >= 10) {
        if (Math.abs(o.xOffset - this.playerX) < 0.22) {
          this.lives--;
          sounds.playHit();
          this.spawnBurst(this.baseWidth / 2 + this.playerX * 260, 440, '#ef4444', 18);
          this.obstacles.splice(i, 1);

          if (this.lives <= 0) {
            this.finishGame(this.score, { isVictory: false });
            return;
          }
          continue;
        }
      }

      if (o.z <= 0) this.obstacles.splice(i, 1);
    }

    // Update Boost Pads
    for (let i = this.boostPads.length - 1; i >= 0; i--) {
      const bp = this.boostPads[i];
      bp.z -= currentSpeed * dt;

      if (!bp.collected && bp.z <= 70 && bp.z >= 10 && Math.abs(bp.xOffset - this.playerX) < 0.25) {
        bp.collected = true;
        this.nitroTimer = 2.0;
        this.score += 250;
        sounds.playPowerup();
        this.spawnBurst(this.baseWidth / 2 + this.playerX * 260, 440, '#00e5ff', 16);
      }

      if (bp.z <= 0) this.boostPads.splice(i, 1);
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

    // Synthwave Horizon Sunset (Top half)
    const sky = ctx.createLinearGradient(0, 0, 0, 220);
    sky.addColorStop(0, '#0a0e17');
    sky.addColorStop(0.6, '#311042');
    sky.addColorStop(1, '#701a75');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.baseWidth, 220);

    // Neon Giant Sun on Horizon
    const sunGrad = ctx.createLinearGradient(this.baseWidth / 2, 80, this.baseWidth / 2, 220);
    sunGrad.addColorStop(0, '#ffd166');
    sunGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(this.baseWidth / 2, 220, 85, Math.PI, 0);
    ctx.fill();

    // 3D Perspective Road Grid (Bottom half: y = 220 to 520)
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 220, this.baseWidth, 300);

    // Perspective Lines converging at horizon center
    const horizonY = 220;
    const vanishX = this.baseWidth / 2;

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;

    // Road borders
    const roadTopW = 60;
    const roadBottomW = 600;

    // Left border
    ctx.beginPath();
    ctx.moveTo(vanishX - roadTopW / 2, horizonY);
    ctx.lineTo(vanishX - roadBottomW / 2, this.baseHeight);
    ctx.stroke();

    // Right border
    ctx.beginPath();
    ctx.moveTo(vanishX + roadTopW / 2, horizonY);
    ctx.lineTo(vanishX + roadBottomW / 2, this.baseHeight);
    ctx.stroke();

    // Horizontal Perspective Grid Bars
    for (let i = 0; i < 14; i++) {
      const t = (i * 25 + this.roadScroll) % 300;
      const progress = Math.pow(t / 300, 2.2);
      const barY = horizonY + progress * (this.baseHeight - horizonY);
      const curW = roadTopW + progress * (roadBottomW - roadTopW);

      ctx.strokeStyle = `rgba(0, 229, 255, ${0.15 + progress * 0.7})`;
      ctx.lineWidth = 1 + progress * 2;
      ctx.beginPath();
      ctx.moveTo(vanishX - curW / 2, barY);
      ctx.lineTo(vanishX + curW / 2, barY);
      ctx.stroke();
    }

    // Draw 3D Boost Pads
    this.boostPads.forEach(bp => {
      const progress = 1 - (bp.z / 1000);
      if (progress > 0 && progress < 1) {
        const renderY = horizonY + Math.pow(progress, 2.2) * (this.baseHeight - horizonY);
        const curW = roadTopW + progress * (roadBottomW - roadTopW);
        const renderX = vanishX + bp.xOffset * (curW * 0.42);
        const size = 12 + progress * 32;

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(renderX, renderY - size * 0.6);
        ctx.lineTo(renderX - size / 2, renderY);
        ctx.lineTo(renderX + size / 2, renderY);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw 3D Laser Obstacles
    this.obstacles.forEach(o => {
      const progress = 1 - (o.z / 1000);
      if (progress > 0 && progress < 1) {
        const renderY = horizonY + Math.pow(progress, 2.2) * (this.baseHeight - horizonY);
        const curW = roadTopW + progress * (roadBottomW - roadTopW);
        const renderX = vanishX + o.xOffset * (curW * 0.42);
        const size = 10 + progress * 40;

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(renderX - size / 2, renderY - size, size, size);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.strokeRect(renderX - size / 2, renderY - size, size, size);
      }
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Hovercraft (at y = 440)
    const playerRenderX = vanishX + this.playerX * (roadBottomW * 0.38);
    const tilt = this.keys.left ? -0.2 : (this.keys.right ? 0.2 : 0);

    ctx.save();
    ctx.translate(playerRenderX, 440);
    ctx.rotate(tilt);

    // Engine Plasma Thruster
    ctx.fillStyle = this.nitroTimer > 0 ? '#00e5ff' : '#f97316';
    ctx.beginPath();
    ctx.moveTo(-12, 16);
    ctx.lineTo(0, 32 + (this.nitroTimer > 0 ? 16 : 8));
    ctx.lineTo(12, 16);
    ctx.fill();

    // Hovercraft Body
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(26, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-26, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.ellipse(0, -6, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🛸 SPEED: ${Math.round(currentSpeed)} KM/H`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`SHIELDS: ${'❤️'.repeat(Math.max(0, this.lives))}`, this.baseWidth - 24, 34);
  }
}
