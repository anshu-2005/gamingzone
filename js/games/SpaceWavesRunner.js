/* ====================================================
   SPACE WAVES RUNNER — GAMINGZONE
   High-Speed Neon Geometry Wave Corridor Runner
   - Hold Click / Spacebar / Touch to Rise at 45° • Release to Dive at 45°
   - Navigate Razor-Sharp Neon Zig-Zags, Spinning Sawblades & Laser Gates
   - 10 Escalating Rhythm Levels with Real-Time Percentage Progress
   - Vibrant Neon Particle Trails & High-Energy Sound Pulse
   - Touch Action & One-Tap Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';
import { PRNG } from '../core/levelEngine/index.js';

export class SpaceWavesRunnerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Space Waves Runner',
      targetScore: 10000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.currentLevel = 1;
    this.progress = 0;
    this.levelLength = 3200;
    this.cameraX = 0;

    // Arrow Wave Entity
    this.wave = {
      x: 100,
      y: 260,
      speedX: 6.2,
      speedY: 6.2,
      isRising: false,
      trail: []
    };

    this.obstacles = [];
    this.particles = [];

    this.initControls();
    this.loadLevel(this.currentLevel);

    this.attachTouchControls({
      showDpad: false,
      onAction: () => {
        this.wave.isRising = true;
        setTimeout(() => { this.wave.isRising = false; }, 250);
      }
    });

    this.showStartCard({
      title: 'SPACE WAVES RUNNER',
      icon: '🌊',
      objective: 'Hold to fly UP at 45°, release to dive DOWN at 45°! Guide the neon arrow through treacherous laser tunnels to 100% completion.',
      controls: 'Hold [SPACE] / Click / Touch to climb • Release to dive.',
      onStart: () => {
        this.currentLevel = 1;
        this.score = 0;
        this.loadLevel(1);
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.wave.isRising = true;
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        this.wave.isRising = false;
      }
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', () => { this.wave.isRising = true; });
      this.addEventListenerTracked(this.canvas, 'mouseup', () => { this.wave.isRising = false; });
      this.addEventListenerTracked(this.canvas, 'touchstart', (e) => { e.preventDefault(); this.wave.isRising = true; });
      this.addEventListenerTracked(this.canvas, 'touchend', (e) => { e.preventDefault(); this.wave.isRising = false; });
    }
  }

  loadLevel(lvl) {
    this.currentLevel = lvl;
    this.levelLength = 3000 + lvl * 600;
    this.cameraX = 0;
    this.progress = 0;

    this.wave = {
      x: 100,
      y: 260,
      speedX: 5.8 + lvl * 0.35,
      speedY: 5.8 + lvl * 0.35,
      isRising: false,
      trail: []
    };

    this.obstacles = [];
    this.particles = [];

    // Deterministic Procedural Neon Obstacles via PRNG (guaranteed fair reaction gaps)
    const prng = new PRNG(lvl * 733 + 101);
    let curX = 400;
    const minReactionGap = Math.max(160, 260 - lvl * 1.5);

    while (curX < this.levelLength - 200) {
      const type = prng.next();
      if (type < 0.4) {
        // Ceiling & Floor Spikes with fair vertical pass gap
        const gap = Math.max(110, 160 - Math.min(50, lvl * 3));
        const topH = prng.range(50, 140);
        this.obstacles.push({ x: curX, y: 0, w: 50, h: topH, type: 'ceiling' });
        this.obstacles.push({ x: curX, y: topH + gap, w: 50, h: this.height - (topH + gap), type: 'floor' });
      } else if (type < 0.75) {
        // Floating Sawblade
        this.obstacles.push({
          x: curX,
          y: prng.range(130, 360),
          radius: 22,
          type: 'saw'
        });
      } else {
        // Central Diamond Barrier
        this.obstacles.push({
          x: curX,
          y: 260,
          w: 40,
          h: 120,
          type: 'pillar'
        });
      }
      curX += prng.range(minReactionGap, minReactionGap + 120);
    }
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    const w = this.wave;

    // 45-degree angle movement
    w.x += w.speedX;
    w.y += w.isRising ? -w.speedY : w.speedY;

    // Trail
    w.trail.unshift({ x: w.x, y: w.y });
    if (w.trail.length > 35) w.trail.pop();

    this.cameraX = w.x - 180;
    this.progress = Math.min(100, Math.round((w.x / this.levelLength) * 100));

    // Floor & Ceiling Boundary Crash
    if (w.y < 20 || w.y > this.height - 20) {
      this.triggerCrash();
      return;
    }

    // Obstacle Collisions
    for (const obs of this.obstacles) {
      if (obs.type === 'saw') {
        if (Math.hypot(w.x - obs.x, w.y - obs.y) < obs.radius + 10) {
          this.triggerCrash();
          return;
        }
      } else if (obs.type === 'pillar' || obs.type === 'ceiling' || obs.type === 'floor') {
        if (w.x + 8 >= obs.x && w.x - 8 <= obs.x + obs.w && w.y + 8 >= obs.y && w.y - 8 <= obs.y + obs.h) {
          this.triggerCrash();
          return;
        }
      }
    }

    // Win Stage (100% completion)
    if (w.x >= this.levelLength) {
      sounds.playWin();
      this.score += 1000 * this.currentLevel;
      if (this.currentLevel >= 100) {
        this.gameOver(this.score, { cleared: true });
      } else {
        this.loadLevel(this.currentLevel + 1);
      }
    }
  }

  triggerCrash() {
    sounds.playExplosion();
    this.lives--;

    // Shatter particles
    for (let p = 0; p < 25; p++) {
      this.particles.push({
        x: this.wave.x,
        y: this.wave.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        radius: Math.random() * 4 + 2,
        color: '#00e5ff',
        life: 25
      });
    }

    if (this.lives <= 0) {
      this.gameOver(this.score, { level: this.currentLevel, progress: this.progress });
    } else {
      this.loadLevel(this.currentLevel);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Cyber Tunnel Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(0.5, '#1e1035');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // Glowing Neon Ceiling & Floor Borders
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.cameraX - 50, 16, this.width + 100, 1);
    ctx.strokeRect(this.cameraX - 50, this.height - 16, this.width + 100, 1);

    // 2. Render Obstacles
    this.obstacles.forEach(obs => {
      if (obs.type === 'saw') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }
    });

    // 3. Render Wave Trail
    const w = this.wave;
    if (w.trail.length > 1) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w.trail[0].x, w.trail[0].y);
      for (let i = 1; i < w.trail.length; i++) {
        ctx.lineTo(w.trail[i].x, w.trail[i].y);
      }
      ctx.stroke();
    }

    // 4. Render Wave Arrow Head
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.isRising ? -Math.PI / 4 : Math.PI / 4);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 5. Render Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 6. HUD & Progress
    this.renderHUD(ctx);
  }

  renderHUD(ctx) {
    // Progress Bar Top Center
    const barW = 300;
    const barH = 14;
    const barX = this.width / 2 - barW / 2;
    const barY = 22;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#00e5ff';
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * (this.progress / 100), barH - 4);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.progress}% • LEVEL ${this.currentLevel}`, this.width / 2, barY + 30);

    // Lives
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`❤️ ${this.lives}`, 24, 38);
  }
}

