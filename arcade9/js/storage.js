// LocalStorage persistence for high scores and earned medals
const STORAGE_KEY = 'arcade9_progress_v1';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export const storage = {
  getBest(gameId) {
    const data = loadAll();
    return Number(data[gameId]?.best || 0);
  },

  recordScore(gameId, score, starTarget) {
    const data = loadAll();
    const prev = data[gameId] || { best: 0, plays: 0, star: false };
    const numeric = Math.max(0, Math.floor(score));
    const isNewBest = numeric > prev.best;
    const best = Math.max(prev.best, numeric);
    const star = prev.star || best >= starTarget;
    data[gameId] = {
      best,
      plays: prev.plays + 1,
      star,
    };
    saveAll(data);
    return { best, isNewBest, star };
  },

  hasStar(gameId, starTarget) {
    const data = loadAll();
    const rec = data[gameId];
    return Boolean(rec && (rec.star || rec.best >= starTarget));
  },

  getSummary(games) {
    const data = loadAll();
    let totalStars = 0;
    let totalScore = 0;
    for (const g of games) {
      const rec = data[g.id];
      if (rec) {
        totalScore += Number(rec.best || 0);
        if (rec.star || rec.best >= g.starTarget) totalStars++;
      }
    }
    return { totalStars, totalScore };
  },
};
