/* ====================================================
   AIR HOCKEY BATTLE — GAMINGZONE
   High-Speed Arcade Neon Table Air Hockey with Real Mallet
   Impulse Physics, Spark Collisions, Smart AI & Touch Drag
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class AirHockeyBattleGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Air Hockey Battle',
      targetScore: 5,
      ...config
    });

    this.playerScore = 0;
    this.aiScore = 0;
    this.targetScore = this.config.targetScore || 5;

    this.goalWidth = 190;
    this.tablePadding = 30;

    // Puck
    this.puck = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 16
    };

    // Mallets (P1 Bottom, AI Top)
    this.p1 = { x: 0, y: 0, prevX: 0, prevY: 0, radius: 28, speed: 0 };
    this.ai = { x: 0, y: 0, radius: 28, speed: 280 };

    this.sparks = [];

    this.createCanvas(540, 700);
    this.resetPositions();
    this.initHockeyControls();

    this.showStartCard({
      title: 'AIR HOCKEY BATTLE',
      icon: '🏒',
      objective: `First to score ${this.targetScore} goals against the cyber hockey AI wins the championship!`,
      controls: 'Drag your neon mallet on the lower half of the table.',
      onStart: () => this.start()
    });
  }

  resetPositions(servingPlayer = 1) {
    this.puck.x = this.baseWidth / 2;
    this.puck.y = servingPlayer === 1 ? this.baseHeight / 2 + 80 : this.baseHeight / 2 - 80;
    this.puck.vx = 0;
    this.puck.vy = 0;

    this.p1.x = this.baseWidth / 2;
    this.p1.y = this.baseHeight - 120;
    this.p1.prevX = this.p1.x;
    this.p1.prevY = this.p1.y;

    this.ai.x = this.baseWidth / 2;
    this.ai.y = 120;
  }

  initHockeyControls() {
    const updateMalletPos = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      // Constrain player to lower table half
      this.p1.prevX = this.p1.x;
      this.p1.prevY = this.p1.y;
      this.p1.x = Math.max(this.tablePadding + this.p1.radius, Math.min(this.baseWidth - this.tablePadding - this.p1.radius, mx));
      this.p1.y = Math.max(this.baseHeight / 2 + this.p1.radius, Math.min(this.baseHeight - this.tablePadding - this.p1.radius, my));
    };

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      updateMalletPos(e.clientX, e.clientY);
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      updateMalletPos(e.clientX, e.clientY);
    });
  }

  update(dt) {
    // Mallet impulse velocities
    const p1Vx = (this.p1.x - this.p1.prevX) / Math.max(dt, 0.016);
    const p1Vy = (this.p1.y - this.p1.prevY) / Math.max(dt, 0.016);

    // AI Mallet Logic (tracks puck when in upper half, defends goal)
    let aiTargetX = this.puck.x;
    let aiTargetY = 120;

    if (this.puck.y < this.baseHeight / 2) {
      aiTargetY = Math.max(80, Math.min(this.baseHeight / 2 - 40, this.puck.y - 30));
    }

    const aiDx = aiTargetX - this.ai.x;
    const aiDy = aiTargetY - this.ai.y;
    const aiDist = Math.hypot(aiDx, aiDy);

    if (aiDist > 5) {
      this.ai.x += (aiDx / aiDist) * this.ai.speed * dt;
      this.ai.y += (aiDy / aiDist) * this.ai.speed * dt;
    }

    // Puck movement with table friction
    this.puck.vx *= 0.992;
    this.puck.vy *= 0.992;
    this.puck.x += this.puck.vx * dt;
    this.puck.y += this.puck.vy * dt;

    // Table Side Walls Bounce
    const minX = this.tablePadding + this.puck.radius;
    const maxX = this.baseWidth - this.tablePadding - this.puck.radius;

    if (this.puck.x <= minX) {
      this.puck.x = minX;
      this.puck.vx = -this.puck.vx * 0.9;
      sounds.playClick();
      this.spawnSparks(this.puck.x, this.puck.y, '#00e5ff');
    } else if (this.puck.x >= maxX) {
      this.puck.x = maxX;
      this.puck.vx = -this.puck.vx * 0.9;
      sounds.playClick();
      this.spawnSparks(this.puck.x, this.puck.y, '#00e5ff');
    }

    // Top / Bottom Endline Walls (except goal opening)
    const goalLeft = (this.baseWidth - this.goalWidth) / 2;
    const goalRight = goalLeft + this.goalWidth;

    // Top wall
    if (this.puck.y <= this.tablePadding + this.puck.radius) {
      if (this.puck.x >= goalLeft && this.puck.x <= goalRight) {
        // Player Scored Goal!
        if (this.puck.y <= this.tablePadding - 10) {
          this.playerScore++;
          sounds.playWin();
          this.spawnSparks(this.puck.x, this.puck.y, '#10b981', 25);

          if (this.playerScore >= this.targetScore) {
            this.finishGame(this.playerScore * 300, { isVictory: true });
          } else {
            this.resetPositions(2);
          }
          return;
        }
      } else {
        this.puck.y = this.tablePadding + this.puck.radius;
        this.puck.vy = -this.puck.vy * 0.9;
        sounds.playClick();
      }
    }

    // Bottom wall
    if (this.puck.y >= this.baseHeight - this.tablePadding - this.puck.radius) {
      if (this.puck.x >= goalLeft && this.puck.x <= goalRight) {
        // AI Scored Goal!
        if (this.puck.y >= this.baseHeight - this.tablePadding + 10) {
          this.aiScore++;
          sounds.playHit();
          this.spawnSparks(this.puck.x, this.puck.y, '#ef4444', 25);

          if (this.aiScore >= this.targetScore) {
            this.finishGame(this.playerScore * 100, { isVictory: false });
          } else {
            this.resetPositions(1);
          }
          return;
        }
      } else {
        this.puck.y = this.baseHeight - this.tablePadding - this.puck.radius;
        this.puck.vy = -this.puck.vy * 0.9;
        sounds.playClick();
      }
    }

    // Collision with Player Mallet
    this.handleMalletCollision(this.p1, p1Vx, p1Vy);

    // Collision with AI Mallet
    this.handleMalletCollision(this.ai, 0, 0);

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }
  }

  handleMalletCollision(mallet, malletVx, malletVy) {
    const dx = this.puck.x - mallet.x;
    const dy = this.puck.y - mallet.y;
    const dist = Math.hypot(dx, dy);
    const minDist = this.puck.radius + mallet.radius;

    if (dist < minDist && dist > 0) {
      // Separate puck outside mallet
      const nx = dx / dist;
      const ny = dy / dist;
      this.puck.x = mallet.x + nx * minDist;
      this.puck.y = mallet.y + ny * minDist;

      // Transfer impulse
      const impulse = 480 + Math.hypot(malletVx, malletVy) * 0.35;
      this.puck.vx = nx * impulse + malletVx * 0.4;
      this.puck.vy = ny * impulse + malletVy * 0.4;

      sounds.playCoin();
      this.spawnSparks(this.puck.x, this.puck.y, '#00e5ff', 8);
    }
  }

  spawnSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.sparks.push({
        x, y,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.5) * 260,
        color,
        life: 0.4
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Neon Table Arena Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Table Surface
    const tX = this.tablePadding;
    const tY = this.tablePadding;
    const tW = this.baseWidth - this.tablePadding * 2;
    const tH = this.baseHeight - this.tablePadding * 2;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(tX, tY, tW, tH, 20);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center Division Line & Circle
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tX, this.baseHeight / 2);
    ctx.lineTo(tX + tW, this.baseHeight / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.baseWidth / 2, this.baseHeight / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Goal Arcs
    const goalLeft = (this.baseWidth - this.goalWidth) / 2;

    // AI Top Goal
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fillRect(goalLeft, tY - 8, this.goalWidth, 16);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(goalLeft, tY - 8, this.goalWidth, 16);

    // Player Bottom Goal
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fillRect(goalLeft, tY + tH - 8, this.goalWidth, 16);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(goalLeft, tY + tH - 8, this.goalWidth, 16);

    // Draw Scores on Table Surface
    ctx.font = '900 64px "Lilita One", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fillText(`${this.aiScore}`, this.baseWidth / 2, this.baseHeight / 2 - 100);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fillText(`${this.playerScore}`, this.baseWidth / 2, this.baseHeight / 2 + 100);

    // Draw Sparks
    this.sparks.forEach(sp => {
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Puck
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(this.puck.x, this.puck.y, this.puck.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw AI Mallet (Red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(this.ai.x, this.ai.y, this.ai.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Player Mallet (Cyan)
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(this.p1.x, this.p1.y, this.p1.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Mallet Handles
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(this.p1.x, this.p1.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.ai.x, this.ai.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}
