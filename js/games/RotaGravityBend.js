import { GameEngineBase } from '../core/GameEngineBase.js';

export class RotaGravityBend extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Rota: Gravity Bend Platformer';
    this.gravityDir = 0; // 0: Down, 1: Left, 2: Up, 3: Right
    this.smoothRotation = 0;
    this.targetRotation = 0;
    this.crystals = 0;
    this.totalCrystals = 3;
    this.isWon = false;

    this.player = {
      x: 0,
      y: 120,
      vx: 0,
      vy: 0,
      size: 20,
      isGrounded: false
    };

    this.keys = { left: false, right: false, jump: false };
    this.crystalsList = [];
    this.platforms = [];
  }

  onInit() {
    this.createCanvas();
    this.setupRoom();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (this.player.isGrounded) {
          this.player.vy = -380;
          this.player.isGrounded = false;
        }
      }
      if (e.code === 'KeyQ') this.rotateGravity(-1);
      if (e.code === 'KeyE') this.rotateGravity(1);
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    this.addEventListenerTracked(this.canvas, 'click', (e) => {
      if (this.isWon) {
        this.setupRoom();
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 1000;
      if (mx < 300) this.rotateGravity(-1);
      else if (mx > 700) this.rotateGravity(1);
    });

    this.showStartCard(
      'ROTA: GRAVITY BEND',
      'Bend gravity to solve impossible mazes! Move with [A/D] and jump with [Space]. Press [Q / E] or click screen sides to rotate gravity by 90 degrees! Collect all 3 crystals and enter the vortex.',
      'BEND GRAVITY'
    );
  }

  setupRoom() {
    this.gravityDir = 0;
    this.smoothRotation = 0;
    this.targetRotation = 0;
    this.crystals = 0;
    this.isWon = false;

    this.player.x = 0;
    this.player.y = 120;
    this.player.vx = 0;
    this.player.vy = 0;

    // Room centered box 400x400
    this.platforms = [
      // Outer 4 walls
      { x: -200, y: 190, w: 400, h: 20 },  // Bottom
      { x: -200, y: -200, w: 400, h: 20 }, // Top
      { x: -200, y: -200, w: 20, h: 400 }, // Left
      { x: 180, y: -200, w: 20, h: 400 },  // Right
      // Inner blocks
      { x: -80, y: 60, w: 160, h: 20 },
      { x: -140, y: -60, w: 100, h: 20 },
      { x: 40, y: -80, w: 100, h: 20 }
    ];

    this.crystalsList = [
      { x: -130, y: 140, collected: false },
      { x: 120, y: -140, collected: false },
      { x: 0, y: 20, collected: false }
    ];
  }

  rotateGravity(delta) {
    this.gravityDir = (this.gravityDir + delta + 4) % 4;
    this.targetRotation += (delta * Math.PI) / 2;
  }

  onUpdate(dt) {
    if (this.isWon) return;

    // Smooth visual level rotation
    this.smoothRotation += (this.targetRotation - this.smoothRotation) * 8 * dt;

    // Player controls (relative to current floor)
    const moveSpeed = 180;
    if (this.keys.left) this.player.vx = -moveSpeed;
    else if (this.keys.right) this.player.vx = moveSpeed;
    else this.player.vx = 0;

    // Gravity always pulls down in local player space
    this.player.vy += 850 * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Collisions
    this.player.isGrounded = false;
    for (const p of this.platforms) {
      if (this.player.x + this.player.size / 2 > p.x && this.player.x - this.player.size / 2 < p.x + p.w) {
        if (this.player.y + this.player.size / 2 >= p.y && this.player.y + this.player.size / 2 <= p.y + 18 && this.player.vy >= 0) {
          this.player.y = p.y - this.player.size / 2;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
      }
    }

    // Collect crystals
    for (const c of this.crystalsList) {
      if (!c.collected && Math.hypot(this.player.x - c.x, this.player.y - c.y) < 26) {
        c.collected = true;
        this.crystals++;
        if (this.crystals >= this.totalCrystals) {
          this.isWon = true;
        }
      }
    }
  }

  onRender(ctx) {
    // Abstract Void Background
    const bg = ctx.createRadialGradient(500, 280, 50, 500, 280, 450);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(1, '#090514');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1000, 562);

    ctx.save();
    ctx.translate(500, 280);
    ctx.rotate(this.smoothRotation);

    // Render Platforms
    for (const p of this.platforms) {
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // Crystals
    for (const c of this.crystalsList) {
      if (!c.collected) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Player
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(this.player.x - this.player.size / 2, this.player.y - this.player.size / 2, this.player.size, this.player.size, 4);
    ctx.fill();

    ctx.restore();

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 58);
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌀 ROTA: GRAVITY BEND', 30, 38);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`CRYSTALS: ${this.crystals}/${this.totalCrystals}  |  ROTATE: [Q] ◀ / ▶ [E]`, 970, 38);

    // Win Modal
    if (this.isWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DIMENSION CLEARED! 🌀', 500, 240);

      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.roundRect(400, 310, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('NEXT MAZE ▶', 500, 342);
    }
  }
}
