/* ====================================================
   BUBBLE SHOOTER BLITZ — GAMINGZONE
   Arcade Bubble Shooter with Trajectory Aiming Laser, Real
   Hex-Snap Physics, Disconnected Drop Mechanics & Particle Burst
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

const BUBBLE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

export class BubbleShooterBlitzGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Bubble Shooter Blitz',
      targetScore: 2000,
      ...config
    });

    this.bubbleRadius = 18;
    this.rows = 11;
    this.cols = 12;
    this.grid = []; // 2D array or null
    this.flyingBubble = null;
    this.fallingBubbles = [];
    this.particles = [];
    this.misses = 0;

    this.createCanvas(560, 620);

    this.cannonX = this.baseWidth / 2;
    this.cannonY = this.baseHeight - 50;
    this.cannonAngle = -Math.PI / 2;
    this.currentColor = this.randomColor();
    this.nextColor = this.randomColor();

    this.initShooterControls();
    this.initGrid();

    this.showStartCard({
      title: 'BUBBLE SHOOTER BLITZ',
      icon: '🔮',
      objective: 'Aim and match 3 or more bubbles of the same color to pop them! Clear the board before bubbles reach the bottom.',
      controls: 'Move mouse/finger to aim. Tap or release to fire bubble.',
      onStart: () => this.start()
    });
  }

  randomColor() {
    return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      const colsInRow = (r % 2 === 0) ? this.cols : this.cols - 1;
      for (let c = 0; c < colsInRow; c++) {
        if (r < 5) {
          this.grid[r][c] = {
            color: this.randomColor(),
            active: true
          };
        } else {
          this.grid[r][c] = null;
        }
      }
    }
  }

  getBubbleCoords(r, c) {
    const isOdd = (r % 2 === 1);
    const offsetX = isOdd ? this.bubbleRadius + 28 : 28;
    const x = offsetX + c * (this.bubbleRadius * 2 + 2);
    const y = 50 + r * (this.bubbleRadius * 1.75);
    return { x, y };
  }

  initShooterControls() {
    const updateAim = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      const angle = Math.atan2(my - this.cannonY, mx - this.cannonX);
      // Constrain aiming angle to upper hemisphere
      this.cannonAngle = Math.max(-Math.PI * 0.92, Math.min(-Math.PI * 0.08, angle));
    };

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      updateAim(e.clientX, e.clientY);
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.flyingBubble) return;
      updateAim(e.clientX, e.clientY);
      this.shootBubble();
    });
  }

  shootBubble() {
    const speed = 750;
    this.flyingBubble = {
      x: this.cannonX,
      y: this.cannonY - 20,
      vx: Math.cos(this.cannonAngle) * speed,
      vy: Math.sin(this.cannonAngle) * speed,
      color: this.currentColor
    };

    this.currentColor = this.nextColor;
    this.nextColor = this.randomColor();
    sounds.playLaser();
  }

  update(dt) {
    // Update flying bubble
    if (this.flyingBubble) {
      this.flyingBubble.x += this.flyingBubble.vx * dt;
      this.flyingBubble.y += this.flyingBubble.vy * dt;

      // Side wall bounce
      if (this.flyingBubble.x <= this.bubbleRadius + 14) {
        this.flyingBubble.x = this.bubbleRadius + 14;
        this.flyingBubble.vx = Math.abs(this.flyingBubble.vx);
        sounds.playClick();
      } else if (this.flyingBubble.x >= this.baseWidth - this.bubbleRadius - 14) {
        this.flyingBubble.x = this.baseWidth - this.bubbleRadius - 14;
        this.flyingBubble.vx = -Math.abs(this.flyingBubble.vx);
        sounds.playClick();
      }

      // Check collision with ceiling or other bubbles
      let collided = false;
      if (this.flyingBubble.y <= 50 + this.bubbleRadius) {
        collided = true;
      } else {
        // Check collision against grid bubbles
        for (let r = 0; r < this.rows; r++) {
          const colsInRow = (r % 2 === 0) ? this.cols : this.cols - 1;
          for (let c = 0; c < colsInRow; c++) {
            const cell = this.grid[r][c];
            if (cell && cell.active) {
              const { x, y } = this.getBubbleCoords(r, c);
              const dx = this.flyingBubble.x - x;
              const dy = this.flyingBubble.y - y;
              if (Math.hypot(dx, dy) <= this.bubbleRadius * 1.85) {
                collided = true;
                break;
              }
            }
          }
          if (collided) break;
        }
      }

      if (collided) {
        this.snapBubbleToGrid(this.flyingBubble);
        this.flyingBubble = null;
      }
    }

    // Update falling detached bubbles
    for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
      const fb = this.fallingBubbles[i];
      fb.vy += 1200 * dt;
      fb.x += fb.vx * dt;
      fb.y += fb.vy * dt;
      if (fb.y > this.baseHeight + 40) {
        this.fallingBubbles.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  snapBubbleToGrid(bubble) {
    // Find closest open grid slot
    let closestDist = Infinity;
    let targetR = 0;
    let targetC = 0;

    for (let r = 0; r < this.rows; r++) {
      const colsInRow = (r % 2 === 0) ? this.cols : this.cols - 1;
      for (let c = 0; c < colsInRow; c++) {
        if (!this.grid[r][c] || !this.grid[r][c].active) {
          const { x, y } = this.getBubbleCoords(r, c);
          const dist = Math.hypot(bubble.x - x, bubble.y - y);
          if (dist < closestDist) {
            closestDist = dist;
            targetR = r;
            targetC = c;
          }
        }
      }
    }

    this.grid[targetR][targetC] = {
      color: bubble.color,
      active: true
    };

    // Find connected matching bubbles
    const matches = this.findMatchingCluster(targetR, targetC, bubble.color);

    if (matches.length >= 3) {
      // Pop matching cluster!
      sounds.playWin();
      this.score += matches.length * 50;

      matches.forEach(({ r, c }) => {
        const { x, y } = this.getBubbleCoords(r, c);
        this.spawnBurst(x, y, this.grid[r][c].color);
        this.grid[r][c] = null;
      });

      // Drop floating unanchored bubbles
      this.dropFloatingBubbles();
    } else {
      sounds.playClick();
      this.misses++;
    }

    // Check bottom row breach (Game Over)
    for (let c = 0; c < this.cols; c++) {
      if (this.grid[this.rows - 1][c] && this.grid[this.rows - 1][c].active) {
        sounds.playHit();
        this.finishGame(this.score, { isVictory: false });
        return;
      }
    }

    // Check Victory (all cleared)
    let anyLeft = false;
    for (let r = 0; r < this.rows; r++) {
      const colsInRow = (r % 2 === 0) ? this.cols : this.cols - 1;
      for (let c = 0; c < colsInRow; c++) {
        if (this.grid[r][c] && this.grid[r][c].active) {
          anyLeft = true;
          break;
        }
      }
      if (anyLeft) break;
    }

    if (!anyLeft) {
      sounds.playWin();
      this.score += 1000;
      this.finishGame(this.score, { isVictory: true });
    }
  }

  findMatchingCluster(startR, startC, targetColor) {
    const visited = new Set();
    const matches = [];
    const queue = [{ r: startR, c: startC }];
    visited.add(`${startR},${startC}`);

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      matches.push({ r, c });

      const neighbors = this.getNeighbors(r, c);
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (!visited.has(key)) {
          visited.add(key);
          const cell = this.grid[n.r][n.c];
          if (cell && cell.active && cell.color === targetColor) {
            queue.push(n);
          }
        }
      }
    }
    return matches;
  }

  getNeighbors(r, c) {
    const isOdd = (r % 2 === 1);
    const offsets = isOdd
      ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
      : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

    const list = [];
    for (const [dr, dc] of offsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < this.rows) {
        const maxC = (nr % 2 === 0) ? this.cols : this.cols - 1;
        if (nc >= 0 && nc < maxC) {
          list.push({ r: nr, c: nc });
        }
      }
    }
    return list;
  }

  dropFloatingBubbles() {
    // Find all bubbles connected to ceiling (row 0)
    const connected = new Set();
    const queue = [];

    for (let c = 0; c < this.cols; c++) {
      if (this.grid[0][c] && this.grid[0][c].active) {
        connected.add(`0,${c}`);
        queue.push({ r: 0, c });
      }
    }

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      const neighbors = this.getNeighbors(r, c);
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (!connected.has(key) && this.grid[n.r][n.c] && this.grid[n.r][n.c].active) {
          connected.add(key);
          queue.push(n);
        }
      }
    }

    // Drop all unanchored bubbles
    for (let r = 0; r < this.rows; r++) {
      const colsInRow = (r % 2 === 0) ? this.cols : this.cols - 1;
      for (let c = 0; c < colsInRow; c++) {
        if (this.grid[r][c] && this.grid[r][c].active && !connected.has(`${r},${c}`)) {
          const { x, y } = this.getBubbleCoords(r, c);
          this.fallingBubbles.push({
            x, y,
            vx: (Math.random() - 0.5) * 150,
            vy: -100 - Math.random() * 100,
            color: this.grid[r][c].color
          });
          this.score += 80;
          this.grid[r][c] = null;
        }
      }
    }
  }

  spawnBurst(x, y, color) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        life: 0.5,
        color
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Forest/Space Studio Background
    const bg = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#060a12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText('🔮 BUBBLE BLITZ', 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth - 24, 34);

    // Aiming Trajectory Guide Line
    if (!this.flyingBubble && this.state === GameState.PLAYING) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.cannonX, this.cannonY);

      let curX = this.cannonX;
      let curY = this.cannonY;
      let dirX = Math.cos(this.cannonAngle);
      let dirY = Math.sin(this.cannonAngle);

      for (let step = 0; step < 20; step++) {
        curX += dirX * 20;
        curY += dirY * 20;
        if (curX <= this.bubbleRadius + 14 || curX >= this.baseWidth - this.bubbleRadius - 14) {
          dirX = -dirX; // bounce line
        }
        ctx.lineTo(curX, curY);
        if (curY <= 50) break;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Grid Bubbles
    for (let r = 0; r < this.rows; r++) {
      const colsInRow = (r % 2 === 0) ? this.cols : this.cols - 1;
      for (let c = 0; c < colsInRow; c++) {
        const cell = this.grid[r][c];
        if (cell && cell.active) {
          const { x, y } = this.getBubbleCoords(r, c);
          this.drawBubble(ctx, x, y, cell.color);
        }
      }
    }

    // Draw Flying Bubble
    if (this.flyingBubble) {
      this.drawBubble(ctx, this.flyingBubble.x, this.flyingBubble.y, this.flyingBubble.color);
    }

    // Draw Falling Bubbles
    this.fallingBubbles.forEach(fb => {
      this.drawBubble(ctx, fb.x, fb.y, fb.color);
    });

    // Draw Burst Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cannon Turret Base
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(this.cannonX, this.cannonY + 10, 36, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Loaded Cannon Bubble
    this.drawBubble(ctx, this.cannonX, this.cannonY - 14, this.currentColor);

    // Next Bubble Preview
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('NEXT:', 40, this.cannonY);
    this.drawBubble(ctx, 90, this.cannonY - 4, this.nextColor, this.bubbleRadius * 0.75);
  }

  drawBubble(ctx, x, y, color, radius = this.bubbleRadius) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3D Glass Sphere Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}
