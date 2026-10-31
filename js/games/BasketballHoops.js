/* ====================================================
   BASKETBALL HOOPS — GAMINGZONE
   Arcade Physics Basketball with Drag-Aim Trajectory Arc,
   Backboard Rebound Physics, Swish Detection, Moving Hoop & Net
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class BasketballHoopsGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Basketball Hoops',
      targetScore: 1200,
      shots: 12,
      ...config
    });

    this.shotsLeft = this.config.shots || 12;
    this.swishes = 0;
    this.streak = 0;

    // Basketball Hoop Setup
    this.hoop = {
      x: 540,
      y: 200,
      rimRadius: 36,
      backboardX: 580,
      backboardY: 120,
      backboardH: 140,
      isMoving: true,
      vy: 65
    };

    // Ball Setup
    this.ball = {
      x: 160,
      y: 440,
      vx: 0,
      vy: 0,
      radius: 20,
      isShot: false,
      rotation: 0
    };

    this.dragStart = null;
    this.currentDrag = null;
    this.particles = [];
    this.announcements = [];

    this.createCanvas(720, 560);
    this.resetBall();
    this.initHoopControls();

    this.showStartCard({
      title: 'BASKETBALL HOOPS',
      icon: '🏀',
      objective: 'Pull back and release to shoot the basketball into the hoop! Score clean swishes for massive combo streaks.',
      controls: 'Drag the basketball backward like a slingshot to aim trajectory, then release to shoot.',
      onStart: () => this.start()
    });
  }

  resetBall() {
    this.ball.x = 160;
    this.ball.y = 440;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.isShot = false;
    this.ball.rotation = 0;
  }

  initHoopControls() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.ball.isShot) return;
      const p = getPos(e);
      if (Math.hypot(p.x - this.ball.x, p.y - this.ball.y) < 70) {
        this.dragStart = p;
        this.currentDrag = p;
      }
    });

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.dragStart) {
        this.currentDrag = getPos(e);
      }
    });

    this.addListener(this.canvas, 'pointerup', () => {
      if (this.dragStart && this.currentDrag) {
        const dx = this.dragStart.x - this.currentDrag.x;
        const dy = this.dragStart.y - this.currentDrag.y;

        if (dy > 25 || dx > 25) {
          this.shootBall(dx * 4.2, -dy * 4.4);
        }
        this.dragStart = null;
        this.currentDrag = null;
      }
    });
  }

  shootBall(vx, vy) {
    this.ball.isShot = true;
    this.ball.vx = vx;
    this.ball.vy = vy;
    this.shotsLeft--;
    sounds.playPowerup();
  }

  update(dt) {
    // Moving Hoop oscillation
    if (this.hoop.isMoving) {
      this.hoop.y += this.hoop.vy * dt;
      if (this.hoop.y < 160) {
        this.hoop.y = 160;
        this.hoop.vy = Math.abs(this.hoop.vy);
      } else if (this.hoop.y > 270) {
        this.hoop.y = 270;
        this.hoop.vy = -Math.abs(this.hoop.vy);
      }
      this.hoop.backboardY = this.hoop.y - 70;
    }

    // Ball in flight physics
    if (this.ball.isShot) {
      this.ball.vy += 980 * dt; // Gravity
      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;
      this.ball.rotation += this.ball.vx * 0.02 * dt;

      // Backboard Rebound
      const bbX = this.hoop.backboardX;
      const bbY1 = this.hoop.backboardY;
      const bbY2 = this.hoop.backboardY + this.hoop.backboardH;

      if (
        this.ball.vx > 0 &&
        this.ball.x + this.ball.radius >= bbX &&
        this.ball.x - this.ball.radius <= bbX + 16 &&
        this.ball.y >= bbY1 &&
        this.ball.y <= bbY2
      ) {
        this.ball.vx = -this.ball.vx * 0.65;
        this.ball.x = bbX - this.ball.radius;
        sounds.playClick();
        this.spawnBurst(this.ball.x, this.ball.y, '#ffffff', 6);
      }

      // Front Rim Collision
      const rimFrontX = this.hoop.x - this.hoop.rimRadius;
      const rimY = this.hoop.y;
      if (Math.hypot(this.ball.x - rimFrontX, this.ball.y - rimY) <= this.ball.radius + 6) {
        this.ball.vx = -this.ball.vx * 0.55;
        this.ball.vy = -this.ball.vy * 0.55;
        sounds.playClick();
      }

      // Check Basket Scored (passing downward through hoop)
      const hoopLeft = this.hoop.x - this.hoop.rimRadius;
      const hoopRight = this.hoop.x + this.hoop.rimRadius;

      if (
        this.ball.vy > 0 &&
        this.ball.y >= this.hoop.y - 5 &&
        this.ball.y <= this.hoop.y + 25 &&
        this.ball.x > hoopLeft &&
        this.ball.x < hoopRight &&
        !this.ball.scored
      ) {
        this.ball.scored = true;
        this.streak++;
        this.swishes++;

        const points = 100 * Math.min(4, this.streak);
        this.score += points;
        sounds.playWin();

        this.announcements.push({ text: `SWISH! +${points}`, y: this.hoop.y - 40, alpha: 1 });
        this.spawnBurst(this.hoop.x, this.hoop.y, '#ffd166', 20);
      }

      // Floor or out-of-bounds reset
      if (this.ball.y > this.baseHeight + 40 || this.ball.x > this.baseWidth + 40) {
        if (!this.ball.scored) {
          this.streak = 0;
          sounds.playHit();
        }

        if (this.shotsLeft <= 0) {
          this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore, swishes: this.swishes });
        } else {
          this.resetBall();
        }
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Announcements
    for (let i = this.announcements.length - 1; i >= 0; i--) {
      const a = this.announcements[i];
      a.y -= 25 * dt;
      a.alpha -= dt * 0.9;
      if (a.alpha <= 0) this.announcements.splice(i, 1);
    }
  }

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        color,
        life: 0.4
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Hardwood Basketball Arena Court
    const bg = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.7, '#1e293b');
    bg.addColorStop(1, '#0a0e17');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Court Hardwood Floor
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 500, this.baseWidth, 60);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(this.baseWidth, 500);
    ctx.stroke();

    // Aim Trajectory Dots when pulling back
    if (this.dragStart && this.currentDrag && !this.ball.isShot) {
      const dx = (this.dragStart.x - this.currentDrag.x) * 4.2;
      const dy = -(this.dragStart.y - this.currentDrag.y) * 4.4;

      ctx.fillStyle = 'rgba(255, 209, 102, 0.6)';
      let simX = this.ball.x;
      let simY = this.ball.y;
      let simVy = dy;

      for (let step = 0; step < 18; step++) {
        simX += dx * 0.04;
        simVy += 980 * 0.04;
        simY += simVy * 0.04;

        ctx.beginPath();
        ctx.arc(simX, simY, 4, 0, Math.PI * 2);
        ctx.fill();
        if (simY > 500) break;
      }

      // Drag elastic band line
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.ball.x, this.ball.y);
      ctx.lineTo(this.currentDrag.x, this.currentDrag.y);
      ctx.stroke();
    }

    // Draw Backboard & Post
    ctx.fillStyle = '#64748b';
    ctx.fillRect(this.hoop.backboardX + 16, this.hoop.backboardY + 30, 20, 360); // Steel Post

    // Backboard Glass Plate
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(this.hoop.backboardX, this.hoop.backboardY, 14, this.hoop.backboardH);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.hoop.backboardX, this.hoop.backboardY + 35, 14, 50);

    // Rim & Net
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.hoop.x - this.hoop.rimRadius, this.hoop.y);
    ctx.lineTo(this.hoop.backboardX, this.hoop.y);
    ctx.stroke();

    // White Rope Net mesh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.hoop.x - this.hoop.rimRadius, this.hoop.y);
    ctx.lineTo(this.hoop.x - 14, this.hoop.y + 45);
    ctx.lineTo(this.hoop.x + 14, this.hoop.y + 45);
    ctx.lineTo(this.hoop.x + this.hoop.rimRadius, this.hoop.y);
    ctx.stroke();

    // Draw Basketball (Orange with black seams)
    ctx.save();
    ctx.translate(this.ball.x, this.ball.y);
    ctx.rotate(this.ball.rotation);

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Black curved seams
    ctx.beginPath();
    ctx.arc(0, 0, this.ball.radius * 0.7, -0.6, 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, this.ball.radius * 0.7, Math.PI - 0.6, Math.PI + 0.6);
    ctx.stroke();

    ctx.restore();

    // Draw Burst Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Announcements
    this.announcements.forEach(a => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.font = '900 32px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(a.text, this.hoop.x, a.y);
      ctx.restore();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🏀 SHOTS: ${this.shotsLeft}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score} ${this.streak > 1 ? `(${this.streak}x 🔥)` : ''}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`SWISHES: ${this.swishes}`, this.baseWidth - 24, 34);
  }
}
