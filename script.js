// script.js — Полная загрузка всех аниме (с пагинацией)

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    // 👇👇👇 ЗДЕСЬ ЗАМЕНИ НА СВОЙ НИК 👇👇👇
    shikimoriUsername: 'Miless', // ← ЗАМЕНИ НА СВОЙ НИК!
    // 👆👆👆 ЗДЕСЬ ЗАМЕНИ НА СВОЙ НИК 👆👆👆
    
    shikimoriApiUrl: 'https://shikimori.io/api/users',
    // Прокси для обхода CORS
    proxyUrl: 'https://api.allorigins.win/raw?url=',
    perPage: 50, // Количество аниме за один запрос
    updateInterval: 30000,
    clockUpdateInterval: 1000,
    statusCycleInterval: 15000
  };

  // --- СОСТОЯНИЕ ---
  const state = {
    animeList: [],
    isAnimeVisible: false,
    isQRVisible: false,
    isLoading: false,
    totalPages: 0,
    currentPage: 0,
    isAllLoaded: false,
    currentStatus: {
      text: 'В сети',
      activity: '🎮 Играю в Cyberpunk 2077',
      type: 'online',
      emoji: '🟢'
    }
  };

  // --- DOM ЭЛЕМЕНТЫ ---
  const DOM = {};

  // --- ИНИЦИАЛИЗАЦИЯ ---
  function init() {
    // Получаем элементы
    DOM.statusIndicator = document.querySelector('.status-indicator');
    DOM.statusDot = document.querySelector('.status-dot');
    DOM.statusText = document.querySelector('.status-text');
    DOM.statusActivity = document.querySelector('.status-activity');
    DOM.statusBar = document.querySelector('.status-bar');
    DOM.lastUpdate = document.getElementById('last-update');
    DOM.animeContainer = document.getElementById('animeListContainer');
    DOM.animeGrid = document.getElementById('animeGrid');
    DOM.totalAnime = document.getElementById('totalAnime');
    DOM.completedAnime = document.getElementById('completedAnime');
    DOM.watchingAnime = document.getElementById('watchingAnime');
    DOM.plannedAnime = document.getElementById('plannedAnime');
    DOM.qrContainer = document.getElementById('qrContainer');
    DOM.qrCode = document.getElementById('qrCode');
    DOM.showAnimeBtn = document.getElementById('showAnimeBtn');
    DOM.showQRBtn = document.getElementById('showQRBtn');
    DOM.closeQRBtn = document.getElementById('closeQRBtn');

    // Проверяем ник
    if (CONFIG.shikimoriUsername === 'Miless') {
      console.warn('⚠️ ВНИМАНИЕ: Используется ник по умолчанию "Miless"');
      console.warn('💡 Замени его на свой в файле script.js, строка 8');
    }

    // Запускаем системы
    initStatus();
    initClock();
    initButtons();
    initQRCode();

    console.log('✅ Сайт инициализирован');
    console.log(`📌 Ник на Shikimori: ${CONFIG.shikimoriUsername}`);
    console.log('📌 Загрузка всех аниме без ограничений');
  }

  // --- СТАТУС (без изменений) ---
  function initStatus() {
    if (!DOM.statusIndicator) return;
    updateStatus(state.currentStatus);
    
    const demoStatuses = [
      { text: 'В сети', activity: '🎮 Играю в Cyberpunk 2077', type: 'online', emoji: '🟢' },
      { text: 'В сети', activity: '🎧 Слушаю музыку', type: 'online', emoji: '🟢' },
      { text: 'Отошёл', activity: '☕ Пью кофе', type: 'idle', emoji: '🟡' },
      { text: 'В сети', activity: '📺 Смотрю аниме', type: 'online', emoji: '🟢' },
      { text: 'Не беспокоить', activity: '📝 Пишу код', type: 'dnd', emoji: '🔴' },
      { text: 'Отошёл', activity: '🍕 Обедаю', type: 'idle', emoji: '🟡' },
      { text: 'Офлайн', activity: '🌙 Сплю', type: 'offline', emoji: '⚫' }
    ];
    let index = 0;
    setInterval(() => {
      updateStatus(demoStatuses[index % demoStatuses.length]);
      index++;
    }, CONFIG.statusCycleInterval);
  }

  function updateStatus(statusData) {
    if (!DOM.statusIndicator) return;
    state.currentStatus = { ...statusData };
    const { text, activity, type, emoji } = statusData;

    DOM.statusIndicator.className = `status-indicator ${type}`;
    if (DOM.statusText) DOM.statusText.textContent = text;
    if (DOM.statusActivity) DOM.statusActivity.textContent = activity;

    if (DOM.statusDot) {
      if (type === 'offline') {
        DOM.statusDot.style.animation = 'none';
        DOM.statusDot.style.opacity = '0.4';
      } else {
        DOM.statusDot.style.animation = 'pulse 2s infinite';
        DOM.statusDot.style.opacity = '1';
      }
    }

    document.querySelectorAll('.status-badge').forEach(badge => {
      const parent = badge.closest('.link-card');
      if (parent && parent.classList.contains('discord')) {
        badge.textContent = emoji;
      }
    });

    updateLastUpdateTime();
  }

  // --- ЧАСЫ ---
  function initClock() {
    updateClock();
    setInterval(updateClock, CONFIG.clockUpdateInterval);
  }

  function updateClock() {
    if (!DOM.lastUpdate) return;
    const now = new Date();
    DOM.lastUpdate.textContent = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function updateLastUpdateTime() {
    if (!DOM.lastUpdate) return;
    const now = new Date();
    DOM.lastUpdate.textContent = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // --- КНОПКИ ---
  function initButtons() {
    if (DOM.showAnimeBtn) {
      DOM.showAnimeBtn.addEventListener('click', toggleAnimeList);
    }

    if (DOM.showQRBtn) {
      DOM.showQRBtn.addEventListener('click', toggleQR);
    }

    if (DOM.closeQRBtn) {
      DOM.closeQRBtn.addEventListener('click', () => {
        if (DOM.qrContainer) DOM.qrContainer.style.display = 'none';
        state.isQRVisible = false;
        if (DOM.showQRBtn) DOM.showQRBtn.classList.remove('active');
      });
    }

    if (DOM.statusBar) {
      DOM.statusBar.style.cursor = 'pointer';
      DOM.statusBar.addEventListener('click', () => {
        DOM.statusBar.style.transition = 'background 0.3s';
        DOM.statusBar.style.background = 'rgba(255,255,255,0.08)';
        setTimeout(() => {
          DOM.statusBar.style.background = 'rgba(255,255,255,0.03)';
        }, 300);
        const demoStatuses = [
          { text: 'В сети', activity: '🎮 Играю в Cyberpunk 2077', type: 'online', emoji: '🟢' },
          { text: 'В сети', activity: '🎧 Слушаю музыку', type: 'online', emoji: '🟢' },
          { text: 'Отошёл', activity: '☕ Пью кофе', type: 'idle', emoji: '🟡' },
          { text: 'В сети', activity: '📺 Смотрю аниме', type: 'online', emoji: '🟢' }
        ];
        const random = demoStatuses[Math.floor(Math.random() * demoStatuses.length)];
        updateStatus(random);
      });
    }
  }

  // --- АНИМЕ-ЛИСТ (ПОЛНАЯ ЗАГРУЗКА С ПАГИНАЦИЕЙ) ---
  async function fetchAllAnime() {
    if (!DOM.animeGrid) return;
    
    // Сбрасываем состояние
    state.animeList = [];
    state.currentPage = 0;
    state.isAllLoaded = false;
    state.totalPages = 0;
    
    DOM.animeGrid.innerHTML = '<div class="loading-anime">⏳ Загрузка всех аниме...</div>';

    try {
      const username = CONFIG.shikimoriUsername.trim();
      
      if (!username || username === 'Miless') {
        throw new Error('❌ Укажи свой ник на Shikimori в настройках (строка 8)');
      }

      // Сначала получаем общее количество
      const firstPage = await fetchAnimePage(username, 1);
      
      if (!firstPage || firstPage.length === 0) {
        throw new Error('📭 Аниме не найдены. Проверь ник или добавь аниме в список');
      }

      // Получаем общее количество страниц из заголовков
      // Shikimori возвращает пагинацию в заголовках, но через прокси мы её не видим
      // Поэтому загружаем все страницы в цикле
      
      state.animeList = [...firstPage];
      let page = 2;
      let hasMore = true;
      let totalLoaded = firstPage.length;
      
      // Показываем прогресс
      DOM.animeGrid.innerHTML = `<div class="loading-anime">⏳ Загрузка... (${totalLoaded} аниме)</div>`;

      // Загружаем остальные страницы
      while (hasMore && page <= 50) { // Максимум 50 страниц (2500 аниме)
        try {
          const nextPage = await fetchAnimePage(username, page);
          
          if (nextPage && nextPage.length > 0) {
            state.animeList = state.animeList.concat(nextPage);
            totalLoaded += nextPage.length;
            
            // Обновляем прогресс
            DOM.animeGrid.innerHTML = `<div class="loading-anime">⏳ Загрузка... (${totalLoaded} аниме)</div>`;
            
            // Если загрузили меньше, чем запросили — это последняя страница
            if (nextPage.length < CONFIG.perPage) {
              hasMore = false;
            }
            
            page++;
          } else {
            hasMore = false;
          }
        } catch (error) {
          console.warn(`⚠️ Страница ${page} не загрузилась:`, error.message);
          hasMore = false;
        }
      }

      console.log(`✅ Загружено ${state.animeList.length} аниме`);
      
      // Рендерим список
      renderAnimeList(state.animeList);
      updateAnimeStats(state.animeList);

    } catch (error) {
      console.error('❌ Ошибка:', error);
      
      let errorText = error.message;
      if (error.message.includes('прокси') || error.message.includes('cors')) {
        errorText = '❌ Не удалось подключиться к Shikimori. Попробуй позже или используй VPN';
      } else if (error.message.includes('404')) {
        errorText = '❌ Пользователь не найден. Проверь ник на Shikimori (латиница!)';
      }
      
      DOM.animeGrid.innerHTML = `
        <div class="loading-anime" style="grid-column:1/-1; color:#ff6b6b; font-size:0.95rem; padding:1.5rem;">
          ${errorText}
          <br>
          <span style="font-size:0.8rem; color:#8a9bb8; display:block; margin-top:0.8rem;">
            💡 Ник: "${username}"<br>
            Проверь на <a href="https://shikimori.one/users/${username}" target="_blank" style="color:#6b8fc9;">
              shikimori.one/users/${username}
            </a>
          </span>
        </div>
      `;
    }
  }

  // Функция загрузки одной страницы
  async function fetchAnimePage(username, page) {
    const url = `${CONFIG.shikimoriApiUrl}/${username}/anime_rates?limit=${CONFIG.perPage}&page=${page}&order=id_desc`;
    const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(url)}`;
    
    console.log(`🔄 Загрузка страницы ${page}...`);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data || [];
  }

  // --- РЕНДЕРИНГ АНИМЕ ---
  function renderAnimeList(data) {
    if (!DOM.animeGrid) return;
    
    if (!data || data.length === 0) {
      DOM.animeGrid.innerHTML = '<div class="loading-anime">📭 Аниме не найдены</div>';
      return;
    }

    // Показываем все аниме (без ограничений)
    DOM.animeGrid.innerHTML = data.map(item => {
      const anime = item.anime;
      const statusMap = {
        'planned': '📅 В планах',
        'watching': '⏳ Смотрю',
        'completed': '✅ Просмотрено',
        'on_hold': '⏸ В ожидании',
        'dropped': '❌ Брошено'
      };

      const status = statusMap[item.status] || item.status || '❓';
      const score = item.score || '—';
      const episodes = anime.episodes || '?';
      
      let poster = '';
      if (anime.image) {
        poster = anime.image.preview || anime.image.original || '';
      }
      
      const title = anime.russian || anime.name || 'Без названия';

      return `
        <div class="anime-card">
          <img src="${poster}" alt="${title}" class="anime-poster" loading="lazy" 
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22%3E%3Crect fill=%22%231a1f2e%22 width=%22200%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236b8fc9%22 font-size=%2224%22 font-family=%22sans-serif%22%3E${title.charAt(0)}%3C/text%3E%3C/svg%3E'">
          <div class="anime-title">${title}</div>
          <div class="anime-status">${status}</div>
          <div class="anime-score">⭐ ${score}</div>
          <div class="anime-episodes">${episodes} эп.</div>
        </div>
      `;
    }).join('');
  }

  // --- СТАТИСТИКА ---
  function updateAnimeStats(data) {
    if (!data) return;
    
    const total = data.length;
    const completed = data.filter(item => item.status === 'completed').length;
    const watching = data.filter(item => item.status === 'watching').length;
    const planned = data.filter(item => item.status === 'planned').length;

    if (DOM.totalAnime) DOM.totalAnime.textContent = total;
    if (DOM.completedAnime) DOM.completedAnime.textContent = completed;
    if (DOM.watchingAnime) DOM.watchingAnime.textContent = watching;
    if (DOM.plannedAnime) DOM.plannedAnime.textContent = planned;
  }

  // --- ПЕРЕКЛЮЧАТЕЛЬ ---
  function toggleAnimeList() {
    if (!DOM.animeContainer) return;

    state.isAnimeVisible = !state.isAnimeVisible;
    DOM.animeContainer.style.display = state.isAnimeVisible ? 'block' : 'none';
    
    if (DOM.showAnimeBtn) {
      DOM.showAnimeBtn.classList.toggle('active');
    }

    if (state.isQRVisible && DOM.qrContainer) {
      DOM.qrContainer.style.display = 'none';
      state.isQRVisible = false;
      if (DOM.showQRBtn) DOM.showQRBtn.classList.remove('active');
    }

    if (state.isAnimeVisible && state.animeList.length === 0) {
      fetchAllAnime();
    }
  }

  // --- QR-КОД ---
  function initQRCode() {}

  function toggleQR() {
    if (!DOM.qrContainer || !DOM.qrCode) return;

    state.isQRVisible = !state.isQRVisible;
    DOM.qrContainer.style.display = state.isQRVisible ? 'block' : 'none';
    
    if (DOM.showQRBtn) {
      DOM.showQRBtn.classList.toggle('active');
    }

    if (state.isAnimeVisible && DOM.animeContainer) {
      DOM.animeContainer.style.display = 'none';
      state.isAnimeVisible = false;
      if (DOM.showAnimeBtn) DOM.showAnimeBtn.classList.remove('active');
    }

    if (state.isQRVisible && DOM.qrCode.children.length === 0) {
      try {
        const url = window.location.href;
        new QRCode(DOM.qrCode, {
          text: url,
          width: 200,
          height: 200,
          colorDark: '#1a1f2e',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (error) {
        console.error('❌ Ошибка QR:', error);
        DOM.qrCode.innerHTML = '<p style="color:#ff6b6b;">❌ Ошибка QR</p>';
      }
    }
  }

  // --- ЗАПУСК ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Экспорт
  window.refreshAnime = fetchAllAnime;
  window.showAnime = toggleAnimeList;

  console.log('🚀 script.js загружен!');
  console.log('📌 Команды:');
  console.log('  - window.refreshAnime() — обновить все аниме');
  console.log('  - window.showAnime() — открыть/закрыть список');

})();
