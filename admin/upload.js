// upload.js — Загрузка файла на GitHub

(function() {
  'use strict';

  const CONFIG = {
    // 👇👇👇 ТВОЙ РЕПОЗИТОРИЙ 👇👇👇
    repoOwner: 'akrifisofficial-a11y',
    repoName: 'Miless-profile-staff',
    // 👆👆👆 ТВОЙ РЕПОЗИТОРИЙ 👆👆👆
    
    branch: 'main',
    filePath: 'baza/anime_rates.json'
  };

  // --- DOM ЭЛЕМЕНТЫ ---
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileName = document.getElementById('fileName');
  const uploadBtn = document.getElementById('uploadBtn');
  const githubToken = document.getElementById('githubToken');
  const filePath = document.getElementById('filePath');
  const uploadStatus = document.getElementById('uploadStatus');
  const statusMessage = uploadStatus.querySelector('.status-message');

  let selectedFile = null;

  // --- ПРОВЕРКА ТОКЕНА ---
  function checkToken() {
    const token = githubToken.value.trim();
    uploadBtn.disabled = !token || !selectedFile;
  }

  // --- ОБРАБОТКА ФАЙЛА ---
  function handleFile(file) {
    if (!file) return;
    
    // Проверяем, что это JSON
    if (!file.name.endsWith('.json')) {
      showStatus('❌ Пожалуйста, выбери JSON-файл', 'error');
      return;
    }

    selectedFile = file;
    fileName.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileName.style.color = '#4ade80';
    checkToken();
    showStatus('✅ Файл готов к загрузке', 'success');
  }

  // --- DRAG & DROP ---
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // --- ВВОД ТОКЕНА ---
  githubToken.addEventListener('input', checkToken);

  // --- ЗАГРУЗКА НА GITHUB ---
  uploadBtn.addEventListener('click', async () => {
    const token = githubToken.value.trim();
    const path = filePath.value.trim() || CONFIG.filePath;

    if (!token) {
      showStatus('❌ Вставь GitHub токен', 'error');
      return;
    }

    if (!selectedFile) {
      showStatus('❌ Выбери файл', 'error');
      return;
    }

    // Читаем файл
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const encodedContent = btoa(content);

      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
      showStatus('⏳ Загрузка на GitHub...', 'info');

      try {
        // Сначала проверяем, существует ли файл
        const getUrl = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${path}`;
        let sha = null;
        let existingFile = false;

        try {
          const getResponse = await fetch(getUrl, {
            headers: { 'Authorization': `token ${token}` }
          });
          if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
            existingFile = true;
          }
        } catch (e) {}

        // Отправляем файл
        const uploadUrl = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${path}`;
        const body = {
          message: existingFile ? 'Update anime_rates.json' : 'Add anime_rates.json',
          content: encodedContent,
          branch: CONFIG.branch
        };
        if (sha) body.sha = sha;

        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Ошибка загрузки');
        }

        showStatus('✅ Файл успешно загружен на GitHub!', 'success');
        uploadBtn.innerHTML = '<i class="fas fa-check"></i> Загружено!';
        
        // Сброс через 3 секунды
        setTimeout(() => {
          uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Загрузить на GitHub';
          uploadBtn.disabled = false;
        }, 3000);

      } catch (error) {
        console.error('Ошибка:', error);
        showStatus(`❌ Ошибка: ${error.message}`, 'error');
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Загрузить на GitHub';
        uploadBtn.disabled = false;
      }
    };

    reader.readAsText(selectedFile);
  });

  // --- ОТОБРАЖЕНИЕ СТАТУСА ---
  function showStatus(message, type = 'info') {
    uploadStatus.style.display = 'block';
    statusMessage.textContent = message;
    statusMessage.className = type;
    
    const colors = {
      success: '#4ade80',
      error: '#f87171',
      info: '#fbbf24'
    };
    statusMessage.style.color = colors[type] || '#fbbf24';
  }

  // --- ПРОВЕРКА ПРИ ЗАГРУЗКЕ ---
  document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли сохранённый токен
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      githubToken.value = savedToken;
      checkToken();
    }

    // Сохраняем токен локально
    githubToken.addEventListener('change', () => {
      if (githubToken.value.trim()) {
        localStorage.setItem('github_token', githubToken.value.trim());
      }
    });
  });

})();
