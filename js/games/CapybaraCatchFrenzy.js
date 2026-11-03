import { GameEngineBase } from '../core/GameEngineBase.js';

export class CapybaraCatchFrenzy extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Capybara Catch Frenzy';
    this.score = 0;
    this.combo = 0;
    this.timeLeft = 60;
    this.gameOver = false;
    this.capybaras = [];
    this.floatingScores = [];
    this.spawnTimer = 0;

    // 8 hot spring hole locations
    this.holes = [
      { x: 180, y: 180 }, { x: 380, y: 160 }, { x: 620, y: 170 }, { x: 820, y: 190 },
      { x: 220, y: 350 }, { x: 440, y: 380 }, { x: 680, y: 360 }, { x: 860, y: 340 }
    ];
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));

    this.showStartCard(
      'CAPYBARA CATCH FRENZY',
      'Wholesome river hot-spring frenzy! Click friendly capybaras popping up to score points. Spot the rare Orange-Head and Golden Capybaras for huge combos! Avoid the biting Piranhas!',
      'START CATCHING'
    );
  }

  handleClick(e) {
    if (this.gameOver) {
      this.score = 0;
      this.combo = 0;
      this.timeLeft = 60;
      this.gameOver = false;
      this.capybaras = [];
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Check hit capybaras
    for (let i = this.capybaras.length - 1; i >= 0; i--) {
      const c = this.capybaras[i];
      if (Math.hypot(mx - c.x, my - (c.y - c.height * 0.4)) < 45) {
        // Hit!
        if (c.type === 'piranha') {
          this.score = Math.max(0, this.score - 150);
          this.combo = 0;
          this.floatingScores.push({ text: '-150 🦈', x: c.x, y: c.y - 30, color: '#ef4444', life: 0.8 });
        } else {
          let pts = c.type === 'golden' ? 500 : (c.type === 'orange' ? 250 : 100);
          pts *= (1 + Math.floor(this.combo / 5) * 0.5);
          this.score += Math.round(pts);
          this.combo++;
          this.floatingScores.push({ text: `+${Math.round(pts)}`, x: c.x, y: c.y - 30, color: c.type === 'golden' ? '#fbbf24' : '#10b981', life: 0.8 });
        }
        this.capybaras.splice(i, 1);
        break;
      }
    }
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.gameOver = true;
      return;
    }

    // Spawn capybaras
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.6 + Math.random() * 0.5;

      // Pick an empty hole
      const usedHoles = new Set(this.capybaras.map(c => c.holeIdx));
      const avail = [0, 1, 2, 3, 4, 5, 6, 7].filter(idx => !usedHoles.has(idx));

      if (avail.length > 0) {
        const hIdx = avail[Math.floor(Math.random() * avail.length)];
        const hole = this.holes[hIdx];
        const r = Math.random();
        const type = r < 0.15 ? 'piranha' : (r < 0.35 ? 'golden' : (r < 0.65 ? 'orange' : 'normal'));
        this.capybaras.push({
          holeIdx: hIdx,
          x: hole.x,
          y: hole.y,
          type,
          height: 60,
          life: 1.4 + Math.random() * 0.8
        });
      }
    }

    // Update active capybaras
    for (let i = this.capybaras.length - 1; i >= 0; i--) {
      const c = this.capybaras[i];
      c.life -= dt;
      if (c.life <= 0) {
        this.capybaras.splice(i, 1);
      }
    }

    // Update floating scores
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const fs = this.floatingScores[i];
      fs.y -= 30 * dt;
      fs.life -= dt;
      if (fs.life <= 0) this.floatingScores.splice(i, 1);
    }
  }

  onRender(ctx) {
    // Lush Hot Springs Background
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1000, 562);

    // River Water
    const riverGrad = ctx.createLinearGradient(0, 120, 1000, 480);
    riverGrad.addColorStop(0, '#0284c7');
    riverGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(50, 100, 900, 370);

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 68);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🐾 CAPYBARA CATCH FRENZY', 30, 44);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}`, 820, 44);

    ctx.fillStyle = this.timeLeft < 10 ? '#ef4444' : '#10b981';
    ctx.fillText(`TIME: ${Math.ceil(this.timeLeft)}s`, 960, 44);

    // Draw Spring Holes
    for (const h of this.holes) {
      // Hot spring tub
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, 48, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Water surface inside
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, 40, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Capybaras
    for (const c of this.capybaras) {
      ctx.save();
      ctx.translate(c.x, c.y);

      if (c.type === 'piranha') {
        // Piranha warning
        ctx.fillStyle = '#ef4444';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦈', 0, -10);
      } else {
        // Capybara body
        ctx.fillStyle = c.type === 'golden' ? '#f59e0b' : '#78350f';
        ctx.beginPath();
        ctx.ellipse(0, -22, 28, 24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = c.type === 'golden' ? '#fbbf24' : '#92400e';
        ctx.beginPath();
        ctx.roundRect(-16, -20, 32, 18, 6);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-10, -26, 4, 3);
        ctx.fillRect(6, -26, 4, 3);

        // Orange accessory
        if (c.type === 'orange') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, -42, 9, 0, Math.PI * 2);
          ctx.fill();
          // Leaf
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(0, -54, 4, 5);
        } else if (c.type === 'golden') {
          // Crown
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👑', 0, -42);
        }
      }
      ctx.restore();
    }

    // Floating scores
    for (const fs of this.floatingScores) {
      ctx.fillStyle = fs.color;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fs.text, fs.x, fs.y);
    }

    // Bottom Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 490, 1000, 72);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`COMBO: ${this.combo}x | Tap quickly before they submerge back into hot springs!`, 500, 532);

    // Game Over Overlay
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 42px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TIME IS UP!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`FINAL SCORE: ${this.score}`, 500, 290);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PLAY AGAIN', 500, 362);
    }
  }
}
