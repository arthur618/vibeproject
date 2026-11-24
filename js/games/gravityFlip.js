// Game 01: 引力反转 · Gravity Flip
export function createGravityFlip(api) {
  let w = api.width;
  let h = api.height;

  const MARGIN = 56;
  const PLAYER_SIZE = 24;

  let player = null;
  let obstacles = [];
  let shards = [];
  let particles = [];
  let trail = [];
  let speed = 320;
  let distance = 0;
  let score = 0;
  let combo = 0;
  let spawnTimer = 0;
  let bgOffset = 0;
  let shake = 0;
  let alive = false;

  function reset() {
    player = {
      x: Math.max(110, w * 0.2),
      y: h - MARGIN - PLAYER_SIZE / 2,
      vy: 0,
      gravDir: 1, // 1 = down, -1 = up
      rot: 0,
      grounded: true,
    };
    obstacles = [];
    shards = [];
    particles = [];
    trail = [];
    speed = 320;
    distance = 0;
    score = 0;
    combo = 0;
    spawnTimer = 0.7;
    shake = 0;
    alive = true;
    api.setHud({ score: 0, extra: '1.0x', scoreLabel: '得分', extraLabel: '速度' });
  }

  function flip() {
    if (!alive || !api.isRunning()) return;
    player.gravDir *= -1;
    player.grounded = false;
    player.vy = player.gravDir * 140;
    api.sound.flip();
    for (let i = 0; i < 10; i++) {
      particles.push({
        x: player.x,
        y: player.y,
        vx: -speed * 0.25 + (Math.random() - 0.5) * 140,
        vy: -player.gravDir * (60 + Math.random() * 140),
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.55,
        size: 2.5 + Math.random() * 3,
        color: player.gravDir === 1 ? '#38bdf8' : '#f472b6',
      });
    }
  }

  function spawnPattern() {
    const laneH = h - MARGIN * 2;
    const roll = Math.random();
    const x = w + 60;

    if (roll < 0.38) {
      // Floor or ceiling laser gate
      const onFloor = Math.random() < 0.5;
      const obsH = Math.min(laneH * 0.44, 68 + Math.random() * 68);
      const obsW = 28 + Math.random() * 18;
      obstacles.push({
        x,
        y: onFloor ? h - MARGIN - obsH : MARGIN,
        w: obsW,
        h: obsH,
        color: '#fb7185',
      });
      // Shard on the opposite side
      shards.push({
        x: x + obsW / 2,
        y: onFloor ? MARGIN + 44 : h - MARGIN - 44,
        r: 10,
        collected: false,
        pulse: Math.random() * Math.PI * 2,
      });
    } else if (roll < 0.72) {
      // Double staggered gates
      const firstFloor = Math.random() < 0.5;
      const obsH = Math.min(laneH * 0.38, 60 + Math.random() * 52);
      obstacles.push({
        x,
        y: firstFloor ? h - MARGIN - obsH : MARGIN,
        w: 28,
        h: obsH,
        color: '#f43f5e',
      });
      obstacles.push({
        x: x + 190,
        y: !firstFloor ? h - MARGIN - obsH : MARGIN,
        w: 28,
        h: obsH,
        color: '#f43f5e',
      });
      shards.push({
        x: x + 108,
        y: h / 2,
        r: 11,
        collected: false,
        pulse: 0,
      });
    } else {
      // Floating mid laser block
      const obsH = 44 + Math.random() * 44;
      const midY = MARGIN + laneH * (0.28 + Math.random() * 0.44) - obsH / 2;
      obstacles.push({
        x,
        y: midY,
        w: 36,
        h: obsH,
        color: '#fb923c',
      });
      shards.push({
        x: x + 18,
        y: Math.random() < 0.5 ? MARGIN + 34 : h - MARGIN - 34,
        r: 10,
        collected: false,
        pulse: 1,
      });
    }
  }

  function onPointerDown(e) {
    if (!api.isRunning()) return;
    e.preventDefault();
    flip();
  }

  function onKeyDown(e) {
    if (!api.isRunning()) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'KeyW' || e.code === 'KeyS') {
      e.preventDefault();
      flip();
    }
  }

  api.canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('keydown', onKeyDown);

  return {
    start() {
      reset();
    },
    resize(nw, nh) {
      w = nw;
      h = nh;
      if (player) {
        player.x = Math.max(110, w * 0.2);
        player.y = Math.max(MARGIN + PLAYER_SIZE / 2, Math.min(h - MARGIN - PLAYER_SIZE / 2, player.y));
      }
    },
    update(dt) {
      bgOffset = (bgOffset + speed * dt) % 60;
      if (shake > 0) shake = Math.max(0, shake - dt * 30);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (!alive || !api.isRunning()) return;

      speed = Math.min(680, speed + dt * 11);
      distance += speed * dt * 0.04;
      score = Math.floor(distance) + combo * 25;

      // Gravity physics
      const gravity = 2250;
      player.vy += player.gravDir * gravity * dt;
      player.y += player.vy * dt;

      const floorY = h - MARGIN - PLAYER_SIZE / 2;
      const ceilY = MARGIN + PLAYER_SIZE / 2;

      if (player.y >= floorY) {
        player.y = floorY;
        player.vy = 0;
        player.grounded = true;
      } else if (player.y <= ceilY) {
        player.y = ceilY;
        player.vy = 0;
        player.grounded = true;
      }

      if (!player.grounded) {
        player.rot += player.gravDir * dt * 9;
      } else {
        player.rot = Math.round(player.rot / (Math.PI / 2)) * (Math.PI / 2);
      }

      trail.push({ x: player.x, y: player.y, c: player.gravDir === 1 ? '#38bdf8' : '#f472b6' });
      if (trail.length > 18) trail.shift();
      for (const t of trail) t.x -= speed * dt;

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnPattern();
        spawnTimer = Math.max(0.58, 1.32 - (speed - 320) * 0.0018);
      }

      // Update obstacles & collision
      const half = PLAYER_SIZE * 0.42;
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed * dt;
        if (o.x + o.w < -40) {
          obstacles.splice(i, 1);
          continue;
        }
        if (
          player.x + half > o.x &&
          player.x - half < o.x + o.w &&
          player.y + half > o.y &&
          player.y - half < o.y + o.h
        ) {
          alive = false;
          shake = 12;
          api.sound.explode();
          for (let k = 0; k < 28; k++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 80 + Math.random() * 260;
            particles.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              life: 0.5 + Math.random() * 0.4,
              maxLife: 0.9,
              size: 3 + Math.random() * 4,
              color: k % 2 ? '#38bdf8' : '#fb7185',
            });
          }
          api.gameOver({
            score,
            title: '撞上激光屏障！',
            subtitle: `你在隧道中疾驰了 ${Math.floor(distance)} 米，收集了 ${combo} 枚能量晶核。`,
            stats: [
              { label: '最终得分', value: score },
              { label: '能量晶核', value: combo },
            ],
          });
          return;
        }
      }

      // Shards
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        s.x -= speed * dt;
        s.pulse += dt * 6;
        if (s.x < -30) {
          shards.splice(i, 1);
          continue;
        }
        const dx = player.x - s.x;
        const dy = player.y - s.y;
        if (dx * dx + dy * dy < (PLAYER_SIZE * 0.65 + s.r) ** 2) {
          combo++;
          api.sound.collect(combo);
          for (let k = 0; k < 12; k++) {
            const ang = (Math.PI * 2 * k) / 12;
            particles.push({
              x: s.x,
              y: s.y,
              vx: Math.cos(ang) * 140,
              vy: Math.sin(ang) * 140,
              life: 0.35,
              maxLife: 0.35,
              size: 3,
              color: '#fbbf24',
            });
          }
          shards.splice(i, 1);
        }
      }

      api.setHud({
        score,
        extra: `${(speed / 320).toFixed(1)}x`,
        scoreLabel: '得分',
        extraLabel: '速度',
      });
    },
    render(ctx) {
      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      // Deep cyber tunnel background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#071124');
      grad.addColorStop(0.5, '#060814');
      grad.addColorStop(1, '#150821');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Vertical scrolling speed grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = -bgOffset; x < w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, MARGIN);
        ctx.lineTo(x, h - MARGIN);
        ctx.stroke();
      }

      // Ceiling & Floor neon rails
      ctx.fillStyle = 'rgba(244, 114, 182, 0.1)';
      ctx.fillRect(0, 0, w, MARGIN);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.fillRect(0, h - MARGIN, w, MARGIN);

      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, MARGIN);
      ctx.lineTo(w, MARGIN);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, h - MARGIN);
      ctx.lineTo(w, h - MARGIN);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Shards
      for (const s of shards) {
        const rr = s.r + Math.sin(s.pulse) * 2.2;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.pulse * 0.4);
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -rr);
        ctx.lineTo(rr * 0.85, 0);
        ctx.lineTo(0, rr);
        ctx.lineTo(-rr * 0.85, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Obstacles
      for (const o of obstacles) {
        ctx.save();
        ctx.shadowColor = o.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = o.color;
        ctx.beginPath();
        ctx.roundRect(o.x, o.y, o.w, o.h, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(o.x + 5, o.y + 6, 4, Math.max(4, o.h - 12));
        ctx.restore();
      }

      // Trail
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const alpha = i / trail.length;
          ctx.strokeStyle = trail[i].c;
          ctx.globalAlpha = alpha * 0.55;
          ctx.lineWidth = PLAYER_SIZE * 0.55 * alpha;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Player cube
      if (player && alive) {
        const col = player.gravDir === 1 ? '#38bdf8' : '#f472b6';
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rot);
        ctx.shadowColor = col;
        ctx.shadowBlur = 18;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-PLAYER_SIZE * 0.22, -PLAYER_SIZE * 0.22, PLAYER_SIZE * 0.44, PLAYER_SIZE * 0.44, 3);
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
      ctx.restore();
    },
    destroy() {
      api.canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
