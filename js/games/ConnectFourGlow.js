/* ====================================================
   CONNECT FOUR GLOW — GAMINGZONE
   Tactical 4-in-a-Row with Gravity Drop Physics,
   Minimax Smart AI, Winning Highlight Line, and Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ConnectFourGlowGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Connect Four Glow',
      targetScore: 1000,
      ...config
    });

    this.cols = 7;
    this.rows = 6;
    this.cellSize = 68;
    this.startX = 0;
    this.startY = 85;

    this.grid = [];
    this.turn = 1; // 1 = Cyan (Player), 2 = Magenta (CPU)
    this.fallingPieces = [];
    this.winner = null;
    this.winningCells = [];
    this.isAiThinking = false;
    this.hoverCol = -1;

    this.createCanvas(600, 560);
    this.startX = (this.baseWidth - this.cols * this.cellSize) / 2;

    this.initBoardControls();
    this.resetBoard();

    this.showStartCard({
      title: 'CONNECT FOUR GLOW',
      icon: '🔴',
      objective: 'Connect 4 glowing discs vertically, horizontally, or diagonally before the AI opponent!',
      controls: 'Tap any column to drop your neon disc.',
      onStart: () => this.start()
    });
  }

  resetBoard() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.turn = 1;
    this.winner = null;
    this.winningCells = [];
    this.fallingPieces = [];
    this.isAiThinking = false;
  }

  initBoardControls() {
    // Column hover / touch tracking
    const getCol = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const mx = (e.clientX - rect.left) * scaleX;
      return Math.floor((mx - this.startX) / this.cellSize);
    };

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const col = getCol(e);
      if (col >= 0 && col < this.cols) {
        this.hoverCol = col;
      } else {
        this.hoverCol = -1;
      }
    });

    this.addListener(this.canvas, 'pointerleave', () => {
      this.hoverCol = -1;
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.winner || this.isAiThinking) return;
      const col = getCol(e);
      if (col >= 0 && col < this.cols) {
        this.dropPiece(col, 1);
      }
    });
  }

  dropPiece(col, player) {
    // Find bottom-most empty row in column
    let targetRow = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][col] === 0) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return false; // Column is full

    // Reserve cell
    this.grid[targetRow][col] = player;

    // Add falling piece animation
    const targetY = this.startY + targetRow * this.cellSize + this.cellSize / 2;
    this.fallingPieces.push({
      col,
      row: targetRow,
      player,
      x: this.startX + col * this.cellSize + this.cellSize / 2,
      y: this.startY - 30,
      vy: 120,
      targetY,
      bounced: false
    });

    sounds.playCoin();

    // Check Win
    const win = this.checkWin(targetRow, col, player);
    if (win) {
      this.winner = player;
      this.winningCells = win;
      sounds.playWin();

      this.setTimeout(() => {
        const won = (player === 1);
        const finalScore = won ? 1000 : 250;
        this.finishGame(finalScore, { isVictory: won });
      }, 1200);
      return true;
    }

    // Switch turn
    this.turn = player === 1 ? 2 : 1;

    if (this.turn === 2 && !this.winner) {
      this.isAiThinking = true;
      this.setTimeout(() => {
        this.aiTurn();
      }, 500);
    }

    return true;
  }

  aiTurn() {
    if (this.state !== GameState.PLAYING || this.winner) return;

    // AI Decision: Check if AI can win immediately
    for (let c = 0; c < this.cols; c++) {
      const r = this.getAvailableRow(c);
      if (r !== -1) {
        this.grid[r][c] = 2;
        if (this.checkWin(r, c, 2)) {
          this.grid[r][c] = 0;
          this.isAiThinking = false;
          this.dropPiece(c, 2);
          return;
        }
        this.grid[r][c] = 0;
      }
    }

    // Check if player can win on next move -> BLOCK THEM!
    for (let c = 0; c < this.cols; c++) {
      const r = this.getAvailableRow(c);
      if (r !== -1) {
        this.grid[r][c] = 1;
        if (this.checkWin(r, c, 1)) {
          this.grid[r][c] = 0;
          this.isAiThinking = false;
          this.dropPiece(c, 2);
          return;
        }
        this.grid[r][c] = 0;
      }
    }

    // Prefer center columns (3, then 2 & 4, then 1 & 5)
    const preferences = [3, 2, 4, 1, 5, 0, 6];
    for (const c of preferences) {
      if (this.getAvailableRow(c) !== -1) {
        this.isAiThinking = false;
        this.dropPiece(c, 2);
        return;
      }
    }

    this.isAiThinking = false;
  }

  getAvailableRow(col) {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][col] === 0) return r;
    }
    return -1;
  }

  checkWin(r, c, player) {
    const directions = [
      [[0, 1], [0, -1]],   // Horizontal
      [[1, 0], [-1, 0]],   // Vertical
      [[1, 1], [-1, -1]],  // Diagonal \
      [[1, -1], [-1, 1]]   // Diagonal /
    ];

    for (const dir of directions) {
      const winning = [{ r, c }];
      for (const [dr, dc] of dir) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === player) {
          winning.push({ r: nr, c: nc });
          nr += dr;
          nc += dc;
        }
      }
      if (winning.length >= 4) {
        return winning;
      }
    }
    return null;
  }

  update(dt) {
    // Animate falling pieces with gravity and small bounce
    for (let i = this.fallingPieces.length - 1; i >= 0; i--) {
      const p = this.fallingPieces[i];
      p.vy += 1800 * dt; // Gravity
      p.y += p.vy * dt;

      if (p.y >= p.targetY) {
        if (!p.bounced) {
          p.y = p.targetY;
          p.vy = -p.vy * 0.25; // small bounce
          p.bounced = true;
        } else {
          p.y = p.targetY;
          this.fallingPieces.splice(i, 1);
        }
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Dark Studio Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top Header HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = this.turn === 1 ? '#00e5ff' : '#ff007f';
    ctx.textAlign = 'left';
    ctx.fillText(
      this.winner
        ? (this.winner === 1 ? '🎉 YOU WIN!' : '🤖 CPU WINS!')
        : (this.turn === 1 ? '👉 YOUR TURN (CYAN)' : '🤖 CPU THINKING...'),
      24, 38
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('🔴 CONNECT FOUR GLOW', this.baseWidth - 24, 38);

    // Hover piece indicator
    if (this.hoverCol >= 0 && this.hoverCol < this.cols && this.turn === 1 && !this.winner && !this.isAiThinking) {
      const hX = this.startX + this.hoverCol * this.cellSize + this.cellSize / 2;
      ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(hX, this.startY - 20, this.cellSize * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Blue Grid Plate Background
    const plateW = this.cols * this.cellSize + 16;
    const plateH = this.rows * this.cellSize + 16;
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(this.startX - 8, this.startY - 8, plateW, plateH, 16);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Grid Slots
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cx = this.startX + c * this.cellSize + this.cellSize / 2;
        const cy = this.startY + r * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.42;

        const val = this.grid[r][c];

        // Is cell part of falling animation? If so don't draw static yet
        const isAnimating = this.fallingPieces.some(p => p.col === c && p.row === r);

        if (val !== 0 && !isAnimating) {
          // Player piece
          ctx.fillStyle = val === 1 ? '#00e5ff' : '#ff007f';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Disc 3D bevel shine
          ctx.strokeStyle = val === 1 ? '#67e8f9' : '#f472b6';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Highlight winning pieces
          const isWinPiece = this.winningCells.some(w => w.r === r && w.c === c);
          if (isWinPiece) {
            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ffd166';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        } else {
          // Empty dark hole
          ctx.fillStyle = '#060a12';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw Falling Animated Pieces
    this.fallingPieces.forEach(p => {
      ctx.fillStyle = p.player === 1 ? '#00e5ff' : '#ff007f';
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.cellSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}
