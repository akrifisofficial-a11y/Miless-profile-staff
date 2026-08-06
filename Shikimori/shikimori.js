// shikimori.js — Полная интеграция с Shikimori API

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    // 👇👇👇 ТВОЙ НИК НА SHIKIMORI 👇👇👇
    username: 'Miless', // ← ЗАМЕНИ НА СВОЙ НИК!
    // 👆👆👆 ТВОЙ НИК НА SHIKIMORI 👆👆👆
    
    apiUrl: 'https://shikimori.one/api/users',
    proxyUrl: 'https://api.allorigins.win/raw?url=',
    perPage: 50,
    maxPages: 10 // Максимум страниц для загрузки
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
    isLoading: false
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
    searchInput: document.getElementById('searchInput')
  };

  // --- ИНИЦИАЛИЗАЦИЯ ---
  function init() {
    console.log('🚀 Shikimori страница загружена');
    
    // Проверяем ник
    if (CONFIG.username === 'Miless') {
      DOM.grid.innerHTML = `
        <div class="loading-spinner" style="grid-column:1/-1; color:#ff6b6b;">
          ⚠️ Вставь свой ник на Shikimori в CONFIG.username
        </div>
      `;
      return;
    }

    // Загружаем данные
    fetchAllAnime();

    // Навешиваем события
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

  // --- ЗАГРУЗКА ДАННЫХ ---
  async function fetchAllAnime() {
    state.isLoading = true;
    DOM.grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;">⏳ Загрузка аниме...</div>';

    try {
      const username = CONFIG.username.trim();
      let allData = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= CONFIG.maxPages) {
        const data = await fetchAnimePage(username, page);
        
        if (data && data.length > 0) {
          allData = allData.concat(data);
          page++;
          // Обновляем прогресс
          DOM.grid.innerHTML = `<div class="loading-spinner" style="grid-column:1/-1;">⏳ Загрузка... (${allData.length} аниме)</div>`;
        } else {
          hasMore = false;
        }
      }

      state.allAnime = allData;
      state.totalPages = page - 1;
      
      console.log(`✅ Загружено ${state.allAnime.length} аниме`);
      
      // Обновляем статистику
      updateStats(state.allAnime);
      
      // Показываем случайное и топ
      showRandomAnime(state.allAnime);
      showTopAnime(state.allAnime);
      
      // Применяем фильтры
      applyFilters();

    } catch (error) {
      console.error('❌ Ошибка:', error);
      DOM.grid.innerHTML = `
        <div class="loading-spinner" style="grid-column:1/-1; color:#ff6b6b;">
          ❌ Не удалось загрузить аниме<br>
          <span style="font-size:0.8rem; color:#8a9bb8;">${error.message}</span>
        </div>
      `;
    }

    state.isLoading = false;
  }

  async function fetchAnimePage(username, page) {
    const url = `${CONFIG.apiUrl}/${username}/anime_rates?limit=${CONFIG.perPage}&page=${page}&order=id_desc`;
    const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  }

  // --- СТАТИСТИКА ---
  function updateStats(data) {
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

    // Фильтр по статусу
    if (state.currentFilter !== 'all') {
      filtered = filtered.filter(item => item.status === state.currentFilter);
    }

    // Поиск
    if (state.searchQuery) {
      filtered = filtered.filter(item => {
        const title = (item.anime.russian || item.anime.name || '').toLowerCase();
        return title.includes(state.searchQuery);
      });
    }

    // Сортировка
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

    // Берём только первые 20 для отображения
    const displayData = data.slice(0, 20);
    state.currentPage = 1;

    grid.innerHTML = displayData.map(item => createAnimeCard(item)).join('');

    // Показываем кнопку "Загрузить ещё"
    if (data.length > 20) {
      DOM.loadMore.style.display = 'block';
    } else {
      DOM.loadMore.style.display = 'none';
    }
  }

  function createAnimeCard(item) {
    const anime = item.anime;
    const statusMap = {
      'planned': '📅 Запланировано',
      'watching': '⏳ Смотрю',
      'completed': '✅ Просмотрено',
      'on_hold': '⏸ Отложено',
      'dropped': '❌ Брошено'
    };

    const status = statusMap[item.status] || item.status || '❓';
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
    const currentCount = DOM.grid.children.length;
    const nextBatch = data.slice(currentCount, currentCount + 20);

    if (nextBatch.length > 0) {
      nextBatch.forEach(item => {
        DOM.grid.innerHTML += createAnimeCard(item);
      });

      if (currentCount + 20 >= data.length) {
        DOM.loadMore.style.display = 'none';
      }
    } else {
      DOM.loadMore.style.display = 'none';
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
    const statusMap = {
      'planned': '📅 В планах',
      'watching': '⏳ Смотрю',
      'completed': '✅ Просмотрено',
      'on_hold': '⏸ Отложено',
      'dropped': '❌ Брошено'
    };

    container.innerHTML = `
      <div class="random-card">
        <img src="${poster}" alt="${title}" />
        <div class="info">
          <h3>${title}</h3>
          <p>${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
          <div class="meta">
            <span>${statusMap[random.status] || random.status}</span>
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

  // --- ЗАПУСК ---
  document.addEventListener('DOMContentLoaded', init);

  console.log('🚀 shikimori.js загружен!');
})();
