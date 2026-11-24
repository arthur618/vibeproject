import { sound } from './audio.js';
import { storage } from './storage.js';
import { createGravityFlip } from './games/gravityFlip.js';
import { createNeonBlade } from './games/neonBlade.js';
import { createOrbitalSling } from './games/orbitalSling.js';
import { createPortalSnake } from './games/portalSnake.js';
import { createPrismLaser } from './games/prismLaser.js';
import { createCyberBreakout } from './games/cyberBreakout.js';
import { createPulseBeat } from './games/pulseBeat.js';
import { createSkyStacker } from './games/skyStacker.js';
import { createCoreDefender } from './games/coreDefender.js';

const GAMES = [
  {
    id: 'gravity-flip',
    num: '01',
    title: '引力反转',
    subtitle: 'Gravity Flip',
    tag: '动作跑酷',
    accent: '#38bdf8',
    starTarget: 200,
    desc: '在霓虹隧道中极速狂奔！点击屏幕或按空格键瞬间反转重力，在天花板与地板间穿梭，躲避激光屏障并收集金色晶核。',
    controlsHtml: '<kbd>点击</kbd> 或 <kbd>Space</kbd> / <kbd>↑</kbd><kbd>↓</kbd> 反转重力',
    factory: createGravityFlip,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#071022';
      ctx.fillRect(0, 0, w, h);
      const m = 12;
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, m); ctx.lineTo(w, m); ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath(); ctx.moveTo(0, h - m); ctx.lineTo(w, h - m); ctx.stroke();

      // Scrolling obstacles
      const ox1 = ((w - (t * 75) % (w + 40)) + 20);
      const ox2 = ((w - ((t * 75 + w * 0.52) % (w + 40))) + 20);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(ox1, h - m - 22, 10, 22);
      ctx.fillRect(ox2, m, 10, 22);

      // Flipping runner cube
      const wave = Math.sin(t * 2.6);
      const py = wave > 0 ? m + 7 : h - m - 7;
      ctx.fillStyle = wave > 0 ? '#f472b6' : '#38bdf8';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fillRect(w * 0.28 - 6, py - 6, 12, 12);
      ctx.shadowBlur = 0;
    },
  },
  {
    id: 'neon-blade',
    num: '02',
    title: '光剑切星',
    subtitle: 'Neon Blade',
    tag: '解压切割',
    accent: '#f472b6',
    starTarget: 150,
    desc: '按住鼠标或手指滑动挥出等离子光剑，将跃起的霓虹星核一刀两断！连续一刀多切触发高额连击，切记避开红色虚空炸弹。',
    controlsHtml: '<kbd>按住拖拽</kbd> 挥动光剑切割星核 · 避开红色炸弹',
    factory: createNeonBlade,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#0d0c1d';
      ctx.fillRect(0, 0, w, h);
      const balls = [
        { x: w * 0.3, y: h * 0.55 + Math.sin(t * 3) * 14, c: '#38bdf8', r: 10 },
        { x: w * 0.54, y: h * 0.44 + Math.cos(t * 2.6) * 14, c: '#fbbf24', r: 11 },
        { x: w * 0.74, y: h * 0.58 + Math.sin(t * 3.4 + 1) * 12, c: '#34d399', r: 9 },
      ];
      for (const b of balls) {
        ctx.fillStyle = b.c;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      }
      // Animated blade arc
      const p = (t * 1.4) % 1;
      const sx = w * 0.14 + p * w * 0.72;
      const sy = h * 0.75 - Math.sin(p * Math.PI) * h * 0.52;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(Math.max(12, sx - 36), sy + 14);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  },
  {
    id: 'orbital-sling',
    num: '03',
    title: '星际弹弓',
    subtitle: 'Orbital Sling',
    tag: '重力物理',
    accent: '#818cf8',
    starTarget: 260,
    desc: '按住绿色发射点向后拖拽拉弓，借助真实牛顿星球引力场甩出弧线轨道，沿途摘取星辰并精准驶入蓝紫虫洞！',
    controlsHtml: '<kbd>按住发射点拖拽</kbd> 瞄准发射 · 飞行中点击立即重置',
    factory: createOrbitalSling,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.56;
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#818cf8';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Orbiting probe
      const a = t * 2.2;
      const px = cx + Math.cos(a) * 32;
      const py = cy + Math.sin(a) * 20;
      ctx.fillStyle = '#34d399';
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();

      // Portal
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(w * 0.84, h * 0.4, 9, t * 2, t * 2 + Math.PI * 1.4); ctx.stroke();
    },
  },
  {
    id: 'portal-snake',
    num: '04',
    title: '虫洞贪吃蛇',
    subtitle: 'Portal Snake',
    tag: '街机魔改',
    accent: '#34d399',
    starTarget: 120,
    desc: '经典贪吃蛇的时空跃迁版！场地中存在一对相连的蓝/橙虫洞，钻入一端即可从另一端瞬移穿梭并获得跃迁加分！',
    controlsHtml: '<kbd>方向键</kbd> / <kbd>WASD</kbd> 或 <kbd>滑动屏幕</kbd> 控制转向',
    factory: createPortalSnake,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#061117';
      ctx.fillRect(0, 0, w, h);
      // Portals
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(w * 0.25, h * 0.5, 9, t * 3, t * 3 + Math.PI * 1.5); ctx.stroke();
      ctx.strokeStyle = '#fb923c';
      ctx.beginPath(); ctx.arc(w * 0.75, h * 0.5, 9, -t * 3, -t * 3 + Math.PI * 1.5); ctx.stroke();

      // Animated neon snake segments
      for (let i = 0; i < 6; i++) {
        const phase = (t * 2.2 - i * 0.12);
        const sx = w * 0.5 + Math.cos(phase) * (w * 0.28);
        const sy = h * 0.5 + Math.sin(phase * 2) * (h * 0.24);
        ctx.fillStyle = i === 0 ? '#6ee7b7' : '#10b981';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
      }
    },
  },
  {
    id: 'prism-laser',
    num: '05',
    title: '棱镜激光',
    subtitle: 'Prism Laser',
    tag: '光学解谜',
    accent: '#f43f5e',
    starTarget: 350,
    desc: '点击场内的反射镜片与分光棱镜旋转 90°，实时折射并分束激光，同时点亮所有能量晶石即可进入下一关！',
    controlsHtml: '<kbd>点击镜片 / 分光棱镜</kbd> 旋转角度，接通全部绿色晶石',
    factory: createPrismLaser,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#0a0b18';
      ctx.fillRect(0, 0, w, h);
      // Laser beam bouncing
      const mx = w * 0.52;
      const my = h * 0.32;
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(16, my);
      ctx.lineTo(mx, my);
      ctx.lineTo(mx, h * 0.72);
      ctx.lineTo(w - 20, h * 0.72);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Mirrors
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(mx - 8, my - 8); ctx.lineTo(mx + 8, my + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx - 8, h * 0.72 - 8); ctx.lineTo(mx + 8, h * 0.72 + 8); ctx.stroke();

      // Target diamond pulsing
      const s = 7 + Math.sin(t * 5) * 1.5;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(w - 20, h * 0.72 - s);
      ctx.lineTo(w - 20 + s, h * 0.72);
      ctx.lineTo(w - 20, h * 0.72 + s);
      ctx.lineTo(w - 20 - s, h * 0.72);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'cyber-breakout',
    num: '06',
    title: '霓虹弹珠砖',
    subtitle: 'Cyber Breakout',
    tag: '弹球爽感',
    accent: '#fb923c',
    starTarget: 260,
    desc: '经典打砖块赛博升级！接住掉落的 M(三球分裂)、W(加宽挡板)、F(烈焰穿透) 道具，将整面霓虹砖墙轰成绚丽粒子！',
    controlsHtml: '<kbd>移动鼠标</kbd> 或 <kbd>←</kbd><kbd>→</kbd> 控制挡板 · 接住彩色强化道具',
    factory: createCyberBreakout,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#080b18';
      ctx.fillRect(0, 0, w, h);
      const cols = ['#fb7185', '#fb923c', '#fbbf24'];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          ctx.fillStyle = cols[r];
          ctx.fillRect(14 + c * ((w - 28) / 6), 10 + r * 11, (w - 28) / 6 - 4, 7);
        }
      }
      const px = w * 0.5 + Math.sin(t * 2.1) * (w * 0.25);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 22, h - 14, 44, 6);
      const bx = w * 0.5 + Math.sin(t * 3.1) * (w * 0.3);
      const by = h * 0.62 + Math.cos(t * 4.5) * 14;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, Math.PI * 2); ctx.fill();
    },
  },
  {
    id: 'pulse-beat',
    num: '07',
    title: '律动节拍',
    subtitle: 'Pulse Beat',
    tag: '音乐节奏',
    accent: '#a78bfa',
    starTarget: 1800,
    desc: '自带 Web Audio 合成器电音节奏的四轨音游！在霓虹音符落入判定圆环的瞬间按下 D/F/J/K 或点击轨道，奏响连击旋律！',
    controlsHtml: '<kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd> 或 <kbd>点击四条轨道</kbd> 精准踩点',
    factory: createPulseBeat,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#09091a';
      ctx.fillRect(0, 0, w, h);
      const colors = ['#38bdf8', '#a78bfa', '#f472b6', '#fbbf24'];
      const trackW = w * 0.72;
      const left = (w - trackW) / 2;
      const lw = trackW / 4;
      for (let i = 0; i < 4; i++) {
        const cx = left + (i + 0.5) * lw;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.moveTo(left + i * lw, 0); ctx.lineTo(left + i * lw, h); ctx.stroke();
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, h - 16, 7, 0, Math.PI * 2); ctx.stroke();
        const ny = ((t * 58 + i * 24) % (h - 14));
        ctx.fillStyle = colors[i];
        ctx.fillRect(cx - 8, ny - 3, 16, 6);
      }
    },
  },
  {
    id: 'sky-stacker',
    num: '08',
    title: '云端叠叠乐',
    subtitle: 'Sky Stacker',
    tag: '精准时机',
    accent: '#fbbf24',
    starTarget: 180,
    desc: '看准滑动霓虹石板对齐的瞬间落锤堆叠！超出边缘的部分将被削落，连续完美重合将触发金色震荡波并奏响五声音阶！',
    controlsHtml: '<kbd>点击</kbd> 或 <kbd>Space</kbd> 在精准重合瞬间放下石板',
    factory: createSkyStacker,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#0a0d1e';
      ctx.fillRect(0, 0, w, h);
      const colors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        const bw = 64 - i * 4;
        ctx.fillRect(w / 2 - bw / 2, h - 14 - i * 11, bw, 9);
      }
      const sx = w / 2 - 24 + Math.sin(t * 3.2) * 38;
      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(sx, h - 14 - 4 * 11, 48, 9);
    },
  },
  {
    id: 'core-defender',
    num: '09',
    title: '核心守卫',
    subtitle: 'Core Defender',
    tag: '360°射击',
    accent: '#2dd4bf',
    starTarget: 220,
    desc: '守护中央能量核心！移动鼠标控制 360° 轨道炮塔自动连发拦截四面涌来的无人机，蓄满能量按空格或右键释放 EMP 清屏！',
    controlsHtml: '<kbd>移动鼠标</kbd> 瞄准射击 · <kbd>Space</kbd> / <kbd>右键</kbd> 释放 EMP 震荡波',
    factory: createCoreDefender,
    drawPreview(ctx, w, h, t) {
      ctx.fillStyle = '#060c14';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.22)';
      ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#2dd4bf';
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Rotating turret + bullet
      const ang = t * 2.1;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 8, cy + Math.sin(ang) * 8);
      ctx.lineTo(cx + Math.cos(ang) * 18, cy + Math.sin(ang) * 18);
      ctx.stroke();

      const bd = 18 + ((t * 60) % 28);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * bd, cy + Math.sin(ang) * bd, 2.5, 0, Math.PI * 2); ctx.fill();

      // Incoming enemy dots
      for (let i = 0; i < 3; i++) {
        const ea = i * 2.1 + 0.6;
        const ed = 36 - ((t * 14 + i * 11) % 20);
        ctx.fillStyle = i === 1 ? '#fbbf24' : '#f472b6';
        ctx.beginPath(); ctx.arc(cx + Math.cos(ea) * ed, cy + Math.sin(ea) * ed, 4, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
];

// ==================== DOM ELEMENTS ====================
const hubView = document.getElementById('hub-view');
const gameGrid = document.getElementById('game-grid');
const totalStarsEl = document.getElementById('total-stars');
const totalScoreEl = document.getElementById('total-score');
const randomGameBtn = document.getElementById('random-game-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');

const stageView = document.getElementById('stage-view');
const backBtn = document.getElementById('back-btn');
const restartBtn = document.getElementById('restart-btn');
const stageSoundBtn = document.getElementById('stage-sound-btn');
const stageNumEl = document.getElementById('stage-num');
const stageTitleEl = document.getElementById('stage-title');
const stageTagEl = document.getElementById('stage-tag');
const hudScoreLabel = document.getElementById('hud-score-label');
const hudScoreEl = document.getElementById('hud-score');
const hudExtraLabel = document.getElementById('hud-extra-label');
const hudExtraEl = document.getElementById('hud-extra');
const hudBestEl = document.getElementById('hud-best');
const stageControlsHint = document.getElementById('stage-controls-hint');
const stageGoalHint = document.getElementById('stage-goal-hint');

const canvasFrame = document.getElementById('canvas-frame');
const gameCanvas = document.getElementById('game-canvas');
const gameCtx = gameCanvas.getContext('2d');

const stageOverlay = document.getElementById('stage-overlay');
const overlayBadge = document.getElementById('overlay-badge');
const overlayTitle = document.getElementById('overlay-title');
const overlayDesc = document.getElementById('overlay-desc');
const overlayStats = document.getElementById('overlay-stats');
const overlayStartBtn = document.getElementById('overlay-start-btn');
const overlayBackBtn = document.getElementById('overlay-back-btn');

// ==================== STATE ====================
let activeGameMeta = null;
let activeGameInst = null;
let stageRunning = false;
let canvasCssW = 800;
let canvasCssH = 500;
let lastFrameTime = performance.now();
const tilePreviews = [];

// ==================== AMBIENT BACKGROUND ====================
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
const bgDots = Array.from({ length: 64 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: 0.7 + Math.random() * 1.6,
  vy: 0.008 + Math.random() * 0.018,
  alpha: 0.16 + Math.random() * 0.42,
}));

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeBg();

function renderBg(dt) {
  const bw = bgCanvas.width;
  const bh = bgCanvas.height;
  bgCtx.clearRect(0, 0, bw, bh);

  for (const d of bgDots) {
    d.y -= d.vy * dt;
    if (d.y < -0.02) {
      d.y = 1.02;
      d.x = Math.random();
    }
    bgCtx.fillStyle = `rgba(148, 180, 255, ${d.alpha})`;
    bgCtx.beginPath();
    bgCtx.arc(d.x * bw, d.y * bh, d.r, 0, Math.PI * 2);
    bgCtx.fill();
  }
}

// ==================== SOUND BUTTONS ====================
function syncSoundIcons() {
  const icon = sound.muted ? '🔇' : '🔊';
  soundToggleBtn.textContent = icon;
  stageSoundBtn.textContent = icon;
}
syncSoundIcons();

soundToggleBtn.addEventListener('click', () => {
  sound.toggleMute();
  syncSoundIcons();
});
stageSoundBtn.addEventListener('click', () => {
  sound.toggleMute();
  syncSoundIcons();
});

// ==================== BUILD 3x3 GRID ====================
function renderGrid() {
  gameGrid.innerHTML = '';
  tilePreviews.length = 0;

  for (const game of GAMES) {
    const best = storage.getBest(game.id);
    const hasStar = storage.hasStar(game.id, game.starTarget);

    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'game-tile';
    tile.style.setProperty('--tile-accent', game.accent);
    tile.dataset.gameId = game.id;
    tile.setAttribute('aria-label', `${game.title} ${game.subtitle}`);

    tile.innerHTML = `
      <div class="tile-top">
        <span class="tile-index">${game.num}</span>
        <div class="tile-badges">
          <span class="tile-tag">${game.tag}</span>
          <span class="tile-star ${hasStar ? 'earned' : ''}" title="目标分 ${game.starTarget}">★</span>
        </div>
      </div>
      <div class="tile-preview-wrap">
        <canvas class="tile-preview-canvas"></canvas>
      </div>
      <div class="tile-bottom">
        <div class="tile-info">
          <h2>${game.title}</h2>
          <p>${game.subtitle}</p>
        </div>
        <div class="tile-score">
          <span class="tile-score-label">BEST</span>
          <span class="tile-score-val">${best}</span>
        </div>
      </div>
    `;

    tile.addEventListener('mouseenter', () => sound.hover());
    tile.addEventListener('click', () => {
      sound.click();
      openGame(game);
    });

    gameGrid.appendChild(tile);

    const pCanvas = tile.querySelector('.tile-preview-canvas');
    tilePreviews.push({
      canvas: pCanvas,
      ctx: pCanvas.getContext('2d'),
      game,
    });
  }

  refreshHubStats();
  resizePreviews();
}

function refreshHubStats() {
  const { totalStars, totalScore } = storage.getSummary(GAMES);
  totalStarsEl.textContent = String(totalStars);
  totalScoreEl.textContent = String(totalScore);

  for (const game of GAMES) {
    const tile = gameGrid.querySelector(`[data-game-id="${game.id}"]`);
    if (!tile) continue;
    const best = storage.getBest(game.id);
    const hasStar = storage.hasStar(game.id, game.starTarget);
    const valEl = tile.querySelector('.tile-score-val');
    const starEl = tile.querySelector('.tile-star');
    if (valEl) valEl.textContent = String(best);
    if (starEl) starEl.classList.toggle('earned', hasStar);
  }
}

function resizePreviews() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const item of tilePreviews) {
    const rect = item.canvas.parentElement.getBoundingClientRect();
    const w = Math.max(120, Math.floor(rect.width));
    const h = Math.max(54, Math.floor(rect.height));
    item.canvas.width = Math.floor(w * dpr);
    item.canvas.height = Math.floor(h * dpr);
    item.w = w;
    item.h = h;
    item.dpr = dpr;
  }
}

// ==================== GAME STAGE LIFECYCLE ====================
function resizeStageCanvas() {
  if (!activeGameMeta) return;
  const rect = canvasFrame.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasCssW = Math.max(300, Math.floor(rect.width));
  canvasCssH = Math.max(260, Math.floor(rect.height));
  gameCanvas.width = Math.floor(canvasCssW * dpr);
  gameCanvas.height = Math.floor(canvasCssH * dpr);
  gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (activeGameInst && activeGameInst.resize) {
    activeGameInst.resize(canvasCssW, canvasCssH);
  }
}

function showOverlay({ badge, title, desc, buttonText, stats = null }) {
  overlayBadge.textContent = badge;
  overlayTitle.textContent = title;
  overlayDesc.textContent = desc;
  overlayStartBtn.textContent = buttonText;

  if (stats && stats.length) {
    overlayStats.innerHTML = stats
      .map((s) => `<div class="overlay-stat-item"><span>${s.label}</span><strong>${s.value}</strong></div>`)
      .join('');
    overlayStats.classList.remove('hidden');
  } else {
    overlayStats.classList.add('hidden');
  }
  stageOverlay.classList.remove('hidden');
}

function hideOverlay() {
  stageOverlay.classList.add('hidden');
}

function openGame(game) {
  closeGame(false);
  activeGameMeta = game;
  stageRunning = false;

  stageView.style.setProperty('--stage-accent', game.accent);
  stageNumEl.textContent = game.num;
  stageTitleEl.textContent = `${game.title} · ${game.subtitle}`;
  stageTagEl.textContent = game.tag;
  stageControlsHint.innerHTML = game.controlsHtml;
  stageGoalHint.textContent = `★ 勋章目标: ${game.starTarget} 分`;

  hudScoreLabel.textContent = '得分';
  hudScoreEl.textContent = '0';
  hudExtraLabel.textContent = '状态';
  hudExtraEl.textContent = '-';
  hudBestEl.textContent = String(storage.getBest(game.id));

  hubView.classList.add('is-hidden');
  stageView.classList.remove('hidden');
  stageView.setAttribute('aria-hidden', 'false');

  resizeStageCanvas();

  const api = {
    canvas: gameCanvas,
    get width() { return canvasCssW; },
    get height() { return canvasCssH; },
    sound,
    isRunning() { return stageRunning; },
    getPointerPos(e) {
      const rect = gameCanvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    setHud({ score, extra, scoreLabel, extraLabel }) {
      if (scoreLabel) hudScoreLabel.textContent = scoreLabel;
      if (extraLabel) hudExtraLabel.textContent = extraLabel;
      if (score !== undefined) {
        hudScoreEl.textContent = String(Math.floor(score));
        // Live persist best score for endless games
        const currentBest = storage.getBest(game.id);
        if (Math.floor(score) > currentBest) {
          const res = storage.recordScore(game.id, score, game.starTarget);
          hudBestEl.textContent = String(res.best);
        }
      }
      if (extra !== undefined) hudExtraEl.textContent = String(extra);
    },
    gameOver({ score = 0, title = '游戏结束', subtitle = '', stats = [], won = false }) {
      stageRunning = false;
      const res = storage.recordScore(game.id, score, game.starTarget);
      hudBestEl.textContent = String(res.best);
      refreshHubStats();

      const badge = won
        ? '★ STAGE CLEAR'
        : res.isNewBest && score > 0
          ? '★ NEW RECORD'
          : 'GAME OVER';
      const starMsg = res.star && score >= game.starTarget ? ' ★ 已点亮本关勋章！' : '';

      showOverlay({
        badge,
        title,
        desc: subtitle + starMsg,
        buttonText: '再来一局',
        stats: stats.length ? stats : [{ label: '本局得分', value: Math.floor(score) }, { label: '历史最高', value: res.best }],
      });
    },
  };

  activeGameInst = game.factory(api);
  // Pre-initialize scene so canvas looks vivid behind start card
  if (activeGameInst.start) activeGameInst.start();
  stageRunning = false;

  showOverlay({
    badge: `GAME ${game.num} · ${game.tag}`,
    title: game.title,
    desc: game.desc,
    buttonText: '开始游戏',
  });
}

function startActiveGame() {
  if (!activeGameInst) return;
  sound.click();
  hideOverlay();
  stageRunning = true;
  if (activeGameInst.start) activeGameInst.start();
}

function closeGame(playSound = true) {
  if (playSound && activeGameMeta) sound.click();
  stageRunning = false;
  if (activeGameInst && activeGameInst.destroy) {
    activeGameInst.destroy();
  }
  activeGameInst = null;
  activeGameMeta = null;

  stageView.classList.add('hidden');
  stageView.setAttribute('aria-hidden', 'true');
  hideOverlay();
  hubView.classList.remove('is-hidden');
  refreshHubStats();
}

// ==================== GLOBAL EVENTS ====================
overlayStartBtn.addEventListener('click', startActiveGame);
overlayBackBtn.addEventListener('click', () => closeGame(true));
backBtn.addEventListener('click', () => closeGame(true));
restartBtn.addEventListener('click', () => {
  if (!activeGameInst) return;
  startActiveGame();
});

randomGameBtn.addEventListener('click', () => {
  sound.click();
  const pick = GAMES[Math.floor(Math.random() * GAMES.length)];
  openGame(pick);
});

window.addEventListener('keydown', (e) => {
  if (!activeGameMeta) return;
  if (e.code === 'Escape') {
    e.preventDefault();
    closeGame(true);
  } else if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    startActiveGame();
  } else if ((e.code === 'Enter' || e.code === 'Space') && !stageRunning && !stageOverlay.classList.contains('hidden')) {
    e.preventDefault();
    startActiveGame();
  }
});

window.addEventListener('resize', () => {
  resizeBg();
  resizePreviews();
  resizeStageCanvas();
});

// ==================== MAIN ANIMATION LOOP ====================
function loop(now) {
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  const t = now / 1000;

  renderBg(dt);

  if (!activeGameMeta) {
    // Animate the 9 live mini-previews on the 3x3 hub!
    for (const item of tilePreviews) {
      if (!item.w) continue;
      item.ctx.setTransform(item.dpr, 0, 0, item.dpr, 0, 0);
      item.game.drawPreview(item.ctx, item.w, item.h, t);
    }
  } else if (activeGameInst) {
    activeGameInst.update(dt);
    activeGameInst.render(gameCtx, canvasCssW, canvasCssH);
  }

  requestAnimationFrame(loop);
}

renderGrid();
requestAnimationFrame(loop);
