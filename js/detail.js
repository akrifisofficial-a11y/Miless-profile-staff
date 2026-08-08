// detail.js — Загрузка, редактирование, копирование ссылки

(function() {
  'use strict';

  const ANIME_URL = 'anime_rates.json';
  const SHIKI_BASE = 'https://shikimori.io';
  const TOKEN_KEY = 'shikimori_token';

  const container = document.getElementById('detailContent');
  let currentData = null;
  let userRateId = null;

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function showNotification(msg, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s';
      setTimeout(() => div.remove(), 500);
    }, 4000);
  }

  function getPlaceholder(title) {
    const char = title.charAt(0).toUpperCase();
    const colors = ['#6b8fc9', '#f5a623', '#5865f2', '#ff6b9d', '#4ade80', '#f87171'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3Crect fill='%231a1f2e' width='200' height='300'/%3E%3Ccircle cx='100' cy='120' r='50' fill='${color.replace('#', '%23')}' opacity='0.15'/%3E%3Ctext x='100' y='140' text-anchor='middle' dy='.3em' fill='${color.replace('#', '%23')}' font-size='56' font-family='sans-serif' font-weight='bold'%3E${char}%3C/text%3E%3C/svg%3E`;
  }

  function copyPageLink() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showNotification('✅ Ссылка скопирована!', 'success');
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showNotification('✅ Ссылка скопирована!', 'success');
    } catch (e) {
      showNotification('❌ Не удалось скопировать', 'error');
    }
    document.body.removeChild(textarea);
  }

  async function loadAnime() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      container.innerHTML = '<div class="loading-spinner" style="color:#f87171;">❌ Не указан ID аниме</div>';
      return;
    }

    try {
      const resp = await fetch(ANIME_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const entry = data.find(item => item.id == id);
      if (!entry) {
        container.innerHTML = '<div class="loading-spinner" style="color:#f87171;">❌ Аниме не найдено</div>';
        return;
      }
      currentData = entry;
      userRateId = entry.id;
      renderDetail(entry);
    } catch (e) {
      console.error('Ошибка загрузки:', e);
      container.innerHTML = `<div class="loading-spinner" style="color:#f87171;">❌ Ошибка: ${e.message}</div>`;
    }
  }

  function renderDetail(entry) {
    const anime = entry.anime;
    const title = anime.russian || anime.name || 'Без названия';
    const desc = anime.description || 'Описание отсутствует';
    const score = entry.score || '—';
    const statusMap = {
      'planned': '📅 В планах',
      'watching': '⏳ Смотрю',
      'completed': '✅ Просмотрено',
      'on_hold': '⏸ Отложено',
      'dropped': '❌ Брошено'
    };
    const status = statusMap[entry.status] || entry.status || '❓';

    let poster = '';
    if (anime.image?.preview) {
      poster = anime.image.preview;
      if (poster.startsWith('/')) poster = SHIKI_BASE + poster;
    } else {
      poster = getPlaceholder(title);
    }

    const genres = (anime.genres || []).map(g => g.russian || g.name).join(', ');
    let shikiUrl = '#';
    if (anime.url) {
      shikiUrl = anime.url.startsWith('http') ? anime.url : SHIKI_BASE + anime.url;
    }

    const isAuth = !!getToken();

    container.innerHTML = `
      <div class="anime-detail">
        <img src="${poster}" alt="${title}" class="poster" onerror="this.src='${getPlaceholder(title)}'">
        <div class="info">
          <h1>${title}</h1>
          <div class="meta">
            <span><i class="fas fa-star"></i> ${score}</span>
            <span><i class="fas fa-play-circle"></i> ${anime.episodes || '?'} эп.</span>
            <span><i class="fas fa-calendar-alt"></i> ${anime.year || '?'}</span>
            <span><i class="fas fa-tag"></i> ${anime.kind || 'TV'}</span>
          </div>
          ${genres ? `<div class="genres">${genres.split(',').map(g => `<span>${g.trim()}</span>`).join('')}</div>` : ''}
          <div class="description">${desc}</div>

          <div class="action-buttons">
            <button class="action-btn" id="copyLinkBtn">
              <i class="fas fa-copy"></i> Копировать ссылку
            </button>
            <a href="${shikiUrl}" target="_blank" class="action-btn primary">
              <i class="fas fa-external-link-alt"></i> Открыть на Shikimori
            </a>
          </div>

          <div class="user-data">
            <div class="status-badge">${status}</div>
            ${score !== '—' ? `<div class="score-display">⭐ ${score}</div>` : ''}
          </div>

          ${isAuth ? `
            <button class="edit-toggle-btn" id="editToggleBtn">
              <i class="fas fa-pen"></i> Редактировать
            </button>
            <div class="edit-form" id="editForm">
              <h4 style="color: #f0e6d0; margin-bottom: 0.5rem;">Изменить данные</h4>
              <div class="form-group">
                <div class="field">
                  <label>Статус</label>
                  <select id="editStatus">
                    <option value="planned" ${entry.status === 'planned' ? 'selected' : ''}>В планах</option>
                    <option value="watching" ${entry.status === 'watching' ? 'selected' : ''}>Смотрю</option>
                    <option value="completed" ${entry.status === 'completed' ? 'selected' : ''}>Просмотрено</option>
                    <option value="on_hold" ${entry.status === 'on_hold' ? 'selected' : ''}>Отложено</option>
                    <option value="dropped" ${entry.status === 'dropped' ? 'selected' : ''}>Брошено</option>
                  </select>
                </div>
                <div class="field">
                  <label>Оценка (1–10)</label>
                  <input type="number" id="editScore" min="1" max="10" value="${entry.score || ''}" placeholder="—" />
                </div>
                <div class="field" style="flex:2;">
                  <label>Заметка</label>
                  <textarea id="editText" placeholder="Ваша заметка...">${entry.text || ''}</textarea>
                </div>
              </div>
              <button class="save-btn" id="saveBtn">
                <i class="fas fa-save"></i> Сохранить на Shikimori
              </button>
            </div>
          ` : `
            <div style="margin-top:1rem; color:#6c7b9c; font-size:0.9rem;">
              <i class="fas fa-lock"></i> <a href="#" id="loginLink" style="color:#6b8fc9; text-decoration:none;">Войдите</a>, чтобы редактировать
            </div>
          `}
        </div>
      </div>
    `;

    document.getElementById('copyLinkBtn').addEventListener('click', copyPageLink);

    if (isAuth) {
      const toggleBtn = document.getElementById('editToggleBtn');
      const editForm = document.getElementById('editForm');
      const saveBtn = document.getElementById('saveBtn');

      toggleBtn.addEventListener('click', () => {
        editForm.classList.toggle('active');
        toggleBtn.textContent = editForm.classList.contains('active') ? '✕ Закрыть' : '✎ Редактировать';
      });

      saveBtn.addEventListener('click', saveChanges);
    } else {
      const loginLink = document.getElementById('loginLink');
      if (loginLink) {
        loginLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.ShikimoriAuth && window.ShikimoriAuth.login) {
            window.ShikimoriAuth.login();
          } else {
            alert('Функция входа не загружена. Проверьте auth.js');
          }
        });
      }
    }
  }

  // --- СОХРАНЕНИЕ ИЗМЕНЕНИЙ (исправлено) ---
  async function saveChanges() {
    const token = getToken();
    if (!token) {
      showNotification('❌ Вы не авторизованы', 'error');
      return;
    }

    const status = document.getElementById('editStatus').value;
    const scoreInput = document.getElementById('editScore').value;
    const text = document.getElementById('editText').value.trim();

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

    try {
      // Проверяем, что ID существует
      if (!userRateId) {
        throw new Error('ID записи не найден');
      }

      const payload = {
        user_rate: {
          status: status
        }
      };

      const score = parseInt(scoreInput);
      if (!isNaN(score) && score >= 1 && score <= 10) {
        payload.user_rate.score = score;
      }
      if (text) {
        payload.user_rate.text = text;
      }

      console.log('🔄 Отправка запроса на Shikimori:', payload);

      // ⚠️ Используем v1 API (более стабильный) или v2 с правильным токеном
      const url = `https://shikimori.one/api/v2/user_rates/${userRateId}`;
      const resp = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('❌ Ответ сервера:', errText);
        let errMsg = `HTTP ${resp.status}`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.errors) errMsg = errJson.errors.join(', ');
        } catch (e) {}
        throw new Error(errMsg);
      }

      const updated = await resp.json();
      console.log('✅ Успешно обновлено:', updated);

      showNotification('✅ Данные успешно обновлены на Shikimori!', 'success');

      // Обновляем локальные данные
      currentData.status = updated.status;
      currentData.score = updated.score;
      currentData.text = updated.text;

      // Перерисовываем страницу
      renderDetail(currentData);
      const editForm = document.getElementById('editForm');
      if (editForm) editForm.classList.add('active');

    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
      showNotification('❌ Ошибка: ' + error.message, 'error');
    }

    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить на Shikimori';
  }

  document.addEventListener('DOMContentLoaded', loadAnime);
})();
