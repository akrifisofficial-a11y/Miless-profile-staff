// script.js — Исправленная версия с прокси для Shikimori API

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    shikimoriUsername: 'Miless', // 👈 ЗАМЕНИ НА СВОЙ НИК (латиницей)
    shikimoriApiUrl: 'https://shikimori.one/api/users',
    // Используем прокси для обхода CORS
    proxyUrl: 'https://api.allorigins.win/raw?url=',
    updateInterval: 30000,
    clockUpdateInterval: 1000,
    statusCycleInterval: 15000,
    useRealDiscordAPI: false
  };

  // --- СОСТОЯНИЕ ---
  const state = {
    animeList: [],
    isAnimeVisible: false,
    isQRVisible: false,
    currentStatus: {
      text: 'В сети',
      activity: '🎮 Играю в GTA',
      type: 'online',
      emoji: '🟢'
    }
  };

  // --- DOM ЭЛЕМЕНТЫ ---
  const DOM = {
    statusIndicator: null,
    statusDot: null,
    statusText: null,
    statusActivity: null,
    statusBar: null,
    lastUpdate: null,
    animeContainer: null,
    animeGrid: null,
    totalAnime: null,
    completedAnime: null,
    watchingAnime: null,
    plannedAnime: null,
    qrContainer: null,
    qrCode: null,
    showAnimeBtn: null,
    showQRBtn: null,
    closeQRBtn: null,
    errorMessage: null
  };

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

    // Запускаем системы
    initStatus();
    initClock();
    initButtons();
    initQRCode();

    // Проверяем ник
    if (CONFIG.shikimoriUsername === 'Miless') {
      console.warn('⚠️ ВНИМАНИЕ: Используется ник по умолчанию "Miless"');
      console.warn('💡 Замени его на свой в CONFIG.shikimoriUsername в файле script.js');
    }

    console.log('✅ Сайт инициализирован');
    console.log(`📌 Ник на Shikimori: ${CONFIG.shikimoriUsername}`);
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

  // --- АНИМЕ-ЛИСТ (Shikimori API с прокси) ---
  async function fetchAnimeList() {
    if (!DOM.animeGrid) return;
    
    DOM.animeGrid.innerHTML = '<div class="loading-anime">⏳ Загрузка аниме...</div>';

    try {
      const username = CONFIG.shikimoriUsername.trim();
      
      if (!username || username === 'Miless') {
        throw new Error('❌ Укажи свой ник на Shikimori в настройках (CONFIG.shikimoriUsername)');
      }

      // Прямой запрос (может не работать из-за CORS)
      const directUrl = `${CONFIG.shikimoriApiUrl}/${username}/anime_rates?limit=99999&order=id_desc`;
      
      // Через прокси (работает всегда)
      const proxyUrl = `${CONFIG.proxyUrl}${encodeURIComponent(directUrl)}`;
      
      console.log('🔄 Загрузка аниме с:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('📭 Аниме не найдены. Проверь ник или добавь аниме в список на Shikimori');
      }

      state.animeList = data;
      renderAnimeList(data);
      updateAnimeStats(data);
      console.log(`✅ Загружено ${data.length} аниме`);

    } catch (error) {
      console.error('❌ Ошибка загрузки аниме:', error);
      
      let errorText = error.message;
      if (error.message.includes('404')) {
        errorText = '❌ Пользователь не найден. Проверь ник на Shikimori (латиница, чувствительно к регистру)';
      } else if (error.message.includes('CORS')) {
        errorText = '❌ Ошибка CORS. Попробуй обновить страницу или используй VPN';
      }
      
      DOM.animeGrid.innerHTML = `
        <div class="loading-anime" style="grid-column:1/-1; color:#ff6b6b; font-size:1rem;">
          ${errorText}
          <br>
          <span style="font-size:0.85rem; color:#8a9bb8; display:block; margin-top:0.5rem;">
            💡 Проверь ник: "${username}"<br>
            Перейди на <a href="https://shikimori.one/users/${username}" target="_blank" style="color:#6b8fc9;">
              https://shikimori.one/users/${username}
            </a>
          </span>
        </div>
      `;
    }
  }

  function renderAnimeList(data) {
    if (!DOM.animeGrid) return;
    
    if (!data || data.length === 0) {
      DOM.animeGrid.innerHTML = '<div class="loading-anime">📭 Аниме не найдены</div>';
      return;
    }

    const limited = data.slice(0, 24);

    DOM.animeGrid.innerHTML = limited.map(item => {
      const anime = item.anime;
      const statusMap = {
        'planned': '📅 В планах',
        'watching': '⏳ Смотрю',
        'completed': '✅ Просмотрено',
        'on_hold': '⏸ В ожидании',
        'dropped': '❌ Брошено'
      };

      const status = statusMap[item.status] || item.status || '❓ Неизвестно';
      const score = item.score || '—';
      const episodes = anime.episodes || '?';
      
      // Берём постер, если есть
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
      fetchAnimeList();
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
        console.error('❌ Ошибка генерации QR:', error);
        DOM.qrCode.innerHTML = '<p style="color:#ff6b6b;">❌ Не удалось создать QR-код</p>';
      }
    }
  }

  // --- ЗАПУСК ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Экспортируем функцию для ручного вызова
  window.refreshAnime = fetchAnimeList;
  window.showAnime = toggleAnimeList;

  console.log('🚀 script.js загружен!');
  console.log('💡 Команды в консоли:');
  console.log('  - window.refreshAnime() — обновить список аниме');
  console.log('  - window.showAnime() — открыть/закрыть аниме-лист');

})();
