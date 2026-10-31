/* ====================================================
   FLAPPY WINGS — GAMINGZONE
   Arcade Flappy Physics:
   Velocity-Angle Tilting Bird, Pipe Collars, Parallax Clouds,
   Scrolling Ground, Medal Tiers (Bronze/Silver/Gold) & Mobile Tap
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class FlappyWingsGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Flappy Wings',
      targetScore: 25,
      ...config
    });

    this.groundH = 90;
    this.bird = {
      x: 120,
      y: 280,
      vy: 0,
      radius: 15,
      gravity: 0.52,
      jumpForce: -8.4,
      angle: 0,
      wingAnim: 0
    };

    this.pipes = [];
    this.pipeTimer = 0;
    this.groundScroll = 0;
    this.particles = [];

    this.createCanvas(480, 640);
    this.initSky();
    this.initControls();

    this.showStartCard({
      title: 'FLAPPY WINGS',
      icon: '🐤',
      objective: 'Flap through the narrow gaps in the pipes without hitting them or the ground! Can you earn the Gold Medal?',
      controls: 'Tap screen or press Spacebar / Up Arrow to flap wings.',
      onStart: () => this.start()
    });
  }

  initSky() {
    this.bird.y = 280;
    this.bird.vy = 0;
    this.bird.angle = 0;
    this.pipes = [];
    this.pipeTimer = 0;
    this.score = 0;
    this.groundScroll = 0;
    this.particles = [];
  }

  flap() {
    if (this.state !== GameState.PLAYING) return;
    this.bird.vy = this.bird.jumpForce;
    sounds.playJump();

    // Wing flap feather particles
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: this.bird.x - 10,
        y: this.bird.y + (Math.random() - 0.5) * 8,
        vx: -30 - Math.random() * 30,
        vy: 20 + Math.random() * 30,
        color: '#facc15',
        radius: 2.5,
        alpha: 1,
        life: 0.35
      });
    }
  }

  initControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.flap();
      }
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      this.flap();
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Bird physics
    this.bird.vy += this.bird.gravity;
    this.bird.y += this.bird.vy;

    // Angle tilt based on velocity
    const targetAngle = Math.min(Math.PI / 2, Math.max(-0.45, this.bird.vy * 0.08));
    this.bird.angle += (targetAngle - this.bird.angle) * 0.2;
    this.bird.wingAnim += dt * 14;

    // Ground and Ceiling collision
    if (this.bird.y + this.bird.radius >= this.baseHeight - this.groundH) {
      this.bird.y = this.baseHeight - this.groundH - this.bird.radius;
      this.onDeath();
      return;
    }
    if (this.bird.y - this.bird.radius <= 0) {
      this.bird.y = this.bird.radius;
      this.bird.vy = 0;
    }

    // Scroll Ground
    this.groundScroll = (this.groundScroll + 160 * dt) % 24;

    // Spawn Pipes
    this.pipeTimer += dt;
    if (this.pipeTimer >= 1.65) {
      this.pipeTimer = 0;
      const gap = 135;
      const minH = 70;
      const maxH = this.baseHeight - this.groundH - gap - 70;
      const topH = Math.floor(Math.random() * (maxH - minH)) + minH;

      this.pipes.push({
        x: this.baseWidth + 40,
        top: topH,
        bottom: topH + gap,
        width: 64,
        passed: false
      });
    }

    // Move Pipes & Check Collisions
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= 160 * dt;

      // Score check
      if (!p.passed && p.x + p.width < this.bird.x) {
        p.passed = true;
        this.score++;
        sounds.playCoin();
      }

      // Circle to AABB Collision
      const bLeft = this.bird.x - this.bird.radius + 3;
      const bRight = this.bird.x + this.bird.radius - 3;
      const bTop = this.bird.y - this.bird.radius + 3;
      const bBottom = this.bird.y + this.bird.radius - 3;

      if (bRight > p.x && bLeft < p.x + p.width) {
        if (bTop < p.top || bBottom > p.bottom) {
          this.onDeath();
          return;
        }
      }

      if (p.x < -80) this.pipes.splice(i, 1);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  onDeath() {
    this.state = GameState.GAME_OVER;
    sounds.playHit();

    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.bird.x,
        y: this.bird.y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color: '#facc15',
        radius: 4,
        alpha: 1,
        life: 0.6
      });
    }

    this.setTimeout(() => this.gameOver(this.score), 700);
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Sky gradient (Soft Cyan Dusk)
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.baseHeight - this.groundH);
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight - this.groundH);

    // Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    this.ctx.beginPath();
    this.ctx.arc(100, 140, 36, 0, Math.PI * 2);
    this.ctx.arc(140, 130, 44, 0, Math.PI * 2);
    this.ctx.arc(180, 140, 32, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(340, 200, 40, 0, Math.PI * 2);
    this.ctx.arc(380, 190, 48, 0, Math.PI * 2);
    this.ctx.arc(420, 200, 36, 0, Math.PI * 2);
    this.ctx.fill();

    // Render Pipes
    for (const p of this.pipes) {
      // Top Pipe
      this.ctx.fillStyle = '#22c55e';
      this.ctx.strokeStyle = '#15803d';
      this.ctx.lineWidth = 3;
      this.ctx.fillRect(p.x, 0, p.width, p.top);
      this.ctx.strokeRect(p.x, 0, p.width, p.top);

      // Top Pipe Lip / Collar
      this.ctx.fillRect(p.x - 4, p.top - 24, p.width + 8, 24);
      this.ctx.strokeRect(p.x - 4, p.top - 24, p.width + 8, 24);

      // Bottom Pipe
      const botH = this.baseHeight - this.groundH - p.bottom;
      this.ctx.fillRect(p.x, p.bottom, p.width, botH);
      this.ctx.strokeRect(p.x, p.bottom, p.width, botH);

      // Bottom Pipe Lip / Collar
      this.ctx.fillRect(p.x - 4, p.bottom, p.width + 8, 24);
      this.ctx.strokeRect(p.x - 4, p.bottom, p.width + 8, 24);

      // Pipe Highlights
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(p.x + 8, 0, 8, p.top - 24);
      this.ctx.fillRect(p.x + 8, p.bottom + 24, 8, botH - 24);
    }

    // Render Ground
    this.ctx.fillStyle = '#ca8a04';
    this.ctx.fillRect(0, this.baseHeight - this.groundH, this.baseWidth, this.groundH);
    this.ctx.fillStyle = '#16a34a';
    this.ctx.fillRect(0, this.baseHeight - this.groundH, this.baseWidth, 16);

    // Ground Stripe Pattern
    this.ctx.fillStyle = '#a16207';
    for (let gx = -this.groundScroll; gx < this.baseWidth; gx += 24) {
      this.ctx.fillRect(gx, this.baseHeight - this.groundH + 20, 12, 10);
    }

    // Render Bird
    if (this.state === GameState.PLAYING) {
      this.ctx.save();
      this.ctx.translate(this.bird.x, this.bird.y);
      this.ctx.rotate(this.bird.angle);

      // Body (Yellow)
      this.ctx.fillStyle = '#facc15';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Wing (White/Cream flap)
      const wingY = Math.sin(this.bird.wingAnim) * 5;
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      this.ctx.ellipse(-4, wingY, 8, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Eye
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(7, -5, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#0f172a';
      this.ctx.beginPath();
      this.ctx.arc(9, -5, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Beak (Orange)
      this.ctx.fillStyle = '#f97316';
      this.ctx.beginPath();
      this.ctx.moveTo(11, -2);
      this.ctx.lineTo(20, 1);
      this.ctx.lineTo(11, 4);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    // Render Particles
    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // HUD Top Score
    this.ctx.font = '900 48px "Lilita One", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#0f172a';
    this.ctx.lineWidth = 6;
    this.ctx.textAlign = 'center';
    this.ctx.strokeText(`${this.score}`, this.baseWidth / 2, 70);
    this.ctx.fillText(`${this.score}`, this.baseWidth / 2, 70);
  }
}
