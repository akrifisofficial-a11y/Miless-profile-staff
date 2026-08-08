// auth.js — OAuth через Shikimori

(function() {
  'use strict';

  const AUTH_CONFIG = {
    clientId: 'aYGOHBKdDGqSHtQhkdUo6abk5Apsso2pNlsxD88uhcE',
    clientSecret: 'ibUUh_pjwhMFqAAceg2ceKcZTZX8n1loCk4tT_sEtxc',
    redirectUri: 'https://milesvv.c6t.ru/callback.html',  // ← жёстко прописанный URL
    authUrl: 'https://shikimori.one/oauth/authorize',
    tokenUrl: 'https://shikimori.one/oauth/token',
    scope: 'user_rates'
  };

  const STORAGE_KEY = 'shikimori_token';

  function getToken() { return localStorage.getItem(STORAGE_KEY); }
  function setToken(token) { localStorage.setItem(STORAGE_KEY, token); }
  function clearToken() { localStorage.removeItem(STORAGE_KEY); }
  function isAuthenticated() { return !!getToken(); }

  function login() {
    const params = new URLSearchParams({
      client_id: AUTH_CONFIG.clientId,
      redirect_uri: AUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: AUTH_CONFIG.scope
    });
    window.location.href = `${AUTH_CONFIG.authUrl}?${params.toString()}`;
  }

  function logout() {
    clearToken();
    updateUI();
    window.location.reload();
  }

  function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      exchangeCodeForToken(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  async function exchangeCodeForToken(code) {
    try {
      const response = await fetch(AUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: AUTH_CONFIG.clientId,
          client_secret: AUTH_CONFIG.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: AUTH_CONFIG.redirectUri
        })
      });
      const data = await response.json();
      if (data.access_token) {
        setToken(data.access_token);
        console.log('✅ Авторизация успешна!');
        window.location.href = '/';
      } else {
        console.error('❌ Ошибка получения токена:', data);
        alert('Ошибка входа: ' + (data.error_description || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      alert('Ошибка соединения с Shikimori');
    }
  }

  function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    if (!loginBtn || !loginText) return;
    if (isAuthenticated()) {
      loginText.textContent = 'Выйти';
      loginBtn.onclick = (e) => { e.preventDefault(); logout(); };
    } else {
      loginText.textContent = 'Войти';
      loginBtn.onclick = (e) => { e.preventDefault(); login(); };
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    handleCallback();
    updateUI();
  });

  window.ShikimoriAuth = { login, logout, getToken, isAuthenticated, clearToken };
})();
