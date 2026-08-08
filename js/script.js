// script.js — Главный скрипт (меню, статус, счётчик)

(function() {
  'use strict';

  // Меню-гамбургер
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
    });
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
      });
    });
  }

  // Статус
  const statuses = [
    { text: 'В сети', activity: '🎮 Играю в Cyberpunk 2077', type: 'online' },
    { text: 'В сети', activity: '🎧 Слушаю музыку', type: 'online' },
    { text: 'Отошёл', activity: '☕ Пью кофе', type: 'idle' },
    { text: 'В сети', activity: '📺 Смотрю аниме', type: 'online' },
    { text: 'Не беспокоить', activity: '📝 Пишу код', type: 'dnd' },
    { text: 'Отошёл', activity: '🍕 Обедаю', type: 'idle' },
    { text: 'Офлайн', activity: '🌙 Сплю', type: 'offline' }
  ];
  let idx = 0;
  const indicator = document.querySelector('.status-indicator');
  const textEl = document.querySelector('.status-text');
  const activityEl = document.querySelector('.status-activity');
  const dotEl = document.querySelector('.status-dot');
  if (indicator && textEl && activityEl && dotEl) {
    setInterval(() => {
      const s = statuses[idx % statuses.length];
      textEl.textContent = s.text;
      activityEl.textContent = s.activity;
      indicator.className = `status-indicator ${s.type}`;
      dotEl.style.animation = s.type === 'offline' ? 'none' : 'pulse 2s infinite';
      dotEl.style.opacity = s.type === 'offline' ? '0.4' : '1';
      idx++;
    }, 15000);
  }

  // Часы
  const updateEl = document.getElementById('last-update');
  if (updateEl) {
    function updateClock() {
      const now = new Date();
      updateEl.textContent = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Счётчик дней
  const daysValue = document.getElementById('daysValue');
  if (daysValue) {
    const registrationDate = new Date(2023, 8, 14); // ← замени на свою дату
    const now = new Date();
    const diffDays = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
    daysValue.textContent = diffDays > 0 ? diffDays : '0';
  }
})();
