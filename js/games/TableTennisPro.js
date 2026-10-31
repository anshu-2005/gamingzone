/* ====================================================
   TABLE TENNIS PRO — GAMINGZONE
   Tournament Table Tennis with 3D Arc Ball Bounce, Topspin/Backspin,
   Table Surface Shadow, Smart AI, Touch Drag & Keyboard Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class TableTennisProGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Table Tennis Pro',
      targetScore: 7,
      ...config
    });

    this.playerScore = 0;
    this.aiScore = 0;
    this.winningScore = 7;

    this.paddleW = 16;
    this.paddleH = 88;

    this.p1Y = 0;
    this.aiY = 0;
    this.aiSpeed = 290;

    this.ball = {
      x: 0,
      y: 0,
      z: 0, // Height above table
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 9,
      spin: 0
    };

    this.tablePaddingX = 36;
    this.tablePaddingY = 30;
    this.particles = [];

    this.createCanvas(720, 500);
    this.resetPositions();
    this.initTTControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        const step = 45;
        if (dir === 'UP') this.p1Y = Math.max(this.tablePaddingY, this.p1Y - step);
        if (dir === 'DOWN') this.p1Y = Math.min(this.baseHeight - this.tablePaddingY - this.paddleH, this.p1Y + step);
      }
    });

    this.showStartCard({
      title: 'TABLE TENNIS PRO',
      icon: '🏓',
      objective: `First to score ${this.winningScore} points wins the Table Tennis Grand Slam trophy! Move your paddle to return the ball.`,
      controls: 'Move finger or mouse up/down to glide paddle. W/S or Arrow Keys also supported.',
      onStart: () => {
        this.start();
        this.serveBall(1);
      }
    });
  }

  resetPositions() {
    this.p1Y = (this.baseHeight - this.paddleH) / 2;
    this.aiY = (this.baseHeight - this.paddleH) / 2;
    this.ball.x = this.baseWidth / 2;
    this.ball.y = this.baseHeight / 2;
    this.ball.z = 15;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.spin = 0;
  }

  serveBall(servingDirection = 1) {
    const angle = (Math.random() - 0.5) * (Math.PI / 4);
    const speed = 400;
    this.ball.x = this.baseWidth / 2;
    this.ball.y = this.baseHeight / 2;
    this.ball.z = 20;
    this.ball.vx = Math.cos(angle) * speed * servingDirection;
    this.ball.vy = Math.sin(angle) * speed;
    this.ball.vz = 80;
    this.ball.spin = 0;
  }

  initTTControls() {
    // Keyboard Controls
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const step = 32;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.p1Y = Math.max(this.tablePaddingY, this.p1Y - step);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.p1Y = Math.min(this.baseHeight - this.tablePaddingY - this.paddleH, this.p1Y + step);
      }
    });

    // Touch & Pointer Drag
    const updateP1 = (clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = this.baseHeight / rect.height;
      const my = (clientY - rect.top) * scaleY;
      this.p1Y = Math.max(this.tablePaddingY, Math.min(this.baseHeight - this.tablePaddingY - this.paddleH, my - this.paddleH / 2));
    };

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      updateP1(e.clientY);
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      updateP1(e.clientY);
    });
  }

  update(dt) {
    // Ball movement with bounce physics
    this.ball.x += this.ball.vx * dt;
    this.ball.y += (this.ball.vy + this.ball.spin) * dt;

    // Gravity and bounce on table
    this.ball.vz -= 300 * dt; // Gravity
    this.ball.z += this.ball.vz * dt;

    if (this.ball.z <= 0) {
      this.ball.z = 0;
      this.ball.vz = Math.abs(this.ball.vz) * 0.75 + 40; // Bounce
      sounds.playClick();
      this.spawnParticles(this.ball.x, this.ball.y, '#ffffff', 4);
    }

    // Table Side Boundaries Bounce
    const minY = this.tablePaddingY + this.ball.radius;
    const maxY = this.baseHeight - this.tablePaddingY - this.ball.radius;

    if (this.ball.y <= minY) {
      this.ball.y = minY;
      this.ball.vy = Math.abs(this.ball.vy);
      sounds.playClick();
    } else if (this.ball.y >= maxY) {
      this.ball.y = maxY;
      this.ball.vy = -Math.abs(this.ball.vy);
      sounds.playClick();
    }

    // AI Tracking
    const aiTargetY = this.ball.y - this.paddleH / 2;
    const aiDiff = aiTargetY - this.aiY;
    if (Math.abs(aiDiff) > 8) {
      this.aiY += Math.sign(aiDiff) * this.aiSpeed * dt;
      this.aiY = Math.max(this.tablePaddingY, Math.min(this.baseHeight - this.tablePaddingY - this.paddleH, this.aiY));
    }

    // Player Paddle Collision (x = tablePaddingX + 16)
    const p1X = this.tablePaddingX + 16;
    if (
      this.ball.vx < 0 &&
      this.ball.x - this.ball.radius <= p1X + this.paddleW &&
      this.ball.x + this.ball.radius >= p1X &&
      this.ball.y >= this.p1Y &&
      this.ball.y <= this.p1Y + this.paddleH
    ) {
      // Hit ball!
      const hitOffset = (this.ball.y - (this.p1Y + this.paddleH / 2)) / (this.paddleH / 2);
      const angle = hitOffset * (Math.PI / 3.4);
      const speed = Math.min(700, Math.hypot(this.ball.vx, this.ball.vy) * 1.05 + 15);

      this.ball.vx = Math.cos(angle) * speed;
      this.ball.vy = Math.sin(angle) * speed;
      this.ball.vz = 140; // Lift arc
      this.ball.spin = hitOffset * 60; // Impart topspin / backspin
      this.ball.x = p1X + this.paddleW + this.ball.radius;

      sounds.playCoin();
      this.spawnParticles(this.ball.x, this.ball.y, '#00e5ff', 8);
    }

    // AI Paddle Collision (x = baseWidth - tablePaddingX - 16 - paddleW)
    const aiX = this.baseWidth - this.tablePaddingX - 16 - this.paddleW;
    if (
      this.ball.vx > 0 &&
      this.ball.x + this.ball.radius >= aiX &&
      this.ball.x - this.ball.radius <= aiX + this.paddleW &&
      this.ball.y >= this.aiY &&
      this.ball.y <= this.aiY + this.paddleH
    ) {
      const hitOffset = (this.ball.y - (this.aiY + this.paddleH / 2)) / (this.paddleH / 2);
      const angle = hitOffset * (Math.PI / 3.4);
      const speed = Math.min(700, Math.hypot(this.ball.vx, this.ball.vy) * 1.05 + 15);

      this.ball.vx = -Math.cos(angle) * speed;
      this.ball.vy = Math.sin(angle) * speed;
      this.ball.vz = 140;
      this.ball.spin = hitOffset * 60;
      this.ball.x = aiX - this.ball.radius;

      sounds.playCoin();
      this.spawnParticles(this.ball.x, this.ball.y, '#ef4444', 8);
    }

    // Scoring conditions
    if (this.ball.x < 10) {
      // AI scores
      this.aiScore++;
      sounds.playHit();
      this.spawnParticles(10, this.ball.y, '#ef4444', 20);

      if (this.aiScore >= this.winningScore) {
        this.finishGame(this.playerScore * 150, { isVictory: false });
      } else {
        this.serveBall(1);
      }
    } else if (this.ball.x > this.baseWidth - 10) {
      // Player scores
      this.playerScore++;
      sounds.playWin();
      this.spawnParticles(this.baseWidth - 10, this.ball.y, '#10b981', 20);

      if (this.playerScore >= this.winningScore) {
        this.finishGame(this.playerScore * 300, { isVictory: true });
      } else {
        this.serveBall(-1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Arena Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Green Tournament Table Surface
    const tX = this.tablePaddingX;
    const tY = this.tablePaddingY;
    const tW = this.baseWidth - this.tablePaddingX * 2;
    const tH = this.baseHeight - this.tablePaddingY * 2;

    ctx.fillStyle = '#065f46'; // Forest green ITTF table
    ctx.beginPath();
    ctx.roundRect(tX, tY, tW, tH, 12);
    ctx.fill();

    // Table Border (White Lines)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(tX, tY, tW, tH);

    // Center Longitude Dividing Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tX, this.baseHeight / 2);
    ctx.lineTo(tX + tW, this.baseHeight / 2);
    ctx.stroke();

    // Center Net
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(this.baseWidth / 2, tY - 10);
    ctx.lineTo(this.baseWidth / 2, tY + tH + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Net Posts
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.baseWidth / 2 - 3, tY - 14, 6, 8);
    ctx.fillRect(this.baseWidth / 2 - 3, tY + tH + 6, 6, 8);

    // Scores on Table
    ctx.font = '900 64px "Lilita One", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.fillText(`${this.playerScore}`, this.baseWidth / 4, this.baseHeight / 2);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.fillText(`${this.aiScore}`, (3 * this.baseWidth) / 4, this.baseHeight / 2);

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Ball Shadow on Table Surface
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.ball.x, this.ball.y, this.ball.radius * 0.9, this.ball.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Elevated Ball (shifted up by z height)
    const ballRenderY = this.ball.y - this.ball.z;
    ctx.fillStyle = '#ffedd5'; // Table tennis cell ball color
    ctx.beginPath();
    ctx.arc(this.ball.x, ballRenderY, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Player Paddle (Blue Rubber)
    const p1X = this.tablePaddingX + 16;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(p1X, this.p1Y, this.paddleW, this.paddleH, 6);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw AI Paddle (Red Rubber)
    const aiX = this.baseWidth - this.tablePaddingX - 16 - this.paddleW;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(aiX, this.aiY, this.paddleW, this.paddleH, 6);
    ctx.fill();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
