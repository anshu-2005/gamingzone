import { GameEngineBase } from '../core/GameEngineBase.js';

export class DudeAdventure extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Dude Adventure: Forest Quest';
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.gameOver = false;
    this.isWon = false;

    this.cameraX = 0;
    this.player = {
      x: 100,
      y: 450,
      vx: 0,
      vy: 0,
      w: 24,
      h: 32,
      isGrounded: false
    };

    this.keys = { left: false, right: false, jump: false };
    this.platforms = [];
    this.blocks = [];
    this.enemies = [];
    this.coinItems = [];
    this.flag = { x: 2600, y: 300, reached: false };
  }

  onInit() {
    this.createCanvas();
    this.setupLevel();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (this.player.isGrounded) {
          this.player.vy = -420;
          this.player.isGrounded = false;
        }
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver || this.isWon) this.setupLevel();
    });

    this.showStartCard(
      'DUDE ADVENTURE: FOREST QUEST',
      'Classic side-scrolling platformer adventure! Run and jump through the enchanted forest with [WASD / Space]. Stomp enemy mushrooms, hit question blocks from underneath, and reach the golden flagpole!',
      'START ADVENTURE'
    );
  }

  setupLevel() {
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.gameOver = false;
    this.isWon = false;
    this.cameraX = 0;

    this.player.x = 100;
    this.player.y = 450;
    this.player.vx = 0;
    this.player.vy = 0;

    // Build 2800px wide level
    this.platforms = [
      { x: 0, y: 480, w: 900, h: 82 },
      { x: 1000, y: 480, w: 800, h: 82 }, // gap at 900-1000
      { x: 1900, y: 480, w: 900, h: 82 }, // gap at 1800-1900
      // Ledges & pipes
      { x: 300, y: 380, w: 120, h: 24 },
      { x: 500, y: 340, w: 140, h: 24 },
      { x: 700, y: 400, w: 100, h: 24 },
      { x: 1200, y: 360, w: 150, h: 24 },
      { x: 1500, y: 320, w: 160, h: 24 },
      { x: 2100, y: 380, w: 140, h: 24 }
    ];

    // Question / Brick blocks
    this.blocks = [
      { x: 340, y: 260, w: 32, h: 32, hit: false, coin: true },
      { x: 372, y: 260, w: 32, h: 32, hit: false, coin: false },
      { x: 404, y: 260, w: 32, h: 32, hit: false, coin: true },
      { x: 1260, y: 240, w: 32, h: 32, hit: false, coin: true },
      { x: 1292, y: 240, w: 32, h: 32, hit: false, coin: true }
    ];

    // Enemy walking mushrooms
    this.enemies = [
      { x: 400, y: 456, vx: -60, w: 26, h: 24, alive: true },
      { x: 750, y: 456, vx: -60, w: 26, h: 24, alive: true },
      { x: 1350, y: 456, vx: -60, w: 26, h: 24, alive: true },
      { x: 1600, y: 456, vx: -60, w: 26, h: 24, alive: true },
      { x: 2250, y: 456, vx: -60, w: 26, h: 24, alive: true }
    ];

    // Flagpole
    this.flag = { x: 2650, y: 220, reached: false };
  }

  onUpdate(dt) {
    if (this.gameOver || this.isWon) return;

    // Movement
    const moveSpeed = 210;
    if (this.keys.left) this.player.vx = -moveSpeed;
    else if (this.keys.right) this.player.vx = moveSpeed;
    else this.player.vx = 0;

    // Gravity
    this.player.vy += 850 * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Pit death
    if (this.player.y > 580) {
      this.lives--;
      if (this.lives <= 0) this.gameOver = true;
      else {
        this.player.x = Math.max(100, this.player.x - 300);
        this.player.y = 350;
        this.player.vy = 0;
      }
      return;
    }

    // Platform collisions
    this.player.isGrounded = false;
    for (const p of this.platforms) {
      if (this.player.x + this.player.w / 2 > p.x && this.player.x - this.player.w / 2 < p.x + p.w) {
        if (this.player.y + this.player.h / 2 >= p.y && this.player.y + this.player.h / 2 <= p.y + 20 && this.player.vy >= 0) {
          this.player.y = p.y - this.player.h / 2;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
      }
    }

    // Question Block collisions
    for (const b of this.blocks) {
      if (this.player.x + this.player.w / 2 > b.x && this.player.x - this.player.w / 2 < b.x + b.w) {
        // Hit from underneath
        if (this.player.y - this.player.h / 2 <= b.y + b.h && this.player.y - this.player.h / 2 >= b.y + b.h - 15 && this.player.vy < 0) {
          this.player.y = b.y + b.h + this.player.h / 2;
          this.player.vy = 0;
          if (!b.hit) {
            b.hit = true;
            this.coins += 5;
            this.score += 200;
          }
        }
      }
    }

    // Update Enemies & Stomping
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < 100 || e.x > 2700) e.vx *= -1;

      // Check collision with player
      if (Math.abs(this.player.x - e.x) < 24 && Math.abs(this.player.y - e.y) < 24) {
        if (this.player.vy > 0 && this.player.y < e.y) {
          // Stomp enemy!
          e.alive = false;
          this.player.vy = -280; // bounce
          this.score += 300;
        } else {
          // Player hit
          this.lives--;
          this.player.y = 350;
          this.player.vy = -200;
          if (this.lives <= 0) this.gameOver = true;
          break;
        }
      }
    }

    // Camera follow player
    this.cameraX = Math.max(0, this.player.x - 300);

    // Reach Flagpole
    if (this.player.x >= this.flag.x) {
      this.isWon = true;
      this.score += 1500;
    }
  }

  onRender(ctx) {
    // Enchanted Forest Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 562);
    sky.addColorStop(0, '#38bdf8');
    sky.addColorStop(0.7, '#7dd3fc');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1000, 562);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // Distant Hills
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(400, 550, 320, Math.PI, 0, false);
    ctx.arc(1100, 550, 400, Math.PI, 0, false);
    ctx.arc(1900, 550, 350, Math.PI, 0, false);
    ctx.fill();

    // Platforms
    for (const p of this.platforms) {
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(p.x, p.y, p.w, 12); // Green grass cap
    }

    // Question Blocks
    for (const b of this.blocks) {
      ctx.fillStyle = b.hit ? '#78350f' : '#f59e0b';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      if (!b.hit) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', b.x + b.w / 2, b.y + 24);
      }
    }

    // Flagpole
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.flag.x, this.flag.y, 6, 260);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(this.flag.x + 6, this.flag.y);
    ctx.lineTo(this.flag.x + 36, this.flag.y + 16);
    ctx.lineTo(this.flag.x + 6, this.flag.y + 32);
    ctx.closePath();
    ctx.fill();

    // Enemies (Mushrooms)
    for (const e of this.enemies) {
      if (!e.alive) continue;
      // Cap
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(e.x, e.y - 6, 14, Math.PI, 0, false);
      ctx.fill();
      // Stem
      ctx.fillStyle = '#fde047';
      ctx.fillRect(e.x - 8, e.y - 6, 16, 14);
    }

    // Player Hero (Dude)
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, 6);
    ctx.fill();
    // Cap
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, 8);

    ctx.restore();

    // Top Header UI
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 58);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🍄 DUDE ADVENTURE', 30, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  COINS: ${this.coins}  |  LIVES: ❤️ x ${this.lives}`, 970, 38);

    // Game Over / Win
    if (this.gameOver || this.isWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = this.isWon ? '#10b981' : '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.isWon ? 'STAGE COMPLETED! 🏁' : 'GAME OVER', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`TOTAL SCORE: ${this.score}`, 500, 290);

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PLAY AGAIN', 500, 362);
    }
  }
}

