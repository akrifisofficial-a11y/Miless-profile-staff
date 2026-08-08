// anime.js — Случайное аниме из JSON

(function() {
  'use strict';

  const ANIME_URL = 'data/anime.json';
  const SHIKI_BASE = 'https://shikimori.one';

  let list = [];
  let current = null;
  const container = document.getElementById('animeCard');
  const nextBtn = document.getElementById('nextAnimeBtn');
  const openBtn = document.getElementById('openShikiBtn');

  function getPlaceholder(title) {
    const char = title.charAt(0).toUpperCase();
    const colors = ['#6b8fc9', '#f5a623', '#5865f2', '#ff6b9d', '#4ade80', '#f87171'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3Crect fill='%231a1f2e' width='200' height='300'/%3E%3Ccircle cx='100' cy='120' r='50' fill='${color.replace('#', '%23')}' opacity='0.15'/%3E%3Ctext x='100' y='140' text-anchor='middle' dy='.3em' fill='${color.replace('#', '%23')}' font-size='56' font-family='sans-serif' font-weight='bold'%3E${char}%3C/text%3E%3C/svg%3E`;
  }

  async function loadList() {
    try {
      const resp = await fetch(ANIME_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data.length) throw new Error('Список пуст');
      list = data;
      showRandom();
    } catch (e) {
      container.innerHTML = `<div class="loading-spinner" style="color:#f87171;">❌ ${e.message}</div>`;
    }
  }

  function showRandom() {
    if (!list.length) return;
    const idx = Math.floor(Math.random() * list.length);
    current = list[idx];
    render(current);
  }

  function render(item) {
    const anime = item.anime;
    const title = anime.russian || anime.name || 'Без названия';
    const desc = anime.description || 'Описание отсутствует';
    const score = item.score || '—';
    const statusMap = {
      'planned': '📅 В планах',
      'watching': '⏳ Смотрю',
      'completed': '✅ Просмотрено',
      'on_hold': '⏸ Отложено',
      'dropped': '❌ Брошено'
    };
    const status = statusMap[item.status] || item.status || '❓';
    let poster = '';
    if (anime.image?.preview) {
      poster = anime.image.preview;
      if (poster.startsWith('/')) poster = SHIKI_BASE + poster;
    } else {
      poster = getPlaceholder(title);
    }
    let shikiUrl = '#';
    if (anime.url) {
      shikiUrl = anime.url.startsWith('http') ? anime.url : SHIKI_BASE + anime.url;
    }
    container.innerHTML = `
      <div class="anime-card-big">
        <img src="${poster}" alt="${title}" class="poster" onerror="this.src='${getPlaceholder(title)}'">
        <div class="info">
          <h2>${title}</h2>
          <div class="meta">
            <span><i class="fas fa-star"></i> ${score}</span>
            <span><i class="fas fa-play-circle"></i> ${anime.episodes || '?'} эп.</span>
            <span><i class="fas fa-calendar-alt"></i> ${anime.year || '?'}</span>
            <span><i class="fas fa-tag"></i> ${anime.kind || 'TV'}</span>
          </div>
          <div class="status-tag">${status}</div>
          <p class="description">${desc}</p>
          ${anime.genres ? `<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.5rem;">
            ${anime.genres.slice(0,4).map(g => `<span style="font-size:0.7rem;padding:0.1rem 0.7rem;border-radius:2rem;background:rgba(255,235,200,0.04);color:#6c7b9c;border:1px solid rgba(255,235,200,0.04);">${g.russian || g.name}</span>`).join('')}
          </div>` : ''}
        </div>
      </div>
    `;
    if (openBtn) {
      openBtn.style.display = 'inline-flex';
      openBtn.onclick = () => window.open(shikiUrl, '_blank');
    }
  }

  if (nextBtn) nextBtn.addEventListener('click', showRandom);
  document.addEventListener('DOMContentLoaded', loadList);
})();
