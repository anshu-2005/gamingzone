/* ====================================================
   DARTS BULLSEYE KING — GAMINGZONE
   Authentic 20-Sector London Clock Dartboard with Real Angles,
   Doubles, Triples, 50-Point Bullseyes, Sway Aiming & Particle FX
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

// Standard Clock Dartboard Sector Order (starting from top 12 o'clock clockwise)
const DART_SECTORS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

export class DartsBullseyeKingGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Darts Bullseye King',
      targetScore: 500,
      darts: 9,
      ...config
    });

    this.boardCenter = { x: 270, y: 310 };
    this.boardRadius = 160;
    this.dartsLeft = this.config.darts || 9;
    this.score = 0;
    this.dartsThrown = [];
    this.particles = [];
    this.announcements = [];

    // Breathing / Sway Crosshair Aim
    this.aim = {
      x: this.boardCenter.x,
      y: this.boardCenter.y,
      vx: 110,
      vy: 85,
      steady: false
    };

    this.createCanvas(540, 620);
    this.boardCenter.x = this.baseWidth / 2;
    this.initDartControls();

    this.showStartCard({
      title: 'DARTS BULLSEYE KING',
      icon: '🎯',
      objective: 'Throw 9 darts at the board! Aim for Triple 20 (60 pts) and the Red Bullseye (50 pts) to maximize your score.',
      controls: 'Tap or press Space to release dart when the crosshair aligns with your target.',
      onStart: () => this.start()
    });
  }

  initDartControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING || this.dartsLeft <= 0) return;
      if (e.code === 'Space' || e.key === ' ') {
        this.throwDart();
        e.preventDefault();
      }
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.dartsLeft <= 0) return;
      this.throwDart();
    });
  }

  throwDart() {
    this.dartsLeft--;
    const dx = this.aim.x - this.boardCenter.x;
    const dy = this.aim.y - this.boardCenter.y;
    const dist = Math.hypot(dx, dy);

    // Calculate Sector and Ring Multiplier
    const pts = this.calculateDartScore(dx, dy, dist);
    this.score += pts;

    // Sounds & Announcements
    if (pts === 50) {
      sounds.playWin();
      this.announcements.push({ text: 'INNER BULLSEYE! 50 PTS! 🎯', y: 180, alpha: 1 });
      this.spawnBurst(this.aim.x, this.aim.y, '#ef4444', 18);
    } else if (pts >= 50) {
      sounds.playWin();
      this.announcements.push({ text: `TRIPLE HIT! ${pts} PTS! 🔥`, y: 180, alpha: 1 });
      this.spawnBurst(this.aim.x, this.aim.y, '#ffd166', 15);
    } else if (pts > 0) {
      sounds.playCoin();
      this.spawnBurst(this.aim.x, this.aim.y, '#00e5ff', 8);
    } else {
      sounds.playHit();
    }

    this.dartsThrown.push({ x: this.aim.x, y: this.aim.y, pts });

    if (this.dartsLeft <= 0) {
      this.setTimeout(() => {
        this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore, darts: this.dartsThrown.length });
      }, 1000);
    }
  }

  calculateDartScore(dx, dy, dist) {
    // Inner Bullseye (radius <= 10)
    if (dist <= 10) return 50;

    // Outer Bull (radius <= 24)
    if (dist <= 24) return 25;

    // Off-board miss (radius > boardRadius)
    if (dist > this.boardRadius) return 0;

    // Angle calculation (0 angle is 3 o'clock, rotate so 12 o'clock is index 0)
    let angle = Math.atan2(dy, dx) + Math.PI / 2; // 12 o'clock is 0
    if (angle < 0) angle += Math.PI * 2;

    const sectorAngle = (Math.PI * 2) / 20;
    // Shift by half sector so 20 is centered at top
    const shiftedAngle = (angle + sectorAngle / 2) % (Math.PI * 2);
    const sectorIdx = Math.floor(shiftedAngle / sectorAngle);
    const baseValue = DART_SECTORS[sectorIdx] || 20;

    // Ring radii metrics:
    // Triple Ring: radius between 82 and 96
    // Double Ring: radius between 144 and 160
    if (dist >= 82 && dist <= 96) {
      return baseValue * 3; // Triple Ring!
    } else if (dist >= 144 && dist <= 160) {
      return baseValue * 2; // Double Ring!
    }

    return baseValue; // Single Sector
  }

  update(dt) {
    // Sway crosshair within target board area
    this.aim.x += this.aim.vx * dt;
    this.aim.y += this.aim.vy * dt;

    const minX = this.boardCenter.x - 120;
    const maxX = this.boardCenter.x + 120;
    const minY = this.boardCenter.y - 120;
    const maxY = this.boardCenter.y + 120;

    if (this.aim.x < minX || this.aim.x > maxX) this.aim.vx = -this.aim.vx;
    if (this.aim.y < minY || this.aim.y > maxY) this.aim.vy = -this.aim.vy;

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
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Tavern Wood Paneling Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Dartboard Surround Ring (Black Outer Ring)
    const cx = this.boardCenter.x;
    const cy = this.boardCenter.y;

    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(cx, cy, this.boardRadius + 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw 20 Board Sectors
    const sectorAngle = (Math.PI * 2) / 20;

    for (let i = 0; i < 20; i++) {
      const startA = -Math.PI / 2 - sectorAngle / 2 + i * sectorAngle;
      const endA = startA + sectorAngle;
      const isAlt = i % 2 === 0;

      // Outer Single Wedge
      ctx.fillStyle = isAlt ? '#111827' : '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, this.boardRadius, startA, endA);
      ctx.closePath();
      ctx.fill();

      // Double Ring (Outer edge)
      ctx.fillStyle = isAlt ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc(cx, cy, 160, startA, endA);
      ctx.arc(cx, cy, 144, endA, startA, true);
      ctx.closePath();
      ctx.fill();

      // Triple Ring (Midway)
      ctx.fillStyle = isAlt ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc(cx, cy, 96, startA, endA);
      ctx.arc(cx, cy, 82, endA, startA, true);
      ctx.closePath();
      ctx.fill();

      // Number Label around rim
      const labelA = startA + sectorAngle / 2;
      const numX = cx + Math.cos(labelA) * (this.boardRadius + 18);
      const numY = cy + Math.sin(labelA) * (this.boardRadius + 18);

      ctx.font = 'bold 15px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${DART_SECTORS[i]}`, numX, numY);
    }

    // Outer Bull (Green, 25 pts)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();

    // Inner Bullseye (Red, 50 pts)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Silver Wire Spider Matrix
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 160, 0, Math.PI * 2);
    ctx.arc(cx, cy, 144, 0, Math.PI * 2);
    ctx.arc(cx, cy, 96, 0, Math.PI * 2);
    ctx.arc(cx, cy, 82, 0, Math.PI * 2);
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Stuck Darts on Board
    this.dartsThrown.forEach(d => {
      // Dart Flight Tail
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 8, d.y - 12);
      ctx.stroke();
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Moving Crosshair Target
    if (this.dartsLeft > 0) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.aim.x, this.aim.y, 16, 0, Math.PI * 2);
      ctx.moveTo(this.aim.x - 24, this.aim.y);
      ctx.lineTo(this.aim.x + 24, this.aim.y);
      ctx.moveTo(this.aim.x, this.aim.y - 24);
      ctx.lineTo(this.aim.x, this.aim.y + 24);
      ctx.stroke();
    }

    // Draw Announcements
    this.announcements.forEach(a => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.font = '900 24px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(a.text, this.baseWidth / 2, a.y);
      ctx.restore();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🎯 DARTS: ${this.dartsLeft}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`TOTAL SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`TAP TO THROW`, this.baseWidth - 24, 34);
  }
}
