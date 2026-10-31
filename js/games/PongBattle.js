/* ====================================================
   PONG BATTLE NEON — GAMINGZONE
   Arcade Cyber Pong with Spin Physics, Dynamic Rally Speed,
   Neon Particle Sparks, Adaptive AI & Touch/Keyboard Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PongBattleGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Pong Battle Neon',
      targetScore: 5,
      ...config
    });

    this.playerScore = 0;
    this.aiScore = 0;
    this.targetScore = this.config.targetScore || 5;

    this.paddleWidth = 14;
    this.paddleHeight = 84;
    this.p1Y = 0;
    this.aiY = 0;
    this.aiSpeed = 260;

    this.ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 9,
      speed: 360,
      rallyCount: 0
    };

    this.sparks = [];

    this.createCanvas(700, 480);
    this.resetPositions();
    this.initPongControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        if (dir === 'UP') this.p1Y = Math.max(10, this.p1Y - 45);
        if (dir === 'DOWN') this.p1Y = Math.min(this.baseHeight - this.paddleHeight - 10, this.p1Y + 45);
      }
    });

    this.showStartCard({
      title: 'PONG BATTLE NEON',
      icon: '🏓',
      objective: `First to score ${this.targetScore} points against the neon AI paddle wins! Keep the rally going to ramp up the speed.`,
      controls: 'Move mouse/finger up and down (or use W/S or Arrow Keys) to control your paddle.',
      onStart: () => {
        this.start();
        this.serveBall(1);
      }
    });
  }

  resetPositions() {
    this.p1Y = (this.baseHeight - this.paddleHeight) / 2;
    this.aiY = (this.baseHeight - this.paddleHeight) / 2;
    this.ball.x = this.baseWidth / 2;
    this.ball.y = this.baseHeight / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.speed = 360;
    this.ball.rallyCount = 0;
  }

  serveBall(direction = 1) {
    const angle = (Math.random() - 0.5) * (Math.PI / 3);
    this.ball.speed = 360;
    this.ball.rallyCount = 0;
    this.ball.x = this.baseWidth / 2;
    this.ball.y = this.baseHeight / 2;
    this.ball.vx = Math.cos(angle) * this.ball.speed * direction;
    this.ball.vy = Math.sin(angle) * this.ball.speed;
  }

  initPongControls() {
    // Keyboard Listener
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const step = 32;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.p1Y = Math.max(10, this.p1Y - step);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.p1Y = Math.min(this.baseHeight - this.paddleHeight - 10, this.p1Y + step);
      }
    });

    // Touch & Pointer Drag
    const updatePaddle = (clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = this.baseHeight / rect.height;
      const my = (clientY - rect.top) * scaleY;
      this.p1Y = Math.max(10, Math.min(this.baseHeight - this.paddleHeight - 10, my - this.paddleHeight / 2));
    };

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      updatePaddle(e.clientY);
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      updatePaddle(e.clientY);
    });
  }

  update(dt) {
    // Ball movement
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Ceiling & Floor Bounce
    if (this.ball.y <= this.ball.radius + 6) {
      this.ball.y = this.ball.radius + 6;
      this.ball.vy = Math.abs(this.ball.vy);
      sounds.playClick();
      this.spawnSparks(this.ball.x, this.ball.y, '#ffffff', 5);
    } else if (this.ball.y >= this.baseHeight - this.ball.radius - 6) {
      this.ball.y = this.baseHeight - this.ball.radius - 6;
      this.ball.vy = -Math.abs(this.ball.vy);
      sounds.playClick();
      this.spawnSparks(this.ball.x, this.ball.y, '#ffffff', 5);
    }

    // AI Paddle Tracking
    const aiCenter = this.aiY + this.paddleHeight / 2;
    const aiDiff = this.ball.y - aiCenter;
    if (Math.abs(aiDiff) > 10) {
      const step = Math.sign(aiDiff) * this.aiSpeed * dt;
      this.aiY = Math.max(10, Math.min(this.baseHeight - this.paddleHeight - 10, this.aiY + step));
    }

    // Player Paddle Collision (Left side: x = 24)
    const p1X = 24;
    if (
      this.ball.vx < 0 &&
      this.ball.x - this.ball.radius <= p1X + this.paddleWidth &&
      this.ball.x + this.ball.radius >= p1X &&
      this.ball.y >= this.p1Y &&
      this.ball.y <= this.p1Y + this.paddleHeight
    ) {
      this.ball.rallyCount++;
      this.ball.speed = Math.min(750, 360 + this.ball.rallyCount * 25);

      // Deflection angle based on hit location
      const hitOffset = (this.ball.y - (this.p1Y + this.paddleHeight / 2)) / (this.paddleHeight / 2);
      const angle = hitOffset * (Math.PI / 3.2);

      this.ball.vx = Math.cos(angle) * this.ball.speed;
      this.ball.vy = Math.sin(angle) * this.ball.speed;
      this.ball.x = p1X + this.paddleWidth + this.ball.radius;

      sounds.playClick();
      this.spawnSparks(this.ball.x, this.ball.y, '#00e5ff', 8);
    }

    // AI Paddle Collision (Right side: x = baseWidth - 24 - paddleWidth)
    const aiX = this.baseWidth - 24 - this.paddleWidth;
    if (
      this.ball.vx > 0 &&
      this.ball.x + this.ball.radius >= aiX &&
      this.ball.x - this.ball.radius <= aiX + this.paddleWidth &&
      this.ball.y >= this.aiY &&
      this.ball.y <= this.aiY + this.paddleHeight
    ) {
      this.ball.rallyCount++;
      this.ball.speed = Math.min(750, 360 + this.ball.rallyCount * 25);

      const hitOffset = (this.ball.y - (this.aiY + this.paddleHeight / 2)) / (this.paddleHeight / 2);
      const angle = hitOffset * (Math.PI / 3.2);

      this.ball.vx = -Math.cos(angle) * this.ball.speed;
      this.ball.vy = Math.sin(angle) * this.ball.speed;
      this.ball.x = aiX - this.ball.radius;

      sounds.playClick();
      this.spawnSparks(this.ball.x, this.ball.y, '#ef4444', 8);
    }

    // Score Check (Past left or right boundary)
    if (this.ball.x < -20) {
      // AI scores
      this.aiScore++;
      sounds.playHit();
      this.spawnSparks(10, this.ball.y, '#ef4444', 20);

      if (this.aiScore >= this.targetScore) {
        this.finishGame(this.playerScore * 200, { isVictory: false });
      } else {
        this.serveBall(1);
      }
    } else if (this.ball.x > this.baseWidth + 20) {
      // Player scores
      this.playerScore++;
      sounds.playWin();
      this.spawnSparks(this.baseWidth - 10, this.ball.y, '#10b981', 20);

      if (this.playerScore >= this.targetScore) {
        this.finishGame(this.playerScore * 300, { isVictory: true });
      } else {
        this.serveBall(-1);
      }
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }
  }

  spawnSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.sparks.push({
        x, y,
        vx: (Math.random() - 0.5) * 250,
        vy: (Math.random() - 0.5) * 250,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Dark Cyber Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Center Dashed Net Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(this.baseWidth / 2, 0);
    ctx.lineTo(this.baseWidth / 2, this.baseHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Big Scores in Background
    ctx.font = '900 80px "Lilita One", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.fillText(`${this.playerScore}`, this.baseWidth / 4, this.baseHeight / 2);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fillText(`${this.aiScore}`, (3 * this.baseWidth) / 4, this.baseHeight / 2);

    // Draw Sparks
    this.sparks.forEach(sp => {
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Paddle (Cyan)
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.roundRect(24, this.p1Y, this.paddleWidth, this.paddleHeight, 6);
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw AI Paddle (Red)
    const aiX = this.baseWidth - 24 - this.paddleWidth;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(aiX, this.aiY, this.paddleWidth, this.paddleHeight, 6);
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Ball (Glowing Gold/White)
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
