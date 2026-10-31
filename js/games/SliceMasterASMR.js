/* ====================================================
   SLICE MASTER ASMR — GAMINGZONE
   One-Tap Precision Knife Flipping & ASMR Slicing Action
   - One-Tap / Click to Flip the Chef Knife Forward
   - Slice Watermelons, Pineapples, Soap Bars, Coins & Jelly
   - Avoid Metal Spikes & Heavy Anvils
   - Multiplier Finish Line Tower (x2, x5, x10, x50, x100)
   - Satisfying Physics Slices, Halves Separation & Juice Splatters
   - Multi-Level Progression with Coin Multipliers
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class SliceMasterASMRGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Slice Master ASMR',
      targetScore: 10000,
      lives: 3,
      ...config
    });

    this.createCanvas(840, 520);

    this.currentLevel = 1;
    this.coins = 0;
    this.combo = 0;
    this.cameraX = 0;

    // Knife Entity
    this.knife = {
      x: 120,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      isFlipping: false,
      bladeLength: 48,
      stuck: false
    };

    this.items = [];
    this.slicedPieces = [];
    this.particles = [];
    this.finishTargets = [];

    this.initControls();
    this.loadLevel(this.currentLevel);

    this.attachTouchControls({
      showDpad: false,
      onAction: () => this.flipKnife()
    });

    this.showStartCard({
      title: 'SLICE MASTER ASMR',
      icon: '🔪',
      objective: 'Tap to flip your knife! Slice fruits, soap, and jelly for massive combos. Hit the multiplier tower at the finish line.',
      controls: 'Click / Spacebar / Tap Screen to Flip Knife.',
      onStart: () => {
        this.currentLevel = 1;
        this.score = 0;
        this.loadLevel(1);
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.flipKnife();
      }
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', (e) => {
        e.preventDefault();
        this.flipKnife();
      });

      this.addEventListenerTracked(this.canvas, 'touchstart', (e) => {
        e.preventDefault();
        this.flipKnife();
      });
    }
  }

  loadLevel(lvl) {
    this.currentLevel = lvl;
    this.cameraX = 0;
    this.combo = 0;

    this.knife = {
      x: 120,
      y: 320,
      vx: 4.8,
      vy: 0,
      angle: 0,
      vAngle: 0,
      isFlipping: false,
      bladeLength: 50,
      stuck: false
    };

    this.items = [];
    this.slicedPieces = [];
    this.particles = [];
    this.finishTargets = [];

    const levelLength = 2800 + lvl * 600;
    const types = [
      { name: 'Watermelon', color: '#10b981', innerColor: '#ef4444', radius: 26, points: 50, icon: '🍉' },
      { name: 'Pineapple', color: '#f59e0b', innerColor: '#fde047', radius: 24, points: 60, icon: '🍍' },
      { name: 'Rainbow Soap', color: '#a855f7', innerColor: '#38bdf8', radius: 22, points: 80, icon: '🧼' },
      { name: 'Coin Stack', color: '#eab308', innerColor: '#fef08a', radius: 20, points: 100, icon: '🪙' },
      { name: 'Strawberry Jelly', color: '#ec4899', innerColor: '#f43f5e', radius: 25, points: 70, icon: '🍓' },
      { name: 'Spike Hazard', color: '#64748b', innerColor: '#475569', radius: 22, hazard: true, points: 0, icon: '⚙️' }
    ];

    // Procedural track generation
    let currentX = 350;
    while (currentX < levelLength) {
      const isHazard = Math.random() < 0.22 && currentX > 600;
      const type = isHazard ? types[5] : types[Math.floor(Math.random() * (types.length - 1))];
      const groundY = 380 - Math.sin(currentX * 0.005) * 40;

      this.items.push({
        x: currentX,
        y: groundY - type.radius,
        radius: type.radius,
        type: type,
        sliced: false
      });

      currentX += Math.random() * 120 + 90;
    }

    // Finish Line Multiplier Tower
    const finishX = levelLength + 150;
    const multipliers = [2, 5, 10, 25, 50, 100];
    for (let i = 0; i < multipliers.length; i++) {
      this.finishTargets.push({
        x: finishX,
        y: 380 - (i * 44) - 20,
        width: 140,
        height: 38,
        multiplier: multipliers[i],
        hit: false
      });
    }

    // Flip knife to start run
    this.flipKnife();
  }

  flipKnife() {
    if (this.state !== GameState.PLAYING) return;

    sounds.playJump();
    this.knife.stuck = false;
    this.knife.isFlipping = true;
    this.knife.vy = -8.6;
    this.knife.vx = 5.2;
    this.knife.vAngle = 0.26; // Smooth forward spin
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    const k = this.knife;

    if (!k.stuck) {
      // Gravity & Motion
      k.vy += 0.42;
      k.x += k.vx;
      k.y += k.vy;
      k.angle += k.vAngle;

      // Camera smoothly follows knife
      this.cameraX = k.x - 220;

      // Table Ground Collision
      const groundY = 400;
      if (k.y + 20 >= groundY) {
        // Knife tip angle check
        const normalizedAngle = ((k.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const isTipDown = (normalizedAngle > 0.8 && normalizedAngle < 2.4);

        if (isTipDown) {
          // Blade sticks cleanly into cutting board!
          k.stuck = true;
          k.isFlipping = false;
          k.y = groundY - 18;
          k.vx = 0;
          k.vy = 0;
          k.vAngle = 0;
          sounds.playHit();

          // Table dust
          for (let i = 0; i < 6; i++) {
            this.particles.push({
              x: k.x,
              y: groundY,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3,
              radius: 2,
              color: '#d97706',
              life: 18
            });
          }
        } else {
          // Bounces awkwardly
          k.vy = -k.vy * 0.4;
          k.vx *= 0.8;
          sounds.playClick();
        }
      }

      // Slicing Check on Items
      const tipX = k.x + Math.cos(k.angle) * k.bladeLength;
      const tipY = k.y + Math.sin(k.angle) * k.bladeLength;

      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        if (item.sliced) continue;

        const dist = Math.hypot(tipX - item.x, tipY - item.y);
        if (dist < item.radius + 15) {
          if (item.type.hazard) {
            // Hit Spike Hazard -> Knife Shatters / Round Over
            sounds.playExplosion();
            this.triggerFail();
            return;
          }

          // Successful Slice!
          item.sliced = true;
          this.combo++;
          const sliceScore = item.type.points * Math.min(this.combo, 5);
          this.score += sliceScore;
          this.coins += 5;
          sounds.playLaser();

          // Spawn Two Halves with Splitting Physics
          this.slicedPieces.push({
            x: item.x - 6,
            y: item.y,
            vx: -3,
            vy: -4,
            angle: -0.2,
            vAngle: -0.1,
            color: item.type.innerColor,
            radius: item.radius * 0.75,
            icon: item.type.icon
          });

          this.slicedPieces.push({
            x: item.x + 6,
            y: item.y,
            vx: 3,
            vy: -4,
            angle: 0.2,
            vAngle: 0.1,
            color: item.type.innerColor,
            radius: item.radius * 0.75,
            icon: item.type.icon
          });

          // Juicy Particle Splatter
          for (let p = 0; p < 15; p++) {
            this.particles.push({
              x: item.x,
              y: item.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              radius: Math.random() * 4 + 2,
              color: item.type.innerColor,
              life: 25
            });
          }
        }
      }

      // Finish Line Multiplier Tower Hit Check
      for (const t of this.finishTargets) {
        if (!t.hit && tipX >= t.x && tipX <= t.x + t.width && tipY >= t.y && tipY <= t.y + t.height) {
          t.hit = true;
          k.stuck = true;
          k.vx = 0;
          k.vy = 0;
          k.vAngle = 0;
          const bonus = this.score * t.multiplier;
          this.score += bonus;
          sounds.playWin();

          setTimeout(() => {
            if (this.currentLevel >= 10) {
              this.gameOver(this.score, { cleared: true, level: this.currentLevel });
            } else {
              this.loadLevel(this.currentLevel + 1);
            }
          }, 1200);
          return;
        }
      }

      // Out of bounds drop check
      if (k.y > 600) {
        this.triggerFail();
      }
    }

    // Update Sliced Pieces
    for (let i = this.slicedPieces.length - 1; i >= 0; i--) {
      const p = this.slicedPieces[i];
      p.vy += 0.45;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.vAngle;
      if (p.y > 550) this.slicedPieces.splice(i, 1);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  triggerFail() {
    this.lives--;
    sounds.playExplosion();
    if (this.lives <= 0) {
      this.gameOver(this.score, { level: this.currentLevel });
    } else {
      this.loadLevel(this.currentLevel);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sleek Gradient Studio Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#1e1b4b');
    bgGrad.addColorStop(0.6, '#312e81');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 2. Continuous Bamboo/Wood Cutting Board
    const groundY = 400;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(this.cameraX - 100, groundY, this.width + 300, this.height - groundY);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(this.cameraX - 100, groundY, this.width + 300, 8);

    // 3. Render Targets & Sliceables
    this.items.forEach((item) => {
      if (item.sliced) return;
      ctx.save();
      ctx.translate(item.x, item.y);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, item.radius + 6, item.radius, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = item.type.color;
      ctx.beginPath();
      ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
      ctx.fill();

      // Icon / Inner Texture
      ctx.fillStyle = '#fff';
      ctx.font = `${item.radius * 1.1}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.type.icon, 0, 0);

      ctx.restore();
    });

    // 4. Render Sliced Halves
    this.slicedPieces.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI);
      ctx.fill();
      ctx.restore();
    });

    // 5. Render Finish Multiplier Tower
    this.finishTargets.forEach((t) => {
      ctx.fillStyle = t.hit ? '#10b981' : '#f59e0b';
      ctx.fillRect(t.x, t.y, t.width, t.height);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x, t.y, t.width, t.height);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`x${t.multiplier}`, t.x + t.width / 2, t.y + 25);
    });

    // 6. Render Knife
    const k = this.knife;
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.angle);

    // Knife Handle
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-22, -6, 22, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -8, 4, 16); // Bolster

    // Knife Shiny Steel Blade
    const bladeGrad = ctx.createLinearGradient(0, -6, 0, 6);
    bladeGrad.addColorStop(0, '#f8fafc');
    bladeGrad.addColorStop(0.5, '#cbd5e1');
    bladeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(k.bladeLength - 10, -6);
    ctx.quadraticCurveTo(k.bladeLength, 0, k.bladeLength, 4);
    ctx.lineTo(2, 6);
    ctx.closePath();
    ctx.fill();

    // Sharp Cutting Edge Gleam
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2, 6);
    ctx.lineTo(k.bladeLength, 4);
    ctx.stroke();

    ctx.restore();

    // 7. Render Particles
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 8. HUD & Combo Meter
    this.renderHUD(ctx);
  }

  renderHUD(ctx) {
    // Score & Level Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(20, 20, 260, 60);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 60);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, 34, 48);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText(`LEVEL ${this.currentLevel} • ❤️ ${this.lives} LIVES`, 34, 68);

    // Combo Streak Indicator
    if (this.combo > 1) {
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 24px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${this.combo}x COMBO! 🔥`, this.width - 30, 50);
    }
  }
}

