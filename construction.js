// construction.js — Анимации и интерактив для страницы "В разработке"

(function() {
  'use strict';

  // --- АНИМАЦИЯ ПРОГРЕСС-БАРА ---
  function animateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (!progressFill || !progressText) return;
    
    let progress = 0;
    const target = 73; // 73% — символично для Shikimori 😄
    const interval = setInterval(() => {
      progress += Math.random() * 3 + 0.5;
      if (progress >= target) {
        progress = target;
        clearInterval(interval);
      }
      progressFill.style.width = progress + '%';
      progressText.textContent = Math.floor(progress) + '%';
    }, 50);
  }

  // --- ПЕЧАТНЫЙ ЭФФЕКТ ДЛЯ ЗАГОЛОВКА ---
  function typeTitle() {
    const title = document.getElementById('typingTitle');
    if (!title) return;
    
    const text = title.textContent;
    title.textContent = '';
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        title.textContent += text.charAt(index);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 60);
  }

  // --- СЛУЧАЙНЫЕ СООБЩЕНИЯ ---
  const messages = [
    'Аниме — это жизнь!',
    'Лучший способ скоротать время — смотреть аниме',
    'Все мы немного отаку',
    'Kawaii desu! (◕‿◕)',
    'Ещё одна серия и спать...',
    'Shikimori — лучшее место для отаку',
    'Ваше любимое аниме?',
    'Готовимся к новому сезону!',
    'Нет времени объяснять — надо смотреть!',
    'Сёнэн — это сила!'
  ];

  function showRandomMessage() {
    const container = document.getElementById('randomMessage');
    const textEl = document.getElementById('messageText');
    
    if (!container || !textEl) return;
    
    const randomIndex = Math.floor(Math.random() * messages.length);
    textEl.textContent = messages[randomIndex];
    
    container.style.display = 'flex';
    container.style.animation = 'none';
    // Перезапускаем анимацию
    setTimeout(() => {
      container.style.animation = 'fadeInUp 0.5s ease-out';
    }, 10);
  }

  // --- ЗАПУСК ---
  document.addEventListener('DOMContentLoaded', () => {
    animateProgress();
    typeTitle();
    
    // Добавляем случайное сообщение при наведении на кнопку
    const btn = document.querySelector('.nav-btn.secondary:last-child');
    if (btn) {
      btn.addEventListener('click', showRandomMessage);
    }
    
    console.log('🔧 Страница в разработке загружена!');
    console.log('💡 Нажми "Удиви меня" для случайного сообщения');
  });

})();
