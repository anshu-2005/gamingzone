import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class FrisbeeGolfChampionGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Frisbee Golf Champion', ...config });
    this.createCanvas(860, 520);
    this.disc = { x: 430, y: 440, vx: 0, vy: 0 };
    this.initControls();
    this.showStartCard({ title: 'FRISBEE GOLF CHAMPION', icon: '🥏', objective: 'Aim and fling the disc into the chain target basket!', controls: 'Click & Drag to aim and release.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', () => {
        if (this.state === GameState.MENU) { this.start(); return; }
        this.disc.vy = -14; this.disc.vx = (Math.random() - 0.5) * 4; sounds.playDrop?.();
      });
    }
  }
  update() {
    if (this.disc.vy !== 0) {
      this.disc.x += this.disc.vx;
      this.disc.y += this.disc.vy;
      this.disc.vy += 0.25;
      if (this.disc.y <= 160) {
        this.score = 500; sounds.playWin?.();
        this.victory({ score: 500 });
      }
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(400, 130, 60, 40); // Basket
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(this.disc.x, this.disc.y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('STROKES: 1', 30, 40);
  }
}