import { sounds } from '../core/soundFX.js';
import { IPL_TEAMS, WORLD_CUP_TEAMS } from '../data/cricketTeams.js';
import { portalState } from '../core/portalState.js';

export class CricketPremierLeagueGame {
  constructor(container, onGameOver, matchConfig = null) {
    this.container = container;
    this.onGameOver = onGameOver;

    // Determine Teams & Match Config
    this.playerTeam = matchConfig?.playerTeam || IPL_TEAMS[0]; // CSK default
    this.opponentTeam = matchConfig?.opponentTeam || IPL_TEAMS[1]; // MI default
    this.mode = matchConfig?.mode || '5overs';
    this.tournament = matchConfig?.tournament || 'ipl';
    this.stadiumName = matchConfig?.stadium || this.playerTeam.stadium;

    this.setupMatchMode(matchConfig);

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'cricket-game-container';
    this.wrapper.style.position = 'relative';
    this.wrapper.style.width = '100%';
    this.wrapper.style.maxWidth = '850px';
    this.wrapper.style.margin = '0 auto';
    this.wrapper.style.userSelect = 'none';

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrapper.appendChild(this.canvas);
    this.container.appendChild(this.wrapper);

    // Setup HD Retina Resolution
    this.baseWidth = 800;
    this.baseHeight = 560;
    this.setupRetinaCanvas();

    this.running = false;
    this.matchFinished = false;
    this.score = 0;
    this.wickets = 0;
    this.maxWickets = this.matchRules.maxWickets;
    this.ballsTotal = this.matchRules.totalBalls;
    this.ballsDelivered = 0;
    this.ballsLeft = this.ballsTotal;
    this.targetScore = this.matchRules.targetScore;
    this.isChasing = this.targetScore > 0;
    this.sixesCount = 0;
    this.foursCount = 0;
    this.currentStreak = 0;
    this.wagonWheel = []; // Tracks shot directions

    // Crowd Animation dots
    this.crowd = [];
    for (let i = 0; i < 90; i++) {
      this.crowd.push({
        x: 40 + Math.random() * 720,
        y: 20 + Math.random() * 95,
        color: [this.playerTeam.primaryColor, this.opponentTeam.primaryColor, '#ffd166', '#ffffff', '#22c55e'][Math.floor(Math.random() * 5)],
        jumpOffset: Math.random() * Math.PI * 2,
        size: Math.random() * 3 + 2.5
      });
    }

    // Ball state: 'ready', 'runup', 'bowled', 'hit', 'missed', 'wicket'
    this.ball = {
      x: this.baseWidth / 2,
      y: 170,
      z: 0,
      vx: 0,
      vy: 0,
      radius: 9,
      state: 'ready',
      deliveryName: 'Fast Outswinger',
      swing: 0,
      spin: 0,
      bounceHeight: 0,
      bounced: false,
      color: '#e63946'
    };

    // Batsman
    this.batsman = {
      x: this.baseWidth / 2,
      y: 440,
      swinging: false,
      swingProgress: 0,
      shotAngle: 0
    };

    // Bowler Runup animation
    this.bowler = {
      x: this.baseWidth / 2,
      y: 135,
      frame: 0
    };

    this.commentary = `🏏 ${this.playerTeam.name.toUpperCase()} vs ${this.opponentTeam.name.toUpperCase()}! Tap to Bowl!`;
    this.shotFeedback = '';
    this.feedbackColor = '#ffd166';
    this.feedbackTimer = 0;
    this.particles = [];

    this.initControls();
    this.reset();
  }

  setupMatchMode(config) {
    if (this.mode === '1over') {
      this.matchRules = {
        title: '1 Over Blitz',
        totalBalls: 6,
        maxWickets: 2,
        targetScore: config?.targetScore || 0,
        bowlerSpeed: 1.15,
        desc: '6 Balls Thriller! Smash maximum runs!'
      };
    } else if (this.mode === 'super_over') {
      this.matchRules = {
        title: 'Super Over Chase',
        totalBalls: 6,
        maxWickets: 2,
        targetScore: config?.targetScore || 24,
        bowlerSpeed: 1.25,
        desc: 'Chase 24 runs in 6 balls with 2 wickets in hand!'
      };
    } else if (this.mode === '5overs') {
      this.matchRules = {
        title: '5 Overs Mini T20',
        totalBalls: 30,
        maxWickets: 5,
        targetScore: config?.targetScore || 62,
        bowlerSpeed: 1.2,
        desc: 'Target: 62 Runs from 30 Balls!'
      };
    } else if (this.mode === '10overs') {
      this.matchRules = {
        title: '10 Overs Pro Cup',
        totalBalls: 60,
        maxWickets: 7,
        targetScore: config?.targetScore || 118,
        bowlerSpeed: 1.25,
        desc: 'Target: 118 Runs from 60 Balls!'
      };
    } else if (this.mode === '50overs') {
      this.matchRules = {
        title: '50 Overs ODI Master',
        totalBalls: 120,
        maxWickets: 10,
        targetScore: config?.targetScore || 285,
        bowlerSpeed: 1.3,
        desc: 'Target: 285 Runs in ODI World Cup!'
      };
    } else {
      this.mode = 'sixes_derby';
      this.matchRules = {
        title: 'Endless Sixes Derby',
        totalBalls: 999,
        maxWickets: 3,
        targetScore: 0,
        bowlerSpeed: 1.3,
        desc: 'Chain continuous boundaries!'
      };
    }
  }

  setupRetinaCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.baseWidth * dpr;
    this.canvas.height = this.baseHeight * dpr;
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.borderRadius = '18px';
    this.canvas.style.boxShadow = '0 12px 36px rgba(0,0,0,0.6)';
    this.ctx.scale(dpr, dpr);
  }

  initControls() {
    this.onAction = () => {
      if (this.matchFinished) return;
      if (!this.running) return;

      if (this.ball.state === 'ready') {
        this.startBowlerRunup();
      } else if ((this.ball.state === 'bowled' || this.ball.state === 'runup') && !this.batsman.swinging) {
        this.hitShot();
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onAction();
    });

    this.onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') {
        e.preventDefault();
        this.onAction();
      }
    };
    window.addEventListener('keydown', this.onKey);
  }

  startBowlerRunup() {
    this.ball.state = 'runup';
    this.bowler.y = 125;
    this.commentary = `⚡ ${this.opponentTeam.shortName} bowler running in to deliver...`;
    sounds.playClick();

    setTimeout(() => {
      if (this.ball.state === 'runup') {
        this.bowlBall();
      }
    }, 450);
  }

  bowlBall() {
    this.ball.state = 'bowled';
    const variations = [
      { name: '🔥 Fast 145km/h Outswinger', speed: 1.0, swing: 0.8, spin: 0 },
      { name: '⚡ Express Inswinger', speed: 1.1, swing: -0.6, spin: 0 },
      { name: '🎯 Deadly Yorker', speed: 1.25, swing: 0.2, spin: 0 },
      { name: '🌪️ Off-Spin Break', speed: 0.85, swing: 0, spin: 1.4 },
      { name: '💥 Bouncer High Ball', speed: 0.95, swing: 0.4, spin: 0 }
    ];

    const pick = variations[Math.floor(Math.random() * variations.length)];
    this.ball.deliveryName = pick.name;
    this.ball.startX = this.baseWidth / 2 + 45;
    this.ball.startY = 260;
    this.ball.targetX = 180;
    this.ball.targetY = 350;
    this.ball.progress = 0;
    this.ball.speed = 0.022 * (this.matchRules.bowlerSpeed || 1.2);
    this.ball.x = this.ball.startX;
    this.ball.y = this.ball.startY;
    this.ball.bounced = false;
    this.commentary = `Delivery: ${pick.name}! Time your swing!`;
  }

  hitShot() {
    this.batsman.swinging = true;
    this.batsman.swingProgress = 0;

    // Check timing difference around progress = 0.88 - 0.98
    const diff = Math.abs(this.ball.progress - 0.92);

    if (diff < 0.08) {
      // ⭐ PERFECT TIMING -> HUGE SIX!
      this.ball.state = 'hit';
      const angle = (Math.random() - 0.5) * 1.2;
      this.ball.vx = Math.sin(angle) * 16 + 6;
      this.ball.vy = -18;
      this.score += 6;
      this.sixesCount++;
      this.currentStreak++;
      this.shotFeedback = '💥 MAXIMUM 6! OUT OF THE STADIUM! 💥';
      this.feedbackColor = '#ffd166';
      this.commentary = `MONSTER SIX! ${this.playerTeam.name} crowd goes wild! (+6)`;
      sounds.playWin();
      this.emitCelebrationParticles(180, 340, 36);
      this.wagonWheel.push({ angle, runs: 6 });
    } else if (diff < 0.18) {
      // ⚡ GREAT TIMING -> BOUNDARY FOUR!
      this.ball.state = 'hit';
      const angle = (Math.random() - 0.5) * 1.5;
      this.ball.vx = Math.sin(angle) * 12 + 4;
      this.ball.vy = -12;
      this.score += 4;
      this.foursCount++;
      this.currentStreak++;
      this.shotFeedback = '⚡ CRACKING 4! RACES TO THE ROPES! ⚡';
      this.feedbackColor = '#00f2fe';
      this.commentary = `Glorious boundary through the covers for 4 runs! (+4)`;
      sounds.playPowerup();
      this.emitCelebrationParticles(180, 340, 20);
      this.wagonWheel.push({ angle, runs: 4 });
    } else if (diff < 0.32) {
      // 🏃 QUICK RUNS (1 or 2)
      const runs = Math.random() > 0.45 ? 2 : 1;
      this.ball.state = 'hit';
      const angle = (Math.random() - 0.5) * 1.8;
      this.ball.vx = Math.sin(angle) * 7 + 2;
      this.ball.vy = -7;
      this.score += runs;
      this.shotFeedback = `🏃 PUSHED FOR ${runs} RUN${runs > 1 ? 'S' : ''}`;
      this.feedbackColor = '#70e000';
      this.commentary = `Worked into the outfield for ${runs} run${runs > 1 ? 's' : ''}.`;
      sounds.playCoin();
      this.wagonWheel.push({ angle, runs });
    } else {
      // 🔴 WICKET / DOT BALL
      this.currentStreak = 0;
      this.ball.state = 'missed';
      if (Math.random() > 0.35) {
        this.wickets++;
        this.ball.state = 'wicket';
        this.shotFeedback = '🔴 OUT! TIMBER! BOWLED OUT!';
        this.feedbackColor = '#ff0055';
        this.commentary = `Clean bowled! ${this.opponentTeam.shortName} strikes! 🎯`;
        sounds.playHit();
        this.emitCelebrationParticles(95, 340, 24, '#ff0055');
      } else {
        this.shotFeedback = '⚪ BEATEN! DOT BALL';
        this.feedbackColor = '#94a3b8';
        this.commentary = `Swung and missed! Ball sails safely to the keeper.`;
        sounds.playClick();
      }
    }

    this.ballsDelivered++;
    this.ballsLeft = Math.max(0, this.ballsTotal - this.ballsDelivered);

    // Check Win/Loss conditions
    setTimeout(() => {
      const targetReached = this.isChasing && this.score >= this.targetScore;
      const allOut = this.wickets >= this.maxWickets;
      const matchEnded = this.ballsLeft <= 0 || allOut || targetReached;

      if (matchEnded) {
        this.endMatch(targetReached);
      } else {
        this.resetBall();
      }
    }, 1800);
  }

  resetBall() {
    this.ball.state = 'ready';
    this.ball.x = this.baseWidth / 2;
    this.ball.y = 170;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.batsman.swinging = false;
    this.bowler.y = 135;
    this.commentary = `Ball ${this.ballsDelivered + 1}/${this.ballsTotal} ready. Tap to Bowl!`;
  }

  endMatch(targetReached) {
    this.running = false;
    this.matchFinished = true;

    // Record score in portalState
    portalState.submitScore('game_cricket_premier_league', portalState.state.playerProfile.name, this.score);
    portalState.addXP(250);
    portalState.addCoins(200);

    this.renderMatchPresentationOverlay();
  }

  renderMatchPresentationOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'cricket-presentation-overlay';

    let outcomeTag = 'WIN 🏆';
    let outcomeClass = 'tag-win';
    let resultHeading = '';

    if (this.isChasing) {
      if (this.score >= this.targetScore) {
        outcomeTag = 'WIN 🏆';
        outcomeClass = 'tag-win';
        const wktsLeft = Math.max(1, this.maxWickets - this.wickets);
        resultHeading = `${this.playerTeam.name.toUpperCase()} WON BY ${wktsLeft} WKT${wktsLeft > 1 ? 'S' : ''}!`;
        sounds.playWin();
      } else if (this.score === this.targetScore - 1) {
        outcomeTag = 'DRAW ⚡';
        outcomeClass = 'tag-draw';
        resultHeading = `MATCH TIED! SUPER OVER DRAW!`;
        sounds.playPowerup();
      } else {
        outcomeTag = 'LOOSE 🔴';
        outcomeClass = 'tag-loose';
        const diff = (this.targetScore - 1) - this.score;
        resultHeading = `${this.opponentTeam.name.toUpperCase()} WON BY ${Math.max(1, diff)} RUN${diff > 1 ? 'S' : ''}!`;
        sounds.playHit();
      }
    } else {
      if (this.score >= 20) {
        outcomeTag = 'WIN 🏆';
        outcomeClass = 'tag-win';
        resultHeading = `CHAMPION KNOCK: ${this.score} RUNS!`;
        sounds.playWin();
      } else if (this.score >= 12) {
        outcomeTag = 'DRAW ⚡';
        outcomeClass = 'tag-draw';
        resultHeading = `SOLID EFFORT: ${this.score} RUNS!`;
        sounds.playPowerup();
      } else {
        outcomeTag = 'LOOSE 🔴';
        outcomeClass = 'tag-loose';
        resultHeading = `ALL OUT FOR ${this.score} RUNS`;
        sounds.playHit();
      }
    }

    const strikeRate = this.ballsDelivered > 0 ? ((this.score / this.ballsDelivered) * 100).toFixed(1) : '0.0';

    overlay.innerHTML = `
      <div class="cricket-pres-card">
        <div class="pres-outcome-badge ${outcomeClass}">${outcomeTag}</div>
        <h2 class="pres-result-heading">${resultHeading}</h2>

        <!-- Compact Teams Result Row -->
        <div class="pres-teams-summary-row">
          <div class="pres-team-col">
            <span class="pres-team-icon">${this.playerTeam.icon}</span>
            <b class="pres-team-title">${this.playerTeam.shortName}</b>
            <span class="pres-team-runs">${this.score}/${this.wickets}</span>
            <small>(${Math.floor(this.ballsDelivered / 6)}.${this.ballsDelivered % 6} Overs)</small>
          </div>

          <div class="pres-vs-text">VS</div>

          <div class="pres-team-col">
            <span class="pres-team-icon">${this.opponentTeam.icon}</span>
            <b class="pres-team-title">${this.opponentTeam.shortName}</b>
            <span class="pres-team-runs">${this.isChasing ? `${this.targetScore - 1}` : 'Target Chased'}</span>
            <small>Target: ${this.targetScore}</small>
          </div>
        </div>

        <!-- Clean Performance Metrics -->
        <div class="pres-stats-grid">
          <div class="pres-stat-item">
            <span>RUNS</span>
            <b>${this.score}</b>
          </div>
          <div class="pres-stat-item">
            <span>BOUNDARIES</span>
            <b>${this.foursCount}x4 • ${this.sixesCount}x6</b>
          </div>
          <div class="pres-stat-item">
            <span>STRIKE RATE</span>
            <b>${strikeRate}</b>
          </div>
          <div class="pres-stat-item">
            <span>REWARDS</span>
            <b style="color: #ffd166;">+250 XP 🪙</b>
          </div>
        </div>

        <!-- Clean Quick Action Buttons -->
        <div class="pres-actions-row">
          <button class="btn-pres-rematch" id="btn-pres-play-again">
            🏏 PLAY AGAIN
          </button>
          <button class="btn-pres-hub" id="btn-pres-change-teams">
            🏆 TEAMS & OVERS
          </button>
        </div>
      </div>
    `;

    this.wrapper.appendChild(overlay);

    overlay.querySelector('#btn-pres-play-again')?.addEventListener('click', () => {
      sounds.playClick();
      overlay.remove();
      this.reset();
    });

    overlay.querySelector('#btn-pres-change-teams')?.addEventListener('click', () => {
      sounds.playClick();
      overlay.remove();
      if (window.portalApp?.playerUI) {
        window.portalApp.playerUI.showGameModeHub();
      }
    });
  }

  reset() {
    this.score = 0;
    this.wickets = 0;
    this.ballsDelivered = 0;
    this.ballsLeft = this.ballsTotal;
    this.sixesCount = 0;
    this.foursCount = 0;
    this.currentStreak = 0;
    this.wagonWheel = [];
    this.particles = [];
    this.matchFinished = false;
    this.resetBall();
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  emitCelebrationParticles(x, y, count = 25, color = null) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 3,
        color: color || [this.playerTeam.primaryColor, '#ffd166', '#00f2fe', '#ffffff'][Math.floor(Math.random() * 4)],
        size: Math.random() * 5 + 3,
        alpha: 1
      });
    }
  }

  update(dt) {
    if (!this.running) return;

    // Ball movement
    if (this.ball.state === 'bowled') {
      this.ball.progress = Math.min(1.2, this.ball.progress + this.ball.speed);
      
      // Interpolate x and y
      const p = this.ball.progress;
      this.ball.x = this.ball.startX + (this.ball.targetX - this.ball.startX) * p;
      this.ball.y = this.ball.startY + (this.ball.targetY - this.ball.startY) * p;

      // Spin break on pitch bounce around p = 0.55
      if (p > 0.55 && !this.ball.bounced) {
        this.ball.bounced = true;
        sounds.playClick();
      }

      if (this.ball.progress >= 1.05 && !this.batsman.swinging) {
        this.hitShot();
      }
    } else if (this.ball.state === 'hit') {
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
    }

    if (this.batsman.swinging) {
      this.batsman.swingProgress = Math.min(1, this.batsman.swingProgress + 0.14);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.alpha -= 0.025;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // 1. Stadium Night Sky & Floodlights Backdrop
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 240);
    skyGrad.addColorStop(0, '#050b14');
    skyGrad.addColorStop(0.5, '#0b162c');
    skyGrad.addColorStop(1, '#111e38');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.baseWidth, 240);

    // 2. Stadium Floodlight Towers (Glowing Clusters)
    const lights = [
      { x: 100, y: 150 },
      { x: this.baseWidth - 140, y: 150 }
    ];

    lights.forEach((l) => {
      // Glow aura
      const aura = this.ctx.createRadialGradient(l.x, l.y, 10, l.x, l.y, 90);
      aura.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      aura.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(l.x, l.y, 90, 0, Math.PI * 2);
      this.ctx.fill();

      // Light grid
      this.ctx.fillStyle = '#ffffff';
      for (let r = -2; r <= 2; r++) {
        for (let c = -3; c <= 3; c++) {
          this.ctx.beginPath();
          this.ctx.arc(l.x + c * 8, l.y + r * 6, 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    });

    // 3. Stadium Tiered Stands & Crowds
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 220);
    this.ctx.quadraticCurveTo(this.baseWidth / 2, 170, this.baseWidth, 220);
    this.ctx.lineTo(this.baseWidth, 270);
    this.ctx.lineTo(0, 270);
    this.ctx.closePath();
    this.ctx.fill();

    // Cheering Crowd Pixels
    const now = performance.now() * 0.005;
    this.crowd.forEach((c) => {
      const jump = Math.sin(now + c.jumpOffset) * 2;
      this.ctx.fillStyle = c.color;
      this.ctx.beginPath();
      this.ctx.arc(c.x, 210 + (c.y % 40) + jump, c.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 4. Center Electronic Digital Scoreboard
    const sbW = 70;
    const sbH = 34;
    const sbX = this.baseWidth / 2 - sbW / 2;
    const sbY = 220;
    this.ctx.fillStyle = '#064e3b';
    this.ctx.fillRect(sbX, sbY, sbW, sbH);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(sbX, sbY, sbW, sbH);
    // Scoreboard LED Matrix Dots
    this.ctx.fillStyle = '#fde047';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        this.ctx.fillRect(sbX + 8 + i * 14, sbY + 6 + j * 8, 8, 4);
      }
    }

    // 5. Stadium Boundary Sponsor Cushions (Curved Arc)
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 260);
    this.ctx.quadraticCurveTo(this.baseWidth / 2, 230, this.baseWidth, 260);
    this.ctx.stroke();

    // 6. Lush Green Outfield & Inner Ring
    const grass = this.ctx.createLinearGradient(0, 260, 0, this.baseHeight);
    grass.addColorStop(0, '#4ade80');
    grass.addColorStop(0.3, '#22c55e');
    grass.addColorStop(0.7, '#16a34a');
    grass.addColorStop(1, '#15803d');
    this.ctx.fillStyle = grass;
    this.ctx.fillRect(0, 260, this.baseWidth, this.baseHeight - 260);

    // Mowing Grass Stripes
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let y = 270; y < this.baseHeight; y += 36) {
      this.ctx.fillRect(0, y, this.baseWidth, 18);
    }

    // 7. 2.5D Perspective Pitch (Running diagonally towards batsman on left)
    const pitch = this.ctx.createLinearGradient(0, 260, 0, this.baseHeight);
    pitch.addColorStop(0, '#d4a373');
    pitch.addColorStop(0.5, '#e9c46a');
    pitch.addColorStop(1, '#ddb892');
    this.ctx.fillStyle = pitch;

    this.ctx.beginPath();
    this.ctx.moveTo(this.baseWidth / 2 + 20, 260);
    this.ctx.lineTo(this.baseWidth / 2 + 70, 260);
    this.ctx.lineTo(this.baseWidth / 2 + 10, this.baseHeight - 30);
    this.ctx.lineTo(60, this.baseHeight - 30);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#fefae0';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Batting Crease White Line (Left)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(160, 395, 26, 4);

    // 8. Red/Wood Stumps at Crease
    this.ctx.fillStyle = '#dc2626';
    for (let i = 0; i < 3; i++) {
      this.ctx.fillRect(92 + i * 5, 340, 3.5, 38);
    }
    this.ctx.fillRect(90, 338, 16, 3); // Bails

    // Stumps Indicator Lights
    this.ctx.fillStyle = '#fde047';
    this.ctx.fillRect(92, 350, 12, 3);

    // 9. Realistic Batsman Sprite (Positioned on Left in 2.5D Stance)
    this.drawBatsmanCharacter();

    // 10. Bowler / Delivery Ball
    this.drawBallAndBowler();

    // 11. Celebration Confetti / Particles
    this.particles.forEach((p) => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
      this.ctx.restore();
    });

    // 12. Top-Left & Top-Right Square Buttons
    this.drawHeaderCornerButtons();

    // 13. Top-Left Target HUD Box, Power Arc, Bottom Banner & Tap Prompt
    this.drawScoreboard();
    this.drawCommentaryAndFeedback();
  }

  drawHeaderCornerButtons() {
    // Top-Left Pause Button
    const btnSize = 38;
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(20, 16, btnSize, btnSize);
    this.ctx.strokeStyle = '#dc2626';
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeRect(20, 16, btnSize, btnSize);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(29, 24, 6, 22);
    this.ctx.fillRect(41, 24, 6, 22);

    // Top-Right Audio Button
    const rightX = this.baseWidth - 20 - btnSize;
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(rightX, 16, btnSize, btnSize);
    this.ctx.strokeStyle = '#dc2626';
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeRect(rightX, 16, btnSize, btnSize);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px "Outfit", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🔊', rightX + btnSize / 2, 16 + btnSize / 2);
  }

  drawBatsmanCharacter() {
    const bx = 180;
    const by = 350;
    const primaryColor = this.playerTeam.primaryColor || '#0284c7';

    // Shadow on pitch
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(bx, by + 42, 28, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 1. Batting Pads / Legs
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(bx - 14, by + 4, 10, 36); // Left Leg Pad
    this.ctx.fillRect(bx + 4, by + 4, 10, 36);  // Right Leg Pad
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(bx - 14, by + 4, 10, 36);
    this.ctx.strokeRect(bx + 4, by + 4, 10, 36);

    // 2. Torso & Jersey
    this.ctx.fillStyle = primaryColor;
    this.ctx.beginPath();
    this.ctx.roundRect(bx - 18, by - 42, 36, 48, 6);
    this.ctx.fill();

    // Team Text on Jersey
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '900 9px "Outfit", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.playerTeam.shortName || 'INDIA', bx, by - 20);

    // 3. Batting Gloves (White/Blue)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(bx - 12, by - 2, 7, 0, Math.PI * 2);
    this.ctx.arc(bx + 4, by + 6, 7, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Helmet & Face Grill
    this.ctx.fillStyle = primaryColor;
    this.ctx.beginPath();
    this.ctx.arc(bx, by - 56, 16, 0, Math.PI * 2);
    this.ctx.fill();

    // Helmet Peak Visor
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.moveTo(bx - 14, by - 52);
    this.ctx.lineTo(bx + 18, by - 50);
    this.ctx.lineTo(bx + 14, by - 46);
    this.ctx.lineTo(bx - 14, by - 46);
    this.ctx.closePath();
    this.ctx.fill();

    // Steel Grill
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(bx, by - 52);
    this.ctx.lineTo(bx + 12, by - 44);
    this.ctx.lineTo(bx + 12, by - 38);
    this.ctx.lineTo(bx - 4, by - 38);
    this.ctx.stroke();

    // 5. Cricket Bat
    this.ctx.save();
    this.ctx.translate(bx - 4, by + 4);
    const batAngle = this.batsman.swinging ? -Math.PI / 4 + this.batsman.swingProgress * 1.5 * Math.PI : -Math.PI / 3.5;
    this.ctx.rotate(batAngle);

    // Wood Blade
    this.ctx.fillStyle = '#cca47c';
    this.ctx.fillRect(0, -6, 52, 14);
    this.ctx.strokeStyle = '#7f5539';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(0, -6, 52, 14);

    // Rubber Grip Handle
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-18, -3, 18, 8);
    this.ctx.restore();
  }

  drawBallAndBowler() {
    // Delivery Ball
    if (this.ball.state === 'bowled' || this.ball.state === 'hit' || this.ball.state === 'runup') {
      // 3D Perspective Scale
      const scale = Math.min(1.6, Math.max(0.6, (this.ball.y - 170) / 250 + 0.6));
      const r = this.ball.radius * scale;

      // Ball Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.beginPath();
      this.ctx.ellipse(this.ball.x, this.ball.y + 12, r, r * 0.4, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Red Leather Ball
      const ballGrad = this.ctx.createRadialGradient(this.ball.x - 2, this.ball.y - 2, 1, this.ball.x, this.ball.y, r);
      ballGrad.addColorStop(0, '#f87171');
      ballGrad.addColorStop(0.4, '#dc2626');
      ballGrad.addColorStop(1, '#7f1d1d');
      this.ctx.fillStyle = ballGrad;
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, r, 0, Math.PI * 2);
      this.ctx.fill();

      // White Seam
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, r, -0.5, 0.5);
      this.ctx.stroke();
    }
  }

  drawScoreboard() {
    // 1. Top-Left Target HUD Box (Poki Style)
    const boxW = 190;
    const boxH = 110;
    const boxX = 20;
    const boxY = 16;

    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(boxX, boxY, boxW, boxH);
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Inner Target Cell Header
    this.ctx.fillStyle = '#1f2937';
    this.ctx.fillRect(boxX + 6, boxY + 6, boxW - 12, 42);
    this.ctx.strokeStyle = '#374151';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(boxX + 6, boxY + 6, boxW - 12, 42);

    this.ctx.textAlign = 'left';
    this.ctx.font = '900 13px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffd166';
    this.ctx.fillText(this.isChasing ? 'TARGET' : 'RUNS', boxX + 14, boxY + 24);

    this.ctx.font = '900 24px "Lilita One", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(this.isChasing ? `${this.targetScore}` : `${this.score}`, boxX + 14, boxY + 44);

    // Current Score on Right
    this.ctx.textAlign = 'right';
    this.ctx.font = '900 12px "Outfit", sans-serif';
    this.ctx.fillStyle = '#9ca3af';
    this.ctx.fillText('SCORE', boxX + boxW - 14, boxY + 24);

    this.ctx.font = '900 20px "Lilita One", sans-serif';
    this.ctx.fillStyle = '#10b981';
    this.ctx.fillText(`${this.score}/${this.wickets}`, boxX + boxW - 14, boxY + 44);

    // Balls Left Row
    this.ctx.textAlign = 'left';
    this.ctx.font = 'bold 12px "Outfit", sans-serif';
    this.ctx.fillStyle = '#e5e7eb';
    this.ctx.fillText(`BALLS LEFT : ${this.ballsLeft} 🔴`, boxX + 14, boxY + 72);

    // Wickets Left Row
    const wktsLeft = Math.max(0, this.maxWickets - this.wickets);
    this.ctx.fillText(`WICKETS LEFT : ${wktsLeft} 🏏`, boxX + 14, boxY + 96);

    // 2. Right-Side Power & Timing Meter Arc (Poki Style)
    this.drawPowerArc();

    // 3. Bottom Team VS Team Banner
    this.drawBottomTeamsBanner();
  }

  drawPowerArc() {
    const arcCenterX = this.baseWidth + 40;
    const arcCenterY = 170;
    const radius = 170;

    // Draw Arc Track
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.arc(arcCenterX, arcCenterY, radius, Math.PI * 0.75, Math.PI * 1.25);
    this.ctx.stroke();

    // Zone Markers & Numbers (1, 2, 3, 4, 6)
    const zones = [
      { num: '6', angle: Math.PI * 0.80, color: '#ffd166' },
      { num: '4', angle: Math.PI * 0.92, color: '#00f2fe' },
      { num: '3', angle: Math.PI * 1.04, color: '#38bdf8' },
      { num: '2', angle: Math.PI * 1.14, color: '#70e000' },
      { num: '1', angle: Math.PI * 1.22, color: '#ffffff' }
    ];

    zones.forEach((z) => {
      const zx = arcCenterX + Math.cos(z.angle) * (radius - 24);
      const zy = arcCenterY + Math.sin(z.angle) * (radius - 24);

      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = '900 18px "Lilita One", sans-serif';
      this.ctx.fillStyle = z.color;
      this.ctx.fillText(z.num, zx, zy);

      // Dash tick on arc
      const tx1 = arcCenterX + Math.cos(z.angle) * (radius - 8);
      const ty1 = arcCenterY + Math.sin(z.angle) * (radius - 8);
      const tx2 = arcCenterX + Math.cos(z.angle) * (radius + 8);
      const ty2 = arcCenterY + Math.sin(z.angle) * (radius + 8);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(tx1, ty1);
      this.ctx.lineTo(tx2, ty2);
      this.ctx.stroke();
    });

    // Dynamic timing needle sweep
    const sweep = Math.sin(performance.now() * 0.005) * 0.22 + 1.0;
    const nx = arcCenterX + Math.cos(Math.PI * sweep) * (radius + 4);
    const ny = arcCenterY + Math.sin(Math.PI * sweep) * (radius + 4);
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(nx, ny, 7, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawBottomTeamsBanner() {
    const bannerW = 420;
    const bannerH = 42;
    const bannerX = (this.baseWidth - bannerW) / 2;
    const bannerY = this.baseHeight - 52;

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.beginPath();
    this.ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 20);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Team 1 Name
    this.ctx.textAlign = 'right';
    this.ctx.font = '900 16px "Outfit", sans-serif';
    this.ctx.fillStyle = this.playerTeam.primaryColor || '#00f2fe';
    this.ctx.fillText(`${this.playerTeam.icon} ${this.playerTeam.name.toUpperCase()}`, this.baseWidth / 2 - 36, bannerY + 26);

    // VS Shield Badge in Center
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(this.baseWidth / 2, bannerY + 21, 16, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = '900 12px "Lilita One", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('VS', this.baseWidth / 2, bannerY + 22);

    // Team 2 Name
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.font = '900 16px "Outfit", sans-serif';
    this.ctx.fillStyle = this.opponentTeam.primaryColor || '#ffd166';
    this.ctx.fillText(`${this.opponentTeam.name.toUpperCase()} ${this.opponentTeam.icon}`, this.baseWidth / 2 + 36, bannerY + 26);
  }

  drawCommentaryAndFeedback() {
    // Center Prompt Box: 'TAP TO HIT THE SHOT' / 'TAP TO BOWL'
    if (this.ball.state === 'ready' || this.ball.state === 'bowled') {
      const btnW = 340;
      const btnH = 64;
      const btnX = (this.baseWidth - btnW) / 2;
      const btnY = 220;

      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillRect(btnX, btnY, btnW, btnH);
      this.ctx.strokeStyle = '#dc2626';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(btnX, btnY, btnW, btnH);

      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = '900 24px "Lilita One", sans-serif';
      this.ctx.fillStyle = '#0f172a';
      const promptText = this.ball.state === 'ready' ? '🏏 TAP TO BOWL' : '⚡ TAP TO HIT THE SHOT!';
      this.ctx.fillText(promptText, this.baseWidth / 2, btnY + btnH / 2);
    }

    if (this.shotFeedback) {
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'alphabetic';
      this.ctx.font = '900 32px "Lilita One", sans-serif';
      this.ctx.fillStyle = this.feedbackColor;
      this.ctx.shadowColor = this.feedbackColor;
      this.ctx.shadowBlur = 15;
      this.ctx.fillText(this.shotFeedback, this.baseWidth / 2, 320);
      this.ctx.shadowBlur = 0;
    }
  }

  loop(timestamp = performance.now()) {
    if (!this.running) return;
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();
    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  destroy() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.onKey);
    this.wrapper.remove();
  }
}
