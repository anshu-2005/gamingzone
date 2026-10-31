/* ====================================================
   SPEED TYPING WARRIOR — GAMINGZONE
   Arcade Space Defense Typing Game with Laser Cannons,
   WPM Counter, Accuracy Tracking, Shield Lives & Touch Keys
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

const WORD_DICTIONARY = [
  'CYBER', 'SPEED', 'LASER', 'NINJA', 'POWER', 'STRIKE', 'TURBO',
  'DRAGON', 'SHADOW', 'ROCKET', 'MATRIX', 'DEFENSE', 'WARRIOR',
  'GALAXY', 'CHAMPION', 'QUANTUM', 'BLIZZARD', 'VOLCANO', 'PULSE',
  'PHOENIX', 'CIRCUIT', 'SYSTEM', 'ATTACK', 'TARGET', 'BLAST'
];

export class SpeedTypingWarriorGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Speed Typing Warrior',
      targetScore: 2500,
      lives: 3,
      ...config
    });

    this.fallingEnemies = [];
    this.currentInput = '';
    this.spawnTimer = 0;
    this.totalTypedChars = 0;
    this.correctTypedChars = 0;
    this.wordsDestroyed = 0;
    this.lasers = [];
    this.particles = [];
    this.startTime = performance.now();

    this.createCanvas(600, 600);
    this.initKeyboardControls();

    this.showStartCard({
      title: 'SPEED TYPING WARRIOR',
      icon: '⌨️',
      objective: 'Type falling cyber words before they breach your planetary defense perimeter! Maintain high WPM and accuracy.',
      controls: 'Type on your keyboard or tap the bottom on-screen keys.',
      onStart: () => {
        this.startTime = performance.now();
        this.start();
      }
    });
  }

  initKeyboardControls() {
    // Physical Keyboard Listener
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'Backspace') {
        this.currentInput = this.currentInput.slice(0, -1);
        sounds.playClick();
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        this.handleCharInput(e.key.toUpperCase());
      }
    });

    // Touch Virtual Keyboard
    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Virtual Keys rows at bottom: 440 - 580
      const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['DEL', 'Z', 'X', 'C', 'V', 'B', 'N', 'M']
      ];

      rows.forEach((row, rIdx) => {
        const keyW = 48;
        const keyH = 40;
        const rowY = 460 + rIdx * 45;
        const totalW = row.length * (keyW + 6) - 6;
        const startX = (this.baseWidth - totalW) / 2;

        row.forEach((k, cIdx) => {
          const kX = startX + cIdx * (keyW + 6);
          if (mx >= kX && mx <= kX + keyW && my >= rowY && my <= rowY + keyH) {
            if (k === 'DEL') {
              this.currentInput = this.currentInput.slice(0, -1);
              sounds.playClick();
            } else {
              this.handleCharInput(k);
            }
          }
        });
      });
    });
  }

  handleCharInput(ch) {
    this.totalTypedChars++;
    this.currentInput += ch;
    sounds.playClick();

    // Check if input completely matches any falling enemy
    const matchIdx = this.fallingEnemies.findIndex(e => e.word === this.currentInput);

    if (matchIdx >= 0) {
      const enemy = this.fallingEnemies[matchIdx];
      this.correctTypedChars += enemy.word.length;
      this.wordsDestroyed++;
      this.score += enemy.word.length * 35;

      // Fire laser from bottom center to enemy
      this.lasers.push({
        x1: this.baseWidth / 2,
        y1: 420,
        x2: enemy.x + 30,
        y2: enemy.y,
        life: 0.2
      });

      // Spawn explosion particles
      for (let i = 0; i < 16; i++) {
        this.particles.push({
          x: enemy.x + 30,
          y: enemy.y,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          life: 0.6,
          color: '#00e5ff'
        });
      }

      sounds.playWin();
      this.fallingEnemies.splice(matchIdx, 1);
      this.currentInput = '';
    } else {
      // Check if currentInput is a valid prefix of ANY falling enemy
      const isPrefix = this.fallingEnemies.some(e => e.word.startsWith(this.currentInput));
      if (!isPrefix) {
        // Wrong typing - shake & reset
        sounds.playHit();
        this.currentInput = '';
      }
    }
  }

  spawnEnemy() {
    const word = WORD_DICTIONARY[Math.floor(Math.random() * WORD_DICTIONARY.length)];
    const speed = 35 + Math.min(60, this.wordsDestroyed * 3);
    const x = 40 + Math.random() * (this.baseWidth - 160);
    this.fallingEnemies.push({
      word,
      x,
      y: 30,
      speed
    });
  }

  update(dt) {
    this.spawnTimer += dt;
    const spawnInterval = Math.max(1.8, 3.5 - this.wordsDestroyed * 0.1);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Update enemies
    for (let i = this.fallingEnemies.length - 1; i >= 0; i--) {
      const enemy = this.fallingEnemies[i];
      enemy.y += enemy.speed * dt;

      // Breached shield perimeter
      if (enemy.y >= 410) {
        this.fallingEnemies.splice(i, 1);
        this.lives--;
        sounds.playHit();

        if (this.lives <= 0) {
          this.finishGame(this.score, { isVictory: false, wordsDestroyed: this.wordsDestroyed });
          return;
        }
      }
    }

    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].life -= dt;
      if (this.lasers[i].life <= 0) this.lasers.splice(i, 1);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Space Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Top HUD (Score, Shields, WPM)
    const elapsedMinutes = Math.max(0.1, (performance.now() - this.startTime) / 60000);
    const wpm = Math.round((this.correctTypedChars / 5) / elapsedMinutes);

    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ WPM: ${wpm}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`🛡️ SHIELDS: ${'❤️'.repeat(Math.max(0, this.lives))}`, this.baseWidth - 24, 34);

    // Shield Perimeter Line
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, 415);
    ctx.lineTo(this.baseWidth, 415);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Laser Beams
    this.lasers.forEach(l => {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Falling Enemies
    this.fallingEnemies.forEach(e => {
      const isTarget = e.word.startsWith(this.currentInput) && this.currentInput.length > 0;

      // Enemy Capsule Body
      ctx.fillStyle = isTarget ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = isTarget ? '#00e5ff' : '#475569';
      ctx.lineWidth = isTarget ? 2.5 : 1;
      const textW = ctx.measureText(e.word).width;
      const boxW = Math.max(90, textW + 30);
      ctx.fillRect(e.x - 10, e.y - 18, boxW, 32);
      ctx.strokeRect(e.x - 10, e.y - 18, boxW, 32);

      // Enemy Text
      ctx.font = '900 18px "Lilita One", sans-serif';
      ctx.textAlign = 'left';

      if (isTarget) {
        // Highlight matching prefix in gold, rest in cyan
        const matched = this.currentInput;
        const remainder = e.word.slice(matched.length);

        ctx.fillStyle = '#ffd166';
        ctx.fillText(matched, e.x, e.y + 4);
        const mW = ctx.measureText(matched).width;

        ctx.fillStyle = '#00e5ff';
        ctx.fillText(remainder, e.x + mW, e.y + 4);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(e.word, e.x, e.y + 4);
      }
    });

    // Cannon Turret at bottom center
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(this.baseWidth / 2, 430, 24, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current Input Display
    ctx.font = 'bold 15px "Outfit", sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`TYPED: ${this.currentInput || '...' }`, this.baseWidth / 2, 452);

    // Virtual Touch Keys
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['DEL', 'Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    rows.forEach((row, rIdx) => {
      const keyW = 48;
      const keyH = 38;
      const rowY = 465 + rIdx * 44;
      const totalW = row.length * (keyW + 6) - 6;
      const startX = (this.baseWidth - totalW) / 2;

      row.forEach((k, cIdx) => {
        const kX = startX + cIdx * (keyW + 6);
        ctx.fillStyle = k === 'DEL' ? '#ef4444' : 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(kX, rowY, keyW, keyH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(kX, rowY, keyW, keyH);

        ctx.font = k === 'DEL' ? '900 12px "Outfit", sans-serif' : '900 16px "Lilita One", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(k, kX + keyW / 2, rowY + 25);
      });
    });
  }
}
