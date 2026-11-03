import { GameEngineBase } from '../core/GameEngineBase.js';

export class NeonCyberCasino extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Neon Cyber Casino';
    this.credits = 1000;
    this.bet = 50;
    this.mode = 'crash'; // 'crash', 'mines', 'wheel'

    // Crash mode
    this.crashState = 'betting'; // 'betting', 'flying', 'crashed', 'cashed_out'
    this.crashMultiplier = 1.0;
    this.crashSpeed = 0.5;
    this.crashLimit = 2.0;
    this.cashedMultiplier = 0;
    this.rocketY = 400;
    this.particles = [];

    // Mines mode
    this.minesGrid = [];
    this.minesRevealed = [];
    this.minesActive = false;
    this.mineMultiplier = 1.0;

    // Wheel mode
    this.wheelAngle = 0;
    this.wheelSpinning = false;
    this.wheelVelocity = 0;
    this.wheelSegments = [
      { label: '2X', mult: 2, col: '#06b6d4' },
      { label: '0X', mult: 0, col: '#ef4444' },
      { label: '5X', mult: 5, col: '#ec4899' },
      { label: '1.5X', mult: 1.5, col: '#3b82f6' },
      { label: '0.5X', mult: 0.5, col: '#f59e0b' },
      { label: '10X', mult: 10, col: '#a855f7' },
      { label: 'JACKPOT', mult: 25, col: '#10b981' },
      { label: '0X', mult: 0, col: '#64748b' }
    ];

    this.message = 'Place your bet & launch the cyber rocket!';
    this.msgTimer = 0;
  }

  onInit() {
    this.createCanvas();
    this.setupMines();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerMainAction();
      }
    });

    this.showStartCard(
      'NEON CYBER CASINO',
      'High-tech cyberpunk arcade! Play Rocket Crash, Cyber Mines, and Neon Wheel with free arcade credits. Bet smartly and cash out before the rocket crashes!',
      'ENTER CYBER CASINO'
    );
  }

  setupMines() {
    this.minesGrid = new Array(25).fill(false);
    this.minesRevealed = new Array(25).fill(false);
    // 4 mines
    let placed = 0;
    while (placed < 4) {
      const idx = Math.floor(Math.random() * 25);
      if (!this.minesGrid[idx]) {
        this.minesGrid[idx] = true;
        placed++;
      }
    }
    this.minesActive = false;
    this.mineMultiplier = 1.0;
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Mode tabs (top)
    if (my >= 20 && my <= 60) {
      if (mx >= 320 && mx <= 440) { this.mode = 'crash'; return; }
      if (mx >= 460 && mx <= 580) { this.mode = 'mines'; return; }
      if (mx >= 600 && mx <= 720) { this.mode = 'wheel'; return; }
    }

    // Bet adjustment buttons
    if (my >= 495 && my <= 535) {
      if (mx >= 50 && mx <= 100) { this.bet = Math.max(10, this.bet - 10); return; }
      if (mx >= 190 && mx <= 240) { this.bet = Math.min(this.credits, this.bet + 10); return; }
      if (mx >= 250 && mx <= 300) { this.bet = Math.min(this.credits, this.bet * 2); return; }
      if (mx >= 310 && mx <= 360) { this.bet = Math.min(this.credits, 500); return; }
    }

    // Main action button
    if (mx >= 780 && mx <= 950 && my >= 485 && my <= 545) {
      this.triggerMainAction();
      return;
    }

    // Mines grid clicks
    if (this.mode === 'mines' && this.minesActive && mx >= 350 && mx <= 650 && my >= 130 && my <= 430) {
      const col = Math.floor((mx - 350) / 60);
      const row = Math.floor((my - 130) / 60);
      const idx = row * 5 + col;
      if (idx >= 0 && idx < 25 && !this.minesRevealed[idx]) {
        this.revealMineCell(idx);
      }
    }
  }

  triggerMainAction() {
    if (this.mode === 'crash') {
      if (this.crashState === 'betting') {
        if (this.credits < this.bet) {
          this.credits += 500; // recharge
          this.message = 'RECHARGED 500 CREDITS!';
          return;
        }
        this.credits -= this.bet;
        this.crashState = 'flying';
        this.crashMultiplier = 1.0;
        this.cashedMultiplier = 0;
        this.rocketY = 400;
        this.crashLimit = 1.05 + Math.random() * (Math.random() < 0.2 ? 1.5 : (Math.random() < 0.6 ? 4.0 : 12.0));
        this.message = 'FLYING! Hit CASH OUT before it explodes!';
      } else if (this.crashState === 'flying') {
        // Cash out
        this.cashedMultiplier = this.crashMultiplier;
        const win = Math.round(this.bet * this.cashedMultiplier);
        this.credits += win;
        this.crashState = 'cashed_out';
        this.message = `CASHED OUT! Won +${win} Cyber Credits!`;
      } else if (this.crashState === 'crashed' || this.crashState === 'cashed_out') {
        this.crashState = 'betting';
        this.message = 'Ready! Place bet and launch.';
      }
    } else if (this.mode === 'mines') {
      if (!this.minesActive) {
        if (this.credits < this.bet) { this.credits += 500; return; }
        this.credits -= this.bet;
        this.setupMines();
        this.minesActive = true;
        this.message = 'Pick safe nodes to multiply! Cash out anytime.';
      } else {
        // Cash out mines
        const win = Math.round(this.bet * this.mineMultiplier);
        this.credits += win;
        this.minesActive = false;
        this.message = `Mines Cashed out! Won +${win} Credits!`;
      }
    } else if (this.mode === 'wheel') {
      if (!this.wheelSpinning) {
        if (this.credits < this.bet) { this.credits += 500; return; }
        this.credits -= this.bet;
        this.wheelSpinning = true;
        this.wheelVelocity = 0.3 + Math.random() * 0.4;
        this.message = 'SPINNING NEON WHEEL...';
      }
    }
  }

  revealMineCell(idx) {
    this.minesRevealed[idx] = true;
    if (this.minesGrid[idx]) {
      // Boom!
      this.minesActive = false;
      this.message = 'CYBER MINE DETONATED! Round lost.';
      for (let i = 0; i < 25; i++) this.minesRevealed[i] = true;
    } else {
      this.mineMultiplier = parseFloat((this.mineMultiplier * 1.35).toFixed(2));
      this.message = `SAFE! Current multiplier: ${this.mineMultiplier}x`;
    }
  }

  onUpdate(dt) {
    // Particle updates
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.mode === 'crash') {
      if (this.crashState === 'flying') {
        this.crashMultiplier += dt * (0.4 + this.crashMultiplier * 0.25);
        this.rocketY = Math.max(120, 400 - (this.crashMultiplier - 1) * 35);

        // Rocket exhaust
        this.particles.push({
          x: 220 + (this.crashMultiplier - 1) * 45,
          y: this.rocketY + 15,
          vx: -2 - Math.random() * 3,
          vy: (Math.random() - 0.5) * 3,
          color: Math.random() < 0.5 ? '#06b6d4' : '#ec4899',
          radius: 3 + Math.random() * 3,
          life: 0.4
        });

        if (this.crashMultiplier >= this.crashLimit) {
          this.crashState = 'crashed';
          this.message = `CRASHED at ${this.crashLimit.toFixed(2)}x!`;
          // Explosion particles
          for (let i = 0; i < 40; i++) {
            this.particles.push({
              x: 220 + (this.crashMultiplier - 1) * 45,
              y: this.rocketY,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              color: '#ef4444',
              radius: 4 + Math.random() * 4,
              life: 0.8
            });
          }
        }
      }
    } else if (this.mode === 'wheel') {
      if (this.wheelSpinning) {
        this.wheelAngle += this.wheelVelocity;
        this.wheelVelocity *= 0.985;
        if (this.wheelVelocity < 0.002) {
          this.wheelSpinning = false;
          this.wheelVelocity = 0;
          // Determine winning segment
          const segAngle = (Math.PI * 2) / this.wheelSegments.length;
          const normalized = (Math.PI * 1.5 - (this.wheelAngle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2);
          const winIdx = Math.floor(normalized / segAngle) % this.wheelSegments.length;
          const wonSeg = this.wheelSegments[winIdx];
          const win = Math.round(this.bet * wonSeg.mult);
          this.credits += win;
          this.message = `WHEEL STOPPED ON ${wonSeg.label}! Won +${win} Credits!`;
        }
      }
    }
  }

  onRender(ctx) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 1000, 562);

    // Cyber background grid
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1000; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 562); ctx.stroke();
    }
    for (let y = 0; y < 562; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1000, y); ctx.stroke();
    }

    // Top Header & Mode selector
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 75);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ NEON CYBER CASINO', 30, 45);

    // Modes
    const tabs = [
      { id: 'crash', label: '🚀 ROCKET CRASH', x: 320 },
      { id: 'mines', label: '💎 CYBER MINES', x: 460 },
      { id: 'wheel', label: '🎡 NEON WHEEL', x: 600 }
    ];
    tabs.forEach(t => {
      const active = this.mode === t.id;
      ctx.fillStyle = active ? '#8b5cf6' : '#1e293b';
      ctx.fillRect(t.x, 20, 125, 40);
      ctx.fillStyle = active ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.label, t.x + 62, 45);
    });

    // Credit balance
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`CREDITS: $${this.credits}`, 970, 45);

    // Mode specific renders
    if (this.mode === 'crash') {
      this.renderCrash(ctx);
    } else if (this.mode === 'mines') {
      this.renderMines(ctx);
    } else if (this.mode === 'wheel') {
      this.renderWheel(ctx);
    }

    // Render Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Bottom Bar (Bet controls & Action button)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 480, 1000, 82);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 480, 1000, 82);

    // Bet adjust
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BET AMOUNT', 50, 502);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`$${this.bet}`, 115, 525);

    // -10 & +10 buttons
    ctx.fillStyle = '#334155';
    ctx.fillRect(50, 510, 50, 30);
    ctx.fillRect(180, 510, 50, 30);
    ctx.fillRect(240, 510, 50, 30);
    ctx.fillRect(300, 510, 60, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('-10', 75, 530);
    ctx.fillText('+10', 205, 530);
    ctx.fillText('2X', 265, 530);
    ctx.fillText('MAX', 330, 530);

    // Status Message
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.message, 570, 525);

    // Big Action Button
    let btnText = 'BET / START';
    let btnBg = '#8b5cf6';
    if (this.mode === 'crash') {
      if (this.crashState === 'flying') {
        btnText = `CASH OUT ($${Math.round(this.bet * this.crashMultiplier)})`;
        btnBg = '#10b981';
      } else if (this.crashState === 'betting') {
        btnText = `LAUNCH ($${this.bet})`;
        btnBg = '#06b6d4';
      } else {
        btnText = 'PLAY AGAIN';
        btnBg = '#6366f1';
      }
    } else if (this.mode === 'mines') {
      btnText = this.minesActive ? `CASH OUT ($${Math.round(this.bet * this.mineMultiplier)})` : `START MINES ($${this.bet})`;
      btnBg = this.minesActive ? '#10b981' : '#06b6d4';
    } else if (this.mode === 'wheel') {
      btnText = this.wheelSpinning ? 'SPINNING...' : `SPIN ($${this.bet})`;
      btnBg = '#ec4899';
    }

    ctx.fillStyle = btnBg;
    ctx.fillRect(780, 495, 180, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(btnText, 870, 527);
  }

  renderCrash(ctx) {
    // Flight area
    const startX = 120;
    const startY = 420;
    const currentX = Math.min(850, startX + (this.crashMultiplier - 1) * 80);
    const currentY = this.rocketY;

    // Trajectory curve
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + currentX) / 2, startY, currentX, currentY);
    ctx.stroke();

    // Multiplier display
    ctx.fillStyle = this.crashState === 'crashed' ? '#ef4444' : '#10b981';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.crashMultiplier.toFixed(2)}x`, 500, 240);

    // Rocket
    if (this.crashState !== 'crashed') {
      ctx.save();
      ctx.translate(currentX, currentY);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(15, 0); ctx.lineTo(-12, -8); ctx.lineTo(-8, 0); ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  renderMines(ctx) {
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`MULTIPLIER: ${this.mineMultiplier.toFixed(2)}x`, 500, 110);

    const startX = 350;
    const startY = 130;
    const size = 52;
    const gap = 8;

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        const x = startX + c * (size + gap);
        const y = startY + r * (size + gap);
        const revealed = this.minesRevealed[idx];
        const isMine = this.minesGrid[idx];

        ctx.fillStyle = revealed ? (isMine ? '#ef4444' : '#10b981') : '#1e293b';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(x, y, size, size);

        if (revealed) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(isMine ? '💣' : '💎', x + size / 2, y + size / 2 + 8);
        }
      }
    }
  }

  renderWheel(ctx) {
    const cx = 500;
    const cy = 270;
    const radius = 170;
    const segAngle = (Math.PI * 2) / this.wheelSegments.length;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.wheelAngle);

    for (let i = 0; i < this.wheelSegments.length; i++) {
      const seg = this.wheelSegments[i];
      ctx.fillStyle = seg.col;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, i * segAngle, (i + 1) * segAngle);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Segment text
      ctx.save();
      ctx.rotate(i * segAngle + segAngle / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(seg.label, radius - 20, 5);
      ctx.restore();
    }
    ctx.restore();

    // Wheel center pin
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.fill();

    // Wheel pointer (top)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - radius - 15);
    ctx.lineTo(cx + 15, cy - radius - 15);
    ctx.lineTo(cx, cy - radius + 15);
    ctx.closePath();
    ctx.fill();
  }
}
