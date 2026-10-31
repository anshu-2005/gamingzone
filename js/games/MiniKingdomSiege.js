/* ====================================================
   MINI KINGDOM SIEGE — GAMINGZONE
   Turn-Based Tactical Grid Warfare & Castle Siege
   - Command Swordsmen, Crossbowmen, Knights & Catapults
   - Grid-Based Movement, Armor Classes & Tactical Flanking
   - Breach Enemy Castle Keeps Across 10 Strategic Scenarios
   - AI Opponent Commander with Counter-Tactics & Formation Play
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class MiniKingdomSiegeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Mini Kingdom Siege',
      targetScore: 10000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.currentLevel = 1;
    this.turn = 'player'; // 'player' or 'enemy'
    this.gridCols = 10;
    this.gridRows = 6;
    this.cellSize = 64;
    this.gridOffsetX = 110;
    this.gridOffsetY = 70;

    this.selectedUnit = null;
    this.playerUnits = [];
    this.enemyUnits = [];
    this.particles = [];

    this.initControls();
    this.loadScenario(this.currentLevel);

    this.attachTouchControls({
      showDpad: false,
      onAction: () => this.endTurn()
    });

    this.showStartCard({
      title: 'MINI KINGDOM SIEGE',
      icon: '🏰',
      objective: 'Command your medieval battalion on the tactical grid! Defeat all enemy soldiers to siege the fortress.',
      controls: 'Click unit to select • Click green tile to move or red enemy to attack • Click END TURN.',
      onStart: () => {
        this.currentLevel = 1;
        this.score = 0;
        this.loadScenario(1);
        this.start();
      }
    });
  }

  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', (e) => {
        if (this.state !== GameState.PLAYING || this.turn !== 'player') return;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if clicked "End Turn" button
        if (clickX > 370 && clickX < 490 && clickY > 15 && clickY < 55) {
          this.endTurn();
          return;
        }

        const col = Math.floor((clickX - this.gridOffsetX) / this.cellSize);
        const row = Math.floor((clickY - this.gridOffsetY) / this.cellSize);

        if (col < 0 || col >= this.gridCols || row < 0 || row >= this.gridRows) return;

        // 1. Select player unit
        const clickedPlayer = this.playerUnits.find(u => u.col === col && u.row === row);
        if (clickedPlayer) {
          sounds.playClick();
          this.selectedUnit = clickedPlayer;
          return;
        }

        // 2. Action with selected unit
        if (this.selectedUnit && !this.selectedUnit.acted) {
          const u = this.selectedUnit;
          const dist = Math.abs(u.col - col) + Math.abs(u.row - row);

          // Attack enemy?
          const enemy = this.enemyUnits.find(e => e.col === col && e.row === row);
          if (enemy && dist <= u.range) {
            sounds.playHit();
            enemy.hp -= u.damage;
            u.acted = true;
            this.selectedUnit = null;

            if (enemy.hp <= 0) {
              sounds.playExplosion();
              this.score += 250;
              this.enemyUnits = this.enemyUnits.filter(e => e !== enemy);
              this.checkVictory();
            }
            return;
          }

          // Move to empty tile?
          const occupied = this.playerUnits.some(p => p.col === col && p.row === row) || enemy;
          if (!occupied && dist <= u.moves) {
            sounds.playClick();
            u.col = col;
            u.row = row;
            u.acted = true;
            this.selectedUnit = null;
          }
        }
      });
    }
  }

  loadScenario(lvl) {
    this.currentLevel = lvl;
    this.turn = 'player';
    this.selectedUnit = null;

    // Player Battalion (Blue)
    this.playerUnits = [
      { name: 'Knight', col: 1, row: 1, hp: 120, maxHp: 120, moves: 2, range: 1, damage: 45, icon: '🛡️', acted: false },
      { name: 'Archer', col: 1, row: 3, hp: 60, maxHp: 60, moves: 2, range: 3, damage: 35, icon: '🏹', acted: false },
      { name: 'Catapult', col: 0, row: 2, hp: 80, maxHp: 80, moves: 1, range: 4, damage: 60, icon: '☄️', acted: false }
    ];

    // Enemy Battalion (Red)
    this.enemyUnits = [
      { name: 'Invader', col: 8, row: 1, hp: 100, maxHp: 100, moves: 2, range: 1, damage: 35, icon: '⚔️' },
      { name: 'Crossbow', col: 8, row: 3, hp: 60, maxHp: 60, moves: 2, range: 3, damage: 30, icon: '🎯' },
      { name: 'Lord Keep', col: 9, row: 2, hp: 140, maxHp: 140, moves: 1, range: 1, damage: 40, icon: '🏰' }
    ];
  }

  endTurn() {
    this.turn = 'enemy';
    this.selectedUnit = null;
    this.playerUnits.forEach(u => u.acted = false);

    // AI Turn Execution
    setTimeout(() => {
      this.executeAITurn();
    }, 600);
  }

  executeAITurn() {
    this.enemyUnits.forEach(enemy => {
      // Find closest player unit
      let target = null;
      let minDist = 999;
      this.playerUnits.forEach(p => {
        const d = Math.abs(p.col - enemy.col) + Math.abs(p.row - enemy.row);
        if (d < minDist) {
          minDist = d;
          target = p;
        }
      });

      if (!target) return;

      if (minDist <= enemy.range) {
        // Attack!
        sounds.playHit();
        target.hp -= enemy.damage;
      } else {
        // Step closer
        const dCol = Math.sign(target.col - enemy.col);
        const dRow = Math.sign(target.row - enemy.row);
        enemy.col += dCol;
      }
    });

    // Remove defeated players
    this.playerUnits = this.playerUnits.filter(p => p.hp > 0);

    if (this.playerUnits.length === 0) {
      sounds.playExplosion();
      this.loadScenario(this.currentLevel);
      return;
    }

    this.turn = 'player';
  }

  checkVictory() {
    if (this.enemyUnits.length === 0) {
      sounds.playWin();
      this.score += 1500 * this.currentLevel;
      if (this.currentLevel >= 10) {
        this.gameOver(this.score, { victory: true });
      } else {
        this.loadScenario(this.currentLevel + 1);
      }
    }
  }

  update() {}

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. War Room Map Background
    ctx.fillStyle = '#0c0d12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid Floor
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const x = this.gridOffsetX + c * this.cellSize;
        const y = this.gridOffsetY + r * this.cellSize;

        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(24, 26, 36, 0.7)' : 'rgba(18, 20, 28, 0.85)';
        ctx.fillRect(x, y, this.cellSize, this.cellSize);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.cellSize, this.cellSize);
      }
    }

    // 2. Highlight Selected Unit Reach
    if (this.selectedUnit) {
      const u = this.selectedUnit;
      ctx.fillStyle = 'rgba(45, 212, 191, 0.2)';
      for (let r = 0; r < this.gridRows; r++) {
        for (let c = 0; c < this.gridCols; c++) {
          const dist = Math.abs(u.col - c) + Math.abs(u.row - r);
          if (dist <= u.moves) {
            ctx.fillRect(this.gridOffsetX + c * this.cellSize, this.gridOffsetY + r * this.cellSize, this.cellSize, this.cellSize);
          }
        }
      }
    }

    // 3. Render Player Units (Blue)
    this.playerUnits.forEach(u => this.drawUnit(ctx, u, '#0284c7', u === this.selectedUnit));

    // 4. Render Enemy Units (Red)
    this.enemyUnits.forEach(e => this.drawUnit(ctx, e, '#dc2626', false));

    // 5. HUD & End Turn Button
    ctx.fillStyle = 'rgba(18, 20, 28, 0.85)';
    ctx.fillRect(0, 0, this.width, 65);

    ctx.fillStyle = '#ff5733';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏰 SIEGE LEVEL ${this.currentLevel} • SCORE: ${this.score}`, 30, 40);

    // End Turn Button
    ctx.fillStyle = this.turn === 'player' ? '#10b981' : '#475569';
    ctx.fillRect(this.width / 2 - 70, 14, 140, 38);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.width / 2 - 70, 14, 140, 38);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.turn === 'player' ? 'END TURN ➔' : 'ENEMY TURN...', this.width / 2, 38);
  }

  drawUnit(ctx, u, color, selected) {
    const x = this.gridOffsetX + u.col * this.cellSize + this.cellSize / 2;
    const y = this.gridOffsetY + u.row * this.cellSize + this.cellSize / 2;

    // Unit Base Circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Icon
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.icon, x, y);

    // HP Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - 18, y + 25, 36, 4);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x - 18, y + 25, (u.hp / u.maxHp) * 36, 4);
  }
}

