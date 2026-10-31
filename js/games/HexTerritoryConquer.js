import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HexTerritoryConquerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Hex Territory Conquer', ...config });
    this.createCanvas(860, 520);
    this.territories = [1, 1, 0, 2, 2];
    this.initControls();
    this.showStartCard({ title: 'HEX TERRITORY CONQUER', icon: '🏰', objective: 'Capture adjacent hex nodes to outnumber your rival.', controls: 'Click nodes to claim.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', () => {
        sounds.playClick?.();
        this.score += 100;
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < 3 ? '#3b82f6' : '#ef4444';
      ctx.beginPath(); ctx.arc(200 + i * 110, 260, 36, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('CONTROL: 60%', 30, 40);
  }
}