/* ====================================================
   FRUIT NINJA SLICER — GAMINGZONE
   Authentic Dojo Fruit Slicing Action:
   Parabolic Fruit Launches, Samurai Blade Trails,
   Split Halves Physics, Juice Splatters, Bomb Hazards & Combos
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class FruitNinjaSlicerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Fruit Ninja Slicer',
      targetScore: 350,
      lives: 3,
      ...config
    });

    this.fruits = [];
    this.slicedHalves = [];
    this.splatters = [];
    this.particles = [];
    this.bladeTrail = [];
    this.isSwiping = false;

    this.spawnTimer = 1.0;
    this.swipeSliceCount = 0;
    this.comboAnnounce = null;

    this.createCanvas(740, 540);
    this.initControls();

    this.showStartCard({
      title: 'FRUIT NINJA SLICER',
      icon: '🍉',
      objective: 'Swipe your katana blade across flying fruits to slice them in half! Avoid the bombs, and slice multiple fruits in one swipe for Combos!',
      controls: 'Click & drag mouse or swipe across touchscreen.',
      onStart: () => this.start()
    });
  }

  initControls() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const onStart = (e) => {
      if (this.state !== GameState.PLAYING) return;
      this.isSwiping = true;
      this.swipeSliceCount = 0;
      const p = getPos(e);
      this.bladeTrail = [p];
    };

    const onMove = (e) => {
      if (!this.isSwiping || this.state !== GameState.PLAYING) return;
      const p = getPos(e);
      this.bladeTrail.push(p);
      if (this.bladeTrail.length > 8) this.bladeTrail.shift();

      // Check collision between blade line and flying fruits
      if (this.bladeTrail.length >= 2) {
        const p1 = this.bladeTrail[this.bladeTrail.length - 2];
        const p2 = this.bladeTrail[this.bladeTrail.length - 1];

        for (const f of this.fruits) {
          if (!f.sliced) {
            // Distance from point f to line segment p1 -> p2
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const l2 = dx * dx + dy * dy;
            let t = 0;
            if (l2 > 0) t = Math.max(0, Math.min(1, ((f.x - p1.x) * dx + (f.y - p1.y) * dy) / l2));
            const projX = p1.x + t * dx;
            const projY = p1.y + t * dy;
            const dist = Math.hypot(f.x - projX, f.y - projY);

            if (dist < f.radius + 12) {
              this.sliceFruit(f);
            }
          }
        }
      }
    };

    const onEnd = () => {
      if (this.swipeSliceCount >= 3) {
        // Multi-slice combo!
        const bonus = this.swipeSliceCount * 5;
        this.score += bonus;
        sounds.playWin();
        this.comboAnnounce = {
          text: `${this.swipeSliceCount}x COMBO BLADE! +${bonus}`,
          x: this.baseWidth / 2,
          y: 200,
          alpha: 1
        };
      }
      this.isSwiping = false;
      this.bladeTrail = [];
      this.swipeSliceCount = 0;
    };

    this.addListener(this.canvas, 'mousedown', onStart);
    this.addListener(window, 'mousemove', onMove);
    this.addListener(window, 'mouseup', onEnd);

    this.addListener(this.canvas, 'touchstart', (e) => {
      e.preventDefault();
      onStart(e);
    }, { passive: false });
    this.addListener(window, 'touchmove', onMove, { passive: true });
    this.addListener(window, 'touchend', onEnd);
  }

  sliceFruit(f) {
    f.sliced = true;
    this.swipeSliceCount++;

    if (f.type === 'bomb') {
      sounds.playHit();
      this.lives--;

      // Screen shake / explosion particles
      for (let i = 0; i < 30; i++) {
        this.particles.push({
          x: f.x,
          y: f.y,
          vx: (Math.random() - 0.5) * 300,
          vy: (Math.random() - 0.5) * 300,
          color: '#ef4444',
          radius: 5,
          alpha: 1,
          life: 0.7
        });
      }

      if (this.lives <= 0) {
        this.state = GameState.GAME_OVER;
        this.setTimeout(() => this.gameOver(this.score), 700);
      }
      return;
    }

    // Normal fruit sliced
    this.score += 10;
    sounds.playLaser();

    // Wood splatter
    this.splatters.push({
      x: f.x,
      y: f.y,
      radius: f.radius * 1.2,
      color: f.splatterColor,
      alpha: 0.65
    });

    // Spawn 2 split halves flying apart
    this.slicedHalves.push({
      x: f.x - 10,
      y: f.y,
      vx: f.vx - 3,
      vy: f.vy * 0.5 - 2,
      rot: f.rot,
      vRot: -0.15,
      type: f.type,
      color: f.color,
      radius: f.radius,
      side: 'left'
    });
    this.slicedHalves.push({
      x: f.x + 10,
      y: f.y,
      vx: f.vx + 3,
      vy: f.vy * 0.5 - 2,
      rot: f.rot,
      vRot: 0.15,
      type: f.type,
      color: f.color,
      radius: f.radius,
      side: 'right'
    });

    // Juice droplets
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: f.x,
        y: f.y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        color: f.splatterColor,
        radius: 3.5,
        alpha: 1,
        life: 0.45
      });
    }
  }

  spawnFruitWave() {
    const waveCount = 1 + Math.floor(Math.random() * 3);
    const fruitTypes = [
      { type: 'watermelon', color: '#16a34a', splatterColor: '#ef4444', radius: 26, name: '🍉' },
      { type: 'apple', color: '#dc2626', splatterColor: '#fef08a', radius: 22, name: '🍎' },
      { type: 'orange', color: '#ea580c', splatterColor: '#f97316', radius: 20, name: '🍊' },
      { type: 'banana', color: '#eab308', splatterColor: '#fef9c3', radius: 24, name: '🍌' }
    ];

    for (let i = 0; i < waveCount; i++) {
      // 18% chance of bomb
      const isBomb = Math.random() < 0.18;
      const startX = 140 + Math.random() * (this.baseWidth - 280);
      const vx = (Math.random() - 0.5) * 4;
      const vy = -12.5 - Math.random() * 3;

      if (isBomb) {
        this.fruits.push({
          type: 'bomb',
          x: startX,
          y: this.baseHeight + 30,
          vx,
          vy,
          radius: 22,
          rot: 0,
          vRot: 0.05,
          sliced: false
        });
      } else {
        const ft = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        this.fruits.push({
          type: ft.type,
          x: startX,
          y: this.baseHeight + 30,
          vx,
          vy,
          radius: ft.radius,
          color: ft.color,
          splatterColor: ft.splatterColor,
          emoji: ft.name,
          rot: 0,
          vRot: (Math.random() - 0.5) * 0.1,
          sliced: false
        });
      }
    }
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Fruit spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnFruitWave();
      this.spawnTimer = 1.6 + Math.random() * 1.2;
    }

    // Move Flying Fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.x += f.vx * 60 * dt;
      f.y += f.vy * 60 * dt;
      f.vy += 0.32; // Gravity
      f.rot += f.vRot;

      // Missed fruit (fell past bottom unsliced)
      if (f.y > this.baseHeight + 60) {
        if (!f.sliced && f.type !== 'bomb') {
          // Strike (lose 1 life if unsliced fruit falls)
          this.lives--;
          sounds.playHit();

          if (this.lives <= 0) {
            this.state = GameState.GAME_OVER;
            this.setTimeout(() => this.gameOver(this.score), 700);
            return;
          }
        }
        this.fruits.splice(i, 1);
      } else if (f.sliced) {
        this.fruits.splice(i, 1);
      }
    }

    // Move Sliced Halves
    for (let i = this.slicedHalves.length - 1; i >= 0; i--) {
      const h = this.slicedHalves[i];
      h.x += h.vx * 60 * dt;
      h.y += h.vy * 60 * dt;
      h.vy += 0.38;
      h.rot += h.vRot;
      if (h.y > this.baseHeight + 60) {
        this.slicedHalves.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }

    // Fade Splatters
    for (let i = this.splatters.length - 1; i >= 0; i--) {
      const sp = this.splatters[i];
      sp.alpha -= dt * 0.05;
      if (sp.alpha <= 0) this.splatters.splice(i, 1);
    }

    // Combo Announcement
    if (this.comboAnnounce) {
      this.comboAnnounce.y -= 25 * dt;
      this.comboAnnounce.alpha -= dt * 0.8;
      if (this.comboAnnounce.alpha <= 0) this.comboAnnounce = null;
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Warm Dojo Wood Grain Background
    this.ctx.fillStyle = '#451a03';
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Dojo Wood Planks
    this.ctx.strokeStyle = '#78350f';
    this.ctx.lineWidth = 2;
    for (let y = 60; y < this.baseHeight; y += 60) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.baseWidth, y);
      this.ctx.stroke();
    }

    // Render Juice Splatters
    for (const sp of this.splatters) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, sp.alpha);
      this.ctx.fillStyle = sp.color;
      this.ctx.beginPath();
      this.ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Render Flying Fruits
    for (const f of this.fruits) {
      if (f.sliced) continue;
      this.ctx.save();
      this.ctx.translate(f.x, f.y);
      this.ctx.rotate(f.rot);

      if (f.type === 'bomb') {
        // Bomb Body
        this.ctx.fillStyle = '#1e293b';
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Bomb Fuse & Spark
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -f.radius);
        this.ctx.quadraticCurveTo(8, -f.radius - 10, 12, -f.radius - 12);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(12, -f.radius - 12, 4, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Fruit Emoji / Sprite
        this.ctx.font = `${f.radius * 2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(f.emoji, 0, 0);
      }
      this.ctx.restore();
    }

    // Render Sliced Halves
    for (const h of this.slicedHalves) {
      this.ctx.save();
      this.ctx.translate(h.x, h.y);
      this.ctx.rotate(h.rot);

      this.ctx.fillStyle = h.color;
      this.ctx.beginPath();
      if (h.side === 'left') {
        this.ctx.arc(0, 0, h.radius * 0.85, Math.PI / 2, -Math.PI / 2);
      } else {
        this.ctx.arc(0, 0, h.radius * 0.85, -Math.PI / 2, Math.PI / 2);
      }
      this.ctx.closePath();
      this.ctx.fill();

      // White flesh core
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      if (h.side === 'left') {
        this.ctx.arc(0, 0, h.radius * 0.45, Math.PI / 2, -Math.PI / 2);
      } else {
        this.ctx.arc(0, 0, h.radius * 0.45, -Math.PI / 2, Math.PI / 2);
      }
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    // Render Particles
    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Render Samurai Katana Blade Trail
    if (this.bladeTrail.length >= 2) {
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.shadowColor = '#00f2fe';
      this.ctx.shadowBlur = 14;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      for (let i = 1; i < this.bladeTrail.length; i++) {
        const p1 = this.bladeTrail[i - 1];
        const p2 = this.bladeTrail[i];
        this.ctx.lineWidth = (i / this.bladeTrail.length) * 8;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }
      this.ctx.shadowBlur = 0;
    }

    // Render Combo Announcement
    if (this.comboAnnounce) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, this.comboAnnounce.alpha);
      this.ctx.font = '900 32px "Lilita One", sans-serif';
      this.ctx.fillStyle = '#ffd166';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 4;
      this.ctx.textAlign = 'center';
      this.ctx.strokeText(this.comboAnnounce.text, this.comboAnnounce.x, this.comboAnnounce.y);
      this.ctx.fillText(this.comboAnnounce.text, this.comboAnnounce.x, this.comboAnnounce.y);
      this.ctx.restore();
    }

    // Top HUD
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(16, 12, this.baseWidth - 32, 42);

    this.ctx.font = 'bold 20px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 30, 40);

    this.ctx.fillStyle = '#ef4444';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`LIVES: ${'❌ '.repeat(Math.max(0, 3 - this.lives))}${'❤️ '.repeat(Math.max(0, this.lives))}`, this.baseWidth - 30, 40);
  }
}
