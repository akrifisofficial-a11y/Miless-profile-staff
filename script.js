// script.js — Полное управление статусом и аниме-листом

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    shikimoriUsername: 'Miless', // ВСТАВЬ СВОЙ НИК НА SHIKIMORI
    shikimoriApiUrl: 'https://shikimori.one/api/users',
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
      activity: '🎮 Играю в Cyberpunk 2077',
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
    closeQRBtn: null
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
    initAnimeList();
    initQRCode();

    console.log('✅ Сайт инициализирован');
  }

  // --- СТАТУС ---
  function initStatus() {
    if (!DOM.statusIndicator) return;
    updateStatus(state.currentStatus);
    
    if (CONFIG.useRealDiscordAPI) {
      // Реальный Discord (если нужно)
      setInterval(updateRealStatus, CONFIG.updateInterval);
    } else {
      // Демо-режим
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

    // Обновляем бейджи
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
    // Кнопка "Моё аниме"
    if (DOM.showAnimeBtn) {
      DOM.showAnimeBtn.addEventListener('click', toggleAnimeList);
    }

    // Кнопка "QR-код"
    if (DOM.showQRBtn) {
      DOM.showQRBtn.addEventListener('click', toggleQR);
    }

    // Закрыть QR
    if (DOM.closeQRBtn) {
      DOM.closeQRBtn.addEventListener('click', () => {
        if (DOM.qrContainer) DOM.qrContainer.style.display = 'none';
        state.isQRVisible = false;
        if (DOM.showQRBtn) DOM.showQRBtn.classList.remove('active');
      });
    }

    // Клик по статус-бару
    if (DOM.statusBar) {
      DOM.statusBar.style.cursor = 'pointer';
      DOM.statusBar.addEventListener('click', () => {
        // Визуальная обратная связь
        DOM.statusBar.style.transition = 'background 0.3s';
        DOM.statusBar.style.background = 'rgba(255,255,255,0.08)';
        setTimeout(() => {
          DOM.statusBar.style.background = 'rgba(255,255,255,0.03)';
        }, 300);
        // Случайный статус
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

  // --- АНИМЕ-ЛИСТ (Shikimori API) ---
  function initAnimeList() {
    if (!CONFIG.shikimoriUsername || CONFIG.shikimoriUsername === 'Miless') {
      console.warn('⚠️ Вставь свой ник на Shikimori в CONFIG.shikimoriUsername');
      return;
    }
    // Загружаем при первом открытии
  }

  async function fetchAnimeList() {
    if (!DOM.animeGrid) return;
    
    DOM.animeGrid.innerHTML = '<div class="loading-anime">⏳ Загрузка аниме...</div>';

    try {
      const username = CONFIG.shikimoriUsername;
      const response = await fetch(`${CONFIG.shikimoriApiUrl}/${username}/anime_rates?limit=10000000&order=id_desc`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      state.animeList = data;

      renderAnimeList(data);
      updateAnimeStats(data);

    } catch (error) {
      console.error('❌ Ошибка загрузки аниме:', error);
      DOM.animeGrid.innerHTML = `
        <div class="loading-anime" style="grid-column:1/-1; color:#ff6b6b;">
          ❌ Не удалось загрузить список аниме<br>
          <span style="font-size:0.8rem; color:#6c7b9c;">${error.message}</span>
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

    // Берём только первые 20 для скорости
    const limited = data.slice(0, 20);

    DOM.animeGrid.innerHTML = limited.map(item => {
      const anime = item.anime;
      const statusMap = {
        'planned': '📅 В планах',
        'watching': '⏳ Смотрю',
        'completed': '✅ Просмотрено',
        'on_hold': '⏸ В ожидании',
        'dropped': '❌ Брошено'
      };

      const status = statusMap[item.status] || item.status;
      const score = item.score || '—';
      const episodes = anime.episodes || '?';
      const poster = anime.image?.preview || '';

      return `
        <div class="anime-card">
          <img src="${poster}" alt="${anime.russian || anime.name}" class="anime-poster" loading="lazy" 
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22%3E%3Crect fill=%22%231a1f2e%22 width=%22200%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236b8fc9%22 font-size=%2224%22 font-family=%22sans-serif%22%3E${(anime.russian || anime.name).charAt(0)}%3C/text%3E%3C/svg%3E'">
          <div class="anime-title">${anime.russian || anime.name}</div>
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

    // Закрываем QR если открыт
    if (state.isQRVisible && DOM.qrContainer) {
      DOM.qrContainer.style.display = 'none';
      state.isQRVisible = false;
      if (DOM.showQRBtn) DOM.showQRBtn.classList.remove('active');
    }

    // Загружаем аниме при первом открытии
    if (state.isAnimeVisible && state.animeList.length === 0) {
      fetchAnimeList();
    }
  }

  // --- QR-КОД ---
  function initQRCode() {
    // QR создаётся при нажатии
  }

  function toggleQR() {
    if (!DOM.qrContainer || !DOM.qrCode) return;

    state.isQRVisible = !state.isQRVisible;
    DOM.qrContainer.style.display = state.isQRVisible ? 'block' : 'none';
    
    if (DOM.showQRBtn) {
      DOM.showQRBtn.classList.toggle('active');
    }

    // Закрываем аниме если открыто
    if (state.isAnimeVisible && DOM.animeContainer) {
      DOM.animeContainer.style.display = 'none';
      state.isAnimeVisible = false;
      if (DOM.showAnimeBtn) DOM.showAnimeBtn.classList.remove('active');
    }

    // Генерируем QR при первом открытии
    if (state.isQRVisible && DOM.qrCode.children.length === 0) {
      const url = window.location.href;
      new QRCode(DOM.qrCode, {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#1a1f2e',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  // --- ЗАПУСК ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('🚀 script.js загружен!');
  console.log('💡 Нажми "Моё аниме" для просмотра списка');
  console.log('💡 Нажми "QR-код" для генерации');

})();
