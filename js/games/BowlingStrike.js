/* ====================================================
   BOWLING STRIKE PRO — GAMINGZONE
   Arcade 10-Pin Bowling with Hook Spin Physics, Cascading
   Pin-to-Pin Domino Collisions, Frame Scorecard & Strikes
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class BowlingStrikeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Bowling Strike Pro',
      targetScore: 1500,
      frames: 5,
      ...config
    });

    this.framesLeft = this.config.frames || 5;
    this.totalStrikes = 0;
    this.laneX = 220;
    this.laneW = 280;

    // Ball
    this.ball = {
      x: 360,
      y: 470,
      vx: 0,
      vy: 0,
      hook: 0,
      radius: 18,
      isRolling: false
    };

    this.pins = [];
    this.particles = [];
    this.announcements = [];
    this.aimX = 360;

    this.createCanvas(720, 560);
    this.init10Pins();
    this.initBowlingControls();

    this.showStartCard({
      title: 'BOWLING STRIKE PRO',
      icon: '🎳',
      objective: 'Aim and roll down the maple wood alley! Hit the pocket between the head pin and adjacent pins for clean STRIKES.',
      controls: 'Move finger or mouse to aim lane position and hook curve, then tap to bowl.',
      onStart: () => this.start()
    });
  }

  init10Pins() {
    this.pins = [];
    // Standard 10-pin triangle setup (deck Y: 110 - 180)
    const pinRows = [
      [{ x: 360, y: 180, id: 1 }],
      [{ x: 342, y: 155, id: 2 }, { x: 378, y: 155, id: 3 }],
      [{ x: 324, y: 130, id: 4 }, { x: 360, y: 130, id: 5 }, { x: 396, y: 130, id: 6 }],
      [{ x: 306, y: 105, id: 7 }, { x: 342, y: 105, id: 8 }, { x: 378, y: 105, id: 9 }, { x: 414, y: 105, id: 10 }]
    ];

    pinRows.forEach(row => {
      row.forEach(p => {
        this.pins.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          knocked: false,
          radius: 10
        });
      });
    });
  }

  initBowlingControls() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return (clientX - rect.left) * scaleX;
    };

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING || this.ball.isRolling) return;
      const mx = getPos(e);
      this.aimX = Math.max(this.laneX + 24, Math.min(this.laneX + this.laneW - 24, mx));
      this.ball.x = this.aimX;
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.ball.isRolling) return;
      const mx = getPos(e);
      this.aimX = Math.max(this.laneX + 24, Math.min(this.laneX + this.laneW - 24, mx));
      this.ball.x = this.aimX;
      this.rollBall();
    });
  }

  rollBall() {
    this.ball.isRolling = true;
    this.ball.vy = -560;
    // Calculate slight hook curve based on offset from center
    const offset = (this.ball.x - (this.laneX + this.laneW / 2)) / (this.laneW / 2);
    this.ball.hook = -offset * 45;
    sounds.playLaser();
  }

  update(dt) {
    if (this.ball.isRolling) {
      this.ball.x += this.ball.hook * dt;
      this.ball.y += this.ball.vy * dt;
      this.ball.radius = Math.max(11, this.ball.radius - dt * 6); // Perspective shrink

      // Check Gutter
      if (this.ball.x < this.laneX + 10 || this.ball.x > this.laneX + this.laneW - 10) {
        sounds.playHit();
        this.ball.vy = -200; // Slows down in gutter
      }

      // Ball to Pin Collisions
      this.pins.forEach(p => {
        if (!p.knocked && Math.hypot(this.ball.x - p.x, this.ball.y - p.y) < this.ball.radius + p.radius) {
          p.knocked = true;
          p.vx = (p.x - this.ball.x) * 8 + (Math.random() - 0.5) * 60;
          p.vy = -180 + (Math.random() - 0.5) * 60;
          sounds.playClick();
          this.spawnBurst(p.x, p.y, '#ffffff', 8);
        }
      });

      // Pin-to-Pin Domino Collisions
      for (let i = 0; i < this.pins.length; i++) {
        for (let j = 0; j < this.pins.length; j++) {
          if (i !== j && this.pins[i].knocked && !this.pins[j].knocked) {
            const p1 = this.pins[i];
            const p2 = this.pins[j];
            if (Math.hypot(p1.x - p2.x, p1.y - p2.y) < 26) {
              p2.knocked = true;
              p2.vx = p1.vx * 0.8 + (Math.random() - 0.5) * 40;
              p2.vy = p1.vy * 0.8 + (Math.random() - 0.5) * 40;
              sounds.playClick();
              this.spawnBurst(p2.x, p2.y, '#ffffff', 6);
            }
          }
        }
      }

      // Update Knocked Pins Movement
      this.pins.forEach(p => {
        if (p.knocked) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.94;
          p.vy *= 0.94;
        }
      });

      // Frame End when ball passes pin deck
      if (this.ball.y < 60) {
        this.ball.isRolling = false;
        const knockedCount = this.pins.filter(p => p.knocked).length;
        const isStrike = (knockedCount === 10);

        if (isStrike) {
          this.totalStrikes++;
          this.score += 500;
          sounds.playWin();
          this.announcements.push({ text: '🎳 STRIKE!! +500', y: 160, alpha: 1 });
          this.spawnBurst(360, 150, '#ffd166', 24);
        } else {
          this.score += knockedCount * 30;
          sounds.playCoin();
          this.announcements.push({ text: `${knockedCount} PINS! +${knockedCount * 30}`, y: 160, alpha: 1 });
        }

        this.framesLeft--;

        this.setTimeout(() => {
          if (this.framesLeft <= 0) {
            this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore, strikes: this.totalStrikes });
          } else {
            this.ball.x = 360;
            this.ball.y = 470;
            this.ball.radius = 18;
            this.ball.vy = 0;
            this.ball.hook = 0;
            this.init10Pins();
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
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color,
        life: 0.4
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Bowling Alley Atmosphere
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Left and Right Gutters
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(this.laneX - 22, 60, 22, 500);
    ctx.fillRect(this.laneX + this.laneW, 60, 22, 500);

    // Polished Maple Wood Lane
    const laneGrad = ctx.createLinearGradient(this.laneX, 0, this.laneX + this.laneW, 0);
    laneGrad.addColorStop(0, '#78350f');
    laneGrad.addColorStop(0.5, '#b45309');
    laneGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = laneGrad;
    ctx.fillRect(this.laneX, 60, this.laneW, 500);

    // Oil Pattern Board Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = this.laneX + 28; x < this.laneX + this.laneW; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, 560);
      ctx.stroke();
    }

    // Aim Arrows on Lane
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 5; i++) {
      const arrX = this.laneX + 45 + i * 48;
      ctx.beginPath();
      ctx.moveTo(arrX, 340);
      ctx.lineTo(arrX - 6, 354);
      ctx.lineTo(arrX + 6, 354);
      ctx.closePath();
      ctx.fill();
    }

    // Draw Pins
    this.pins.forEach(p => {
      ctx.fillStyle = p.knocked ? '#94a3b8' : '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Red neck ring on pin
      if (!p.knocked) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw Bowling Ball (Heavy Marble Blue)
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Finger Grip Holes
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(this.ball.x - 4, this.ball.y - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(this.ball.x + 4, this.ball.y - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(this.ball.x, this.ball.y + 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Aim Guide Line when idle
    if (!this.ball.isRolling) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.ball.x, this.ball.y);
      ctx.lineTo(this.ball.x, 180);
      ctx.stroke();
      ctx.setLineDash([]);
    }

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
      ctx.font = '900 32px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(a.text, 360, a.y);
      ctx.restore();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🎳 FRAMES: ${this.framesLeft}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`STRIKES: ${this.totalStrikes}🔥`, this.baseWidth - 24, 34);
  }
}
