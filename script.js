// script.js — Полная версия с принудительной установкой Discord ID

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    // 👇👇👇 ТВОЙ НИК НА SHIKIMORI 👇👇👇
    shikimoriUsername: 'Miless', // ← ЗАМЕНИ НА СВОЙ НИК!
    // 👆👆👆 ТВОЙ НИК НА SHIKIMORI 👆👆👆
    
    jsonDataUrl: 'anime.json',
    shikimoriApiUrl: 'https://shikimori.one/api/users',
    proxyUrl: 'https://api.allorigins.win/raw?url=',
    perPage: 50,
    updateInterval: 30000,
    clockUpdateInterval: 1000,
    statusCycleInterval: 15000
  };

  // --- DISCORD КОНФИГУРАЦИЯ (С ПРИНУДИТЕЛЬНЫМ ID) ---
  const DISCORD_CONFIG = {
    // 👇👇👇 ВСТАВЬ СВОЙ ID (18 ЦИФР) СЮДА 👇👇👇
    userId: '1438577441231863842', // ← ЗАМЕНИ НА СВОЙ ID!
    // 👆👆👆 ВСТАВЬ СВОЙ ID (18 ЦИФР) СЮДА 👆👆👆
    
    apiUrl: 'https://api.lanyard.rest/v1/users/',
    updateInterval: 30000
  };

  // --- ОТЛАДКА (показывает всё на экране) ---
  function debugLog(message, type = 'info') {
    const debug = document.getElementById('debugConsole');
    if (!debug) {
      // Если элемента нет — создаём
      const newDebug = document.createElement('div');
      newDebug.id = 'debugConsole';
      newDebug.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        right: 10px;
        background: rgba(0,0,0,0.95);
        color: #0f0;
        font-size: 11px;
        padding: 10px;
        border-radius: 10px;
        max-height: 150px;
        overflow-y: auto;
        z-index: 99999;
        font-family: monospace;
        display: block;
        border: 2px solid #0f0;
        line-height: 1.4;
        pointer-events: none;
      `;
      document.body.appendChild(newDebug);
      return debugLog(message, type);
    }
    
    const colors = {
      info: '#0f0',
      warn: '#ff0',
      error: '#f44',
      success: '#0f0'
    };
    
    const emojis = {
      info: '📝',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    };
    
    debug.style.display = 'block';
    debug.innerHTML += `<span style="color:${colors[type] || '#0f0'}">${emojis[type] || '📝'} ${message}</span><br>`;
    debug.scrollTop = debug.scrollHeight;
    
    // Оставляем только 30 строк
    const lines = debug.innerHTML.split('<br>');
    if (lines.length > 30) {
      debug.innerHTML = lines.slice(-30).join('<br>');
    }
  }

  // --- ИНИЦИАЛИЗАЦИЯ ---
  function init() {
    debugLog('🚀 Запуск сайта...', 'info');
    
    // ПРИНУДИТЕЛЬНО УСТАНАВЛИВАЕМ ID (на всякий случай)
    // 👇👇👇 ЕСЛИ НЕ РАБОТАЕТ — ВСТАВЬ СВОЙ ID СЮДА 👇👇👇
    DISCORD_CONFIG.userId = '1438577441231863842'; // ← ЕЩЁ РАЗ ВСТАВЬ СВОЙ ID!
    // 👆👆👆 ЕСЛИ НЕ РАБОТАЕТ — ВСТАВЬ СВОЙ ID СЮДА 👆👆👆
    
    // Проверяем элементы Discord
    const usernameEl = document.getElementById('discordUsername');
    const activityEl = document.getElementById('discordActivity');
    const onlineDot = document.getElementById('discordOnlineDot');
    const extraEl = document.getElementById('discordExtra');
    const avatarImg = document.getElementById('discordAvatarImg');

    if (!usernameEl) {
      debugLog('⚠️ Элемент discordUsername не найден в DOM!', 'warn');
      debugLog('💡 Проверь, что в index.html есть блок с id="discordUsername"', 'warn');
    } else {
      debugLog('✅ Элементы Discord найдены', 'success');
    }

    // Проверяем Discord ID
    if (DISCORD_CONFIG.userId === '1438577441231863842') {
      debugLog('⚠️ ВНИМАНИЕ: Вставь свой Discord ID в DISCORD_CONFIG.userId!', 'warn');
      if (usernameEl) {
        usernameEl.textContent = '⚠️ Вставь ID';
      }
    } else {
      debugLog(`📌 Discord ID: ${DISCORD_CONFIG.userId}`, 'info');
      // Запускаем Discord с задержкой
      setTimeout(initDiscord, 1000);
    }
    
    // Запускаем остальные системы
    initStatus();
    initClock();
    calculateShikimoriDays();
    initButtons();
    initQRCode();
    
    debugLog('✅ Сайт инициализирован', 'success');
  }

  // --- СТАТУС ---
  function initStatus() {
    const indicator = document.querySelector('.status-indicator');
    if (!indicator) return;
    
    const statuses = [
      { text: 'В сети', activity: '🎮 Играю в Cyberpunk 2077', type: 'online', emoji: '🟢' },
      { text: 'В сети', activity: '🎧 Слушаю музыку', type: 'online', emoji: '🟢' },
      { text: 'Отошёл', activity: '☕ Пью кофе', type: 'idle', emoji: '🟡' },
      { text: 'В сети', activity: '📺 Смотрю аниме', type: 'online', emoji: '🟢' }
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
    }, 15000);
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
    setInterval(update, 1000);
  }

  // --- СЧЁТЧИК ДНЕЙ ---
  function calculateShikimoriDays() {
    const daysValue = document.getElementById('daysValue');
    if (!daysValue) {
      debugLog('⚠️ Элемент daysValue не найден', 'warn');
      return;
    }

    // 📅 УСТАНОВИ СВОЮ ДАТУ РЕГИСТРАЦИИ
    const registrationDate = new Date(2023, 8, 14); // ← ЗАМЕНИ НА СВОЮ!
    const now = new Date();
    const diffDays = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));

    daysValue.textContent = diffDays > 0 ? diffDays : '0';
    debugLog(`📅 Дней на Shikimori: ${daysValue.textContent}`, 'info');
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

  // --- АНИМЕ-ЛИСТ (УПРОЩЁННЫЙ) ---
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

    if (!isVisible) {
      const grid = document.getElementById('animeGrid');
      if (grid) {
        grid.innerHTML = `
          <div class="loading-anime" style="grid-column:1/-1; text-align:center; color:#6c7b9c; padding:2rem;">
            ⏳ Загрузка аниме...<br>
            <span style="font-size:0.8rem;">(функция временно упрощена)</span>
          </div>
        `;
      }
    }
  }

  // --- DISCORD ИНТЕГРАЦИЯ (С ПРИНУДИТЕЛЬНЫМ ID) ---
  async function fetchDiscordStatus() {
    debugLog('🔄 Запрос к Discord API...', 'info');
    
    try {
      // ПРИНУДИТЕЛЬНО УСТАНАВЛИВАЕМ ID (ещё раз)
      DISCORD_CONFIG.userId = '1438577441231863842'; // ← ВСТАВЬ СВОЙ ID!
      
      if (DISCORD_CONFIG.userId === '1438577441231863842') {
        throw new Error('ID не установлен');
      }

      const url = `${DISCORD_CONFIG.apiUrl}${DISCORD_CONFIG.userId}`;
      debugLog(`📡 URL: ${url}`, 'info');
      
      const response = await fetch(url);
      debugLog(`📡 Статус ответа: ${response.status}`, 'info');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('API вернул ошибку');
      }
      
      debugLog(`✅ Данные получены!`, 'success');
      return data.data;
    } catch (error) {
      debugLog(`❌ Ошибка: ${error.message}`, 'error');
      return null;
    }
  }

  function updateDiscordUI(status) {
    debugLog('🔄 Обновление UI Discord...', 'info');
    
    // Находим элементы
    const usernameEl = document.getElementById('discordUsername');
    const activityEl = document.getElementById('discordActivity');
    const onlineDot = document.getElementById('discordOnlineDot');
    const extraEl = document.getElementById('discordExtra');
    const avatarImg = document.getElementById('discordAvatarImg');

    // Проверяем элементы
    if (!usernameEl) {
      debugLog('❌ Элемент discordUsername не найден!', 'error');
      return;
    }

    // Если статус не получен
    if (!status) {
      debugLog('⚠️ Статус не получен', 'warn');
      usernameEl.textContent = 'Discord не отвечает';
      if (activityEl) {
        activityEl.innerHTML = '<span class="activity-icon">⚠️</span><span class="activity-text">Ошибка подключения</span>';
      }
      if (onlineDot) onlineDot.className = 'discord-online offline';
      if (extraEl) extraEl.style.display = 'none';
      return;
    }

    // Маппинг статусов
    const statusMap = {
      'online': { class: '', icon: '🟢', text: 'В сети' },
      'idle': { class: 'idle', icon: '🟡', text: 'Отошёл' },
      'dnd': { class: 'dnd', icon: '🔴', text: 'Не беспокоить' },
      'offline': { class: 'offline', icon: '⚫', text: 'Офлайн' }
    };

    const discordStatus = statusMap[status.discord_status] || statusMap.offline;
    debugLog(`📌 Статус: ${discordStatus.text}`, 'info');
    
    // Обновляем точку
    if (onlineDot) {
      onlineDot.className = `discord-online ${discordStatus.class}`;
    }

    // Обновляем имя
    if (status.discord_user) {
      usernameEl.textContent = status.discord_user.username || 'Пользователь';
      debugLog(`📌 Имя: ${usernameEl.textContent}`, 'info');
    }

    // Определяем активность
    let activityText = discordStatus.text;
    let activityIcon = discordStatus.icon;
    let extraHTML = '';

    // Проверяем игры
    if (status.activities && status.activities.length > 0) {
      const game = status.activities[0];
      
      if (game.name && game.type !== 4) {
        activityText = game.name;
        activityIcon = '🎮';
        debugLog(`🎮 Игра: ${game.name}`, 'info');
        
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
      debugLog(`🎵 Spotify: ${spotify.song}`, 'info');
      extraHTML = `
        <i class="fab fa-spotify" style="color: #1DB954;"></i>
        <div>
          <div class="game-name">${spotify.song}</div>
          <div class="game-details">${spotify.artist} • ${spotify.album || ''}</div>
        </div>
      `;
    }

    // Обновляем активность
    if (activityEl) {
      activityEl.innerHTML = `
        <span class="activity-icon">${activityIcon}</span>
        <span class="activity-text">${activityText}</span>
      `;
    }

    // Обновляем расширенный блок
    if (extraEl) {
      if (extraHTML) {
        extraEl.style.display = 'flex';
        extraEl.innerHTML = extraHTML;
      } else {
        extraEl.style.display = 'none';
      }
    }

    // Обновляем аватар
    if (status.discord_user && status.discord_user.avatar && avatarImg) {
      const avatarUrl = `https://cdn.discordapp.com/avatars/${status.discord_user.id}/${status.discord_user.avatar}.png?size=64`;
      avatarImg.src = avatarUrl;
      avatarImg.onerror = () => {
        avatarImg.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
      };
    }

    debugLog('✅ Discord UI обновлён!', 'success');
  }

  async function refreshDiscordStatus() {
    debugLog('🔄 Обновление Discord статуса...', 'info');
    const status = await fetchDiscordStatus();
    updateDiscordUI(status);
  }

  function initDiscord() {
    debugLog('🎮 Запуск Discord интеграции...', 'info');
    
    // ПРИНУДИТЕЛЬНО УСТАНАВЛИВАЕМ ID
    DISCORD_CONFIG.userId = '1438577441231863842'; // ← ВСТАВЬ СВОЙ ID СЮДА!
    
    if (DISCORD_CONFIG.userId === '1438577441231863842') {
      debugLog('⚠️ Вставь свой Discord ID в DISCORD_CONFIG.userId', 'warn');
      const usernameEl = document.getElementById('discordUsername');
      if (usernameEl) {
        usernameEl.textContent = '⚠️ Вставь ID';
      }
      return;
    }

    // Первое обновление
    refreshDiscordStatus();
    
    // Регулярные обновления
    setInterval(refreshDiscordStatus, DISCORD_CONFIG.updateInterval);
    
    debugLog('✅ Discord интеграция запущена!', 'success');
  }

  // --- ЗАПУСК ---
  document.addEventListener('DOMContentLoaded', function() {
    // Ждём полной загрузки
    setTimeout(init, 500);
  });

  // Экспорт для консоли
  window.refreshDiscord = refreshDiscordStatus;
  window.debugDiscord = function() {
    console.log('Discord Config:', DISCORD_CONFIG);
    console.log('Elements:');
    console.log('  discordUsername:', document.getElementById('discordUsername'));
    console.log('  discordActivity:', document.getElementById('discordActivity'));
    console.log('  discordOnlineDot:', document.getElementById('discordOnlineDot'));
    console.log('  discordExtra:', document.getElementById('discordExtra'));
    console.log('  discordAvatarImg:', document.getElementById('discordAvatarImg'));
    refreshDiscordStatus();
  };

  console.log('🚀 script.js загружен!');
  console.log('💡 Команды в консоли:');
  console.log('  - window.debugDiscord() — проверить Discord интеграцию');
  console.log('  - window.refreshDiscord() — обновить статус');
})();
