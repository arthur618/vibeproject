// Game 04: 虫洞贪吃蛇 · Portal Snake
export function createPortalSnake(api) {
  let w = api.width;
  let h = api.height;

  const COLS = 24;
  const ROWS = 16;

  let snake = [];
  let dir = { x: 1, y: 0 };
  let dirQueue = [];
  let food = null;
  let portals = []; // [portalA, portalB]
  let particles = [];
  let score = 0;
  let warps = 0;
  let stepTimer = 0;
  let stepInterval = 0.125;
  let pulse = 0;
  let alive = false;
  let touchStart = null;

  function boardMetrics() {
    const pad = 20;
    const cell = Math.floor(Math.min((w - pad * 2) / COLS, (h - pad * 2) / ROWS));
    const bw = cell * COLS;
    const bh = cell * ROWS;
    const ox = Math.floor((w - bw) / 2);
    const oy = Math.floor((h - bh) / 2);
    return { cell, bw, bh, ox, oy };
  }

  function isOccupied(x, y) {
    if (snake.some((s) => s.x === x && s.y === y)) return true;
    if (food && food.x === x && food.y === y) return true;
    if (portals.some((p) => p.x === x && p.y === y)) return true;
    return false;
  }

  function randomFreeCell(margin = 0) {
    for (let tries = 0; tries < 200; tries++) {
      const x = margin + Math.floor(Math.random() * (COLS - margin * 2));
      const y = margin + Math.floor(Math.random() * (ROWS - margin * 2));
      if (!isOccupied(x, y)) return { x, y };
    }
    return { x: 1, y: 1 };
  }

  function spawnFood() {
    const pos = randomFreeCell(0);
    const isGold = Math.random() < 0.22;
    food = { x: pos.x, y: pos.y, gold: isGold };
  }

  function spawnPortals() {
    portals = [];
    const a = randomFreeCell(2);
    portals.push({ x: a.x, y: a.y, color: '#38bdf8' });
    let b = randomFreeCell(2);
    for (let i = 0; i < 20 && Math.hypot(b.x - a.x, b.y - a.y) < 7; i++) {
      b = randomFreeCell(2);
    }
    portals.push({ x: b.x, y: b.y, color: '#fb923c' });
  }

  function burstCell(cx, cy, color, count = 14) {
    const { cell, ox, oy } = boardMetrics();
    const px = ox + (cx + 0.5) * cell;
    const py = oy + (cy + 0.5) * cell;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 140;
      particles.push({
        x: px,
        y: py,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        size: 2.5 + Math.random() * 2.5,
        color,
      });
    }
  }

  function reset() {
    const startX = 6;
    const startY = Math.floor(ROWS / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
      { x: startX - 3, y: startY },
    ];
    dir = { x: 1, y: 0 };
    dirQueue = [];
    food = null;
    portals = [];
    particles = [];
    score = 0;
    warps = 0;
    stepTimer = 0;
    stepInterval = 0.125;
    alive = true;
    spawnPortals();
    spawnFood();
    api.setHud({ score: 0, extra: '0 次', scoreLabel: '得分', extraLabel: '跃迁' });
  }

  function queueDirection(nx, ny) {
    if (!alive || !api.isRunning()) return;
    const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if (last.x + nx === 0 && last.y + ny === 0) return;
    if (last.x === nx && last.y === ny) return;
    if (dirQueue.length < 3) dirQueue.push({ x: nx, y: ny });
  }

  function step() {
    if (dirQueue.length) {
      dir = dirQueue.shift();
    }
    const head = snake[0];
    let nx = head.x + dir.x;
    let ny = head.y + dir.y;

    // Wall collision
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      die('撞上了量子边界！');
      return;
    }

    // Wormhole portal teleportation!
    let teleported = false;
    if (portals.length === 2) {
      if (nx === portals[0].x && ny === portals[0].y) {
        burstCell(nx, ny, portals[0].color, 16);
        nx = portals[1].x + dir.x;
        ny = portals[1].y + dir.y;
        teleported = true;
      } else if (nx === portals[1].x && ny === portals[1].y) {
        burstCell(nx, ny, portals[1].color, 16);
        nx = portals[0].x + dir.x;
        ny = portals[0].y + dir.y;
        teleported = true;
      }
    }

    if (teleported) {
      // Wrap exit safely if portal happened to be next to edge
      nx = (nx + COLS) % COLS;
      ny = (ny + ROWS) % ROWS;
      warps++;
      score += 15;
      api.sound.portal();
      burstCell(nx, ny, '#ffffff', 14);
      if (warps % 3 === 0) spawnPortals();
    }

    // Self collision (ignore tail tip if not growing)
    const willEat = food && nx === food.x && ny === food.y;
    const bodyCheck = willEat ? snake : snake.slice(0, -1);
    if (bodyCheck.some((s) => s.x === nx && s.y === ny)) {
      die('咬到了自己的光尾！');
      return;
    }

    snake.unshift({ x: nx, y: ny });

    if (willEat) {
      score += food.gold ? 30 : 10;
      api.sound.collect(snake.length);
      burstCell(nx, ny, food.gold ? '#fde047' : '#34d399', 16);
      stepInterval = Math.max(0.068, 0.125 - (snake.length - 4) * 0.0022);
      spawnFood();
    } else {
      snake.pop();
    }

    api.setHud({
      score,
      extra: `${warps} 次`,
      scoreLabel: '得分',
      extraLabel: '跃迁',
    });
  }

  function die(title) {
    alive = false;
    api.sound.explode();
    if (snake[0]) burstCell(snake[0].x, snake[0].y, '#fb7185', 28);
    api.gameOver({
      score,
      title,
      subtitle: `你的霓虹蛇长到了 ${snake.length} 节，完成了 ${warps} 次虫洞跃迁。`,
      stats: [
        { label: '最终得分', value: score },
        { label: '蛇身长度', value: snake.length },
      ],
    });
  }

  function onKeyDown(e) {
    if (!api.isRunning()) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); queueDirection(0, -1); }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); queueDirection(0, 1); }
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); queueDirection(-1, 0); }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); queueDirection(1, 0); }
  }

  function onPointerDown(e) {
    if (!api.isRunning()) return;
    touchStart = api.getPointerPos(e);
  }

  function onPointerUp(e) {
    if (!touchStart || !api.isRunning()) return;
    const end = api.getPointerPos(e);
    const dx = end.x - touchStart.x;
    const dy = end.y - touchStart.y;
    if (Math.hypot(dx, dy) > 18) {
      if (Math.abs(dx) > Math.abs(dy)) queueDirection(dx > 0 ? 1 : -1, 0);
      else queueDirection(0, dy > 0 ? 1 : -1);
    } else if (snake[0]) {
      // Tap relative to snake head to steer
      const { cell, ox, oy } = boardMetrics();
      const hx = ox + (snake[0].x + 0.5) * cell;
      const hy = oy + (snake[0].y + 0.5) * cell;
      const rx = end.x - hx;
      const ry = end.y - hy;
      if (dir.x !== 0) queueDirection(0, ry >= 0 ? 1 : -1);
      else queueDirection(rx >= 0 ? 1 : -1, 0);
    }
    touchStart = null;
  }

  window.addEventListener('keydown', onKeyDown);
  api.canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    start() {
      reset();
    },
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    update(dt) {
      pulse += dt * 4.5;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (!alive || !api.isRunning()) return;
      stepTimer += dt;
      while (stepTimer >= stepInterval && alive) {
        stepTimer -= stepInterval;
        step();
      }
    },
    render(ctx) {
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      const { cell, bw, bh, ox, oy } = boardMetrics();

      // Board container
      ctx.fillStyle = '#0b1224';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(ox - 2, oy - 2, bw + 4, bh + 4, 10);
      ctx.fill();
      ctx.stroke();

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(ox + c * cell, oy);
        ctx.lineTo(ox + c * cell, oy + bh);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(ox, oy + r * cell);
        ctx.lineTo(ox + bw, oy + r * cell);
        ctx.stroke();
      }

      // Wormhole link line
      if (portals.length === 2) {
        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(ox + (portals[0].x + 0.5) * cell, oy + (portals[0].y + 0.5) * cell);
        ctx.lineTo(ox + (portals[1].x + 0.5) * cell, oy + (portals[1].y + 0.5) * cell);
        ctx.stroke();
        ctx.restore();

        for (const p of portals) {
          const px = ox + (p.x + 0.5) * cell;
          const py = oy + (p.y + 0.5) * cell;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(pulse * (p.color === '#38bdf8' ? 1 : -1));
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 16;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, cell * 0.42, 0, Math.PI * 1.5);
          ctx.stroke();
          ctx.fillStyle = p.color + '33';
          ctx.beginPath();
          ctx.arc(0, 0, cell * 0.28, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Food
      if (food) {
        const fx = ox + (food.x + 0.5) * cell;
        const fy = oy + (food.y + 0.5) * cell;
        const r = cell * (0.32 + Math.sin(pulse * 1.3) * 0.05);
        ctx.save();
        ctx.shadowColor = food.gold ? '#fde047' : '#f472b6';
        ctx.shadowBlur = 14;
        ctx.fillStyle = food.gold ? '#fde047' : '#f472b6';
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Snake body
      for (let i = snake.length - 1; i >= 0; i--) {
        const seg = snake[i];
        const t = i / Math.max(1, snake.length);
        const pad = i === 0 ? 1.5 : 2.5 + t * 1.5;
        const sx = ox + seg.x * cell + pad;
        const sy = oy + seg.y * cell + pad;
        const sz = Math.max(4, cell - pad * 2);

        ctx.save();
        if (i === 0) {
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#6ee7b7';
        } else {
          ctx.fillStyle = `hsl(${155 + t * 45}, 82%, ${54 - t * 16}%)`;
        }
        ctx.beginPath();
        ctx.roundRect(sx, sy, sz, sz, Math.min(7, sz * 0.32));
        ctx.fill();

        if (i === 0) {
          // Cute neon eyes
          ctx.fillStyle = '#062018';
          const ex = ox + (seg.x + 0.5 + dir.x * 0.2) * cell;
          const ey = oy + (seg.y + 0.5 + dir.y * 0.2) * cell;
          const ox1 = -dir.y * cell * 0.16;
          const oy1 = dir.x * cell * 0.16;
          ctx.beginPath();
          ctx.arc(ex + ox1, ey + oy1, 2.2, 0, Math.PI * 2);
          ctx.arc(ex - ox1, ey - oy1, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Particles
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      api.canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    },
  };
}
