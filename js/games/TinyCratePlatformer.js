import { GameEngineBase } from '../core/GameEngineBase.js';

export class TinyCratePlatformer extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Tiny Crate: Box Toss Platformer';
    this.level = 1;
    this.score = 0;
    this.isWon = false;

    this.player = {
      x: 100,
      y: 450,
      vx: 0,
      vy: 0,
      w: 24,
      h: 32,
      isGrounded: false,
      carryingCrate: null
    };

    this.keys = { left: false, right: false, jump: false, action: false };
    this.crates = [];
    this.platforms = [];
    this.door = { x: 900, y: 440, w: 32, h: 48, open: false };
    this.button = { x: 600, y: 480, w: 40, h: 8, pressed: false };
  }

  onInit() {
    this.createCanvas();
    this.setupLevel(this.level);

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        if (this.player.isGrounded) {
          this.player.vy = -380;
          this.player.isGrounded = false;
        }
      }
      if (e.code === 'KeyE' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.interactCrate();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.isWon) this.setupLevel(this.level + 1);
    });

    this.showStartCard(
      'TINY CRATE: BOX TOSS',
      'Charming puzzle platformer! Walk with [A/D], Jump with [W/Space]. Press [E] or [Down] to pick up and toss wooden crates. Stack crates to reach ledges and press switches to open doors!',
      'ENTER DUNGEON'
    );
  }

  setupLevel(lvl) {
    this.level = lvl;
    this.isWon = false;

    this.player.x = 80;
    this.player.y = 440;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.carryingCrate = null;

    // Build room platforms
    this.platforms = [
      // Floor
      { x: 0, y: 488, w: 1000, h: 74 },
      // Ledges
      { x: 300, y: 380, w: 150, h: 20 },
      { x: 550, y: 300, w: 180, h: 20 },
      { x: 800, y: 400, w: 200, h: 20 },
      // Wall barrier needing crate jump
      { x: 740, y: 220, w: 20, h: 268 }
    ];

    // Crates
    this.crates = [
      { x: 220, y: 456, vx: 0, vy: 0, w: 32, h: 32, isCarried: false },
      { x: 340, y: 348, vx: 0, vy: 0, w: 32, h: 32, isCarried: false }
    ];

    // Pressure button
    this.button = { x: 620, y: 480, w: 44, h: 8, pressed: false };
    // Door
    this.door = { x: 910, y: 432, w: 36, h: 56, open: false };
  }

  interactCrate() {
    if (this.player.carryingCrate) {
      // Toss crate forward
      const c = this.player.carryingCrate;
      c.isCarried = false;
      c.x = this.player.x + (this.player.vx >= 0 ? 30 : -30);
      c.y = this.player.y - 10;
      c.vx = this.player.vx >= 0 ? 220 : -220;
      c.vy = -120;
      this.player.carryingCrate = null;
    } else {
      // Pick up closest crate
      for (const c of this.crates) {
        if (!c.isCarried && Math.hypot(this.player.x - c.x, this.player.y - c.y) < 45) {
          c.isCarried = true;
          this.player.carryingCrate = c;
          break;
        }
      }
    }
  }

  onUpdate(dt) {
    if (this.isWon) return;

    // Player horizontal movement
    const moveSpeed = 190;
    if (this.keys.left) this.player.vx = -moveSpeed;
    else if (this.keys.right) this.player.vx = moveSpeed;
    else this.player.vx = 0;

    // Gravity
    this.player.vy += 850 * dt;

    // Move player
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Platform collisions for player
    this.player.isGrounded = false;
    for (const p of this.platforms) {
      if (this.player.x + this.player.w / 2 > p.x && this.player.x - this.player.w / 2 < p.x + p.w) {
        // Falling down on platform
        if (this.player.y + this.player.h / 2 >= p.y && this.player.y + this.player.h / 2 <= p.y + 20 && this.player.vy >= 0) {
          this.player.y = p.y - this.player.h / 2;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
      }
    }

    // Crates physics
    let buttonPressed = false;
    for (const c of this.crates) {
      if (c.isCarried) {
        c.x = this.player.x;
        c.y = this.player.y - 28;
      } else {
        c.vy += 850 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vx *= 0.92;

        // Platform collision for crate
        for (const p of this.platforms) {
          if (c.x + c.w / 2 > p.x && c.x - c.w / 2 < p.x + p.w) {
            if (c.y + c.h / 2 >= p.y && c.y + c.h / 2 <= p.y + 20 && c.vy >= 0) {
              c.y = p.y - c.h / 2;
              c.vy = 0;
            }
          }
        }

        // Crate on button check
        if (Math.abs(c.x - (this.button.x + this.button.w / 2)) < 30 && Math.abs(c.y + c.h / 2 - this.button.y) < 15) {
          buttonPressed = true;
        }
      }
    }

    // Player on button
    if (Math.abs(this.player.x - (this.button.x + this.button.w / 2)) < 24 && Math.abs(this.player.y + this.player.h / 2 - this.button.y) < 15) {
      buttonPressed = true;
    }

    this.button.pressed = buttonPressed;
    this.door.open = buttonPressed;

    // Check reach exit door
    if (this.door.open && Math.hypot(this.player.x - (this.door.x + this.door.w / 2), this.player.y - (this.door.y + this.door.h / 2)) < 35) {
      this.isWon = true;
      this.score += 500;
    }
  }

  onRender(ctx) {
    // Medieval Dungeon Brick Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 562);

    // Brick pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = 0; y < 562; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1000, y); ctx.stroke();
    }

    // Top Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📦 TINY CRATE: BOX TOSS', 30, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL: ${this.level}  |  SCORE: ${this.score}`, 970, 38);

    // Platforms
    for (const p of this.platforms) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#475569';
      ctx.fillRect(p.x, p.y, p.w, 4); // top lip
    }

    // Pressure Button
    ctx.fillStyle = this.button.pressed ? '#10b981' : '#ef4444';
    ctx.fillRect(this.button.x, this.button.y, this.button.w, this.button.h);

    // Exit Door
    ctx.fillStyle = this.door.open ? '#10b981' : '#64748b';
    ctx.fillRect(this.door.x, this.door.y, this.door.w, this.door.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.door.x, this.door.y, this.door.w, this.door.h);
    if (this.door.open) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', this.door.x + this.door.w / 2, this.door.y + 32);
    }

    // Crates
    for (const c of this.crates) {
      ctx.fillStyle = '#d97706';
      ctx.fillRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h);
      // X on crate
      ctx.beginPath();
      ctx.moveTo(c.x - c.w / 2, c.y - c.h / 2); ctx.lineTo(c.x + c.w / 2, c.y + c.h / 2);
      ctx.moveTo(c.x + c.w / 2, c.y - c.h / 2); ctx.lineTo(c.x - c.w / 2, c.y + c.h / 2);
      ctx.stroke();
    }

    // Player Hero
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(this.player.x - this.player.w / 2, this.player.y - this.player.h / 2, this.player.w, this.player.h, 6);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    const faceDir = this.player.vx >= 0 ? 3 : -3;
    ctx.fillRect(this.player.x + faceDir - 2, this.player.y - 8, 4, 4);

    // Controls Help Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 515, 1000, 47);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 CONTROLS: [A / D] Move | [W / Space] Jump | [E / S] Pick Up / Throw Crate', 500, 542);

    // Win Modal
    if (this.isWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`LEVEL ${this.level} CLEARED! 🎉`, 500, 240);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(400, 310, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('NEXT LEVEL ▶', 500, 342);
    }
  }
}
