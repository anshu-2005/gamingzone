import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class RetroHighwayRacerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Retro Highway Racer', ...config });
    this.createCanvas(860, 520);
    this.lane = 1;
    this.traffic = [];
    this.lanes = [280, 430, 580];
    this.initControls();
    this.showStartCard({ title: 'RETRO HIGHWAY RACER', icon: '🛣️', objective: 'Switch lanes to dodge rush-hour highway traffic!', controls: 'Left/Right or A/D to switch lanes.' });
  }
  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && this.lane > 0) this.lane--;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && this.lane < 2) this.lane++;
    });
  }
  update(delta) {
    if (this.state !== GameState.PLAYING) return;
    this.score += 1;
    if (Math.random() < 0.03) {
      this.traffic.push({ lane: Math.floor(Math.random() * 3), y: -60, speed: 6 + Math.random() * 3 });
    }
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      t.y += t.speed;
      if (t.lane === this.lane && Math.abs(t.y - 420) < 50) {
        sounds.playGameOver?.();
        this.gameOver(this.score);
        return;
      }
      if (t.y > this.height) this.traffic.splice(i, 1);
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#090d16'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(200, 0, 460, this.height);
    ctx.fillStyle = '#00e5ff'; ctx.fillRect(this.lanes[this.lane] - 20, 390, 40, 60);
    ctx.fillStyle = '#ef4444';
    for (const t of this.traffic) { ctx.fillRect(this.lanes[t.lane] - 20, t.y, 40, 60); }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('DISTANCE: ' + this.score + 'm', 30, 40);
  }
}