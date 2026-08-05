// script.js — Полное управление статусом, аниме-листом, Discord интеграцией и счётчиком дней

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    // 👇👇👇 ЗДЕСЬ ТВОЙ НИК НА SHIKIMORI 👇👇👇
    shikimoriUsername: 'Miless', // ← Убедись, что ник правильный!
    // 👆👆👆 ЗДЕСЬ ТВОЙ НИК НА SHIKIMORI 👆👆👆
    
    // ⚡ ДЛЯ JSON-ФАЙЛА (если используешь)
    jsonDataUrl: 'anime.json',
    
    // Домены для API (можно использовать .io, .one, .me, .org)
    shikimoriApiUrl: 'https://shikimori.one/api/users',
    
    // Прокси для обхода CORS
    proxyUrl: 'https://api.allorigins.win/raw?url=',
    perPage: 50,
    updateInterval: 30000,
    clockUpdateInterval: 1000,
    statusCycleInterval: 15000
  };

  // --- DISCORD КОНФИГУРАЦИЯ ---
  const DISCORD_CONFIG = {
    // 👇👇👇 СЮДА ВСТАВЬ СВОЙ DISCORD ID 👇👇👇
    userId: '1438577441231863842', // ← ЗАМЕНИ НА СВОЙ ID!
    // 👆👆👆 СЮДА ВСТАВЬ СВОЙ DISCORD ID 👆👆👆
    
    apiUrl: 'https://api.lanyard.rest/v1/users/',
    updateInterval: 30000 // Обновление каждые 30 секунд
  };

  // --- СОСТОЯНИЕ ---
  const state = {
    animeList: [],
    isAnimeVisible: false,
    isQRVisible: false,
    isLoading: false,
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

    console.log('✅ DOM элементы получены');

    // Проверяем ник
    if (CONFIG.shikimoriUsername === 'Miless') {
      console.warn('⚠️ ВНИМАНИЕ: Используется ник по умолчанию "Miless"');
      console.warn('💡 Замени его на свой в файле script.js, строка 8');
    }

    // Проверяем Discord ID
    if (DISCORD_CONFIG.userId === '1438577441231863842') {
      console.warn('⚠️ ВНИМАНИЕ: Используется Discord ID по умолчанию');
      console.warn('💡 Замени его на свой в файле script.js, строка 17');
    }

    // Запускаем системы
    console.log('🔄 Запуск систем...');
    initStatus();
    initClock();
    initButtons();
    initQRCode();
    
    // Запускаем счётчик дней
    console.log('🔄 Запуск счётчика дней...');
    calculateShikimoriDays();
    
    // Запускаем Discord интеграцию
    console.log('🔄 Запуск Discord интеграции...');
    initDiscord();

    console.log('✅ Сайт инициализирован');
    console.log(`📌 Ник на Shikimori: ${CONFIG.shikimoriUsername}`);
    console.log(`📌 Discord ID: ${DISCORD_CONFIG.userId}`);
  }

  // --- СТАТУС ---
  function initStatus() {
    if (!DOM.statusIndicator) {
      console.warn('⚠️ Статус-бар не найден');
      return;
    }
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

  // --- АНИМЕ-ЛИСТ (Shikimori API с пагинацией) ---
  async function fetchAllAnime() {
    if (!DOM.animeGrid) return;
    
    state.animeList = [];
    DOM.animeGrid.innerHTML = '<div class="loading-anime">⏳ Загрузка всех аниме...</div>';

    try {
      const username = CONFIG.shikimoriUsername.trim();
      
      if (!username || username === 'Miless') {
        throw new Error('❌ Укажи свой ник на Shikimori в настройках');
      }

      // Загружаем первую страницу
      const firstPage = await fetchAnimePage(username, 1);
      
      if (!firstPage || firstPage.length === 0) {
        throw new Error('📭 Аниме не найдены. Проверь ник или добавь аниме в список');
      }

      state.animeList = [...firstPage];
      let page = 2;
      let hasMore = true;
      let totalLoaded = firstPage.length;
      
      DOM.animeGrid.innerHTML = `<div class="loading-anime">⏳ Загрузка... (${totalLoaded} аниме)</div>`;

      while (hasMore && page <= 50) {
        try {
          const nextPage = await fetchAnimePage(username, page);
          
          if (nextPage && nextPage.length > 0) {
            state.animeList = state.animeList.concat(nextPage);
            totalLoaded += nextPage.length;
            DOM.animeGrid.innerHTML = `<div class="loading-anime">⏳ Загрузка... (${totalLoaded} аниме)</div>`;
            
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
      DOM.animeGrid.innerHTML = `
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

  // --- ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ПОСТЕРА (заглушка) ---
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
    if (!DOM.animeGrid) return;
    
    if (!data || data.length === 0) {
      DOM.animeGrid.innerHTML = '<div class="loading-anime">📭 Аниме не найдены</div>';
      return;
    }

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

  // --- СТАТИСТИКА АНИМЕ ---
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

  // --- ПЕРЕКЛЮЧАТЕЛЬ АНИМЕ ---
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

  // --- ⭐ СЧЁТЧИК "ДНЕЙ НА SHIKIMORI" (ИСПРАВЛЕН) ---
  function calculateShikimoriDays() {
    console.log('🔍 calculateShikimoriDays() вызвана');
    
    const daysValue = document.getElementById('daysValue');
    console.log('🔍 daysValue элемент:', daysValue);
    
    if (!daysValue) {
      console.warn('⚠️ Элемент #daysValue не найден в DOM');
      return;
    }

    // 📅 УСТАНОВИ СВОЮ ДАТУ РЕГИСТРАЦИИ НА SHIKIMORI
    // Формат: new Date(ГОД, МЕСЯЦ-1, ДЕНЬ)
    const registrationDate = new Date(2023, 8, 14); // ← ЗАМЕНИ НА СВОЮ ДАТУ!
    console.log('🔍 Дата регистрации:', registrationDate);

    const now = new Date();
    console.log('🔍 Текущая дата:', now);
    
    const diffTime = now - registrationDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    console.log('🔍 Разница в днях:', diffDays);

    if (diffDays > 0) {
      daysValue.textContent = diffDays;
      console.log(`✅ Счётчик обновлён: ${diffDays} дней`);
    } else {
      daysValue.textContent = '0';
      console.log('✅ Счётчик обновлён: 0 дней');
    }
  }

  // --- ⭐ DISCORD ИНТЕГРАЦИЯ (ИСПРАВЛЕНА) ---
  async function fetchDiscordStatus() {
    try {
      console.log('🔄 Запрос к Discord API...');
      const response = await fetch(`${DISCORD_CONFIG.apiUrl}${DISCORD_CONFIG.userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('API вернул ошибку');
      }
      
      console.log('✅ Discord API ответ получен');
      return data.data;
    } catch (error) {
      console.error('❌ Ошибка Discord API:', error.message);
      return null;
    }
  }

  function updateDiscordUI(status) {
    console.log('🔄 updateDiscordUI() вызвана, статус:', status ? 'есть' : 'нет');
    
    const usernameEl = document.getElementById('discordUsername');
    const activityEl = document.getElementById('discordActivity');
    const onlineDot = document.getElementById('discordOnlineDot');
    const extraEl = document.getElementById('discordExtra');
    const avatarImg = document.getElementById('discordAvatarImg');

    console.log('🔍 discordUsername:', usernameEl);
    console.log('🔍 discordActivity:', activityEl);

    if (!usernameEl || !activityEl) {
      console.warn('⚠️ Discord элементы не найдены в DOM');
      return;
    }

    if (!status) {
      usernameEl.textContent = 'Discord не отвечает';
      activityEl.innerHTML = '<span class="activity-icon">⚠️</span><span class="activity-text">Ошибка подключения</span>';
      if (onlineDot) onlineDot.className = 'discord-online offline';
      if (extraEl) extraEl.style.display = 'none';
      return;
    }

    // Статус
    const statusMap = {
      'online': { class: '', icon: '🟢', text: 'В сети' },
      'idle': { class: 'idle', icon: '🟡', text: 'Отошёл' },
      'dnd': { class: 'dnd', icon: '🔴', text: 'Не беспокоить' },
      'offline': { class: 'offline', icon: '⚫', text: 'Офлайн' }
    };

    const discordStatus = statusMap[status.discord_status] || statusMap.offline;
    
    if (onlineDot) {
      onlineDot.className = `discord-online ${discordStatus.class}`;
    }

    // Имя пользователя
    if (status.discord_user) {
      usernameEl.textContent = status.discord_user.username || 'Пользователь';
    }

    // Активность (игра / Spotify)
    let activityText = discordStatus.text;
    let activityIcon = discordStatus.icon;
    let extraHTML = '';

    if (status.activities && status.activities.length > 0) {
      const game = status.activities[0];
      
      if (game.name && game.type !== 4) {
        activityText = game.name;
        activityIcon = '🎮';
        
        let details = '';
        if (game.details) details = game.details;
        if (game.state) details += ` (${game.state})`;
        
        let gameIcon = '';
        if (game.assets && game.assets.large_image) {
          gameIcon = `https://cdn.discordapp.com/app-assets/${game.application_id}/${game.assets.large_image}.png`;
        }
        
        extraHTML = `
          ${gameIcon ? `<img src="${gameIcon}" class="game-icon" alt="${game.name}" />` : '<i class="fas fa-gamepad"></i>'}
          <div>
            <div class="game-name">${game.name}</div>
            ${details ? `<div class="game-details">${details}</div>` : ''}
          </div>
        `;
      }
    }

    // Проверяем Spotify
    if (status.spotify) {
      const spotify = status.spotify;
      activityText = `${spotify.song} — ${spotify.artist}`;
      activityIcon = '🎵';
      extraHTML = `
        <i class="fab fa-spotify" style="color: #1DB954;"></i>
        <div>
          <div class="game-name">${spotify.song}</div>
          <div class="game-details">${spotify.artist} • ${spotify.album || ''}</div>
        </div>
      `;
    }

    // Обновляем активность
    activityEl.innerHTML = `
      <span class="activity-icon">${activityIcon}</span>
      <span class="activity-text">${activityText}</span>
    `;

    // Обновляем расширенный блок
    if (extraHTML && extraEl) {
      extraEl.style.display = 'flex';
      extraEl.innerHTML = extraHTML;
    } else if (extraEl) {
      extraEl.style.display = 'none';
    }

    // Обновляем аватар (если есть)
    if (status.discord_user && status.discord_user.avatar && avatarImg) {
      const avatarUrl = `https://cdn.discordapp.com/avatars/${status.discord_user.id}/${status.discord_user.avatar}.png?size=64`;
      avatarImg.src = avatarUrl;
      avatarImg.onerror = () => {
        avatarImg.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
      };
    }
    
    console.log('✅ Discord UI обновлена');
  }

  async function refreshDiscordStatus() {
    console.log('🔄 refreshDiscordStatus() вызвана');
    if (DISCORD_CONFIG.userId === '123456789012345678') {
      console.warn('⚠️ Discord ID не настроен');
      const usernameEl = document.getElementById('discordUsername');
      if (usernameEl) {
        usernameEl.textContent = '⚠️ Вставь ID';
      }
      return;
    }
    
    const status = await fetchDiscordStatus();
    updateDiscordUI(status);
  }

  // Запускаем Discord интеграцию
  function initDiscord() {
    console.log('🔄 initDiscord() вызвана');
    if (DISCORD_CONFIG.userId === '123456789012345678') {
      console.warn('⚠️ Вставь свой Discord ID в DISCORD_CONFIG.userId');
      const usernameEl = document.getElementById('discordUsername');
      if (usernameEl) {
        usernameEl.textContent = '⚠️ Вставь ID';
      }
      return;
    }

    // Первое обновление через 1 секунду (ждём загрузку DOM)
    setTimeout(() => {
      refreshDiscordStatus();
    }, 1000);
    
    // Регулярные обновления
    setInterval(refreshDiscordStatus, DISCORD_CONFIG.updateInterval);
  }

  // --- ЗАПУСК ---
  if (document.readyState === 'loading') {
    console.log('⏳ DOM загружается, ждём...');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('✅ DOM уже загружен');
    init();
  }

  // Экспорт для ручного вызова
  window.refreshAnime = fetchAllAnime;
  window.showAnime = toggleAnimeList;
  window.calculateDays = calculateShikimoriDays;
  window.refreshDiscord = refreshDiscordStatus;

  console.log('🚀 script.js загружен!');
  console.log('📌 Команды:');
  console.log('  - window.calculateDays() — обновить счётчик дней');
  console.log('  - window.refreshDiscord() — обновить Discord статус');
  console.log('  - window.refreshAnime() — обновить аниме-лист');

})();
