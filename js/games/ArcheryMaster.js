/* ====================================================
   ARCHERY MASTER — GAMINGZONE
   Olympic Target Archery with Recurve Bow Tension, Gravity Drop,
   Dynamic Wind Compensation, Olympic Target Rings & Clean Lifecycle
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ArcheryMasterGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Archery Master',
      targetScore: 50,
      arrows: 6,
      ...config
    });

    this.arrowsLeft = this.config.arrows || 6;
    this.totalBullseyes = 0;
    this.wind = (Math.random() - 0.5) * 80; // Wind velocity in pixels/sec

    // Recurve Bow
    this.bow = {
      x: 100,
      y: 280,
      radius: 44,
      isAiming: false,
      pullDistance: 0,
      aimAngle: 0
    };

    // Target Butt
    this.target = {
      x: 640,
      y: 280,
      radius: 54,
      vy: 60,
      isMoving: true
    };

    this.arrows = [];
    this.particles = [];
    this.announcements = [];

    this.createCanvas(740, 520);
    this.initArcheryControls();

    this.showStartCard({
      title: 'ARCHERY MASTER',
      icon: '🏹',
      objective: 'Draw your recurve bow and shoot for the golden 10-ring bullseye! Check the wind flag and compensate your aim.',
      controls: 'Tap/drag back on the bow to draw the arrow, then release to shoot.',
      onStart: () => this.start()
    });
  }

  initArcheryControls() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.arrowsLeft <= 0) return;
      const p = getPos(e);
      this.bow.isAiming = true;
      this.updateBowAim(p);
    });

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.bow.isAiming) {
        this.updateBowAim(getPos(e));
      }
    });

    this.addListener(this.canvas, 'pointerup', () => {
      if (this.bow.isAiming) {
        if (this.bow.pullDistance > 12) {
          this.shootArrow();
        }
        this.bow.isAiming = false;
        this.bow.pullDistance = 0;
      }
    });
  }

  updateBowAim(p) {
    const dx = p.x - this.bow.x;
    const dy = p.y - this.bow.y;
    // Pulling backward aims forward in opposite angle
    this.bow.aimAngle = Math.atan2(-dy, -dx);
    this.bow.pullDistance = Math.min(65, Math.hypot(dx, dy));
  }

  shootArrow() {
    this.arrowsLeft--;
    const power = 380 + this.bow.pullDistance * 6.5;

    sounds.playLaser();
    this.arrows.push({
      x: this.bow.x,
      y: this.bow.y,
      vx: Math.cos(this.bow.aimAngle) * power,
      vy: Math.sin(this.bow.aimAngle) * power,
      angle: this.bow.aimAngle,
      isFlying: true,
      stuckTargetOffset: null
    });
  }

  update(dt) {
    // Oscillate Target up and down
    if (this.target.isMoving) {
      this.target.y += this.target.vy * dt;
      if (this.target.y < 160) {
        this.target.y = 160;
        this.target.vy = Math.abs(this.target.vy);
      } else if (this.target.y > 400) {
        this.target.y = 400;
        this.target.vy = -Math.abs(this.target.vy);
      }
    }

    // Update Arrows
    for (let i = 0; i < this.arrows.length; i++) {
      const a = this.arrows[i];

      if (a.isFlying) {
        // Gravity & Wind
        a.vy += 320 * dt;
        a.vx += this.wind * 0.15 * dt;

        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.angle = Math.atan2(a.vy, a.vx);

        // Check Target Hit (Plane at x = target.x)
        if (a.x >= this.target.x - 8 && a.x <= this.target.x + 12) {
          const dy = a.y - this.target.y;
          const hitDist = Math.abs(dy);

          if (hitDist <= this.target.radius) {
            // Hit Target!
            a.isFlying = false;
            a.stuckTargetOffset = dy;

            // Olympic Ring Scoring
            let pts = 0;
            if (hitDist <= 10) pts = 10; // Bullseye (Gold)
            else if (hitDist <= 20) pts = 9;  // Gold
            else if (hitDist <= 30) pts = 7;  // Red
            else if (hitDist <= 42) pts = 5;  // Blue
            else pts = 3;                     // Black / White

            this.score += pts;

            if (pts >= 9) {
              this.totalBullseyes++;
              sounds.playWin();
              this.announcements.push({ text: `BULLSEYE! ${pts} PTS! 🎯`, y: 160, alpha: 1 });
              this.spawnBurst(a.x, a.y, '#ffd166', 16);
            } else {
              sounds.playCoin();
              this.announcements.push({ text: `${pts} PTS! ✨`, y: 160, alpha: 1 });
              this.spawnBurst(a.x, a.y, '#ffffff', 8);
            }

            // Shift wind for next arrow
            this.wind = (Math.random() - 0.5) * 80;

            if (this.arrowsLeft <= 0) {
              this.setTimeout(() => {
                this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore, bullseyes: this.totalBullseyes });
              }, 1200);
            }
          }
        }

        // Missed offscreen
        if (a.x > this.baseWidth + 30 || a.y > this.baseHeight + 30) {
          a.isFlying = false;
          sounds.playHit();
          this.announcements.push({ text: 'MISS! ❌', y: 160, alpha: 1 });

          if (this.arrowsLeft <= 0) {
            this.setTimeout(() => {
              this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore });
            }, 1200);
          }
        }
      } else if (a.stuckTargetOffset !== null) {
        // Stuck arrow moves with oscillating target
        a.y = this.target.y + a.stuckTargetOffset;
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
      const an = this.announcements[i];
      an.y -= 25 * dt;
      an.alpha -= dt * 0.9;
      if (an.alpha <= 0) this.announcements.splice(i, 1);
    }
  }

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Archery Range Field (Dusk Sky & Green Grass)
    const sky = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.6, '#064e3b');
    sky.addColorStop(1, '#065f46');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Target Stand Wood Tripod
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.target.x, this.target.y + 10);
    ctx.lineTo(this.target.x - 20, 500);
    ctx.moveTo(this.target.x, this.target.y + 10);
    ctx.lineTo(this.target.x + 20, 500);
    ctx.stroke();

    // Target Butt (Concentric Olympic Rings)
    const rings = [
      { r: 54, color: '#f8fafc' }, // White (1-2)
      { r: 42, color: '#1e293b' }, // Black (3-4)
      { r: 30, color: '#0284c7' }, // Blue (5-6)
      { r: 20, color: '#ef4444' }, // Red (7-8)
      { r: 10, color: '#ffd166' }  // Gold Bullseye (9-10)
    ];

    rings.forEach(ring => {
      ctx.fillStyle = ring.color;
      ctx.beginPath();
      ctx.ellipse(this.target.x, this.target.y, ring.r * 0.45, ring.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw Bow (Wooden Recurve Arc)
    ctx.save();
    ctx.translate(this.bow.x, this.bow.y);

    // Bow Grip & Limbs
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, this.bow.radius, -Math.PI / 2.3, Math.PI / 2.3);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const topX = Math.cos(-Math.PI / 2.3) * this.bow.radius;
    const topY = Math.sin(-Math.PI / 2.3) * this.bow.radius;
    const botX = Math.cos(Math.PI / 2.3) * this.bow.radius;
    const botY = Math.sin(Math.PI / 2.3) * this.bow.radius;

    const pullX = this.bow.isAiming ? -this.bow.pullDistance : 0;
    ctx.moveTo(topX, topY);
    ctx.lineTo(pullX, 0);
    ctx.lineTo(botX, botY);
    ctx.stroke();

    // Nocked Arrow when aiming
    if (this.bow.isAiming) {
      ctx.rotate(this.bow.aimAngle);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-this.bow.pullDistance, 0);
      ctx.lineTo(35, 0);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(42, 0);
      ctx.lineTo(35, -4);
      ctx.lineTo(35, 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Draw Flying / Stuck Arrows
    this.arrows.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-25, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();

      // Feathers
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-25, -3, 8, 6);

      ctx.restore();
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Announcements
    this.announcements.forEach(an => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, an.alpha);
      ctx.font = '900 28px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(an.text, this.baseWidth / 2, an.y);
      ctx.restore();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🏹 ARROWS: ${this.arrowsLeft}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    // Wind indicator
    ctx.textAlign = 'right';
    const windDir = this.wind >= 0 ? '▶' : '◀';
    ctx.fillStyle = Math.abs(this.wind) > 40 ? '#ef4444' : '#10b981';
    ctx.fillText(`💨 WIND: ${windDir} ${Math.abs(Math.round(this.wind / 10))} m/s`, this.baseWidth - 24, 34);
  }
}
