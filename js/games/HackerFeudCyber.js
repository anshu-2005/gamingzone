/* ====================================================
   HACKER FEUD — CYBER BREACH TERMINAL
   Inspired by lettier/hacker-feud (Svelte Cyber Game)
   Retro green CRT terminal, encryption ciphers, cyber command typing,
   ICE firewall evasion, access ranks & security countdowns.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HackerFeudCyberGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Hacker Feud: Cyber Breach',
      targetScore: 3000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.targetCommands = [
      'SUDO OVERRIDE',
      'INJECT PAYLOAD',
      'BYPASS FIREWALL',
      'DECRYPT KEY',
      'ROOT ACCESS',
      'CORRUPT KERNEL',
      'NEURAL LINK',
      'KILL TRACER'
    ];

    this.currentCommand = '';
    this.typedBuffer = '';
    this.nodesBreached = 0;
    this.sweepTimer = 7.0; // 7 seconds per hack
    this.maxSweepTime = 7.0;
    this.accessRank = 'Script Kiddie';

    this.logHistory = [
      'SYSTEM INITIALIZED: CYBER_TERMINAL v4.2',
      'PROBING MEGACORP MAINFRAME NODES...',
      'FIREWALL DETECTED. READY TO INJECT.'
    ];

    this.nextHack();
    this.initControls();

    this.showStartCard({
      title: 'HACKER FEUD: BREACH',
      icon: '💻',
      objective: 'Type terminal commands accurately before the ICE security sweep catches your signal!',
      controls: 'Type the on-screen command words on your keyboard • Click letter buttons'
    });
  }

  nextHack() {
    this.currentCommand = this.targetCommands[Math.floor(Math.random() * this.targetCommands.length)];
    this.typedBuffer = '';
    this.sweepTimer = Math.max(3.5, 7.5 - this.nodesBreached * 0.4);
    this.maxSweepTime = this.sweepTimer;

    // Update Access Rank
    if (this.nodesBreached >= 12) this.accessRank = 'GHOST OPERATIVE';
    else if (this.nodesBreached >= 8) this.accessRank = 'ELITE NETRUNNER';
    else if (this.nodesBreached >= 4) this.accessRank = 'CYBER MERC';
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;

      const key = e.key.toUpperCase();

      if (key === 'BACKSPACE') {
        this.typedBuffer = this.typedBuffer.slice(0, -1);
        sounds.playClick?.();
        return;
      }

      if (/^[A-Z\s]$/.test(key)) {
        this.typedBuffer += key;
        sounds.playClick?.();

        // Check Match
        if (this.typedBuffer === this.currentCommand) {
          sounds.playLevelUp?.();
          this.nodesBreached++;
          this.score += 250 + Math.round(this.sweepTimer * 40);
          this.logHistory.push(`[BREACH SUCCESS]: NODE_${this.nodesBreached} COMPROMISED`);
          if (this.logHistory.length > 5) this.logHistory.shift();
          this.nextHack();
        } else if (!this.currentCommand.startsWith(this.typedBuffer)) {
          // Mistake!
          sounds.playCrash?.();
          this.sweepTimer -= 1.0;
          this.typedBuffer = '';
        }
      }
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
      const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Virtual Keyboard rows
      const kbStartX = 180;
      const kbStartY = 370;
      const keySize = 34;
      const gap = 8;
      const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM '];

      for (let r = 0; r < rows.length; r++) {
        const rowStr = rows[r];
        const rowOffsetX = r * 14;
        for (let c = 0; c < rowStr.length; c++) {
          const letter = rowStr[c];
          const kx = kbStartX + rowOffsetX + c * (keySize + gap);
          const ky = kbStartY + r * (keySize + gap);

          if (clickX >= kx && clickX <= kx + keySize && clickY >= ky && clickY <= ky + keySize) {
            this.typedBuffer += letter;
            sounds.playClick?.();
            if (this.typedBuffer === this.currentCommand) {
              sounds.playLevelUp?.();
              this.nodesBreached++;
              this.score += 250;
              this.nextHack();
            } else if (!this.currentCommand.startsWith(this.typedBuffer)) {
              sounds.playCrash?.();
              this.typedBuffer = '';
            }
            return;
          }
        }
      }
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    this.sweepTimer -= dt;
    if (this.sweepTimer <= 0) {
      sounds.playCrash?.();
      this.finishGame(this.score, { reason: `Traced by ICE Security! Breached ${this.nodesBreached} Nodes.` });
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Terminal CRT Background
    ctx.fillStyle = '#05130b';
    ctx.fillRect(0, 0, w, h);

    // CRT Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // Header Terminal Glass
    ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
    ctx.fillRect(20, 16, w - 40, 50);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 16, w - 40, 50);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`SECURITY SWEEP: ${(Math.max(0, this.sweepTimer)).toFixed(1)}s`, 36, 46);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`RANK: ${this.accessRank}`, 300, 46);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`NODES: ${this.nodesBreached}  •  SCORE: ${this.score}`, w - 240, 46);

    // Security Sweep Progress Bar
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(20, 72, w - 40, 8);
    ctx.fillStyle = this.sweepTimer < 2.5 ? '#ef4444' : '#10b981';
    ctx.fillRect(20, 72, (w - 40) * (this.sweepTimer / this.maxSweepTime), 8);

    // Log History lines
    ctx.fillStyle = '#059669';
    ctx.font = '13px monospace';
    for (let i = 0; i < this.logHistory.length; i++) {
      ctx.fillText(`> ${this.logHistory[i]}`, 40, 120 + i * 22);
    }

    // Target Prompt Box
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(40, 200, w - 80, 90);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(40, 200, w - 80, 90);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TARGET INJECTION COMMAND:', 60, 226);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(this.currentCommand, 60, 268);

    // Typed Buffer Overlay
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(this.typedBuffer + '_', 60, 268);

    // On-screen Keyboard
    const kbStartX = 180;
    const kbStartY = 330;
    const keySize = 34;
    const gap = 8;
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM '];

    for (let r = 0; r < rows.length; r++) {
      const rowStr = rows[r];
      const rowOffsetX = r * 14;
      for (let c = 0; c < rowStr.length; c++) {
        const letter = rowStr[c];
        const kx = kbStartX + rowOffsetX + c * (keySize + gap);
        const ky = kbStartY + r * (keySize + gap);

        ctx.fillStyle = '#064e3b';
        ctx.fillRect(kx, ky, keySize, keySize);
        ctx.strokeStyle = '#10b981';
        ctx.strokeRect(kx, ky, keySize, keySize);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(letter === ' ' ? '␣' : letter, kx + 10, ky + 22);
      }
    }
  }
}

export default HackerFeudCyberGame;
