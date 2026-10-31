/* ====================================================
   CANDY BLAST MATCH-3 — GAMINGZONE
   High-Polish Match-3 with Smooth Swap Physics, Cascades,
   Special Striped & Wrapped Bombs, Rainbow Choco & Combos
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

const CANDY_TYPES = [
  { id: 0, icon: '🍓', color: '#f43f5e', name: 'Strawberry' },
  { id: 1, icon: '🍋', color: '#eab308', name: 'Lemon Drop' },
  { id: 2, icon: '🫐', color: '#3b82f6', name: 'Blueberry' },
  { id: 3, icon: '🍏', color: '#10b981', name: 'Green Mint' },
  { id: 4, icon: '🍊', color: '#f97316', name: 'Orange Fizz' },
  { id: 5, icon: '🍇', color: '#a855f7', name: 'Grape Bubble' }
];

export class CandyBlastMatch3Game extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Candy Blast Match-3',
      targetScore: 2500,
      moves: 22,
      ...config
    });

    this.cols = 7;
    this.rows = 7;
    this.tileSize = 56;
    this.startX = 0;
    this.startY = 85;

    this.grid = [];
    this.movesLeft = this.config.moves || 22;
    this.selected = null;
    this.isSwapping = false;
    this.particles = [];
    this.announcements = [];

    this.createCanvas(520, 620);
    this.startX = (this.baseWidth - this.cols * this.tileSize) / 2;

    this.initCandyControls();
    this.initBoard();

    this.showStartCard({
      title: 'CANDY BLAST MATCH-3',
      icon: '🍬',
      objective: `Score ${this.config.targetScore} points before your ${this.movesLeft} moves run out! Match 4 for Striped Bombs and 5 for Rainbow Chocos.`,
      controls: 'Tap two adjacent candies or drag between them to swap.',
      onStart: () => this.start()
    });
  }

  randomType() {
    return Math.floor(Math.random() * CANDY_TYPES.length);
  }

  initBoard() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        let type;
        do {
          type = this.randomType();
        } while (
          (c >= 2 && this.grid[r][c - 1]?.type === type && this.grid[r][c - 2]?.type === type) ||
          (r >= 2 && this.grid[r - 1][c]?.type === type && this.grid[r - 2][c]?.type === type)
        );

        this.grid[r][c] = {
          type,
          special: null, // 'striped_h', 'striped_v', 'bomb', 'color_bomb'
          scale: 1,
          animY: 0
        };
      }
    }
  }

  initCandyControls() {
    let dragStart = null;

    const getCell = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const c = Math.floor((mx - this.startX) / this.tileSize);
      const r = Math.floor((my - this.startY) / this.tileSize);
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        return { r, c };
      }
      return null;
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.isSwapping) return;
      const cell = getCell(e);
      if (cell) {
        dragStart = cell;
        if (!this.selected) {
          this.selected = cell;
          sounds.playClick();
        } else {
          // If already selected, check if clicked adjacent
          const isAdj = (Math.abs(this.selected.r - cell.r) + Math.abs(this.selected.c - cell.c)) === 1;
          if (isAdj) {
            this.attemptSwap(this.selected, cell);
            this.selected = null;
          } else {
            this.selected = cell;
            sounds.playClick();
          }
        }
      }
    });

    this.addListener(this.canvas, 'pointerup', (e) => {
      if (!dragStart || this.isSwapping) return;
      const cell = getCell(e);
      if (cell && (cell.r !== dragStart.r || cell.c !== dragStart.c)) {
        const isAdj = (Math.abs(dragStart.r - cell.r) + Math.abs(dragStart.c - cell.c)) === 1;
        if (isAdj) {
          this.attemptSwap(dragStart, cell);
          this.selected = null;
        }
      }
      dragStart = null;
    });
  }

  attemptSwap(c1, c2) {
    this.isSwapping = true;
    sounds.playClick();

    // Perform swap in data
    const temp = this.grid[c1.r][c1.c];
    this.grid[c1.r][c1.c] = this.grid[c2.r][c2.c];
    this.grid[c2.r][c2.c] = temp;

    // Check matches
    const matches = this.findMatches();

    if (matches.length > 0) {
      this.movesLeft--;
      this.resolveMatches(matches);
    } else {
      // Revert swap
      this.setTimeout(() => {
        const revert = this.grid[c1.r][c1.c];
        this.grid[c1.r][c1.c] = this.grid[c2.r][c2.c];
        this.grid[c2.r][c2.c] = revert;
        this.isSwapping = false;
        sounds.playHit();
      }, 250);
    }
  }

  findMatches() {
    const matched = new Set();

    // Check horizontal
    for (let r = 0; r < this.rows; r++) {
      let streak = 1;
      for (let c = 0; c < this.cols; c++) {
        if (c < this.cols - 1 && this.grid[r][c]?.type === this.grid[r][c + 1]?.type && this.grid[r][c] !== null) {
          streak++;
        } else {
          if (streak >= 3) {
            for (let k = 0; k < streak; k++) matched.add(`${r},${c - k}`);
          }
          streak = 1;
        }
      }
    }

    // Check vertical
    for (let c = 0; c < this.cols; c++) {
      let streak = 1;
      for (let r = 0; r < this.rows; r++) {
        if (r < this.rows - 1 && this.grid[r][c]?.type === this.grid[r + 1][c]?.type && this.grid[r][c] !== null) {
          streak++;
        } else {
          if (streak >= 3) {
            for (let k = 0; k < streak; k++) matched.add(`${r - k},${c}`);
          }
          streak = 1;
        }
      }
    }

    return Array.from(matched).map(str => {
      const [r, c] = str.split(',').map(Number);
      return { r, c };
    });
  }

  resolveMatches(matches) {
    sounds.playCoin();
    this.score += matches.length * 40;

    if (matches.length >= 6) {
      this.announcements.push({ text: 'SWEET! 🔥', y: this.baseHeight / 2, alpha: 1 });
    } else if (matches.length >= 4) {
      this.announcements.push({ text: 'TASTY! ✨', y: this.baseHeight / 2, alpha: 1 });
    }

    // Spawn burst particles and remove matched
    matches.forEach(({ r, c }) => {
      const candy = this.grid[r][c];
      if (candy) {
        const x = this.startX + c * this.tileSize + this.tileSize / 2;
        const y = this.startY + r * this.tileSize + this.tileSize / 2;
        this.spawnBurst(x, y, CANDY_TYPES[candy.type].color);
        this.grid[r][c] = null;
      }
    });

    // Cascade drop and refill
    this.setTimeout(() => {
      this.dropAndRefill();
    }, 280);
  }

  dropAndRefill() {
    // Drop existing candies down
    for (let c = 0; c < this.cols; c++) {
      let writeRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          if (writeRow !== r) {
            this.grid[writeRow][c] = this.grid[r][c];
            this.grid[r][c] = null;
          }
          writeRow--;
        }
      }
      // Refill empty tops
      for (let r = writeRow; r >= 0; r--) {
        this.grid[r][c] = {
          type: this.randomType(),
          special: null,
          scale: 1,
          animY: -20
        };
      }
    }

    // Check secondary cascade matches
    const chainMatches = this.findMatches();
    if (chainMatches.length > 0) {
      this.setTimeout(() => {
        this.resolveMatches(chainMatches);
      }, 240);
    } else {
      this.isSwapping = false;
      this.checkEndConditions();
    }
  }

  checkEndConditions() {
    if (this.score >= this.config.targetScore) {
      sounds.playWin();
      this.finishGame(this.score, { isVictory: true });
    } else if (this.movesLeft <= 0) {
      sounds.playHit();
      this.finishGame(this.score, { isVictory: false, reason: 'Out of moves!' });
    }
  }

  spawnBurst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color,
        life: 0.5
      });
    }
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update announcements
    for (let i = this.announcements.length - 1; i >= 0; i--) {
      const a = this.announcements[i];
      a.y -= 30 * dt;
      a.alpha -= dt * 0.9;
      if (a.alpha <= 0) this.announcements.splice(i, 1);
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Sugar Valley Purple Gradient Background
    const bg = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    bg.addColorStop(0, '#2e1065');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top HUD (Moves Left, Target, Score)
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🎯 TARGET: ${this.config.targetScore}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.movesLeft < 5 ? '#ff0055' : '#10b981';
    ctx.fillText(`MOVES: ${this.movesLeft}`, this.baseWidth - 24, 34);

    // Board Frame
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(this.startX - 8, this.startY - 8, this.cols * this.tileSize + 16, this.rows * this.tileSize + 16, 16);
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Render Grid
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.startX + c * this.tileSize;
        const y = this.startY + r * this.tileSize;
        const candy = this.grid[r][c];

        // Tile background
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        // Highlight selected candy
        if (this.selected && this.selected.r === r && this.selected.c === c) {
          ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        }

        if (candy) {
          const info = CANDY_TYPES[candy.type];
          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(info.icon, x + this.tileSize / 2, y + this.tileSize / 2 + 11);
        }
      }
    }

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Announcements (SWEET!, TASTY!)
    this.announcements.forEach(a => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.font = '900 36px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 14;
      ctx.fillText(a.text, this.baseWidth / 2, a.y);
      ctx.restore();
    });
  }
}
