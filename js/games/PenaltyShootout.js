/* ====================================================
   PENALTY SHOOTOUT WORLD CUP — GAMINGZONE
   High-Pressure Penalty Kicks with Magnus Effect Curve Ball,
   Diving Goalkeeper AI, Top-Corner Targets & Net Physics
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PenaltyShootoutGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Penalty Shootout',
      targetScore: 1200,
      shots: 5,
      ...config
    });

    this.shotsLeft = this.config.shots || 5;
    this.goals = 0;
    this.streak = 0;

    // Goal Post Geometry
    this.goal = {
      x: 160,
      y: 90,
      width: 400,
      height: 200
    };

    // Goalkeeper
    this.keeper = {
      x: 360,
      y: 220,
      radius: 26,
      diveVx: 0,
      state: 'ready' // ready, diving, saved
    };

    // Ball
    this.ball = {
      x: 360,
      y: 440,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      curve: 0,
      radius: 16,
      isKicked: false
    };

    this.swipePath = [];
    this.particles = [];
    this.announcements = [];

    this.createCanvas(720, 560);
    this.resetBall();
    this.initPenaltyControls();

    this.showStartCard({
      title: 'PENALTY SHOOTOUT',
      icon: '⚽',
      objective: 'Swipe from the ball toward the goal post to kick! Curve your finger path to bend the shot past the diving goalkeeper.',
      controls: 'Swipe forward from the soccer ball into the goal net.',
      onStart: () => this.start()
    });
  }

  resetBall() {
    this.ball.x = this.baseWidth / 2;
    this.ball.y = 440;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.curve = 0;
    this.ball.radius = 16;
    this.ball.isKicked = false;
    this.ball.scored = false;

    this.keeper.x = this.baseWidth / 2;
    this.keeper.y = 230;
    this.keeper.diveVx = 0;
    this.keeper.state = 'ready';
  }

  initPenaltyControls() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY, time: performance.now() };
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.ball.isKicked) return;
      const p = getPos(e);
      if (Math.hypot(p.x - this.ball.x, p.y - this.ball.y) < 65) {
        this.swipePath = [p];
      }
    });

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.swipePath.length > 0) {
        this.swipePath.push(getPos(e));
      }
    });

    this.addListener(this.canvas, 'pointerup', () => {
      if (this.swipePath.length >= 2 && !this.ball.isKicked) {
        const start = this.swipePath[0];
        const end = this.swipePath[this.swipePath.length - 1];
        const dt = Math.max(0.04, (end.time - start.time) / 1000);

        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // Check forward flick
        if (dy < -40) {
          // Calculate curve from midpoint deflection
          const mid = this.swipePath[Math.floor(this.swipePath.length / 2)];
          const lineX = start.x + dx * 0.5;
          const curveDeflection = (mid.x - lineX) * 2.5;

          this.kickBall(dx * 1.6, dy * 1.5, curveDeflection);
        }
      }
      this.swipePath = [];
    });
  }

  kickBall(vx, vy, curve) {
    this.ball.isKicked = true;
    this.ball.vx = vx;
    this.ball.vy = vy;
    this.ball.curve = curve;
    this.shotsLeft--;
    sounds.playLaser();

    // AI Goalkeeper dive prediction
    const diveDirection = Math.random() < 0.5 ? -1 : 1;
    const diveSpeed = 160 + Math.random() * 120;
    this.keeper.diveVx = diveDirection * diveSpeed;
    this.keeper.state = 'diving';
  }

  update(dt) {
    // Goalkeeper Dive movement
    if (this.keeper.state === 'diving') {
      this.keeper.x += this.keeper.diveVx * dt;
      // Clamp within posts
      this.keeper.x = Math.max(this.goal.x + 20, Math.min(this.goal.x + this.goal.width - 20, this.keeper.x));
    }

    // Ball movement
    if (this.ball.isKicked) {
      this.ball.x += (this.ball.vx + this.ball.curve) * dt;
      this.ball.y += this.ball.vy * dt;
      this.ball.radius = Math.max(9, this.ball.radius - dt * 7); // Shrink as ball recedes toward goal

      // Check Goalkeeper Save
      if (
        this.ball.y <= this.keeper.y + 20 &&
        this.ball.y >= this.keeper.y - 20 &&
        Math.hypot(this.ball.x - this.keeper.x, this.ball.y - this.keeper.y) < this.keeper.radius + 14
      ) {
        sounds.playHit();
        this.ball.isKicked = false;
        this.keeper.state = 'saved';
        this.streak = 0;
        this.announcements.push({ text: 'SAVED BY KEEPER! 🧤', y: 180, alpha: 1 });
        this.spawnBurst(this.ball.x, this.ball.y, '#ef4444', 16);

        this.setTimeout(() => this.afterShot(), 1000);
        return;
      }

      // Check Goal Scored
      if (this.ball.y <= this.goal.y + this.goal.height - 10) {
        const inGoal = (
          this.ball.x >= this.goal.x &&
          this.ball.x <= this.goal.x + this.goal.width &&
          this.ball.y >= this.goal.y &&
          this.ball.y <= this.goal.y + this.goal.height
        );

        if (inGoal && !this.ball.scored) {
          this.ball.scored = true;
          this.ball.isKicked = false;
          this.goals++;
          this.streak++;

          // Bonus for top corners
          const isTopCorner = (this.ball.y <= this.goal.y + 50) && (this.ball.x <= this.goal.x + 60 || this.ball.x >= this.goal.x + this.goal.width - 60);
          const points = isTopCorner ? 400 : 250;
          this.score += points;

          sounds.playWin();
          this.announcements.push({ text: isTopCorner ? 'TOP BINS GOAL! ⚽🔥' : 'GOOOOAL! ⚽🎉', y: 150, alpha: 1 });
          this.spawnBurst(this.ball.x, this.ball.y, '#ffd166', 22);

          this.setTimeout(() => this.afterShot(), 1100);
        } else if (!inGoal) {
          // Missed wide or over crossbar
          sounds.playHit();
          this.ball.isKicked = false;
          this.streak = 0;
          this.announcements.push({ text: 'MISSED TARGET! ❌', y: 180, alpha: 1 });

          this.setTimeout(() => this.afterShot(), 1000);
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

  afterShot() {
    if (this.shotsLeft <= 0) {
      const won = (this.goals >= 3);
      this.finishGame(this.score, { isVictory: won, goals: this.goals });
    } else {
      this.resetBall();
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

    // Green Stadium Turf Pitch
    const pitch = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    pitch.addColorStop(0, '#064e3b');
    pitch.addColorStop(0.5, '#065f46');
    pitch.addColorStop(1, '#047857');
    ctx.fillStyle = pitch;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Stadium Crowd Stands Silhouette at Top
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.baseWidth, 75);

    // Penalty Box Arc White Markings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.baseWidth / 2, 440, 60, Math.PI, 0);
    ctx.stroke();

    // Goal Post Frame (White Steel Posts)
    const gx = this.goal.x;
    const gy = this.goal.y;
    const gw = this.goal.width;
    const gh = this.goal.height;

    // Goal Net Mesh (Backing)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(gx, gy, gw, gh);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    for (let x = gx; x <= gx + gw; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, gy + gh);
      ctx.stroke();
    }
    for (let y = gy; y <= gy + gh; y += 18) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + gw, y);
      ctx.stroke();
    }

    // Thick White Goal Posts & Crossbar
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(gx, gy, gw, gh);

    // Target Corner Rings
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gx + 30, gy + 30, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(gx + gw - 30, gy + 30, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Goalkeeper
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(this.keeper.x, this.keeper.y, this.keeper.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Goalkeeper Gloves
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.keeper.x - 24, this.keeper.y - 8, 8, 0, Math.PI * 2);
    ctx.arc(this.keeper.x + 24, this.keeper.y - 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw Swipe Guide Line
    if (this.swipePath.length >= 2) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      this.swipePath.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    // Draw Soccer Ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pentagon Pattern
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

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
      ctx.fillText(a.text, this.baseWidth / 2, a.y);
      ctx.restore();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`⚽ KICKS LEFT: ${this.shotsLeft}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`GOALS: ${this.goals}/5   •   SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`STREAK: ${this.streak}🔥`, this.baseWidth - 24, 34);
  }
}
