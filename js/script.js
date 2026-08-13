document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburger');
    const navList = document.getElementById('navList');
    const body = document.body;

    // Если элементов нет – выходим
    if (!hamburger || !navList) return;

    // Функция открытия/закрытия меню
    function toggleMenu(forceState) {
        const isOpen = typeof forceState === 'boolean' ? forceState : !navList.classList.contains('open');
        navList.classList.toggle('open', isOpen);
        hamburger.classList.toggle('open', isOpen);
        // Блокировка скролла фона (для мобильных)
        body.style.overflow = isOpen ? 'hidden' : '';
    }

    // Клик по гамбургеру
    hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleMenu();
    });

    // Закрытие при клике на пункт меню
    const menuLinks = navList.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (navList.classList.contains('open')) {
                toggleMenu(false);
            }
        });
    });

    // Закрытие при клике вне меню
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.nav') && navList.classList.contains('open')) {
            toggleMenu(false);
        }
    });

    // Закрытие по клавише Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navList.classList.contains('open')) {
            toggleMenu(false);
        }
    });

    // Закрытие при ресайзе окна (если ширина > 768px – меню скрывается)
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 768 && navList.classList.contains('open')) {
                toggleMenu(false);
            }
        }, 100);
    });

    // ===== Подсветка активной страницы по URL =====
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    menuLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
