import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CircuitConnectNeonGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Circuit Connect Neon', ...config });
    this.createCanvas(860, 520);
    this.grid = [
      [0, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [1, 0, 1, 0]
    ];
    this.initControls();
    this.showStartCard({ title: 'CIRCUIT CONNECT NEON', icon: '🔌', objective: 'Rotate circuit conduits to connect the cyber power core to all terminals.', controls: 'Click nodes to rotate 90°.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        if (this.state !== GameState.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const c = Math.floor((e.clientX - rect.left - 270) / 80);
        const r = Math.floor((e.clientY - rect.top - 100) / 80);
        if (r >= 0 && r < 4 && c >= 0 && c < 4) {
          sounds.playClick?.();
          this.grid[r][c] = (this.grid[r][c] + 1) % 4;
          this.checkWin();
        }
      });
    }
  }
  checkWin() {
    if (this.grid.flat().every(v => v === 0)) {
      sounds.playWin?.();
      this.score += 500;
      this.victory({ score: this.score });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0d18'; ctx.fillRect(0, 0, this.width, this.height);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 270 + c * 80 + 40, y = 100 + r * 80 + 40;
        ctx.save(); ctx.translate(x, y); ctx.rotate(this.grid[r][c] * Math.PI / 2);
        ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(25, 0); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('CIRCUIT TERMINALS ALIGNED', 30, 40);
  }
}