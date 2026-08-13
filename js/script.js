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
document.addEventListener('DOMContentLoaded', function () {
    // Список аниме – только ID и базовая информация
    const animeList = [
        { id: 5114, title: 'Стальной алхимик: Братство', year: 2009, genre: 'Приключения, Фэнтези' },
        { id: 16498, title: 'Атака Титанов', year: 2013, genre: 'Экшн, Драма' },
        { id: 40748, title: 'Магическая битва', year: 2020, genre: 'Экшн, Сверхъестественное' },
        { id: 38000, title: 'Клинок, рассекающий демонов', year: 2019, genre: 'Экшн, Историческое' },
        { id: 30276, title: 'Ванпанчмен', year: 2015, genre: 'Экшн, Комедия' },
        { id: 22319, title: 'Токийский гуль', year: 2014, genre: 'Экшн, Ужасы' }
    ];

    const grid = document.getElementById('animeGrid');

    animeList.forEach(anime => {
        // Автоматически строим ссылку на плеер и постер (домен .io)
        const watchUrl = `https://shikimori.io/animes/${anime.id}/watch`;
        const posterUrl = `https://shikimori.io/system/animes/original/${anime.id}.jpg`;

        const card = document.createElement('div');
        card.className = 'anime-card';

        const img = document.createElement('img');
        img.src = posterUrl;
        img.alt = anime.title;
        img.loading = 'lazy';
        img.onerror = function() {
            this.style.background = '#2a2a4a';
            this.style.objectFit = 'contain';
            this.style.padding = '1rem';
            this.src = '';
        };

        const info = document.createElement('div');
        info.className = 'anime-info';

        const title = document.createElement('h3');
        title.textContent = anime.title;

        const year = document.createElement('div');
        year.className = 'year';
        year.textContent = anime.year;

        const genre = document.createElement('span');
        genre.className = 'genre';
        genre.textContent = anime.genre;

        info.appendChild(title);
        info.appendChild(year);
        info.appendChild(genre);

        card.appendChild(img);
        card.appendChild(info);

        card.addEventListener('click', function () {
            window.open(watchUrl, '_blank');
        });

        grid.appendChild(card);
    });
});
