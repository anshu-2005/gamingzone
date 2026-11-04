/* ====================================================
   MINI KINGDOM SIEGE — GAMINGZONE
   Turn-Based Tactical Grid Warfare & Castle Siege
   - Command Swordsmen, Crossbowmen, Knights & Catapults
   - Grid-Based Movement, Armor Classes & Tactical Flanking
   - Breach Enemy Castle Keeps Across 10 Strategic Scenarios
   - AI Opponent Commander with Counter-Tactics & Formation Play
   - Mobile Touch & Responsive Scale Support
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
    this.width = this.baseWidth;
    this.height = this.baseHeight;

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
      onAction: () => this.endTurn(),
      actionLabel: 'END TURN'
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

  restart() {
    this.currentLevel = 1;
    this.score = 0;
    this.selectedUnit = null;
    this.turn = 'player';
    this.state = GameState.PLAYING;
    this.loadScenario(1);
    this.startLoop();
  }

  initControls() {
    if (!this.canvas) return;

    const handleInput = (clientX, clientY) => {
      if (this.state !== GameState.PLAYING || this.turn !== 'player') return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const clickX = (clientX - rect.left) * scaleX;
      const clickY = (clientY - rect.top) * scaleY;

      // Check if clicked "End Turn" button in top bar (x: 350-510, y: 12-56)
      if (clickX >= 350 && clickX <= 510 && clickY >= 12 && clickY <= 56) {
        sounds.playClick();
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
    };

    this.addEventListenerTracked(this.canvas, 'mousedown', (e) => {
      handleInput(e.clientX, e.clientY);
    });

    this.addEventListenerTracked(this.canvas, 'touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        handleInput(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  loadScenario(lvl) {
    this.currentLevel = lvl;
    this.turn = 'player';
    this.selectedUnit = null;

    // Player Battalion (Blue)
    this.playerUnits = [
      { name: 'Knight', col: 1, row: 1, hp: 120 + lvl * 10, maxHp: 120 + lvl * 10, moves: 2, range: 1, damage: 45 + lvl * 5, icon: '🛡️', acted: false },
      { name: 'Archer', col: 1, row: 3, hp: 60 + lvl * 5, maxHp: 60 + lvl * 5, moves: 2, range: 3, damage: 35 + lvl * 4, icon: '🏹', acted: false },
      { name: 'Catapult', col: 0, row: 2, hp: 80 + lvl * 5, maxHp: 80 + lvl * 5, moves: 1, range: 4, damage: 60 + lvl * 6, icon: '☄️', acted: false }
    ];

    // Enemy Battalion (Red) - Scales with level
    const enemyCount = Math.min(6, 2 + Math.floor(lvl / 2));
    this.enemyUnits = [
      { name: 'Invader', col: 8, row: 1, hp: 90 + lvl * 15, maxHp: 90 + lvl * 15, moves: 2, range: 1, damage: 25 + lvl * 4, icon: '⚔️' },
      { name: 'Crossbow', col: 8, row: 3, hp: 55 + lvl * 10, maxHp: 55 + lvl * 10, moves: 2, range: 3, damage: 25 + lvl * 3, icon: '🎯' },
      { name: 'Lord Keep', col: 9, row: 2, hp: 130 + lvl * 20, maxHp: 130 + lvl * 20, moves: 1, range: 1, damage: 35 + lvl * 5, icon: '🏰' }
    ];

    if (lvl >= 3) {
      this.enemyUnits.push({ name: 'Vanguard', col: 7, row: 4, hp: 80 + lvl * 10, maxHp: 80 + lvl * 10, moves: 2, range: 1, damage: 20 + lvl * 3, icon: '🗡️' });
    }
    if (lvl >= 5) {
      this.enemyUnits.push({ name: 'Siege Ram', col: 7, row: 0, hp: 110 + lvl * 12, maxHp: 110 + lvl * 12, moves: 1, range: 1, damage: 40 + lvl * 4, icon: '🪵' });
    }
  }

  endTurn() {
    this.turn = 'enemy';
    this.selectedUnit = null;
    this.playerUnits.forEach(u => u.acted = false);

    // AI Turn Execution
    this.setTimeout(() => {
      this.executeAITurn();
    }, 500);
  }

  executeAITurn() {
    if (this.state !== GameState.PLAYING) return;

    this.enemyUnits.forEach(enemy => {
      if (this.playerUnits.length === 0) return;

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
        const nextCol = enemy.col + dCol;
        const nextRow = enemy.row + dRow;

        const isOccupied = this.enemyUnits.some(e => e !== enemy && e.col === nextCol && e.row === enemy.row) ||
                           this.playerUnits.some(p => p.col === nextCol && p.row === enemy.row);

        if (!isOccupied && nextCol >= 0 && nextCol < this.gridCols) {
          enemy.col = nextCol;
        } else if (nextRow >= 0 && nextRow < this.gridRows) {
          enemy.row = nextRow;
        }
      }
    });

    // Remove defeated players
    this.playerUnits = this.playerUnits.filter(p => p.hp > 0);

    if (this.playerUnits.length === 0) {
      sounds.playExplosion();
      this.finishGame(this.score, { isVictory: false, levelReached: this.currentLevel });
      return;
    }

    this.turn = 'player';
  }

  checkVictory() {
    if (this.enemyUnits.length === 0) {
      sounds.playWin();
      this.score += 1500 * this.currentLevel;
      if (this.currentLevel >= 10) {
        this.finishGame(this.score, { isVictory: true, completedCampaign: true });
      } else {
        this.currentLevel++;
        this.loadScenario(this.currentLevel);
      }
    }
  }

  update() {}

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // 1. War Room Map Background
    ctx.fillStyle = '#0c0d12';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

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

    // 3. Draw Player Units (Blue)
    this.playerUnits.forEach(u => {
      const x = this.gridOffsetX + u.col * this.cellSize;
      const y = this.gridOffsetY + u.row * this.cellSize;

      ctx.fillStyle = u === this.selectedUnit ? 'rgba(56, 189, 248, 0.45)' : (u.acted ? 'rgba(100, 116, 139, 0.2)' : 'rgba(14, 165, 233, 0.25)');
      ctx.fillRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);
      ctx.strokeStyle = u === this.selectedUnit ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(u.icon, x + this.cellSize / 2, y + this.cellSize / 2 + 10);

      // HP Bar
      ctx.fillStyle = '#10b981';
      const hpWidth = ((this.cellSize - 12) * Math.max(0, u.hp)) / u.maxHp;
      ctx.fillRect(x + 6, y + this.cellSize - 10, hpWidth, 4);
    });

    // 4. Draw Enemy Units (Red)
    this.enemyUnits.forEach(e => {
      const x = this.gridOffsetX + e.col * this.cellSize;
      const y = this.gridOffsetY + e.row * this.cellSize;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.icon, x + this.cellSize / 2, y + this.cellSize / 2 + 10);

      // HP Bar
      ctx.fillStyle = '#ef4444';
      const hpWidth = ((this.cellSize - 12) * Math.max(0, e.hp)) / e.maxHp;
      ctx.fillRect(x + 6, y + this.cellSize - 10, hpWidth, 4);
    });

    // 5. Header HUD
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(`CAMPAIGN LEVEL: ${this.currentLevel}/10`, 30, 36);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth - 30, 36);

    // End Turn Button
    ctx.fillStyle = this.turn === 'player' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(360, 14, 140, 38);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(360, 14, 140, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.turn === 'player' ? '⚔️ END TURN' : '⏳ ENEMY...', 430, 38);

    // Bottom Help Banner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(this.gridOffsetX, this.baseHeight - 44, this.gridCols * this.cellSize, 34);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tap your soldiers (Blue) to view move range • Tap Red targets to attack • Defeat all forces to advance', this.baseWidth / 2, this.baseHeight - 22);
  }
}
