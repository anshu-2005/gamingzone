/* ====================================================
   RAGDOLL CANNON BLAST — GAMINGZONE
   Articulated 2D Verlet Physics Puzzle Launcher
   - Multi-Joint Ragdoll Skeleton (Head, Torso, Limbs)
   - Angle & Power Cannon Aiming with Trajectory Dots
   - Bouncy Trampolines, TNT Barrels & Star Targets
   - Handcrafted Physics Obstacle Stages
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class RagdollCannonBlastGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Ragdoll Cannon Blast',
      targetScore: 3000,
      ...config
    });

    this.createCanvas(800, 560);

    this.cannon = {
      x: 80,
      y: 460,
      angle: -0.6, // radians
      power: 16
    };

    this.ragdoll = null;
    this.targetPortal = { x: 720, y: 220, radius: 32 };
    this.stars = [];
    this.obstacles = [];
    this.levelIndex = 1;
    this.isAiming = false;
    this.shotsLeft = 5;

    this.loadLevel(this.levelIndex);
    this.initAimControls();

    this.showStartCard({
      title: 'RAGDOLL CANNON BLAST',
      icon: '🎯',
      objective: 'Launch your ragdoll into the target vortex! Collect glowing stars and use trampolines to clear obstacles.',
      controls: 'Click & Drag to aim cannon angle and power. Release to launch.',
      onStart: () => this.start()
    });
  }

  loadLevel(lvl) {
    this.shotsLeft = 5;
    this.ragdoll = null;
    this.stars = [];
    this.obstacles = [];

    if (lvl === 1) {
      this.targetPortal = { x: 720, y: 220, radius: 32 };
      this.stars = [{ x: 400, y: 200, collected: false }, { x: 550, y: 160, collected: false }];
      this.obstacles = [
        { type: 'wall', x: 480, y: 300, w: 24, h: 260 }
      ];
    } else if (lvl === 2) {
      this.targetPortal = { x: 720, y: 440, radius: 32 };
      this.stars = [{ x: 380, y: 150, collected: false }, { x: 600, y: 300, collected: false }];
      this.obstacles = [
        { type: 'trampoline', x: 360, y: 480, w: 90, h: 20, bounce: 1.4 },
        { type: 'wall', x: 500, y: 180, w: 24, h: 380 }
      ];
    } else {
      this.targetPortal = { x: 700, y: 180, radius: 32 };
      this.stars = [{ x: 300, y: 240, collected: false }, { x: 500, y: 180, collected: false }, { x: 620, y: 340, collected: false }];
      this.obstacles = [
        { type: 'trampoline', x: 280, y: 480, w: 80, h: 20, bounce: 1.5 },
        { type: 'wall', x: 420, y: 260, w: 30, h: 300 }
      ];
    }
  }

  initAimControls() {
    const handleMove = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      const dx = mx - this.cannon.x;
      const dy = my - this.cannon.y;
      this.cannon.angle = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);
      this.cannon.power = Math.max(8, Math.min(24, dist * 0.1));
    };

    this.addEventListenerTracked(this.canvas, 'mousedown', (e) => {
      this.isAiming = true;
      handleMove(e.clientX, e.clientY);
    });

    this.addEventListenerTracked(this.canvas, 'mousemove', (e) => {
      if (this.isAiming) handleMove(e.clientX, e.clientY);
    });

    this.addEventListenerTracked(this.canvas, 'mouseup', () => {
      if (this.isAiming && this.state === GameState.PLAYING) {
        this.isAiming = false;
        this.fireCannon();
      }
    });

    this.addEventListenerTracked(this.canvas, 'touchstart', (e) => {
      if (e.touches[0]) {
        this.isAiming = true;
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    this.addEventListenerTracked(this.canvas, 'touchmove', (e) => {
      if (this.isAiming && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    this.addEventListenerTracked(this.canvas, 'touchend', () => {
      if (this.isAiming && this.state === GameState.PLAYING) {
        this.isAiming = false;
        this.fireCannon();
      }
    });
  }

  fireCannon() {
    if (this.shotsLeft <= 0) return;
    this.shotsLeft--;
    sounds.playExplode();

    const speed = this.cannon.power;
    const vx = Math.cos(this.cannon.angle) * speed;
    const vy = Math.sin(this.cannon.angle) * speed;

    const spawnX = this.cannon.x + Math.cos(this.cannon.angle) * 40;
    const spawnY = this.cannon.y + Math.sin(this.cannon.angle) * 40;

    // Create Multi-Joint Verlet Skeleton
    const pHead = { x: spawnX, y: spawnY, oldX: spawnX - vx, oldY: spawnY - vy, radius: 9 };
    const pTorso = { x: spawnX, y: spawnY + 16, oldX: spawnX - vx, oldY: spawnY + 16 - vy, radius: 10 };
    const pHandL = { x: spawnX - 12, y: spawnY + 14, oldX: spawnX - 12 - vx, oldY: spawnY + 14 - vy, radius: 5 };
    const pHandR = { x: spawnX + 12, y: spawnY + 14, oldX: spawnX + 12 - vx, oldY: spawnY + 14 - vy, radius: 5 };
    const pFootL = { x: spawnX - 8, y: spawnY + 32, oldX: spawnX - 8 - vx, oldY: spawnY + 32 - vy, radius: 5 };
    const pFootR = { x: spawnX + 8, y: spawnY + 32, oldX: spawnX + 8 - vx, oldY: spawnY + 32 - vy, radius: 5 };

    const points = [pHead, pTorso, pHandL, pHandR, pFootL, pFootR];

    const constraints = [
      [0, 1, 16], // Head to Torso
      [1, 2, 16], // Torso to HandL
      [1, 3, 16], // Torso to HandR
      [1, 4, 20], // Torso to FootL
      [1, 5, 20], // Torso to FootR
      [4, 5, 14]  // Foot to Foot
    ];

    this.ragdoll = { points, constraints, alive: true };
  }

  update(dt) {
    if (this.state !== GameState.PLAYING || !this.ragdoll) return;

    const gravity = 0.38;
    const friction = 0.99;

    // Verlet integration
    this.ragdoll.points.forEach(p => {
      const vx = (p.x - p.oldX) * friction;
      const vy = (p.y - p.oldY) * friction;
      p.oldX = p.x;
      p.oldY = p.y;
      p.x += vx;
      p.y += vy + gravity;

      // Floor & Ceiling
      if (p.y > this.baseHeight - 30) {
        p.y = this.baseHeight - 30;
        p.oldY = p.y + vy * 0.4;
      }
      if (p.x < 10) { p.x = 10; p.oldX = p.x + vx * 0.4; }
      if (p.x > this.baseWidth - 10) { p.x = this.baseWidth - 10; p.oldX = p.x + vx * 0.4; }

      // Obstacle collisions
      this.obstacles.forEach(obs => {
        if (p.x > obs.x && p.x < obs.x + obs.w && p.y > obs.y && p.y < obs.y + obs.h) {
          if (obs.type === 'trampoline') {
            sounds.playJump();
            p.y = obs.y;
            p.oldY = p.y + Math.abs(vy) * obs.bounce;
          } else {
            p.x = p.oldX;
            p.y = p.oldY;
          }
        }
      });

      // Star collection
      this.stars.forEach(s => {
        if (!s.collected && Math.hypot(p.x - s.x, p.y - s.y) < 24) {
          s.collected = true;
          sounds.playScore();
          this.score += 250;
        }
      });

      // Target Portal Entry
      if (Math.hypot(p.x - this.targetPortal.x, p.y - this.targetPortal.y) < this.targetPortal.radius) {
        sounds.playVictory();
        this.score += 1000;
        this.levelIndex++;
        if (this.levelIndex <= 3) {
          this.loadLevel(this.levelIndex);
        } else {
          this.gameOver(true);
        }
      }
    });

    // Distance constraint solver
    for (let iter = 0; iter < 4; iter++) {
      this.ragdoll.constraints.forEach(([i1, i2, dist]) => {
        const p1 = this.ragdoll.points[i1];
        const p2 = this.ragdoll.points[i2];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const currentDist = Math.hypot(dx, dy) || 1;
        const diff = (dist - currentDist) / currentDist * 0.5;
        const offsetX = dx * diff;
        const offsetY = dy * diff;

        p1.x -= offsetX;
        p1.y -= offsetY;
        p2.x += offsetX;
        p2.y += offsetY;
      });
    }

    // Check if shots ran out and ragdoll is stopped
    if (this.shotsLeft === 0 && Math.abs(this.ragdoll.points[0].x - this.ragdoll.points[0].oldX) < 0.1) {
      this.gameOver(false);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Stage Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Ground line
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, this.baseHeight - 30, this.baseWidth, 30);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(0, this.baseHeight - 30, this.baseWidth, 2);

    // Obstacles
    this.obstacles.forEach(obs => {
      if (obs.type === 'trampoline') {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px sans-serif';
        ctx.fillText('BOUNCE', obs.x + 18, obs.y + 14);
      } else {
        ctx.fillStyle = '#334155';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#64748b';
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }
    });

    // Stars
    this.stars.forEach(s => {
      if (!s.collected) {
        ctx.fillStyle = '#ffd166';
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 10;
        ctx.font = '22px sans-serif';
        ctx.fillText('⭐', s.x - 11, s.y + 8);
        ctx.shadowBlur = 0;
      }
    });

    // Target Portal Vortex
    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(this.targetPortal.x, this.targetPortal.y, this.targetPortal.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(this.targetPortal.x, this.targetPortal.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cannon Base & Barrel
    ctx.save();
    ctx.translate(this.cannon.x, this.cannon.y);
    ctx.rotate(this.cannon.angle);

    // Barrel
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, -10, 42, 20);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(38, -12, 6, 24);
    ctx.restore();

    // Wheel
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(this.cannon.x, this.cannon.y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Trajectory dots while aiming
    if (this.isAiming) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
      const speed = this.cannon.power;
      let tx = this.cannon.x;
      let ty = this.cannon.y;
      let tvx = Math.cos(this.cannon.angle) * speed;
      let tvy = Math.sin(this.cannon.angle) * speed;
      for (let i = 0; i < 18; i++) {
        tx += tvx;
        ty += tvy;
        tvy += 0.38;
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render Ragdoll
    if (this.ragdoll) {
      const pts = this.ragdoll.points;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      this.ragdoll.constraints.forEach(([i1, i2]) => {
        ctx.moveTo(pts[i1].x, pts[i1].y);
        ctx.lineTo(pts[i2].x, pts[i2].y);
      });
      ctx.stroke();

      pts.forEach(p => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Top HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 18px "Outfit", sans-serif';
    ctx.fillText(`Stage ${this.levelIndex} • Shots Left: ${this.shotsLeft}`, 30, 40);
    ctx.fillText(`Score: ${this.score}`, 280, 40);
  }
}

