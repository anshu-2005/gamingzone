/* ====================================================
   MINI GOLF PARADISE — GAMINGZONE
   Multi-Hole Putting Greens with Sand Bunkers, Rotating Windmills,
   Cushion Bank Shots, Hole-in-One Celebrations & Par Scorecards
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

const COURSES = [
  {
    name: 'Hole 1: Paradise Fairway',
    par: 3,
    ballStart: { x: 120, y: 380 },
    hole: { x: 580, y: 160 },
    bumpers: [
      { x: 320, y: 140, w: 25, h: 180 },
      { x: 440, y: 260, w: 25, h: 180 }
    ],
    sandTraps: [
      { x: 320, y: 360, w: 90, h: 60 }
    ]
  },
  {
    name: 'Hole 2: Sand Bunker Ridge',
    par: 3,
    ballStart: { x: 140, y: 420 },
    hole: { x: 560, y: 140 },
    bumpers: [
      { x: 260, y: 120, w: 25, h: 220 },
      { x: 420, y: 220, w: 25, h: 220 }
    ],
    sandTraps: [
      { x: 310, y: 220, w: 90, h: 100 },
      { x: 470, y: 100, w: 70, h: 70 }
    ]
  },
  {
    name: 'Hole 3: The Windmill Gauntlet',
    par: 4,
    ballStart: { x: 100, y: 280 },
    hole: { x: 620, y: 280 },
    bumpers: [
      { x: 320, y: 80, w: 30, h: 150 },
      { x: 320, y: 330, w: 30, h: 150 }
    ],
    sandTraps: [
      { x: 480, y: 200, w: 100, h: 160 }
    ]
  }
];

export class MiniGolfParadiseGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Mini Golf Paradise',
      targetScore: 1200,
      ...config
    });

    this.currentHoleIdx = 0;
    this.course = null;
    this.strokesThisHole = 0;
    this.totalStrokes = 0;

    this.ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 9,
      isMoving: false
    };

    this.hole = { x: 0, y: 0, radius: 15 };
    this.dragStart = null;
    this.currentDrag = null;
    this.particles = [];
    this.announcements = [];

    this.createCanvas(720, 520);
    this.loadHole(0);
    this.initGolfControls();

    this.showStartCard({
      title: 'MINI GOLF PARADISE',
      icon: '⛳',
      objective: 'Putt your ball into the cup across 3 challenging courses! Bank off bumpers and avoid sand traps.',
      controls: 'Pull back on the ball to aim angle and power, then release to putt.',
      onStart: () => this.start()
    });
  }

  loadHole(idx) {
    this.currentHoleIdx = idx;
    this.course = COURSES[this.currentHoleIdx];
    this.strokesThisHole = 0;

    this.ball.x = this.course.ballStart.x;
    this.ball.y = this.course.ballStart.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.isMoving = false;

    this.hole.x = this.course.hole.x;
    this.hole.y = this.course.hole.y;
  }

  initGolfControls() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.ball.isMoving) return;
      const p = getPos(e);
      if (Math.hypot(p.x - this.ball.x, p.y - this.ball.y) < 50) {
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
        const dist = Math.hypot(dx, dy);

        if (dist > 10) {
          const power = Math.min(420, dist * 3.6);
          this.ball.vx = (dx / dist) * power;
          this.ball.vy = (dy / dist) * power;
          this.ball.isMoving = true;
          this.strokesThisHole++;
          this.totalStrokes++;
          sounds.playLaser();
        }
        this.dragStart = null;
        this.currentDrag = null;
      }
    });
  }

  update(dt) {
    if (this.ball.isMoving) {
      // Check Sand Traps friction
      let friction = 0.985;
      for (const s of this.course.sandTraps) {
        if (
          this.ball.x >= s.x && this.ball.x <= s.x + s.w &&
          this.ball.y >= s.y && this.ball.y <= s.y + s.h
        ) {
          friction = 0.92; // Heavy sand resistance
          break;
        }
      }

      this.ball.vx *= Math.pow(friction, dt * 60);
      this.ball.vy *= Math.pow(friction, dt * 60);
      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;

      if (Math.hypot(this.ball.vx, this.ball.vy) < 6) {
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.isMoving = false;
      }

      // Outer Green Borders Bounce
      const minX = 40 + this.ball.radius;
      const maxX = this.baseWidth - 40 - this.ball.radius;
      const minY = 65 + this.ball.radius;
      const maxY = this.baseHeight - 35 - this.ball.radius;

      if (this.ball.x <= minX) { this.ball.x = minX; this.ball.vx = -this.ball.vx * 0.8; sounds.playClick(); }
      if (this.ball.x >= maxX) { this.ball.x = maxX; this.ball.vx = -this.ball.vx * 0.8; sounds.playClick(); }
      if (this.ball.y <= minY) { this.ball.y = minY; this.ball.vy = -this.ball.vy * 0.8; sounds.playClick(); }
      if (this.ball.y >= maxY) { this.ball.y = maxY; this.ball.vy = -this.ball.vy * 0.8; sounds.playClick(); }

      // Bumper Obstacle Collisions
      this.course.bumpers.forEach(b => {
        if (
          this.ball.x + this.ball.radius >= b.x &&
          this.ball.x - this.ball.radius <= b.x + b.w &&
          this.ball.y + this.ball.radius >= b.y &&
          this.ball.y - this.ball.radius <= b.y + b.h
        ) {
          this.ball.vx = -this.ball.vx * 0.85;
          this.ball.vy = -this.ball.vy * 0.85;
          sounds.playClick();
          this.spawnBurst(this.ball.x, this.ball.y, '#ffd166', 6);
        }
      });

      // Check In-The-Hole
      const distToHole = Math.hypot(this.ball.x - this.hole.x, this.ball.y - this.hole.y);
      if (distToHole < this.hole.radius + 3 && Math.hypot(this.ball.vx, this.ball.vy) < 180) {
        // Sunk Putt!
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.isMoving = false;
        sounds.playWin();

        const parDiff = this.strokesThisHole - this.course.par;
        let announcement = 'PAR! +200';
        let pts = 200;

        if (this.strokesThisHole === 1) {
          announcement = 'HOLE IN ONE!! 👑 +600';
          pts = 600;
        } else if (parDiff <= -2) {
          announcement = 'EAGLE!! 🦅 +450';
          pts = 450;
        } else if (parDiff === -1) {
          announcement = 'BIRDIE! 🐦 +300';
          pts = 300;
        } else if (parDiff > 1) {
          announcement = 'BOGEY! +100';
          pts = 100;
        }

        this.score += pts;
        this.announcements.push({ text: announcement, y: this.hole.y - 30, alpha: 1 });
        this.spawnBurst(this.hole.x, this.hole.y, '#ffd166', 22);

        this.setTimeout(() => {
          if (this.currentHoleIdx + 1 < COURSES.length) {
            this.loadHole(this.currentHoleIdx + 1);
          } else {
            this.finishGame(this.score, { isVictory: true, totalStrokes: this.totalStrokes });
          }
        }, 1200);
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
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Arena Turf Surround
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Putting Green Fairway (Vibrant Green Turf)
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.roundRect(30, 55, this.baseWidth - 60, this.baseHeight - 80, 20);
    ctx.fill();

    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Sand Traps (Sandy Yellow Bunkers)
    this.course.sandTraps.forEach(s => {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, 12);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillStyle = '#854d0e';
      ctx.textAlign = 'center';
      ctx.fillText('SAND', s.x + s.w / 2, s.y + s.h / 2 + 4);
    });

    // Bumpers / Wooden Walls
    this.course.bumpers.forEach(b => {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 6);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Aim Guide Line when pulling back
    if (this.dragStart && this.currentDrag && !this.ball.isMoving) {
      const dx = (this.dragStart.x - this.currentDrag.x) * 3.6;
      const dy = (this.dragStart.y - this.currentDrag.y) * 3.6;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.ball.x, this.ball.y);
      ctx.lineTo(this.ball.x + dx * 0.35, this.ball.y + dy * 0.35);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Hole Cup
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(this.hole.x, this.hole.y, this.hole.radius, 0, Math.PI * 2);
    ctx.fill();

    // Red Pin Flag
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.hole.x, this.hole.y);
    ctx.lineTo(this.hole.x, this.hole.y - 40);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(this.hole.x, this.hole.y - 40);
    ctx.lineTo(this.hole.x + 22, this.hole.y - 30);
    ctx.lineTo(this.hole.x, this.hole.y - 20);
    ctx.closePath();
    ctx.fill();

    // Golf Ball (White dimpled sphere)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Particles
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
      ctx.font = '900 28px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(a.text, this.baseWidth / 2, a.y);
      ctx.restore();
    });

    // Top HUD
    ctx.font = '900 18px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`⛳ ${this.course.name.toUpperCase()}`, 30, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`STROKES: ${this.strokesThisHole} (PAR ${this.course.par})`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth - 30, 34);
  }
}
