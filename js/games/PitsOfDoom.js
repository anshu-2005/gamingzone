/* ====================================================
   PITS OF DOOM — DUNGEON ROGUELIKE RPG
   Inspired by design1online/PitsOfDoom
   Procedural dungeon exploration, treacherous chasm pits,
   crypt monsters, treasure chests, traps & deep level descent.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PitsOfDoomGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Pits of Doom RPG',
      targetScore: 3000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.dungeonFloor = 1;
    this.hero = {
      gridX: 2,
      gridY: 2,
      x: 100,
      y: 100,
      hp: 120,
      maxHp: 120,
      atk: 22,
      potions: 2,
      gold: 0,
      classType: 'Knight',
      isMoving: false
    };

    this.cols = 13;
    this.rows = 8;
    this.tileSize = 64;
    this.offsetX = 14;
    this.offsetY = 32;

    this.grid = []; // 0: floor, 1: wall, 2: pit, 3: stairs
    this.enemies = [];
    this.chests = [];
    this.floatingTexts = [];
    this.particles = [];

    this.generateFloor(this.dungeonFloor);
    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        if (dir === 'UP') this.moveHero(0, -1);
        if (dir === 'DOWN') this.moveHero(0, 1);
        if (dir === 'LEFT') this.moveHero(-1, 0);
        if (dir === 'RIGHT') this.moveHero(1, 0);
      },
      onAction: (pressed) => {
        if (pressed) this.usePotion();
      },
      actionLabel: '🧪 POTION',
      showDpad: true
    });

    this.showStartCard({
      title: 'PITS OF DOOM RPG',
      icon: '💀',
      objective: 'Descend through dangerous crypts, avoid bottomless pits, slay skeleton fiends, and claim dungeon relics!',
      controls: 'Arrow Keys / WASD to Walk • H key for Potion • Step into enemies to attack'
    });
  }

  generateFloor(floorNum) {
    this.grid = [];
    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        // Border walls
        if (x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1) {
          this.grid[y][x] = 1;
        } else {
          // Chance of pit (perilous chasm)
          const isPit = Math.random() < 0.12 && !(x === 2 && y === 2);
          this.grid[y][x] = isPit ? 2 : 0;
        }
      }
    }

    // Place exit stairs
    this.exitStairs = { x: this.cols - 2, y: this.rows - 2 };
    this.grid[this.exitStairs.y][this.exitStairs.x] = 3;

    // Reset Hero position
    this.hero.gridX = 1;
    this.hero.gridY = 1;
    this.hero.x = this.offsetX + this.hero.gridX * this.tileSize;
    this.hero.y = this.offsetY + this.hero.gridY * this.tileSize;

    // Spawn enemies
    this.enemies = [];
    const enemyCount = 3 + floorNum;
    for (let i = 0; i < enemyCount; i++) {
      let ex = Math.floor(Math.random() * (this.cols - 2)) + 1;
      let ey = Math.floor(Math.random() * (this.rows - 2)) + 1;
      if (this.grid[ey][ex] === 0 && (ex > 3 || ey > 3)) {
        this.enemies.push({
          gridX: ex,
          gridY: ey,
          x: this.offsetX + ex * this.tileSize,
          y: this.offsetY + ey * this.tileSize,
          hp: 35 + floorNum * 12,
          maxHp: 35 + floorNum * 12,
          atk: 8 + floorNum * 3,
          type: floorNum >= 3 && i === 0 ? 'Pit Demon' : 'Crypt Ghoul',
          color: floorNum >= 3 && i === 0 ? '#ef4444' : '#a855f7'
        });
      }
    }

    // Spawn treasure chests
    this.chests = [];
    for (let i = 0; i < 3; i++) {
      let cx = Math.floor(Math.random() * (this.cols - 2)) + 1;
      let cy = Math.floor(Math.random() * (this.rows - 2)) + 1;
      if (this.grid[cy][cx] === 0 && !(cx === 1 && cy === 1)) {
        this.chests.push({ gridX: cx, gridY: cy, opened: false });
      }
    }

    this.addFloatingText(this.hero.x, this.hero.y - 20, `ENTERED DUNGEON DEPTH ${floorNum}`, '#00e5ff');
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;

      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.moveHero(0, -1);
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.moveHero(0, 1);
      } else if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this.moveHero(-1, 0);
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.moveHero(1, 0);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        this.usePotion();
      }
    });
  }

  usePotion() {
    if (this.hero.potions > 0 && this.hero.hp < this.hero.maxHp) {
      this.hero.potions--;
      this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 45);
      this.addFloatingText(this.hero.x, this.hero.y - 20, '+45 HP RESTORED', '#10b981');
      sounds.playScore?.();
    }
  }

  moveHero(dx, dy) {
    const targetX = this.hero.gridX + dx;
    const targetY = this.hero.gridY + dy;

    // Check bounds & wall
    if (targetX < 0 || targetX >= this.cols || targetY < 0 || targetY >= this.rows) return;
    if (this.grid[targetY][targetX] === 1) {
      sounds.playHit?.();
      return;
    }

    // Check combat with enemy on target tile
    const enemy = this.enemies.find((e) => e.gridX === targetX && e.gridY === targetY);
    if (enemy) {
      this.heroAttack(enemy);
      this.enemyTurn();
      return;
    }

    // Move hero
    this.hero.gridX = targetX;
    this.hero.gridY = targetY;
    sounds.playJump?.();

    // Check Pit trap hazard
    if (this.grid[targetY][targetX] === 2) {
      const pitDamage = 30;
      this.hero.hp -= pitDamage;
      this.addFloatingText(this.hero.x, this.hero.y - 20, `FELL INTO PIT! -${pitDamage} HP`, '#ef4444');
      sounds.playCrash?.();

      if (this.hero.hp <= 0) {
        this.finishGame(this.score, { reason: 'Fell into the Bottomless Abyss' });
        return;
      }
    }

    // Check Chest
    const chest = this.chests.find((c) => c.gridX === targetX && c.gridY === targetY && !c.opened);
    if (chest) {
      chest.opened = true;
      const lootGold = 100 + Math.floor(Math.random() * 80);
      this.hero.gold += lootGold;
      this.score += lootGold * 2;
      this.hero.potions++;
      this.addFloatingText(this.hero.x, this.hero.y - 20, `LOOT: +${lootGold} GOLD & 🧪 POTION`, '#fbbf24');
      sounds.playScore?.();
    }

    // Check Descent Stairs
    if (this.grid[targetY][targetX] === 3) {
      this.dungeonFloor++;
      this.score += 500;
      sounds.playLevelUp?.();
      this.generateFloor(this.dungeonFloor);
      return;
    }

    // Enemies take their turn
    this.enemyTurn();
  }

  heroAttack(enemy) {
    const dmg = this.hero.atk + Math.floor(Math.random() * 10);
    enemy.hp -= dmg;
    this.addFloatingText(enemy.x, enemy.y - 18, `-${dmg}`, '#00e5ff');
    sounds.playHit?.();

    // Blood / impact particles
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: enemy.x + 32,
        y: enemy.y + 32,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 0.3,
        maxLife: 0.3,
        color: '#ef4444'
      });
    }

    if (enemy.hp <= 0) {
      this.score += 250;
      this.addFloatingText(enemy.x, enemy.y - 25, '+250 SCORE', '#fbbf24');
      this.enemies = this.enemies.filter((e) => e !== enemy);
    }
  }

  enemyTurn() {
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.gridX - this.hero.gridX, enemy.gridY - this.hero.gridY);

      // Adjacent: Attack Hero
      if (dist <= 1.1) {
        this.hero.hp -= enemy.atk;
        this.addFloatingText(this.hero.x, this.hero.y - 20, `ENEMY STRIKE! -${enemy.atk}`, '#ef4444');
        sounds.playCrash?.();

        if (this.hero.hp <= 0) {
          this.finishGame(this.score, { reason: 'Slain in the Pits of Doom' });
          return;
        }
      } else if (dist < 5) {
        // Step closer to hero
        let stepX = 0;
        let stepY = 0;
        if (Math.abs(this.hero.gridX - enemy.gridX) > Math.abs(this.hero.gridY - enemy.gridY)) {
          stepX = this.hero.gridX > enemy.gridX ? 1 : -1;
        } else {
          stepY = this.hero.gridY > enemy.gridY ? 1 : -1;
        }

        const nx = enemy.gridX + stepX;
        const ny = enemy.gridY + stepY;

        // Enemy cannot walk into wall or pit
        if (this.grid[ny] && this.grid[ny][nx] === 0) {
          const occupied = this.enemies.some((e) => e !== enemy && e.gridX === nx && e.gridY === ny);
          if (!occupied && !(this.hero.gridX === nx && this.hero.gridY === ny)) {
            enemy.gridX = nx;
            enemy.gridY = ny;
          }
        }
      }
    }
  }

  addFloatingText(x, y, text, color = '#fff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.0, maxLife: 1.0 });
  }

  update(dt) {
    // Smooth visual interpolation
    const targetX = this.offsetX + this.hero.gridX * this.tileSize;
    const targetY = this.offsetY + this.hero.gridY * this.tileSize;
    this.hero.x += (targetX - this.hero.x) * 12 * dt;
    this.hero.y += (targetY - this.hero.y) * 12 * dt;

    for (const enemy of this.enemies) {
      const ex = this.offsetX + enemy.gridX * this.tileSize;
      const ey = this.offsetY + enemy.gridY * this.tileSize;
      enemy.x += (ex - enemy.x) * 12 * dt;
      enemy.y += (ey - enemy.y) * 12 * dt;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Dark dungeon atmosphere
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Render Grid
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;
        const type = this.grid[y][x];

        if (type === 1) {
          // Stone Wall
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);
        } else if (type === 2) {
          // Dark Pit Chasm
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);
          ctx.fillStyle = '#ef4444';
          ctx.font = '12px Outfit';
          ctx.fillText('PIT', px + 22, py + 36);
        } else if (type === 3) {
          // Stairs Down
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(px + 8, py + 8, this.tileSize - 16, this.tileSize - 16);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 20px Outfit';
          ctx.fillText('▼', px + 24, py + 40);
        } else {
          // Dungeon Floor
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.strokeRect(px, py, this.tileSize, this.tileSize);
        }
      }
    }

    // Render Chests
    for (const chest of this.chests) {
      const cx = this.offsetX + chest.gridX * this.tileSize;
      const cy = this.offsetY + chest.gridY * this.tileSize;
      ctx.fillStyle = chest.opened ? '#475569' : '#eab308';
      ctx.fillRect(cx + 18, cy + 18, 28, 28);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(cx + 18, cy + 18, 28, 28);
    }

    // Render Enemies
    for (const enemy of this.enemies) {
      ctx.save();
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x + 32, enemy.y + 32, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Enemy HP
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 12, enemy.y + 4, 40, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(enemy.x + 12, enemy.y + 4, 40 * (enemy.hp / enemy.maxHp), 5);
      ctx.restore();
    }

    // Render Hero
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(this.hero.x + 16, this.hero.y + 16, 32, 32);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(this.hero.x + 16, this.hero.y + 16, 32, 32);
    ctx.restore();

    // Floating text popups
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x + 10, ft.y);
      ctx.restore();
    }

    // Header HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 36);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText(`DUNGEON DEPTH: B${this.dungeonFloor}F`, 20, 24);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`HP: ${Math.round(this.hero.hp)}/${this.hero.maxHp}`, 210, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`POTIONS: 🧪 ${this.hero.potions}`, 340, 24);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`GOLD: 🪙 ${this.hero.gold}`, 460, 24);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`SCORE: ${this.score}`, w - 160, 24);
  }
}

export default PitsOfDoomGame;

