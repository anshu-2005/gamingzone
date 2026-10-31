(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  
  const scoreVal = document.getElementById('score-val');
  const highScoreVal = document.getElementById('high-score-val');
  const finalScore = document.getElementById('final-score');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const btnStart = document.getElementById('btn-start');
  const btnRestart = document.getElementById('btn-restart');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Simple Synthesizer Audio
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  function beep(freq, type = 'sine', duration = 0.1) {
    try {
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // Game State
  let isPlaying = false;
  let score = 0;
  let highScore = parseInt(localStorage.getItem('space_dodge_high') || '0', 10);
  highScoreVal.textContent = highScore;

  // Player
  const player = {
    x: width / 2,
    y: height - 80,
    width: 32,
    height: 38,
    speed: 7,
    dx: 0
  };

  // Asteroids & Stars
  let asteroids = [];
  let stars = [];
  let particles = [];
  let spawnTimer = 0;

  // Starfield background
  const starfield = Array.from({ length: 60 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    speed: 0.5 + Math.random() * 2,
    size: 1 + Math.random() * 2
  }));

  // Keyboard controls
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    keys[e.code] = false;
  });

  // Touch / pointer controls
  let pointerTargetX = null;
  window.addEventListener('pointermove', (e) => {
    if (isPlaying) pointerTargetX = e.clientX;
  });
  window.addEventListener('pointerdown', (e) => {
    if (isPlaying) pointerTargetX = e.clientX;
  });
  window.addEventListener('pointerup', () => {
    pointerTargetX = null;
  });

  function start() {
    isPlaying = true;
    score = 0;
    asteroids = [];
    particles = [];
    player.x = width / 2;
    player.y = height - 80;
    scoreVal.textContent = '0';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    beep(520, 'triangle', 0.15);
  }

  function gameOver() {
    isPlaying = false;
    beep(140, 'sawtooth', 0.35);
    finalScore.textContent = score;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('space_dodge_high', highScore);
      highScoreVal.textContent = highScore;
    }
    gameOverScreen.classList.remove('hidden');

    // Create explosion particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: ['#ff4444', '#ff8800', '#ffee00'][Math.floor(Math.random() * 3)]
      });
    }
  }

  btnStart.addEventListener('click', start);
  btnRestart.addEventListener('click', start);

  // Main Loop
  function loop() {
    requestAnimationFrame(loop);

    // Update Starfield
    starfield.forEach(s => {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });

    if (isPlaying) {
      // Movement
      if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;

      if (pointerTargetX !== null) {
        player.x += (pointerTargetX - player.x) * 0.15;
      }

      // Bounds
      player.x = Math.max(player.width / 2, Math.min(width - player.width / 2, player.x));

      // Spawning
      spawnTimer++;
      if (spawnTimer % 24 === 0) {
        asteroids.push({
          x: 20 + Math.random() * (width - 40),
          y: -30,
          radius: 14 + Math.random() * 16,
          speed: 3 + Math.random() * 3.5,
          rot: 0,
          vrot: (Math.random() - 0.5) * 0.1
        });
      }

      // Update Asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        a.y += a.speed;
        a.rot += a.vrot;

        // Collision check
        const dist = Math.hypot(player.x - a.x, player.y - a.y);
        if (dist < a.radius + player.width / 2) {
          gameOver();
          break;
        }

        // Passed safely
        if (a.y > height + 40) {
          asteroids.splice(i, 1);
          score += 10;
          scoreVal.textContent = score;
          beep(600, 'sine', 0.05);
        }
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // --- Render ---
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, width, height);

    // Draw Starfield
    ctx.fillStyle = '#ffffff';
    starfield.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Asteroids
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Draw Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Spaceship
    if (isPlaying) {
      ctx.save();
      ctx.translate(player.x, player.y);
      // Jet flame
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.moveTo(-6, 16);
      ctx.lineTo(6, 16);
      ctx.lineTo(0, 24 + Math.random() * 6);
      ctx.closePath();
      ctx.fill();

      // Ship body
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(16, 16);
      ctx.lineTo(0, 10);
      ctx.lineTo(-16, 16);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  requestAnimationFrame(loop);
})();

