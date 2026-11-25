// Game 03: 星际弹弓 · Orbital Sling (Newtonian Gravity Puzzle)
export function createOrbitalSling(api) {
  let w = api.width;
  let h = api.height;

  // Handcrafted level blueprints using normalized (0..1) coordinates
  const LEVELS = [
    {
      launch: { x: 0.14, y: 0.5 },
      goal: { x: 0.85, y: 0.5 },
      planets: [{ x: 0.5, y: 0.66, r: 34, mass: 115000, color: '#818cf8' }],
      stars: [
        { x: 0.42, y: 0.36 },
        { x: 0.58, y: 0.36 },
      ],
    },
    {
      launch: { x: 0.14, y: 0.72 },
      goal: { x: 0.84, y: 0.28 },
      planets: [
        { x: 0.46, y: 0.52, r: 36, mass: 135000, color: '#f472b6' },
      ],
      stars: [
        { x: 0.32, y: 0.32 },
        { x: 0.64, y: 0.62 },
        { x: 0.66, y: 0.25 },
      ],
    },
    {
      launch: { x: 0.12, y: 0.5 },
      goal: { x: 0.88, y: 0.5 },
      planets: [
        { x: 0.42, y: 0.32, r: 30, mass: 110000, color: '#38bdf8' },
        { x: 0.62, y: 0.68, r: 30, mass: 110000, color: '#fb923c' },
      ],
      stars: [
        { x: 0.36, y: 0.65 },
        { x: 0.52, y: 0.5 },
        { x: 0.68, y: 0.34 },
      ],
    },
    {
      launch: { x: 0.14, y: 0.25 },
      goal: { x: 0.85, y: 0.75 },
      planets: [
        { x: 0.5, y: 0.5, r: 44, mass: 175000, color: '#a78bfa' },
      ],
      stars: [
        { x: 0.5, y: 0.18 },
        { x: 0.78, y: 0.42 },
        { x: 0.32, y: 0.72 },
      ],
    },
    {
      launch: { x: 0.13, y: 0.8 },
      goal: { x: 0.86, y: 0.8 },
      planets: [
        { x: 0.36, y: 0.46, r: 28, mass: 105000, color: '#34d399' },
        { x: 0.64, y: 0.46, r: 28, mass: 105000, color: '#fbbf24' },
      ],
      stars: [
        { x: 0.5, y: 0.22 },
        { x: 0.5, y: 0.66 },
        { x: 0.75, y: 0.68 },
      ],
    },
  ];

  let levelIdx = 0;
  let score = 0;
  let attempts = 0;
  let launchPos = { x: 100, y: 200 };
  let goalPos = { x: 600, y: 200 };
  let planets = [];
  let stars = [];
  let probe = null;
  let trail = [];
  let particles = [];
  let dragging = false;
  let dragPos = { x: 0, y: 0 };
  let portalAngle = 0;
  let bgStars = [];

  function initBgStars() {
    bgStars = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 1.5,
      a: 0.2 + Math.random() * 0.6,
    }));
  }

  function loadLevel(idx) {
    levelIdx = idx;
    attempts = 0;
    probe = null;
    trail = [];
    dragging = false;

    const scale = Math.min(w / 820, h / 500);
    if (idx < LEVELS.length) {
      const bp = LEVELS[idx];
      launchPos = { x: bp.launch.x * w, y: bp.launch.y * h };
      goalPos = { x: bp.goal.x * w, y: bp.goal.y * h };
      planets = bp.planets.map((p) => ({
        x: p.x * w,
        y: p.y * h,
        r: Math.max(20, p.r * scale),
        mass: p.mass * scale * scale,
        color: p.color,
      }));
      stars = bp.stars.map((s) => ({
        x: s.x * w,
        y: s.y * h,
        collected: false,
      }));
    } else {
      // Procedural star system for endless play!
      const seed = idx * 137;
      launchPos = { x: 0.13 * w, y: (0.28 + ((seed % 44) / 100)) * h };
      goalPos = { x: 0.86 * w, y: (0.28 + (((seed * 3) % 44) / 100)) * h };
      const pCount = idx % 2 === 0 ? 2 : 1;
      const palette = ['#38bdf8', '#f472b6', '#a78bfa', '#34d399', '#fb923c'];
      planets = [];
      for (let i = 0; i < pCount; i++) {
        planets.push({
          x: (pCount === 1 ? 0.5 : 0.38 + i * 0.24) * w,
          y: (0.34 + (((seed + i * 29) % 34) / 100)) * h,
          r: Math.max(22, (30 + (i * 6)) * scale),
          mass: (115000 + i * 20000) * scale * scale,
          color: palette[(idx + i) % palette.length],
        });
      }
      stars = [0.35, 0.52, 0.7].map((fx, i) => ({
        x: fx * w,
        y: (0.22 + (((seed + i * 41) % 56) / 100)) * h,
        collected: false,
      }));
    }

    api.setHud({
      score,
      extra: `第 ${levelIdx + 1} 关`,
      scoreLabel: '得分',
      extraLabel: '星系',
    });
  }

  function calcGravityAccel(x, y) {
    let ax = 0;
    let ay = 0;
    for (const p of planets) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist2 = Math.max(dx * dx + dy * dy, p.r * p.r * 0.8);
      const dist = Math.sqrt(dist2);
      const force = p.mass / dist2;
      ax += (dx / dist) * force;
      ay += (dy / dist) * force;
    }
    return { ax, ay };
  }

  function getLaunchVelocity() {
    const dx = launchPos.x - dragPos.x;
    const dy = launchPos.y - dragPos.y;
    const mag = Math.min(135, Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx);
    const speed = mag * 4.4;
    return { vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed };
  }

  function burst(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 50 + Math.random() * 170;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75,
        size: 2.5 + Math.random() * 3,
        color,
      });
    }
  }

  function resetProbe() {
    probe = null;
    trail = [];
    for (const s of stars) s.collected = false;
  }

  function onPointerDown(e) {
    if (!api.isRunning()) return;
    const p = api.getPointerPos(e);
    if (probe) {
      // Click anywhere while probe is flying to immediately reset for next shot
      resetProbe();
      return;
    }
    if (Math.hypot(p.x - launchPos.x, p.y - launchPos.y) < 95) {
      dragging = true;
      dragPos = p;
    }
  }

  function onPointerMove(e) {
    if (!dragging) return;
    dragPos = api.getPointerPos(e);
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    const dist = Math.hypot(launchPos.x - dragPos.x, launchPos.y - dragPos.y);
    if (dist < 14) return;
    const { vx, vy } = getLaunchVelocity();
    attempts++;
    probe = { x: launchPos.x, y: launchPos.y, vx, vy, r: 7 };
    trail = [];
    api.sound.flip();
  }

  api.canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  initBgStars();

  return {
    start() {
      score = 0;
      particles = [];
      loadLevel(0);
    },
    resize(nw, nh) {
      w = nw;
      h = nh;
      if (api.isRunning()) {
        loadLevel(levelIdx);
      }
    },
    update(dt) {
      portalAngle += dt * 2.4;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (!probe || !api.isRunning()) return;

      // Sub-step physics for crisp orbital curves
      const subSteps = 4;
      const sdt = dt / subSteps;
      for (let step = 0; step < subSteps; step++) {
        const { ax, ay } = calcGravityAccel(probe.x, probe.y);
        probe.vx += ax * sdt;
        probe.vy += ay * sdt;
        probe.x += probe.vx * sdt;
        probe.y += probe.vy * sdt;

        // Check star collection
        for (const s of stars) {
          if (!s.collected && Math.hypot(probe.x - s.x, probe.y - s.y) < probe.r + 14) {
            s.collected = true;
            api.sound.collect(stars.filter((st) => st.collected).length);
            burst(s.x, s.y, '#fbbf24', 12);
          }
        }

        // Check portal arrival!
        if (Math.hypot(probe.x - goalPos.x, probe.y - goalPos.y) < 26) {
          const starCount = stars.filter((s) => s.collected).length;
          const oneShotBonus = attempts === 1 ? 50 : 0;
          const gained = 100 + starCount * 40 + oneShotBonus;
          score += gained;
          api.sound.win();
          burst(goalPos.x, goalPos.y, '#38bdf8', 30);
          loadLevel(levelIdx + 1);
          return;
        }

        // Check planet crash
        for (const pl of planets) {
          if (Math.hypot(probe.x - pl.x, probe.y - pl.y) < pl.r + probe.r - 2) {
            api.sound.explode();
            burst(probe.x, probe.y, pl.color, 20);
            resetProbe();
            return;
          }
        }

        // Out of bounds
        if (probe.x < -70 || probe.x > w + 70 || probe.y < -70 || probe.y > h + 70) {
          api.sound.bounce(0.7);
          resetProbe();
          return;
        }
      }

      trail.push({ x: probe.x, y: probe.y });
      if (trail.length > 75) trail.shift();
    },
    render(ctx) {
      // Deep space background
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, w, h);

      for (const bs of bgStars) {
        ctx.fillStyle = `rgba(255,255,255,${bs.a})`;
        ctx.beginPath();
        ctx.arc(bs.x * w, bs.y * h, bs.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gravity rings around planets
      for (const pl of planets) {
        for (let ring = 1; ring <= 3; ring++) {
          ctx.strokeStyle = `rgba(148, 163, 184, ${0.14 - ring * 0.03})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pl.x, pl.y, pl.r + ring * 26, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Planet body
        ctx.save();
        ctx.shadowColor = pl.color;
        ctx.shadowBlur = 22;
        const pGrad = ctx.createRadialGradient(pl.x - pl.r * 0.3, pl.y - pl.r * 0.3, 4, pl.x, pl.y, pl.r);
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.28, pl.color);
        pGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Goal wormhole
      ctx.save();
      ctx.translate(goalPos.x, goalPos.y);
      ctx.rotate(portalAngle);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.strokeStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(0, 0, 14, Math.PI * 0.5, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Collectible stars
      for (const s of stars) {
        if (s.collected) continue;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(portalAngle * 0.6);
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? 11 : 4.5;
          const a = (Math.PI * i) / 4;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Launch pad
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(launchPos.x, launchPos.y, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!probe) {
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(launchPos.x, launchPos.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Trajectory preview while dragging
      if (dragging && !probe) {
        const { vx, vy } = getLaunchVelocity();
        // Slingshot band
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(launchPos.x, launchPos.y);
        ctx.lineTo(dragPos.x, dragPos.y);
        ctx.stroke();

        // Simulate future trajectory dots
        let sx = launchPos.x;
        let sy = launchPos.y;
        let svx = vx;
        let svy = vy;
        for (let i = 0; i < 36; i++) {
          const stepDt = 0.025;
          const { ax, ay } = calcGravityAccel(sx, sy);
          svx += ax * stepDt;
          svy += ay * stepDt;
          sx += svx * stepDt;
          sy += svy * stepDt;
          let hit = false;
          for (const pl of planets) {
            if (Math.hypot(sx - pl.x, sy - pl.y) < pl.r) hit = true;
          }
          if (hit) break;
          ctx.fillStyle = `rgba(52, 211, 153, ${0.8 - i * 0.02})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Flight trail
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          ctx.strokeStyle = `rgba(52, 211, 153, ${(i / trail.length) * 0.7})`;
          ctx.lineWidth = 3 * (i / trail.length);
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
      }

      // Active probe
      if (probe) {
        ctx.save();
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(probe.x, probe.y, probe.r, 0, Math.PI * 2);
        ctx.fill();
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

      // Subtle helper text at bottom
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = '500 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        probe ? '探测船飞行中 · 点击任意处立即重置发射' : '按住绿色发射点向后拖拽拉弓 · 借助星球引力进入蓝紫虫洞',
        w / 2,
        h - 14
      );
    },
    destroy() {
      api.canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    },
  };
}
