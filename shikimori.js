// shikimori.js — Полная версия с прямой API интеграцией

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    // 👇👇👇 ТВОЙ НИК НА SHIKIMORI 👇👇👇
    username: 'Miless', // ← ЗАМЕНИ НА СВОЙ НИК!
    // 👆👆👆 ТВОЙ НИК НА SHIKIMORI 👆👆👆
    
    // Прямой API URL (с твоим ником)
    apiUrl: `https://shikimori.io/api/users/Miless/anime_rates?limit=9999`,
    // Альтернативный API (если .io не работает)
    fallbackApiUrl: `https://shikimori.one/api/users/Miless/anime_rates?limit=9999`,
    proxyUrl: 'https://api.allorigins.win/raw?url=',
    perPage: 50,
    maxPages: 10
  };

  // --- СОСТОЯНИЕ ---
  const state = {
    allAnime: [],
    filteredAnime: [],
    currentPage: 1,
    totalPages: 0,
    currentFilter: 'all',
    currentSort: 'score-desc',
    searchQuery: '',
    isLoading: false,
    apiWorking: false,
    apiMethod: 'direct' // 'direct' или 'proxy'
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

  // --- ПРОВЕРКА API ---
  async function checkAPI() {
    if (!DOM.apiDot || !DOM.apiText) return;
    
    DOM.apiText.textContent = '🔄 Проверка списков Shikimori...';
    DOM.apiDot.className = 'api-dot';
    
    try {
      // Пробуем прямой API
      const response = await fetch(CONFIG.apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        DOM.apiDot.className = 'api-dot success';
        DOM.apiText.textContent = '✅ API работает!';
        if (DOM.apiCount) {
          DOM.apiCount.textContent = `📊 ${data.length} аниме`;
        }
        state.apiWorking = true;
        state.apiMethod = 'direct';
        console.log(`✅ API Shikimori: ${data.length} аниме`);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Пробуем через прокси
      DOM.apiDot.className = 'api-dot error';
      DOM.apiText.textContent = '🔄 Пробуем через прокси...';
      
      try {
        const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(CONFIG.fallbackApiUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          const data = await response.json();
          DOM.apiDot.className = 'api-dot success';
          DOM.apiText.textContent = '✅ API через прокси';
          if (DOM.apiCount) {
            DOM.apiCount.textContent = `📊 ${data.length} аниме`;
          }
          state.apiWorking = true;
          state.apiMethod = 'proxy';
          console.log(`✅ API через прокси: ${data.length} аниме`);
          return true;
        }
      } catch (proxyError) {
        DOM.apiDot.className = 'api-dot error';
        DOM.apiText.textContent = '⚠️ API недоступен';
        if (DOM.apiCount) {
          DOM.apiCount.textContent = '❌ ошибка';
        }
        state.apiWorking = false;
        console.error('❌ Ошибка API:', error.message);
        return false;
      }
    }
  }

  // --- ЗАГРУЗКА ДАННЫХ ---
  async function fetchAllAnime() {
    if (state.isLoading) return;
    state.isLoading = true;
    
    if (!DOM.grid) return;
    DOM.grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;">🌙 Загрузка аниме...</div>';

    try {
      const username = CONFIG.username.trim();
      
      if (!username || username === 'Miless') {
        throw new Error('⚠️ ошибка списков на Shikimori...');
      }

      let data = null;

      // Если API работает напрямую
      if (state.apiMethod === 'direct') {
        try {
          const response = await fetch(CONFIG.apiUrl);
          if (response.ok) {
            data = await response.json();
          }
        } catch (e) {
          console.warn('⚠️ Прямой запрос не удался:', e.message);
        }
      }

      // Если прямой не сработал или API через прокси
      if (!data || data.length === 0) {
        try {
          const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(CONFIG.fallbackApiUrl)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            data = await response.json();
            state.apiMethod = 'proxy';
          }
        } catch (e) {
          console.warn('⚠️ Прокси запрос не удался:', e.message);
        }
      }

      if (!data || data.length === 0) {
        throw new Error('📭 Аниме не найдены. Проверь ник или добавь аниме в список');
      }

      state.allAnime = data;
      console.log(`✅ Загружено ${state.allAnime.length} аниме (${state.apiMethod})`);
      
      updateStats(state.allAnime);
      showRandomAnime(state.allAnime);
      showTopAnime(state.allAnime);
      applyFilters();

    } catch (error) {
      console.error('❌ Ошибка:', error);
      if (DOM.grid) {
        DOM.grid.innerHTML = `
          <div class="loading-spinner" style="grid-column:1/-1; color:#f87171;">
            ${error.message}
            <br>
            <span style="font-size:0.8rem; color:#4a5a7a; display:block; margin-top:0.8rem;">
              💡 Ник: "${CONFIG.username}"<br>
              Проверь на <a href="https://shikimori.io/users/${CONFIG.username}" target="_blank" style="color:#f0e6d0;">
                shikimori.io/users/${CONFIG.username}
              </a>
            </span>
          </div>
        `;
      }
    }

    state.isLoading = false;
  }

  // --- СТАТИСТИКА ---
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

  // --- ФИЛЬТРЫ И СОРТИРОВКА ---
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

  // --- ОТРИСОВКА ---
  function renderAnimeList(data) {
    const grid = DOM.grid;
    if (!grid) return;

    if (!data || data.length === 0) {
      grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;">📭 Аниме не найдены</div>';
      return;
    }

    const displayData = data.slice(0, 20);
    state.currentPage = 1;

    grid.innerHTML = displayData.map(item => createAnimeCard(item)).join('');

    if (data.length > 20) {
      if (DOM.loadMore) DOM.loadMore.style.display = 'block';
    } else {
      if (DOM.loadMore) DOM.loadMore.style.display = 'none';
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

  // --- ЗАГРУЗКА ЕЩЁ ---
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

  // --- ПОСТЕР ---
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

  // --- СЛУЧАЙНОЕ АНИМЕ ---
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

  // --- ТОП-5 ПО ОЦЕНКАМ ---
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

  // --- ИНИЦИАЛИЗАЦИЯ ---
  async function init() {
    console.log('🌙 Shikimori страница загружена');
    console.log('📡 API URL:', CONFIG.apiUrl);
    console.log('👤 Ник:', CONFIG.username);
    
    // Проверяем API
    await checkAPI();
    
    // Загружаем аниме
    await fetchAllAnime();

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
    console.log('💡 Команды: window.refreshShikimori() — обновить список');
  }

  // --- ЗАПУСК ---
  document.addEventListener('DOMContentLoaded', init);

  // Экспорт для консоли
  window.refreshShikimori = fetchAllAnime;
  window.checkAPI = checkAPI;
  window.reloadShikimori = function() {
    checkAPI().then(() => fetchAllAnime());
  };

})();
