// script.js — Полное управление статусом и обновлениями

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ ---
  const CONFIG = {
    updateInterval: 30000,      // Обновление статуса каждые 30 секунд
    clockUpdateInterval: 1000,  // Обновление часов каждую секунду
    statusCycleInterval: 15000, // Смена демо-статуса (если нет API)
    useRealDiscordAPI: false,   // true = реальный Discord, false = демо-режим
    discordUserId: '1438577441231863842' // ВСТАВЬТЕ СВОЙ ID
  };

  // --- СОСТОЯНИЕ СТАТУСА ---
  const statusState = {
    current: {
      text: 'В сети',
      activity: '🎮 Играю в Cyberpunk 2077',
      type: 'online', // online, idle, dnd, offline
      emoji: '🟢'
    },
    history: [], // История статусов
    isReal: false
  };

  // --- DOM ЭЛЕМЕНТЫ (кешируем для производительности) ---
  const DOM = {
    statusIndicator: null,
    statusDot: null,
    statusText: null,
    statusActivity: null,
    statusBar: null,
    lastUpdate: null,
    badges: null
  };

  // --- ИНИЦИАЛИЗАЦИЯ ---
  function init() {
    // Получаем все элементы DOM
    DOM.statusIndicator = document.querySelector('.status-indicator');
    DOM.statusDot = document.querySelector('.status-dot');
    DOM.statusText = document.querySelector('.status-text');
    DOM.statusActivity = document.querySelector('.status-activity');
    DOM.statusBar = document.querySelector('.status-bar');
    DOM.lastUpdate = document.getElementById('last-update');
    DOM.badges = document.querySelectorAll('.status-badge');

    if (!DOM.statusIndicator) {
      console.warn('⚠️ Элементы статуса не найдены в DOM');
      return;
    }

    // Запускаем все системы
    if (CONFIG.useRealDiscordAPI) {
      initRealDiscordStatus();
    } else {
      initDemoStatus();
    }

    initClock();
    initStatusBarClick();
    initKeyboardShortcuts();

    console.log('✅ Статус-система инициализирована');
    console.log(`📊 Режим: ${CONFIG.useRealDiscordAPI ? 'Реальный Discord API' : 'Демо-режим'}`);
  }

  // --- 1. ОБНОВЛЕНИЕ СТАТУСА (ГЛАВНАЯ ФУНКЦИЯ) ---
  function updateStatus(statusData) {
    if (!DOM.statusIndicator) return;

    // Обновляем данные
    if (statusData) {
      statusState.current = { ...statusData };
    }

    const { text, activity, type, emoji } = statusState.current;

    // Обновляем классы и внешний вид
    DOM.statusIndicator.className = `status-indicator ${type}`;
    
    if (DOM.statusText) DOM.statusText.textContent = text;
    if (DOM.statusActivity) DOM.statusActivity.textContent = activity;

    // Управляем анимацией точки
    if (DOM.statusDot) {
      if (type === 'offline') {
        DOM.statusDot.style.animation = 'none';
        DOM.statusDot.style.opacity = '0.4';
      } else {
        DOM.statusDot.style.animation = 'pulse 2s infinite';
        DOM.statusDot.style.opacity = '1';
      }
    }

    // Обновляем бейджи на карточках
    if (DOM.badges && emoji) {
      DOM.badges.forEach(badge => {
        // Обновляем только бейдж Discord (если есть)
        const parent = badge.closest('.link-card');
        if (parent && parent.classList.contains('discord')) {
          badge.textContent = emoji;
        }
      });
    }

    // Добавляем в историю
    addToHistory(text, activity, type);

    // Обновляем время последнего изменения
    updateLastUpdateTime();
  }

  // --- 2. РЕАЛЬНЫЙ DISCORD СТАТУС (ЧЕРЕЗ API) ---
  async function getRealDiscordStatus() {
    try {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discordUserId}`);
      const data = await response.json();
      
      if (!data.success) {
        console.warn('❌ Не удалось получить статус Discord');
        return null;
      }

      const status = data.data;
      
      const statusMap = {
        'online': { text: 'В сети', emoji: '🟢', type: 'online' },
        'idle': { text: 'Отошёл', emoji: '🟡', type: 'idle' },
        'dnd': { text: 'Не беспокоить', emoji: '🔴', type: 'dnd' },
        'offline': { text: 'Офлайн', emoji: '⚫', type: 'offline' }
      };

      const discordStatus = statusMap[status.discord_status] || statusMap.offline;
      
      let activity = 'Ничего не делаю';
      if (status.activities && status.activities.length > 0) {
        const game = status.activities[0];
        if (game.name) {
          activity = `🎮 ${game.name}`;
          if (game.details) {
            activity += ` — ${game.details}`;
          }
          if (game.state) {
            activity += ` (${game.state})`;
          }
        }
      }

      return {
        text: discordStatus.text,
        activity: activity,
        type: discordStatus.type,
        emoji: discordStatus.emoji
      };
    } catch (error) {
      console.error('❌ Ошибка получения Discord статуса:', error);
      return null;
    }
  }

  async function updateRealStatus() {
    const status = await getRealDiscordStatus();
    if (status) {
      statusState.isReal = true;
      updateStatus(status);
    } else {
      // Если не удалось получить статус - показываем ошибку
      updateStatus({
        text: 'Ошибка',
        activity: '🔄 Не удалось подключиться',
        type: 'offline',
        emoji: '⚠️'
      });
    }
  }

  function initRealDiscordStatus() {
    // Проверяем, что ID вставлен
    if (CONFIG.discordUserId === '123456789012345678') {
      console.warn('⚠️ Вставьте свой Discord ID в CONFIG.discordUserId');
    }

    // Первое обновление
    updateRealStatus();
    
    // Регулярные обновления
    setInterval(updateRealStatus, CONFIG.updateInterval);
  }

  // --- 3. ДЕМО-РЕЖИМ (ДЛЯ ТЕСТИРОВАНИЯ) ---
  const demoStatuses = [
    { text: 'В сети', activity: '🎮 Играю в Cyberpunk 2077', type: 'online', emoji: '🟢' },
    { text: 'В сети', activity: '🎧 Слушаю музыку', type: 'online', emoji: '🟢' },
    { text: 'Отошёл', activity: '☕ Пью кофе', type: 'idle', emoji: '🟡' },
    { text: 'В сети', activity: '📺 Смотрю аниме', type: 'online', emoji: '🟢' },
    { text: 'Не беспокоить', activity: '📝 Пишу код', type: 'dnd', emoji: '🔴' },
    { text: 'В сети', activity: '💬 Общаюсь в Discord', type: 'online', emoji: '🟢' },
    { text: 'Отошёл', activity: '🍕 Обедаю', type: 'idle', emoji: '🟡' },
    { text: 'Офлайн', activity: '🌙 Сплю', type: 'offline', emoji: '⚫' }
  ];

  let demoIndex = 0;

  function cycleDemoStatus() {
    const status = demoStatuses[demoIndex % demoStatuses.length];
    statusState.isReal = false;
    updateStatus(status);
    demoIndex++;
  }

  function initDemoStatus() {
    // Первый статус
    cycleDemoStatus();
    
    // Регулярная смена
    setInterval(cycleDemoStatus, CONFIG.statusCycleInterval);
  }

  // --- 4. ИСТОРИЯ СТАТУСОВ ---
  function addToHistory(text, activity, type) {
    const entry = {
      timestamp: new Date().toISOString(),
      text,
      activity,
      type
    };
    statusState.history.push(entry);
    
    // Храним только последние 50 записей
    if (statusState.history.length > 50) {
      statusState.history.shift();
    }
  }

  function getStatusHistory() {
    return statusState.history;
  }

  // --- 5. ЧАСЫ ---
  function updateClock() {
    if (!DOM.lastUpdate) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    DOM.lastUpdate.textContent = timeStr;
  }

  function updateLastUpdateTime() {
    if (!DOM.lastUpdate) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    DOM.lastUpdate.textContent = timeStr;
  }

  function initClock() {
    updateClock();
    setInterval(updateClock, CONFIG.clockUpdateInterval);
  }

  // --- 6. ВЗАИМОДЕЙСТВИЕ С ПОЛЬЗОВАТЕЛЕМ ---
  function initStatusBarClick() {
    if (!DOM.statusBar) return;

    DOM.statusBar.style.cursor = 'pointer';
    DOM.statusBar.title = 'Кликните для обновления статуса';

    DOM.statusBar.addEventListener('click', () => {
      // Визуальная обратная связь
      DOM.statusBar.style.transition = 'background 0.3s';
      DOM.statusBar.style.background = 'rgba(255,255,255,0.08)';
      setTimeout(() => {
        DOM.statusBar.style.background = 'rgba(255,255,255,0.03)';
      }, 300);

      // Обновляем статус
      if (CONFIG.useRealDiscordAPI) {
        updateRealStatus();
      } else {
        // В демо-режиме показываем случайный статус
        const randomStatus = demoStatuses[Math.floor(Math.random() * demoStatuses.length)];
        updateStatus(randomStatus);
      }

      // Анимация обновления
      if (DOM.statusDot) {
        DOM.statusDot.style.transform = 'scale(0.5)';
        setTimeout(() => {
          DOM.statusDot.style.transform = 'scale(1)';
        }, 300);
      }
    });
  }

  // --- 7. ГОРЯЧИЕ КЛАВИШИ ---
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+S — обновить статус
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        console.log('🔄 Принудительное обновление статуса (горячая клавиша)');
        if (CONFIG.useRealDiscordAPI) {
          updateRealStatus();
        } else {
          cycleDemoStatus();
        }
      }
      
      // Ctrl+Shift+H — показать историю
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        console.log('📊 История статусов:', getStatusHistory());
      }
    });
  }

  // --- 8. ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ (ДЛЯ КОНСОЛИ) ---
  window.StatusSystem = {
    update: updateStatus,
    getHistory: getStatusHistory,
    getCurrent: () => ({ ...statusState.current }),
    refresh: CONFIG.useRealDiscordAPI ? updateRealStatus : cycleDemoStatus,
    config: CONFIG,
    state: statusState,
    demoCycle: cycleDemoStatus,
    realUpdate: updateRealStatus
  };

  // --- 9. ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('🚀 script.js загружен и готов к работе!');
  console.log('💡 Подсказка: Ctrl+Shift+S — обновить статус, Ctrl+Shift+H — история');
  console.log('💡 В консоли доступен объект StatusSystem');

})();
