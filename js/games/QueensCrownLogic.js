import { GameEngineBase } from '../core/GameEngineBase.js';

export class QueensCrownLogic extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Queens Crown: Grid Logic';
    this.gridSize = 7;
    this.board = []; // 0 = empty, 1 = 'X', 2 = 'Queen'
    this.regions = [];
    this.regionColors = [
      '#1e3a8a', // Blue
      '#14532d', // Green
      '#701a75', // Purple
      '#78350f', // Orange/Brown
      '#4c0519', // Dark Red
      '#0e7490', // Cyan
      '#3f3f46'  // Slate
    ];

    this.timer = 0;
    this.isWon = false;
    this.statusMessage = 'Place exactly one 👑 Crown per row, column, and colored region! Crowns cannot touch.';
  }

  onInit() {
    this.createCanvas();
    this.setupPuzzle();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));

    this.showStartCard(
      'QUEENS CROWN: GRID LOGIC',
      'The viral crown placement puzzle! Place exactly one Queen Crown (👑) in each row, each column, and each colored region. Crowns CANNOT touch each other, not even diagonally! Click to place X, click again to place Crown.',
      'START PUZZLE'
    );
  }

  setupPuzzle() {
    this.timer = 0;
    this.isWon = false;
    const n = this.gridSize;

    // Initialize board
    this.board = Array.from({ length: n }, () => Array(n).fill(0));

    // Preset solvable colored regions for 7x7
    // Each integer represents region index 0..6
    this.regions = [
      [0, 0, 0, 1, 1, 2, 2],
      [0, 0, 1, 1, 1, 2, 2],
      [3, 3, 3, 1, 4, 4, 2],
      [3, 3, 3, 4, 4, 4, 4],
      [5, 5, 3, 4, 6, 6, 6],
      [5, 5, 5, 6, 6, 6, 6],
      [5, 5, 5, 6, 6, 6, 6]
    ];
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Reset button
    if (mx >= 820 && mx <= 950 && my >= 20 && my <= 60) {
      this.setupPuzzle();
      return;
    }

    if (this.isWon) return;

    // Board coordinates
    const startX = 290;
    const startY = 85;
    const cellSize = 60;

    if (mx >= startX && mx <= startX + this.gridSize * cellSize &&
        my >= startY && my <= startY + this.gridSize * cellSize) {
      const col = Math.floor((mx - startX) / cellSize);
      const row = Math.floor((my - startY) / cellSize);

      // Cycle: 0 (empty) -> 1 (X) -> 2 (Queen) -> 0
      this.board[row][col] = (this.board[row][col] + 1) % 3;
      this.validateBoard();
    }
  }

  validateBoard() {
    const n = this.gridSize;
    let totalQueens = 0;
    let conflicts = false;

    const rowCounts = Array(n).fill(0);
    const colCounts = Array(n).fill(0);
    const regionCounts = Array(n).fill(0);

    const queenPositions = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (this.board[r][c] === 2) {
          totalQueens++;
          rowCounts[r]++;
          colCounts[c]++;
          regionCounts[this.regions[r][c]]++;
          queenPositions.push({ r, c });
        }
      }
    }

    // Check multiple queens in row/col/region
    if (rowCounts.some(cnt => cnt > 1) || colCounts.some(cnt => cnt > 1) || regionCounts.some(cnt => cnt > 1)) {
      conflicts = true;
    }

    // Check adjacent touches (8-directions)
    for (let i = 0; i < queenPositions.length; i++) {
      for (let j = i + 1; j < queenPositions.length; j++) {
        const q1 = queenPositions[i];
        const q2 = queenPositions[j];
        if (Math.abs(q1.r - q2.r) <= 1 && Math.abs(q1.c - q2.c) <= 1) {
          conflicts = true;
          break;
        }
      }
    }

    if (conflicts) {
      this.statusMessage = '⚠️ Rule Violation! Queens cannot share rows/columns/regions or touch.';
    } else {
      this.statusMessage = `Queens Placed: ${totalQueens}/${n}. Keep placing!`;
    }

    if (!conflicts && totalQueens === n) {
      this.isWon = true;
      this.statusMessage = `👑 PUZZLE SOLVED! All ${n} Queens placed perfectly in ${Math.round(this.timer)}s!`;
    }
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

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👑 QUEENS CROWN: GRID LOGIC', 30, 44);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(`TIMER: ${Math.floor(this.timer)}s`, 380, 44);

    // Reset button
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(830, 18, 120, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↺ RESTART', 890, 40);

    // Render Grid
    const startX = 290;
    const startY = 85;
    const cellSize = 60;
    const n = this.gridSize;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        const regIdx = this.regions[r][c];

        // Background color of region
        ctx.fillStyle = this.regionColors[regIdx];
        ctx.fillRect(x, y, cellSize, cellSize);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        // Region boundary lines (thicker)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        if (r === 0 || this.regions[r - 1][c] !== regIdx) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke();
        }
        if (c === 0 || this.regions[r][c - 1] !== regIdx) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke();
        }

        // Draw Cell contents
        const val = this.board[r][c];
        if (val === 1) {
          // Cross 'X'
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✕', x + cellSize / 2, y + cellSize / 2 + 7);
        } else if (val === 2) {
          // Crown 👑
          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👑', x + cellSize / 2, y + cellSize / 2 + 10);
        }
      }
    }

    // Outer Board Frame
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(startX, startY, n * cellSize, n * cellSize);

    // Bottom Help & Status
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 510, 1000, 52);

    ctx.fillStyle = this.isWon ? '#10b981' : '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.statusMessage, 500, 542);
  }
}
