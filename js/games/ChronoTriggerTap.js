import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ChronoTriggerTapGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Chrono Trigger Tap', targetScore: 30, ...config });
    this.createCanvas(860, 520);
    this.angle = 0;
    this.targetStart = Math.PI * 0.4;
    this.targetEnd = Math.PI * 0.7;
    this.speed = 2.4;
    this.initControls();
    this.showStartCard({ title: 'CHRONO TRIGGER TAP', icon: '⏱️', objective: 'Tap when the rotating hand aligns with the target sector!', controls: 'Click / Spacebar to Trigger.' });
  }
  initControls() {
    const act = () => {
      if (this.state === GameState.MENU) { this.start(); return; }
      if (this.state !== GameState.PLAYING) return;
      const cur = this.angle % (Math.PI * 2);
      if (cur >= this.targetStart && cur <= this.targetEnd) {
        sounds.playCoin?.();
        this.score += 1;
        this.speed += 0.25;
        this.targetStart = Math.random() * Math.PI * 1.5;
        this.targetEnd = this.targetStart + Math.max(0.3, 0.6 - this.score * 0.02);
      } else {
        sounds.playGameOver?.();
        this.gameOver(this.score);
      }
    };
    this.addEventListenerTracked(window, 'keydown', (e) => { if (e.code === 'Space') act(); });
    if (this.canvas) this.addEventListenerTracked(this.canvas, 'pointerdown', act);
  }
  update(delta) {
    if (this.state !== GameState.PLAYING) return;
    this.angle += this.speed * delta;
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, this.width, this.height);
    const cx = this.width / 2, cy = this.height / 2, r = 140;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#10b981'; ctx.beginPath(); ctx.arc(cx, cy, r, this.targetStart, this.targetEnd); ctx.stroke();
    const hx = cx + Math.cos(this.angle) * r;
    const hy = cy + Math.sin(this.angle) * r;
    ctx.strokeStyle = '#ff5733'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('STREAK: ' + this.score, cx, cy + 8);
  }
}