import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PotionCraftBreweryGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Potion Craft Brewery', ...config });
    this.createCanvas(860, 520);
    this.potionsBrewed = 0;
    this.cauldronColor = '#a855f7';
    this.initControls();
    this.showStartCard({ title: 'POTION CRAFT BREWERY', icon: '🧪', objective: 'Mix magical herbs and reagents to brew mystical elixirs!', controls: 'Tap reagents to add to cauldron.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', () => {
        sounds.playCoin?.();
        this.potionsBrewed++;
        this.score += 150;
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.cauldronColor; ctx.beginPath(); ctx.arc(430, 300, 90, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('POTIONS CRAFTED: ' + this.potionsBrewed, 30, 40);
  }
}