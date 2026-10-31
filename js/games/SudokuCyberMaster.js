/* ====================================================
   SUDOKU CYBER MASTER — GAMINGZONE
   Authentic 9x9 Sudoku Puzzle Engine with Row/Column/Box
   Rule Verification, Conflict Highlighting & Multiple Boards
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

// Pre-generated verified solvable puzzles
const SUDOKU_PUZZLES = [
  {
    name: 'Cyber Grid Alpha (Medium)',
    initial: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ]
  },
  {
    name: 'Neon Matrix Beta (Easy)',
    initial: [
      [0, 2, 0, 6, 0, 8, 0, 0, 0],
      [5, 8, 0, 0, 0, 9, 7, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 0],
      [3, 7, 0, 0, 0, 0, 5, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 8, 0, 0, 0, 0, 1, 3],
      [0, 0, 0, 0, 2, 0, 0, 0, 0],
      [0, 0, 9, 8, 0, 0, 0, 3, 6],
      [0, 0, 0, 3, 0, 6, 0, 9, 0]
    ]
  }
];

export class SudokuCyberMasterGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Sudoku Cyber Master',
      targetScore: 2000,
      timeLimit: 300,
      ...config
    });

    this.puzzleIdx = 0;
    this.initialGrid = [];
    this.grid = [];
    this.selectedCell = null;
    this.conflicts = new Set();
    this.mistakes = 0;

    this.cellSize = 48;
    this.startX = 0;
    this.startY = 65;

    this.createCanvas(520, 620);
    this.startX = (this.baseWidth - 9 * this.cellSize) / 2;

    this.loadPuzzle(0);
    this.initSudokuControls();

    this.showStartCard({
      title: 'SUDOKU CYBER MASTER',
      icon: '🔢',
      objective: 'Fill the 9x9 grid so every row, column, and 3x3 box contains digits 1 to 9 without repetition.',
      controls: 'Tap a cell, then tap a number below (or press 1-9 on keyboard). Tap X to erase.',
      onStart: () => this.start()
    });
  }

  loadPuzzle(idx) {
    this.puzzleIdx = idx % SUDOKU_PUZZLES.length;
    const p = SUDOKU_PUZZLES[this.puzzleIdx];
    this.initialGrid = JSON.parse(JSON.stringify(p.initial));
    this.grid = JSON.parse(JSON.stringify(p.initial));
    this.selectedCell = null;
    this.conflicts.clear();
  }

  initSudokuControls() {
    // Touch & Mouse Pointer
    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check Grid Clicks
      const c = Math.floor((mx - this.startX) / this.cellSize);
      const r = Math.floor((my - this.startY) / this.cellSize);
      if (r >= 0 && r < 9 && c >= 0 && c < 9) {
        if (this.initialGrid[r][c] === 0) {
          this.selectedCell = { r, c };
          sounds.playClick();
        }
        return;
      }

      // Check Number Pad Clicks at bottom (y: 520 - 580)
      if (my >= 520 && my <= 580) {
        // Digits 1-9
        for (let i = 1; i <= 9; i++) {
          const btnX = this.startX + (i - 1) * 42;
          if (mx >= btnX && mx <= btnX + 38) {
            this.inputDigit(i);
            return;
          }
        }
        // Erase Button (X)
        const eraseX = this.startX + 9 * 42;
        if (mx >= eraseX && mx <= eraseX + 44) {
          this.eraseCell();
          return;
        }
      }
    });

    // Keyboard Numbers 1-9, Backspace, Delete
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        this.inputDigit(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        this.eraseCell();
      }
    });
  }

  inputDigit(num) {
    if (!this.selectedCell) return;
    const { r, c } = this.selectedCell;
    if (this.initialGrid[r][c] !== 0) return;

    this.grid[r][c] = num;
    sounds.playCoin();
    this.validateGrid();
    this.checkVictory();
  }

  eraseCell() {
    if (!this.selectedCell) return;
    const { r, c } = this.selectedCell;
    if (this.initialGrid[r][c] !== 0) return;

    this.grid[r][c] = 0;
    sounds.playClick();
    this.validateGrid();
  }

  validateGrid() {
    this.conflicts.clear();

    // Check rows
    for (let r = 0; r < 9; r++) {
      const seen = new Map();
      for (let c = 0; c < 9; c++) {
        const val = this.grid[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            this.conflicts.add(`${r},${c}`);
            this.conflicts.add(`${r},${seen.get(val)}`);
          } else {
            seen.set(val, c);
          }
        }
      }
    }

    // Check columns
    for (let c = 0; c < 9; c++) {
      const seen = new Map();
      for (let r = 0; r < 9; r++) {
        const val = this.grid[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            this.conflicts.add(`${r},${c}`);
            this.conflicts.add(`${seen.get(val)},${c}`);
          } else {
            seen.set(val, r);
          }
        }
      }
    }

    // Check 3x3 boxes
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const seen = new Map();
        for (let r = br * 3; r < br * 3 + 3; r++) {
          for (let c = bc * 3; c < bc * 3 + 3; c++) {
            const val = this.grid[r][c];
            if (val !== 0) {
              if (seen.has(val)) {
                this.conflicts.add(`${r},${c}`);
                const [prevR, prevC] = seen.get(val);
                this.conflicts.add(`${prevR},${prevC}`);
              } else {
                seen.set(val, [r, c]);
              }
            }
          }
        }
      }
    }
  }

  checkVictory() {
    if (this.conflicts.size > 0) return;

    // Check if completely filled
    let complete = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.grid[r][c] === 0) complete = false;
      }
    }

    if (complete) {
      sounds.playWin();
      this.score = 1500 + Math.round(this.timeLeft * 2);
      this.finishGame(this.score, { isVictory: true });
    }
  }

  update(dt) {
    if (this.timeLeft > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.finishGame(this.score, { isVictory: false, reason: 'Time expired!' });
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Studio Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText('🔢 SUDOKU MASTER', 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`ERRORS: ${this.conflicts.size > 0 ? this.conflicts.size : 'NONE'}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.timeLeft < 30 ? '#ff0055' : '#10b981';
    ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)}s`, this.baseWidth - 24, 34);

    // Draw 9x9 Board
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const x = this.startX + c * this.cellSize;
        const y = this.startY + r * this.cellSize;
        const isConflict = this.conflicts.has(`${r},${c}`);
        const isSelected = this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c;

        // Background color
        if (isConflict) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        } else if (isSelected) {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
        } else if (this.initialGrid[r][c] !== 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        }
        ctx.fillRect(x, y, this.cellSize, this.cellSize);

        // Thin cell borders
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.cellSize, this.cellSize);

        // Render Cell Digit
        const val = this.grid[r][c];
        if (val !== 0) {
          ctx.font = '900 22px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (isConflict) {
            ctx.fillStyle = '#ef4444';
          } else if (this.initialGrid[r][c] !== 0) {
            ctx.fillStyle = '#94a3b8'; // Given numbers in muted slate
          } else {
            ctx.fillStyle = '#00e5ff'; // User placed in glowing cyan
          }

          ctx.fillText(`${val}`, x + this.cellSize / 2, y + this.cellSize / 2 + 1);
        }
      }
    }

    // Thick 3x3 Subgrid Block Outlines
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= 3; i++) {
      // Horizontal thick lines
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY + i * 3 * this.cellSize);
      ctx.lineTo(this.startX + 9 * this.cellSize, this.startY + i * 3 * this.cellSize);
      ctx.stroke();

      // Vertical thick lines
      ctx.beginPath();
      ctx.moveTo(this.startX + i * 3 * this.cellSize, this.startY);
      ctx.lineTo(this.startX + i * 3 * this.cellSize, this.startY + 9 * this.cellSize);
      ctx.stroke();
    }

    // Number Pad Buttons (1-9) + Erase (X)
    ctx.textBaseline = 'alphabetic';
    for (let i = 1; i <= 9; i++) {
      const btnX = this.startX + (i - 1) * 42;
      const btnY = 525;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(btnX, btnY, 38, 48);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btnX, btnY, 38, 48);

      ctx.font = '900 20px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${i}`, btnX + 19, btnY + 32);
    }

    // Erase Button
    const eraseX = this.startX + 9 * 42;
    const eraseY = 525;
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(eraseX, eraseY, 44, 48);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(eraseX, eraseY, 44, 48);

    ctx.font = '900 16px "Lilita One", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('DEL', eraseX + 22, eraseY + 31);
  }
}
