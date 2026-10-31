/* ====================================================
   COLOR SWITCH PULSE — GAMINGZONE
   High-Precision Color Matching Arcade Physics:
   Rotating 4-Color Arcs, Crosses, Prisms, Real Angular
   Collision Math, Star Collectibles & Mobile Tap Physics
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ColorSwitchPulseGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Color Switch Pulse',
      targetScore: 250,
      ...config
    });

    this.colors = ['#ff007f', '#00f2fe', '#ffd166', '#a855f7']; // Magenta, Cyan, Yellow, Purple
    this.colorNames = ['Magenta', 'Cyan', 'Yellow', 'Purple'];

    this.ball = {
      x: 240,
      y: 540,
      vy: 0,
      radius: 10,
      color: this.colors[0],
      jumpForce: -7.6,
      gravity: 0.38
    };

    this.cameraY = 0;
    this.targetCameraY = 0;
    this.obstacles = [];
    this.pickups = []; // Color changers & Stars
    this.particles = [];

    this.createCanvas(480, 640);
    this.initWorld();
    this.initControls();

    this.showStartCard({
      title: 'COLOR SWITCH PULSE',
      icon: '🎨',
      objective: 'Bounce the ball through rotating obstacles matching your ball\'s color. Collect stars and color-switching prisms!',
      controls: 'Tap screen or press Spacebar to bounce upward.',
      onStart: () => this.start()
    });
  }

  initWorld() {
    this.ball.x = 240;
    this.ball.y = 540;
    this.ball.vy = 0;
    this.ball.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.obstacles = [];
    this.pickups = [];
    this.particles = [];

    // Generate progressive obstacles
    let currentY = 360;
    for (let i = 0; i < 30; i++) {
      const type = (i % 3 === 0) ? 'circle' : (i % 3 === 1 ? 'cross' : 'double_circle');
      const dir = (i % 2 === 0) ? 1 : -1;
      const speed = (0.02 + (i * 0.001)) * dir;

      this.obstacles.push({
        type,
        x: 240,
        y: currentY,
        radius: 80,
        thickness: 14,
        angle: Math.random() * Math.PI,
        speed,
        passed: false
      });

      // Star in center of obstacle
      this.pickups.push({
        type: 'star',
        x: 240,
        y: currentY,
        radius: 12,
        collected: false
      });

      // Color changer halfway to next obstacle
      if (i < 29) {
        this.pickups.push({
          type: 'switcher',
          x: 240,
          y: currentY - 140,
          radius: 14,
          collected: false
        });
      }

      currentY -= 280;
    }
  }

  initControls() {
    const doJump = () => {
      if (this.state !== GameState.PLAYING) return;
      this.ball.vy = this.ball.jumpForce;
      sounds.playJump();

      // Spark trail
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: this.ball.x + (Math.random() - 0.5) * 8,
          y: this.ball.y + this.ball.radius,
          vx: (Math.random() - 0.5) * 40,
          vy: 40 + Math.random() * 60,
          color: this.ball.color,
          radius: 3.5,
          alpha: 1,
          life: 0.35
        });
      }
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      doJump();
    });

    this.addListener(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        doJump();
      }
    });
  }

  start() {
    super.start();
    this.ball.vy = -3;
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Apply Ball Physics
    this.ball.vy += this.ball.gravity;
    this.ball.y += this.ball.vy;

    // Camera follow ball upward
    const desiredY = this.ball.y - 360;
    if (desiredY < this.targetCameraY) {
      this.targetCameraY = desiredY;
    }
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.15;

    // Check bottom boundary fall
    if (this.ball.y > this.cameraY + 680) {
      this.onDeath('Fell out of screen!');
      return;
    }

    // Update Obstacles & Collision Math
    for (const obs of this.obstacles) {
      obs.angle += obs.speed;

      // Circle obstacle collision
      if (obs.type === 'circle' || obs.type === 'double_circle') {
        const dist = Math.hypot(this.ball.x - obs.x, this.ball.y - obs.y);
        const ringInner = obs.radius - obs.thickness / 2;
        const ringOuter = obs.radius + obs.thickness / 2;

        if (dist >= ringInner - this.ball.radius && dist <= ringOuter + this.ball.radius) {
          // Ball is intersecting the ring band!
          // Calculate exact polar angle from obstacle center
          const angle = Math.atan2(this.ball.y - obs.y, this.ball.x - obs.x);
          const relativeAngle = ((angle - obs.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const quadrant = Math.floor(relativeAngle / (Math.PI / 2)) % 4;
          const arcColor = this.colors[quadrant];

          if (arcColor !== this.ball.color) {
            this.onDeath('Color mismatch!');
            return;
          }
        }
      } else if (obs.type === 'cross') {
        // Rotating cross with 4 arms
        for (let i = 0; i < 4; i++) {
          const armAngle = obs.angle + i * (Math.PI / 2);
          const armLen = obs.radius;
          const endX = obs.x + Math.cos(armAngle) * armLen;
          const endY = obs.y + Math.sin(armAngle) * armLen;

          // Distance from ball to line segment (obs.x, obs.y) -> (endX, endY)
          const dx = endX - obs.x;
          const dy = endY - obs.y;
          const l2 = dx * dx + dy * dy;
          const t = Math.max(0, Math.min(1, ((this.ball.x - obs.x) * dx + (this.ball.y - obs.y) * dy) / l2));
          const projX = obs.x + t * dx;
          const projY = obs.y + t * dy;
          const dist = Math.hypot(this.ball.x - projX, this.ball.y - projY);

          if (dist < this.ball.radius + 8) {
            const armColor = this.colors[i];
            if (armColor !== this.ball.color) {
              this.onDeath('Hit wrong color cross bar!');
              return;
            }
          }
        }
      }
    }

    // Pickups (Stars and Color switchers)
    for (const p of this.pickups) {
      if (p.collected) continue;
      const d = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
      if (d < this.ball.radius + p.radius) {
        p.collected = true;
        if (p.type === 'star') {
          this.score += 10;
          sounds.playWin();
          for (let k = 0; k < 12; k++) {
            this.particles.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 140,
              color: '#ffd166',
              radius: 3,
              alpha: 1,
              life: 0.5
            });
          }
        } else if (p.type === 'switcher') {
          // Switch to a different color
          const otherColors = this.colors.filter(c => c !== this.ball.color);
          this.ball.color = otherColors[Math.floor(Math.random() * otherColors.length)];
          sounds.playLaser();
          for (let k = 0; k < 16; k++) {
            this.particles.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 160,
              color: this.colors[k % 4],
              radius: 4,
              alpha: 1,
              life: 0.6
            });
          }
        }
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  onDeath(reason) {
    this.state = GameState.GAME_OVER;
    sounds.playHit();

    // Explosion particles
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.ball.x,
        y: this.ball.y,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.5) * 260,
        color: this.ball.color,
        radius: 4 + Math.random() * 4,
        alpha: 1,
        life: 0.8
      });
    }

    this.setTimeout(() => {
      this.gameOver(this.score);
    }, 700);
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep neon backdrop
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    grad.addColorStop(0, '#0a0a16');
    grad.addColorStop(1, '#05050d');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    this.ctx.save();
    this.ctx.translate(0, -this.cameraY);

    // Render Obstacles
    for (const obs of this.obstacles) {
      if (obs.y < this.cameraY - 120 || obs.y > this.cameraY + this.baseHeight + 120) continue;

      if (obs.type === 'circle' || obs.type === 'double_circle') {
        for (let i = 0; i < 4; i++) {
          this.ctx.strokeStyle = this.colors[i];
          this.ctx.lineWidth = obs.thickness;
          this.ctx.shadowColor = this.colors[i];
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          const start = obs.angle + i * (Math.PI / 2);
          const end = start + Math.PI / 2;
          this.ctx.arc(obs.x, obs.y, obs.radius, start, end);
          this.ctx.stroke();
        }

        if (obs.type === 'double_circle') {
          for (let i = 0; i < 4; i++) {
            this.ctx.strokeStyle = this.colors[(i + 1) % 4];
            this.ctx.lineWidth = obs.thickness - 4;
            this.ctx.beginPath();
            const start = -obs.angle * 1.2 + i * (Math.PI / 2);
            const end = start + Math.PI / 2;
            this.ctx.arc(obs.x, obs.y, obs.radius - 24, start, end);
            this.ctx.stroke();
          }
        }
      } else if (obs.type === 'cross') {
        for (let i = 0; i < 4; i++) {
          const armAngle = obs.angle + i * (Math.PI / 2);
          const endX = obs.x + Math.cos(armAngle) * obs.radius;
          const endY = obs.y + Math.sin(armAngle) * obs.radius;

          this.ctx.strokeStyle = this.colors[i];
          this.ctx.lineWidth = 14;
          this.ctx.lineCap = 'round';
          this.ctx.shadowColor = this.colors[i];
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          this.ctx.moveTo(obs.x, obs.y);
          this.ctx.lineTo(endX, endY);
          this.ctx.stroke();
        }
      }
    }

    // Render Pickups
    for (const p of this.pickups) {
      if (p.collected) continue;
      if (p.y < this.cameraY - 50 || p.y > this.cameraY + this.baseHeight + 50) continue;

      if (p.type === 'star') {
        this.ctx.shadowColor = '#ffd166';
        this.ctx.shadowBlur = 12;
        this.ctx.fillStyle = '#ffd166';
        this.ctx.font = '22px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('★', p.x, p.y);
      } else if (p.type === 'switcher') {
        // 4-quadrant sphere
        for (let q = 0; q < 4; q++) {
          this.ctx.fillStyle = this.colors[q];
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.arc(p.x, p.y, p.radius, q * (Math.PI / 2), (q + 1) * (Math.PI / 2));
          this.ctx.closePath();
          this.ctx.fill();
        }
      }
    }

    // Render Particles
    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillStyle = pt.color;
      this.ctx.shadowColor = pt.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Render Ball (if not game over)
    if (this.state === GameState.PLAYING) {
      this.ctx.shadowColor = this.ball.color;
      this.ctx.shadowBlur = 16;
      this.ctx.fillStyle = this.ball.color;
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();

    // HUD
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    this.ctx.fillRect(16, 16, 120, 48);

    this.ctx.font = '900 24px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.score}`, 76, 48);
  }
}
