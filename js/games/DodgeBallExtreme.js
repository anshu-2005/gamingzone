/* ====================================================
   DODGEBALL EXTREME — BULLET-HELL ARENA SURVIVAL
   Wave Escalation, Dash Roll Invulnerability, Shield Orbs,
   Slow-Mo Matrix Powerups & Full Keyboard + Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class DodgeBallExtremeGame extends GameEngineBase {
  constructor(container, onGameOver, config = {}) {
    super(container, onGameOver, Object.assign({
      title: 'Dodgeball Arena Bullet Hell',
      targetScore: 2500,
      lives: 3
    }, config));

    this.baseWidth = 720;
    this.baseHeight = 480;
    this.createCanvas(this.baseWidth, this.baseHeight);

    this.player = {
      x: 360,
      y: 240,
      radius: 16,
      speed: 6.5,
      dashCooldown: 0,
      dashTimer: 0,
      invulnTimer: 0,
      shield: false
    };

    this.balls = [];
    this.powerups = [];
    this.particles = [];
    this.wave = 1;
    this.waveTimer = 0;
    this.slowMoTimer = 0;
    this.survivalSeconds = 0;
    this.secondAccumulator = 0;

    this.keys = { up: false, down: false, left: false, right: false };

    this.initControls();
    this.reset();

    this.showStartCard({
      title: 'Dodgeball Arena',
      icon: '🔴',
      objective: 'Survive intensifying bullet-hell waves of bouncy dodgeballs! Use your Dash Roll and collect Slow-Mo and Shield orbs!',
      controls: '<b>Desktop:</b> [WASD] or [Arrow Keys] to Move • [SPACE] Dash Roll<br><b>Mobile:</b> Touch & Drag on arena to steer, tap Dash button',
      onStart: () => {
        this.start();
      }
    });
  }

  initControls() {
    // Keyboard Controls
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = true;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = true;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = true;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerDash();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = false;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = false;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = false;
    });

    // Touch & Mouse Drag on Canvas
    let isDragging = false;
    const handlePointer = (e) => {
      if (!isDragging || this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const targetX = (e.clientX - rect.left) * scaleX;
      const targetY = (e.clientY - rect.top) * scaleY;

      // Smooth interpolation toward touch
      this.player.x += (targetX - this.player.x) * 0.25;
      this.player.y += (targetY - this.player.y) * 0.25;
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      isDragging = true;
      handlePointer(e);
    });
    this.addListener(this.canvas, 'pointermove', handlePointer);
    this.addListener(this.canvas, 'pointerup', () => { isDragging = false; });
    this.addListener(this.canvas, 'pointercancel', () => { isDragging = false; });

    // Touch D-Pad & Dash Button
    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'UP') this.keys.up = pressed;
        if (dir === 'DOWN') this.keys.down = pressed;
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
      },
      actionLabel: 'DASH ⚡',
      onAction: (pressed) => {
        if (pressed) this.triggerDash();
      }
    });
  }

  triggerDash() {
    if (this.player.dashCooldown <= 0) {
      this.player.dashTimer = 14;
      this.player.dashCooldown = 50; // ~0.8s
      this.player.invulnTimer = 18;
      sounds.playPowerup();
      this.spawnSparks(this.player.x, this.player.y, '#00e5ff', 12);
    }
  }

  reset() {
    this.player.x = 360;
    this.player.y = 240;
    this.player.lives = 3;
    this.player.shield = false;
    this.player.dashCooldown = 0;
    this.player.dashTimer = 0;
    this.player.invulnTimer = 0;

    this.balls = [];
    this.powerups = [];
    this.particles = [];
    this.wave = 1;
    this.waveTimer = 0;
    this.slowMoTimer = 0;
    this.survivalSeconds = 0;
    this.score = 0;

    this.spawnWave(1);
  }

  spawnWave(waveNum) {
    this.wave = waveNum;
    const ballCount = 4 + waveNum * 2;
    sounds.playLevelUp();

    for (let i = 0; i < ballCount; i++) {
      // Spawn around edges so not on top of player
      const edge = Math.floor(Math.random() * 4);
      let sx, sy;
      if (edge === 0) { sx = Math.random() * this.baseWidth; sy = 20; }
      else if (edge === 1) { sx = this.baseWidth - 20; sy = Math.random() * this.baseHeight; }
      else if (edge === 2) { sx = Math.random() * this.baseWidth; sy = this.baseHeight - 20; }
      else { sx = 20; sy = Math.random() * this.baseHeight; }

      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 2 + waveNum * 0.4;

      this.balls.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 12 + Math.random() * 6,
        color: waveNum % 2 === 0 ? '#f43f5e' : '#fb923c',
        trail: []
      });
    }

    // Spawn 1-2 powerups
    this.spawnPowerup();
  }

  spawnPowerup() {
    const types = ['shield', 'slowmo', 'heal'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x: 80 + Math.random() * (this.baseWidth - 160),
      y: 80 + Math.random() * (this.baseHeight - 160),
      type,
      radius: 16,
      timer: 450 // ~7s expiry
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Time & Score Accumulator
    this.secondAccumulator += dt;
    if (this.secondAccumulator >= 1.0) {
      this.secondAccumulator -= 1.0;
      this.survivalSeconds++;
      this.score += 25 * this.wave;
    }

    // Wave Progression
    this.waveTimer += dt;
    if (this.waveTimer >= 15.0) {
      this.waveTimer = 0;
      this.spawnWave(this.wave + 1);
    }

    // Slow-Mo effect
    const timeScale = this.slowMoTimer > 0 ? 0.4 : 1.0;
    if (this.slowMoTimer > 0) this.slowMoTimer -= dt;

    // Player Cooldowns
    if (this.player.dashCooldown > 0) this.player.dashCooldown--;
    if (this.player.dashTimer > 0) this.player.dashTimer--;
    if (this.player.invulnTimer > 0) this.player.invulnTimer--;

    // Player Movement
    let dx = 0;
    let dy = 0;
    if (this.keys.up) dy -= 1;
    if (this.keys.down) dy += 1;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;

    const moveSpeed = (this.player.dashTimer > 0 ? this.player.speed * 2.2 : this.player.speed);
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.player.x += (dx / len) * moveSpeed;
      this.player.y += (dy / len) * moveSpeed;
    }

    // Player Bounds
    this.player.x = Math.max(30, Math.min(this.baseWidth - 30, this.player.x));
    this.player.y = Math.max(30, Math.min(this.baseHeight - 30, this.player.y));

    // Update Balls
    for (const b of this.balls) {
      b.x += b.vx * timeScale;
      b.y += b.vy * timeScale;

      // Arena Wall Bounce
      if (b.x <= b.radius + 15 || b.x >= this.baseWidth - b.radius - 15) {
        b.vx = -b.vx;
        b.x = Math.max(b.radius + 15, Math.min(this.baseWidth - b.radius - 15, b.x));
      }
      if (b.y <= b.radius + 15 || b.y >= this.baseHeight - b.radius - 15) {
        b.vy = -b.vy;
        b.y = Math.max(b.radius + 15, Math.min(this.baseHeight - b.radius - 15, b.y));
      }

      // Ball Trails
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();

      // Check Collision with Player
      if (this.player.invulnTimer <= 0) {
        if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < b.radius + this.player.radius) {
          if (this.player.shield) {
            // Shield absorbed hit!
            this.player.shield = false;
            this.player.invulnTimer = 35;
            sounds.playPowerup();
            this.spawnSparks(this.player.x, this.player.y, '#38bdf8', 16);
          } else {
            // Player Damaged!
            this.player.lives--;
            this.player.invulnTimer = 50;
            sounds.playHit();
            this.spawnSparks(this.player.x, this.player.y, '#ef4444', 20);

            if (this.player.lives <= 0) {
              this.finishGame(this.score, {
                isVictory: this.survivalSeconds >= 45,
                stars: this.survivalSeconds >= 60 ? 3 : (this.survivalSeconds >= 35 ? 2 : 1),
                coinsEarned: Math.round(this.score * 0.05)
              });
              return;
            }
          }
        }
      }
    }

    // Update Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.timer--;
      if (p.timer <= 0) {
        this.powerups.splice(i, 1);
        continue;
      }

      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < p.radius + this.player.radius) {
        // Collect Powerup
        if (p.type === 'shield') this.player.shield = true;
        if (p.type === 'slowmo') this.slowMoTimer = 6.0;
        if (p.type === 'heal') this.player.lives = Math.min(3, this.player.lives + 1);

        this.score += 200;
        sounds.playCoin();
        this.spawnSparks(p.x, p.y, '#ffd166', 15);
        this.powerups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 0.03;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  spawnSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color,
        alpha: 1
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Arena Floor
    const court = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    court.addColorStop(0, '#111827');
    court.addColorStop(1, '#0f172a');
    ctx.fillStyle = court;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Court Boundary Lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, this.baseWidth - 40, this.baseHeight - 40);

    // Center Arena Circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(this.baseWidth / 2, this.baseHeight / 2, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Dodgeball Trails
    for (const b of this.balls) {
      for (let i = 0; i < b.trail.length; i++) {
        ctx.fillStyle = b.color;
        ctx.globalAlpha = (i / b.trail.length) * 0.35;
        ctx.beginPath();
        ctx.arc(b.trail[i].x, b.trail[i].y, b.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Draw Dodgeballs
    for (const b of this.balls) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball seam highlight
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x - 3, b.y - 3, b.radius * 0.5, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Powerups
    for (const p of this.powerups) {
      ctx.save();
      const color = p.type === 'shield' ? '#38bdf8' : (p.type === 'slowmo' ? '#a855f7' : '#22c55e');
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      const icon = p.type === 'shield' ? '🛡️' : (p.type === 'slowmo' ? '⏳' : '❤️');
      ctx.fillText(icon, p.x, p.y + 4);
      ctx.restore();
    }

    // Draw Particles
    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Player
    const isFlashing = this.player.invulnTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0;
    if (!isFlashing) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      // Shield Aura
      if (this.player.shield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.player.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Player Body
      ctx.fillStyle = this.player.dashTimer > 0 ? '#ffffff' : '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#0a0e17';
      ctx.beginPath();
      ctx.arc(4, -3, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Top HUD
    this.renderHUD(ctx);
  }

  renderHUD(ctx) {
    ctx.save();

    // Score & Time Pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(30, 26, 250, 44);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(30, 26, 250, 44);

    ctx.font = '900 18px Lilita One, Outfit, sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`SCORE: ${this.score}`, 44, 46);

    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`WAVE ${this.wave} • ${this.survivalSeconds}s SURVIVED`, 44, 62);

    // Hearts (Lives)
    const heartX = this.baseWidth - 140;
    ctx.font = '22px sans-serif';
    let heartStr = '';
    for (let i = 0; i < 3; i++) {
      heartStr += i < this.player.lives ? '❤️' : '🖤';
    }
    ctx.fillText(heartStr, heartX, 55);

    // Slow-Mo Callout
    if (this.slowMoTimer > 0) {
      ctx.fillStyle = '#a855f7';
      ctx.font = '900 18px Lilita One, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏳ MATRIX SLOW-MO ACTIVE!', this.baseWidth / 2, 45);
    }

    ctx.restore();
  }
}
