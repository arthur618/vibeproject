// Game 08: 云端叠叠乐 · Sky Stacker
export function createSkyStacker(api) {
  let w = api.width;
  let h = api.height;

  const BLOCK_H = 28;
  const BASE_W = 210;
  const PERFECT_TOL = 7;

  let stack = [];
  let active = null;
  let debris = [];
  let pulses = [];
  let cameraY = 0;
  let targetCameraY = 0;
  let score = 0;
  let streak = 0;
  let maxStreak = 0;
  let hueStart = 190;
  let alive = false;

  function blockColor(idx) {
    const hue = (hueStart + idx * 14) % 360;
    return `hsl(${hue}, 82%, 58%)`;
  }

  function spawnNext() {
    const prev = stack[stack.length - 1];
    const level = stack.length;
    const fromLeft = level % 2 === 1;
    const speed = Math.min(480, 210 + level * 9.5);
    const span = Math.min(w * 0.44, 240);
    active = {
      x: fromLeft ? w / 2 - span - prev.w / 2 : w / 2 + span - prev.w / 2,
      y: prev.y - BLOCK_H,
      w: prev.w,
      h: BLOCK_H,
      vx: fromLeft ? speed : -speed,
      minX: w / 2 - span - prev.w / 2,
      maxX: w / 2 + span - prev.w / 2,
      color: blockColor(level),
    };
  }

  function reset() {
    hueStart = Math.floor(Math.random() * 360);
    const baseY = h - 76;
    stack = [
      {
        x: w / 2 - BASE_W / 2,
        y: baseY,
        w: BASE_W,
        h: BLOCK_H,
        color: blockColor(0),
      },
    ];
    debris = [];
    pulses = [];
    cameraY = 0;
    targetCameraY = 0;
    score = 0;
    streak = 0;
    maxStreak = 0;
    alive = true;
    spawnNext();
    api.setHud({ score: 0, extra: '0 完美', scoreLabel: '层数分', extraLabel: '连击' });
  }

  function dropBlock() {
    if (!alive || !active || !api.isRunning()) return;
    const prev = stack[stack.length - 1];
    const delta = active.x - prev.x;

    // Check total miss
    if (Math.abs(delta) >= prev.w) {
      debris.push({
        x: active.x,
        y: active.y,
        w: active.w,
        h: active.h,
        vx: active.vx * 0.35,
        vy: -40,
        rot: 0,
        vrot: delta > 0 ? 2.5 : -2.5,
        color: active.color,
        life: 1.4,
      });
      active = null;
      alive = false;
      api.sound.fail();
      api.gameOver({
        score,
        title: '高塔倾塌！',
        subtitle: `你堆叠了 ${stack.length - 1} 层霓虹天空塔，最高连续完美 ${maxStreak} 次！`,
        stats: [
          { label: '最终得分', value: score },
          { label: '塔高', value: `${stack.length - 1} 层` },
        ],
      });
      return;
    }

    if (Math.abs(delta) <= PERFECT_TOL) {
      // Perfect snap!
      streak++;
      if (streak > maxStreak) maxStreak = streak;
      let newW = prev.w;
      let newX = prev.x;
      if (streak >= 3 && newW < BASE_W) {
        const grow = Math.min(14, BASE_W - newW);
        newW += grow;
        newX -= grow / 2;
      }
      stack.push({
        x: newX,
        y: active.y,
        w: newW,
        h: BLOCK_H,
        color: active.color,
        perfect: true,
      });
      score += 25 + streak * 10;
      api.sound.collect(streak - 1);
      pulses.push({
        x: newX,
        y: active.y,
        w: newW,
        h: BLOCK_H,
        life: 0.55,
        maxLife: 0.55,
        text: streak >= 2 ? `PERFECT ×${streak}!` : 'PERFECT!',
      });
    } else {
      // Slice overhang
      streak = 0;
      const overlapLeft = Math.max(prev.x, active.x);
      const overlapRight = Math.min(prev.x + prev.w, active.x + active.w);
      const newW = overlapRight - overlapLeft;

      stack.push({
        x: overlapLeft,
        y: active.y,
        w: newW,
        h: BLOCK_H,
        color: active.color,
      });

      // Spawn sheared debris piece
      const cutOnRight = active.x > prev.x;
      const cutW = active.w - newW;
      const cutX = cutOnRight ? overlapRight : active.x;
      debris.push({
        x: cutX,
        y: active.y,
        w: cutW,
        h: BLOCK_H,
        vx: cutOnRight ? 65 : -65,
        vy: -55,
        rot: 0,
        vrot: cutOnRight ? 3.2 : -3.2,
        color: active.color,
        life: 1.2,
      });

      score += 10;
      api.sound.bounce(0.9 + Math.min(0.8, stack.length * 0.03));
    }

    // Pan camera smoothly once tower rises above mid screen
    const topY = stack[stack.length - 1].y;
    const desiredTop = h * 0.48;
    if (topY < desiredTop) {
      targetCameraY = desiredTop - topY;
    }

    api.setHud({
      score,
      extra: `${streak} 完美`,
      scoreLabel: '得分',
      extraLabel: '连击',
    });

    spawnNext();
  }

  function onPointerDown(e) {
    if (!api.isRunning()) return;
    e.preventDefault();
    dropBlock();
  }

  function onKeyDown(e) {
    if (!api.isRunning()) return;
    if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') {
      e.preventDefault();
      dropBlock();
    }
  }

  api.canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('keydown', onKeyDown);

  return {
    start() {
      reset();
    },
    resize(nw, nh) {
      const dx = (nw - w) / 2;
      w = nw;
      h = nh;
      for (const b of stack) b.x += dx;
      if (active) {
        active.x += dx;
        active.minX += dx;
        active.maxX += dx;
      }
    },
    update(dt) {
      cameraY += (targetCameraY - cameraY) * Math.min(1, dt * 6);

      if (alive && active && api.isRunning()) {
        active.x += active.vx * dt;
        if (active.x <= active.minX) {
          active.x = active.minX;
          active.vx = Math.abs(active.vx);
        } else if (active.x >= active.maxX) {
          active.x = active.maxX;
          active.vx = -Math.abs(active.vx);
        }
      }

      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += 880 * dt;
        d.rot += d.vrot * dt;
        d.life -= dt;
        if (d.life <= 0) debris.splice(i, 1);
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].life -= dt;
        if (pulses[i].life <= 0) pulses.splice(i, 1);
      }
    },
    render(ctx) {
      // Sky gradient shifts subtly as tower ascends
      const altitude = Math.min(1, targetCameraY / 900);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, altitude > 0.5 ? '#040510' : '#080c1f');
      grad.addColorStop(1, '#131736');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle height guide markers
      ctx.save();
      ctx.translate(0, cameraY);

      // Tower base pedestal
      if (stack.length > 0) {
        const b0 = stack[0];
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(b0.x, b0.y + BLOCK_H, b0.w, 220);
      }

      // Stacked blocks
      for (let i = 0; i < stack.length; i++) {
        const b = stack[i];
        if (b.y + cameraY > h + 40 || b.y + cameraY < -60) continue;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = i === stack.length - 1 ? 14 : 6;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h - 2, 5);
        ctx.fill();
        // Top gloss highlight
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(b.x + 3, b.y + 2, Math.max(0, b.w - 6), 4);
        ctx.restore();
      }

      // Moving active block
      if (active) {
        ctx.save();
        ctx.fillStyle = active.color;
        ctx.shadowColor = active.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.roundRect(active.x, active.y, active.w, active.h - 2, 5);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(active.x + 3, active.y + 2, Math.max(0, active.w - 6), 5);
        ctx.restore();
      }

      // Sheared tumbling debris
      for (const d of debris) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, d.life);
        ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
        ctx.rotate(d.rot);
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.roundRect(-d.w / 2, -d.h / 2, d.w, d.h - 2, 4);
        ctx.fill();
        ctx.restore();
      }

      // Perfect shockwaves
      for (const p of pulses) {
        const prog = 1 - p.life / p.maxLife;
        const expand = prog * 26;
        ctx.save();
        ctx.globalAlpha = 1 - prog;
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(p.x - expand, p.y - expand * 0.4, p.w + expand * 2, p.h + expand * 0.8, 8);
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = '800 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x + p.w / 2, p.y - 12 - prog * 28);
        ctx.restore();
      }

      ctx.restore();
    },
    destroy() {
      api.canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
