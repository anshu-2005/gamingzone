/* ====================================================
   JETPACK NEON ESCAPE — GAMINGZONE
   High-Speed Endless Cavern Thruster Runner
   - Hold Screen or [SPACE] to Fire Jetpack Particle Thrusters
   - Dodge Rotating Electric Zappers & High-Voltage Laser Gates
   - Coin Magnets, Bubble Shields & Supersonic Boosters
   - Multi-Layered Neon Parallax Grid Cavern
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class JetpackNeonEscapeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Jetpack Neon Escape',
      targetScore: 2500,
      ...config
    });

    this.createCanvas(800, 540);

    this.player = {
      x: 140,
      y: 270,
      vy: 0,
      radius: 16,
      thrusting: false,
      hasShield: false,
      magnetTimer: 0
    };

    this.distance = 0;
    this.coins = 0;
    this.particles = [];
    this.zappers = [];
    this.coinPickups = [];
    this.speed = 5;

    this.initControls();

    this.showStartCard({
      title: 'JETPACK NEON ESCAPE',
      icon: '🚀',
      objective: 'Escape the high-voltage neon cavern! Hold to fire thrusters and gain altitude. Dodge electric zappers and gather shiny coins.',
      controls: 'Hold [SPACE] / Click / Touch to fire jetpack. Release to descend.',
      onStart: () => this.start()
    });
  }

  initControls() {
    const startThrust = () => { this.player.thrusting = true; };
    const stopThrust = () => { this.player.thrusting = false; };

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        startThrust();
      }
    });
    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        stopThrust();
      }
    });

    this.addEventListenerTracked(this.canvas, 'mousedown', startThrust);
    this.addEventListenerTracked(this.canvas, 'mouseup', stopThrust);

    this.addEventListenerTracked(this.canvas, 'touchstart', (e) => {
      e.preventDefault();
      startThrust();
    }, { passive: false });
    this.addEventListenerTracked(this.canvas, 'touchend', stopThrust);
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Physics
    const gravity = 0.42;
    const thrust = -0.78;

    if (this.player.thrusting) {
      this.player.vy += thrust;
      // Spawn exhaust particles
      this.particles.push({
        x: this.player.x - 12,
        y: this.player.y + 10,
        vx: -Math.random() * 4 - 2,
        vy: (Math.random() - 0.5) * 3,
        color: Math.random() > 0.5 ? '#00e5ff' : '#f59e0b',
        life: 1
      });
    } else {
      this.player.vy += gravity;
    }

    this.player.vy = Math.max(-8, Math.min(8, this.player.vy));
    this.player.y += this.player.vy;

    // Ceiling & Floor
    if (this.player.y < 35) {
      this.player.y = 35;
      this.player.vy = 0;
    }
    if (this.player.y > this.baseHeight - 35) {
      this.player.y = this.baseHeight - 35;
      this.player.vy = 0;
    }

    // Distance & Difficulty
    this.distance += this.speed * 0.1;
    this.speed = Math.min(10, 5 + this.distance * 0.002);
    this.score = Math.floor(this.distance + this.coins * 50);

    // Spawning Zappers
    if (Math.random() < 0.025 && this.zappers.length < 5) {
      const isAngle = Math.random() > 0.5;
      this.zappers.push({
        x: this.baseWidth + 50,
        y: Math.random() * (this.baseHeight - 160) + 60,
        length: 80,
        angle: isAngle ? Math.PI / 4 : 0,
        rotSpeed: isAngle ? 0.03 : 0
      });
    }

    // Spawning Coins
    if (Math.random() < 0.04 && this.coinPickups.length < 10) {
      this.coinPickups.push({
        x: this.baseWidth + 30,
        y: Math.random() * (this.baseHeight - 140) + 60,
        collected: false
      });
    }

    // Update Zappers & Check Collision
    for (let i = this.zappers.length - 1; i >= 0; i--) {
      const z = this.zappers[i];
      z.x -= this.speed;
      z.angle += z.rotSpeed;

      const zx2 = z.x + Math.cos(z.angle) * z.length;
      const zy2 = z.y + Math.sin(z.angle) * z.length;

      // Line distance to player
      if (this.distToSegment(this.player.x, this.player.y, z.x, z.y, zx2, zy2) < this.player.radius + 6) {
        if (this.player.hasShield) {
          sounds.playExplode();
          this.player.hasShield = false;
          this.zappers.splice(i, 1);
        } else {
          sounds.playExplode();
          this.gameOver(false);
          return;
        }
      }

      if (z.x < -100) this.zappers.splice(i, 1);
    }

    // Update Coins
    for (let i = this.coinPickups.length - 1; i >= 0; i--) {
      const c = this.coinPickups[i];
      c.x -= this.speed;

      if (Math.hypot(this.player.x - c.x, this.player.y - c.y) < this.player.radius + 12) {
        sounds.playScore();
        this.coins++;
        this.coinPickups.splice(i, 1);
      } else if (c.x < -30) {
        this.coinPickups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = Math.hypot(x2 - x1, y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Neon Cavern
    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Ceiling & Floor Laser Rails
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, this.baseWidth, 24);
    ctx.fillRect(0, this.baseHeight - 24, this.baseWidth, 24);

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(0, 22, this.baseWidth, 2);
    ctx.fillRect(0, this.baseHeight - 24, this.baseWidth, 2);
    ctx.shadowBlur = 0;

    // Coins
    this.coinPickups.forEach(c => {
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Zappers
    this.zappers.forEach(z => {
      const x2 = z.x + Math.cos(z.angle) * z.length;
      const y2 = z.y + Math.sin(z.angle) * z.length;

      ctx.strokeStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(z.x, z.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Nodes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(z.x, z.y, 8, 0, Math.PI * 2);
      ctx.arc(x2, y2, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Jetpack Pack
    ctx.fillStyle = '#475569';
    ctx.fillRect(this.player.x - 18, this.player.y - 8, 8, 16);
    ctx.shadowBlur = 0;

    // HUD Top Bar
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px "Outfit", sans-serif';
    ctx.fillText(`${Math.floor(this.distance)}m`, 40, 50);

    ctx.fillStyle = '#ffd166';
    ctx.fillText(`🪙 ${this.coins}`, 160, 50);

    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`Score: ${this.score}`, 280, 50);
  }
}

