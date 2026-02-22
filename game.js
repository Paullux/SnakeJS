/**
 * Snake Game — Nokia 3310 Style
 * Canvas: 336×288px logical (= 42×36 cells of 8px)
 * Colours: 2-shade LCD palette
 */
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx    = canvas.getContext('2d');

  // ── Palette LCD Nokia ──────────────────────────────────────────
  const COL = {
    bg:     '#849669',   // fond écran
    dark:   '#2c3a1e',   // serpent / cadre
    mid:    '#4a5e30',   // nourriture (point clignotant)
    light:  '#a8b88a',   // texte clair
  };

  // ── Grille ─────────────────────────────────────────────────────
  const CELL   = 8;                         // px par case
  const COLS   = canvas.width  / CELL;      // 42
  const ROWS   = canvas.height / CELL;      // 36

  // ── État du jeu ────────────────────────────────────────────────
  let state   = 'title';   // 'title' | 'playing' | 'paused' | 'gameover' | 'leaderboard'
  let snake, dir, nextDir, food, score, level, speed, ticker, foodBlink;

  // ── DOM ────────────────────────────────────────────────────────
  const screens = {
    title:       document.getElementById('titleScreen'),
    gameover:    document.getElementById('gameoverScreen'),
    leaderboard: document.getElementById('leaderboardScreen'),
  };
  const hudScore = document.getElementById('hudScore');
  const hudLevel = document.getElementById('hudLevel');
  const goScore  = document.getElementById('goScore');

  // ── Utilities ──────────────────────────────────────────────────
  function showOverlay(name) {
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
  }
  function hideAllOverlays() {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
  }

  function rand(n) { return Math.floor(Math.random() * n); }

  // ── Init / Reset ───────────────────────────────────────────────
  function initGame() {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    snake   = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    dir     = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score   = 0;
    level   = 1;
    speed   = 150;
    foodBlink = 0;
    placeFood();
    updateHUD();
  }

  function placeFood() {
    let pos;
    do {
      pos = { x: rand(COLS), y: rand(ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function updateHUD() {
    hudScore.textContent = score;
    hudLevel.textContent = level;
  }

  // ── Game Loop ──────────────────────────────────────────────────
  function startLoop() {
    clearInterval(ticker);
    ticker = setInterval(step, speed);
  }

  function step() {
    if (state !== 'playing') return;

    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Mur
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return gameOver();
    }
    // Corps
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      // Mange
      score += 10 * level;
      // Niveau tous les 50 points
      const newLevel = Math.min(10, 1 + Math.floor(score / 50));
      if (newLevel > level) {
        level = newLevel;
        speed = Math.max(60, 150 - (level - 1) * 10);
        startLoop();
      }
      placeFood();
      updateHUD();
    } else {
      snake.pop();
    }

    foodBlink = (foodBlink + 1) % 4;
    draw();
  }

  // ── Draw ───────────────────────────────────────────────────────
  function draw() {
    // Fond
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille (pixels)
    drawGrid();

    // Nourriture
    if (foodBlink < 3) {
      ctx.fillStyle = COL.dark;
      drawCell(food.x, food.y);
      // Croix de nourriture style Nokia
      ctx.fillStyle = COL.bg;
      ctx.fillRect(food.x * CELL + 3, food.y * CELL + 1, 2, CELL - 2);
      ctx.fillRect(food.x * CELL + 1, food.y * CELL + 3, CELL - 2, 2);
    }

    // Serpent
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? COL.dark : COL.mid;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 1, CELL - 1);
    });

    // Tête : yeux
    drawEyes();

    // Bordure LCD
    ctx.strokeStyle = COL.dark;
    ctx.lineWidth   = 1;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  }

  function drawGrid() {
    ctx.fillStyle = 'rgba(44,58,30,0.06)';
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }

  function drawCell(x, y) {
    ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  }

  function drawEyes() {
    const h = snake[0];
    ctx.fillStyle = COL.bg;
    // Yeux en fonction de la direction
    if (dir.x === 1) {         // droite
      ctx.fillRect(h.x * CELL + 5, h.y * CELL + 2, 2, 2);
      ctx.fillRect(h.x * CELL + 5, h.y * CELL + 5, 2, 2);
    } else if (dir.x === -1) { // gauche
      ctx.fillRect(h.x * CELL + 1, h.y * CELL + 2, 2, 2);
      ctx.fillRect(h.x * CELL + 1, h.y * CELL + 5, 2, 2);
    } else if (dir.y === -1) { // haut
      ctx.fillRect(h.x * CELL + 2, h.y * CELL + 1, 2, 2);
      ctx.fillRect(h.x * CELL + 5, h.y * CELL + 1, 2, 2);
    } else {                   // bas
      ctx.fillRect(h.x * CELL + 2, h.y * CELL + 5, 2, 2);
      ctx.fillRect(h.x * CELL + 5, h.y * CELL + 5, 2, 2);
    }
  }

  // ── Title screen draw ──────────────────────────────────────────
  function drawTitleCanvas() {
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Décorations serpent sur le canvas en dessous de l'overlay
    ctx.fillStyle = COL.mid;
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(i * 18 + 4, canvas.height - 14, 14, 6);
    }
    ctx.fillStyle = COL.dark;
    ctx.fillRect(2, canvas.height - 14, 14, 6);
  }

  // ── Game Over ──────────────────────────────────────────────────
  function gameOver() {
    clearInterval(ticker);
    state = 'gameover';
    goScore.textContent = `Score: ${score}`;
    showOverlay('gameover');

    // Animation flash
    let flashes = 0;
    const flash = setInterval(() => {
      ctx.fillStyle = flashes % 2 === 0 ? COL.dark : COL.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flashes++;
      if (flashes >= 6) { clearInterval(flash); draw(); }
    }, 80);
  }

  // ── Leaderboard toggle ─────────────────────────────────────────
  function showLeaderboard() {
    clearInterval(ticker);
    state = 'leaderboard';
    showOverlay('leaderboard');
    loadLeaderboard();
  }

  // ── Transitions ─────────────────────────────────────────────────
  function startGame() {
    initGame();
    hideAllOverlays();
    state = 'playing';
    drawTitleCanvas();
    startLoop();
  }

  // ── Contrôles clavier ──────────────────────────────────────────
  const KEY_MAP = {
    ArrowUp:    { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
    ArrowDown:  { x: 0, y:  1 }, s: { x: 0, y:  1 }, S: { x: 0, y:  1 },
    ArrowLeft:  { x:-1, y:  0 }, a: { x:-1, y:  0 }, A: { x:-1, y:  0 },
    ArrowRight: { x: 1, y:  0 }, d: { x: 1, y:  0 }, D: { x: 1, y:  0 },
  };

  document.addEventListener('keydown', e => {
    if (state === 'title' || state === 'leaderboard') {
      if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
           'w','a','s','d','W','A','S','D'].includes(e.key)) {
        if (state === 'leaderboard') { showOverlay('title'); state = 'title'; }
        else startGame();
        return;
      }
    }

    if (state === 'gameover') {
      if (e.key === 'Enter') document.getElementById('submitScore').click();
      return;
    }

    if (state === 'playing') {
      const newDir = KEY_MAP[e.key];
      if (newDir) {
        // Empêche demi-tour
        if (newDir.x !== -dir.x || newDir.y !== -dir.y) nextDir = newDir;
        e.preventDefault();
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause();
    }
  });

  function togglePause() {
    if (state === 'playing') {
      clearInterval(ticker);
      state = 'paused';
      // Dessine PAUSE
      ctx.fillStyle = 'rgba(132,150,105,0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COL.dark;
      ctx.font = 'bold 14px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
    } else if (state === 'paused') {
      state = 'playing';
      startLoop();
    }
  }

  // ── Boutons HTML ───────────────────────────────────────────────
  function bindBtn(id, action) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', action);
    el.addEventListener('touchstart', e => { e.preventDefault(); action(); }, { passive: false });
  }

  function dirAction(dx, dy) {
    return () => {
      if (state === 'title' || state === 'leaderboard') { startGame(); return; }
      if (state !== 'playing') return;
      const newDir = { x: dx, y: dy };
      if (newDir.x !== -dir.x || newDir.y !== -dir.y) nextDir = newDir;
    };
  }

  bindBtn('btnUp',     dirAction( 0, -1));
  bindBtn('btnDown',   dirAction( 0,  1));
  bindBtn('btnLeft',   dirAction(-1,  0));
  bindBtn('btnRight',  dirAction( 1,  0));
  bindBtn('btnCenter', () => {
    if (state === 'title' || state === 'leaderboard') startGame();
    else if (state === 'playing' || state === 'paused') togglePause();
  });
  bindBtn('btnMenu', () => {
    if (state === 'playing') { clearInterval(ticker); state = 'title'; showOverlay('title'); }
    else if (state === 'title') startGame();
  });
  bindBtn('btnLeaderboard', showLeaderboard);

  // Clic sur "BACK" dans le leaderboard
  document.querySelector('.lb-back')?.addEventListener('click', () => {
    state = 'title';
    showOverlay('title');
  });

  // Game Over : soumission du score
  document.getElementById('submitScore')?.addEventListener('click', async () => {
    const name = (document.getElementById('playerName').value.trim().toUpperCase() || 'AAA').substring(0, 10);
    await submitScore(name, score);
    state = 'title';
    showOverlay('title');
  });
  document.getElementById('skipScore')?.addEventListener('click', () => {
    state = 'title';
    showOverlay('title');
  });

  // ── Initial draw ───────────────────────────────────────────────
  drawTitleCanvas();
  showOverlay('title');
})();
