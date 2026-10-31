/* ====================================================
   MEMORY CARDS MATCH — GAMINGZONE
   Multi-Stage Brain Memory Matching with 3D Flip Animations,
   Diverse Theme Decks, Combo Multipliers, and Retina Canvas
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';
import { MemoryCardAdapter } from '../core/levelEngine/index.js';

const memoryAdapter = new MemoryCardAdapter();

const THEMES = [
  { name: 'Cyber Space', icons: ['🚀', '🛸', '🛰️', '🪐', '🌌', '⭐', '☄️', '👾', '🤖', '⚡'] },
  { name: 'Fantasy Arena', icons: ['👑', '⚔️', '🛡️', '💎', '🏹', '🔮', '🐉', '🔥', '🧙', '🗝️'] },
  { name: 'Wild Safari', icons: ['🦁', '🐯', '🐘', '🦒', '🦓', '🐼', '🦊', '🦅', '🐬', '🦩'] }
];

const STAGES = [
  { cols: 3, rows: 4, pairs: 6, time: 45 },   // Level 1: 12 cards
  { cols: 4, rows: 4, pairs: 8, time: 60 },   // Level 2: 16 cards
  { cols: 5, rows: 4, pairs: 10, time: 75 }   // Level 3: 20 cards
];

export class MemoryCardsGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Memory Cards Match',
      targetScore: 3000,
      ...config
    });

    this.stageIndex = 0;
    this.cards = [];
    this.selected = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.streak = 0;
    this.theme = THEMES[0];

    this.createCanvas(560, 620);
    this.initCardControls();
    this.setupStage(0);

    this.showStartCard({
      title: 'MEMORY CARDS MATCH',
      icon: '🃏',
      objective: 'Flip and match all matching pairs before the timer expires! Maintain your streak for massive bonus points.',
      controls: 'Tap or click cards to flip them over.',
      onStart: () => this.start()
    });
  }

  setupStage(idx) {
    this.stageIndex = idx;
    let stage = STAGES[this.stageIndex];
    if (!stage) {
      // Endless unique stages through Level Engine
      const levelDef = memoryAdapter.generateLevel(idx + 1, 3003);
      stage = {
        cols: levelDef.cols,
        rows: levelDef.rows,
        pairs: levelDef.pairs,
        time: levelDef.timeLimit
      };
    }
    this.currentStageConfig = stage;
    this.theme = THEMES[idx % THEMES.length];
    this.timeLeft = stage.time;
    this.matchedPairs = 0;
    this.selected = [];

    // Select required pairs from theme
    const pool = this.theme.icons.slice(0, stage.pairs);
    const deck = [...pool, ...pool];

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Card layout metrics
    this.cols = stage.cols;
    this.rows = stage.rows;
    this.cardW = Math.min(84, Math.floor((this.baseWidth - 48 - (this.cols - 1) * 12) / this.cols));
    this.cardH = Math.min(96, Math.floor((this.baseHeight - 140 - (this.rows - 1) * 12) / this.rows));
    this.gridStartX = (this.baseWidth - (this.cols * this.cardW + (this.cols - 1) * 12)) / 2;
    this.gridStartY = 80;

    this.cards = deck.map((icon, i) => {
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);
      return {
        id: i,
        icon,
        col,
        row,
        x: this.gridStartX + col * (this.cardW + 12),
        y: this.gridStartY + row * (this.cardH + 12),
        flipped: false,
        matched: false,
        flipProgress: 0 // 0 = face down, 1 = face up
      };
    });
  }

  initCardControls() {
    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (this.selected.length >= 2) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const clicked = this.cards.find(c =>
        !c.flipped && !c.matched &&
        mx >= c.x && mx <= c.x + this.cardW &&
        my >= c.y && my <= c.y + this.cardH
      );

      if (clicked) {
        this.flipCard(clicked);
      }
    });
  }

  flipCard(card) {
    card.flipped = true;
    this.selected.push(card);
    sounds.playClick();

    if (this.selected.length === 2) {
      this.moves++;
      const [c1, c2] = this.selected;

      if (c1.icon === c2.icon) {
        // Matched!
        sounds.playCoin();
        c1.matched = true;
        c2.matched = true;
        this.matchedPairs++;
        this.streak++;

        const multiplier = Math.min(4, 1 + (this.streak - 1) * 0.5);
        this.score += Math.round(200 * multiplier);

        this.selected = [];

        // Check stage clear
        const targetPairs = (this.currentStageConfig || STAGES[this.stageIndex] || { pairs: 6 }).pairs;
        if (this.matchedPairs === targetPairs) {
          sounds.playWin();
          this.score += Math.round(this.timeLeft * 30); // Time bonus

          this.setTimeout(() => {
            if (this.stageIndex + 1 < 100) {
              this.setupStage(this.stageIndex + 1);
            } else {
              this.finishGame(this.score, { isVictory: true, moves: this.moves });
            }
          }, 800);
        }
      } else {
        // Mismatch
        sounds.playHit();
        this.streak = 0;
        this.setTimeout(() => {
          c1.flipped = false;
          c2.flipped = false;
          this.selected = [];
        }, 750);
      }
    }
  }

  update(dt) {
    if (this.timeLeft > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.finishGame(this.score, { isVictory: false, reason: 'Time ran out!' });
      }
    }

    // Smooth card flip animations
    this.cards.forEach(c => {
      const target = (c.flipped || c.matched) ? 1 : 0;
      c.flipProgress += (target - c.flipProgress) * 0.25;
    });
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Dark Studio Gradient Background
    const bg = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Header HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🃏 STAGE ${this.stageIndex + 1}/${STAGES.length} (${this.theme.name})`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score} ${this.streak > 1 ? `(${this.streak}x 🔥)` : ''}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.timeLeft < 15 ? '#ff0055' : '#10b981';
    ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)}s`, this.baseWidth - 24, 34);

    // Moves and Pairs counter banner
    ctx.font = 'bold 13px "Outfit", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(`Pairs: ${this.matchedPairs}/${STAGES[this.stageIndex].pairs}   •   Moves: ${this.moves}`, this.baseWidth / 2, 60);

    // Draw Cards
    this.cards.forEach(c => {
      ctx.save();
      const cx = c.x + this.cardW / 2;
      const cy = c.y + this.cardH / 2;
      ctx.translate(cx, cy);

      // 3D Flip perspective scaling along X
      const scaleX = Math.cos(c.flipProgress * Math.PI);
      ctx.scale(Math.abs(scaleX), 1);

      const isFaceUp = c.flipProgress > 0.5;

      if (isFaceUp) {
        // Face Up (revealed)
        ctx.fillStyle = c.matched ? '#1e3a5f' : '#1e293b';
        ctx.fillRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH);
        ctx.strokeStyle = c.matched ? '#10b981' : '#00e5ff';
        ctx.lineWidth = c.matched ? 3 : 2;
        ctx.strokeRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH);

        // Draw Icon
        ctx.font = '34px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.icon, 0, 0);
      } else {
        // Face Down (card back with neon pattern)
        const cardBg = ctx.createLinearGradient(-this.cardW / 2, -this.cardH / 2, this.cardW / 2, this.cardH / 2);
        cardBg.addColorStop(0, '#7928ca');
        cardBg.addColorStop(1, '#ff0080');
        ctx.fillStyle = cardBg;
        ctx.fillRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH);

        ctx.font = '900 24px "Lilita One", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);
      }

      ctx.restore();
    });
  }
}
