/* ====================================================
   SET MATCH TRIO — VISUAL PERCEPTION PUZZLE
   Inspired by ekzhang/setwithfriends
   Find trios where each attribute (number, shape, color, shading)
   is either ALL IDENTICAL or ALL DISTINCT!
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class SetMatchTrioGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Set Match Trio',
      targetScore: 2400,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.selectedIndices = [];
    this.deck = [];
    this.board = [];
    this.setsFound = 0;
    this.streak = 0;
    this.timer = 120; // 2 minutes round
    this.particles = [];

    this.initDeck();
    this.dealBoard();
    this.initControls();

    this.showStartCard({
      title: 'SET MATCH TRIO',
      icon: '🃏',
      objective: 'Find 3 cards where each feature (Number, Shape, Color, Shading) is ALL THE SAME or ALL DIFFERENT!',
      controls: 'Click cards to select 3 • Click HINT for guidance'
    });
  }

  initDeck() {
    this.deck = [];
    const numbers = [1, 2, 3];
    const shapes = ['DIAMOND', 'OVAL', 'SQUIGGLE'];
    const colors = ['#00e5ff', '#a855f7', '#fbbf24'];
    const shadings = ['SOLID', 'STRIPED', 'OUTLINE'];

    for (const num of numbers) {
      for (const sh of shapes) {
        for (const col of colors) {
          for (const s of shadings) {
            this.deck.push({ num, shape: sh, color: col, shading: s });
          }
        }
      }
    }

    // Shuffle deck
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealBoard() {
    this.board = [];
    for (let i = 0; i < 12; i++) {
      if (this.deck.length > 0) {
        this.board.push(this.deck.pop());
      }
    }
  }

  initControls() {
    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
      const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Check Hint button click (top right)
      if (clickX > 730 && clickX < 840 && clickY > 12 && clickY < 50) {
        this.giveHint();
        return;
      }

      // Check 12 cards grid click
      const cardW = 160;
      const cardH = 110;
      const startX = 60;
      const startY = 70;
      const gapX = 36;
      const gapY = 24;

      for (let idx = 0; idx < this.board.length; idx++) {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        if (clickX >= x && clickX <= x + cardW && clickY >= y && clickY <= y + cardH) {
          this.toggleCardSelection(idx);
          return;
        }
      }
    });
  }

  toggleCardSelection(idx) {
    sounds.playClick?.();
    const selIdx = this.selectedIndices.indexOf(idx);
    if (selIdx >= 0) {
      this.selectedIndices.splice(selIdx, 1);
    } else {
      if (this.selectedIndices.length < 3) {
        this.selectedIndices.push(idx);
      }
    }

    if (this.selectedIndices.length === 3) {
      this.validateSelection();
    }
  }

  isValidSet(c1, c2, c3) {
    if (!c1 || !c2 || !c3) return false;
    const checkAttr = (v1, v2, v3) => (v1 === v2 && v2 === v3) || (v1 !== v2 && v1 !== v3 && v2 !== v3);
    return (
      checkAttr(c1.num, c2.num, c3.num) &&
      checkAttr(c1.shape, c2.shape, c3.shape) &&
      checkAttr(c1.color, c2.color, c3.color) &&
      checkAttr(c1.shading, c2.shading, c3.shading)
    );
  }

  validateSelection() {
    const [i1, i2, i3] = this.selectedIndices;
    const c1 = this.board[i1];
    const c2 = this.board[i2];
    const c3 = this.board[i3];

    if (this.isValidSet(c1, c2, c3)) {
      sounds.playLevelUp?.();
      this.streak++;
      this.setsFound++;
      this.score += 300 * this.streak;

      // Replace 3 cards
      [i1, i2, i3].forEach((idx) => {
        if (this.deck.length > 0) {
          this.board[idx] = this.deck.pop();
        } else {
          this.board[idx] = null;
        }
      });
      this.selectedIndices = [];
    } else {
      sounds.playCrash?.();
      this.streak = 0;
      this.setTimeout(() => {
        this.selectedIndices = [];
      }, 400);
    }
  }

  giveHint() {
    for (let i = 0; i < this.board.length; i++) {
      for (let j = i + 1; j < this.board.length; j++) {
        for (let k = j + 1; k < this.board.length; k++) {
          if (this.isValidSet(this.board[i], this.board[j], this.board[k])) {
            this.selectedIndices = [i]; // Highlight first card of the set
            sounds.playScore?.();
            return;
          }
        }
      }
    }
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.finishGame(this.score, { reason: `Time's Up! Found ${this.setsFound} Sets` });
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Green felt card table
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, w, h);

    // Top Header Glass
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(0, 0, w, 52);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.fillText(`SETS FOUND: 🃏 ${this.setsFound}`, 24, 32);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`TIME: ⏱️ ${Math.max(0, Math.ceil(this.timer))}s`, 220, 32);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`SCORE: ${this.score}`, 400, 32);

    // Hint Button
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(730, 12, 100, 32);
    ctx.fillStyle = '#0a0e17';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('💡 HINT', 758, 32);

    // Render 12 Cards Grid
    const cardW = 160;
    const cardH = 110;
    const startX = 60;
    const startY = 70;
    const gapX = 36;
    const gapY = 24;

    for (let idx = 0; idx < this.board.length; idx++) {
      const card = this.board[idx];
      if (!card) continue;

      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const isSelected = this.selectedIndices.includes(idx);

      // Card Background
      ctx.fillStyle = isSelected ? '#1e293b' : '#0f172a';
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = isSelected ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isSelected ? 3.5 : 1.5;
      ctx.strokeRect(x, y, cardW, cardH);

      // Draw Shapes on Card
      const shapeSpacing = cardW / (card.num + 1);
      for (let s = 1; s <= card.num; s++) {
        const sx = x + s * shapeSpacing;
        const sy = y + cardH / 2;
        this.renderShape(ctx, sx, sy, card.shape, card.color, card.shading);
      }
    }
  }

  renderShape(ctx, x, y, shape, color, shading) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    if (shading === 'SOLID') ctx.fillStyle = color;
    else if (shading === 'STRIPED') ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    else ctx.fillStyle = 'transparent';

    ctx.beginPath();
    if (shape === 'DIAMOND') {
      ctx.moveTo(x, y - 22);
      ctx.lineTo(x + 14, y);
      ctx.lineTo(x, y + 22);
      ctx.lineTo(x - 14, y);
      ctx.closePath();
    } else if (shape === 'OVAL') {
      ctx.ellipse(x, y, 12, 22, 0, 0, Math.PI * 2);
    } else {
      // Squiggle
      ctx.rect(x - 10, y - 20, 20, 40);
    }

    if (shading !== 'OUTLINE') ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export default SetMatchTrioGame;

