// shikimori.js — Автоматическая загрузка с Shikimori и GitHub

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    // 👇👇👇 НОВАЯ ССЫЛКА С ID 👇👇👇
    shikimoriApi: 'https://shikimori.io/api/users/1361053/anime_rates?limit=99999',
    // 👆👆👆 НОВАЯ ССЫЛКА С ID 👆👆👆
    
    // Ссылка на GitHub JSON
    githubJsonUrl: 'https://raw.githubusercontent.com/akrifisofficial-a11y/Miless-profile-staff/069b2fd75815fcb096e6cd7ff04496308d18fd71/anime_rates.json',
    proxyUrl: 'https://api.allorigins.win/raw?url='
  };

  // --- СОСТОЯНИЕ ---
  const state = {
    allAnime: [],
    filteredAnime: [],
    currentFilter: 'all',
    currentSort: 'score-desc',
    searchQuery: '',
    isLoading: false,
    dataSource: 'github'
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

  // --- УВЕДОМЛЕНИЯ ---
  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    Object.assign(div.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      borderRadius: '1rem',
      background: 'rgba(10, 14, 30, 0.95)',
      border: `1px solid ${type === 'success' ? 'rgba(74, 222, 128, 0.3)' : type === 'error' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
      color: '#ecefff',
      zIndex: '9999',
      backdropFilter: 'blur(10px)',
      maxWidth: '300px',
      animation: 'slideIn 0.3s ease-out',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
    });
    document.body.appendChild(div);
    
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s';
      setTimeout(() => div.remove(), 500);
    }, 4000);
  }

  // --- ПОЛУЧЕНИЕ ПОСТЕРА (ИСПРАВЛЕНО!) ---
  function getAnimePoster(anime) {
    if (!anime) return getPlaceholderPoster('?');
    
    // Пробуем получить постер
    let posterUrl = null;
    
    // 1. Если есть image.preview
    if (anime.image && anime.image.preview) {
      posterUrl = anime.image.preview;
    }
    // 2. Если есть image.original
    else if (anime.image && anime.image.original) {
      posterUrl = anime.image.original;
    }
    // 3. Если есть просто image (строка)
    else if (typeof anime.image === 'string') {
      posterUrl = anime.image;
    }
    
    // Если постер найден — добавляем базовый URL если нужно
    if (posterUrl) {
      // Если ссылка начинается с / — добавляем домен
      if (posterUrl.startsWith('/')) {
        posterUrl = `https://shikimori.one${posterUrl}`;
      }
      // Если ссылка уже полная — оставляем
      return posterUrl;
    }
    
    // Если постера нет — возвращаем заглушку
    return getPlaceholderPoster(anime.russian || anime.name || '?');
  }

  function getPlaceholderPoster(title) {
    const firstChar = title.charAt(0).toUpperCase();
    const colors = ['#6b8fc9', '#f5a623', '#5865f2', '#ff6b9d', '#4ade80', '#f87171'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3Crect fill='%231a1f2e' width='200' height='300'/%3E%3Ccircle cx='100' cy='120' r='50' fill='${color.replace('#', '%23')}' opacity='0.15'/%3E%3Ctext x='100' y='140' text-anchor='middle' dy='.3em' fill='${color.replace('#', '%23')}' font-size='56' font-family='sans-serif' font-weight='bold'%3E${firstChar}%3C/text%3E%3C/svg%3E`;
  }

  // --- ЗАГРУЗКА ИЗ GITHUB ---
  async function loadFromGitHub() {
    if (state.isLoading) return;
    state.isLoading = true;
    
    if (!DOM.grid) return;
    DOM.grid.innerHTML = '<div class="loading-spinner">📂 Загрузка с GitHub...</div>';

    try {
      const response = await fetch(CONFIG.githubJsonUrl);
      
      if (!response.ok) {
        throw new Error(`GitHub: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('📭 Файл пуст');
      }

      state.allAnime = data;
      state.dataSource = 'github';
      
      console.log(`✅ Загружено ${state.allAnime.length} аниме с GitHub`);
      
      updateUI(data, '📂 GitHub');
      applyFilters();
      showNotification(`✅ Загружено ${data.length} аниме с GitHub`, 'success');

    } catch (error) {
      console.error('❌ Ошибка GitHub:', error);
      updateStatus('error', '⚠️ GitHub');
      
      if (DOM.grid) {
        DOM.grid.innerHTML = `
          <div class="loading-spinner" style="grid-column:1/-1; color:#f87171;">
            ❌ ${error.message}
            <br>
            <span style="font-size:0.8rem; color:#4a5a7a; display:block; margin-top:0.8rem;">
              💡 Проверь ссылку в CONFIG.githubJsonUrl
            </span>
          </div>
        `;
      }
    }

    state.isLoading = false;
  }

  // --- ЗАГРУЗКА С SHIKIMORI API (НОВАЯ ССЫЛКА) ---
  async function loadFromAPI() {
    if (state.isLoading) return;
    state.isLoading = true;
    
    if (!DOM.grid) return;
    DOM.grid.innerHTML = '<div class="loading-spinner">🌐 Загрузка с Shikimori...</div>';

    try {
      // Пробуем напрямую
      let response = await fetch(CONFIG.shikimoriApi);
      
      // Если не работает — через прокси
      if (!response.ok) {
        const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(CONFIG.shikimoriApi)}`;
        response = await fetch(proxyUrl);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('📭 Аниме не найдены');
      }

      state.allAnime = data;
      state.dataSource = 'api';
      
      console.log(`✅ Загружено ${state.allAnime.length} аниме с API`);
      
      updateUI(data, '🌐 Shikimori');
      applyFilters();
      
      showNotification(`✅ Обновлено ${data.length} аниме с Shikimori`, 'success');

    } catch (error) {
      console.error('❌ Ошибка API:', error);
      updateStatus('error', '⚠️ API');
      
      // Пробуем загрузить с GitHub
      await loadFromGitHub();
    }

    state.isLoading = false;
  }

  // --- ОБНОВЛЕНИЕ UI ---
  function updateUI(data, source) {
    if (DOM.apiDot) {
      DOM.apiDot.className = 'api-dot success';
    }
    if (DOM.apiText) {
      DOM.apiText.textContent = `✅ ${source}`;
    }
    if (DOM.apiCount) {
      DOM.apiCount.textContent = `📊 ${data.length} аниме`;
    }
    
    updateStats(data);
    showRandomAnime(data);
    showTopAnime(data);
  }

  function updateStatus(type, text) {
    if (DOM.apiDot) {
      DOM.apiDot.className = `api-dot ${type}`;
    }
    if (DOM.apiText) {
      DOM.apiText.textContent = text;
    }
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
    const poster = getAnimePoster(anime); // ← ИСПРАВЛЕНО!
    const genres = (anime.genres || []).slice(0, 3).map(g => g.russian || g.name).join(', ');

    return `
      <div class="anime-card">
        <img src="${poster}" alt="${title}" class="anime-poster" loading="lazy" 
             onerror="this.src='${getPlaceholderPoster(title)}'">
        <div class="anime-title">${title}</div>
        <div class="anime-status">${status}</div>
        ${score !== '—' ? `<div class="anime-score">⭐ ${score}</div>` : ''}
        <div class="anime-episodes">${episodes} эп.</div>
        ${genres ? `<div class="anime-genres"><span class="anime-genre">${genres}</span></div>` : ''}
      </div>
    `;
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

  // --- ИНИЦИАЛИЗАЦИЯ ---
  function init() {
    console.log('🌙 Shikimori страница загружена');
    console.log('📡 API:', CONFIG.shikimoriApi);
    console.log('📂 GitHub:', CONFIG.githubJsonUrl);
    
    // Загружаем с GitHub
    loadFromGitHub();

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
    console.log('💡 Команды:');
    console.log('  - window.loadFromGitHub() — обновить с GitHub');
    console.log('  - window.loadFromAPI() — обновить с Shikimori API');
  }

  document.addEventListener('DOMContentLoaded', init);

  // Экспорт для консоли и кнопок
  window.loadFromGitHub = loadFromGitHub;
  window.loadFromAPI = loadFromAPI;

})();
