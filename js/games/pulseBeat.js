// Game 07: 律动节拍 · Pulse Beat (4-Lane Synth Rhythm Game)
export function createPulseBeat(api) {
  let w = api.width;
  let h = api.height;

  const LANE_KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
  const LANE_LABELS = ['D', 'F', 'J', 'K'];
  const LANE_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#fbbf24'];
  // Pentatonic synth notes per lane
  const LANE_FREQS = [329.63, 392.0, 440.0, 523.25];
  const BPM = 116;
  const BEAT_SEC = 60 / BPM;
  const TRACK_BEATS = 80; // ~41 seconds energetic track
  const TRAVEL_TIME = 1.45; // seconds from top to hit line

  let notes = [];
  let songTime = 0;
  let lastKickBeat = -1;
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let perfects = 0;
  let hp = 100;
  let laneFlash = [0, 0, 0, 0];
  let judgeText = { text: '', color: '#fff', life: 0 };
  let particles = [];
  let alive = false;

  function laneMetrics() {
    const trackW = Math.min(440, w - 36);
    const laneW = trackW / 4;
    const left = (w - trackW) / 2;
    const hitY = h - 76;
    return { trackW, laneW, left, hitY };
  }

  function generateChart() {
    notes = [];
    // Musical melodic phrases over 80 beats
    const patterns = [
      [0, 1, 2, 3, 2, 1, 0, 2],
      [0, 2, 1, 3, 2, 0, 3, 1],
      [3, 2, 1, 0, 1, 2, 3, 2],
      [0, 1, 3, 2, 0, 2, 3, 1],
    ];
    for (let b = 3; b < TRACK_BEATS; b++) {
      const phrase = patterns[Math.floor(b / 8) % patterns.length];
      const lane = phrase[b % 8];
      const time = b * BEAT_SEC;
      notes.push({ lane, time, hit: false, missed: false });

      // Add fun eighth-note offbeats on energetic sections
      if (b >= 16 && b % 4 === 2) {
        const offLane = (lane + 1) % 4;
        notes.push({ lane: offLane, time: time + BEAT_SEC * 0.5, hit: false, missed: false });
      }
      // Occasional chord double-tap in climax
      if (b >= 36 && b % 8 === 0) {
        const chordLane = (lane + 2) % 4;
        notes.push({ lane: chordLane, time, hit: false, missed: false });
      }
    }
  }

  function reset() {
    generateChart();
    songTime = 0;
    lastKickBeat = -1;
    score = 0;
    combo = 0;
    maxCombo = 0;
    perfects = 0;
    hp = 100;
    laneFlash = [0, 0, 0, 0];
    judgeText = { text: '', color: '#fff', life: 0 };
    particles = [];
    alive = true;
    updateHud();
  }

  function updateHud() {
    api.setHud({
      score,
      extra: `${combo} 连击`,
      scoreLabel: '得分',
      extraLabel: '连击',
    });
  }

  function triggerLane(lane) {
    if (!alive || !api.isRunning()) return;
    laneFlash[lane] = 1;
    const { laneW, left, hitY } = laneMetrics();
    const lx = left + (lane + 0.5) * laneW;

    // Find closest unhit note in this lane
    let bestNote = null;
    let bestDiff = Infinity;
    for (const n of notes) {
      if (n.lane !== lane || n.hit || n.missed) continue;
      const diff = Math.abs(n.time - songTime);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestNote = n;
      }
    }

    if (bestNote && bestDiff <= 0.19) {
      bestNote.hit = true;
      const isPerfect = bestDiff <= 0.085;
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      if (isPerfect) perfects++;
      const mult = 1 + Math.min(2, Math.floor(combo / 10) * 0.25);
      const pts = Math.round((isPerfect ? 100 : 60) * mult);
      score += pts;
      hp = Math.min(100, hp + (isPerfect ? 3 : 1.5));

      // Play musical synth note!
      api.sound.note(LANE_FREQS[lane] * (isPerfect ? 1.5 : 1), 0.16, 'triangle', 0.13);
      judgeText = {
        text: isPerfect ? `PERFECT +${pts}` : `GREAT +${pts}`,
        color: isPerfect ? '#fde047' : '#38bdf8',
        life: 0.55,
      };

      for (let i = 0; i < (isPerfect ? 16 : 9); i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 170;
        particles.push({
          x: lx,
          y: hitY,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 0.35 + Math.random() * 0.2,
          maxLife: 0.55,
          size: 2.5 + Math.random() * 3,
          color: LANE_COLORS[lane],
        });
      }
      updateHud();
    } else {
      // Soft feedback tap if empty
      api.sound.tone(LANE_FREQS[lane] * 0.5, 0.06, 'sine', 0.04);
    }
  }

  function onKeyDown(e) {
    if (!api.isRunning() || e.repeat) return;
    const idx = LANE_KEYS.indexOf(e.code);
    if (idx !== -1) {
      e.preventDefault();
      triggerLane(idx);
    }
  }

  function onPointerDown(e) {
    if (!api.isRunning()) return;
    const p = api.getPointerPos(e);
    const { left, laneW, trackW } = laneMetrics();
    if (p.x >= left && p.x <= left + trackW) {
      const idx = Math.floor((p.x - left) / laneW);
      if (idx >= 0 && idx < 4) triggerLane(idx);
    }
  }

  window.addEventListener('keydown', onKeyDown);
  api.canvas.addEventListener('pointerdown', onPointerDown);

  return {
    start() {
      reset();
    },
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    update(dt) {
      for (let i = 0; i < 4; i++) {
        if (laneFlash[i] > 0) laneFlash[i] = Math.max(0, laneFlash[i] - dt * 5);
      }
      if (judgeText.life > 0) judgeText.life -= dt;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (!alive || !api.isRunning()) return;

      songTime += dt;

      // Subtle synthesized synthwave bass kick pulse on every beat!
      const currentBeat = Math.floor(songTime / BEAT_SEC);
      if (currentBeat > lastKickBeat && currentBeat < TRACK_BEATS) {
        lastKickBeat = currentBeat;
        const bassFreq = currentBeat % 4 === 0 ? 110 : currentBeat % 2 === 0 ? 82.4 : 98;
        api.sound.tone(bassFreq, 0.14, 'sine', 0.07, 42);
      }

      // Check missed notes
      for (const n of notes) {
        if (!n.hit && !n.missed && songTime - n.time > 0.2) {
          n.missed = true;
          combo = 0;
          hp = Math.max(0, hp - 10);
          judgeText = { text: 'MISS', color: '#fb7185', life: 0.45 };
          updateHud();
          if (hp <= 0) {
            alive = false;
            api.sound.fail();
            api.gameOver({
              score,
              title: '节拍中断！',
              subtitle: '能量槽耗尽了，跟着合成器底鼓再试一次！',
              stats: [
                { label: '最终得分', value: score },
                { label: '最高连击', value: maxCombo },
              ],
            });
            return;
          }
        }
      }

      // Check song completion
      const endTime = TRACK_BEATS * BEAT_SEC + 1.2;
      if (songTime >= endTime) {
        alive = false;
        api.sound.win();
        api.gameOver({
          score,
          won: true,
          title: '电音曲目演出完成！',
          subtitle: `你打出了 ${perfects} 次 PERFECT，最高连击 ${maxCombo}！`,
          stats: [
            { label: '最终得分', value: score },
            { label: '最高连击', value: maxCombo },
          ],
        });
      }
    },
    render(ctx) {
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, w, h);

      const { trackW, laneW, left, hitY } = laneMetrics();
      const beatFrac = (songTime % BEAT_SEC) / BEAT_SEC;
      const beatGlow = Math.max(0, 1 - beatFrac * 2.5);

      // Ambient beat pulse background
      const bgGrad = ctx.createRadialGradient(w / 2, hitY, 10, w / 2, hitY, trackW * 0.9);
      bgGrad.addColorStop(0, `rgba(167, 139, 250, ${0.12 + beatGlow * 0.12})`);
      bgGrad.addColorStop(1, 'rgba(6, 8, 20, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Track backdrop
      ctx.fillStyle = 'rgba(13, 18, 36, 0.88)';
      ctx.fillRect(left, 0, trackW, h);

      // Lanes & flash highlights
      for (let i = 0; i < 4; i++) {
        const lx = left + i * laneW;
        if (laneFlash[i] > 0) {
          const lg = ctx.createLinearGradient(0, hitY - 180, 0, h);
          lg.addColorStop(0, 'transparent');
          lg.addColorStop(1, LANE_COLORS[i] + '55');
          ctx.fillStyle = lg;
          ctx.globalAlpha = laneFlash[i];
          ctx.fillRect(lx, 0, laneW, h);
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, h);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.strokeRect(left, 0, trackW, h);

      // Beat horizontal grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let b = Math.floor(songTime / BEAT_SEC); b < TRACK_BEATS; b++) {
        const dtNote = b * BEAT_SEC - songTime;
        if (dtNote < -0.1 || dtNote > TRAVEL_TIME) continue;
        const y = hitY - (dtNote / TRAVEL_TIME) * (hitY + 20);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + trackW, y);
        ctx.stroke();
      }

      // Hit receptors
      ctx.strokeStyle = `rgba(255,255,255,${0.28 + beatGlow * 0.25})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, hitY);
      ctx.lineTo(left + trackW, hitY);
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        const cx = left + (i + 0.5) * laneW;
        const r = Math.min(26, laneW * 0.34);
        ctx.save();
        ctx.strokeStyle = LANE_COLORS[i];
        ctx.lineWidth = 2.5 + laneFlash[i] * 2.5;
        ctx.shadowColor = LANE_COLORS[i];
        ctx.shadowBlur = 8 + laneFlash[i] * 14;
        ctx.beginPath();
        ctx.arc(cx, hitY, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '800 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(LANE_LABELS[i], cx, hitY + 1);
        ctx.restore();
      }

      // Falling notes
      for (const n of notes) {
        if (n.hit || n.missed) continue;
        const dtNote = n.time - songTime;
        if (dtNote > TRAVEL_TIME || dtNote < -0.22) continue;
        const y = hitY - (dtNote / TRAVEL_TIME) * (hitY + 20);
        const cx = left + (n.lane + 0.5) * laneW;
        const col = LANE_COLORS[n.lane];
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = 16;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(cx - laneW * 0.34, y - 11, laneW * 0.68, 22, 11);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(cx - laneW * 0.18, y - 4, laneW * 0.36, 8, 4);
        ctx.fill();
        ctx.restore();
      }

      // Progress & HP bars at top
      const prog = Math.min(1, songTime / (TRACK_BEATS * BEAT_SEC));
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(left + 12, 14, trackW - 24, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(left + 12, 14, (trackW - 24) * prog, 6);

      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(left + 12, 26, trackW - 24, 5);
      ctx.fillStyle = hp > 35 ? '#34d399' : '#fb7185';
      ctx.fillRect(left + 12, 26, (trackW - 24) * (hp / 100), 5);

      // Judgment popup
      if (judgeText.life > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, judgeText.life * 2.5);
        ctx.fillStyle = judgeText.color;
        ctx.font = '900 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = judgeText.color;
        ctx.shadowBlur = 14;
        ctx.fillText(judgeText.text, w / 2, hitY - 72);
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
    },
  };
}
