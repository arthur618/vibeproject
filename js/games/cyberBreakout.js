// Game 06: 霓虹弹珠砖 · Cyber Breakout
export function createCyberBreakout(api) {
  let w = api.width;
  let h = api.height;

  const ROW_COLORS = ['#fb7185', '#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa'];

  let paddle = null;
  let balls = [];
  let bricks = [];
  let powerups = [];
  let particles = [];
  let score = 0;
  let stage = 1;
  let lives = 3;
  let wideTimer = 0;
  let fireTimer = 0;
  let shake = 0;
  let keys = { left: false, right: false };
  let alive = false;

  function buildStage(num) {
    bricks = [];
    const cols = 10;
    const rows = Math.min(6, 4 + Math.floor((num - 1) / 2));
    const padX = 28;
    const topY = 48;
    const gap = 7;
    const bw = (w - padX * 2 - gap * (cols - 1)) / cols;
    const bh = 22;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Fun patterned gaps on later stages
        if (num % 2 === 0 && (r + c) % 4 === 0 && r > 0) continue;
        const armored = r === 0 || (num >= 2 && r === 2 && c % 2 === 0);
        bricks.push({
          x: padX + c * (bw + gap),
          y: topY + r * (bh + gap),
          w: bw,
          h: bh,
          hp: armored ? 2 : 1,
          maxHp: armored ? 2 : 1,
          color: ROW_COLORS[r % ROW_COLORS.length],
        });
      }
    }
  }

  function spawnBall(x, y, vx, vy) {
    balls.push({
      x,
      y,
      vx,
      vy,
      r: 7.5,
      trail: [],
    });
  }

  function resetPaddleAndBall() {
    paddle = {
      x: w / 2,
      y: h - 34,
      baseW: Math.min(126, w * 0.18),
      w: Math.min(126, w * 0.18),
      h: 13,
    };
    const spd = 340 + stage * 22;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
    balls = [];
    spawnBall(paddle.x, paddle.y - 18, Math.cos(angle) * spd, Math.sin(angle) * spd);
  }

  function reset() {
    score = 0;
    stage = 1;
    lives = 3;
    wideTimer = 0;
    fireTimer = 0;
    powerups = [];
    particles = [];
    shake = 0;
    alive = true;
    buildStage(stage);
    resetPaddleAndBall();
    updateHud();
  }

  function updateHud() {
    api.setHud({
      score,
      extra: `W${stage} · ${'♥'.repeat(Math.max(0, lives))}`,
      scoreLabel: '得分',
      extraLabel: '波次/生命',
    });
  }

  function burst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 190;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        size: 2.5 + Math.random() * 2.5,
        color,
      });
    }
  }

  function onPointerMove(e) {
    if (!paddle || !api.isRunning()) return;
    const p = api.getPointerPos(e);
    paddle.x = Math.max(paddle.w / 2 + 8, Math.min(w - paddle.w / 2 - 8, p.x));
  }

  function onKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  }

  function onKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  }

  api.canvas.addEventListener('pointermove', onPointerMove);
  api.canvas.addEventListener('pointerdown', onPointerMove);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    start() {
      reset();
    },
    resize(nw, nh) {
      w = nw;
      h = nh;
      if (paddle) {
        paddle.y = h - 34;
        paddle.x = Math.max(paddle.w / 2 + 8, Math.min(w - paddle.w / 2 - 8, paddle.x));
      }
    },
    update(dt) {
      if (shake > 0) shake = Math.max(0, shake - dt * 34);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (!alive || !api.isRunning() || !paddle) return;

      // Keyboard paddle control
      const padSpeed = 540;
      if (keys.left) paddle.x -= padSpeed * dt;
      if (keys.right) paddle.x += padSpeed * dt;

      if (wideTimer > 0) {
        wideTimer -= dt;
        paddle.w = paddle.baseW * 1.5;
      } else {
        paddle.w = paddle.baseW;
      }
      if (fireTimer > 0) fireTimer -= dt;

      paddle.x = Math.max(paddle.w / 2 + 8, Math.min(w - paddle.w / 2 - 8, paddle.x));

      // Powerups
      for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        pu.y += 175 * dt;
        if (
          pu.y + 12 >= paddle.y - paddle.h / 2 &&
          pu.y - 12 <= paddle.y + paddle.h / 2 &&
          Math.abs(pu.x - paddle.x) <= paddle.w / 2 + 12
        ) {
          api.sound.collect(4);
          if (pu.kind === 'M' && balls.length > 0 && balls.length < 9) {
            const b = balls[0];
            const spd = Math.hypot(b.vx, b.vy);
            spawnBall(b.x, b.y, spd * 0.65, -Math.abs(spd * 0.76));
            spawnBall(b.x, b.y, -spd * 0.65, -Math.abs(spd * 0.76));
          } else if (pu.kind === 'W') {
            wideTimer = 10;
          } else if (pu.kind === 'F') {
            fireTimer = 7;
          }
          burst(pu.x, pu.y, pu.color, 14);
          powerups.splice(i, 1);
          continue;
        }
        if (pu.y > h + 20) powerups.splice(i, 1);
      }

      // Balls
      for (let bi = balls.length - 1; bi >= 0; bi--) {
        const b = balls[bi];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 10) b.trail.shift();

        // Walls
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); api.sound.bounce(0.9); }
        if (b.x + b.r > w) { b.x = w - b.r; b.vx = -Math.abs(b.vx); api.sound.bounce(0.9); }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); api.sound.bounce(1.0); }

        // Paddle collision
        if (
          b.vy > 0 &&
          b.y + b.r >= paddle.y - paddle.h / 2 &&
          b.y - b.r <= paddle.y + paddle.h / 2 &&
          b.x >= paddle.x - paddle.w / 2 - 4 &&
          b.x <= paddle.x + paddle.w / 2 + 4
        ) {
          const hitNorm = Math.max(-1, Math.min(1, (b.x - paddle.x) / (paddle.w / 2)));
          const spd = Math.min(620, Math.hypot(b.vx, b.vy) * 1.015);
          const ang = -Math.PI / 2 + hitNorm * 1.12;
          b.vx = Math.cos(ang) * spd;
          b.vy = Math.sin(ang) * spd;
          b.y = paddle.y - paddle.h / 2 - b.r;
          api.sound.bounce(1.25);
        }

        // Bricks collision
        for (let k = bricks.length - 1; k >= 0; k--) {
          const br = bricks[k];
          if (
            b.x + b.r > br.x &&
            b.x - b.r < br.x + br.w &&
            b.y + b.r > br.y &&
            b.y - b.r < br.y + br.h
          ) {
            if (fireTimer <= 0) {
              const overlapL = b.x + b.r - br.x;
              const overlapR = br.x + br.w - (b.x - b.r);
              const overlapT = b.y + b.r - br.y;
              const overlapB = br.y + br.h - (b.y - b.r);
              const minX = Math.min(overlapL, overlapR);
              const minY = Math.min(overlapT, overlapB);
              if (minX < minY) b.vx *= -1;
              else b.vy *= -1;
            }
            br.hp -= fireTimer > 0 ? 2 : 1;
            shake = Math.max(shake, 4);
            if (br.hp <= 0) {
              score += br.maxHp > 1 ? 25 : 15;
              api.sound.collect(k % 8);
              burst(br.x + br.w / 2, br.y + br.h / 2, br.color, 12);
              // Drop powerup chance
              if (Math.random() < 0.17) {
                const kinds = [
                  { kind: 'M', color: '#38bdf8' },
                  { kind: 'W', color: '#34d399' },
                  { kind: 'F', color: '#fb923c' },
                ];
                const pick = kinds[Math.floor(Math.random() * kinds.length)];
                powerups.push({
                  x: br.x + br.w / 2,
                  y: br.y + br.h / 2,
                  kind: pick.kind,
                  color: pick.color,
                });
              }
              bricks.splice(k, 1);
            } else {
              api.sound.bounce(1.5);
            }
            updateHud();
            break;
          }
        }

        // Missed bottom
        if (b.y - b.r > h + 15) {
          balls.splice(bi, 1);
        }
      }

      if (balls.length === 0) {
        lives--;
        shake = 10;
        api.sound.fail();
        updateHud();
        if (lives <= 0) {
          alive = false;
          api.gameOver({
            score,
            title: '能量球全部坠落！',
            subtitle: `你打穿到了第 ${stage} 波霓虹砖墙。`,
            stats: [
              { label: '最终得分', value: score },
              { label: '到达波次', value: `第 ${stage} 波` },
            ],
          });
          return;
        }
        resetPaddleAndBall();
      }

      // Stage cleared
      if (bricks.length === 0) {
        stage++;
        score += 120;
        api.sound.win();
        buildStage(stage);
        resetPaddleAndBall();
        updateHud();
      }
    },
    render(ctx) {
      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, w, h);

      // Bricks
      for (const br of bricks) {
        ctx.save();
        ctx.shadowColor = br.color;
        ctx.shadowBlur = br.hp > 1 ? 12 : 7;
        ctx.fillStyle = br.color;
        ctx.globalAlpha = br.hp > 1 ? 1 : 0.85;
        ctx.beginPath();
        ctx.roundRect(br.x, br.y, br.w, br.h, 5);
        ctx.fill();
        if (br.hp > 1) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Powerups
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 12px monospace';
      for (const pu of powerups) {
        ctx.save();
        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = pu.color;
        ctx.beginPath();
        ctx.roundRect(pu.x - 14, pu.y - 10, 28, 20, 10);
        ctx.fill();
        ctx.fillStyle = '#060814';
        ctx.fillText(pu.kind, pu.x, pu.y + 0.5);
        ctx.restore();
      }

      // Paddle
      if (paddle) {
        const padCol = fireTimer > 0 ? '#fb923c' : wideTimer > 0 ? '#34d399' : '#38bdf8';
        ctx.save();
        ctx.shadowColor = padCol;
        ctx.shadowBlur = 16;
        ctx.fillStyle = padCol;
        ctx.beginPath();
        ctx.roundRect(paddle.x - paddle.w / 2, paddle.y - paddle.h / 2, paddle.w, paddle.h, 7);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillRect(paddle.x - paddle.w * 0.28, paddle.y - 2, paddle.w * 0.56, 3);
        ctx.restore();
      }

      // Balls & trails
      const ballCol = fireTimer > 0 ? '#fb923c' : '#ffffff';
      for (const b of balls) {
        for (let i = 1; i < b.trail.length; i++) {
          const alpha = (i / b.trail.length) * 0.45;
          ctx.fillStyle = fireTimer > 0 ? `rgba(251,146,60,${alpha})` : `rgba(56,189,248,${alpha})`;
          ctx.beginPath();
          ctx.arc(b.trail[i].x, b.trail[i].y, b.r * (i / b.trail.length), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.save();
        ctx.shadowColor = fireTimer > 0 ? '#f97316' : '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.fillStyle = ballCol;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
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
      api.canvas.removeEventListener('pointermove', onPointerMove);
      api.canvas.removeEventListener('pointerdown', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}
