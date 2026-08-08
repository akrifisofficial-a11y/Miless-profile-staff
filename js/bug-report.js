// bug-report.js — отправка на Formspree (улучшенная)

(function() {
  'use strict';

  const form = document.getElementById('bugForm');
  const successMessage = document.getElementById('successMessage');
  const submitBtn = form.querySelector('.submit-btn');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(form);

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';

    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        form.style.display = 'none';
        successMessage.style.display = 'block';
        // Прокрутка к сообщению
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error('Ошибка отправки');
      }
    })
    .catch(error => {
      alert('❌ Не удалось отправить отчёт. Попробуйте позже или свяжитесь с разработчиком напрямую.');
      console.error(error);
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить отчёт';
    });
  });
})();
