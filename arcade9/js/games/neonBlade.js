// Game 02: 光剑切星 · Neon Blade
export function createNeonBlade(api) {
  let w = api.width;
  let h = api.height;

  const ORB_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];

  let orbs = [];
  let halves = [];
  let particles = [];
  let floatTexts = [];
  let blade = [];
  let pointerDown = false;
  let score = 0;
  let lives = 3;
  let bestCombo = 0;
  let swipeCombo = 0;
  let swipeComboTimer = 0;
  let spawnTimer = 0.6;
  let elapsed = 0;
  let shake = 0;
  let alive = false;

  function reset() {
    orbs = [];
    halves = [];
    particles = [];
    floatTexts = [];
    blade = [];
    pointerDown = false;
    score = 0;
    lives = 3;
    bestCombo = 0;
    swipeCombo = 0;
    swipeComboTimer = 0;
    spawnTimer = 0.5;
    elapsed = 0;
    shake = 0;
    alive = true;
    api.setHud({ score: 0, extra: '♥♥♥', scoreLabel: '得分', extraLabel: '护盾' });
  }

  function spawnWave() {
    const count = 1 + Math.floor(Math.random() * Math.min(4, 2 + Math.floor(elapsed / 12)));
    for (let i = 0; i < count; i++) {
      const isBomb = elapsed > 4 && Math.random() < 0.18;
      const isGold = !isBomb && Math.random() < 0.14;
      const r = isBomb ? 25 : isGold ? 20 : 22 + Math.random() * 11;
      const x = 80 + Math.random() * Math.max(80, w - 160);
      const centerBias = (w * 0.5 - x) * (0.45 + Math.random() * 0.45);
      const vy = -(Math.sqrt(2 * 640 * (h * (0.62 + Math.random() * 0.25))));
      orbs.push({
        x,
        y: h + r + 10,
        vx: centerBias + (Math.random() - 0.5) * 90,
        vy,
        r,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 4,
        isBomb,
        isGold,
        color: isBomb ? '#ef4444' : isGold ? '#fde047' : ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)],
        sides: isGold ? 4 : 5 + Math.floor(Math.random() * 3),
        sliced: false,
      });
    }
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function sliceSegment(x1, y1, x2, y2) {
    if (!alive || !api.isRunning()) return;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (o.sliced) continue;
      if (distToSegment(o.x, o.y, x1, y1, x2, y2) <= o.r + 6) {
        o.sliced = true;
        orbs.splice(i, 1);

        if (o.isBomb) {
          alive = false;
          shake = 18;
          api.sound.explode();
          for (let k = 0; k < 42; k++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 90 + Math.random() * 340;
            particles.push({
              x: o.x,
              y: o.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              life: 0.75,
              maxLife: 0.75,
              size: 3 + Math.random() * 5,
              color: k % 2 ? '#ef4444' : '#fb923c',
            });
          }
          api.gameOver({
            score,
            title: '切中了虚空炸弹！',
            subtitle: '红色脉冲球是黑洞炸弹，下次记得避开它。',
            stats: [
              { label: '最终得分', value: score },
              { label: '最高连切', value: `${bestCombo}x` },
            ],
          });
          return;
        }

        // Good slice!
        swipeCombo++;
        swipeComboTimer = 0.24;
        if (swipeCombo > bestCombo) bestCombo = swipeCombo;
        const pts = (o.isGold ? 30 : 10) + (swipeCombo > 1 ? swipeCombo * 5 : 0);
        score += pts;
        api.sound.slice(swipeCombo);

        floatTexts.push({
          x: o.x,
          y: o.y - 10,
          text: swipeCombo >= 2 ? `+${pts} · ${swipeCombo}连切!` : `+${pts}`,
          color: o.isGold ? '#fde047' : '#ffffff',
          life: 0.85,
          maxLife: 0.85,
        });

        // Two rotating split halves
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        for (const side of [-1, 1]) {
          halves.push({
            x: o.x + nx * side * 6,
            y: o.y + ny * side * 6,
            vx: o.vx + nx * side * 120,
            vy: o.vy + ny * side * 80 - 40,
            r: o.r,
            angle,
            side,
            rotSpeed: side * 4.5,
            color: o.color,
            life: 0.85,
            maxLife: 0.85,
          });
        }

        // Sparks
        for (let k = 0; k < 16; k++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 210;
          particles.push({
            x: o.x,
            y: o.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 0.45 + Math.random() * 0.25,
            maxLife: 0.7,
            size: 2.5 + Math.random() * 3.5,
            color: o.color,
          });
        }

        updateHud();
      }
    }
  }

  function updateHud() {
    api.setHud({
      score,
      extra: '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives)),
      scoreLabel: '得分',
      extraLabel: '护盾',
    });
  }

  function onPointerDown(e) {
    if (!api.isRunning()) return;
    pointerDown = true;
    const p = api.getPointerPos(e);
    blade = [{ x: p.x, y: p.y, life: 0.18 }];
  }

  function onPointerMove(e) {
    if (!pointerDown || !api.isRunning()) return;
    const p = api.getPointerPos(e);
    const prev = blade[blade.length - 1];
    if (prev) {
      const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (dist > 4) {
        sliceSegment(prev.x, prev.y, p.x, p.y);
        blade.push({ x: p.x, y: p.y, life: 0.18 });
        if (blade.length > 22) blade.shift();
      }
    } else {
      blade.push({ x: p.x, y: p.y, life: 0.18 });
    }
  }

  function onPointerUp() {
    pointerDown = false;
  }

  api.canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
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
      if (shake > 0) shake = Math.max(0, shake - dt * 36);
      if (swipeComboTimer > 0) {
        swipeComboTimer -= dt;
        if (swipeComboTimer <= 0) swipeCombo = 0;
      }

      for (let i = blade.length - 1; i >= 0; i--) {
        blade[i].life -= dt;
        if (blade[i].life <= 0) blade.splice(i, 1);
      }

      for (let i = halves.length - 1; i >= 0; i--) {
        const hf = halves[i];
        hf.x += hf.vx * dt;
        hf.y += hf.vy * dt;
        hf.vy += 680 * dt;
        hf.angle += hf.rotSpeed * dt;
        hf.life -= dt;
        if (hf.life <= 0) halves.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 260 * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      for (let i = floatTexts.length - 1; i >= 0; i--) {
        const f = floatTexts[i];
        f.y -= 48 * dt;
        f.life -= dt;
        if (f.life <= 0) floatTexts.splice(i, 1);
      }

      if (!alive || !api.isRunning()) return;
      elapsed += dt;

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnWave();
        spawnTimer = Math.max(0.62, 1.35 - elapsed * 0.014);
      }

      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        o.vy += 640 * dt;
        o.rot += o.vrot * dt;

        if (o.y > h + o.r + 50 && o.vy > 0) {
          orbs.splice(i, 1);
          if (!o.isBomb) {
            lives--;
            shake = 8;
            api.sound.fail();
            updateHud();
            if (lives <= 0) {
              alive = false;
              api.gameOver({
                score,
                title: '能量护盾耗尽！',
                subtitle: '漏掉太多星核啦，再接再厉！',
                stats: [
                  { label: '最终得分', value: score },
                  { label: '最高连切', value: `${bestCombo}x` },
                ],
              });
              return;
            }
          }
        }
      }
    },
    render(ctx) {
      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      // Cosmic radial backdrop
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      grad.addColorStop(0, '#131630');
      grad.addColorStop(1, '#060711');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle dojo horizon lines
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.08)';
      ctx.lineWidth = 1;
      for (let y = h * 0.2; y < h; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Sliced halves
      for (const hf of halves) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, hf.life / hf.maxLife);
        ctx.translate(hf.x, hf.y);
        ctx.rotate(hf.angle);
        ctx.fillStyle = hf.color;
        ctx.shadowColor = hf.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, hf.r, hf.side === 1 ? 0 : Math.PI, hf.side === 1 ? Math.PI : Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Active orbs
      for (const o of orbs) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);
        ctx.shadowColor = o.color;
        ctx.shadowBlur = o.isBomb ? 20 : 16;

        if (o.isBomb) {
          // Spiky bomb
          ctx.fillStyle = '#181018';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, o.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-9, -9);
          ctx.lineTo(9, 9);
          ctx.moveTo(9, -9);
          ctx.lineTo(-9, 9);
          ctx.stroke();
        } else {
          // Glowing faceted crystal / planet
          ctx.fillStyle = o.color;
          ctx.beginPath();
          for (let s = 0; s < o.sides; s++) {
            const a = (Math.PI * 2 * s) / o.sides;
            const px = Math.cos(a) * o.r;
            const py = Math.sin(a) * o.r;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.arc(-o.r * 0.25, -o.r * 0.25, o.r * 0.28, 0, Math.PI * 2);
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

      // Glowing plasma blade trail
      if (blade.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < blade.length; i++) {
          const ratio = i / blade.length;
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 18;
          ctx.lineWidth = 12 * ratio;
          ctx.globalAlpha = ratio * 0.65;
          ctx.beginPath();
          ctx.moveTo(blade[i - 1].x, blade[i - 1].y);
          ctx.lineTo(blade[i].x, blade[i].y);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.shadowBlur = 0;
          ctx.lineWidth = 4.5 * ratio;
          ctx.globalAlpha = ratio;
          ctx.beginPath();
          ctx.moveTo(blade[i - 1].x, blade[i - 1].y);
          ctx.lineTo(blade[i].x, blade[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Floating combo texts
      ctx.textAlign = 'center';
      ctx.font = '800 17px system-ui, sans-serif';
      for (const f of floatTexts) {
        ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    },
    destroy() {
      api.canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    },
  };
}
