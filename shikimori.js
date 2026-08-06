// shikimori.js — Загрузка из JSON-файла

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    // 👇👇👇 ПУТЬ К JSON-ФАЙЛУ 👇👇👇
    jsonFile: 'https://raw.githubusercontent.com/akrifisofficial-a11y/Miless-profile-staff/069b2fd75815fcb096e6cd7ff04496308d18fd71/anime_rates.json',
    // 👆👆👆 ПУТЬ К JSON-ФАЙЛУ 👆👆👆
    
    // Для обновления с API (запасной вариант)
    apiUrl: 'https://shikimori.io/api/users/Miless/anime_rates?limit=9999',
    proxyUrl: 'https://api.allorigins.win/raw?url='
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

  // --- ЗАГРУЗКА ИЗ JSON-ФАЙЛА ---
  async function loadFromJSON() {
    if (state.isLoading) return;
    state.isLoading = true;
    
    if (!DOM.grid) return;
    DOM.grid.innerHTML = '<div class="loading-spinner">📂 Загрузка из JSON...</div>';

    try {
      const response = await fetch(CONFIG.jsonFile);
      
      if (!response.ok) {
        throw new Error(`Не удалось загрузить ${CONFIG.jsonFile} (статус: ${response.status})`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('📭 JSON-файл пуст. Проверь файл anime_rates');
      }

      state.allAnime = data;
      
      console.log(`✅ Загружено ${state.allAnime.length} аниме из JSON`);
      
      if (DOM.apiDot) DOM.apiDot.className = 'api-dot success';
      if (DOM.apiText) DOM.apiText.textContent = '📂 Загружено из JSON';
      if (DOM.apiCount) DOM.apiCount.textContent = `📊 ${data.length} аниме`;
      
      updateStats(state.allAnime);
      showRandomAnime(state.allAnime);
      showTopAnime(state.allAnime);
      applyFilters();

    } catch (error) {
      console.error('❌ Ошибка загрузки JSON:', error);
      if (DOM.apiDot) DOM.apiDot.className = 'api-dot error';
      if (DOM.apiText) DOM.apiText.textContent = '⚠️ Ошибка JSON';
      
      if (DOM.grid) {
        DOM.grid.innerHTML = `
          <div class="loading-spinner" style="grid-column:1/-1; color:#f87171;">
            ❌ ${error.message}
            <br>
            <span style="font-size:0.8rem; color:#4a5a7a; display:block; margin-top:0.8rem;">
              💡 Проверь, что файл <strong>${CONFIG.jsonFile}</strong> существует<br>
              и содержит корректные данные.
            </span>
          </div>
        `;
      }
    }

    state.isLoading = false;
  }

  // --- ЗАГРУЗКА С API (обновление данных) ---
  async function updateFromAPI() {
    if (state.isLoading) return;
    state.isLoading = true;
    
    if (!DOM.grid) return;
    DOM.grid.innerHTML = '<div class="loading-spinner">🌐 Загрузка с API...</div>';

    try {
      const url = `${CONFIG.proxyUrl}${encodeURIComponent(CONFIG.apiUrl)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('📭 Аниме не найдены');
      }

      state.allAnime = data;
      
      console.log(`✅ Загружено ${state.allAnime.length} аниме с API`);
      
      if (DOM.apiDot) DOM.apiDot.className = 'api-dot success';
      if (DOM.apiText) DOM.apiText.textContent = '🌐 Загружено с API';
      if (DOM.apiCount) DOM.apiCount.textContent = `📊 ${data.length} аниме`;
      
      updateStats(state.allAnime);
      showRandomAnime(state.allAnime);
      showTopAnime(state.allAnime);
      applyFilters();

    } catch (error) {
      console.error('❌ Ошибка API:', error);
      if (DOM.apiDot) DOM.apiDot.className = 'api-dot error';
      if (DOM.apiText) DOM.apiText.textContent = '⚠️ Ошибка API';
      
      // Если API не работает — пробуем JSON
      await loadFromJSON();
    }

    state.isLoading = false;
  }

  // --- ОСТАЛЬНЫЕ ФУНКЦИИ ---
  function updateStats(data) {
    if (!data) return;
    
    const total = data.length;
    const completed = data.filter(item => item.status === 'completed').length;
    const watching = data.filter(item => item.status === 'watching').length;
    const planned = data.filter(item => item.status === 'planned').length;
    const scores = data.filter(item => item.score > 0).map(item => item.score);
    const avgScore = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) 
      : 0;
    const totalEpisodes = data.reduce((sum, item) => sum + (item.anime.episodes || 0), 0);

    if (DOM.stats.total) DOM.stats.total.textContent = total;
    if (DOM.stats.completed) DOM.stats.completed.textContent = completed;
    if (DOM.stats.watching) DOM.stats.watching.textContent = watching;
    if (DOM.stats.planned) DOM.stats.planned.textContent = planned;
    if (DOM.stats.avgScore) DOM.stats.avgScore.textContent = avgScore;
    if (DOM.stats.totalEpisodes) DOM.stats.totalEpisodes.textContent = totalEpisodes;
  }

  function applyFilters() {
    let filtered = [...state.allAnime];

    if (state.currentFilter !== 'all') {
      filtered = filtered.filter(item => item.status === state.currentFilter);
    }

    if (state.searchQuery) {
      filtered = filtered.filter(item => {
        const title = (item.anime.russian || item.anime.name || '').toLowerCase();
        return title.includes(state.searchQuery);
      });
    }

    const sortMap = {
      'score-desc': (a, b) => (b.score || 0) - (a.score || 0),
      'score-asc': (a, b) => (a.score || 0) - (b.score || 0),
      'name-asc': (a, b) => (a.anime.russian || a.anime.name || '').localeCompare(b.anime.russian || b.anime.name || ''),
      'name-desc': (a, b) => (b.anime.russian || b.anime.name || '').localeCompare(a.anime.russian || a.anime.name || ''),
      'date-desc': (a, b) => new Date(b.created_at) - new Date(a.created_at),
      'date-asc': (a, b) => new Date(a.created_at) - new Date(b.created_at)
    };

    filtered.sort(sortMap[state.currentSort] || sortMap['score-desc']);

    state.filteredAnime = filtered;
    renderAnimeList(filtered);
  }

  function renderAnimeList(data) {
    const grid = DOM.grid;
    if (!grid) return;

    if (!data || data.length === 0) {
      grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;">📭 Аниме не найдены</div>';
      return;
    }

    const displayData = data.slice(0, 20);
    grid.innerHTML = displayData.map(item => createAnimeCard(item)).join('');

    if (DOM.loadMore) {
      DOM.loadMore.style.display = data.length > 20 ? 'block' : 'none';
    }
  }

  function createAnimeCard(item) {
    const anime = item.anime;
    const status = STATUS_MAP[item.status] || item.status || '❓';
    const score = item.score || '—';
    const episodes = anime.episodes || '?';
    const title = anime.russian || anime.name || 'Без названия';
    const poster = getAnimePoster(anime);
    const genres = (anime.genres || []).slice(0, 3).map(g => g.russian || g.name).join(', ');

    return `
      <div class="anime-card">
        <img src="${poster}" alt="${title}" class="anime-poster" loading="lazy" 
             onerror="this.src='${getAnimePoster(anime, true)}'">
        <div class="anime-title">${title}</div>
        <div class="anime-status">${status}</div>
        ${score !== '—' ? `<div class="anime-score">⭐ ${score}</div>` : ''}
        <div class="anime-episodes">${episodes} эп.</div>
        ${genres ? `<div class="anime-genres"><span class="anime-genre">${genres}</span></div>` : ''}
      </div>
    `;
  }

  function getAnimePoster(anime, isFallback = false) {
    if (!isFallback && anime.image && anime.image.preview) {
      return anime.image.preview;
    }
    
    const title = anime.russian || anime.name || '?';
    const firstChar = title.charAt(0).toUpperCase();
    const colors = ['#6b8fc9', '#f5a623', '#5865f2', '#ff6b9d', '#4ade80', '#f87171'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3Crect fill='%231a1f2e' width='200' height='300'/%3E%3Ccircle cx='100' cy='120' r='50' fill='${color.replace('#', '%23')}' opacity='0.15'/%3E%3Ctext x='100' y='140' text-anchor='middle' dy='.3em' fill='${color.replace('#', '%23')}' font-size='56' font-family='sans-serif' font-weight='bold'%3E${firstChar}%3C/text%3E%3C/svg%3E`;
  }

  function showRandomAnime(data) {
    const container = DOM.random;
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="loading-spinner">📭 Аниме не найдены</div>';
      return;
    }

    const random = data[Math.floor(Math.random() * data.length)];
    const anime = random.anime;
    const title = anime.russian || anime.name || 'Без названия';
    const poster = getAnimePoster(anime);
    const description = anime.description || 'Описание отсутствует';
    const status = STATUS_MAP[random.status] || random.status || '❓';

    container.innerHTML = `
      <div class="random-card">
        <img src="${poster}" alt="${title}" />
        <div class="info">
          <h3>${title}</h3>
          <p>${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
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

  function showTopAnime(data) {
    const container = DOM.top;
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="loading-spinner">📭 Аниме не найдены</div>';
      return;
    }

    const top = data
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (top.length === 0) {
      container.innerHTML = '<div class="loading-spinner">📭 Нет оценённых аниме</div>';
      return;
    }

    container.innerHTML = `
      <div class="top-list">
        ${top.map(item => {
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
        }).join('')}
      </div>
    `;
  }

  function loadMore() {
    const data = state.filteredAnime;
    const currentCount = DOM.grid ? DOM.grid.children.length : 0;
    const nextBatch = data.slice(currentCount, currentCount + 20);

    if (nextBatch.length > 0) {
      if (DOM.grid) {
        nextBatch.forEach(item => {
          DOM.grid.innerHTML += createAnimeCard(item);
        });
      }

      if (currentCount + 20 >= data.length) {
        if (DOM.loadMore) DOM.loadMore.style.display = 'none';
      }
    } else {
      if (DOM.loadMore) DOM.loadMore.style.display = 'none';
    }
  }

  // --- ИНИЦИАЛИЗАЦИЯ ---
  function init() {
    console.log('🌙 Shikimori страница загружена');
    console.log('📂 Загрузка из:', CONFIG.jsonFile);
    
    // Загружаем из JSON
    loadFromJSON();

    // Навешиваем события
    DOM.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.status;
        applyFilters();
      });
    });

    if (DOM.sortSelect) {
      DOM.sortSelect.addEventListener('change', () => {
        state.currentSort = DOM.sortSelect.value;
        applyFilters();
      });
    }

    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', () => {
        state.searchQuery = DOM.searchInput.value.toLowerCase();
        applyFilters();
      });
    }

    if (DOM.loadMoreBtn) {
      DOM.loadMoreBtn.addEventListener('click', loadMore);
    }

    console.log('🌙 shikimori.js загружен!');
  }

  document.addEventListener('DOMContentLoaded', init);

  // Экспорт для консоли
  window.refreshJSON = loadFromJSON;
  window.updateFromAPI = updateFromAPI;

})();
