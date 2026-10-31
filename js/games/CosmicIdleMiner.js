/* ====================================================
   COSMIC IDLE MINER — GAMINGZONE
   Addictive Clicker / Incremental Space Mining Experience
   - Click to Mine Stardust & Meteorite Ores
   - Buy Space Drones, Quantum Lasers & Dyson Swarms
   - Floating Gem Particles, Stardust Per Second (SPS)
   - Prestige System & Offline Progress
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CosmicIdleMinerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Cosmic Idle Miner',
      targetScore: 50000,
      ...config
    });

    this.stardust = 0;
    this.totalMined = 0;
    this.clickPower = 1;
    this.sps = 0; // Stardust per second
    this.asteroidHealth = 100;
    this.asteroidMaxHealth = 100;
    this.asteroidLevel = 1;
    this.particles = [];
    this.floatingTexts = [];
    this.asteroidAngle = 0;

    // Upgrades Catalog
    this.upgrades = [
      { id: 'drone', name: 'Mining Drone', cost: 15, sps: 1, owned: 0, icon: '🛸' },
      { id: 'laser', name: 'Plasma Cutter', cost: 100, sps: 8, owned: 0, icon: '⚡' },
      { id: 'rig', name: 'Orbital Rig', cost: 1100, sps: 48, owned: 0, icon: '🛰️' },
      { id: 'harvester', name: 'Antimatter Siphon', cost: 12000, sps: 260, owned: 0, icon: '🌌' },
      { id: 'dyson', name: 'Dyson Harvester', cost: 130000, sps: 1400, owned: 0, icon: '☀️' }
    ];

    this.createCanvas(800, 560);
    this.loadSavedProgress();
    this.initInteractiveListeners();

    // Secondary SPS accumulator timer
    this.addInterval(() => {
      if (this.state === GameState.PLAYING) {
        this.earnSps();
      }
    }, 1000);

    this.showStartCard({
      title: 'COSMIC IDLE MINER',
      icon: '🌌',
      objective: 'Mine rare galactic stardust! Upgrade autonomous space rigs and unlock planetary prestige.',
      controls: 'Click / Tap the asteroid to mine. Click upgrades on the right dock to boost automation.',
      onStart: () => this.start()
    });
  }

  loadSavedProgress() {
    try {
      const saved = localStorage.getItem('gz_cosmic_miner_save');
      if (saved) {
        const data = JSON.parse(saved);
        this.stardust = data.stardust || 0;
        this.totalMined = data.totalMined || 0;
        this.clickPower = data.clickPower || 1;
        if (Array.isArray(data.upgrades)) {
          data.upgrades.forEach((u, i) => {
            if (this.upgrades[i]) {
              this.upgrades[i].owned = u.owned || 0;
              this.upgrades[i].cost = u.cost || this.upgrades[i].cost;
            }
          });
        }
        this.recalculateSps();
      }
    } catch (e) {}
  }

  saveProgress() {
    try {
      const data = {
        stardust: this.stardust,
        totalMined: this.totalMined,
        clickPower: this.clickPower,
        upgrades: this.upgrades.map(u => ({ id: u.id, owned: u.owned, cost: u.cost }))
      };
      localStorage.setItem('gz_cosmic_miner_save', JSON.stringify(data));
    } catch (e) {}
  }

  recalculateSps() {
    this.sps = this.upgrades.reduce((sum, u) => sum + (u.sps * u.owned), 0);
  }

  initInteractiveListeners() {
    const handleHit = (clientX, clientY) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clickX = (clientX - rect.left) * scaleX;
      const clickY = (clientY - rect.top) * scaleY;

      // Check click on upgrades area (right side x: 500 to 780)
      if (clickX >= 500 && clickX <= 780) {
        this.handleUpgradeClick(clickX, clickY);
        return;
      }

      // Check click on asteroid area (center around x: 250, y: 280, radius 120)
      const dist = Math.hypot(clickX - 250, clickY - 280);
      if (dist <= 130) {
        this.mineAsteroid(clickX, clickY);
      }
    };

    this.addEventListenerTracked(this.canvas, 'mousedown', (e) => handleHit(e.clientX, e.clientY));
    this.addEventListenerTracked(this.canvas, 'touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        e.preventDefault();
        handleHit(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
  }

  mineAsteroid(x, y) {
    sounds.playHit();
    const yieldAmount = this.clickPower;
    this.stardust += yieldAmount;
    this.totalMined += yieldAmount;
    this.score = Math.floor(this.totalMined);

    this.asteroidHealth -= yieldAmount;
    if (this.asteroidHealth <= 0) {
      sounds.playScore();
      this.asteroidLevel++;
      this.stardust += this.asteroidLevel * 10;
      this.asteroidMaxHealth = Math.floor(100 * Math.pow(1.35, this.asteroidLevel - 1));
      this.asteroidHealth = this.asteroidMaxHealth;
      this.addFloatingText(250, 180, `METEOR CRACKED! +${this.asteroidLevel * 10}`, '#ffd166');
    }

    // Spawn sparks
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 1,
        color: Math.random() > 0.5 ? '#00e5ff' : '#ffd166',
        size: Math.random() * 4 + 2
      });
    }

    this.addFloatingText(x, y - 10, `+${yieldAmount}`, '#00e5ff');
  }

  handleUpgradeClick(x, y) {
    const startY = 120;
    const itemHeight = 72;
    this.upgrades.forEach((u, idx) => {
      const top = startY + idx * (itemHeight + 10);
      if (y >= top && y <= top + itemHeight) {
        if (this.stardust >= u.cost) {
          sounds.playClick();
          this.stardust -= u.cost;
          u.owned++;
          u.cost = Math.floor(u.cost * 1.15);
          this.recalculateSps();
          this.saveProgress();
          this.addFloatingText(x, y, `+${u.sps} SPS!`, '#10b981');
        } else {
          this.addFloatingText(x, y, 'Need More Stardust!', '#ef4444');
        }
      }
    });
  }

  earnSps() {
    if (this.sps > 0) {
      this.stardust += this.sps;
      this.totalMined += this.sps;
      this.score = Math.floor(this.totalMined);
      this.saveProgress();
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x, y, text, color,
      life: 1,
      vy: -1.2
    });
  }

  update(dt) {
    this.asteroidAngle += 0.005;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.life -= 0.025;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Cosmic Nebula Background
    const bgGrad = ctx.createRadialGradient(250, 280, 50, 400, 280, 500);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#070b14');
    bgGrad.addColorStop(1, '#020408');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Decorative Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % this.baseWidth;
      const sy = (i * 61) % this.baseHeight;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Left Panel: Mining Asteroid
    ctx.save();
    ctx.translate(250, 280);
    ctx.rotate(this.asteroidAngle);

    // Ambient glow
    const glow = ctx.createRadialGradient(0, 0, 70, 0, 0, 130);
    glow.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.fill();

    // Asteroid core
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const pts = 12;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = 95 + ((i % 2 === 0) ? 12 : -8);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crystal veins inside asteroid
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(-20, -10, 14, 0, Math.PI * 2);
    ctx.arc(30, 25, 10, 0, Math.PI * 2);
    ctx.arc(-15, 35, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Left Panel HUD: Stardust Count & Level
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Outfit", sans-serif';
    ctx.fillText(`${Math.floor(this.stardust).toLocaleString()} ✨ Stardust`, 40, 50);

    ctx.fillStyle = '#00e5ff';
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillText(`+${this.sps.toLocaleString()} per second • Level ${this.asteroidLevel} Asteroid`, 40, 78);

    // Asteroid Health Bar
    const hpPct = Math.max(0, Math.min(1, this.asteroidHealth / this.asteroidMaxHealth));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(40, 480, 420, 10);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(40, 480, 420 * hpPct, 10);

    // Right Dock: Upgrades Shop
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(490, 20, 290, 520, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 17px "Outfit", sans-serif';
    ctx.fillText('⚡ Mining Technologies', 510, 55);

    const startY = 80;
    const itemHeight = 72;
    this.upgrades.forEach((u, idx) => {
      const top = startY + idx * (itemHeight + 10);
      const canAfford = this.stardust >= u.cost;

      ctx.fillStyle = canAfford ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = canAfford ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(505, top, 260, itemHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Icon & Name
      ctx.font = '22px sans-serif';
      ctx.fillText(u.icon, 520, top + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 14px "Outfit", sans-serif';
      ctx.fillText(u.name, 560, top + 28);

      // Cost & Owned
      ctx.fillStyle = canAfford ? '#ffd166' : '#94a3b8';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText(`Cost: ${u.cost.toLocaleString()} ✨`, 560, top + 48);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '700 13px "Inter", sans-serif';
      ctx.fillText(`x${u.owned}`, 725, top + 42);
    });

    // Render Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Render Floating Text
    this.floatingTexts.forEach(t => {
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.life;
      ctx.font = '700 14px "Outfit", sans-serif';
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
  }
}

