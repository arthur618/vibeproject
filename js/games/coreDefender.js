// Game 09: 核心守卫 · Core Defender (360° Radial Arcade Shooter)
export function createCoreDefender(api) {
  let w = api.width;
  let h = api.height;

  let coreHp = 100;
  let score = 0;
  let wave = 1;
  let aimAngle = 0;
  let fireTimer = 0;
  let spawnTimer = 0;
  let empCharge = 100;
  let empWave = null;
  let bullets = [];
  let enemies = [];
  let particles = [];
  let elapsed = 0;
  let shake = 0;
  let alive = false;

  function center() {
    return { cx: w / 2, cy: h / 2 };
  }

  function reset() {
    coreHp = 100;
    score = 0;
    wave = 1;
    aimAngle = -Math.PI / 2;
    fireTimer = 0;
    spawnTimer = 0.6;
    empCharge = 100;
    empWave = null;
    bullets = [];
    enemies = [];
    particles = [];
    elapsed = 0;
    shake = 0;
    alive = true;
    updateHud();
  }

  function updateHud() {
    api.setHud({
      score,
      extra: `HP ${Math.max(0, Math.ceil(coreHp))}%`,
      scoreLabel: '得分',
      extraLabel: '核心',
    });
  }

  function burst(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 210;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        size: 2.5 + Math.random() * 3,
        color,
      });
    }
  }

  function spawnEnemy() {
    const { cx, cy } = center();
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.hypot(w, h) * 0.55 + 24;
    const roll = Math.random();
    let kind = 'swarmer';
    if (elapsed > 10 && roll < 0.25) kind = 'tank';
    else if (elapsed > 6 && roll < 0.5) kind = 'dasher';

    const speedBase = 62 + wave * 9;
    enemies.push({
      x: cx + Math.cos(ang) * dist,
      y: cy + Math.sin(ang) * dist,
      r: kind === 'tank' ? 18 : kind === 'dasher' ? 11 : 13,
      hp: kind === 'tank' ? 3 : 1,
      maxHp: kind === 'tank' ? 3 : 1,
      speed: kind === 'dasher' ? speedBase * 1.48 : kind === 'tank' ? speedBase * 0.68 : speedBase,
      kind,
      color: kind === 'tank' ? '#fbbf24' : kind === 'dasher' ? '#f472b6' : '#38bdf8',
      rot: ang,
    });
  }

  function triggerEmp() {
    if (!alive || !api.isRunning() || empCharge < 100) return;
    const { cx, cy } = center();
    empCharge = 0;
    empWave = { r: 28, maxR: Math.max(w, h) * 0.58, alpha: 1 };
    shake = 12;
    api.sound.emp();

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (Math.hypot(e.x - cx, e.y - cy) <= empWave.maxR * 0.85) {
        score += e.kind === 'tank' ? 30 : 15;
        burst(e.x, e.y, e.color, 16);
        enemies.splice(i, 1);
      }
    }
    updateHud();
  }

  function updateAim(e) {
    const p = api.getPointerPos(e);
    const { cx, cy } = center();
    aimAngle = Math.atan2(p.y - cy, p.x - cx);
  }

  function onPointerMove(e) {
    updateAim(e);
  }

  function onPointerDown(e) {
    if (!api.isRunning()) return;
    updateAim(e);
    if (e.button === 2) {
      e.preventDefault();
      triggerEmp();
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  function onKeyDown(e) {
    if (!api.isRunning()) return;
    if (e.code === 'Space' || e.code === 'KeyE') {
      e.preventDefault();
      triggerEmp();
    }
  }

  api.canvas.addEventListener('pointermove', onPointerMove);
  api.canvas.addEventListener('pointerdown', onPointerDown);
  api.canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('keydown', onKeyDown);

  return {
    start() {
      reset();
    },
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    update(dt) {
      if (shake > 0) shake = Math.max(0, shake - dt * 36);

      if (empWave) {
        empWave.r += 780 * dt;
        empWave.alpha = Math.max(0, 1 - empWave.r / empWave.maxR);
        if (empWave.r >= empWave.maxR) empWave = null;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (!alive || !api.isRunning()) return;
      elapsed += dt;
      wave = 1 + Math.floor(elapsed / 12);
      empCharge = Math.min(100, empCharge + dt * 9);

      const { cx, cy } = center();

      // Auto-fire plasma bolts
      fireTimer -= dt;
      if (fireTimer <= 0) {
        fireTimer = Math.max(0.11, 0.165 - wave * 0.006);
        const speed = 580;
        bullets.push({
          x: cx + Math.cos(aimAngle) * 34,
          y: cy + Math.sin(aimAngle) * 34,
          vx: Math.cos(aimAngle) * speed,
          vy: Math.sin(aimAngle) * speed,
          r: 4.5,
        });
        api.sound.shoot();
      }

      // Spawn enemies
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnEnemy();
        if (wave >= 3 && Math.random() < 0.35) spawnEnemy();
        spawnTimer = Math.max(0.36, 1.05 - wave * 0.075);
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < -30 || b.x > w + 30 || b.y < -30 || b.y > h + 30) {
          bullets.splice(i, 1);
        }
      }

      // Update enemies & collisions
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const angToCore = Math.atan2(cy - e.y, cx - e.x);
        e.x += Math.cos(angToCore) * e.speed * dt;
        e.y += Math.sin(angToCore) * e.speed * dt;
        e.rot = angToCore;

        // Bullet hit check
        let destroyed = false;
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
          const b = bullets[bi];
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r + 2) {
            bullets.splice(bi, 1);
            e.hp--;
            burst(b.x, b.y, '#ffffff', 5);
            if (e.hp <= 0) {
              destroyed = true;
              score += e.kind === 'tank' ? 35 : e.kind === 'dasher' ? 20 : 12;
              empCharge = Math.min(100, empCharge + 5);
              api.sound.collect(score % 8);
              burst(e.x, e.y, e.color, 16);
              enemies.splice(i, 1);
              updateHud();
            } else {
              api.sound.bounce(1.3);
            }
            break;
          }
        }
        if (destroyed) continue;

        // Core impact
        if (Math.hypot(e.x - cx, e.y - cy) < 28 + e.r) {
          coreHp -= e.kind === 'tank' ? 25 : 15;
          shake = 14;
          api.sound.explode();
          burst(e.x, e.y, '#ef4444', 22);
          enemies.splice(i, 1);
          updateHud();

          if (coreHp <= 0) {
            alive = false;
            api.gameOver({
              score,
              title: '能量核心过载！',
              subtitle: `你坚守到了第 ${wave} 波无人机狂潮，消灭了大量入侵者。`,
              stats: [
                { label: '最终得分', value: score },
                { label: '坚守波次', value: `第 ${wave} 波` },
              ],
            });
            return;
          }
        }
      }
    },
    render(ctx) {
      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      const { cx, cy } = center();

      ctx.fillStyle = '#060812';
      ctx.fillRect(0, 0, w, h);

      // Radar rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (const r of [75, 145, 220, 300]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // EMP expanding shockwave
      if (empWave) {
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${empWave.alpha})`;
        ctx.lineWidth = 6;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(cx, cy, empWave.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Aiming laser sight
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(aimAngle) * 38, cy + Math.sin(aimAngle) * 38);
      ctx.lineTo(cx + Math.cos(aimAngle) * 260, cy + Math.sin(aimAngle) * 260);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bullets
      for (const b of bullets) {
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Enemies
      for (const e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rot);
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = e.color;

        if (e.kind === 'tank') {
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const a = (Math.PI * 2 * s) / 6;
            const px = Math.cos(a) * e.r;
            const py = Math.sin(a) * e.r;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.font = '800 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(e.hp), 0, 1);
        } else {
          // Sharp drone triangle pointing toward core
          ctx.beginPath();
          ctx.moveTo(e.r * 1.25, 0);
          ctx.lineTo(-e.r, -e.r * 0.85);
          ctx.lineTo(-e.r * 0.5, 0);
          ctx.lineTo(-e.r, e.r * 0.85);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Central Energy Core & HP ring
      ctx.save();
      ctx.translate(cx, cy);

      // EMP charge arc
      ctx.strokeStyle = empCharge >= 100 ? '#fde047' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 38, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * empCharge) / 100);
      ctx.stroke();

      // Core orb
      const coreCol = coreHp > 40 ? '#34d399' : '#fb7185';
      ctx.shadowColor = coreCol;
      ctx.shadowBlur = 22;
      ctx.fillStyle = coreCol;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Orbital Turret Barrel
      ctx.rotate(aimAngle);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(14, -6, 22, 12, 4);
      ctx.fill();
      ctx.restore();

      // Particles
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Bottom EMP readiness indicator
      ctx.fillStyle = empCharge >= 100 ? '#fde047' : 'rgba(148, 163, 184, 0.72)';
      ctx.font = '700 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        empCharge >= 100
          ? '⚡ EMP 震荡波就绪 · 按 [空格] 或 [右键] 释放清屏！'
          : `EMP 充能中 ${Math.floor(empCharge)}% · 移动鼠标瞄准自动射击 · 波次 ${wave}`,
        w / 2,
        h - 14
      );

      ctx.restore();
    },
    destroy() {
      api.canvas.removeEventListener('pointermove', onPointerMove);
      api.canvas.removeEventListener('pointerdown', onPointerDown);
      api.canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
