// ============================================
//  ГАМБУРГЕР-МЕНЮ + ПОДСВЕТКА СТРАНИЦЫ + КНОПКА ВХОДА
//  Работает с классами .nav-toggle и .nav-menu
//  Подключается на всех страницах
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // ----- Элементы -----
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    const body = document.body;

    // Если меню нет – выходим (чтобы не было ошибок на страницах без меню)
    if (!toggle || !menu) return;

    // ----- 1. Функция переключения меню -----
    function toggleMenu(forceState) {
        const isOpen = typeof forceState === 'boolean' ? forceState : !menu.classList.contains('active');
        menu.classList.toggle('active', isOpen);
        toggle.classList.toggle('active', isOpen);
        body.style.overflow = isOpen ? 'hidden' : '';
    }

    // ----- 2. Клик по гамбургеру -----
    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMenu();
    });

    // ----- 3. Закрытие при клике на ссылку -----
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function () {
            if (menu.classList.contains('active')) {
                toggleMenu(false);
            }
        });
    });

    // ----- 4. Закрытие при клике вне меню -----
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.navbar') && menu.classList.contains('active')) {
            toggleMenu(false);
        }
    });

    // ----- 5. Закрытие по Escape -----
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('active')) {
            toggleMenu(false);
        }
    });

    // ----- 6. Закрытие при ресайзе (ширина > 768px) -----
    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && menu.classList.contains('active')) {
                toggleMenu(false);
            }
        }, 100);
    });

    // ----- 7. Автоматическая подсветка активной страницы -----
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    menu.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        // Убираем параметры и якоря для сравнения
        const cleanHref = href ? href.split('?')[0].split('#')[0] : '';
        if (cleanHref === currentFile) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // ----- 8. Кнопка "Войти" (демо-функция) -----
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    if (loginBtn && loginText) {
        // Проверяем состояние входа (хранится в localStorage)
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        loginText.textContent = isLoggedIn ? 'Выйти' : 'Войти';

        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (loginText.textContent === 'Войти') {
                // Имитация входа
                localStorage.setItem('isLoggedIn', 'true');
                loginText.textContent = 'Выйти';
                alert('Вы вошли (демо)');
            } else {
                // Выход
                localStorage.removeItem('isLoggedIn');
                loginText.textContent = 'Войти';
                alert('Вы вышли (демо)');
            }
            // Закрываем меню, если оно открыто
            if (menu.classList.contains('active')) {
                toggleMenu(false);
            }
        });
    }
});
