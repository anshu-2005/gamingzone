import { GameEngineBase } from '../core/GameEngineBase.js';

export class FeedTheFlames extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Feed The Flames: Idle Bonfire';
    this.embers = 0;
    this.embersPerSec = 0;
    this.flameSize = 1.0;
    this.sparks = [];

    this.upgrades = [
      { id: 'twigs', name: 'Dry Twigs', cost: 15, eps: 1, count: 0 },
      { id: 'logs', name: 'Oak Logs', cost: 100, eps: 8, count: 0 },
      { id: 'coal', name: 'Charcoal Chunks', cost: 600, eps: 45, count: 0 },
      { id: 'resin', name: 'Pine Resin', cost: 3500, eps: 240, count: 0 },
      { id: 'phoenix', name: 'Phoenix Essence', cost: 20000, eps: 1400, count: 0 }
    ];
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));

    this.showStartCard(
      'FEED THE FLAMES',
      'The hypnotic bonfire idle clicker! Click the roaring bonfire to kindle embers. Buy logs, charcoal, pine resin, and phoenix essence to automate your flame and keep the dark forest illuminated!',
      'KINDLE BONFIRE'
    );
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Click fire center in [200..450, 200..450]
    if (Math.hypot(mx - 320, my - 340) < 130) {
      this.embers += 1 + Math.floor(this.embersPerSec * 0.1);
      this.spawnSparks(320, 320, 10);
      return;
    }

    // Check upgrade buttons on right panel [650..950]
    const startY = 100;
    for (let i = 0; i < this.upgrades.length; i++) {
      const up = this.upgrades[i];
      const y = startY + i * 80;
      if (mx >= 640 && mx <= 960 && my >= y && my <= y + 68) {
        if (this.embers >= up.cost) {
          this.embers -= up.cost;
          up.count++;
          up.cost = Math.round(up.cost * 1.25);
          this.recalculateEPS();
        }
        break;
      }
    }
  }

  recalculateEPS() {
    this.embersPerSec = this.upgrades.reduce((sum, u) => sum + u.eps * u.count, 0);
  }

  spawnSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.sparks.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 60,
        vy: -80 - Math.random() * 120,
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#f59e0b' : '#ef4444',
        life: 0.8 + Math.random() * 0.6
      });
    }
  }

  onUpdate(dt) {
    this.embers += this.embersPerSec * dt;

    // Ambient fire sparks
    if (Math.random() < 0.4) {
      this.spawnSparks(320, 350, 2);
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }
  }

  onRender(ctx) {
    // Night Forest Background
    const bg = ctx.createLinearGradient(0, 0, 0, 562);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(0.6, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1000, 562);

    // Warm radial firelight glow
    const fireX = 320;
    const fireY = 340;
    const glow = ctx.createRadialGradient(fireX, fireY, 20, fireX, fireY, 320);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
    glow.addColorStop(0.5, 'rgba(239, 68, 68, 0.15)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 600, 562);

    // Logs at base
    ctx.fillStyle = '#451a03';
    ctx.save();
    ctx.translate(fireX, fireY + 70);
    ctx.rotate(0.3); ctx.fillRect(-70, -12, 140, 24);
    ctx.rotate(-0.6); ctx.fillRect(-70, -12, 140, 24);
    ctx.restore();

    // Roaring Animated Flame
    const time = performance.now() * 0.005;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(fireX - 60, fireY + 60);
    ctx.quadraticCurveTo(fireX - 80, fireY - 40 + Math.sin(time) * 15, fireX, fireY - 140 + Math.cos(time) * 20);
    ctx.quadraticCurveTo(fireX + 80, fireY - 40 + Math.cos(time) * 15, fireX + 60, fireY + 60);
    ctx.closePath();
    ctx.fill();

    // Inner bright yellow flame
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(fireX - 35, fireY + 50);
    ctx.quadraticCurveTo(fireX - 45, fireY - 20, fireX, fireY - 90 + Math.sin(time * 1.5) * 12);
    ctx.quadraticCurveTo(fireX + 45, fireY - 20, fireX + 35, fireY + 50);
    ctx.closePath();
    ctx.fill();

    // Sparks
    for (const s of this.sparks) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔥 FEED THE FLAMES', 30, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`EMBERS: ${Math.floor(this.embers)}  |  +${Math.floor(this.embersPerSec)}/s`, 970, 38);

    // Right Shop Upgrades Panel
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(630, 80, 340, 460);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(630, 80, 340, 460);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('FUEL UPGRADES', 650, 110);

    const startY = 130;
    for (let i = 0; i < this.upgrades.length; i++) {
      const up = this.upgrades[i];
      const y = startY + i * 78;
      const canAfford = this.embers >= up.cost;

      ctx.fillStyle = canAfford ? '#1e293b' : '#090d16';
      ctx.beginPath();
      ctx.roundRect(645, y, 310, 68, 6);
      ctx.fill();
      ctx.strokeStyle = canAfford ? '#f59e0b' : '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = canAfford ? '#fbbf24' : '#64748b';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${up.name} (${up.count})`, 660, y + 26);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`+${up.eps}/s  •  Cost: ${up.cost} embers`, 660, y + 48);
    }
  }
}

