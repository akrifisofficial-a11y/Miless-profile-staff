// script.js — Чистая версия без Discord и отладки

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    shikimoriUsername: 'Miless', // ← ЗАМЕНИ НА СВОЙ НИК!
    shikimoriApiUrl: 'https://shikimori.one/api/users',
    proxyUrl: 'https://api.allorigins.win/raw?url=',
    perPage: 50,
    clockUpdateInterval: 1000,
    statusCycleInterval: 15000
  };

  // --- СОСТОЯНИЕ ---
  const state = {
    animeList: [],
    isAnimeVisible: false,
    isQRVisible: false
  };

  // --- ИНИЦИАЛИЗАЦИЯ ---
  function init() {
    console.log('🚀 Сайт запущен');
    
    // Запускаем системы
    initStatus();
    initClock();
    initButtons();
    initQRCode();
    calculateShikimoriDays();
    
    console.log('✅ Сайт инициализирован');
  }

  // --- СТАТУС ---
  function initStatus() {
    const indicator = document.querySelector('.status-indicator');
    if (!indicator) return;
    
    const statuses = [
      { text: 'В сети', activity: '🎮 Играю в Cyberpunk 2077', type: 'online' },
      { text: 'В сети', activity: '🎧 Слушаю музыку', type: 'online' },
      { text: 'Отошёл', activity: '☕ Пью кофе', type: 'idle' },
      { text: 'В сети', activity: '📺 Смотрю аниме', type: 'online' },
      { text: 'Не беспокоить', activity: '📝 Пишу код', type: 'dnd' },
      { text: 'Отошёл', activity: '🍕 Обедаю', type: 'idle' },
      { text: 'Офлайн', activity: '🌙 Сплю', type: 'offline' }
    ];
    
    let index = 0;
    setInterval(() => {
      const status = statuses[index % statuses.length];
      const textEl = document.querySelector('.status-text');
      const activityEl = document.querySelector('.status-activity');
      const dotEl = document.querySelector('.status-dot');
      
      if (textEl) textEl.textContent = status.text;
      if (activityEl) activityEl.textContent = status.activity;
      if (dotEl) {
        dotEl.style.animation = status.type === 'offline' ? 'none' : 'pulse 2s infinite';
        dotEl.style.opacity = status.type === 'offline' ? '0.4' : '1';
      }
      if (indicator) indicator.className = `status-indicator ${status.type}`;
      index++;
    }, CONFIG.statusCycleInterval);
  }

  // --- ЧАСЫ ---
  function initClock() {
    const updateEl = document.getElementById('last-update');
    if (!updateEl) return;
    
    function update() {
      const now = new Date();
      updateEl.textContent = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    update();
    setInterval(update, CONFIG.clockUpdateInterval);
  }

  // --- СЧЁТЧИК ДНЕЙ ---
  function calculateShikimoriDays() {
    const daysValue = document.getElementById('daysValue');
    if (!daysValue) return;

    // 📅 УСТАНОВИ СВОЮ ДАТУ РЕГИСТРАЦИИ
    const registrationDate = new Date(2023, 8, 14); // ← ЗАМЕНИ НА СВОЮ!
    const now = new Date();
    const diffDays = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));

    daysValue.textContent = diffDays > 0 ? diffDays : '0';
  }

  // --- КНОПКИ ---
  function initButtons() {
    const showAnimeBtn = document.getElementById('showAnimeBtn');
    const showQRBtn = document.getElementById('showQRBtn');
    const closeQRBtn = document.getElementById('closeQRBtn');
    const statusBar = document.querySelector('.status-bar');

    if (showAnimeBtn) {
      showAnimeBtn.addEventListener('click', toggleAnimeList);
    }

    if (showQRBtn) {
      showQRBtn.addEventListener('click', toggleQR);
    }

    if (closeQRBtn) {
      closeQRBtn.addEventListener('click', () => {
        const qrContainer = document.getElementById('qrContainer');
        if (qrContainer) qrContainer.style.display = 'none';
        if (showQRBtn) showQRBtn.classList.remove('active');
      });
    }

    if (statusBar) {
      statusBar.style.cursor = 'pointer';
      statusBar.addEventListener('click', () => {
        statusBar.style.transition = 'background 0.3s';
        statusBar.style.background = 'rgba(255,255,255,0.08)';
        setTimeout(() => {
          statusBar.style.background = 'rgba(255,255,255,0.03)';
        }, 300);
      });
    }
  }

  // --- QR-КОД ---
  function initQRCode() {}

  function toggleQR() {
    const qrContainer = document.getElementById('qrContainer');
    const qrCode = document.getElementById('qrCode');
    const showQRBtn = document.getElementById('showQRBtn');
    const animeContainer = document.getElementById('animeListContainer');
    const showAnimeBtn = document.getElementById('showAnimeBtn');

    if (!qrContainer || !qrCode) return;

    const isVisible = qrContainer.style.display !== 'none';
    qrContainer.style.display = isVisible ? 'none' : 'block';
    if (showQRBtn) showQRBtn.classList.toggle('active');

    if (animeContainer && animeContainer.style.display !== 'none') {
      animeContainer.style.display = 'none';
      if (showAnimeBtn) showAnimeBtn.classList.remove('active');
    }

    if (!isVisible && qrCode.children.length === 0) {
      try {
        const url = window.location.href;
        new QRCode(qrCode, {
          text: url,
          width: 200,
          height: 200,
          colorDark: '#1a1f2e',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (error) {
        console.error('❌ Ошибка QR:', error);
        qrCode.innerHTML = '<p style="color:#ff6b6b;">❌ Ошибка QR</p>';
      }
    }
  }

  // --- АНИМЕ-ЛИСТ (ПОЛНАЯ ЗАГРУЗКА) ---
  async function fetchAllAnime() {
    const grid = document.getElementById('animeGrid');
    if (!grid) return;
    
    state.animeList = [];
    grid.innerHTML = '<div class="loading-anime">⏳ Загрузка всех аниме...</div>';

    try {
      const username = CONFIG.shikimoriUsername.trim();
      
      if (!username || username === 'Miless') {
        throw new Error('❌ Укажи свой ник на Shikimori в настройках');
      }

      const firstPage = await fetchAnimePage(username, 1);
      
      if (!firstPage || firstPage.length === 0) {
        throw new Error('📭 Аниме не найдены. Проверь ник или добавь аниме в список');
      }

      state.animeList = [...firstPage];
      let page = 2;
      let hasMore = true;
      let totalLoaded = firstPage.length;
      
      grid.innerHTML = `<div class="loading-anime">⏳ Загрузка... (${totalLoaded} аниме)</div>`;

      while (hasMore && page <= 50) {
        try {
          const nextPage = await fetchAnimePage(username, page);
          
          if (nextPage && nextPage.length > 0) {
            state.animeList = state.animeList.concat(nextPage);
            totalLoaded += nextPage.length;
            grid.innerHTML = `<div class="loading-anime">⏳ Загрузка... (${totalLoaded} аниме)</div>`;
            
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
      renderAnimeList(state.animeList);
      updateAnimeStats(state.animeList);

    } catch (error) {
      console.error('❌ Ошибка:', error);
      grid.innerHTML = `
        <div class="loading-anime" style="grid-column:1/-1; color:#ff6b6b; font-size:0.95rem; padding:1.5rem;">
          ${error.message}
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

  // --- ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ПОСТЕРА ---
  function getAnimePoster(anime) {
    if (anime.image && anime.image.preview) {
      return anime.image.preview;
    }
    
    const title = anime.russian || anime.name || '?';
    const firstChar = title.charAt(0).toUpperCase();
    const colors = ['#6b8fc9', '#f5a623', '#5865f2', '#ff6b9d', '#4ade80', '#f87171'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3Crect fill='%231a1f2e' width='200' height='300'/%3E%3Ccircle cx='100' cy='120' r='50' fill='${color.replace('#', '%23')}' opacity='0.15'/%3E%3Ctext x='100' y='140' text-anchor='middle' dy='.3em' fill='${color.replace('#', '%23')}' font-size='56' font-family='sans-serif' font-weight='bold'%3E${firstChar}%3C/text%3E%3C/svg%3E`;
  }

  // --- РЕНДЕРИНГ АНИМЕ ---
  function renderAnimeList(data) {
    const grid = document.getElementById('animeGrid');
    if (!grid) return;
    
    if (!data || data.length === 0) {
      grid.innerHTML = '<div class="loading-anime">📭 Аниме не найдены</div>';
      return;
    }

    grid.innerHTML = data.map(item => {
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
      const title = anime.russian || anime.name || 'Без названия';
      const poster = getAnimePoster(anime);

      return `
        <div class="anime-card">
          <img src="${poster}" alt="${title}" class="anime-poster" loading="lazy" 
               onerror="this.src='${getAnimePoster(anime)}'">
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

    const totalEl = document.getElementById('totalAnime');
    const completedEl = document.getElementById('completedAnime');
    const watchingEl = document.getElementById('watchingAnime');
    const plannedEl = document.getElementById('plannedAnime');

    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (watchingEl) watchingEl.textContent = watching;
    if (plannedEl) plannedEl.textContent = planned;
  }

  // --- ПЕРЕКЛЮЧАТЕЛЬ АНИМЕ ---
  function toggleAnimeList() {
    const animeContainer = document.getElementById('animeListContainer');
    const showAnimeBtn = document.getElementById('showAnimeBtn');
    const qrContainer = document.getElementById('qrContainer');
    const showQRBtn = document.getElementById('showQRBtn');

    if (!animeContainer) return;

    const isVisible = animeContainer.style.display !== 'none';
    animeContainer.style.display = isVisible ? 'none' : 'block';
    if (showAnimeBtn) showAnimeBtn.classList.toggle('active');

    if (qrContainer && qrContainer.style.display !== 'none') {
      qrContainer.style.display = 'none';
      if (showQRBtn) showQRBtn.classList.remove('active');
    }

    if (!isVisible && state.animeList.length === 0) {
      fetchAllAnime();
    }
  }

  // --- ЗАПУСК ---
  document.addEventListener('DOMContentLoaded', init);

  // Экспорт для консоли
  window.refreshAnime = fetchAllAnime;
  window.showAnime = toggleAnimeList;

  console.log('🚀 Сайт готов!');
  console.log('💡 Команды:');
  console.log('  - window.refreshAnime() — обновить аниме-лист');
  console.log('  - window.showAnime() — открыть/закрыть список');
})();
