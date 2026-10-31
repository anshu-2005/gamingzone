/* ====================================================
   BLOCK PUZZLE 1010 — GAMINGZONE
   High-Addiction 10x10 Grid Polyomino Line Clearer
   - Place 3 Randomized Polyomino Shapes onto 10x10 Board
   - Clear Full Horizontal & Vertical Rows with Combos
   - Neon Glow Particle Blasts & Score Multipliers
   - Responsive Touch Drag & Click Placement
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

// Polyomino definitions (coordinates [r, c], color)
const SHAPES = [
  { shape: [[0, 0]], color: '#00e5ff' }, // Single
  { shape: [[0, 0], [0, 1]], color: '#38bdf8' }, // 2-Horiz
  { shape: [[0, 0], [1, 0]], color: '#38bdf8' }, // 2-Vert
  { shape: [[0, 0], [0, 1], [0, 2]], color: '#10b981' }, // 3-Horiz
  { shape: [[0, 0], [1, 0], [2, 0]], color: '#10b981' }, // 3-Vert
  { shape: [[0, 0], [0, 1], [0, 2], [0, 3]], color: '#8b5cf6' }, // 4-Horiz
  { shape: [[0, 0], [1, 0], [2, 0], [3, 0]], color: '#8b5cf6' }, // 4-Vert
  { shape: [[0, 0], [0, 1], [1, 0], [1, 1]], color: '#ffd166' }, // 2x2 Square
  { shape: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], color: '#ef4444' }, // 3x3
  { shape: [[0, 0], [1, 0], [1, 1]], color: '#ec4899' }, // L-small
  { shape: [[0, 0], [0, 1], [1, 1], [2, 1]], color: '#f97316' }, // L-shape
  { shape: [[0, 0], [0, 1], [0, 2], [1, 1]], color: '#06b6d4' } // T-shape
];

export class BlockPuzzle1010Game extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Block Puzzle 1010',
      targetScore: 4000,
      ...config
    });

    this.createCanvas(760, 600);

    this.gridSize = 10;
    this.board = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
    this.boardCellSize = 36;
    this.boardStartX = (this.baseWidth - this.gridSize * this.boardCellSize) / 2;
    this.boardStartY = 40;

    this.hand = [];
    this.selectedHandIdx = null;
    this.particles = [];
    this.combo = 0;

    this.dealHand();
    this.initInteraction();

    this.showStartCard({
      title: 'BLOCK PUZZLE 1010',
      icon: '🧩',
      objective: 'Fit polyomino blocks into the 10x10 grid. Complete horizontal or vertical lines to vaporize them and score huge combo points!',
      controls: 'Click a shape below to select it, then click on the grid to drop it.',
      onStart: () => this.start()
    });
  }

  dealHand() {
    this.hand = [];
    for (let i = 0; i < 3; i++) {
      const template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      this.hand.push({
        ...template,
        used: false
      });
    }

    if (this.checkGameOver()) {
      sounds.playGameOver();
      this.gameOver(false);
    }
  }

  initInteraction() {
    const handleClick = (clientX, clientY) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      // Check click on Hand shapes below (y: 430 to 570)
      if (my >= 430) {
        const slotWidth = this.baseWidth / 3;
        const slotIdx = Math.floor(mx / slotWidth);
        if (slotIdx >= 0 && slotIdx < 3 && !this.hand[slotIdx].used) {
          sounds.playClick();
          this.selectedHandIdx = slotIdx;
        }
        return;
      }

      // Check click on Board
      if (this.selectedHandIdx !== null) {
        const col = Math.floor((mx - this.boardStartX) / this.boardCellSize);
        const row = Math.floor((my - this.boardStartY) / this.boardCellSize);

        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
          this.tryPlaceShape(row, col);
        }
      }
    };

    this.addEventListenerTracked(this.canvas, 'click', (e) => handleClick(e.clientX, e.clientY));
    this.addEventListenerTracked(this.canvas, 'touchstart', (e) => {
      if (e.touches[0]) {
        handleClick(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }

  canPlaceShape(shape, startR, startC) {
    for (const [dr, dc] of shape) {
      const r = startR + dr;
      const c = startC + dc;
      if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) return false;
      if (this.board[r][c] !== null) return false;
    }
    return true;
  }

  tryPlaceShape(startR, startC) {
    const current = this.hand[this.selectedHandIdx];
    if (!current || current.used) return;

    if (this.canPlaceShape(current.shape, startR, startC)) {
      sounds.playHit();

      // Place shape
      for (const [dr, dc] of current.shape) {
        this.board[startR + dr][startC + dc] = current.color;
      }
      this.score += current.shape.length * 10;
      current.used = true;
      this.selectedHandIdx = null;

      // Check line clears
      this.clearLines();

      // Check if hand is fully used
      if (this.hand.every(h => h.used)) {
        this.dealHand();
      } else if (this.checkGameOver()) {
        sounds.playGameOver();
        this.gameOver(false);
      }
    }
  }

  clearLines() {
    const fullRows = [];
    const fullCols = [];

    // Rows
    for (let r = 0; r < this.gridSize; r++) {
      if (this.board[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }

    // Cols
    for (let c = 0; c < this.gridSize; c++) {
      let isColFull = true;
      for (let r = 0; r < this.gridSize; r++) {
        if (this.board[r][c] === null) {
          isColFull = false;
          break;
        }
      }
      if (isColFull) fullCols.push(c);
    }

    const linesCount = fullRows.length + fullCols.length;
    if (linesCount > 0) {
      sounds.playScore();
      this.combo++;
      const bonus = linesCount * 100 * this.combo;
      this.score += bonus;

      fullRows.forEach(r => {
        for (let c = 0; c < this.gridSize; c++) {
          this.createExplosion(this.boardStartX + c * this.boardCellSize + 18, this.boardStartY + r * this.boardCellSize + 18, this.board[r][c]);
          this.board[r][c] = null;
        }
      });

      fullCols.forEach(c => {
        for (let r = 0; r < this.gridSize; r++) {
          if (this.board[r][c] !== null) {
            this.createExplosion(this.boardStartX + c * this.boardCellSize + 18, this.boardStartY + r * this.boardCellSize + 18, this.board[r][c]);
            this.board[r][c] = null;
          }
        }
      });
    } else {
      this.combo = 0;
    }
  }

  checkGameOver() {
    for (const item of this.hand) {
      if (item.used) continue;
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          if (this.canPlaceShape(item.shape, r, c)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: color || '#00e5ff',
        life: 1
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark sleek background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Draw 10x10 Board Grid
    ctx.fillStyle = '#111827';
    ctx.fillRect(this.boardStartX - 8, this.boardStartY - 8, this.gridSize * this.boardCellSize + 16, this.gridSize * this.boardCellSize + 16);

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const x = this.boardStartX + c * this.boardCellSize;
        const y = this.boardStartY + r * this.boardCellSize;
        const color = this.board[r][c];

        if (color) {
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, this.boardCellSize - 4, this.boardCellSize - 4, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#1f2937';
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, this.boardCellSize - 4, this.boardCellSize - 4, 4);
          ctx.fill();
        }
      }
    }

    // Hand Shapes Dock
    const slotW = this.baseWidth / 3;
    this.hand.forEach((item, idx) => {
      const cx = idx * slotW + slotW / 2;
      const cy = 500;
      const isSelected = this.selectedHandIdx === idx;

      if (isSelected) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(idx * slotW + 15, 435, slotW - 30, 130);
      }

      if (!item.used) {
        ctx.fillStyle = item.color;
        item.shape.forEach(([dr, dc]) => {
          ctx.beginPath();
          ctx.roundRect(cx + (dc - 1) * 20, cy + (dr - 1) * 20, 18, 18, 3);
          ctx.fill();
        });
      }
    });

    // Explosions
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Header HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px "Outfit", sans-serif';
    ctx.fillText(`Score: ${this.score}`, 40, 30);

    if (this.combo > 1) {
      ctx.fillStyle = '#ffd166';
      ctx.fillText(`COMBO x${this.combo}!`, this.baseWidth - 180, 30);
    }
  }
}

