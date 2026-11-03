/* ====================================================
   SOLITAIRE KLONDIKE PRO — GAMINGZONE
   Classic 52-Card Solitaire with Felt Green Table
   - 7 Tableau Piles with Alternating Red/Black Sequences
   - 4 Foundation Piles (Ace to King by Suit)
   - Stock Deck Draw & Recycle, Auto-Move to Foundations
   - Move Counter, Elapsed Timer, Undo Support
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export class SolitaireKlondikeProGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Solitaire Klondike Pro',
      targetScore: 500,
      ...config
    });

    this.createCanvas(820, 580);

    this.cardWidth = 72;
    this.cardHeight = 100;
    this.selected = null; // { from: 'tableau'|'waste', pileIdx, cardIdx }
    this.moves = 0;
    this.elapsed = 0;
    this.history = [];

    this.stock = [];
    this.waste = [];
    this.foundations = [[], [], [], []]; // 4 suit piles
    this.tableaux = [[], [], [], [], [], [], []]; // 7 columns

    this.initDeck();
    this.initMouseEvents();

    this.showStartCard({
      title: 'SOLITAIRE KLONDIKE PRO',
      icon: '🃏',
      objective: 'Stack all 52 cards into the 4 top foundation piles from Ace to King! Build tableau columns in descending order with alternating colors.',
      controls: 'Click stock pile to draw cards. Click cards to select & move or double-click to auto-send to foundations.',
      onStart: () => this.start()
    });
  }

  initDeck() {
    const deck = [];
    SUITS.forEach(suit => {
      RANKS.forEach((rank, val) => {
        deck.push({
          suit,
          rank,
          val: val + 1, // 1 to 13
          isRed: suit === '♥' || suit === '♦',
          faceUp: false
        });
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal Tableaux (1 to 7)
    this.tableaux = [[], [], [], [], [], [], []];
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const c = deck.pop();
        if (j === i) c.faceUp = true;
        this.tableaux[i].push(c);
      }
    }

    // Rest to stock
    this.stock = deck;
    this.waste = [];
    this.foundations = [[], [], [], []];
    this.selected = null;
    this.moves = 0;
    this.elapsed = 0;
  }

  initMouseEvents() {
    this.lastClickTime = 0;
    this.lastClickedTarget = null;

    const handleAction = (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      const now = performance.now();
      const isDoubleClick = (now - this.lastClickTime < 350);
      this.lastClickTime = now;

      this.handleClick(mx, my, isDoubleClick);
    };

    this.addEventListenerTracked(this.canvas, 'pointerdown', handleAction);
  }

  handleClick(x, y, isDoubleClick = false) {
    // 1. Stock pile click (x: 40, y: 30)
    if (x >= 40 && x <= 40 + this.cardWidth && y >= 30 && y <= 30 + this.cardHeight) {
      this.drawFromStock();
      return;
    }

    // 2. Waste pile click (x: 130, y: 30)
    if (x >= 130 && x <= 130 + this.cardWidth && y >= 30 && y <= 30 + this.cardHeight) {
      if (this.waste.length > 0) {
        sounds.playClick();
        const topCard = this.waste[this.waste.length - 1];
        if (isDoubleClick) {
          if (this.tryAutoMoveToFoundations(topCard, 'waste')) {
            this.waste.pop();
            this.moves++;
            this.selected = null;
            this.checkWinCondition();
            return;
          }
        }
        this.selected = { from: 'waste', card: topCard };
      }
      return;
    }

    // 3. Foundation piles (x: 400, 490, 580, 670, y: 30)
    for (let f = 0; f < 4; f++) {
      const fx = 400 + f * 90;
      if (x >= fx && x <= fx + this.cardWidth && y >= 30 && y <= 30 + this.cardHeight) {
        if (this.selected) {
          this.tryPlaceOnFoundation(f);
        }
        return;
      }
    }

    // 4. Tableau columns (7 columns starting x: 40, spacing 105, y: 160)
    for (let t = 0; t < 7; t++) {
      const tx = 40 + t * 105;
      const pile = this.tableaux[t];

      // Empty column click
      if (pile.length === 0) {
        if (x >= tx && x <= tx + this.cardWidth && y >= 160 && y <= 160 + this.cardHeight) {
          if (this.selected && this.selected.card.val === 13) {
            // King can be placed on empty space
            this.moveSelectedToTableau(t);
          }
          return;
        }
        continue;
      }

      // Check cards from top to bottom
      for (let c = pile.length - 1; c >= 0; c--) {
        const cy = 160 + c * 26;
        if (x >= tx && x <= tx + this.cardWidth && y >= cy && y <= cy + this.cardHeight) {
          const card = pile[c];
          if (!card.faceUp && c === pile.length - 1) {
            card.faceUp = true;
            sounds.playCard();
            return;
          }

          if (card.faceUp) {
            sounds.playClick();
            if (this.selected && (this.selected.pileIdx !== t || this.selected.from !== 'tableau')) {
              // Try placing selected onto this card
              if (this.canStackOnTableau(this.selected.card, card)) {
                this.moveSelectedToTableau(t);
                return;
              }
            }

            // Double click to auto-send top card to foundations
            if (isDoubleClick && c === pile.length - 1) {
              if (this.tryAutoMoveToFoundations(card, 'tableau', t)) {
                pile.pop();
                if (pile.length > 0) pile[pile.length - 1].faceUp = true;
                this.moves++;
                this.selected = null;
                this.checkWinCondition();
                return;
              }
            }

            // Single click toggles selection
            if (this.selected && this.selected.card === card) {
              // Clicking same card again tries foundation
              if (c === pile.length - 1 && this.tryAutoMoveToFoundations(card, 'tableau', t)) {
                pile.pop();
                if (pile.length > 0) pile[pile.length - 1].faceUp = true;
                this.moves++;
                this.selected = null;
                this.checkWinCondition();
                return;
              }
              this.selected = null;
            } else {
              this.selected = { from: 'tableau', pileIdx: t, cardIdx: c, card };
            }
          }
          return;
        }
      }
    }

    // Clicked empty felt: deselect
    this.selected = null;
  }

  drawFromStock() {
    sounds.playCard();
    if (this.stock.length > 0) {
      const c = this.stock.pop();
      c.faceUp = true;
      this.waste.push(c);
    } else {
      // Recycle waste back to stock
      this.stock = this.waste.reverse().map(c => ({ ...c, faceUp: false }));
      this.waste = [];
    }
    this.selected = null;
    this.moves++;
  }

  canStackOnTableau(movingCard, targetCard) {
    return (movingCard.isRed !== targetCard.isRed) && (movingCard.val === targetCard.val - 1);
  }

  moveSelectedToTableau(targetCol) {
    sounds.playCard();
    this.moves++;
    const dest = this.tableaux[targetCol];

    if (this.selected.from === 'waste') {
      dest.push(this.waste.pop());
    } else if (this.selected.from === 'tableau') {
      const src = this.tableaux[this.selected.pileIdx];
      const moving = src.splice(this.selected.cardIdx);
      dest.push(...moving);
      if (src.length > 0) src[src.length - 1].faceUp = true;
    }

    this.selected = null;
    this.checkWinCondition();
  }

  tryPlaceOnFoundation(fIdx) {
    const fPile = this.foundations[fIdx];
    const card = this.selected.card;

    const isValid = (fPile.length === 0 && card.val === 1) ||
      (fPile.length > 0 && fPile[fPile.length - 1].suit === card.suit && card.val === fPile[fPile.length - 1].val + 1);

    if (isValid) {
      sounds.playScore();
      this.moves++;
      fPile.push(card);

      if (this.selected.from === 'waste') {
        this.waste.pop();
      } else if (this.selected.from === 'tableau') {
        const src = this.tableaux[this.selected.pileIdx];
        src.pop();
        if (src.length > 0) src[src.length - 1].faceUp = true;
      }

      this.selected = null;
      this.checkWinCondition();
    }
  }

  tryAutoMoveToFoundations(card, from, pileIdx = null) {
    for (let f = 0; f < 4; f++) {
      const fPile = this.foundations[f];
      const canPlace = (fPile.length === 0 && card.val === 1) ||
        (fPile.length > 0 && fPile[fPile.length - 1].suit === card.suit && card.val === fPile[fPile.length - 1].val + 1);

      if (canPlace) {
        sounds.playScore();
        fPile.push(card);
        return true;
      }
    }
    return false;
  }

  checkWinCondition() {
    const totalFound = this.foundations.reduce((sum, f) => sum + f.length, 0);
    this.score = totalFound * 10;
    if (totalFound === 52) {
      sounds.playVictory();
      this.gameOver(true);
    }
  }

  update(dt) {
    if (this.state === GameState.PLAYING) {
      this.elapsed += dt || 0.016;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Green Classic Casino Felt
    const feltGrad = ctx.createRadialGradient(400, 290, 50, 400, 290, 500);
    feltGrad.addColorStop(0, '#15803d');
    feltGrad.addColorStop(0.7, '#166534');
    feltGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = feltGrad;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Draw Top Slots (Stock & Waste)
    this.drawSlot(40, 30, 'STOCK');
    if (this.stock.length > 0) {
      this.drawCardBack(40, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText(`x${this.stock.length}`, 65, 85);
    }

    this.drawSlot(130, 30, 'WASTE');
    if (this.waste.length > 0) {
      const topW = this.waste[this.waste.length - 1];
      const isSel = this.selected?.from === 'waste';
      this.drawCardFace(130, 30, topW, isSel);
    }

    // Draw Foundations (x: 400, 490, 580, 670, y: 30)
    SUITS.forEach((suit, idx) => {
      const fx = 400 + idx * 90;
      this.drawSlot(fx, 30, suit);
      const fPile = this.foundations[idx];
      if (fPile.length > 0) {
        this.drawCardFace(fx, 30, fPile[fPile.length - 1], false);
      }
    });

    // Draw Tableaux (7 Columns)
    for (let t = 0; t < 7; t++) {
      const tx = 40 + t * 105;
      const pile = this.tableaux[t];
      if (pile.length === 0) {
        this.drawSlot(tx, 160, 'K');
      } else {
        pile.forEach((c, idx) => {
          const cy = 160 + idx * 26;
          const isSel = this.selected?.from === 'tableau' && this.selected.pileIdx === t && idx >= this.selected.cardIdx;
          if (c.faceUp) {
            this.drawCardFace(tx, cy, c, isSel);
          } else {
            this.drawCardBack(tx, cy);
          }
        });
      }
    }

    // Bottom Bar HUD
    ctx.fillStyle = 'rgba(10, 14, 23, 0.7)';
    ctx.fillRect(0, this.baseHeight - 34, this.baseWidth, 34);

    const mins = Math.floor(this.elapsed / 60);
    const secs = Math.floor(this.elapsed % 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillText(`Moves: ${this.moves}`, 40, this.baseHeight - 12);
    ctx.fillText(`Time: ${mins}:${secs < 10 ? '0' : ''}${secs}`, 160, this.baseHeight - 12);
    ctx.fillText(`Cards In Foundations: ${this.foundations.reduce((sum, f) => sum + f.length, 0)} / 52`, 300, this.baseHeight - 12);
  }

  drawSlot(x, y, label) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, this.cardWidth, this.cardHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '700 14px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + this.cardWidth / 2, y + this.cardHeight / 2 + 5);
    ctx.textAlign = 'left';
  }

  drawCardBack(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, this.cardWidth, this.cardHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Geometric lattice pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(x + 4, y + 4, this.cardWidth - 8, this.cardHeight - 8);
  }

  drawCardFace(x, y, card, isSelected) {
    const ctx = this.ctx;
    ctx.fillStyle = isSelected ? '#fef08a' : '#ffffff';
    ctx.strokeStyle = isSelected ? '#eab308' : 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = isSelected ? 2.5 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, this.cardWidth, this.cardHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Rank & Suit
    ctx.fillStyle = card.isRed ? '#dc2626' : '#0f172a';
    ctx.font = '700 15px "Outfit", sans-serif';
    ctx.fillText(`${card.rank}`, x + 6, y + 18);
    ctx.font = '14px sans-serif';
    ctx.fillText(`${card.suit}`, x + 6, y + 34);

    // Center Suit
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.suit, x + this.cardWidth / 2, y + this.cardHeight / 2 + 10);
    ctx.textAlign = 'left';
  }
}

