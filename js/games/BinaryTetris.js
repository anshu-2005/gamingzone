import { GameEngineBase } from '../core/GameEngineBase.js';

export class BinaryTetris extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Binary Tetris: Bit Matrix';
    this.score = 0;
    this.bytesCleared = 0;
    this.level = 1;
    this.gameOver = false;

    // Grid: 8 columns (1 byte wide!), 14 rows
    this.cols = 8;
    this.rows = 14;
    this.grid = Array.from({ length: 14 }, () => Array(8).fill(null));

    // Active falling piece
    this.piece = null;
    this.dropTimer = 0;
    this.dropInterval = 0.65;
  }

  onInit() {
    this.createCanvas();
    this.spawnPiece();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.gameOver) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.movePiece(-1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.movePiece(1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.dropPieceFast();
      else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.togglePieceBits();
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
    });

    this.showStartCard(
      'BINARY TETRIS',
      'The computer science block stacker! Falling pieces are 8-bit byte blocks (0s & 1s). Move with [A/D], [Down] to drop, [Up / Space] to invert bits! Fill full 8-bit rows to clear data bytes!',
      'BOOT BIT MATRIX'
    );
  }

  restart() {
    this.score = 0;
    this.bytesCleared = 0;
    this.level = 1;
    this.gameOver = false;
    this.grid = Array.from({ length: 14 }, () => Array(8).fill(null));
    this.dropInterval = 0.65;
    this.spawnPiece();
  }

  spawnPiece() {
    // 2-cell or 3-cell piece
    const len = Math.random() < 0.5 ? 2 : 3;
    const bits = [];
    for (let i = 0; i < len; i++) {
      bits.push(Math.random() < 0.5 ? 1 : 0);
    }
    this.piece = {
      c: 3,
      r: 0,
      bits // array of 0s and 1s horizontal
    };

    // Check game over
    for (let i = 0; i < this.piece.bits.length; i++) {
      if (this.grid[0][this.piece.c + i] !== null) {
        this.gameOver = true;
        break;
      }
    }
  }

  movePiece(dir) {
    if (!this.piece) return;
    const newC = this.piece.c + dir;
    if (newC >= 0 && newC + this.piece.bits.length <= this.cols) {
      let canMove = true;
      for (let i = 0; i < this.piece.bits.length; i++) {
        if (this.grid[this.piece.r][newC + i] !== null) {
          canMove = false;
          break;
        }
      }
      if (canMove) this.piece.c = newC;
    }
  }

  togglePieceBits() {
    if (!this.piece) return;
    // Invert bits
    this.piece.bits = this.piece.bits.map(b => (b === 1 ? 0 : 1));
  }

  dropPieceFast() {
    if (!this.piece) return;
    this.stepDrop();
    this.score += 2;
  }

  stepDrop() {
    if (!this.piece) return;
    const nextR = this.piece.r + 1;
    let canFall = true;

    if (nextR >= this.rows) canFall = false;
    else {
      for (let i = 0; i < this.piece.bits.length; i++) {
        if (this.grid[nextR][this.piece.c + i] !== null) {
          canFall = false;
          break;
        }
      }
    }

    if (canFall) {
      this.piece.r = nextR;
    } else {
      // Lock piece into grid
      for (let i = 0; i < this.piece.bits.length; i++) {
        this.grid[this.piece.r][this.piece.c + i] = this.piece.bits[i];
      }
      this.checkLineClears();
      this.spawnPiece();
    }
  }

  checkLineClears() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      // Full row check
      if (this.grid[r].every(cell => cell !== null)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(8).fill(null));
        cleared++;
        r++; // recheck same row index
      }
    }

    if (cleared > 0) {
      this.bytesCleared += cleared;
      this.score += cleared * 300;
      this.dropInterval = Math.max(0.2, 0.65 - this.bytesCleared * 0.03);
    }
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    this.dropTimer += dt;
    if (this.dropTimer >= this.dropInterval) {
      this.dropTimer = 0;
      this.stepDrop();
    }
  }

  onRender(ctx) {
    // Cyber Matrix Background
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, 1000, 562);

    // Matrix Board (8 cols, 14 rows)
    const startX = 340;
    const startY = 75;
    const cellSize = 32;

    // Board Frame
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(startX - 8, startY - 8, 8 * cellSize + 16, 14 * cellSize + 16, 8);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid lines & placed bits
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        const bit = this.grid[r][c];

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        if (bit !== null) {
          ctx.fillStyle = bit === 1 ? '#06b6d4' : '#64748b';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${bit}`, x + cellSize / 2, y + cellSize / 2 + 5);
        }
      }
    }

    // Active falling piece
    if (this.piece && !this.gameOver) {
      for (let i = 0; i < this.piece.bits.length; i++) {
        const x = startX + (this.piece.c + i) * cellSize;
        const y = startY + this.piece.r * cellSize;
        const bit = this.piece.bits[i];

        ctx.fillStyle = bit === 1 ? '#10b981' : '#f59e0b';
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${bit}`, x + cellSize / 2, y + cellSize / 2 + 6);
      }
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 58);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('010 BINARY TETRIS', 30, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  BYTES CLEARED: ${this.bytesCleared}`, 970, 38);

    // Left Info Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(60, 140, 220, 240);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(60, 140, 220, 240);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('BYTE ARCHITECTURE', 80, 175);
    ctx.fillText('• 8 Bits = 1 Byte', 80, 210);
    ctx.fillText('• Fill row to flush', 80, 240);
    ctx.fillText('• [Up/Space] inverts', 80, 270);
    ctx.fillText('• [Down] drop byte', 80, 300);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STACK OVERFLOW!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`TOTAL SCORE: ${this.score} (${this.bytesCleared} Bytes Cleared)`, 500, 290);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('RESTART MATRIX', 500, 362);
    }
  }
}
