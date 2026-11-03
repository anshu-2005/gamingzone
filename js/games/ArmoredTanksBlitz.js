import { GameEngineBase } from '../core/GameEngineBase.js';

export class ArmoredTanksBlitz extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Armored Tanks Blitz: Steel War';
    this.score = 0;
    this.tanksDestroyed = 0;
    this.gameOver = false;

    this.tank = {
      x: 500,
      y: 400,
      hullAngle: -Math.PI / 2,
      turretAngle: -Math.PI / 2,
      speed: 150,
      turnSpeed: 2.5,
      hp: 100,
      maxHp: 100,
      cooldown: 0
    };

    this.keys = { left: false, right: false, up: false, down: false };
    this.shells = [];
    this.enemyShells = [];
    this.enemies = [];
    this.particles = [];
    this.obstacles = [];
    this.mouse = { x: 500, y: 200 };
  }

  onInit() {
    this.createCanvas();
    this.setupBattlefield();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
      if (e.code === 'Space') this.fireCannon();
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
    });

    this.addEventListenerTracked(this.canvas, 'mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
      else this.fireCannon();
    });

    this.showStartCard(
      'ARMORED TANKS BLITZ',
      'Tactical armored tank warfare! Drive tank treads with [WASD / Arrows], aim 360° turret with Mouse, and fire armor-piercing shells with Left Click or [Space]! Destroy enemy panzers before they breach your front armor.',
      'DEPLOY TANK'
    );
  }

  setupBattlefield() {
    this.score = 0;
    this.tanksDestroyed = 0;
    this.gameOver = false;
    this.tank.x = 500;
    this.tank.y = 440;
    this.tank.hp = 100;
    this.shells = [];
    this.enemyShells = [];
    this.enemies = [];
    this.particles = [];

    // Obstacles
    this.obstacles = [
      { x: 250, y: 220, w: 80, h: 50 },
      { x: 670, y: 220, w: 80, h: 50 },
      { x: 460, y: 300, w: 80, h: 40 }
    ];

    // Initial enemies
    this.spawnEnemy(250, 120);
    this.spawnEnemy(750, 120);
  }

  restart() {
    this.setupBattlefield();
  }

  spawnEnemy(x, y) {
    this.enemies.push({
      x,
      y,
      hullAngle: Math.PI / 2,
      turretAngle: Math.PI / 2,
      hp: 50,
      cooldown: 1.5 + Math.random()
    });
  }

  fireCannon() {
    if (this.tank.cooldown > 0 || this.gameOver) return;
    this.tank.cooldown = 0.45;

    const barrelLen = 32;
    const sx = this.tank.x + Math.cos(this.tank.turretAngle) * barrelLen;
    const sy = this.tank.y + Math.sin(this.tank.turretAngle) * barrelLen;

    this.shells.push({
      x: sx,
      y: sy,
      vx: Math.cos(this.tank.turretAngle) * 520,
      vy: Math.sin(this.tank.turretAngle) * 520,
      life: 1.2
    });
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    this.tank.cooldown -= dt;

    // Tank Steering (hull rotation)
    if (this.keys.left) this.tank.hullAngle -= this.tank.turnSpeed * dt;
    if (this.keys.right) this.tank.hullAngle += this.tank.turnSpeed * dt;

    // Tank Drive
    let move = 0;
    if (this.keys.up) move += 1;
    if (this.keys.down) move -= 0.6;

    this.tank.x += Math.cos(this.tank.hullAngle) * move * this.tank.speed * dt;
    this.tank.y += Math.sin(this.tank.hullAngle) * move * this.tank.speed * dt;

    // Bounds
    this.tank.x = Math.max(60, Math.min(940, this.tank.x));
    this.tank.y = Math.max(80, Math.min(520, this.tank.y));

    // Turret tracks mouse
    this.tank.turretAngle = Math.atan2(this.mouse.y - this.tank.y, this.mouse.x - this.tank.x);

    // Update player shells
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;

      // Hit enemy check
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(s.x - e.x, s.y - e.y) < 28) {
          e.hp -= 35;
          s.life = 0;
          this.explode(s.x, s.y, '#f59e0b');
          if (e.hp <= 0) {
            this.explode(e.x, e.y, '#ef4444');
            this.tanksDestroyed++;
            this.score += 400;
            this.enemies.splice(j, 1);
            // Spawn next reinforcement
            setTimeout(() => {
              this.spawnEnemy(150 + Math.random() * 700, 110 + Math.random() * 80);
            }, 1500);
          }
          break;
        }
      }

      if (s.life <= 0) this.shells.splice(i, 1);
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.cooldown -= dt;
      e.turretAngle = Math.atan2(this.tank.y - e.y, this.tank.x - e.x);

      // Enemy fire
      if (e.cooldown <= 0) {
        e.cooldown = 1.8 + Math.random();
        this.enemyShells.push({
          x: e.x + Math.cos(e.turretAngle) * 28,
          y: e.y + Math.sin(e.turretAngle) * 28,
          vx: Math.cos(e.turretAngle) * 360,
          vy: Math.sin(e.turretAngle) * 360,
          life: 1.5
        });
      }
    }

    // Update enemy shells
    for (let i = this.enemyShells.length - 1; i >= 0; i--) {
      const es = this.enemyShells[i];
      es.x += es.vx * dt;
      es.y += es.vy * dt;
      es.life -= dt;

      if (Math.hypot(es.x - this.tank.x, es.y - this.tank.y) < 24) {
        this.tank.hp -= 15;
        this.explode(this.tank.x, this.tank.y, '#ef4444');
        es.life = 0;
        if (this.tank.hp <= 0) {
          this.tank.hp = 0;
          this.gameOver = true;
          break;
        }
      }

      if (es.life <= 0) this.enemyShells.splice(i, 1);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  explode(x, y, color) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color,
        life: 0.5
      });
    }
  }

  onRender(ctx) {
    // Muddy Battlefield Ground
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 1000, 562);

    // Obstacle barricades
    for (const ob of this.obstacles) {
      ctx.fillStyle = '#44403c';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 2;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
    }

    // Player Shells
    ctx.fillStyle = '#fde047';
    for (const s of this.shells) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemy Shells
    ctx.fillStyle = '#ef4444';
    for (const es of this.enemyShells) {
      ctx.beginPath();
      ctx.arc(es.x, es.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Enemies
    for (const e of this.enemies) {
      this.drawTank(ctx, e.x, e.y, e.hullAngle, e.turretAngle, '#7f1d1d', '#b91c1c');
    }

    // Render Player Tank
    if (!this.gameOver) {
      this.drawTank(ctx, this.tank.x, this.tank.y, this.tank.hullAngle, this.tank.turretAngle, '#065f46', '#10b981');
    }

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🛡️ ARMORED TANKS BLITZ', 30, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  ARMOR: ${this.tank.hp}%  |  DESTROYED: ${this.tanksDestroyed}`, 970, 38);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TANK DESTROYED!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`KILLS: ${this.tanksDestroyed}  |  SCORE: ${this.score}`, 500, 290);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('REDEPLOY TANK', 500, 362);
    }
  }

  drawTank(ctx, x, y, hullAngle, turretAngle, hullColor, turretColor) {
    ctx.save();
    ctx.translate(x, y);

    // Hull
    ctx.save();
    ctx.rotate(hullAngle);
    // Treads
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-22, -18, 44, 8);
    ctx.fillRect(-22, 10, 44, 8);
    // Armor body
    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.roundRect(-18, -12, 36, 24, 4);
    ctx.fill();
    ctx.restore();

    // Turret & Cannon
    ctx.save();
    ctx.rotate(turretAngle);
    // Cannon barrel
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, -3, 30, 6);
    // Turret dome
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}

