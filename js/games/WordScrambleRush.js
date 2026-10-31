/* ====================================================
   WORD SCRAMBLE RUSH — GAMINGZONE
   Fast-Paced Anagram Solver with On-Screen Mobile Keyboard,
   Dynamic Clues, Letter Shuffling, Hints, and Multipliers
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

const WORD_BANK = [
  { word: 'CRICKET', clue: 'Gentleman\'s game of bats, balls, and wickets' },
  { word: 'CHAMPION', clue: 'The winner who lifts the gold trophy' },
  { word: 'GALAXY', clue: 'Massive system of billions of stars' },
  { word: 'DRAGON', clue: 'Mythical fire-breathing serpentine beast' },
  { word: 'WARRIOR', clue: 'Brave combatant on the battlefield' },
  { word: 'VOLCANO', clue: 'Mountain rupturing with magma and lava' },
  { word: 'SPEED', clue: 'Rate of motion; rapid velocity' },
  { word: 'NINJA', clue: 'Covert martial arts master of stealth' },
  { word: 'ROCKET', clue: 'Propelled vehicle exploring outer space' },
  { word: 'DIAMOND', clue: 'Precious gemstone made of pure carbon' },
  { word: 'BLIZZARD', clue: 'Severe snowstorm with freezing winds' },
  { word: 'PIRATE', clue: 'Seafaring outlaw seeking hidden treasure' },
  { word: 'CYBER', clue: 'Relating to digital technology and internet' },
  { word: 'PHOENIX', clue: 'Immortal bird reborn from its own ashes' },
  { word: 'TORNADO', clue: 'Violently rotating column of storm wind' },
  { word: 'QUANTUM', clue: 'Smallest discrete quantity of physical property' },
  { word: 'KNIGHT', clue: 'Noble armored warrior of the round table' },
  { word: 'SHADOW', clue: 'Dark shape cast when light is blocked' },
  { word: 'MATRIX', clue: 'Lattice grid of interconnected elements' },
  { word: 'ARCADE', clue: 'Hall packed with classic video games' }
];

function shuffleString(str) {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return (result === str && str.length > 2) ? shuffleString(str) : result;
}

export class WordScrambleRushGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Word Scramble Rush',
      targetScore: 2000,
      timeLimit: 60,
      ...config
    });

    this.currentIndex = 0;
    this.currentWordObj = null;
    this.scrambled = '';
    this.input = '';
    this.streak = 0;
    this.wordsSolved = 0;
    this.hintUsed = false;

    this.createCanvas(560, 620);
    this.initInputs();
    this.nextWord();

    this.showStartCard({
      title: 'WORD SCRAMBLE RUSH',
      icon: '🔤',
      objective: 'Unscramble as many words as possible before time runs out! Keep your streak for bonus points.',
      controls: 'Type on your keyboard or tap the on-screen letters.',
      onStart: () => this.start()
    });
  }

  nextWord() {
    this.currentWordObj = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    this.scrambled = shuffleString(this.currentWordObj.word);
    this.input = '';
    this.hintUsed = false;
  }

  initInputs() {
    // Physical Keyboard Listener (tracked via GameEngineBase)
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'Backspace') {
        this.input = this.input.slice(0, -1);
        sounds.playClick();
      } else if (e.key === 'Enter') {
        this.submitGuess();
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        if (this.input.length < this.currentWordObj.word.length) {
          this.input += e.key.toUpperCase();
          sounds.playClick();
          if (this.input.length === this.currentWordObj.word.length) {
            this.submitGuess();
          }
        }
      }
    });

    // Virtual Touch Keyboard & Buttons on Canvas
    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check Action Buttons (Shuffle & Hint)
      // Shuffle button (x: 100, y: 340, w: 160, h: 42)
      if (mx >= 100 && mx <= 260 && my >= 335 && my <= 375) {
        this.scrambled = shuffleString(this.scrambled);
        sounds.playClick();
        return;
      }
      // Hint button (x: 300, y: 340, w: 160, h: 42)
      if (mx >= 300 && mx <= 460 && my >= 335 && my <= 375) {
        if (!this.hintUsed) {
          this.hintUsed = true;
          this.input = this.currentWordObj.word.slice(0, Math.min(2, this.currentWordObj.word.length));
          sounds.playCoin();
        }
        return;
      }

      // Check Virtual On-Screen Alphabet Keys (Rows at bottom: 400 - 580)
      const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['DEL', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SUB']
      ];

      rows.forEach((row, rIdx) => {
        const keyW = 46;
        const keyH = 46;
        const rowY = 410 + rIdx * 54;
        const totalW = row.length * (keyW + 6) - 6;
        const startX = (this.baseWidth - totalW) / 2;

        row.forEach((k, cIdx) => {
          const kX = startX + cIdx * (keyW + 6);
          if (mx >= kX && mx <= kX + keyW && my >= rowY && my <= rowY + keyH) {
            if (k === 'DEL') {
              this.input = this.input.slice(0, -1);
              sounds.playClick();
            } else if (k === 'SUB') {
              this.submitGuess();
            } else {
              if (this.input.length < this.currentWordObj.word.length) {
                this.input += k;
                sounds.playClick();
                if (this.input.length === this.currentWordObj.word.length) {
                  this.submitGuess();
                }
              }
            }
          }
        });
      });
    });
  }

  submitGuess() {
    if (this.input === this.currentWordObj.word) {
      this.wordsSolved++;
      this.streak++;
      const multiplier = Math.min(3, 1 + (this.streak - 1) * 0.5);
      const points = Math.round((150 + this.currentWordObj.word.length * 20) * multiplier);
      this.score += points;
      this.timeLeft = Math.min(90, this.timeLeft + 5); // Time bonus!
      sounds.playWin();
      this.nextWord();
    } else {
      sounds.playHit();
      this.streak = 0;
      this.input = '';
    }
  }

  update(dt) {
    if (this.timeLeft > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore, wordsSolved: this.wordsSolved });
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Indigo Gradient Background
    const bg = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🔤 SOLVED: ${this.wordsSolved}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score} ${this.streak > 1 ? `(${this.streak}x 🔥)` : ''}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.timeLeft < 15 ? '#ff0055' : '#10b981';
    ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)}s`, this.baseWidth - 24, 34);

    // Clue Banner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.fillRect(24, 52, this.baseWidth - 48, 44);
    ctx.strokeRect(24, 52, this.baseWidth - 48, 44);

    ctx.font = 'bold 13px "Outfit", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(`💡 CLUE: "${this.currentWordObj ? this.currentWordObj.clue : ''}"`, this.baseWidth / 2, 79);

    // Scrambled Letter Tiles in Center
    if (this.currentWordObj) {
      const letters = this.scrambled.split('');
      const tileW = 44;
      const gap = 8;
      const totalW = letters.length * (tileW + gap) - gap;
      const startX = (this.baseWidth - totalW) / 2;
      const tileY = 120;

      letters.forEach((l, idx) => {
        const x = startX + idx * (tileW + gap);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, tileY, tileW, tileW);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, tileY, tileW, tileW);

        ctx.font = '900 26px "Lilita One", sans-serif';
        ctx.fillStyle = '#00e5ff';
        ctx.textAlign = 'center';
        ctx.fillText(l, x + tileW / 2, tileY + 32);
      });

      // Player Guess Input Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(40, 200, this.baseWidth - 80, 75);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(40, 200, this.baseWidth - 80, 75);

      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText('YOUR ANSWER', this.baseWidth / 2, 222);

      ctx.font = '900 36px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.fillText(this.input ? this.input : '_____', this.baseWidth / 2, 260);
    }

    // Helper Action Buttons: Shuffle & Hint
    // Shuffle Button
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(100, 335, 160, 42);
    ctx.font = '900 15px "Lilita One", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('🔀 SHUFFLE', 180, 361);

    // Hint Button
    ctx.fillStyle = this.hintUsed ? '#475569' : '#10b981';
    ctx.fillRect(300, 335, 160, 42);
    ctx.font = '900 15px "Lilita One", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.hintUsed ? '✓ HINT USED' : '💡 USE HINT (-50)', 380, 361);

    // On-Screen Mobile Keyboard (Rows 1-3)
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['DEL', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SUB']
    ];

    rows.forEach((row, rIdx) => {
      const keyW = 46;
      const keyH = 46;
      const rowY = 410 + rIdx * 54;
      const totalW = row.length * (keyW + 6) - 6;
      const startX = (this.baseWidth - totalW) / 2;

      row.forEach((k, cIdx) => {
        const kX = startX + cIdx * (keyW + 6);
        ctx.fillStyle = (k === 'DEL' || k === 'SUB') ? '#334155' : 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(kX, rowY, keyW, keyH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(kX, rowY, keyW, keyH);

        ctx.font = (k === 'DEL' || k === 'SUB') ? '900 12px "Outfit", sans-serif' : '900 18px "Lilita One", sans-serif';
        ctx.fillStyle = (k === 'SUB') ? '#10b981' : (k === 'DEL' ? '#ef4444' : '#ffffff');
        ctx.textAlign = 'center';
        ctx.fillText(k, kX + keyW / 2, rowY + 30);
      });
    });
  }
}
