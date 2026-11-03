/* ====================================================
   HANGMAN WILD WEST — WORD BOUNTY QUEST
   Inspired by design1online/PHP-Hangman-Game---No-Database-Required
   Sheriff saloon theme, letter tiles, gallows danger meter,
   word categories, hints, streaks & sound effects.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HangmanWildWestGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Hangman Wild West: Word Bounty',
      targetScore: 2000,
      lives: 6,
      ...config
    });

    this.createCanvas(860, 520);

    this.wordBank = [
      { word: 'PIXEL', category: 'Arcade Classics', hint: 'The fundamental building block of digital screens' },
      { word: 'DUNGEON', category: 'Fantasy RPG', hint: 'Underground labyrinth filled with traps and monsters' },
      { word: 'CYBERPUNK', category: 'Sci-Fi World', hint: 'High tech, low life futuristic genre' },
      { word: 'JOYSTICK', category: 'Gaming Gear', hint: 'Classic arcade controller for directional navigation' },
      { word: 'MINOTAUR', category: 'Mythic Beast', hint: 'Labyrinth creature with head of a bull' },
      { word: 'SHERIFF', category: 'Wild West', hint: 'Law enforcer of the frontier town' },
      { word: 'REVOLVER', category: 'Wild West', hint: 'Six-shooter sidearm of legendary gunslingers' },
      { word: 'CRITICAL', category: 'Gaming Lore', hint: 'High-damage lucky strike against enemies' },
      { word: 'SALOON', category: 'Wild West', hint: 'Town gathering tavern with swinging batwing doors' },
      { word: 'SORCERER', category: 'Fantasy RPG', hint: 'Master of mystical arcane spellcraft' }
    ];

    this.streak = 0;
    this.wordsSolved = 0;
    this.initRound();
    this.initControls();

    this.showStartCard({
      title: 'HANGMAN WILD WEST',
      icon: '🤠',
      objective: 'Guess the hidden bounty words before the gallows rope runs out! Use physical keyboard or click letter tiles.',
      controls: 'Type letters on your keyboard or click on-screen letter buttons'
    });
  }

  initRound() {
    const item = this.wordBank[Math.floor(Math.random() * this.wordBank.length)];
    this.currentWord = item.word.toUpperCase();
    this.category = item.category;
    this.hint = item.hint;
    this.guessedLetters = new Set();
    this.wrongGuesses = 0;
    this.maxWrong = 6;
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        this.guessLetter(key);
      }
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
      const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Check on-screen keyboard click
      const kbStartX = 180;
      const kbStartY = 370;
      const keySize = 34;
      const gap = 8;
      const rows = [
        'QWERTYUIOP',
        'ASDFGHJKL',
        'ZXCVBNM'
      ];

      for (let r = 0; r < rows.length; r++) {
        const rowStr = rows[r];
        const rowOffsetX = r * 14;
        for (let c = 0; c < rowStr.length; c++) {
          const letter = rowStr[c];
          const kx = kbStartX + rowOffsetX + c * (keySize + gap);
          const ky = kbStartY + r * (keySize + gap);

          if (clickX >= kx && clickX <= kx + keySize && clickY >= ky && clickY <= ky + keySize) {
            this.guessLetter(letter);
            return;
          }
        }
      }
    });
  }

  guessLetter(letter) {
    if (this.guessedLetters.has(letter)) return;

    this.guessedLetters.add(letter);

    if (this.currentWord.includes(letter)) {
      sounds.playScore?.();
      this.score += 50 * (this.streak + 1);

      // Check word solved
      const isSolved = this.currentWord.split('').every((l) => this.guessedLetters.has(l));
      if (isSolved) {
        this.streak++;
        this.wordsSolved++;
        this.score += 500 * this.streak;
        sounds.playLevelUp?.();
        this.setTimeout(() => {
          this.initRound();
        }, 1200);
      }
    } else {
      this.wrongGuesses++;
      sounds.playCrash?.();

      if (this.wrongGuesses >= this.maxWrong) {
        this.streak = 0;
        this.finishGame(this.score, { reason: `Word Was "${this.currentWord}"` });
      }
    }
  }

  update() {}

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Saloon Wood & Parchment Theme
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1c1917');
    bgGrad.addColorStop(1, '#292524');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Saloon border framing
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Header HUD
    ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
    ctx.fillRect(20, 20, w - 40, 48);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText(`CATEGORY: ${this.category.toUpperCase()}`, 36, 50);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`STREAK: 🔥 ${this.streak}`, 380, 50);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`BOUNTY SCORE: ${this.score}`, w - 220, 50);

    // Gallows Drawing (Left Side)
    const gx = 80;
    const gy = 320;
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 6;
    ctx.beginPath();
    // Base
    ctx.moveTo(gx - 40, gy);
    ctx.lineTo(gx + 40, gy);
    // Pole
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy - 200);
    // Beam
    ctx.lineTo(gx + 90, gy - 200);
    // Support
    ctx.moveTo(gx, gy - 160);
    ctx.lineTo(gx + 40, gy - 200);
    // Rope
    ctx.lineTo(gx + 90, gy - 160);
    ctx.stroke();

    // Outlaw Stages based on wrong guesses
    const hx = gx + 90;
    const hy = gy - 140;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;

    if (this.wrongGuesses >= 1) {
      // Head
      ctx.beginPath();
      ctx.arc(hx, hy, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.wrongGuesses >= 2) {
      // Torso
      ctx.beginPath();
      ctx.moveTo(hx, hy + 16);
      ctx.lineTo(hx, hy + 60);
      ctx.stroke();
    }
    if (this.wrongGuesses >= 3) {
      // Left Arm
      ctx.beginPath();
      ctx.moveTo(hx, hy + 26);
      ctx.lineTo(hx - 22, hy + 46);
      ctx.stroke();
    }
    if (this.wrongGuesses >= 4) {
      // Right Arm
      ctx.beginPath();
      ctx.moveTo(hx, hy + 26);
      ctx.lineTo(hx + 22, hy + 46);
      ctx.stroke();
    }
    if (this.wrongGuesses >= 5) {
      // Left Leg
      ctx.beginPath();
      ctx.moveTo(hx, hy + 60);
      ctx.lineTo(hx - 20, hy + 95);
      ctx.stroke();
    }
    if (this.wrongGuesses >= 6) {
      // Right Leg
      ctx.beginPath();
      ctx.moveTo(hx, hy + 60);
      ctx.lineTo(hx + 20, hy + 95);
      ctx.stroke();
    }

    // Word display with blanks (Right Center)
    const wordChars = this.currentWord.split('');
    const charSpacing = 44;
    const startWordX = 260 + (w - 260 - wordChars.length * charSpacing) / 2;
    const wordY = 160;

    for (let i = 0; i < wordChars.length; i++) {
      const char = wordChars[i];
      const isRevealed = this.guessedLetters.has(char);
      const cx = startWordX + i * charSpacing;

      // Underline
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 14, wordY + 24);
      ctx.lineTo(cx + 14, wordY + 24);
      ctx.stroke();

      if (isRevealed) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Outfit, monospace';
        ctx.fillText(char, cx - 11, wordY + 16);
      }
    }

    // Clue Hint box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(240, 210, w - 280, 40);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.strokeRect(240, 210, w - 280, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 13px Outfit, sans-serif';
    ctx.fillText(`CLUE: ${this.hint}`, 254, 235);

    // Danger Counter
    ctx.fillStyle = this.wrongGuesses >= 4 ? '#ef4444' : '#fbbf24';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillText(`CHANCES REMAINING: ${this.maxWrong - this.wrongGuesses}/${this.maxWrong}`, 240, 280);

    // On-screen Virtual Keyboard
    const kbStartX = 180;
    const kbStartY = 330;
    const keySize = 34;
    const gap = 8;
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

    for (let r = 0; r < rows.length; r++) {
      const rowStr = rows[r];
      const rowOffsetX = r * 14;
      for (let c = 0; c < rowStr.length; c++) {
        const letter = rowStr[c];
        const kx = kbStartX + rowOffsetX + c * (keySize + gap);
        const ky = kbStartY + r * (keySize + gap);

        const isGuessed = this.guessedLetters.has(letter);
        const isCorrect = isGuessed && this.currentWord.includes(letter);
        const isWrong = isGuessed && !this.currentWord.includes(letter);

        if (isCorrect) ctx.fillStyle = '#15803d';
        else if (isWrong) ctx.fillStyle = '#7f1d1d';
        else ctx.fillStyle = '#44403c';

        ctx.fillRect(kx, ky, keySize, keySize);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(kx, ky, keySize, keySize);

        ctx.fillStyle = isGuessed ? '#a8a29e' : '#ffffff';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillText(letter, kx + 10, ky + 22);
      }
    }
  }
}

export default HangmanWildWestGame;

