/* ====================================================
   BURGER CHEF RUSH — GAMINGZONE
   High-Speed Kitchen Cooking & Burger Assembly Simulator
   - Assemble Gourmet Burgers to Match Incoming Customer Order Tickets
   - Ingredients: Bottom Bun, Grilled Patty, Cheddar Cheese, Lettuce, Tomato, Top Bun
   - Ring the Service Bell to Deliver Orders Before Patience Runs Out
   - Earn Big Tips & Clear 10 Rush Hour Dinner Shifts
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class BurgerChefRushGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Burger Chef Rush',
      targetScore: 2000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.currentOrder = [];
    this.plateStack = [];
    this.orderTimer = 100;
    this.maxOrderTimer = 100;
    this.servedCount = 0;

    this.ingredientButtons = [
      { name: 'Bun_B', label: '🍞 Bottom Bun', color: '#b45309', y: 390 },
      { name: 'Patty', label: '🥩 Beef Patty', color: '#78350f', y: 390 },
      { name: 'Cheese', label: '🧀 Cheddar', color: '#f59e0b', y: 390 },
      { name: 'Lettuce', label: '🥬 Lettuce', color: '#10b981', y: 440 },
      { name: 'Tomato', label: '🍅 Tomato', color: '#ef4444', y: 440 },
      { name: 'Bun_T', label: '🍞 Top Bun', color: '#b45309', y: 440 }
    ];

    this.initControls();
    this.generateNewOrder();

    this.attachTouchControls({
      showDpad: false,
      onAction: () => this.servePlate()
    });

    this.showStartCard({
      title: 'BURGER CHEF RUSH',
      icon: '🍔',
      objective: 'Stack the ingredients in exact order to match customer tickets! Click ingredients, then click SERVE BELL before the timer expires.',
      controls: 'Click ingredients to stack • Click SERVE BELL to deliver.',
      onStart: () => {
        this.score = 0;
        this.servedCount = 0;
        this.generateNewOrder();
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

        // Check Serve Bell Click (Center Right)
        if (clickX > 480 && clickX < 580 && clickY > 230 && clickY < 290) {
          this.servePlate();
          return;
        }

        // Check Clear Plate (Trash)
        if (clickX > 480 && clickX < 580 && clickY > 300 && clickY < 345) {
          sounds.playHit();
          this.plateStack = [];
          return;
        }

        // Check Ingredient Buttons
        const btnW = 120;
        const btnH = 38;
        this.ingredientButtons.forEach((btn, idx) => {
          const col = idx % 3;
          const bx = 160 + col * 135;
          const by = btn.y;

          if (clickX >= bx && clickX <= bx + btnW && clickY >= by && clickY <= by + btnH) {
            sounds.playClick();
            if (this.plateStack.length < 8) {
              this.plateStack.push(btn.name);
            }
          }
        });
      });
    }
  }

  generateNewOrder() {
    this.orderTimer = Math.max(50, 100 - this.servedCount * 3);
    this.maxOrderTimer = this.orderTimer;
    this.plateStack = [];

    // Orders always have Bun_B at base, Bun_T on top, and 1 to 4 fillings
    const fillings = ['Patty', 'Cheese', 'Lettuce', 'Tomato'];
    const count = Math.min(4, Math.floor(this.servedCount / 3) + 2);
    const chosen = [];
    for (let i = 0; i < count; i++) {
      chosen.push(fillings[Math.floor(Math.random() * fillings.length)]);
    }

    this.currentOrder = ['Bun_B', ...chosen, 'Bun_T'];
  }

  servePlate() {
    // Verify plate matches currentOrder exactly
    const match = this.plateStack.length === this.currentOrder.length &&
      this.plateStack.every((val, index) => val === this.currentOrder[index]);

    if (match) {
      sounds.playSuccess();
      const tip = Math.round((this.orderTimer / this.maxOrderTimer) * 150) + 100;
      this.score += tip;
      this.servedCount++;

      if (this.servedCount >= 15) {
        sounds.playWin();
        this.gameOver(this.score, { cleared: true, burgersServed: this.servedCount });
        return;
      }
      this.generateNewOrder();
    } else {
      sounds.playHit();
      this.lives--;
      this.plateStack = [];

      if (this.lives <= 0) {
        this.gameOver(this.score, { burgersServed: this.servedCount });
      }
    }
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // Timer countdown
    this.orderTimer -= 0.16;
    if (this.orderTimer <= 0) {
      sounds.playHit();
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver(this.score, { burgersServed: this.servedCount });
      } else {
        this.generateNewOrder();
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Cozy Diner Kitchen Background
    ctx.fillStyle = '#0c0d12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Stainless Steel Counter
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 200, this.width, this.height - 200);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 200, this.width, 8);

    // 2. Customer Order Ticket (Top Center)
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(this.width / 2 - 160, 20, 320, 110);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.width / 2 - 160, 20, 320, 110);

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ORDER #${this.servedCount + 1}`, this.width / 2, 42);

    // Order item names
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    const orderStr = this.currentOrder.map(item => item.replace('_B', '').replace('_T', '')).join(' + ');
    ctx.fillText(orderStr, this.width / 2, 68);

    // Patience Timer Bar
    const timerPct = Math.max(0, this.orderTimer / this.maxOrderTimer);
    ctx.fillStyle = timerPct > 0.3 ? '#10b981' : '#ef4444';
    ctx.fillRect(this.width / 2 - 140, 95, 280 * timerPct, 12);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.width / 2 - 140, 95, 280, 12);

    // 3. Plate & Burger Stack (Center Left)
    const plateX = 320;
    const plateY = 320;

    // Ceramic Plate
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(plateX, plateY, 90, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Stacked Ingredients
    this.plateStack.forEach((ing, idx) => {
      const iy = plateY - 10 - idx * 14;
      this.drawIngredientLayer(ctx, plateX, iy, ing);
    });

    // 4. Service Bell Button (Center Right)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(480, 230, 100, 50);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(480, 230, 100, 50);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔔 SERVE', 530, 260);

    // Clear Trash Button
    ctx.fillStyle = '#475569';
    ctx.fillRect(480, 300, 100, 40);
    ctx.strokeRect(480, 300, 100, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('🗑️ CLEAR', 530, 325);

    // 5. Ingredient Buttons Dock (Bottom)
    const btnW = 120;
    const btnH = 38;
    this.ingredientButtons.forEach((btn, idx) => {
      const col = idx % 3;
      const bx = 160 + col * 135;
      const by = btn.y;

      ctx.fillStyle = btn.color;
      ctx.fillRect(bx, by, btnW, btnH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, btnW, btnH);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, bx + btnW / 2, by + 24);
    });

    // 6. HUD
    ctx.fillStyle = '#ff5733';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`TIPS: $${this.score.toLocaleString()}`, 30, 44);

    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText(`❤️ ${this.lives} LIVES • SERVED: ${this.servedCount}`, 30, 68);
  }

  drawIngredientLayer(ctx, x, y, type) {
    if (type.includes('Bun')) {
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(x, y, 55, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'Patty') {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(x, y, 52, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'Cheese') {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 48, y - 4, 96, 8);
    } else if (type === 'Lettuce') {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x - 52, y - 4, 104, 7);
    } else if (type === 'Tomato') {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 46, y - 4, 92, 8);
    }
  }
}

