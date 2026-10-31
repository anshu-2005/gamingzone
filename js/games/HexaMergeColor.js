import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HexaMergeColorGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Hexa Merge Color', ...config });
    this.createCanvas(860, 520);
    this.board = Array(16).fill(2);
    this.initControls();
    this.showStartCard({ title: 'HEXA MERGE COLOR', icon: '🛑', objective: 'Tap matching adjacent tiles to merge numbers into higher power tiers!', controls: 'Click adjacent matching tiles.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        if (this.state !== GameState.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const c = Math.floor((e.clientX - rect.left - 270) / 80);
        const r = Math.floor((e.clientY - rect.top - 100) / 80);
        const idx = r * 4 + c;
        if (idx >= 0 && idx < 16) {
          sounds.playCoin?.();
          this.board[idx] *= 2;
          this.score += this.board[idx];
        }
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#080a14'; ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 16; i++) {
      const c = i % 4, r = Math.floor(i / 4);
      const x = 270 + c * 80, y = 100 + r * 80;
      ctx.fillStyle = '#ff5733'; ctx.fillRect(x + 5, y + 5, 70, 70);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Outfit, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(this.board[i]), x + 40, y + 46);
    }
    ctx.textAlign = 'left'; ctx.fillText('SCORE: ' + this.score, 30, 40);
  }
}