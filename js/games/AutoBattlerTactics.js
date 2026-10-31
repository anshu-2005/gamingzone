import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class AutoBattlerTacticsGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Auto Battler Tactics', ...config });
    this.createCanvas(860, 520);
    this.allies = [{ x: 300, y: 260 }];
    this.enemies = [{ x: 560, y: 260 }];
    this.initControls();
    this.showStartCard({ title: 'AUTO BATTLER TACTICS', icon: '♟️', objective: 'Place synergy units and watch the tactical simulation unfold!', controls: 'Tap to deploy reinforcements.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', () => {
        sounds.playPowerup?.();
        this.score += 250;
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#00e5ff'; for (const a of this.allies) ctx.fillRect(a.x, a.y, 40, 40);
    ctx.fillStyle = '#f43f5e'; for (const e of this.enemies) ctx.fillRect(e.x, e.y, 40, 40);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('ARMY POWER: ' + this.score, 30, 40);
  }
}