import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CurlingStoneProGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Curling Stone Pro', ...config });
    this.createCanvas(860, 520);
    this.stone = { x: 430, y: 440, vy: 0 };
    this.initControls();
    this.showStartCard({ title: 'CURLING STONE PRO', icon: '🥌', objective: 'Launch the heavy stone onto the center ice bullseye!', controls: 'Hold & release Spacebar / Click.' });
  }
  initControls() {
    const launch = () => {
      if (this.state === GameState.MENU) { this.start(); return; }
      this.stone.vy = -12; sounds.playDrop?.();
    };
    this.addEventListenerTracked(window, 'keydown', (e) => { if (e.code === 'Space') launch(); });
    if (this.canvas) this.addEventListenerTracked(this.canvas, 'pointerdown', launch);
  }
  update() {
    if (this.stone.vy < 0) {
      this.stone.y += this.stone.vy;
      this.stone.vy += 0.15;
      if (this.stone.vy >= 0) {
        const dist = Math.abs(this.stone.y - 140);
        this.score = Math.max(0, 1000 - Math.floor(dist * 8));
        this.victory({ score: this.score });
      }
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(430, 140, 80, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(430, 140, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(this.stone.x, this.stone.y, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('SCORE: ' + this.score, 30, 40);
  }
}