import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ZenSandGardenGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Zen Sand Garden', ...config });
    this.createCanvas(860, 520);
    this.trails = [];
    this.initControls();
    this.showStartCard({ title: 'ZEN SAND GARDEN', icon: '🪨', objective: 'Draw soothing rake patterns across the Japanese sand garden.', controls: 'Click & drag across sand.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointermove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.trails.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#fde68a'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i < this.trails.length; i++) {
      if (i === 0) ctx.moveTo(this.trails[i].x, this.trails[i].y);
      else ctx.lineTo(this.trails[i].x, this.trails[i].y);
    }
    ctx.stroke();
    ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(430, 260, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#78350f'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('ZEN MEDITATION', 30, 40);
  }
}