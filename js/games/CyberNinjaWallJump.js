import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CyberNinjaWallJumpGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Cyber Ninja Wall Jump', ...config });
    this.createCanvas(860, 520);
    this.wall = 0; // 0: left wall, 1: right wall
    this.ninjaY = 400;
    this.initControls();
    this.showStartCard({ title: 'CYBER NINJA WALL JUMP', icon: '🥷', objective: 'Leap between skyscraper walls to ascend the tower!', controls: 'Spacebar / Click to Jump Walls.' });
  }
  initControls() {
    const jump = () => {
      if (this.state === GameState.MENU) { this.start(); return; }
      sounds.playJump?.();
      this.wall = 1 - this.wall;
      this.ninjaY -= 35;
      this.score += 25;
    };
    this.addEventListenerTracked(window, 'keydown', (e) => { if (e.code === 'Space') jump(); });
    if (this.canvas) this.addEventListenerTracked(this.canvas, 'pointerdown', jump);
  }
  update() {
    if (this.state !== GameState.PLAYING) return;
    this.ninjaY += 1.2;
    if (this.ninjaY > 500) this.gameOver(this.score);
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0f19'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, 100, this.height); ctx.fillRect(this.width - 100, 0, 100, this.height);
    ctx.fillStyle = '#00e5ff'; const x = this.wall === 0 ? 105 : this.width - 135;
    ctx.fillRect(x, this.ninjaY, 30, 40);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('HEIGHT: ' + this.score + 'm', 30, 40);
  }
}