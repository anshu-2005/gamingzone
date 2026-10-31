/* ====================================================
   NEON DASH GEOMETRY — GAMINGZONE
   Fast-Paced Rhythm Platformer & Geometry Spike Jumper
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class NeonDashGeometryGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Neon Dash Geometry',
      targetScore: 2000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.player = {
      x: 140,
      y: 380,
      size: 34,
      vy: 0,
      rotation: 0,
      grounded: true,
      color: '#00e5ff'
    };

    this.speed = 7.5;
    this.gravity = 0.85;
    this.jumpForce = -14.2;
    this.distance = 0;
    this.obstacles = [];
    this.particles = [];

    this.initControls();
    this.initTrack();

    this.attachTouchControls({
      showDpad: false,
      onAction: () => this.jump()
    });

    this.showStartCard({
      title: 'NEON DASH GEOMETRY',
      icon: '📐',
      objective: 'Tap / Click / Spacebar to jump over neon spikes and platform gaps! Time your leaps to survive the rhythm dash.',
      controls: 'Spacebar / Up Arrow / Click to Jump.'
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state === GameState.MENU) {
        this.start();
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        this.jump();
      }
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        if (this.state === GameState.MENU) {
          this.start();
          return;
        }
        e.preventDefault();
        this.jump();
      });
    }
  }

  jump() {
    if (this.player.grounded) {
      this.player.vy = this.jumpForce;
      this.player.grounded = false;
      sounds.playJump?.();
      this.createJumpParticles();
    }
  }

  initTrack() {
    this.obstacles = [];
    let startX = 600;
    for (let i = 0; i < 40; i++) {
      const type = Math.random() > 0.4 ? 'spike' : 'block';
      this.obstacles.push({
        x: startX,
        y: type === 'spike' ? 384 : 350,
        type,
        width: type === 'spike' ? 30 : 40,
        height: type === 'spike' ? 30 : 64,
        color: type === 'spike' ? '#f43f5e' : '#8b5cf6'
      });
      startX += 220 + Math.random() * 160;
    }
  }

  createJumpParticles() {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.player.x,
        y: this.player.y + this.player.size,
        vx: (Math.random() - 0.5) * 4 - 2,
        vy: Math.random() * 2 + 1,
        life: 0.6,
        color: '#00e5ff'
      });
    }
  }

  update(delta) {
    if (this.state !== GameState.PLAYING) return;

    this.distance += this.speed;
    this.score = Math.floor(this.distance / 10);

    // Gravity
    this.player.vy += this.gravity;
    this.player.y += this.player.vy;

    const floorY = 384;
    if (this.player.y >= floorY) {
      this.player.y = floorY;
      this.player.vy = 0;
      this.player.grounded = true;
      this.player.rotation = Math.round(this.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
    } else {
      this.player.rotation += 0.12;
    }

    // Move obstacles
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      obs.x -= this.speed;

      // Collision check AABB
      const px = this.player.x - this.player.size / 2;
      const py = this.player.y - this.player.size;
      const pw = this.player.size;
      const ph = this.player.size;

      if (
        px < obs.x + obs.width &&
        px + pw > obs.x &&
        py < obs.y &&
        py + ph > obs.y - obs.height
      ) {
        sounds.playGameOver?.();
        this.gameOver(this.score, { distance: this.distance });
        return;
      }
    }

    // Remove passed obstacles and replenish
    if (this.obstacles.length > 0 && this.obstacles[0].x < -100) {
      const lastX = this.obstacles[this.obstacles.length - 1].x;
      const type = Math.random() > 0.4 ? 'spike' : 'block';
      this.obstacles.shift();
      this.obstacles.push({
        x: lastX + 220 + Math.random() * 160,
        y: type === 'spike' ? 384 : 350,
        type,
        width: type === 'spike' ? 30 : 40,
        height: type === 'spike' ? 30 : 64,
        color: type === 'spike' ? '#f43f5e' : '#8b5cf6'
      });
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= delta * 2;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background
    ctx.fillStyle = '#0a0d17';
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid Floor
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 384, this.width, this.height - 384);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 384);
    ctx.lineTo(this.width, 384);
    ctx.stroke();

    // Render Player Cube
    ctx.save();
    ctx.translate(this.player.x, this.player.y - this.player.size / 2);
    ctx.rotate(this.player.rotation);
    ctx.fillStyle = this.player.color;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(-this.player.size / 2, -this.player.size / 2, this.player.size, this.player.size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.player.size / 2, -this.player.size / 2, this.player.size, this.player.size);
    ctx.restore();
    ctx.shadowBlur = 0;

    // Render Obstacles
    for (const obs of this.obstacles) {
      if (obs.x < -50 || obs.x > this.width + 50) continue;
      ctx.fillStyle = obs.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y);
        ctx.lineTo(obs.x + obs.width / 2, obs.y - obs.height);
        ctx.lineTo(obs.x + obs.width, obs.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(obs.x, obs.y - obs.height, obs.width, obs.height);
        ctx.strokeRect(obs.x, obs.y - obs.height, obs.width, obs.height);
      }
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, 4, 4);
    }
    ctx.globalAlpha = 1.0;

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 30, 42);
  }
}

