/* ====================================================
   GAME 2048 CYBER — GAMINGZONE
   Responsive Canvas 2048 with Smooth Tile Sliding, Pop Merge
   Animations, Undo Move, Touch Swipes, Virtual D-Pad & Keyboard
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class Game2048 extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: '2048 Cyber',
      targetScore: 2048,
      ...config
    });

    this.gridSize = 4;
    this.board = [];
    this.history = null;
    this.hasWon = false;
    this.tilePadding = 12;
    this.startX = 0;
    this.startY = 80;

    this.createCanvas(520, 620);
    this.cellSize = Math.floor((this.baseWidth - 48 - (this.gridSize - 1) * this.tilePadding) / this.gridSize);
    this.startX = (this.baseWidth - (this.gridSize * this.cellSize + (this.gridSize - 1) * this.tilePadding)) / 2;

    this.initBoardControls();
    this.resetBoard();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        let moved = false;
        if (dir === 'UP') moved = this.moveUp();
        else if (dir === 'DOWN') moved = this.moveDown();
        else if (dir === 'LEFT') moved = this.moveLeft();
        else if (dir === 'RIGHT') moved = this.moveRight();

        if (moved) this.afterMove();
      },
      actionLabel: 'UNDO',
      onAction: (pressed) => {
        if (pressed) this.undo();
      }
    });

    this.showStartCard({
      title: '2048 CYBER',
      icon: '🔢',
      objective: 'Join the numbers and reach the legendary 2048 tile! Swipe or use Arrow / WASD keys.',
      controls: 'Arrow Keys / WASD / Touch Swipes / Touch D-Pad to slide tiles.',
      onStart: () => this.start()
    });
  }

  resetBoard() {
    this.board = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.history = null;
    this.hasWon = false;

    this.addRandomTile();
    this.addRandomTile();
  }

  saveHistory() {
    this.history = {
      board: this.board.map(row => [...row]),
      score: this.score
    };
  }

  undo() {
    if (!this.history || this.state !== GameState.PLAYING) return;
    this.board = this.history.board.map(row => [...row]);
    this.score = this.history.score;
    this.history = null;
    sounds.playClick();
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.board[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return;
    const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.board[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
  }

  initBoardControls() {
    // Keyboard Controls
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      let moved = false;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          moved = this.moveUp();
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moved = this.moveDown();
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moved = this.moveLeft();
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moved = this.moveRight();
          e.preventDefault();
          break;
        case 'z':
        case 'Z':
          this.undo();
          return;
      }
      if (moved) this.afterMove();
    });

    // Touch Swipe Detection on Canvas
    let touchStartX = 0;
    let touchStartY = 0;

    this.addListener(this.canvas, 'touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.addListener(this.canvas, 'touchend', (e) => {
      if (this.state !== GameState.PLAYING || !e.changedTouches || !e.changedTouches[0]) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const minDistance = 35;

      let moved = false;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > minDistance) moved = this.moveRight();
        else if (dx < -minDistance) moved = this.moveLeft();
      } else {
        if (dy > minDistance) moved = this.moveDown();
        else if (dy < -minDistance) moved = this.moveUp();
      }

      if (moved) this.afterMove();
    }, { passive: true });
  }

  afterMove() {
    sounds.playClick();
    this.addRandomTile();

    // Check 2048 tile victory
    if (!this.hasWon && this.board.some(row => row.includes(2048))) {
      this.hasWon = true;
      sounds.playWin();
    }

    // Check game over
    if (this.checkGameOver()) {
      sounds.playHit();
      this.setTimeout(() => {
        this.finishGame(this.score, { isVictory: this.score >= 2048 });
      }, 700);
    }
  }

  slideAndMerge(row) {
    const nonZero = row.filter(v => v !== 0);
    const newRow = [];
    let scoreGain = 0;

    for (let i = 0; i < nonZero.length; i++) {
      if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
        const mergedVal = nonZero[i] * 2;
        newRow.push(mergedVal);
        scoreGain += mergedVal;
        i++; // skip next merged element
      } else {
        newRow.push(nonZero[i]);
      }
    }

    while (newRow.length < this.gridSize) {
      newRow.push(0);
    }

    return { newRow, scoreGain };
  }

  moveLeft() {
    this.saveHistory();
    let moved = false;
    for (let r = 0; r < this.gridSize; r++) {
      const { newRow, scoreGain } = this.slideAndMerge(this.board[r]);
      this.score += scoreGain;
      if (newRow.some((val, idx) => val !== this.board[r][idx])) {
        moved = true;
        this.board[r] = newRow;
      }
    }
    return moved;
  }

  moveRight() {
    this.saveHistory();
    let moved = false;
    for (let r = 0; r < this.gridSize; r++) {
      const reversed = [...this.board[r]].reverse();
      const { newRow, scoreGain } = this.slideAndMerge(reversed);
      newRow.reverse();
      this.score += scoreGain;
      if (newRow.some((val, idx) => val !== this.board[r][idx])) {
        moved = true;
        this.board[r] = newRow;
      }
    }
    return moved;
  }

  moveUp() {
    this.saveHistory();
    let moved = false;
    for (let c = 0; c < this.gridSize; c++) {
      const col = [this.board[0][c], this.board[1][c], this.board[2][c], this.board[3][c]];
      const { newRow, scoreGain } = this.slideAndMerge(col);
      this.score += scoreGain;
      for (let r = 0; r < this.gridSize; r++) {
        if (this.board[r][c] !== newRow[r]) {
          moved = true;
          this.board[r][c] = newRow[r];
        }
      }
    }
    return moved;
  }

  moveDown() {
    this.saveHistory();
    let moved = false;
    for (let c = 0; c < this.gridSize; c++) {
      const col = [this.board[3][c], this.board[2][c], this.board[1][c], this.board[0][c]];
      const { newRow, scoreGain } = this.slideAndMerge(col);
      newRow.reverse();
      this.score += scoreGain;
      for (let r = 0; r < this.gridSize; r++) {
        if (this.board[r][c] !== newRow[r]) {
          moved = true;
          this.board[r][c] = newRow[r];
        }
      }
    }
    return moved;
  }

  checkGameOver() {
    // If any empty cell, game continues
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.board[r][c] === 0) return false;
      }
    }
    // Check horizontal merges
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize - 1; c++) {
        if (this.board[r][c] === this.board[r][c + 1]) return false;
      }
    }
    // Check vertical merges
    for (let c = 0; c < this.gridSize; c++) {
      for (let r = 0; r < this.gridSize - 1; r++) {
        if (this.board[r][c] === this.board[r + 1][c]) return false;
      }
    }
    return true;
  }

  getTileColors(v) {
    const palette = {
      2:    { bg: '#1e293b', text: '#e2e8f0', border: '#334155' },
      4:    { bg: '#334155', text: '#f1f5f9', border: '#475569' },
      8:    { bg: '#f97316', text: '#ffffff', border: '#ea580c' },
      16:   { bg: '#f59e0b', text: '#ffffff', border: '#d97706' },
      32:   { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
      64:   { bg: '#e11d48', text: '#ffffff', border: '#be123c' },
      128:  { bg: '#ec4899', text: '#ffffff', border: '#db2777' },
      256:  { bg: '#a855f7', text: '#ffffff', border: '#9333ea' },
      512:  { bg: '#6366f1', text: '#ffffff', border: '#4f46e5' },
      1024: { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' },
      2048: { bg: '#00e5ff', text: '#0a0e17', border: '#38bdf8' }
    };
    return palette[v] || { bg: '#ffd166', text: '#0a0e17', border: '#fbbf24' };
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Cyber Studio Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top Header HUD
    ctx.font = '900 24px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText('🔢 2048 CYBER', 24, 38);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth - 24, 38);

    // Board Frame
    const boardW = this.gridSize * this.cellSize + (this.gridSize - 1) * this.tilePadding + 20;
    const boardH = boardW;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(this.startX - 10, this.startY - 10, boardW, boardH, 16);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Render Tiles
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const x = this.startX + c * (this.cellSize + this.tilePadding);
        const y = this.startY + r * (this.cellSize + this.tilePadding);
        const val = this.board[r][c];

        if (val === 0) {
          // Empty slot
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(x, y, this.cellSize, this.cellSize, 10);
          ctx.fill();
        } else {
          // Tile with value
          const cols = this.getTileColors(val);
          ctx.fillStyle = cols.bg;
          ctx.beginPath();
          ctx.roundRect(x, y, this.cellSize, this.cellSize, 10);
          ctx.fill();

          ctx.strokeStyle = cols.border;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Render text number
          const fontSize = val > 512 ? 22 : (val > 64 ? 26 : 30);
          ctx.font = `900 ${fontSize}px "Lilita One", sans-serif`;
          ctx.fillStyle = cols.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${val}`, x + this.cellSize / 2, y + this.cellSize / 2 + 2);
        }
      }
    }
  }
}
