// shikimori.js — Загрузка из JSON на GitHub + ссылки на детальную страницу

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    githubJsonUrl: 'https://raw.githubusercontent.com/akrifisofficial-a11y/Miless-profile-staff/main/anime_rates.json',
    shikimoriBaseUrl: 'https://shikimori.io'
  };

  // --- СОСТОЯНИЕ ---
  const state = {
    allAnime: [],
    filteredAnime: [],
    currentFilter: 'all',
    currentSort: 'score-desc',
    searchQuery: '',
    isLoading: false
  };

  // --- СТАТУСЫ ---
  const STATUS_MAP = {
    'planned': '📅 Запланировано',
    'watching': '⏳ Смотрю',
    'completed': '✅ Просмотрено',
    'on_hold': '⏸ Отложено',
    'dropped': '❌ Брошено'
  };

  // --- DOM ЭЛЕМЕНТЫ ---
  const DOM = {
    grid: document.getElementById('animeGrid'),
    stats: {
      total: document.getElementById('totalAnime'),
      completed: document.getElementById('completedAnime'),
      watching: document.getElementById('watchingAnime'),
      planned: document.getElementById('plannedAnime'),
      avgScore: document.getElementById('avgScore'),
      totalEpisodes: document.getElementById('totalEpisodes')
    },
    loadMore: document.getElementById('loadMoreContainer'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    random: document.getElementById('randomAnime'),
    top: document.getElementById('topAnime'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    sortSelect: document.getElementById('sortSelect'),
    searchInput: document.getElementById('searchInput'),
    apiDot: document.getElementById('apiDot'),
    apiText: document.getElementById('apiText'),
    apiCount: document.getElementById('apiCount')
  };

  // --- ПОЛУЧЕНИЕ ПОСТЕРА ---
  function getAnimePoster(anime) {
    if (!anime) return getPlaceholder('?');
    let url = null;
    if (anime.image?.preview) url = anime.image.preview;
    else if (anime.image?.original) url = anime.image.original;
    else if (typeof anime.image === 'string') url = anime.image;
    if (url) {
      if (url.startsWith('/')) url = 'https://shikimori.io' + url;
      return url;
    }
    return getPlaceholder(anime.russian || anime.name || '?');
  }

  function getPlaceholder(title) {
    const char = title.charAt(0).toUpperCase();
    const colors = ['#6b8fc9', '#f5a623', '#5865f2', '#ff6b9d', '#4ade80', '#f87171'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3Crect fill='%231a1f2e' width='200' height='300'/%3E%3Ccircle cx='100' cy='120' r='50' fill='${color.replace('#', '%23')}' opacity='0.15'/%3E%3Ctext x='100' y='140' text-anchor='middle' dy='.3em' fill='${color.replace('#', '%23')}' font-size='56' font-family='sans-serif' font-weight='bold'%3E${char}%3C/text%3E%3C/svg%3E`;
  }

  // --- ЗАГРУЗКА С GITHUB ---
  async function loadFromGitHub() {
    if (state.isLoading) return;
    state.isLoading = true;
    if (!DOM.grid) return;
    DOM.grid.innerHTML = '<div class="loading-spinner">📂 Загрузка с GitHub...</div>';

    try {
      const response = await fetch(CONFIG.githubJsonUrl);
      if (!response.ok) throw new Error(`GitHub: ${response.status}`);
      const data = await response.json();
      if (!data || data.length === 0) throw new Error('📭 Файл пуст');
      state.allAnime = data;
      console.log(`✅ Загружено ${state.allAnime.length} аниме`);
      updateUI(data);
      applyFilters();
    } catch (error) {
      console.error('❌ Ошибка:', error);
      updateStatus('error', '⚠️ Ошибка');
      if (DOM.grid) {
        DOM.grid.innerHTML = `
          <div class="loading-spinner" style="color:#f87171;">
            ❌ Не удалось загрузить данные<br>
            <span style="font-size:0.8rem; color:#6c7b9c;">${error.message}</span>
          </div>`;
      }
    }
    state.isLoading = false;
  }

  // --- ОБНОВЛЕНИЕ UI ---
  function updateUI(data) {
    DOM.apiDot.className = 'api-dot success';
    DOM.apiText.textContent = '✅ Загружено';
    DOM.apiCount.textContent = `📊 ${data.length} аниме`;
    updateStats(data);
    showRandomAnime(data);
    showTopAnime(data);
  }

  function updateStatus(type, text) {
    DOM.apiDot.className = `api-dot ${type}`;
    DOM.apiText.textContent = text;
  }

  // --- СТАТИСТИКА ---
  function updateStats(data) {
    const total = data.length;
    const completed = data.filter(i => i.status === 'completed').length;
    const watching = data.filter(i => i.status === 'watching').length;
    const planned = data.filter(i => i.status === 'planned').length;
    const scores = data.filter(i => i.score > 0).map(i => i.score);
    const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : 0;
    const eps = data.reduce((s,i) => s + (i.anime.episodes || 0), 0);
    DOM.stats.total.textContent = total;
    DOM.stats.completed.textContent = completed;
    DOM.stats.watching.textContent = watching;
    DOM.stats.planned.textContent = planned;
    DOM.stats.avgScore.textContent = avg;
    DOM.stats.totalEpisodes.textContent = eps;
  }

  // --- ФИЛЬТРЫ И СОРТИРОВКА ---
  function applyFilters() {
    let filtered = [...state.allAnime];
    if (state.currentFilter !== 'all') {
      filtered = filtered.filter(i => i.status === state.currentFilter);
    }
    if (state.searchQuery) {
      filtered = filtered.filter(i => {
        const title = (i.anime.russian || i.anime.name || '').toLowerCase();
        return title.includes(state.searchQuery);
      });
    }
    const sortMap = {
      'score-desc': (a,b) => (b.score||0) - (a.score||0),
      'score-asc': (a,b) => (a.score||0) - (b.score||0),
      'name-asc': (a,b) => (a.anime.russian || a.anime.name || '').localeCompare(b.anime.russian || b.anime.name || ''),
      'name-desc': (a,b) => (b.anime.russian || b.anime.name || '').localeCompare(a.anime.russian || a.anime.name || ''),
      'date-desc': (a,b) => new Date(b.created_at) - new Date(a.created_at),
      'date-asc': (a,b) => new Date(a.created_at) - new Date(b.created_at)
    };
    filtered.sort(sortMap[state.currentSort] || sortMap['score-desc']);
    state.filteredAnime = filtered;
    renderAnimeList(filtered);
  }

  // --- ОТРИСОВКА КАРТОЧЕК (ССЫЛКА НА ДЕТАЛЬНУЮ СТРАНИЦУ) ---
  function renderAnimeList(data) {
    if (!DOM.grid) return;
    if (!data || data.length === 0) {
      DOM.grid.innerHTML = '<div class="loading-spinner">📭 Аниме не найдены</div>';
      return;
    }
    const display = data.slice(0, 20);
    DOM.grid.innerHTML = display.map(item => createAnimeCard(item)).join('');
    DOM.loadMore.style.display = data.length > 20 ? 'block' : 'none';
  }

  // ⭐ ГЛАВНОЕ ИЗМЕНЕНИЕ: ссылка на anime-detail.html
  function createAnimeCard(item) {
    const anime = item.anime;
    const title = anime.russian || anime.name || 'Без названия';
    const status = STATUS_MAP[item.status] || item.status || '❓';
    const score = item.score || '—';
    const episodes = anime.episodes || '?';
    const poster = getAnimePoster(anime);
    const genres = (anime.genres || []).slice(0,3).map(g => g.russian || g.name).join(', ');

    // 🔗 Ссылка на детальную страницу сайта
    const detailUrl = `anime-detail.html?id=${item.id}`;

    return `
      <a href="${detailUrl}" class="anime-card-link" title="Открыть подробнее">
        <div class="anime-card">
          <img src="${poster}" alt="${title}" class="anime-poster" loading="lazy" 
               onerror="this.src='${getPlaceholder(title)}'">
          <div class="anime-title">${title}</div>
          <div class="anime-status">${status}</div>
          ${score !== '—' ? `<div class="anime-score">⭐ ${score}</div>` : ''}
          <div class="anime-episodes">${episodes} эп.</div>
          ${genres ? `<div class="anime-genres"><span class="anime-genre">${genres}</span></div>` : ''}
          <div class="anime-link-icon"><i class="fas fa-external-link-alt"></i></div>
        </div>
      </a>
    `;
  }

  // --- СЛУЧАЙНОЕ АНИМЕ ---
  function showRandomAnime(data) {
    if (!DOM.random || !data || data.length === 0) {
      DOM.random.innerHTML = '<div class="loading-spinner">📭 Аниме не найдены</div>';
      return;
    }
    const random = data[Math.floor(Math.random() * data.length)];
    const anime = random.anime;
    const title = anime.russian || anime.name || 'Без названия';
    const poster = getAnimePoster(anime);
    const desc = anime.description || 'Описание отсутствует';
    const status = STATUS_MAP[random.status] || random.status || '❓';
    DOM.random.innerHTML = `
      <div class="random-card">
        <img src="${poster}" alt="${title}" />
        <div class="info">
          <h3>${title}</h3>
          <p>${desc.substring(0, 150)}${desc.length > 150 ? '...' : ''}</p>
          <div class="meta">
            <span>${status}</span>
            ${random.score > 0 ? `<span>⭐ ${random.score}</span>` : ''}
            <span>📺 ${anime.episodes || '?'} эп.</span>
            <span>📅 ${anime.year || '?'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- ТОП-5 ---
  function showTopAnime(data) {
    if (!DOM.top || !data || data.length === 0) {
      DOM.top.innerHTML = '<div class="loading-spinner">📭 Нет оценённых аниме</div>';
      return;
    }
    const top = data.filter(i => i.score > 0).sort((a,b) => b.score - a.score).slice(0,5);
    if (top.length === 0) {
      DOM.top.innerHTML = '<div class="loading-spinner">📭 Нет оценённых аниме</div>';
      return;
    }
    DOM.top.innerHTML = `<div class="top-list">${top.map(item => {
      const anime = item.anime;
      const title = anime.russian || anime.name || 'Без названия';
      const poster = getAnimePoster(anime);
      return `
        <div class="top-card">
          <img src="${poster}" alt="${title}" />
          <div class="info">
            <h3>${title}</h3>
            <div class="meta">
              <span>⭐ ${item.score}</span>
              <span>📺 ${anime.episodes || '?'} эп.</span>
              <span>📅 ${anime.year || '?'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('')}</div>`;
  }

  // --- ЗАГРУЗКА ЕЩЁ ---
  function loadMore() {
    const data = state.filteredAnime;
    const current = DOM.grid.children.length;
    const next = data.slice(current, current + 20);
    if (next.length) {
      next.forEach(item => { DOM.grid.innerHTML += createAnimeCard(item); });
      if (current + 20 >= data.length) DOM.loadMore.style.display = 'none';
    } else {
      DOM.loadMore.style.display = 'none';
    }
  }

  // --- ИНИЦИАЛИЗАЦИЯ ---
  function init() {
    console.log('🌙 Shikimori страница загружена');
    loadFromGitHub();

    DOM.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.status;
        applyFilters();
      });
    });
    DOM.sortSelect.addEventListener('change', () => {
      state.currentSort = DOM.sortSelect.value;
      applyFilters();
    });
    DOM.searchInput.addEventListener('input', () => {
      state.searchQuery = DOM.searchInput.value.toLowerCase();
      applyFilters();
    });
    DOM.loadMoreBtn.addEventListener('click', loadMore);
  }

  document.addEventListener('DOMContentLoaded', init);
  window.loadFromGitHub = loadFromGitHub;
})();
