// shikimori.js — Лунная версия с прямой API интеграцией

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
    apiWorking: false
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
    
    DOM.apiText.textContent = '🔄 Проверка API Shikimori...';
    DOM.apiDot.className = 'api-dot';
    
    try {
      // Пробуем прямой API
      let response = await fetch(CONFIG.apiUrl);
      
      // Если не работает, пробуем через прокси
      if (!response.ok) {
        const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(CONFIG.apiUrl)}`;
        response = await fetch(proxyUrl);
      }
      
      if (response.ok) {
        const data = await response.json();
        DOM.apiDot.className = 'api-dot success';
        DOM.apiText.textContent = `✅ API работает!`;
        if (DOM.apiCount) {
          DOM.apiCount.textContent = `📊 ${data.length} аниме`;
        }
        state.apiWorking = true;
        console.log(`✅ API Shikimori: ${data.length} аниме`);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      DOM.apiDot.className = 'api-dot error';
      DOM.apiText.textContent = '⚠️ API через прокси';
      if (DOM.apiCount) {
        DOM.apiCount.textContent = '🔄 альтернативный режим';
      }
      console.warn('⚠️ Прямой API не работает, пробуем через прокси...');
      
      // Пробуем через прокси с fallback URL
      try {
        const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(CONFIG.fallbackApiUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          DOM.apiDot.className = 'api-dot success';
          DOM.apiText.textContent = '✅ API через прокси';
          state.apiWorking = true;
          console.log('✅ API работает через прокси');
          return true;
        }
      } catch (fallbackError) {
        DOM.apiDot.className = 'api-dot error';
        DOM.apiText.textContent = '⚠️ API недоступен';
        console.error('❌ Ошибка API:', fallbackError.message);
        state.apiWorking = false;
        return false;
      }
    }
  }

  // --- ЗАГРУЗКА ДАННЫХ ---
  async function fetchAllAnime() {
    state.isLoading = true;
    DOM.grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;">🌙 Загрузка аниме...</div>';

    try {
      const username = CONFIG.username.trim();
      
      if (!username || username === 'Miless') {
        throw new Error('⚠️ Вставь свой ник на Shikimori в CONFIG.username');
      }

      // Пробуем прямой запрос
      let data = await fetchAnimeDirect();
      
      // Если не работает, пробуем через прокси
      if (!data || data.length === 0) {
        data = await fetchAnimeProxy(username);
      }
      
      if (!data || data.length === 0) {
        throw new Error('📭 Аниме не найдены. Проверь ник или добавь аниме в список');
      }

      state.allAnime = data;
      console.log(`✅ Загружено ${state.allAnime.length} аниме`);
      
      updateStats(state.allAnime);
      showRandomAnime(state.allAnime);
      showTopAnime(state.allAnime);
      applyFilters();

    } catch (error) {
      console.error('❌ Ошибка:', error);
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

    state.isLoading = false;
  }

  async function fetchAnimeDirect() {
    try {
      const response = await fetch(CONFIG.apiUrl);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Прямой запрос не удался:', error.message);
      return null;
    }
  }

  async function fetchAnimeProxy(username) {
    try {
      const url = `https://shikimori.one/api/users/${username}/anime_rates?limit=9999`;
      const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Прокси запрос не удался:', error.message);
      return null;
    }
  }

  // --- ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений) ---
  // ... (весь остальной код из предыдущей версии)
  // updateStats, applyFilters, renderAnimeList, createAnimeCard, 
  // getAnimePoster, showRandomAnime, showTopAnime, loadMore

  // --- ЗАПУСК ---
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌙 Shikimori страница загружена');
    
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

    DOM.sortSelect.addEventListener('change', () => {
      state.currentSort = DOM.sortSelect.value;
      applyFilters();
    });

    DOM.searchInput.addEventListener('input', () => {
      state.searchQuery = DOM.searchInput.value.toLowerCase();
      applyFilters();
    });

    DOM.loadMoreBtn.addEventListener('click', loadMore);
  });

  // Экспорт для консоли
  window.refreshShikimori = fetchAllAnime;
  window.checkAPI = checkAPI;

  console.log('🌙 shikimori.js загружен!');
  console.log('📡 API URL:', CONFIG.apiUrl);
  console.log('💡 Команды: window.refreshShikimori() — обновить список');

})();
