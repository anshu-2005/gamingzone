/* ====================================================
   GALAXY SHOOTER — GAMINGZONE
   Vertical Shmup with Parallax Starfields, Plasma Upgrades,
   Alien Swarm Dive Bombers, Powerups & Full Touch/Keyboard Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class GalaxyShooterGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Galaxy Shooter',
      targetScore: 3000,
      lives: 3,
      ...config
    });

    this.player = {
      x: 0,
      y: 0,
      width: 44,
      height: 44,
      speed: 360,
      weaponLevel: 1
    };

    this.lasers = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.stars = [];

    this.shootCooldown = 0;
    this.spawnTimer = 0;
    this.wave = 1;

    this.keys = { left: false, right: false, up: false, down: false, shoot: false };

    this.createCanvas(540, 680);
    this.initPlayer();
    this.initStars();
    this.initGalaxyControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
        if (dir === 'UP') this.keys.up = pressed;
        if (dir === 'DOWN') this.keys.down = pressed;
      },
      actionLabel: 'FIRE',
      onAction: (pressed) => {
        this.keys.shoot = pressed;
      }
    });

    this.showStartCard({
      title: 'GALAXY SHOOTER',
      icon: '🚀',
      objective: 'Defeat waves of invading alien spacecraft, collect glowing plasma capsules to upgrade weapons!',
      controls: 'Arrow Keys / WASD to fly, Space or Touch Button to fire (or drag ship directly).',
      onStart: () => this.start()
    });
  }

  initPlayer() {
    this.player.x = (this.baseWidth - this.player.width) / 2;
    this.player.y = this.baseHeight - 90;
    this.player.weaponLevel = 1;
    this.lives = 3;
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: Math.random() * this.baseWidth,
        y: Math.random() * this.baseHeight,
        speed: 40 + Math.random() * 120,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.3 ? '#ffffff' : '#00e5ff'
      });
    }
  }

  initGalaxyControls() {
    // Keyboard Controls
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
      if (e.code === 'Space' || e.key === ' ') {
        this.keys.shoot = true;
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
      if (e.code === 'Space' || e.key === ' ') this.keys.shoot = false;
    });

    // Direct Finger / Mouse Drag to steer
    this.addListener(this.canvas, 'pointermove', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this.player.x = Math.max(10, Math.min(this.baseWidth - this.player.width - 10, mx - this.player.width / 2));
      this.player.y = Math.max(60, Math.min(this.baseHeight - this.player.height - 20, my - this.player.height / 2));
    });
  }

  fireLasers() {
    const cx = this.player.x + this.player.width / 2;
    const cy = this.player.y;

    if (this.player.weaponLevel === 1) {
      // Single laser
      this.lasers.push({ x: cx - 2, y: cy, vx: 0, vy: -750, color: '#00e5ff', damage: 20 });
    } else if (this.player.weaponLevel === 2) {
      // Dual laser
      this.lasers.push({ x: cx - 12, y: cy, vx: 0, vy: -750, color: '#00e5ff', damage: 20 });
      this.lasers.push({ x: cx + 12, y: cy, vx: 0, vy: -750, color: '#00e5ff', damage: 20 });
    } else {
      // Triple spread laser
      this.lasers.push({ x: cx - 14, y: cy, vx: -120, vy: -750, color: '#10b981', damage: 25 });
      this.lasers.push({ x: cx, y: cy, vx: 0, vy: -750, color: '#ffd166', damage: 30 });
      this.lasers.push({ x: cx + 14, y: cy, vx: 120, vy: -750, color: '#10b981', damage: 25 });
    }

    sounds.playLaser();
  }

  spawnEnemy() {
    const isHeavy = Math.random() < 0.25;
    this.enemies.push({
      x: 30 + Math.random() * (this.baseWidth - 100),
      y: -40,
      width: isHeavy ? 48 : 34,
      height: isHeavy ? 48 : 34,
      vy: isHeavy ? 90 : 160 + Math.random() * 50,
      hp: isHeavy ? 60 : 20,
      maxHp: isHeavy ? 60 : 20,
      isHeavy,
      color: isHeavy ? '#ef4444' : '#f59e0b',
      oscillation: Math.random() * Math.PI * 2
    });
  }

  update(dt) {
    // Parallax background stars
    this.stars.forEach(s => {
      s.y += s.speed * dt;
      if (s.y > this.baseHeight) {
        s.y = 0;
        s.x = Math.random() * this.baseWidth;
      }
    });

    // Keyboard movement
    let moveX = 0;
    let moveY = 0;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;
    if (this.keys.up) moveY -= 1;
    if (this.keys.down) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      this.player.x += moveX * this.player.speed * dt;
      this.player.y += moveY * this.player.speed * dt;
      this.player.x = Math.max(10, Math.min(this.baseWidth - this.player.width - 10, this.player.x));
      this.player.y = Math.max(60, Math.min(this.baseHeight - this.player.height - 20, this.player.y));
    }

    // Auto-fire or manual fire
    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0) {
      this.shootCooldown = 0.18;
      this.fireLasers();
    }

    // Spawning enemies
    this.spawnTimer += dt;
    if (this.spawnTimer >= 0.95) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      if (l.y < -20) {
        this.lasers.splice(i, 1);
      }
    }

    // Update Enemies & Collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.vy * dt;
      e.oscillation += dt * 3;
      e.x += Math.sin(e.oscillation) * 40 * dt;

      // Enemy hit player
      if (
        this.player.x < e.x + e.width &&
        this.player.x + this.player.width > e.x &&
        this.player.y < e.y + e.height &&
        this.player.y + this.player.height > e.y
      ) {
        this.lives--;
        sounds.playHit();
        this.spawnExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ef4444');
        this.enemies.splice(i, 1);

        if (this.lives <= 0) {
          this.finishGame(this.score, { isVictory: false });
          return;
        }
        continue;
      }

      // Check collision with player lasers
      for (let j = this.lasers.length - 1; j >= 0; j--) {
        const l = this.lasers[j];
        if (
          l.x >= e.x && l.x <= e.x + e.width &&
          l.y >= e.y && l.y <= e.y + e.height
        ) {
          e.hp -= l.damage;
          this.spawnExplosion(l.x, l.y, l.color, 4);
          this.lasers.splice(j, 1);

          if (e.hp <= 0) {
            // Destroy enemy!
            this.score += e.isHeavy ? 150 : 60;
            sounds.playWin();
            this.spawnExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color, 16);

            // Chance to drop powerup capsule
            if (Math.random() < 0.22) {
              this.powerups.push({
                x: e.x + e.width / 2,
                y: e.y + e.height / 2,
                vy: 110,
                type: Math.random() < 0.7 ? 'weapon' : 'shield'
              });
            }

            this.enemies.splice(i, 1);
            break;
          }
        }
      }

      // Escape bottom
      if (e.y > this.baseHeight + 40) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Powerup Capsules
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy * dt;

      // Player pickup
      if (
        this.player.x < p.x + 20 &&
        this.player.x + this.player.width > p.x - 20 &&
        this.player.y < p.y + 20 &&
        this.player.y + this.player.height > p.y - 20
      ) {
        if (p.type === 'weapon') {
          this.player.weaponLevel = Math.min(3, this.player.weaponLevel + 1);
        } else {
          this.lives = Math.min(3, this.lives + 1);
        }
        sounds.playPowerup();
        this.score += 100;
        this.spawnExplosion(p.x, p.y, '#ffd166', 12);
        this.powerups.splice(i, 1);
      } else if (p.y > this.baseHeight + 30) {
        this.powerups.splice(i, 1);
      }
    }

    // Check Victory
    if (this.score >= this.config.targetScore) {
      sounds.playWin();
      this.finishGame(this.score, { isVictory: true });
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.5) * 260,
        color,
        life: 0.45
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Star Cosmos Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Render Stars
    this.stars.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Render Lasers
    this.lasers.forEach(l => {
      ctx.fillStyle = l.color;
      ctx.fillRect(l.x - 2, l.y, 4, 18);
    });

    // Render Powerups
    this.powerups.forEach(p => {
      ctx.fillStyle = p.type === 'weapon' ? '#ffd166' : '#10b981';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'weapon' ? '⚡' : '❤️', p.x, p.y);
    });

    // Render Enemies
    this.enemies.forEach(e => {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      // Triangle Alien Jet
      ctx.moveTo(e.x + e.width / 2, e.y + e.height);
      ctx.lineTo(e.x, e.y);
      ctx.lineTo(e.x + e.width, e.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Render Player Ship
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    // Jet Engine Thruster flame
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(px + pw / 2 - 8, py + ph);
    ctx.lineTo(px + pw / 2, py + ph + 16 + Math.random() * 8);
    ctx.lineTo(px + pw / 2 + 8, py + ph);
    ctx.fill();

    // Spaceship Hull
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(px + pw / 2, py);
    ctx.lineTo(px + pw, py + ph);
    ctx.lineTo(px + pw / 2, py + ph - 8);
    ctx.lineTo(px, py + ph);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cockpit Window
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(px + pw / 2, py + ph / 2, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🚀 WEAPON: LVL ${this.player.weaponLevel}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`SHIELDS: ${'❤️'.repeat(Math.max(0, this.lives))}`, this.baseWidth - 24, 34);
  }
}
