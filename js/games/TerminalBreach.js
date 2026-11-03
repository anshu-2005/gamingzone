import { GameEngineBase } from '../core/GameEngineBase.js';

export class TerminalBreach extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Terminal Breach: Fallout Decryptor';
    this.attemptsLeft = 4;
    this.secretWord = '';
    this.words = [];
    this.memoryDump = [];
    this.log = [];
    this.isWon = false;
    this.isLocked = false;

    this.wordBank = [
      'REACTOR', 'DEFENSE', 'COMMAND', 'CIRCUIT', 'STORAGE',
      'GATEWAY', 'PROGRAM', 'SHIELD', 'DYNAMIC', 'SYSTEMS',
      'OVERRIDE', 'SECURITY', 'TERMINAL', 'DATABASE', 'PROTOCOL'
    ];
  }

  onInit() {
    this.createCanvas();
    this.setupTerminal();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));

    this.showStartCard(
      'TERMINAL BREACH',
      'The authentic RobCo terminal hacking puzzle! Select passwords from memory dump to find the passcode. The system reports likeness (exact letter positions matched). 4 attempts before lockout!',
      'INITIALIZE TERMINAL'
    );
  }

  setupTerminal() {
    this.attemptsLeft = 4;
    this.log = ['ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL', 'ENTER PASSWORD NOW:'];
    this.isWon = false;
    this.isLocked = false;

    // Pick 8 candidate words of equal length (7 letters)
    const filtered = this.wordBank.filter(w => w.length === 7);
    this.words = [];
    const copy = [...filtered];
    for (let i = 0; i < 8 && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      this.words.push(copy.splice(idx, 1)[0]);
    }

    this.secretWord = this.words[Math.floor(Math.random() * this.words.length)];

    // Generate memory blocks
    this.memoryDump = [];
    let wordIdx = 0;
    let baseAddr = 0xF240;

    for (let i = 0; i < 16; i++) {
      const addr = '0x' + (baseAddr + i * 16).toString(16).toUpperCase();
      let text = '';
      let wordHere = null;

      if (wordIdx < this.words.length && (i % 2 === 0 || Math.random() < 0.4)) {
        wordHere = this.words[wordIdx++];
        const prefix = '!@#$%^&*()'[Math.floor(Math.random() * 10)].repeat(3);
        const suffix = '!@#$%^&*()'[Math.floor(Math.random() * 10)].repeat(3);
        text = `${prefix}${wordHere}${suffix}`;
      } else {
        text = '!@#$%^&*()_+=~{}[]:;'.split('').sort(() => 0.5 - Math.random()).slice(0, 13).join('');
      }

      this.memoryDump.push({ addr, text, word: wordHere });
    }
  }

  handleClick(e) {
    if (this.isWon || this.isLocked) {
      this.setupTerminal();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Check click on memory column lines
    // Left column: x in [50..460], Right column: x in [480..890]
    const lineH = 24;
    const startY = 120;

    for (let i = 0; i < this.memoryDump.length; i++) {
      const col = i < 8 ? 0 : 1;
      const row = i < 8 ? i : i - 8;
      const x = col === 0 ? 60 : 420;
      const y = startY + row * lineH;

      if (mx >= x && mx <= x + 320 && my >= y - 16 && my <= y + 6) {
        const item = this.memoryDump[i];
        if (item.word) {
          this.testPassword(item.word);
        } else {
          // Dud removal / replenishment
          this.log.push('> ERROR: Memory block invalid.');
        }
        break;
      }
    }
  }

  testPassword(word) {
    if (word === this.secretWord) {
      this.isWon = true;
      this.log.push(`> ${word}`);
      this.log.push('> EXACT MATCH!');
      this.log.push('> PLEASE WAIT WHILE SYSTEM LOADS ACCESS...');
      return;
    }

    this.attemptsLeft--;
    // Calculate likeness
    let likeness = 0;
    for (let i = 0; i < word.length; i++) {
      if (word[i] === this.secretWord[i]) likeness++;
    }

    this.log.push(`> ${word}`);
    this.log.push(`> ENTRY DENIED: Likeness = ${likeness}/7`);

    if (this.attemptsLeft <= 0) {
      this.isLocked = true;
      this.log.push('> TERMINAL LOCKED. PLEASE CONTACT SYSADMIN.');
    }
  }

  onRender(ctx) {
    // CRT Terminal Green Phosphor Display
    ctx.fillStyle = '#021008';
    ctx.fillRect(0, 0, 1000, 562);

    // CRT Scanlines
    ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
    for (let y = 0; y < 562; y += 3) {
      ctx.fillRect(0, y, 1000, 1.5);
    }

    // Header
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('📟 ROBCO TERMLINK v4.05 - V.A.T.S. OVERRIDE', 30, 38);

    // Attempts indicator
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'right';
    const blocks = ' █'.repeat(this.attemptsLeft);
    ctx.fillText(`ATTEMPTS LEFT:${blocks}`, 970, 38);

    // Render Two Memory Columns
    const startY = 120;
    const lineH = 26;

    for (let i = 0; i < this.memoryDump.length; i++) {
      const col = i < 8 ? 0 : 1;
      const row = i < 8 ? i : i - 8;
      const x = col === 0 ? 60 : 420;
      const y = startY + row * lineH;
      const item = this.memoryDump[i];

      ctx.fillStyle = '#059669';
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.addr, x, y);

      ctx.fillStyle = item.word ? '#34d399' : '#047857';
      ctx.fillText(item.text, x + 85, y);
    }

    // Right Log Output Panel
    ctx.fillStyle = '#031a0e';
    ctx.fillRect(720, 80, 260, 420);
    ctx.strokeStyle = '#059669';
    ctx.strokeRect(720, 80, 260, 420);

    ctx.fillStyle = '#10b981';
    ctx.font = '12px "Courier New", monospace';
    const recent = this.log.slice(-14);
    recent.forEach((l, idx) => {
      ctx.fillText(l, 735, 110 + idx * 24);
    });

    // Bottom Help
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 515, 1000, 47);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Click words in the memory block to test. Likeness indicates exact letter position matches.', 500, 542);

    // Won / Locked Overlay
    if (this.isWon || this.isLocked) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = this.isWon ? '#10b981' : '#ef4444';
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.isWon ? 'ACCESS GRANTED' : 'TERMINAL LOCKED OUT', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = '18px "Courier New", monospace';
      ctx.fillText(this.isWon ? 'PRIMARY SYSTEMS ONLINE' : `PASSWORD WAS: ${this.secretWord}`, 500, 290);

      ctx.fillStyle = this.isWon ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 48, 6);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('RESET TERMINAL', 500, 360);
    }
  }
}
