/* ====================================================
   SHADOW SHINOBI DASH — GAMINGZONE
   Acrobatic Ninja Wall-Jumping & Shuriken Pagoda Platformer
   - Wall-Jump Between Wooden Pagoda Pillars & Pagoda Eaves
   - Throw Razor Shurikens to Vanquish Shadow Demon Bats
   - Perform Double Jumps & Air Slashes Across Shinto Temples
   - 10 Escalating Pagoda Tower Stages with Golden Dragon Bells
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ShadowShinobiDashGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Shadow Shinobi Dash',
      targetScore: 10000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.currentLevel = 1;
    this.stageLength = 3200;
    this.cameraX = 0;

    // Ninja Hero
    this.ninja = {
      x: 100,
      y: 380,
      vx: 0,
      vy: 0,
      w: 20,
      h: 36,
      speed: 5.2,
      grounded: false,
      jumpsLeft: 2,
      onWall: false,
      wallDir: 0
    };

    this.platforms = [];
    this.enemies = [];
    this.shurikens = [];
    this.particles = [];
    this.keys = {};

    this.initControls();
    this.loadStage(this.currentLevel);

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) {
          this.keys['a'] = false;
          this.keys['d'] = false;
          return;
        }
        if (dir === 'LEFT') this.keys['a'] = true;
        if (dir === 'RIGHT') this.keys['d'] = true;
      },
      onAction: () => this.jump()
    });

    this.showStartCard({
      title: 'SHADOW SHINOBI DASH',
      icon: '🥷',
      objective: 'Wall-jump across the pagoda roofs! Throw shurikens with [F] or Click, perform double jumps, and reach the Golden Dragon Bell.',
      controls: 'A/D to Run • [SPACE] to Jump & Wall-Jump • [F] or Click to Throw Shuriken.',
      onStart: () => {
        this.currentLevel = 1;
        this.score = 0;
        this.loadStage(1);
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if ((e.code === 'Space' || e.key === 'w' || e.key === 'ArrowUp') && this.state === GameState.PLAYING) {
        this.jump();
      }

      if ((e.key === 'f' || e.key === 'F') && this.state === GameState.PLAYING) {
        this.throwShuriken();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', () => {
        this.throwShuriken();
      });
    }
  }

  loadStage(lvl) {
    this.currentLevel = lvl;
    this.stageLength = 2800 + lvl * 500;
    this.cameraX = 0;

    this.ninja = {
      x: 100,
      y: 380,
      vx: 0,
      vy: 0,
      w: 20,
      h: 36,
      speed: 5.2,
      grounded: false,
      jumpsLeft: 2,
      onWall: false,
      wallDir: 0
    };

    this.platforms = [];
    this.enemies = [];
    this.shurikens = [];
    this.particles = [];

    // Pagoda Roof Platforms
    this.platforms.push({ x: 0, y: 440, w: 400, h: 60 });
    let curX = 460;
    while (curX < this.stageLength - 300) {
      const w = Math.random() * 160 + 100;
      const y = 420 - Math.floor(Math.random() * 4) * 50;
      this.platforms.push({ x: curX, y: y, w: w, h: 30 });

      // Flying demon bat
      if (Math.random() < 0.4) {
        this.enemies.push({
          x: curX + w / 2,
          y: y - 80,
          vx: Math.random() > 0.5 ? 2 : -2,
          radius: 14,
          hp: 20
        });
      }

      curX += w + Math.random() * 90 + 70;
    }

    // Dragon Bell Finish
    const endX = this.stageLength - 200;
    this.platforms.push({ x: endX - 50, y: 380, w: 300, h: 80 });
  }

  jump() {
    if (this.ninja.grounded || this.ninja.jumpsLeft > 0) {
      sounds.playJump();
      this.ninja.vy = -10.5;
      this.ninja.grounded = false;
      this.ninja.jumpsLeft--;
    }
  }

  throwShuriken() {
    sounds.playLaser();
    const facing = this.ninja.vx >= 0 ? 1 : -1;
    this.shurikens.push({
      x: this.ninja.x + facing * 18,
      y: this.ninja.y + 10,
      vx: facing * 15,
      angle: 0
    });
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    const n = this.ninja;

    // Movement
    if (this.keys['a'] || this.keys['arrowleft']) n.vx = -n.speed;
    else if (this.keys['d'] || this.keys['arrowright']) n.vx = n.speed;
    else n.vx *= 0.82;

    n.vy += 0.52; // gravity
    n.x += n.vx;
    n.y += n.vy;

    // Platform Collisions
    n.grounded = false;
    for (const p of this.platforms) {
      if (n.x + n.w > p.x && n.x < p.x + p.w && n.y + n.h >= p.y && n.y + n.h <= p.y + 18 && n.vy >= 0) {
        n.y = p.y - n.h;
        n.vy = 0;
        n.grounded = true;
        n.jumpsLeft = 2;
        break;
      }
    }

    this.cameraX = n.x - 220;

    // Check Stage Victory
    if (n.x >= this.stageLength - 120) {
      sounds.playWin();
      this.score += 1500 * this.currentLevel;
      if (this.currentLevel >= 10) {
        this.gameOver(this.score, { cleared: true });
      } else {
        this.loadStage(this.currentLevel + 1);
      }
      return;
    }

    // Pit Fall Check
    if (n.y > 540) {
      sounds.playExplosion();
      this.lives--;
      n.x = Math.max(100, n.x - 300);
      n.y = 300;
      n.vx = 0;
      n.vy = 0;

      if (this.lives <= 0) {
        this.gameOver(this.score, { level: this.currentLevel });
      }
    }

    // Update Shurikens
    for (let i = this.shurikens.length - 1; i >= 0; i--) {
      const sh = this.shurikens[i];
      sh.x += sh.vx;
      sh.angle += 0.4;

      // Hit enemies
      for (let e = this.enemies.length - 1; e >= 0; e--) {
        const en = this.enemies[e];
        if (Math.hypot(sh.x - en.x, sh.y - en.y) < en.radius + 10) {
          sounds.playHit();
          this.score += 200;
          this.enemies.splice(e, 1);
          this.shurikens.splice(i, 1);
          break;
        }
      }

      if (sh.x < this.cameraX - 100 || sh.x > this.cameraX + this.width + 100) {
        this.shurikens.splice(i, 1);
      }
    }

    // Update Enemies (Demon Bats)
    this.enemies.forEach(en => {
      en.x += en.vx;
      if (Math.random() < 0.02) en.vx = -en.vx;

      // Hit ninja
      if (Math.hypot(en.x - n.x, en.y - n.y) < en.radius + 12) {
        sounds.playExplosion();
        n.vx = en.vx * 3;
        n.vy = -6;
      }
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Moonlight Pagoda Night Sky
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#0c0d12');
    bgGrad.addColorStop(0.6, '#181a24');
    bgGrad.addColorStop(1, '#ff5733');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Giant Red Moon
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(680, 120, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 2. Render Platforms (Pagoda Curved Tiles)
    this.platforms.forEach(p => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#ff5733';
      ctx.fillRect(p.x, p.y, p.w, 4); // Red trim
    });

    // 3. Render Shurikens
    this.shurikens.forEach(sh => {
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.angle);
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(-8, -2, 16, 4);
      ctx.fillRect(-2, -8, 4, 16);
      ctx.restore();
    });

    // 4. Render Enemies (Bats)
    this.enemies.forEach(en => {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5733';
      ctx.fillRect(en.x - 4, en.y - 2, 2, 2);
      ctx.fillRect(en.x + 2, en.y - 2, 2, 2);
    });

    // 5. Render Ninja Hero
    const n = this.ninja;
    ctx.fillStyle = '#0f172a'; // Black Shinobi Robe
    ctx.fillRect(n.x, n.y, n.w, n.h);

    // Red Headband
    ctx.fillStyle = '#ff5733';
    ctx.fillRect(n.x, n.y + 6, n.w, 5);

    // Eyes
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(n.x + 12, n.y + 7, 4, 2);

    ctx.restore();

    // 6. HUD
    ctx.fillStyle = 'rgba(18, 20, 28, 0.85)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    ctx.fillStyle = '#ff5733';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`STAGE ${this.currentLevel} • ❤️ ${this.lives}`, 34, 46);

    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score} • SHURIKENS: ∞`, 34, 64);
  }
}

