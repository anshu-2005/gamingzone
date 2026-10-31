/* ====================================================
   FISHING LEGEND CATCH — GAMINGZONE
   Deep Sea Sport Fishing with Multi-Tier Depths, Reeling Tension
   Meter, Rare Species (Marlin, Golden Koi, Shark) & Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

const FISH_SPECIES = [
  { name: 'Clownfish', icon: '🐠', pts: 100, depth: 1, speed: 70, weight: '1.2 kg', color: '#f97316' },
  { name: 'Bluefin Tuna', icon: '🐟', pts: 250, depth: 2, speed: 120, weight: '15.4 kg', color: '#3b82f6' },
  { name: 'Golden Koi', icon: '🐡', pts: 400, depth: 2, speed: 90, weight: '4.8 kg', color: '#ffd166' },
  { name: 'Blue Marlin', icon: '🦈', pts: 600, depth: 3, speed: 180, weight: '42.0 kg', color: '#00e5ff' },
  { name: 'Great White', icon: '🐋', pts: 900, depth: 3, speed: 110, weight: '120.0 kg', color: '#e2e8f0' }
];

export class FishingLegendCatchGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Fishing Legend Catch',
      targetScore: 1800,
      casts: 5,
      ...config
    });

    this.castsLeft = this.config.casts || 5;
    this.catches = [];
    this.fishList = [];
    this.bubbles = [];
    this.particles = [];
    this.announcements = [];

    // Fishing Rod & Hook State
    this.hook = {
      x: 360,
      y: 90,
      targetX: 360,
      vy: 0,
      state: 'idle', // idle, dropping, hooked, reeling
      hookedFish: null,
      tension: 50 // 0 to 100
    };

    this.createCanvas(720, 560);
    this.initEcosystem();
    this.initFishingControls();

    this.showStartCard({
      title: 'FISHING LEGEND CATCH',
      icon: '🎣',
      objective: 'Cast your titanium hook into the ocean abyss! Snag trophy fish and tap to maintain reel line tension.',
      controls: 'Move finger or mouse to aim horizontal position. Tap to drop hook; tap rapidly while reeling to stay in the green zone.',
      onStart: () => this.start()
    });
  }

  initEcosystem() {
    this.fishList = [];
    this.bubbles = [];

    // Populate ocean layers with diverse marine life
    for (let i = 0; i < 12; i++) {
      const sp = FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)];
      const layerY = 160 + sp.depth * 95 + (Math.random() - 0.5) * 40;
      this.fishList.push({
        ...sp,
        x: Math.random() * this.baseWidth,
        y: layerY,
        vx: (Math.random() < 0.5 ? -1 : 1) * sp.speed
      });
    }

    // Ambient Bubbles
    for (let i = 0; i < 25; i++) {
      this.bubbles.push({
        x: Math.random() * this.baseWidth,
        y: Math.random() * this.baseHeight,
        vy: 20 + Math.random() * 40,
        radius: 1.5 + Math.random() * 2.5
      });
    }
  }

  initFishingControls() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return (clientX - rect.left) * scaleX;
    };

    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (this.hook.state === 'idle') {
        this.hook.x = Math.max(40, Math.min(this.baseWidth - 40, getPos(e)));
      }
    });

    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;

      if (this.hook.state === 'idle') {
        this.hook.x = Math.max(40, Math.min(this.baseWidth - 40, getPos(e)));
        this.hook.state = 'dropping';
        this.hook.vy = 280;
        this.castsLeft--;
        sounds.playClick();
      } else if (this.hook.state === 'reeling') {
        // Tap to pull tension up
        this.hook.tension = Math.min(100, this.hook.tension + 12);
        sounds.playPowerup();
      }
    });
  }

  update(dt) {
    // Ambient Bubbles Rising
    this.bubbles.forEach(b => {
      b.y -= b.vy * dt;
      if (b.y < 80) {
        b.y = this.baseHeight + 10;
        b.x = Math.random() * this.baseWidth;
      }
    });

    // Swimming Fish Movement
    this.fishList.forEach(f => {
      f.x += f.vx * dt;
      if (f.vx > 0 && f.x > this.baseWidth + 40) {
        f.x = -40;
      } else if (f.vx < 0 && f.x < -40) {
        f.x = this.baseWidth + 40;
      }
    });

    // Hook State Machine
    if (this.hook.state === 'dropping') {
      this.hook.y += this.hook.vy * dt;

      // Bottom seabed limit
      if (this.hook.y >= this.baseHeight - 35) {
        this.hook.state = 'reeling';
        this.hook.vy = -180;
      }

      // Check collision with swimming fish
      for (let i = this.fishList.length - 1; i >= 0; i--) {
        const f = this.fishList[i];
        if (Math.hypot(this.hook.x - f.x, this.hook.y - f.y) < 28) {
          // Snagged a fish!
          this.hook.hookedFish = f;
          this.hook.state = 'reeling';
          this.hook.vy = -130;
          this.hook.tension = 50;

          sounds.playWin();
          this.spawnBurst(this.hook.x, this.hook.y, f.color, 14);
          this.fishList.splice(i, 1);
          break;
        }
      }
    } else if (this.hook.state === 'reeling') {
      this.hook.y += this.hook.vy * dt;

      if (this.hook.hookedFish) {
        // Line tension decays naturally; player must tap to keep it in green zone (35 - 75)
        this.hook.tension -= 28 * dt;

        // Snapped or lost fish
        if (this.hook.tension <= 5 || this.hook.tension >= 98) {
          sounds.playHit();
          this.announcements.push({ text: 'LINE SNAPPED! 💥', y: 220, alpha: 1 });
          this.hook.hookedFish = null;
        }
      }

      // Reached surface boat
      if (this.hook.y <= 90) {
        this.hook.y = 90;
        this.hook.state = 'idle';

        if (this.hook.hookedFish) {
          const fish = this.hook.hookedFish;
          this.score += fish.pts;
          this.catches.push(fish);
          sounds.playLevelUp();
          this.announcements.push({ text: `CAUGHT ${fish.name.toUpperCase()}! (+${fish.pts})`, y: 140, alpha: 1 });
          this.spawnBurst(this.hook.x, 90, '#ffd166', 22);
          this.hook.hookedFish = null;
        }

        // Check if finished all casts
        if (this.castsLeft <= 0) {
          this.setTimeout(() => {
            this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore, catches: this.catches.length });
          }, 1100);
        } else {
          // Respawn replacement fish
          this.initEcosystem();
        }
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Announcements
    for (let i = this.announcements.length - 1; i >= 0; i--) {
      const a = this.announcements[i];
      a.y -= 25 * dt;
      a.alpha -= dt * 0.9;
      if (a.alpha <= 0) this.announcements.splice(i, 1);
    }
  }

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        color,
        life: 0.4
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Marine Gradient Ocean Depth
    const ocean = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    ocean.addColorStop(0, '#0284c7');  // Surface azure
    ocean.addColorStop(0.3, '#0369a1'); // Reef depth
    ocean.addColorStop(0.7, '#1e1b4b'); // Twilight zone
    ocean.addColorStop(1, '#020617');   // Abyss floor
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Surface Pier Deck (Top)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 50, this.baseWidth, 24);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 50, this.baseWidth, 24);

    // Fishing Boat on Water
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(this.hook.x - 40, 58, 80, 20, [0, 0, 10, 10]);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Fishing Line from Boat to Hook
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.hook.x, 75);
    ctx.lineTo(this.hook.x, this.hook.y);
    ctx.stroke();

    // Draw Titanium Fish Hook
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.hook.x, this.hook.y + 6, 8, 0, Math.PI);
    ctx.stroke();

    // Hook Barb
    ctx.beginPath();
    ctx.moveTo(this.hook.x - 8, this.hook.y + 6);
    ctx.lineTo(this.hook.x - 12, this.hook.y + 1);
    ctx.stroke();

    // Draw Swimming Marine Life
    this.fishList.forEach(f => {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.translate(f.x, f.y);
      if (f.vx < 0) ctx.scale(-1, 1);
      ctx.fillText(f.icon, 0, 0);
      ctx.restore();
    });

    // Draw Hooked Fish attached to hook
    if (this.hook.hookedFish) {
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.hook.hookedFish.icon, this.hook.x, this.hook.y + 16);

      // Tension Meter on Right Side
      const meterX = this.baseWidth - 45;
      const meterY = 160;
      const meterH = 220;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(meterX, meterY, 20, meterH);

      // Green Sweet Spot Zone (tension 35 to 75)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.fillRect(meterX, meterY + meterH * 0.25, 20, meterH * 0.45);

      // Indicator level
      const needleY = meterY + meterH * (1 - this.hook.tension / 100);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(meterX - 4, needleY - 3, 28, 6);

      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('REEL!', meterX + 10, meterY - 10);
    }

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Announcements
    this.announcements.forEach(a => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.font = '900 28px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.textAlign = 'center';
      ctx.fillText(a.text, this.baseWidth / 2, a.y);
      ctx.restore();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🎣 CASTS: ${this.castsLeft}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`TROPHY SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`CATCHES: ${this.catches.length}`, this.baseWidth - 24, 34);
  }
}
