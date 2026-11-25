// Game 05: 棱镜激光 · Prism Laser (Real-time Optics Puzzle)
export function createPrismLaser(api) {
  let w = api.width;
  let h = api.height;

  const COLS = 11;
  const ROWS = 7;
  // Directions: 0=Right, 1=Down, 2=Left, 3=Up
  const DIRS = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ];
  // rot 0 = '/' : 0->3, 3->0, 2->1, 1->2
  // rot 1 = '\' : 0->1, 1->0, 2->3, 3->2
  const REFLECT = [
    [3, 2, 1, 0],
    [1, 0, 3, 2],
  ];

  const PUZZLES = [
    {
      name: '初识折射',
      emitter: { c: 1, r: 2, dir: 0 },
      mirrors: [
        { c: 5, r: 2, type: 'mirror', rot: 0 },
        { c: 5, r: 5, type: 'mirror', rot: 0 },
      ],
      targets: [{ c: 9, r: 5 }],
      walls: [{ c: 7, r: 2 }, { c: 7, r: 3 }],
    },
    {
      name: 'Z字回旋',
      emitter: { c: 1, r: 5, dir: 0 },
      mirrors: [
        { c: 4, r: 5, type: 'mirror', rot: 1 },
        { c: 4, r: 1, type: 'mirror', rot: 1 },
        { c: 8, r: 1, type: 'mirror', rot: 0 },
      ],
      targets: [{ c: 6, r: 1 }, { c: 8, r: 4 }],
      walls: [{ c: 6, r: 5 }, { c: 6, r: 3 }],
    },
    {
      name: '双束分光',
      emitter: { c: 1, r: 3, dir: 0 },
      mirrors: [
        { c: 5, r: 3, type: 'splitter', rot: 1 },
        { c: 5, r: 1, type: 'mirror', rot: 1 },
      ],
      targets: [{ c: 9, r: 3 }, { c: 9, r: 1 }],
      walls: [{ c: 5, r: 5 }, { c: 7, r: 2 }],
    },
    {
      name: '菱形矩阵',
      emitter: { c: 1, r: 3, dir: 0 },
      mirrors: [
        { c: 4, r: 3, type: 'splitter', rot: 0 },
        { c: 4, r: 5, type: 'mirror', rot: 0 },
        { c: 8, r: 3, type: 'mirror', rot: 1 },
      ],
      targets: [{ c: 8, r: 5 }, { c: 8, r: 1 }],
      walls: [{ c: 6, r: 1 }, { c: 6, r: 4 }],
    },
    {
      name: '光束迷宫',
      emitter: { c: 1, r: 1, dir: 0 },
      mirrors: [
        { c: 4, r: 1, type: 'splitter', rot: 0 },
        { c: 4, r: 5, type: 'mirror', rot: 1 },
        { c: 9, r: 1, type: 'mirror', rot: 0 },
        { c: 9, r: 5, type: 'mirror', rot: 1 },
      ],
      targets: [{ c: 2, r: 5 }, { c: 9, r: 3 }, { c: 6, r: 5 }],
      walls: [{ c: 6, r: 3 }, { c: 2, r: 3 }],
    },
    {
      name: '全息终极阵',
      emitter: { c: 1, r: 3, dir: 0 },
      mirrors: [
        { c: 3, r: 3, type: 'splitter', rot: 1 },
        { c: 3, r: 1, type: 'mirror', rot: 1 },
        { c: 6, r: 3, type: 'splitter', rot: 0 },
        { c: 9, r: 3, type: 'mirror', rot: 0 },
        { c: 6, r: 5, type: 'mirror', rot: 1 },
      ],
      targets: [{ c: 9, r: 1 }, { c: 9, r: 5 }, { c: 2, r: 5 }],
      walls: [{ c: 5, r: 2 }, { c: 7, r: 4 }, { c: 3, r: 5 }],
    },
  ];

  let levelIdx = 0;
  let score = 0;
  let clicks = 0;
  let state = null;
  let segments = [];
  let litTargets = new Set();
  let clearDelay = 0;
  let hoverCell = null;
  let pulse = 0;

  function boardMetrics() {
    const padX = 24;
    const padY = 34;
    const cell = Math.floor(Math.min((w - padX * 2) / COLS, (h - padY * 2) / ROWS));
    const bw = cell * COLS;
    const bh = cell * ROWS;
    const ox = Math.floor((w - bw) / 2);
    const oy = Math.floor((h - bh) / 2);
    return { cell, bw, bh, ox, oy };
  }

  function loadPuzzle(idx) {
    levelIdx = idx;
    clicks = 0;
    clearDelay = 0;
    const src = PUZZLES[idx];
    state = {
      name: src.name,
      emitter: { ...src.emitter },
      mirrors: src.mirrors.map((m) => ({ ...m })),
      targets: src.targets.map((t) => ({ ...t })),
      walls: src.walls.map((wl) => ({ ...wl })),
    };
    traceBeams();
    api.setHud({
      score,
      extra: `${levelIdx + 1}/${PUZZLES.length}`,
      scoreLabel: '得分',
      extraLabel: '关卡',
    });
  }

  function traceBeams() {
    segments = [];
    litTargets = new Set();
    if (!state) return;

    const mirrorMap = new Map();
    for (const m of state.mirrors) mirrorMap.set(`${m.c},${m.r}`, m);
    const wallSet = new Set(state.walls.map((wl) => `${wl.c},${wl.r}`));
    const targetMap = new Map();
    state.targets.forEach((t, idx) => targetMap.set(`${t.c},${t.r}`, idx));

    const queue = [{ c: state.emitter.c, r: state.emitter.r, dir: state.emitter.dir }];
    const visited = new Set();

    while (queue.length > 0 && segments.length < 180) {
      const ray = queue.shift();
      const key = `${ray.c},${ray.r},${ray.dir}`;
      if (visited.has(key)) continue;
      visited.add(key);

      let c = ray.c;
      let r = ray.r;
      const d = DIRS[ray.dir];
      const startC = c;
      const startR = r;

      while (true) {
        c += d.x;
        r += d.y;
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) {
          segments.push({ c1: startC, r1: startR, c2: c - d.x * 0.5, r2: r - d.y * 0.5 });
          break;
        }
        const cellKey = `${c},${r}`;
        if (wallSet.has(cellKey)) {
          segments.push({ c1: startC, r1: startR, c2: c - d.x * 0.45, r2: r - d.y * 0.45 });
          break;
        }
        if (targetMap.has(cellKey)) {
          litTargets.add(targetMap.get(cellKey));
        }
        const mirror = mirrorMap.get(cellKey);
        if (mirror) {
          segments.push({ c1: startC, r1: startR, c2: c, r2: r });
          const reflectedDir = REFLECT[mirror.rot][ray.dir];
          queue.push({ c, r, dir: reflectedDir });
          if (mirror.type === 'splitter') {
            queue.push({ c, r, dir: ray.dir });
          }
          break;
        }
      }
    }

    if (litTargets.size === state.targets.length && clearDelay === 0 && api.isRunning()) {
      clearDelay = 0.72;
      const bonus = Math.max(50, 150 - clicks * 10);
      score += bonus;
      api.sound.win();
      api.setHud({
        score,
        extra: `${levelIdx + 1}/${PUZZLES.length}`,
        scoreLabel: '得分',
        extraLabel: '关卡',
      });
    }
  }

  function cellAt(px, py) {
    const { cell, ox, oy } = boardMetrics();
    const c = Math.floor((px - ox) / cell);
    const r = Math.floor((py - oy) / cell);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
    return { c, r };
  }

  function onPointerMove(e) {
    const p = api.getPointerPos(e);
    hoverCell = cellAt(p.x, p.y);
  }

  function onPointerDown(e) {
    if (!api.isRunning() || !state || clearDelay > 0) return;
    const p = api.getPointerPos(e);
    const hit = cellAt(p.x, p.y);
    if (!hit) return;
    const mirror = state.mirrors.find((m) => m.c === hit.c && m.r === hit.r);
    if (mirror) {
      mirror.rot = (mirror.rot + 1) % 2;
      clicks++;
      api.sound.click();
      traceBeams();
    }
  }

  api.canvas.addEventListener('pointermove', onPointerMove);
  api.canvas.addEventListener('pointerdown', onPointerDown);

  return {
    start() {
      score = 0;
      loadPuzzle(0);
    },
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    update(dt) {
      pulse += dt * 5;
      if (clearDelay > 0) {
        clearDelay -= dt;
        if (clearDelay <= 0) {
          if (levelIdx + 1 < PUZZLES.length) {
            loadPuzzle(levelIdx + 1);
          } else {
            api.gameOver({
              score,
              won: true,
              title: '光学大师 · 全部通关！',
              subtitle: `你点亮了全部 ${PUZZLES.length} 座棱镜光学阵！`,
              stats: [
                { label: '最终得分', value: score },
                { label: '通关进度', value: `${PUZZLES.length}/${PUZZLES.length}` },
              ],
            });
          }
        }
      }
    },
    render(ctx) {
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, w, h);

      if (!state) return;
      const { cell, bw, bh, ox, oy } = boardMetrics();

      // Header puzzle title inside canvas
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        clearDelay > 0 ? `✦ 关卡「${state.name}」光路接通！✦` : `关卡 ${levelIdx + 1}：${state.name} · 点击镜片/分光棱镜旋转 90°`,
        w / 2,
        Math.max(18, oy - 11)
      );

      // Grid background
      ctx.fillStyle = '#0c1224';
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(ox - 2, oy - 2, bw + 4, bh + 4, 12);
      ctx.fill();
      ctx.stroke();

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = ox + c * cell;
          const y = oy + r * cell;
          ctx.strokeStyle = 'rgba(255,255,255,0.045)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cell, cell);
        }
      }

      // Walls
      for (const wl of state.walls) {
        const x = ox + wl.c * cell + 5;
        const y = oy + wl.r * cell + 5;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, cell - 10, cell - 10, 6);
        ctx.fill();
        ctx.stroke();
      }

      // Laser beams (outer glow + bright core)
      ctx.save();
      ctx.lineCap = 'round';
      for (const seg of segments) {
        const x1 = ox + (seg.c1 + 0.5) * cell;
        const y1 = oy + (seg.r1 + 0.5) * cell;
        const x2 = ox + (seg.c2 + 0.5) * cell;
        const y2 = oy + (seg.r2 + 0.5) * cell;

        ctx.strokeStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffe4e6';
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // Emitter
      {
        const ex = ox + (state.emitter.c + 0.5) * cell;
        const ey = oy + (state.emitter.r + 0.5) * cell;
        ctx.save();
        ctx.translate(ex, ey);
        ctx.shadowColor = '#fb7185';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#be123c';
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-cell * 0.34, -cell * 0.34, cell * 0.68, cell * 0.68, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cell * 0.14, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Targets
      state.targets.forEach((t, idx) => {
        const tx = ox + (t.c + 0.5) * cell;
        const ty = oy + (t.r + 0.5) * cell;
        const lit = litTargets.has(idx);
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(lit ? pulse * 0.5 : 0);
        const col = lit ? '#34d399' : '#64748b';
        ctx.shadowColor = col;
        ctx.shadowBlur = lit ? 20 : 4;
        ctx.fillStyle = lit ? '#34d399' : '#1e293b';
        ctx.strokeStyle = lit ? '#a7f3d0' : '#94a3b8';
        ctx.lineWidth = 2.5;
        const r = cell * 0.31;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // Mirrors & Splitters
      for (const m of state.mirrors) {
        const mx = ox + (m.c + 0.5) * cell;
        const my = oy + (m.r + 0.5) * cell;
        const isHover = hoverCell && hoverCell.c === m.c && hoverCell.r === m.r;
        const isSplitter = m.type === 'splitter';

        ctx.save();
        ctx.translate(mx, my);

        // Clickable tile highlight
        ctx.fillStyle = isHover ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = isHover ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = isHover ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(-cell * 0.42, -cell * 0.42, cell * 0.84, cell * 0.84, 8);
        ctx.fill();
        ctx.stroke();

        // Mirror blade: rot 0 is '/' (-45deg), rot 1 is '\' (+45deg)
        ctx.rotate(m.rot === 0 ? -Math.PI / 4 : Math.PI / 4);
        ctx.shadowColor = isSplitter ? '#a78bfa' : '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = isSplitter ? '#c4b5fd' : '#38bdf8';
        ctx.lineWidth = isSplitter ? 4 : 6;
        if (isSplitter) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(-cell * 0.32, 0);
        ctx.lineTo(cell * 0.32, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center hub dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, isSplitter ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    destroy() {
      api.canvas.removeEventListener('pointermove', onPointerMove);
      api.canvas.removeEventListener('pointerdown', onPointerDown);
    },
  };
}
