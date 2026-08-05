// discord-status.js — Модуль для получения реального статуса из Discord
// Подключается после основного script.js

(function() {
  'use strict';

  // --- КОНФИГУРАЦИЯ DISCORD ---
  const DISCORD_CONFIG = {
    userId: '123456789012345678', // ВСТАВЬТЕ СВОЙ DISCORD ID (18 цифр)
    apiUrl: 'https://api.lanyard.rest/v1/users/',
    wsUrl: 'wss://api.lanyard.rest/socket',
    updateInterval: 30000, // Интервал обновления (мс)
    retryDelay: 5000, // Задержка при повторных попытках
    maxRetries: 3 // Максимум попыток переподключения
  };

  // --- СОСТОЯНИЕ МОДУЛЯ ---
  const DiscordState = {
    isConnected: false,
    isReal: false,
    lastStatus: null,
    retryCount: 0,
    ws: null,
    listeners: []
  };

  // --- МАППИНГ СТАТУСОВ ---
  const STATUS_MAP = {
    'online': { text: 'В сети', emoji: '🟢', type: 'online', color: '#4ade80' },
    'idle': { text: 'Отошёл', emoji: '🟡', type: 'idle', color: '#fbbf24' },
    'dnd': { text: 'Не беспокоить', emoji: '🔴', type: 'dnd', color: '#f87171' },
    'offline': { text: 'Офлайн', emoji: '⚫', type: 'offline', color: '#6b7280' }
  };

  // --- ОСНОВНЫЕ ФУНКЦИИ ---

  // 1. Получение статуса через REST API
  async function fetchDiscordStatus(userId = DISCORD_CONFIG.userId) {
    try {
      const response = await fetch(`${DISCORD_CONFIG.apiUrl}${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('API вернул ошибку');
      }
      
      return parseDiscordData(data.data);
    } catch (error) {
      console.error('❌ Ошибка получения статуса Discord:', error.message);
      return null;
    }
  }

  // 2. Парсинг данных из Discord
  function parseDiscordData(data) {
    if (!data) return null;

    const discordStatus = STATUS_MAP[data.discord_status] || STATUS_MAP.offline;
    
    // Парсинг активности (игра/приложение)
    let activity = 'Ничего не делаю';
    let activityType = 'none';
    let activityDetails = null;
    let activityState = null;
    let activityAssets = null;

    if (data.activities && data.activities.length > 0) {
      const game = data.activities[0];
      
      if (game.name) {
        activity = `🎮 ${game.name}`;
        activityType = game.type || 'game';
        activityDetails = game.details || null;
        activityState = game.state || null;
        activityAssets = game.assets || null;

        // Добавляем детали если есть
        if (game.details) {
          activity += ` — ${game.details}`;
        }
        if (game.state) {
          activity += ` (${game.state})`;
        }
      }
    }

    // Проверка на Spotify
    let spotify = null;
    if (data.spotify) {
      spotify = {
        song: data.spotify.song,
        artist: data.spotify.artist,
        album: data.spotify.album,
        trackId: data.spotify.track_id
      };
      activity = `🎵 Слушаю ${spotify.song} — ${spotify.artist}`;
      activityType = 'spotify';
    }

    return {
      text: discordStatus.text,
      emoji: discordStatus.emoji,
      type: discordStatus.type,
      color: discordStatus.color,
      activity: activity,
      activityType: activityType,
      activityDetails: activityDetails,
      activityState: activityState,
      activityAssets: activityAssets,
      spotify: spotify,
      raw: data,
      timestamp: new Date().toISOString()
    };
  }

  // 3. Обновление статуса на странице
  async function updateDiscordStatus() {
    const status = await fetchDiscordStatus();
    
    if (!status) {
      // Если не удалось получить статус
      DiscordState.retryCount++;
      
      if (DiscordState.retryCount <= DISCORD_CONFIG.maxRetries) {
        console.warn(`⚠️ Попытка переподключения ${DiscordState.retryCount}/${DISCORD_CONFIG.maxRetries}`);
        setTimeout(updateDiscordStatus, DISCORD_CONFIG.retryDelay);
      } else {
        console.error('❌ Не удалось подключиться к Discord API');
        // Показываем заглушку
        showFallbackStatus();
      }
      return;
    }

    // Сбрасываем счётчик попыток при успехе
    DiscordState.retryCount = 0;
    DiscordState.isConnected = true;
    DiscordState.isReal = true;
    DiscordState.lastStatus = status;

    // Обновляем DOM
    updateDOMWithStatus(status);
    
    // Оповещаем всех слушателей
    notifyListeners(status);

    console.log(`✅ Статус Discord обновлён: ${status.text} — ${status.activity}`);
  }

  // 4. Обновление DOM
  function updateDOMWithStatus(status) {
    // Находим элементы
    const indicator = document.querySelector('.status-indicator');
    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');
    const activity = document.querySelector('.status-activity');
    const badges = document.querySelectorAll('.status-badge');

    if (!indicator) {
      console.warn('⚠️ Элементы статуса не найдены в DOM');
      return;
    }

    // Обновляем классы
    indicator.className = `status-indicator ${status.type}`;
    
    // Обновляем текст
    if (text) text.textContent = status.text;
    if (activity) activity.textContent = status.activity;

    // Обновляем точку
    if (dot) {
      if (status.type === 'offline') {
        dot.style.animation = 'none';
        dot.style.opacity = '0.4';
        dot.style.background = status.color;
      } else {
        dot.style.animation = 'pulse 2s infinite';
        dot.style.opacity = '1';
        dot.style.background = status.color;
        dot.style.boxShadow = `0 0 20px ${status.color}66`;
      }
    }

    // Обновляем бейджи (только для Discord)
    badges.forEach(badge => {
      const parent = badge.closest('.link-card');
      if (parent && parent.classList.contains('discord')) {
        badge.textContent = status.emoji;
        badge.style.color = status.color;
      }
    });

    // Обновляем время последнего обновления
    const updateTime = document.getElementById('last-update');
    if (updateTime) {
      const now = new Date();
      updateTime.textContent = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    // Добавляем визуальный эффект при обновлении
    if (indicator) {
      indicator.style.transition = 'all 0.3s ease';
      indicator.style.transform = 'scale(1.02)';
      setTimeout(() => {
        indicator.style.transform = 'scale(1)';
      }, 300);
    }
  }

  // 5. Заглушка при ошибке
  function showFallbackStatus() {
    const status = {
      text: 'Недоступно',
      emoji: '⚠️',
      type: 'offline',
      color: '#ef4444',
      activity: '🔄 Ошибка подключения к Discord'
    };
    updateDOMWithStatus(status);
  }

  // 6. WebSocket подключение (для реального времени)
  function connectWebSocket() {
    try {
      DiscordState.ws = new WebSocket(DISCORD_CONFIG.wsUrl);

      DiscordState.ws.onopen = () => {
        console.log('🔌 WebSocket подключён к Discord');
        // Отправляем подписку на пользователя
        DiscordState.ws.send(JSON.stringify({
          op: 2,
          d: {
            subscribe_to_id: DISCORD_CONFIG.userId
          }
        }));
      };

      DiscordState.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.op === 1 && data.d) {
            // Получено обновление статуса
            const status = parseDiscordData(data.d);
            if (status) {
              DiscordState.lastStatus = status;
              updateDOMWithStatus(status);
              notifyListeners(status);
              console.log('🔄 Статус обновлён через WebSocket');
            }
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга WebSocket сообщения:', error);
        }
      };

      DiscordState.ws.onerror = (error) => {
        console.error('❌ WebSocket ошибка:', error);
      };

      DiscordState.ws.onclose = () => {
        console.warn('⚠️ WebSocket отключён, переподключение через 5 секунд...');
        setTimeout(connectWebSocket, 5000);
      };

    } catch (error) {
      console.error('❌ Ошибка подключения WebSocket:', error);
    }
  }

  // 7. Система слушателей (для оповещения других модулей)
  function addStatusListener(callback) {
    if (typeof callback === 'function') {
      DiscordState.listeners.push(callback);
    }
  }

  function notifyListeners(status) {
    DiscordState.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('❌ Ошибка в слушателе:', error);
      }
    });
  }

  // 8. Получение текущего статуса (синхронно)
  function getCurrentStatus() {
    return DiscordState.lastStatus;
  }

  // 9. Проверка, используем ли мы реальный API
  function isUsingRealAPI() {
    return DiscordState.isReal && DiscordState.isConnected;
  }

  // --- ИНИЦИАЛИЗАЦИЯ ---

  function init() {
    console.log('🔄 Загрузка Discord Status модуля...');

    // Проверяем, что ID установлен
    if (DISCORD_CONFIG.userId === '123456789012345678') {
      console.warn('⚠️ Вставьте свой Discord ID в DISCORD_CONFIG.userId');
      console.warn('💡 Как получить ID: включите режим разработчика в Discord и скопируйте ID');
      return;
    }

    // Запускаем REST API
    updateDiscordStatus();
    
    // Регулярные обновления через REST
    setInterval(updateDiscordStatus, DISCORD_CONFIG.updateInterval);

    // Подключаем WebSocket для реального времени
    connectWebSocket();

    // Добавляем обработчик клика на статус-бар для ручного обновления
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
      statusBar.style.cursor = 'pointer';
      statusBar.title = 'Кликните для обновления статуса Discord';
      statusBar.addEventListener('click', () => {
        updateDiscordStatus();
        // Визуальная обратная связь
        statusBar.style.transition = 'background 0.3s';
        statusBar.style.background = 'rgba(255,255,255,0.08)';
        setTimeout(() => {
          statusBar.style.background = 'rgba(255,255,255,0.03)';
        }, 300);
      });
    }

    console.log('✅ Discord Status модуль успешно загружен');
  }

  // --- ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ ---
  window.DiscordStatus = {
    update: updateDiscordStatus,
    getCurrent: getCurrentStatus,
    isReal: isUsingRealAPI,
    config: DISCORD_CONFIG,
    state: DiscordState,
    addListener: addStatusListener,
    parseData: parseDiscordData,
    fetch: fetchDiscordStatus,
    reconnect: connectWebSocket
  };

  // --- ЗАПУСК ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('🎯 Discord Status Module v1.0 загружен');
  console.log('💡 Используйте DiscordStatus.update() для ручного обновления');
  console.log('💡 DiscordStatus.getCurrent() для получения текущего статуса');

})();
