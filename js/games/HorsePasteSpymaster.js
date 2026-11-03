/* ====================================================
   HORSEPASTE: SPYMASTER AGENT — SECRET CODEWORD DEDUCTION
   Inspired by jbowens/horsepaste (Codenames online)
   25-card grid, undercover blue & red agents, innocent bystanders,
   the fatal assassin card, spymaster clues & intelligence debriefs.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HorsePasteSpymasterGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'HorsePaste: Spymaster Agent',
      targetScore: 3000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.wordsPool = [
      'AGENT', 'LASER', 'NIGHT', 'CYBER', 'DIAMOND', 'EAGLE', 'SHADOW', 'PHOENIX',
      'FALCON', 'CASINO', 'DRAGON', 'PIRATE', 'KNIGHT', 'ROBOT', 'GALAXY', 'TEMPLE',
      'OCEAN', 'SATELLITE', 'MATRIX', 'VOLCANO', 'SUBMARINE', 'BLADE', 'FOREST', 'NINJA', 'THUNDER'
    ];

    this.grid = [];
    this.spymasterView = false;
    this.blueAgentsLeft = 8;
    this.redAgentsLeft = 7;
    this.currentClue = { word: 'SPACE', count: 2 };

    this.initBoard();
    this.initControls();

    this.attachTouchControls({
      onDirection: () => {},
      onAction: (pressed) => {
        if (pressed) this.toggleSpymasterView();
      },
      actionLabel: '👁️ PEEK',
      showDpad: false
    });

    this.showStartCard({
      title: 'HORSEPASTE: SPYMASTER',
      icon: '🕵️',
      objective: 'Identify all 8 Blue Secret Agents from the 25 codename cards without contacting the Assassin!',
      controls: 'Click cards to reveal • Press V to toggle Spymaster Key View'
    });
  }

  initBoard() {
    // Shuffle words
    const shuffled = [...this.wordsPool].sort(() => Math.random() - 0.5);

    // 25 assignments: 8 Blue, 7 Red, 1 Assassin, 9 Neutral
    const roles = [
      ...Array(8).fill('BLUE'),
      ...Array(7).fill('RED'),
      'ASSASSIN',
      ...Array(9).fill('NEUTRAL')
    ].sort(() => Math.random() - 0.5);

    this.grid = [];
    for (let i = 0; i < 25; i++) {
      this.grid.push({
        word: shuffled[i],
        role: roles[i],
        revealed: false
      });
    }

    this.blueAgentsLeft = 8;
    this.redAgentsLeft = 7;
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        this.toggleSpymasterView();
      }
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
      const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Card Grid 5x5
      const startX = 30;
      const startY = 70;
      const cardW = 150;
      const cardH = 74;
      const gapX = 12;
      const gapY = 12;

      for (let i = 0; i < 25; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        if (clickX >= x && clickX <= x + cardW && clickY >= y && clickY <= y + cardH) {
          this.revealCard(i);
          return;
        }
      }
    });
  }

  toggleSpymasterView() {
    this.spymasterView = !this.spymasterView;
    sounds.playClick?.();
  }

  revealCard(idx) {
    const card = this.grid[idx];
    if (card.revealed) return;

    card.revealed = true;

    if (card.role === 'BLUE') {
      sounds.playScore?.();
      this.blueAgentsLeft--;
      this.score += 350;

      if (this.blueAgentsLeft <= 0) {
        this.finishGame(this.score, { reason: 'Mission Accomplished: All Blue Agents Contacted!' });
      }
    } else if (card.role === 'ASSASSIN') {
      sounds.playCrash?.();
      this.finishGame(this.score, { reason: 'Eliminated: Contacted the Lethal Assassin!' });
    } else if (card.role === 'RED') {
      sounds.playHit?.();
      this.redAgentsLeft--;
      this.score = Math.max(0, this.score - 100);
    } else {
      sounds.playClick?.();
      this.score = Math.max(0, this.score - 25);
    }
  }

  update() {}

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Top Header Glass
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, w, 56);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText(`BLUE AGENTS: 🔵 ${this.blueAgentsLeft} REMAINING`, 24, 34);

    ctx.fillStyle = '#ef4444';
    ctx.fillText(`RED AGENTS: 🔴 ${this.redAgentsLeft}`, 320, 34);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`SCORE: ${this.score}`, w - 160, 34);

    // Spymaster View Indicator
    ctx.fillStyle = this.spymasterView ? '#10b981' : '#64748b';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`[V] SPYMASTER KEY: ${this.spymasterView ? 'ON' : 'OFF'}`, w - 340, 34);

    // Render 5x5 Cards
    const startX = 30;
    const startY = 70;
    const cardW = 150;
    const cardH = 74;
    const gapX = 12;
    const gapY = 12;

    for (let i = 0; i < 25; i++) {
      const card = this.grid[i];
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      // Card Fill
      if (card.revealed) {
        if (card.role === 'BLUE') ctx.fillStyle = '#0284c7';
        else if (card.role === 'RED') ctx.fillStyle = '#dc2626';
        else if (card.role === 'ASSASSIN') ctx.fillStyle = '#000000';
        else ctx.fillStyle = '#475569';
      } else {
        ctx.fillStyle = '#1e293b';
      }

      ctx.fillRect(x, y, cardW, cardH);

      // Border or Spymaster Hint Border
      if (this.spymasterView && !card.revealed) {
        if (card.role === 'BLUE') ctx.strokeStyle = '#38bdf8';
        else if (card.role === 'RED') ctx.strokeStyle = '#ef4444';
        else if (card.role === 'ASSASSIN') ctx.strokeStyle = '#f43f5e';
        else ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = card.revealed ? '#fff' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
      }
      ctx.strokeRect(x, y, cardW, cardH);

      // Word Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(card.word, x + cardW / 2, y + cardH / 2 + 5);
      ctx.textAlign = 'left';
    }
  }
}

export default HorsePasteSpymasterGame;
