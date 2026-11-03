import { GameEngineBase } from '../core/GameEngineBase.js';

export class PipeFlowConnect extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Pipe Flow Connect: Hydro Maze';
    this.gridSize = 6;
    this.grid = [];
    this.level = 1;
    this.rotationsCount = 0;
    this.isWon = false;
    this.waterFlowing = false;
    this.connectedTiles = new Set();
    this.statusMessage = 'Click pipe tiles to rotate them and connect water from Source to Drain!';
  }

  onInit() {
    this.createCanvas();
    this.setupGrid();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));

    this.showStartCard(
      'PIPE FLOW CONNECT',
      'The classic plumbing brain puzzle! Click pipe sections to rotate them by 90 degrees. Form an unbroken connection from the Source Valve (top-left) to the Drain (bottom-right) to unleash the water flow!',
      'START PLUMBING'
    );
  }

  setupGrid() {
    this.rotationsCount = 0;
    this.isWon = false;
    this.grid = [];

    // Directions: 0: Up, 1: Right, 2: Down, 3: Left
    // Tile types:
    // 'line': connects [0, 2]
    // 'elbow': connects [0, 1]
    // 'tee': connects [0, 1, 3]
    // 'cross': connects [0, 1, 2, 3]
    const types = ['line', 'elbow', 'elbow', 'tee', 'line'];

    for (let r = 0; r < this.gridSize; r++) {
      const row = [];
      for (let c = 0; c < this.gridSize; c++) {
        const type = (r === 0 && c === 0) ? 'elbow' : ((r === 5 && c === 5) ? 'elbow' : types[Math.floor(Math.random() * types.length)]);
        const rotation = Math.floor(Math.random() * 4); // 0, 1, 2, 3 (each 90 deg)
        row.push({ type, rotation, hasWater: false });
      }
      this.grid.push(row);
    }

    this.evaluateFlow();
  }

  getOpenings(tile) {
    let base = [];
    if (tile.type === 'line') base = [0, 2];
    else if (tile.type === 'elbow') base = [0, 1];
    else if (tile.type === 'tee') base = [0, 1, 3];
    else if (tile.type === 'cross') base = [0, 1, 2, 3];

    // Shift by rotation
    return base.map(dir => (dir + tile.rotation) % 4);
  }

  evaluateFlow() {
    this.connectedTiles.clear();
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c].hasWater = false;
      }
    }

    // Source is at (0, 0) - check if it has opening upwards or left
    const startTile = this.grid[0][0];
    const queue = [{ r: 0, c: 0 }];
    const visited = new Set(['0,0']);
    startTile.hasWater = true;
    this.connectedTiles.add('0,0');

    const dr = [-1, 0, 1, 0];
    const dc = [0, 1, 0, -1];
    const oppDir = [2, 3, 0, 1];

    while (queue.length > 0) {
      const curr = queue.shift();
      const currTile = this.grid[curr.r][curr.c];
      const currOpenings = this.getOpenings(currTile);

      for (const dir of currOpenings) {
        const nr = curr.r + dr[dir];
        const nc = curr.c + dc[dir];

        if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
          const neighbor = this.grid[nr][nc];
          const neighborOpenings = this.getOpenings(neighbor);

          // Connected if neighbor has opposite direction open
          if (neighborOpenings.includes(oppDir[dir])) {
            const key = `${nr},${nc}`;
            if (!visited.has(key)) {
              visited.add(key);
              neighbor.hasWater = true;
              this.connectedTiles.add(key);
              queue.push({ r: nr, c: nc });
            }
          }
        }
      }
    }

    // Check if exit (5, 5) is connected
    if (this.grid[5][5].hasWater) {
      const exitOpenings = this.getOpenings(this.grid[5][5]);
      if (exitOpenings.includes(1) || exitOpenings.includes(2)) { // points to exit
        this.isWon = true;
        this.statusMessage = `🎉 HYDRO PIPELINE CONNECTED IN ${this.rotationsCount} TURNS!`;
      }
    }
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Reset button
    if (mx >= 830 && mx <= 950 && my >= 18 && my <= 52) {
      this.setupGrid();
      return;
    }

    if (this.isWon) return;

    // Grid coordinates
    const startX = 300;
    const startY = 85;
    const size = 68;

    if (mx >= startX && mx <= startX + this.gridSize * size &&
        my >= startY && my <= startY + this.gridSize * size) {
      const col = Math.floor((mx - startX) / size);
      const row = Math.floor((my - startY) / size);

      this.grid[row][col].rotation = (this.grid[row][col].rotation + 1) % 4;
      this.rotationsCount++;
      this.evaluateFlow();
    }
  }

  onRender(ctx) {
    ctx.fillStyle = '#060c18';
    ctx.fillRect(0, 0, 1000, 562);

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 68);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 1000, 68);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🚰 PIPE FLOW CONNECT', 30, 44);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`TURNS: ${this.rotationsCount}`, 320, 44);

    // Reset
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(830, 18, 120, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↺ RESTART', 890, 40);

    // Render Grid
    const startX = 300;
    const startY = 85;
    const size = 68;

    // Source Valve Indicator (top-left)
    ctx.fillStyle = '#10b981';
    ctx.fillRect(startX - 35, startY + 18, 30, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IN', startX - 20, startY + 38);

    // Drain Exit Indicator (bottom-right)
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(startX + this.gridSize * size + 5, startY + (this.gridSize - 1) * size + 18, 35, 32);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('OUT', startX + this.gridSize * size + 22, startY + (this.gridSize - 1) * size + 38);

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const x = startX + c * size;
        const y = startY + r * size;
        const tile = this.grid[r][c];

        // Tile base
        ctx.fillStyle = '#111827';
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

        // Draw pipe shapes
        this.drawPipe(ctx, x + size / 2, y + size / 2, size / 2, tile);
      }
    }

    // Bottom Status
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 508, 1000, 54);
    ctx.fillStyle = this.isWon ? '#10b981' : '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.statusMessage, 500, 540);
  }

  drawPipe(ctx, cx, cy, radius, tile) {
    const openings = this.getOpenings(tile);
    const pipeWidth = 18;
    const halfP = pipeWidth / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Pipe outer shell color & water flow color
    const pipeShell = '#475569';
    const waterColor = tile.hasWater ? '#06b6d4' : '#1e293b';

    // Center joint
    ctx.fillStyle = waterColor;
    ctx.beginPath();
    ctx.arc(0, 0, halfP, 0, Math.PI * 2);
    ctx.fill();

    // Draw branches for each opening direction
    for (const dir of openings) {
      ctx.save();
      ctx.rotate((dir * Math.PI) / 2);

      // Pipe outer
      ctx.fillStyle = pipeShell;
      ctx.fillRect(-halfP - 3, -radius, pipeWidth + 6, radius);

      // Water core
      ctx.fillStyle = waterColor;
      ctx.fillRect(-halfP, -radius, pipeWidth, radius);

      ctx.restore();
    }

    ctx.restore();
  }
}

