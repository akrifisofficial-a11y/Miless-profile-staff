// updates.js — Загрузка ленты из JSON

(function() {
  'use strict';

  const UPDATES_URL = 'data/updates.json';

  async function loadUpdates() {
    const container = document.getElementById('updatesList');
    if (!container) return;
    try {
      const resp = await fetch(UPDATES_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data || !data.length) {
        container.innerHTML = '<div class="loading-spinner">📭 Пока нет обновлений</div>';
        return;
      }
      container.innerHTML = data.map(item => `
        <div class="update-item">
          <div class="update-date"><i class="fas fa-calendar-alt"></i> ${item.date || 'Недавно'}</div>
          <div class="update-title">${item.title || 'Обновление'}</div>
          <div class="update-description">${item.description || ''}</div>
          ${item.tag ? `<span class="update-tag">${item.tag}</span>` : ''}
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div class="loading-spinner" style="color:#f87171;">❌ Ошибка загрузки: ${e.message}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', loadUpdates);
})();
