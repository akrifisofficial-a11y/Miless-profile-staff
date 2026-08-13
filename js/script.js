// ============================================
//  УНИВЕРСАЛЬНЫЙ СКРИПТ ДЛЯ ГАМБУРГЕР-МЕНЮ
//  Работает на любой странице, где есть
//  элементы #hamburger и #navList
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Находим элементы меню
    const hamburger = document.getElementById('hamburger');
    const navList = document.getElementById('navList');
    const body = document.body;

    // Если на странице нет меню – выходим без ошибок
    if (!hamburger || !navList) return;

    // ----- 1. Переключение меню (открыть/закрыть) -----
    function toggleMenu(forceState) {
        const isOpen = typeof forceState === 'boolean' ? forceState : !navList.classList.contains('open');
        navList.classList.toggle('open', isOpen);
        hamburger.classList.toggle('open', isOpen);
        // Блокируем скролл фона, чтобы меню не мешало
        body.style.overflow = isOpen ? 'hidden' : '';
    }

    // ----- 2. Клик по гамбургеру -----
    hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMenu();
    });

    // ----- 3. Закрытие при клике на пункт меню (переход) -----
    const menuLinks = navList.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (navList.classList.contains('open')) {
                toggleMenu(false);
            }
        });
    });

    // ----- 4. Закрытие при клике вне меню -----
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.nav') && navList.classList.contains('open')) {
            toggleMenu(false);
        }
    });

    // ----- 5. Закрытие по клавише Escape -----
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navList.classList.contains('open')) {
            toggleMenu(false);
        }
    });

    // ----- 6. Закрытие при ресайзе окна (если ширина > 768px) -----
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768 && navList.classList.contains('open')) {
                toggleMenu(false);
            }
        }, 100);
    });

    // ----- 7. Автоматическая подсветка активной страницы -----
    // Получаем имя текущего файла (например, "anime.html" или "index.html")
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';

    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Если ссылка ведёт на текущую страницу (или на главную при пустом пути)
        if (href === currentFile || (currentFile === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
