import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PixelDungeonCrawlerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Pixel Dungeon Crawler', ...config });
    this.createCanvas(860, 520);
    this.hero = { x: 200, y: 380, vy: 0 };
    this.slimes = [{ x: 500, y: 380 }];
    this.initControls();
    this.showStartCard({ title: 'PIXEL DUNGEON CRAWLER', icon: '🗡️', objective: 'Slay dungeon slimes and collect chests!', controls: 'Arrow keys to move, Space to swing sword.' });
  }
  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowRight') this.hero.x += 20;
      if (e.code === 'ArrowLeft') this.hero.x -= 20;
      if (e.code === 'Space') { sounds.playHit?.(); this.slimes = []; this.score += 200; }
    });
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#10b981'; ctx.fillRect(this.hero.x, this.hero.y, 32, 48);
    for (const s of this.slimes) { ctx.fillStyle = '#f43f5e'; ctx.fillRect(s.x, s.y + 16, 32, 32); }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('GOLD: ' + this.score, 30, 40);
  }
}