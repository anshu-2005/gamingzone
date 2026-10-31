import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class QuantumTileSlideGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Quantum Tile Slide', ...config });
    this.createCanvas(860, 520);
    this.tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    this.initControls();
    this.showStartCard({ title: 'QUANTUM TILE SLIDE', icon: '🧊', objective: 'Slide tiles into numerical order 1 to 8.', controls: 'Click tile adjacent to empty space.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        if (this.state !== GameState.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const c = Math.floor((e.clientX - rect.left - 290) / 90);
        const r = Math.floor((e.clientY - rect.top - 120) / 90);
        const idx = r * 3 + c;
        const zeroIdx = this.tiles.indexOf(0);
        if (Math.abs(r - Math.floor(zeroIdx / 3)) + Math.abs(c - (zeroIdx % 3)) === 1) {
          sounds.playClick?.();
          this.tiles[zeroIdx] = this.tiles[idx];
          this.tiles[idx] = 0;
          this.score += 10;
        }
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0c101c'; ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 9; i++) {
      const v = this.tiles[i];
      if (v === 0) continue;
      const c = i % 3, r = Math.floor(i / 3);
      const x = 290 + c * 90, y = 120 + r * 90;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(x + 4, y + 4, 82, 82);
      ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 32px Outfit, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(v), x + 45, y + 55);
    }
  }
}