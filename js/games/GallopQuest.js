/* ====================================================
   GALLOPQUEST — CROSS-COUNTRY HORSE DERBY
   Inspired by design1online/GallopQuest
   Equestrian obstacle jumping, stamina management,
   hurdle jumps, golden horseshoes & speed gears.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class GallopQuestGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'GallopQuest: Horse Derby',
      targetScore: 3500,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.groundY = 400;
    this.horse = {
      x: 140,
      y: this.groundY - 50,
      vy: 0,
      isJumping: false,
      stamina: 100,
      maxStamina: 100,
      speedMode: 'CANTER', // TROT, CANTER, GALLOP
      speed: 280,
      animFrame: 0
    };

    this.obstacles = [];
    this.carrots = [];
    this.horseshoes = [];
    this.particles = [];
    this.bgClouds = [];
    this.scrollX = 0;

    this.initClouds();
    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        if (dir === 'UP') this.jump();
        if (dir === 'RIGHT') this.cycleSpeed(1);
        if (dir === 'LEFT') this.cycleSpeed(-1);
      },
      onAction: (pressed) => {
        if (pressed) this.jump();
      },
      actionLabel: '🐎 JUMP',
      showDpad: true
    });

    this.showStartCard({
      title: 'GALLOPQUEST: DERBY',
      icon: '🐎',
      objective: 'Clear wooden hurdles and water pits, balance your stamina, and collect golden horseshoes!',
      controls: 'SPACE / Up Arrow to Jump • Left/Right to Switch Pace (Trot / Canter / Gallop)'
    });
  }

  initClouds() {
    this.bgClouds = [];
    for (let i = 0; i < 6; i++) {
      this.bgClouds.push({
        x: Math.random() * this.baseWidth,
        y: 40 + Math.random() * 120,
        r: 30 + Math.random() * 20,
        speed: 15 + Math.random() * 25
      });
    }
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.jump();
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.cycleSpeed(1);
      } else if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this.cycleSpeed(-1);
      }
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      this.jump();
    });
  }

  cycleSpeed(dir) {
    const modes = ['TROT', 'CANTER', 'GALLOP'];
    const speeds = { TROT: 200, CANTER: 300, GALLOP: 420 };
    let idx = modes.indexOf(this.horse.speedMode);
    idx = Math.max(0, Math.min(modes.length - 1, idx + dir));
    this.horse.speedMode = modes[idx];
    this.horse.speed = speeds[this.horse.speedMode];
    sounds.playClick?.();
  }

  jump() {
    if (!this.horse.isJumping && this.horse.stamina >= 12) {
      this.horse.isJumping = true;
      this.horse.vy = -540;
      this.horse.stamina -= 12;
      sounds.playJump?.();

      // Dust kick particles
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: this.horse.x - 10,
          y: this.groundY,
          vx: -(40 + Math.random() * 60),
          vy: -(20 + Math.random() * 40),
          life: 0.35,
          maxLife: 0.35,
          color: '#d97706',
          r: 3.5
        });
      }
    }
  }

  spawnObstacle() {
    const types = ['HURDLE', 'WATER_PIT', 'STONE_WALL'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = 36;
    let height = 48;
    if (type === 'WATER_PIT') {
      width = 54;
      height = 14;
    }

    this.obstacles.push({
      x: this.baseWidth + 40,
      y: type === 'WATER_PIT' ? this.groundY : this.groundY - height,
      w: width,
      h: height,
      type
    });
  }

  spawnBonus() {
    const isHorseshoe = Math.random() < 0.5;
    if (isHorseshoe) {
      this.horseshoes.push({
        x: this.baseWidth + 40,
        y: this.groundY - 90 - Math.random() * 60,
        r: 10
      });
    } else {
      this.carrots.push({
        x: this.baseWidth + 40,
        y: this.groundY - 40,
        r: 8
      });
    }
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    this.scrollX += this.horse.speed * dt;
    this.score += Math.round(this.horse.speed * dt * 0.1);

    // Gravity & Jump Physics
    if (this.horse.isJumping) {
      this.horse.y += this.horse.vy * dt;
      this.horse.vy += 1200 * dt; // Gravity
      if (this.horse.y >= this.groundY - 50) {
        this.horse.y = this.groundY - 50;
        this.horse.isJumping = false;
        this.horse.vy = 0;
      }
    } else {
      // Regenerate or consume stamina depending on speed
      if (this.horse.speedMode === 'TROT') {
        this.horse.stamina = Math.min(this.horse.maxStamina, this.horse.stamina + 10 * dt);
      } else if (this.horse.speedMode === 'GALLOP') {
        this.horse.stamina = Math.max(0, this.horse.stamina - 12 * dt);
        if (this.horse.stamina <= 0) {
          this.cycleSpeed(-1); // Downshift to canter
        }
      }
    }

    // Animation leg gallop
    this.horse.animFrame += dt * (this.horse.speed / 50);

    // Obstacle spawner
    if (Math.random() < 0.02) this.spawnObstacle();
    if (Math.random() < 0.025) this.spawnBonus();

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.horse.speed * dt;

      // Collision check
      const hBox = { x: this.horse.x, y: this.horse.y, w: 50, h: 48 };
      if (
        hBox.x < obs.x + obs.w &&
        hBox.x + hBox.w > obs.x &&
        hBox.y < obs.y + obs.h &&
        hBox.y + hBox.h > obs.y
      ) {
        sounds.playCrash?.();
        this.finishGame(this.score, { reason: 'Tripped on Derby Obstacle' });
        return;
      }

      if (obs.x < -80) {
        this.obstacles.splice(i, 1);
      }
    }

    // Collect Horseshoes
    for (let i = this.horseshoes.length - 1; i >= 0; i--) {
      const hs = this.horseshoes[i];
      hs.x -= this.horse.speed * dt;

      if (Math.hypot(this.horse.x + 25 - hs.x, this.horse.y + 25 - hs.y) < 32) {
        this.score += 300;
        this.horseshoes.splice(i, 1);
        sounds.playScore?.();
        continue;
      }

      if (hs.x < -30) this.horseshoes.splice(i, 1);
    }

    // Collect Carrots (Stamina boost)
    for (let i = this.carrots.length - 1; i >= 0; i--) {
      const c = this.carrots[i];
      c.x -= this.horse.speed * dt;

      if (Math.hypot(this.horse.x + 25 - c.x, this.horse.y + 25 - c.y) < 32) {
        this.horse.stamina = Math.min(this.horse.maxStamina, this.horse.stamina + 35);
        this.carrots.splice(i, 1);
        sounds.playLevelUp?.();
        continue;
      }

      if (c.x < -30) this.carrots.splice(i, 1);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(1, '#7dd3fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, this.groundY);

    // Cheering Hills in background
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(180, this.groundY + 80, 220, 0, Math.PI * 2);
    ctx.arc(580, this.groundY + 120, 280, 0, Math.PI * 2);
    ctx.fill();

    // Turf Ground
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, this.groundY, w, h - this.groundY);
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, this.groundY + 24, w, h - (this.groundY + 24));

    // Obstacles
    for (const obs of this.obstacles) {
      if (obs.type === 'HURDLE') {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(obs.x, obs.y + 12, obs.w, 6);
      } else if (obs.type === 'WATER_PIT') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      }
    }

    // Horseshoes
    for (const hs of this.horseshoes) {
      ctx.save();
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(hs.x, hs.y, hs.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Carrots
    for (const c of this.carrots) {
      ctx.save();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.fillRect(c.x - 2, c.y - 12, 4, 8);
      ctx.restore();
    }

    // Horse
    ctx.save();
    ctx.fillStyle = '#78350f'; // Chestnut horse coat
    ctx.fillRect(this.horse.x, this.horse.y + 10, 48, 26); // Torso

    // Neck & Head
    ctx.beginPath();
    ctx.moveTo(this.horse.x + 40, this.horse.y + 16);
    ctx.lineTo(this.horse.x + 58, this.horse.y - 4);
    ctx.lineTo(this.horse.x + 64, this.horse.y + 8);
    ctx.lineTo(this.horse.x + 46, this.horse.y + 24);
    ctx.closePath();
    ctx.fill();

    // Galloping legs
    const legSwing = Math.sin(this.horse.animFrame) * 16;
    ctx.strokeStyle = '#5c2b09';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Front legs
    ctx.moveTo(this.horse.x + 42, this.horse.y + 36);
    ctx.lineTo(this.horse.x + 42 + legSwing, this.horse.y + 50);
    // Back legs
    ctx.moveTo(this.horse.x + 8, this.horse.y + 36);
    ctx.lineTo(this.horse.x + 8 - legSwing, this.horse.y + 50);
    ctx.stroke();

    // Jockey Rider
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(this.horse.x + 20, this.horse.y - 4, 14, 16);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(this.horse.x + 27, this.horse.y - 8, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // HUD Glass
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(16, 12, 340, 50);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(16, 12, 340, 50);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`GAIT: ${this.horse.speedMode}`, 26, 30);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('STAMINA', 26, 48);
    ctx.fillStyle = '#334155';
    ctx.fillRect(86, 38, 140, 12);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(86, 38, 140 * (this.horse.stamina / this.horse.maxStamina), 12);

    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(w - 200, 12, 184, 50);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(w - 200, 12, 184, 50);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score}`, w - 184, 42);
  }
}

export default GallopQuestGame;
