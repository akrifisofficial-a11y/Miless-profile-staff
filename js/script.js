// ================================================
//  УНИВЕРСАЛЬНЫЙ СКРИПТ ДЛЯ ВАШЕГО МЕНЮ
//  Классы: .navbar, .nav-toggle, .nav-menu
//  Работает на всех страницах, подсвечивает активный пункт
// ================================================

document.addEventListener('DOMContentLoaded', function () {
    // Находим элементы
    const navToggle = document.getElementById('navToggle') || document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('navMenu') || document.querySelector('.nav-menu');
    const body = document.body;

    // Если меню нет – выходим
    if (!navToggle || !navMenu) return;

    // ----- 1. Переключение меню (гамбургер) -----
    function toggleMenu(forceState) {
        const isOpen = typeof forceState === 'boolean' ? forceState : !navMenu.classList.contains('active');
        navMenu.classList.toggle('active', isOpen);
        navToggle.classList.toggle('active', isOpen);
        // Блокировка скролла фона
        body.style.overflow = isOpen ? 'hidden' : '';
    }

    // Клик по гамбургеру
    navToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMenu();
    });

    // ----- 2. Закрытие при клике на пункт меню -----
    const menuLinks = navMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (navMenu.classList.contains('active')) {
                toggleMenu(false);
            }
        });
    });

    // ----- 3. Закрытие при клике вне меню -----
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.navbar') && navMenu.classList.contains('active')) {
            toggleMenu(false);
        }
    });

    // ----- 4. Закрытие по Escape -----
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            toggleMenu(false);
        }
    });

    // ----- 5. Закрытие при ресайзе (если ширина > 768px) -----
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                toggleMenu(false);
            }
        }, 100);
    });

    // ----- 6. Автоматическая подсветка активной страницы -----
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';

    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Убираем якоря и параметры (если есть)
        const cleanHref = href ? href.split('?')[0].split('#')[0] : '';
        if (cleanHref === currentFile || (currentFile === '' && cleanHref === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // ----- 7. Обработка кнопки "Войти" -----
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    if (loginBtn) {
        // Проверяем, залогинен ли пользователь (заглушка)
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            loginText.textContent = 'Выйти';
        }

        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const currentStatus = loginText.textContent;
            if (currentStatus === 'Войти') {
                // Имитация входа
                localStorage.setItem('isLoggedIn', 'true');
                loginText.textContent = 'Выйти';
                alert('Вы вошли! (демо)');
            } else {
                // Выход
                localStorage.removeItem('isLoggedIn');
                loginText.textContent = 'Войти';
                alert('Вы вышли! (демо)');
            }
            // Закрываем меню, если оно открыто
            if (navMenu.classList.contains('active')) {
                toggleMenu(false);
            }
        });
    }
});
