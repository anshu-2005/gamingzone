import { GameEngineBase } from '../core/GameEngineBase.js';

export class FactoryDefenseRTS extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Factory Defense RTS: Automata';
    this.copper = 100;
    this.lead = 60;
    this.coreHp = 1000;
    this.wave = 1;
    this.waveTimer = 15;
    this.gameOver = false;
    this.selectedTool = 'turret'; // 'miner', 'conveyor', 'turret'

    this.grid = []; // 16x10 grid
    this.bullets = [];
    this.enemies = [];
    this.miners = [];
    this.turrets = [];
  }

  onInit() {
    this.createCanvas();
    this.setupGrid();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));

    this.showStartCard(
      'FACTORY DEFENSE RTS',
      'Automation Tower Defense inspired by Mindustry! Mine copper ore, build conveyor logistics, and place rapid-fire defense turrets to protect your Core against alien crawler waves!',
      'DEPLOY BASE'
    );
  }

  setupGrid() {
    this.grid = Array.from({ length: 10 }, () => Array(16).fill('empty'));
    // Core base at bottom middle (8, 4..5)
    this.grid[8][7] = 'core';
    this.grid[8][8] = 'core';

    // Ore deposits
    this.grid[6][2] = 'ore';
    this.grid[6][3] = 'ore';
    this.grid[6][12] = 'ore';
    this.grid[6][13] = 'ore';
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Tool selector bar at bottom [200..700, 500..550]
    if (my >= 490 && my <= 550) {
      if (mx >= 260 && mx <= 380) { this.selectedTool = 'miner'; return; }
      if (mx >= 400 && mx <= 520) { this.selectedTool = 'conveyor'; return; }
      if (mx >= 540 && mx <= 660) { this.selectedTool = 'turret'; return; }
    }

    // Grid placement [80..920, 80..480]
    const startX = 100;
    const startY = 80;
    const size = 50;

    if (mx >= startX && mx <= startX + 16 * size && my >= startY && my <= startY + 8 * size) {
      const col = Math.floor((mx - startX) / size);
      const row = Math.floor((my - startY) / size);

      if (this.grid[row][col] === 'empty' || (this.grid[row][col] === 'ore' && this.selectedTool === 'miner')) {
        if (this.selectedTool === 'miner' && this.copper >= 30) {
          this.copper -= 30;
          this.grid[row][col] = 'miner';
          this.miners.push({ r: row, c: col, x: startX + col * size + 25, y: startY + row * size + 25 });
        } else if (this.selectedTool === 'conveyor' && this.copper >= 5) {
          this.copper -= 5;
          this.grid[row][col] = 'conveyor';
        } else if (this.selectedTool === 'turret' && this.copper >= 45 && this.lead >= 25) {
          this.copper -= 45;
          this.lead -= 25;
          this.grid[row][col] = 'turret';
          this.turrets.push({
            r: row,
            c: col,
            x: startX + col * size + 25,
            y: startY + row * size + 25,
            cooldown: 0,
            angle: -Math.PI / 2
          });
        }
      }
    }
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    // Miners generate copper
    for (const m of this.miners) {
      this.copper += dt * 3.5;
      this.lead += dt * 1.5;
    }

    // Wave countdown
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.waveTimer = 22;
      this.spawnWave();
    }

    // Turret aiming and firing
    for (const t of this.turrets) {
      t.cooldown -= dt;
      // Find closest enemy
      let closest = null;
      let minDist = 220; // range
      for (const e of this.enemies) {
        const dist = Math.hypot(e.x - t.x, e.y - t.y);
        if (dist < minDist) {
          minDist = dist;
          closest = e;
        }
      }

      if (closest) {
        t.angle = Math.atan2(closest.y - t.y, closest.x - t.x);
        if (t.cooldown <= 0) {
          t.cooldown = 0.28;
          this.bullets.push({
            x: t.x,
            y: t.y,
            vx: Math.cos(t.angle) * 450,
            vy: Math.sin(t.angle) * 450,
            life: 0.6
          });
        }
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Hit enemy check
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 4) {
          e.hp -= 20;
          b.life = 0;
          if (e.hp <= 0) {
            this.copper += 10;
            this.enemies.splice(j, 1);
          }
          break;
        }
      }

      if (b.life <= 0) this.bullets.splice(i, 1);
    }

    // Update enemies moving towards Core base (approx x: 500, y: 480)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const targetX = 500;
      const targetY = 480;
      const angle = Math.atan2(targetY - e.y, targetX - e.x);

      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;

      // Core hit
      if (Math.hypot(e.x - targetX, e.y - targetY) < 35) {
        this.coreHp -= 40;
        this.enemies.splice(i, 1);
        if (this.coreHp <= 0) {
          this.coreHp = 0;
          this.gameOver = true;
          break;
        }
      }
    }
  }

  spawnWave() {
    this.wave++;
    const count = 5 + this.wave * 3;
    for (let i = 0; i < count; i++) {
      this.enemies.push({
        x: 120 + Math.random() * 760,
        y: 80 - Math.random() * 80,
        speed: 55 + Math.random() * 30,
        radius: 12,
        hp: 35 + this.wave * 10
      });
    }
  }

  onRender(ctx) {
    // Terrain Surface
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1000, 562);

    // Grid cells
    const startX = 100;
    const startY = 80;
    const size = 50;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 16; c++) {
        const x = startX + c * size;
        const y = startY + r * size;
        const cell = this.grid[r][c];

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);

        if (cell === 'ore') {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        } else if (cell === 'miner') {
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.roundRect(x + 6, y + 6, size - 12, size - 12, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⛏️', x + size / 2, y + size / 2 + 5);
        } else if (cell === 'conveyor') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(x + 12, y + 4, size - 24, size - 8);
        } else if (cell === 'turret') {
          ctx.fillStyle = '#065f46';
          ctx.beginPath();
          ctx.roundRect(x + 6, y + 6, size - 12, size - 12, 6);
          ctx.fill();
        }
      }
    }

    // Core Base
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(450, 440, 100, 45, 8);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CORE VAULT', 500, 468);

    // Turret Barrels
    for (const t of this.turrets) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, -5, 20, 10);
      ctx.restore();
    }

    // Bullets
    ctx.fillStyle = '#fde047';
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemies (Crawlers)
    for (const e of this.enemies) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 60);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏭 FACTORY DEFENSE RTS', 30, 38);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`COPPER: ${Math.floor(this.copper)}  |  LEAD: ${Math.floor(this.lead)}  |  CORE HP: ${this.coreHp}  |  WAVE: ${this.wave}`, 970, 38);

    // Bottom Tool Selector
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 490, 1000, 72);

    const tools = [
      { id: 'miner', label: '⛏️ MINER ($30)', x: 260 },
      { id: 'conveyor', label: '⏩ CONVEYOR ($5)', x: 400 },
      { id: 'turret', label: '🎯 TURRET ($45C/$25L)', x: 540 }
    ];

    tools.forEach(t => {
      const active = this.selectedTool === t.id;
      ctx.fillStyle = active ? '#38bdf8' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(t.x, 502, 130, 45, 6);
      ctx.fill();
      ctx.fillStyle = active ? '#000000' : '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.label, t.x + 65, 528);
    });

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CORE OVERRUN!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`SURVIVED UP TO WAVE ${this.wave}`, 500, 290);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('REBUILD BASE', 500, 362);
    }
  }
}
