/* ====================================================
   MASTER ALCHEMIST MERGE — GAMINGZONE
   Primal Element Transmutation & Discovery Puzzle
   - Combine Fire, Water, Earth & Air in the Transmutation Cauldron
   - Discover 24+ Transmutations: Steam, Lava, Lightning, Plant, Diamond & Obsidian
   - Complete the Ancient Alchemist Grimoire Codex
   - Particle Spark Alchemy Effects & Drag-and-Drop Crafting
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class MasterAlchemistMergeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Master Alchemist Merge',
      targetScore: 24,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    // Codex of Elements & Recipes
    this.recipes = [
      { a: 'Fire', b: 'Water', res: 'Steam', icon: '♨️' },
      { a: 'Earth', b: 'Fire', res: 'Lava', icon: '🌋' },
      { a: 'Air', b: 'Fire', res: 'Energy', icon: '⚡' },
      { a: 'Water', b: 'Earth', res: 'Mud', icon: '🌱' },
      { a: 'Mud', b: 'Fire', res: 'Brick', icon: '🧱' },
      { a: 'Lava', b: 'Water', res: 'Obsidian', icon: '💎' },
      { a: 'Air', b: 'Energy', res: 'Lightning', icon: '🌩️' },
      { a: 'Steam', b: 'Air', res: 'Cloud', icon: '☁️' },
      { a: 'Cloud', b: 'Water', res: 'Rain', icon: '🌧️' },
      { a: 'Earth', b: 'Rain', res: 'Plant', icon: '🌿' },
      { a: 'Plant', b: 'Fire', res: 'Charcoal', icon: '🪵' },
      { a: 'Charcoal', b: 'Energy', res: 'Diamond', icon: '💍' },
      { a: 'Earth', b: 'Energy', res: 'Metal', icon: '⚙️' },
      { a: 'Metal', b: 'Energy', res: 'Battery', icon: '🔋' },
      { a: 'Plant', b: 'Water', res: 'Algae', icon: '🦠' },
      { a: 'Lava', b: 'Air', res: 'Stone', icon: '🪨' }
    ];

    this.unlocked = ['Fire', 'Water', 'Earth', 'Air'];
    this.elementIcons = {
      Fire: '🔥', Water: '💧', Earth: '🌍', Air: '💨',
      Steam: '♨️', Lava: '🌋', Energy: '⚡', Mud: '🌱',
      Brick: '🧱', Obsidian: '💎', Lightning: '🌩️', Cloud: '☁️',
      Rain: '🌧️', Plant: '🌿', Charcoal: '🪵', Diamond: '💍',
      Metal: '⚙️', Battery: '🔋', Algae: '🦠', Stone: '🪨'
    };

    this.slotA = null;
    this.slotB = null;
    this.particles = [];

    this.initControls();

    this.attachTouchControls({
      showDpad: false,
      onAction: () => this.transmute()
    });

    this.showStartCard({
      title: 'MASTER ALCHEMIST MERGE',
      icon: '⚗️',
      objective: 'Combine elements in the cauldron to discover new forms of matter! Discover all elements to complete your Alchemist Codex.',
      controls: 'Click elements to place in Cauldron A & B • Click TRANSMUTE.',
      onStart: () => {
        this.score = 4;
        this.start();
      }
    });
  }

  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', (e) => {
        if (this.state !== GameState.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if clicked Transmute Button
        if (clickX > 370 && clickX < 490 && clickY > 260 && clickY < 310) {
          this.transmute();
          return;
        }

        // Check element sidebar clicks (Right side)
        const startX = 640;
        const startY = 70;
        for (let i = 0; i < this.unlocked.length; i++) {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const bx = startX + col * 95;
          const by = startY + row * 45;

          if (clickX >= bx && clickX <= bx + 85 && clickY >= by && clickY <= by + 38) {
            sounds.playClick();
            const elem = this.unlocked[i];
            if (!this.slotA) {
              this.slotA = elem;
            } else if (!this.slotB) {
              this.slotB = elem;
            } else {
              this.slotA = elem;
              this.slotB = null;
            }
            break;
          }
        }
      });
    }
  }

  transmute() {
    if (!this.slotA || !this.slotB) return;

    // Search recipe match
    let found = null;
    for (const r of this.recipes) {
      if ((r.a === this.slotA && r.b === this.slotB) || (r.a === this.slotB && r.b === this.slotA)) {
        found = r;
        break;
      }
    }

    if (found) {
      sounds.playSuccess();
      if (!this.unlocked.includes(found.res)) {
        this.unlocked.push(found.res);
        this.score = this.unlocked.length;

        // Transmutation Sparkles
        for (let p = 0; p < 25; p++) {
          this.particles.push({
            x: 430,
            y: 200,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 4 + 2,
            color: '#fbbf24',
            life: 30
          });
        }

        if (this.unlocked.length >= 20) {
          sounds.playWin();
          this.gameOver(this.score * 500, { victory: true });
        }
      }
      this.slotA = found.res;
      this.slotB = null;
    } else {
      sounds.playHit();
      // Incompatible elements
      this.slotB = null;
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Alchemist Lab Background
    ctx.fillStyle = '#0c0d12';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Cauldron Alchemy Circles (Center)
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(430, 200, 110, 0, Math.PI * 2);
    ctx.stroke();

    // Slot A (Left Circle)
    ctx.fillStyle = this.slotA ? 'rgba(255, 87, 51, 0.2)' : 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(360, 200, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff5733';
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.slotA ? this.elementIcons[this.slotA] : '+', 360, 200);

    // Slot B (Right Circle)
    ctx.fillStyle = this.slotB ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(500, 200, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2dd4bf';
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.fillText(this.slotB ? this.elementIcons[this.slotB] : '+', 500, 200);

    // Transmute Button
    ctx.fillStyle = (this.slotA && this.slotB) ? '#ff5733' : '#334155';
    ctx.fillRect(370, 270, 120, 42);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(370, 270, 120, 42);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText('TRANSMUTE', 430, 291);

    // 3. Unlocked Elements Codex (Right Panel)
    ctx.fillStyle = 'rgba(24, 26, 36, 0.85)';
    ctx.fillRect(620, 20, 220, 480);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeRect(620, 20, 220, 480);

    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚗️ CODEX (${this.unlocked.length}/20)`, 635, 48);

    const startX = 635;
    const startY = 70;
    for (let i = 0; i < this.unlocked.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = startX + col * 100;
      const by = startY + row * 45;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx, by, 92, 36);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeRect(bx, by, 92, 36);

      const elem = this.unlocked[i];
      ctx.fillStyle = '#fff';
      ctx.font = '12px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${this.elementIcons[elem]} ${elem}`, bx + 8, by + 22);
    }

    // 4. Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Header Title
    ctx.fillStyle = '#ff5733';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MASTER ALCHEMIST MERGE', 30, 48);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Outfit, sans-serif';
    ctx.fillText('Combine primal elements to forge all 20 discoveries', 30, 72);
  }
}

