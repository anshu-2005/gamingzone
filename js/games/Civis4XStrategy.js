/* ====================================================
   CIVIS 4X STRATEGY — TURN-BASED HEX CIVILIZATION
   Inspired by Venerons/civis (4X JavaScript Strategy)
   Found cities, research technologies, train legions & archers,
   gather gold & science yields, and dominate the world map!
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class Civis4XStrategyGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Civis 4X Strategy',
      targetScore: 4000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.turn = 1;
    this.gold = 150;
    this.science = 0;
    this.production = 20;

    this.cols = 10;
    this.rows = 6;
    this.hexRadius = 38;

    this.techs = [
      { name: 'Bronze Working', cost: 60, researched: true, unlocks: 'Legion Warrior' },
      { name: 'Archery Tactics', cost: 120, researched: false, unlocks: 'Archer Units' },
      { name: 'Iron Forging', cost: 240, researched: false, unlocks: '+50% Unit ATK' },
      { name: 'Engineering', cost: 450, researched: false, unlocks: 'Catapult Siege' }
    ];
    this.currentTechIdx = 1;

    this.cities = [];
    this.units = [];
    this.enemies = [];
    this.selectedTile = null;
    this.selectedUnit = null;

    this.initMap();
    this.initControls();

    this.attachTouchControls({
      onDirection: () => {},
      onAction: (pressed) => {
        if (pressed) this.endTurn();
      },
      actionLabel: '⏳ END TURN',
      showDpad: false
    });

    this.showStartCard({
      title: 'CIVIS 4X STRATEGY',
      icon: '🏛️',
      objective: 'Found glorious cities, research technologies, train armies, and eliminate barbarian empires!',
      controls: 'Click Hex Tiles to Move / Recruit • Click "END TURN" button to advance turns'
    });
  }

  initMap() {
    this.grid = [];
    const terrainTypes = [
      { type: 'PLAINS', color: '#15803d', yieldG: 2, yieldP: 2 },
      { type: 'FOREST', color: '#166534', yieldG: 1, yieldP: 4 },
      { type: 'MOUNTAIN', color: '#475569', yieldG: 0, yieldP: 5 },
      { type: 'WATER', color: '#0284c7', yieldG: 3, yieldP: 0 },
      { type: 'GOLD_MINE', color: '#ca8a04', yieldG: 8, yieldP: 3 }
    ];

    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        let t = terrainTypes[0];
        const rand = Math.random();
        if (rand < 0.15) t = terrainTypes[1]; // Forest
        else if (rand < 0.28) t = terrainTypes[2]; // Mountain
        else if (rand < 0.38) t = terrainTypes[3]; // Water
        else if (rand < 0.44) t = terrainTypes[4]; // Gold Mine

        this.grid[r][c] = {
          col: c,
          row: r,
          terrain: t,
          owner: null, // 'PLAYER', 'ENEMY', null
          city: null,
          unit: null
        };
      }
    }

    // Capital City for Player
    this.grid[2][2].terrain = terrainTypes[0];
    this.grid[2][2].owner = 'PLAYER';
    this.cities.push({ name: 'Rome', col: 2, row: 2, pop: 3, hp: 100 });
    this.grid[2][2].city = this.cities[0];

    // Player Initial Warrior
    this.units.push({
      type: 'Legion Warrior',
      col: 2,
      row: 3,
      hp: 100,
      atk: 25,
      movesLeft: 2,
      owner: 'PLAYER'
    });
    this.grid[3][2].unit = this.units[0];

    // Enemy Barbarian Camp
    this.grid[3][8].terrain = terrainTypes[0];
    this.grid[3][8].owner = 'ENEMY';
    this.cities.push({ name: 'Sparta', col: 8, row: 3, pop: 3, hp: 100, isEnemy: true });
    this.grid[3][8].city = this.cities[1];

    this.enemies.push({
      type: 'Barbarian Warrior',
      col: 7,
      row: 3,
      hp: 80,
      atk: 20,
      movesLeft: 2,
      owner: 'ENEMY'
    });
    this.grid[3][7].unit = this.enemies[0];
  }

  getHexCenter(c, r) {
    const xOffset = 54 + (r % 2 === 1 ? this.hexRadius * 0.866 : 0);
    const x = xOffset + c * (this.hexRadius * 1.732);
    const y = 60 + r * (this.hexRadius * 1.5);
    return { x, y };
  }

  initControls() {
    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
      const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Check Bottom UI Buttons (Recruit, Settle, End Turn)
      if (clickY > 460) {
        if (clickX > 680) {
          this.endTurn();
        } else if (clickX > 480 && clickX <= 660) {
          this.recruitUnit('Archer');
        } else if (clickX > 280 && clickX <= 460) {
          this.recruitUnit('Legion');
        } else if (clickX > 80 && clickX <= 260) {
          this.settleCity();
        }
        return;
      }

      // Check Hex click
      let closest = null;
      let minDist = 9999;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const pt = this.getHexCenter(c, r);
          const d = Math.hypot(clickX - pt.x, clickY - pt.y);
          if (d < minDist && d < this.hexRadius) {
            minDist = d;
            closest = this.grid[r][c];
          }
        }
      }

      if (closest) {
        this.handleTileClick(closest);
      }
    });
  }

  handleTileClick(tile) {
    sounds.playClick?.();

    // If unit is currently selected, try moving or attacking
    if (this.selectedUnit && this.selectedUnit.movesLeft > 0) {
      const dist = Math.abs(this.selectedUnit.col - tile.col) + Math.abs(this.selectedUnit.row - tile.row);
      if (dist <= 2) {
        // Attack enemy unit on tile
        if (tile.unit && tile.unit.owner === 'ENEMY') {
          this.battleUnits(this.selectedUnit, tile.unit, tile);
          return;
        }

        // Move unit to empty tile (non-mountain/water)
        if (!tile.unit && tile.terrain.type !== 'MOUNTAIN' && tile.terrain.type !== 'WATER') {
          const oldTile = this.grid[this.selectedUnit.row][this.selectedUnit.col];
          oldTile.unit = null;
          tile.unit = this.selectedUnit;
          this.selectedUnit.col = tile.col;
          this.selectedUnit.row = tile.row;
          this.selectedUnit.movesLeft--;
          tile.owner = 'PLAYER';
          sounds.playJump?.();
          return;
        }
      }
    }

    // Otherwise select tile or unit
    this.selectedTile = tile;
    this.selectedUnit = tile.unit && tile.unit.owner === 'PLAYER' ? tile.unit : null;
  }

  battleUnits(attacker, defender, tile) {
    defender.hp -= attacker.atk;
    attacker.hp -= Math.floor(defender.atk * 0.5);
    attacker.movesLeft = 0;
    sounds.playHit?.();

    if (defender.hp <= 0) {
      tile.unit = attacker;
      const oldTile = this.grid[attacker.row][attacker.col];
      oldTile.unit = null;
      attacker.col = tile.col;
      attacker.row = tile.row;
      tile.owner = 'PLAYER';
      this.enemies = this.enemies.filter((e) => e !== defender);
      this.score += 400;
      sounds.playLevelUp?.();

      // Check Victory
      if (this.enemies.length === 0 && this.cities.every((c) => !c.isEnemy || c.hp <= 0)) {
        this.finishGame(this.score, { reason: 'Conquest Victory: Dominated All Rival Empires!' });
      }
    }

    if (attacker.hp <= 0) {
      const atTile = this.grid[attacker.row][attacker.col];
      atTile.unit = null;
      this.units = this.units.filter((u) => u !== attacker);
      this.selectedUnit = null;
    }
  }

  recruitUnit(type) {
    const cost = type === 'Archer' ? 80 : 60;
    if (this.gold < cost) {
      sounds.playCrash?.();
      return;
    }

    const capital = this.cities[0];
    const tile = this.grid[capital.row][capital.col];
    if (tile.unit) {
      sounds.playCrash?.();
      return;
    }

    this.gold -= cost;
    const unit = {
      type: type === 'Archer' ? 'Archer' : 'Legion Warrior',
      col: capital.col,
      row: capital.row,
      hp: 100,
      atk: type === 'Archer' ? 30 : 25,
      movesLeft: 2,
      owner: 'PLAYER'
    };
    this.units.push(unit);
    tile.unit = unit;
    sounds.playLevelUp?.();
  }

  settleCity() {
    if (!this.selectedTile || this.selectedTile.city || this.selectedTile.terrain.type === 'MOUNTAIN' || this.selectedTile.terrain.type === 'WATER') {
      return;
    }
    if (this.gold < 100) return;

    this.gold -= 100;
    const newCity = { name: 'City ' + (this.cities.length + 1), col: this.selectedTile.col, row: this.selectedTile.row, pop: 1, hp: 100 };
    this.cities.push(newCity);
    this.selectedTile.city = newCity;
    this.selectedTile.owner = 'PLAYER';
    this.score += 500;
    sounds.playLevelUp?.();
  }

  endTurn() {
    this.turn++;
    sounds.playScore?.();

    // Accumulate yields from player territory
    let turnGold = 0;
    let turnScience = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        if (t.owner === 'PLAYER') {
          turnGold += t.terrain.yieldG;
          turnScience += 4;
        }
      }
    }
    this.gold += Math.max(15, turnGold);
    this.science += turnScience;
    this.score += 100;

    // Research progress
    const tech = this.techs[this.currentTechIdx];
    if (tech && this.science >= tech.cost) {
      tech.researched = true;
      this.currentTechIdx++;
      sounds.playLevelUp?.();
    }

    // Refresh player units moves
    for (const u of this.units) {
      u.movesLeft = 2;
    }

    // Enemy Turn AI
    for (const e of this.enemies) {
      e.movesLeft = 2;
      // Step towards nearest player unit or city
      let target = this.cities[0];
      if (this.units.length > 0) target = this.units[0];

      const stepX = target.col > e.col ? 1 : -1;
      const stepY = target.row > e.row ? 1 : -1;
      const nc = Math.max(0, Math.min(this.cols - 1, e.col + stepX));
      const nr = Math.max(0, Math.min(this.rows - 1, e.row + stepY));

      const targetTile = this.grid[nr][nc];
      if (targetTile.unit && targetTile.unit.owner === 'PLAYER') {
        this.battleUnits(e, targetTile.unit, targetTile);
      } else if (!targetTile.unit && targetTile.terrain.type !== 'MOUNTAIN' && targetTile.terrain.type !== 'WATER') {
        const oldTile = this.grid[e.row][e.col];
        oldTile.unit = null;
        targetTile.unit = e;
        e.col = nc;
        e.row = nr;
      }
    }

    // Spawn reinforcements occasionally
    if (this.turn % 5 === 0 && this.enemies.length < 4) {
      const enemyCity = this.cities.find((c) => c.isEnemy);
      if (enemyCity) {
        const newE = {
          type: 'Barbarian Raider',
          col: enemyCity.col - 1,
          row: enemyCity.row,
          hp: 90,
          atk: 22,
          movesLeft: 2,
          owner: 'ENEMY'
        };
        this.enemies.push(newE);
        this.grid[newE.row][newE.col].unit = newE;
      }
    }
  }

  update() {}

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    // Top Status Bar Glass
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 44);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText(`TURN ${this.turn}`, 20, 28);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`GOLD: 🪙 ${this.gold}`, 120, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`SCIENCE: 🧪 ${this.science}`, 240, 28);
    ctx.fillStyle = '#00e5ff';
    const curTech = this.techs[this.currentTechIdx];
    ctx.fillText(`RESEARCH: ${curTech ? curTech.name : 'Max Tech'}`, 380, 28);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`SCORE: ${this.score}`, w - 160, 28);

    // Render Hex Grid
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        const pt = this.getHexCenter(c, r);

        // Draw Hexagon
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = pt.x + this.hexRadius * Math.cos(angle);
          const hy = pt.y + this.hexRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fillStyle = tile.terrain.color;
        ctx.fill();

        // Territory outline
        if (tile.owner === 'PLAYER') {
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 2.5;
        } else if (tile.owner === 'ENEMY') {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        // Highlight selected
        if (this.selectedTile === tile) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }

        // Render City
        if (tile.city) {
          ctx.fillStyle = tile.city.isEnemy ? '#ef4444' : '#0284c7';
          ctx.fillRect(pt.x - 14, pt.y - 14, 28, 28);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(pt.x - 14, pt.y - 14, 28, 28);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Outfit';
          ctx.fillText(tile.city.name, pt.x - 16, pt.y - 18);
        }

        // Render Unit
        if (tile.unit) {
          ctx.fillStyle = tile.unit.owner === 'PLAYER' ? '#38bdf8' : '#f97316';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y + 6, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // HP
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(pt.x - 12, pt.y + 20, 24, 3);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(pt.x - 12, pt.y + 20, 24 * (tile.unit.hp / 100), 3);
        }
        ctx.restore();
      }
    }

    // Bottom Action Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 460, w, 60);

    const drawBtn = (x, text, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, 470, 160, 40);
      ctx.fillStyle = '#0a0e17';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText(text, x + 16, 495);
    };

    drawBtn(80, '🏛️ SETTLE (100G)', '#10b981');
    drawBtn(280, '⚔️ LEGION (60G)', '#38bdf8');
    drawBtn(480, '🏹 ARCHER (80G)', '#a855f7');
    drawBtn(680, '⏳ NEXT TURN', '#fbbf24');
  }
}

export default Civis4XStrategyGame;

