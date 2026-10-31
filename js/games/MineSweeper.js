/* ====================================================
   MINESWEEPER CYBER — GAMINGZONE
   Authentic Minesweeper with Guaranteed First-Click Safety,
   Flood-Fill Uncovering, Flag/Dig Mode, and Touch + Mouse Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class MineSweeperGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Minesweeper Cyber',
      targetScore: 1000,
      ...config
    });

    this.rows = 9;
    this.cols = 9;
    this.minesCount = 10;
    this.board = [];
    this.firstClickDone = false;
    this.flagMode = false;
    this.flagsLeft = this.minesCount;
    this.elapsedSeconds = 0;
    this.gameOver = false;
    this.faceEmoji = '😎';

    this.cellSize = 48;
    this.startX = 0;
    this.startY = 90;

    this.createCanvas(500, 600);
    this.startX = (this.baseWidth - this.cols * this.cellSize) / 2;

    this.initMineControls();
    this.resetBoard();

    this.showStartCard({
      title: 'MINESWEEPER CYBER',
      icon: '💣',
      objective: 'Clear the cyber minefield without detonating any hidden mines! Right click (or toggle FLAG mode) to flag suspicious cells.',
      controls: 'Tap/Click to dig. Tap "MODE: DIG / FLAG" or right click to place flags.',
      onStart: () => this.start()
    });
  }

  resetBoard() {
    this.firstClickDone = false;
    this.gameOver = false;
    this.flagMode = false;
    this.flagsLeft = this.minesCount;
    this.elapsedSeconds = 0;
    this.faceEmoji = '😎';

    this.board = Array(this.rows).fill(null).map((_, r) =>
      Array(this.cols).fill(null).map((_, c) => ({
        r, c,
        isMine: false,
        revealed: false,
        flagged: false,
        neighborMines: 0
      }))
    );
  }

  generateMines(safeR, safeC) {
    let placed = 0;
    while (placed < this.minesCount) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);

      // Safe zone around first click (3x3 area)
      const isNearSafe = Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1;

      if (!this.board[r][c].isMine && !isNearSafe) {
        this.board[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighboring mines count
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.board[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc].isMine) {
                count++;
              }
            }
          }
          this.board[r][c].neighborMines = count;
        }
      }
    }
  }

  initMineControls() {
    // Prevent context menu on canvas for right click flagging
    this.addListener(this.canvas, 'contextmenu', (e) => {
      e.preventDefault();
      if (this.state !== GameState.PLAYING || this.gameOver) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const c = Math.floor((mx - this.startX) / this.cellSize);
      const r = Math.floor((my - this.startY) / this.cellSize);
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        this.toggleFlag(r, c);
      }
    });

    // Primary Click / Touch Tap
    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.gameOver) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check Mobile Flag Mode Toggle Button (bottom center: y: 535 - 575)
      if (my >= 535 && my <= 575 && mx >= 120 && mx <= 380) {
        this.flagMode = !this.flagMode;
        sounds.playClick();
        return;
      }

      // Check Face Reset Button (top center: y: 40 - 75)
      if (my >= 40 && my <= 75 && mx >= this.baseWidth / 2 - 25 && mx <= this.baseWidth / 2 + 25) {
        this.resetBoard();
        sounds.playClick();
        return;
      }

      // Check Grid Tile
      const c = Math.floor((mx - this.startX) / this.cellSize);
      const r = Math.floor((my - this.startY) / this.cellSize);

      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        if (e.button === 2 || this.flagMode) {
          this.toggleFlag(r, c);
        } else {
          this.revealCell(r, c);
        }
      }
    });
  }

  toggleFlag(r, c) {
    const cell = this.board[r][c];
    if (cell.revealed) return;

    if (!cell.flagged && this.flagsLeft > 0) {
      cell.flagged = true;
      this.flagsLeft--;
      sounds.playClick();
    } else if (cell.flagged) {
      cell.flagged = false;
      this.flagsLeft++;
      sounds.playClick();
    }
  }

  revealCell(r, c) {
    const cell = this.board[r][c];
    if (cell.revealed || cell.flagged) return;

    // First click guaranteed safe initialization
    if (!this.firstClickDone) {
      this.firstClickDone = true;
      this.generateMines(r, c);
    }

    cell.revealed = true;

    // Hit a mine!
    if (cell.isMine) {
      this.gameOver = true;
      this.faceEmoji = '😵';
      sounds.playHit();

      // Reveal all mines
      this.board.forEach(row => row.forEach(cl => {
        if (cl.isMine) cl.revealed = true;
      }));

      this.setTimeout(() => {
        this.finishGame(this.score, { isVictory: false, reason: 'Stepped on a mine!' });
      }, 1000);
      return;
    }

    sounds.playCoin();
    this.score += 25;

    // Flood fill if 0 neighbor mines
    if (cell.neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            this.revealCell(nr, nc);
          }
        }
      }
    }

    // Check Victory
    this.checkVictory();
  }

  checkVictory() {
    let unrevealedSafe = 0;
    this.board.forEach(row => row.forEach(cell => {
      if (!cell.isMine && !cell.revealed) unrevealedSafe++;
    }));

    if (unrevealedSafe === 0) {
      this.gameOver = true;
      this.faceEmoji = '😎';
      sounds.playWin();
      const timeBonus = Math.max(0, 300 - Math.round(this.elapsedSeconds)) * 3;
      this.score = 1000 + timeBonus;

      this.setTimeout(() => {
        this.finishGame(this.score, { isVictory: true, time: this.elapsedSeconds });
      }, 900);
    }
  }

  update(dt) {
    if (this.firstClickDone && !this.gameOver) {
      this.elapsedSeconds += dt;
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Studio Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top Bar (Mines Counter, Face Restart, Timer)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(this.startX, 35, this.cols * this.cellSize, 46);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.startX, 35, this.cols * this.cellSize, 46);

    // Flags remaining (Left)
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'left';
    ctx.fillText(`🚩 ${String(this.flagsLeft).padStart(2, '0')}`, this.startX + 12, 65);

    // Face Button (Center)
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.faceEmoji, this.baseWidth / 2, 68);

    // Timer (Right)
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'right';
    ctx.fillText(`⏱️ ${String(Math.floor(this.elapsedSeconds)).padStart(3, '0')}`, this.startX + this.cols * this.cellSize - 12, 65);

    // Draw Grid Cells
    const digitColors = ['', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#d97706', '#06b6d4', '#e11d48', '#ffffff'];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.startX + c * this.cellSize;
        const y = this.startY + r * this.cellSize;
        const cell = this.board[r][c];

        if (cell.revealed) {
          ctx.fillStyle = cell.isMine ? '#7f1d1d' : '#1e293b';
          ctx.fillRect(x, y, this.cellSize, this.cellSize);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, this.cellSize, this.cellSize);

          if (cell.isMine) {
            ctx.font = '26px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💣', x + this.cellSize / 2, y + this.cellSize / 2 + 9);
          } else if (cell.neighborMines > 0) {
            ctx.font = '900 22px "Lilita One", sans-serif';
            ctx.fillStyle = digitColors[cell.neighborMines] || '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(`${cell.neighborMines}`, x + this.cellSize / 2, y + this.cellSize / 2 + 8);
          }
        } else {
          // Unrevealed 3D beveled tile
          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y, this.cellSize, this.cellSize);

          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, this.cellSize, this.cellSize);

          if (cell.flagged) {
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🚩', x + this.cellSize / 2, y + this.cellSize / 2 + 8);
          }
        }
      }
    }

    // Mobile Flag/Dig Toggle Button at Bottom
    ctx.fillStyle = this.flagMode ? '#ef4444' : '#0284c7';
    ctx.beginPath();
    ctx.roundRect(140, 535, 220, 42, 12);
    ctx.fill();

    ctx.font = '900 16px "Lilita One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(this.flagMode ? '🚩 MODE: FLAGGING' : '⛏️ MODE: DIGGING', this.baseWidth / 2, 562);
  }
}
