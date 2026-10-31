/* ====================================================
   NEON HOVER CIRCUIT — GAMINGZONE
   Supersonic Anti-Gravity Hovercraft Circuit Raceway
   - Magnetic Rail Speedway with Supersonic Boost Portals
   - Steer at 400+ KPH, Lean into G-Force Hairpins & Air-Brake
   - Time Trial Checkpoints & Energy Shields
   - High-Octane Cyberpunk Particle Trails & Nitro Flares
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class NeonHoverCircuitGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Neon Hover Circuit',
      targetScore: 20000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.distance = 0;
    this.speed = 12;
    this.maxSpeed = 24;
    this.shields = 100;
    this.playerX = 0; // -1 to 1 across track width

    this.trackSegments = [];
    this.boostGates = [];
    this.obstacles = [];
    this.particles = [];
    this.keys = {};

    this.initControls();
    this.initTrack();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) {
          this.keys['ArrowLeft'] = false;
          this.keys['ArrowRight'] = false;
          return;
        }
        if (dir === 'LEFT') this.keys['ArrowLeft'] = true;
        if (dir === 'RIGHT') this.keys['ArrowRight'] = true;
      },
      onAction: () => this.boost()
    });

    this.showStartCard({
      title: 'NEON HOVER CIRCUIT',
      icon: '🛸',
      objective: 'Pilot the anti-grav hovercraft at Mach speed! Glide through cyan boost gates and avoid plasma energy barriers.',
      controls: 'A/D or Left/Right to Steer • [SPACE] for Nitro Boost.',
      onStart: () => {
        this.initTrack();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;
      if (e.code === 'Space') this.boost();
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });
  }

  initTrack() {
    this.distance = 0;
    this.speed = 12;
    this.shields = 100;
    this.playerX = 0;
    this.trackSegments = [];
    this.boostGates = [];
    this.obstacles = [];
    this.particles = [];

    for (let i = 0; i < 40; i++) {
      this.spawnSegment(i * 100);
    }
  }

  spawnSegment(z) {
    if (Math.random() < 0.25 && z > 500) {
      this.boostGates.push({ z: z, x: (Math.random() - 0.5) * 1.2 });
    } else if (Math.random() < 0.35 && z > 600) {
      this.obstacles.push({ z: z, x: (Math.random() - 0.5) * 1.4 });
    }
    this.trackSegments.push({ z: z });
  }

  boost() {
    if (this.shields > 15) {
      this.shields -= 15;
      this.speed = this.maxSpeed;
      sounds.playLaser();
    }
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // Steer
    if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['a']) {
      this.playerX -= 0.045;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['d']) {
      this.playerX += 0.045;
    }
    this.playerX = Math.max(-1.1, Math.min(1.1, this.playerX));

    this.distance += this.speed;
    this.score = Math.floor(this.distance / 10);
    this.speed = Math.max(12, this.speed * 0.985); // Natural drag deceleration

    // Check Boost Gates
    for (let i = this.boostGates.length - 1; i >= 0; i--) {
      const bg = this.boostGates[i];
      bg.z -= this.speed;
      if (bg.z > 20 && bg.z < 60 && Math.abs(this.playerX - bg.x) < 0.4) {
        sounds.playSuccess();
        this.speed = this.maxSpeed;
        this.shields = Math.min(100, this.shields + 10);
        this.boostGates.splice(i, 1);
      } else if (bg.z < -20) {
        this.boostGates.splice(i, 1);
      }
    }

    // Check Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= this.speed;
      if (obs.z > 20 && obs.z < 60 && Math.abs(this.playerX - obs.x) < 0.35) {
        sounds.playExplosion();
        this.shields -= 35;
        this.speed = 8;
        this.obstacles.splice(i, 1);

        if (this.shields <= 0) {
          this.gameOver(this.score, { distance: Math.round(this.distance) });
          return;
        }
      } else if (obs.z < -20) {
        this.obstacles.splice(i, 1);
      }
    }

    // Recycle track segments
    for (let i = this.trackSegments.length - 1; i >= 0; i--) {
      this.trackSegments[i].z -= this.speed;
      if (this.trackSegments[i].z < -40) {
        this.trackSegments.splice(i, 1);
        const lastZ = this.trackSegments[this.trackSegments.length - 1].z;
        this.spawnSegment(lastZ + 100);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Cyberpunk Neon Speedway Sky
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#0c0d12');
    bgGrad.addColorStop(0.6, '#181a24');
    bgGrad.addColorStop(1, '#ff5733');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    const fov = 300;
    const centerX = this.width / 2;
    const centerY = this.height / 2 + 50;

    // 2. 3D Track Magnetic Rails
    this.trackSegments.forEach(seg => {
      if (seg.z <= 10) return;
      const scale = fov / (fov + seg.z);
      const w = 480 * scale;
      const y = centerY + 180 * scale;

      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = Math.max(1, 3 * scale);
      ctx.strokeRect(centerX - w / 2, y, w, 2);
    });

    // 3. Render Boost Gates
    this.boostGates.forEach(bg => {
      if (bg.z <= 10) return;
      const scale = fov / (fov + bg.z);
      const x = centerX + bg.x * (240 * scale);
      const y = centerY + 140 * scale;
      const size = 60 * scale;

      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = Math.max(2, 6 * scale);
      ctx.strokeRect(x - size / 2, y - size, size, size);
    });

    // 4. Render Obstacles
    this.obstacles.forEach(obs => {
      if (obs.z <= 10) return;
      const scale = fov / (fov + obs.z);
      const x = centerX + obs.x * (240 * scale);
      const y = centerY + 160 * scale;
      const size = 50 * scale;

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - size / 2, y - size, size, size);
    });

    // 5. Render Player Anti-Grav Hovercraft
    const playerScreenX = centerX + this.playerX * 180;
    const playerScreenY = this.height - 90;

    ctx.save();
    ctx.translate(playerScreenX, playerScreenY);

    // Hover Thruster Glow
    ctx.fillStyle = '#ff5733';
    ctx.shadowColor = '#ff5733';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(0, 16, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Craft Wings
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(34, 14);
    ctx.lineTo(12, 10);
    ctx.lineTo(0, 16);
    ctx.lineTo(-12, 10);
    ctx.lineTo(-34, 14);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ff5733';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit Canopy
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(-5, -12, 10, 14);

    ctx.restore();

    // 6. HUD
    ctx.fillStyle = 'rgba(18, 20, 28, 0.85)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    ctx.fillStyle = '#ff5733';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(this.speed * 22)} KM/H ⚡`, 34, 46);

    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`SHIELDS: ${Math.max(0, this.shields)}% • DIST: ${this.score}M`, 34, 64);
  }
}

