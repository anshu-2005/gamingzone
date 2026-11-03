import { GameEngineBase } from '../core/GameEngineBase.js';

export class FifteenSlidePuzzle extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Fifteen Sliding Puzzle';
    this.grid = [];
    this.emptyPos = { r: 3, c: 3 };
    this.moves = 0;
    this.timer = 0;
    this.isWon = false;
    this.statusMessage = 'Slide the numbered tiles into 1-15 numerical order!';
  }

  onInit() {
    this.createCanvas();
    this.setupPuzzle();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));
    this.addEventListenerTracked(window, 'keydown', (e) => this.handleKeyDown(e));

    this.showStartCard(
      'FIFTEEN SLIDING PUZZLE',
      'The timeless 15-puzzle sliding tile brain teaser! Click adjacent tiles or use Arrow keys to slide them into numerical order from 1 to 15. Guaranteed solvable!',
      'START SLIDING'
    );
  }

  setupPuzzle() {
    this.moves = 0;
    this.timer = 0;
    this.isWon = false;

    // Start with solved state
    this.grid = [];
    let val = 1;
    for (let r = 0; r < 4; r++) {
      const row = [];
      for (let c = 0; c < 4; c++) {
        row.push(val < 16 ? val : 0);
        val++;
      }
      this.grid.push(row);
    }
    this.emptyPos = { r: 3, c: 3 };

    // Perform 80 random valid moves to scramble
    const dr = [-1, 1, 0, 0];
    const dc = [0, 0, -1, 1];
    for (let i = 0; i < 90; i++) {
      const validDirs = [];
      for (let d = 0; d < 4; d++) {
        const nr = this.emptyPos.r + dr[d];
        const nc = this.emptyPos.c + dc[d];
        if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
          validDirs.push({ r: nr, c: nc });
        }
      }
      const nextTile = validDirs[Math.floor(Math.random() * validDirs.length)];
      // Swap
      this.grid[this.emptyPos.r][this.emptyPos.c] = this.grid[nextTile.r][nextTile.c];
      this.grid[nextTile.r][nextTile.c] = 0;
      this.emptyPos = { r: nextTile.r, c: nextTile.c };
    }

    this.statusMessage = 'Puzzle scrambled! Slide tiles to order 1-15.';
  }

  handleKeyDown(e) {
    if (this.isWon) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.trySlide(this.emptyPos.r + 1, this.emptyPos.c);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.trySlide(this.emptyPos.r - 1, this.emptyPos.c);
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.trySlide(this.emptyPos.r, this.emptyPos.c + 1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.trySlide(this.emptyPos.r, this.emptyPos.c - 1);
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Reset button
    if (mx >= 830 && mx <= 950 && my >= 18 && my <= 52) {
      this.setupPuzzle();
      return;
    }

    if (this.isWon) return;

    // Board coordinates
    const startX = 310;
    const startY = 85;
    const size = 95;

    if (mx >= startX && mx <= startX + 4 * size &&
        my >= startY && my <= startY + 4 * size) {
      const col = Math.floor((mx - startX) / size);
      const row = Math.floor((my - startY) / size);

      this.trySlide(row, col);
    }
  }

  trySlide(r, c) {
    if (r < 0 || r >= 4 || c < 0 || c >= 4) return;

    // Adjacent check to emptyPos
    const isAdjacent = (Math.abs(r - this.emptyPos.r) + Math.abs(c - this.emptyPos.c)) === 1;
    if (isAdjacent) {
      this.grid[this.emptyPos.r][this.emptyPos.c] = this.grid[r][c];
      this.grid[r][c] = 0;
      this.emptyPos = { r, c };
      this.moves++;
      this.checkWin();
    }
  }

  checkWin() {
    let expected = 1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (r === 3 && c === 3) {
          if (this.grid[r][c] !== 0) return;
        } else {
          if (this.grid[r][c] !== expected) return;
          expected++;
        }
      }
    }

    this.isWon = true;
    this.statusMessage = `🏆 SOLVED IN ${this.moves} MOVES & ${Math.round(this.timer)}s!`;
  }

  onUpdate(dt) {
    if (!this.isWon) {
      this.timer += dt;
    }
  }

  onRender(ctx) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 1000, 562);

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 68);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 1000, 68);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔢 FIFTEEN SLIDING PUZZLE', 30, 44);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(`MOVES: ${this.moves}  |  TIME: ${Math.floor(this.timer)}s`, 360, 44);

    // Reset button
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(830, 18, 120, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↺ SHUFFLE', 890, 40);

    // Render 4x4 Grid
    const startX = 310;
    const startY = 85;
    const size = 95;

    // Outer Frame
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(startX - 10, startY - 10, 4 * size + 20, 4 * size + 20, 12);
    ctx.fill();

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.grid[r][c];
        const x = startX + c * size;
        const y = startY + r * size;

        if (val === 0) {
          // Empty slot
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(x + 4, y + 4, size - 8, size - 8, 8);
          ctx.fill();
        } else {
          // Number Tile
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.roundRect(x + 4, y + 4, size - 8, size - 8, 8);
          ctx.fill();

          // Border shine
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Number text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${val}`, x + size / 2, y + size / 2 + 11);
        }
      }
    }

    // Bottom Status
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 508, 1000, 54);
    ctx.fillStyle = this.isWon ? '#10b981' : '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.statusMessage, 500, 540);
  }
}
