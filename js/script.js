document.addEventListener('DOMContentLoaded', function () {
    // ================= НАСТРОЙКИ (если нужен API - раскомментируйте) =================
    // const USER_NICK = 'Miless';   // для API
    // const STATUS = 'completed';                // для API
    // const LIMIT = 9999;                          // для API
    // ===========================================================

    // ----- ГАМБУРГЕР -----
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    const body = document.body;
    if (toggle && menu) {
        function toggleMenu(force) {
            const isOpen = (force !== undefined) ? force : !menu.classList.contains('active');
            menu.classList.toggle('active', isOpen);
            toggle.classList.toggle('active', isOpen);
            body.style.overflow = isOpen ? 'hidden' : '';
        }
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleMenu();
        });
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                if (menu.classList.contains('active')) toggleMenu(false);
            });
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.navbar') && menu.classList.contains('active')) {
                toggleMenu(false);
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('active')) toggleMenu(false);
        });
        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768 && menu.classList.contains('active')) {
                    toggleMenu(false);
                }
            }, 100);
        });
        // Подсветка активной страницы
        const current = window.location.pathname.split('/').pop() || 'index.html';
        menu.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === current) link.classList.add('active');
            else link.classList.remove('active');
        });
    }

    // ----- КНОПКА "ВОЙТИ" (демо) -----
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    if (loginBtn && loginText) {
        const logged = localStorage.getItem('isLoggedIn') === 'true';
        loginText.textContent = logged ? 'Выйти' : 'Войти';
        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (loginText.textContent === 'Войти') {
                localStorage.setItem('isLoggedIn', 'true');
                loginText.textContent = 'Выйти';
                alert('Демо-вход выполнен');
            } else {
                localStorage.removeItem('isLoggedIn');
                loginText.textContent = 'Войти';
                alert('Демо-выход');
            }
            if (menu && menu.classList.contains('active')) toggleMenu(false);
        });
    }

    // ----- ЗАГРУЗКА АНИМЕ ИЗ JSON-ФАЙЛА -----
    const grid = document.getElementById('animeGrid');
    if (!grid) return; // если контейнера нет – выходим

    async function loadAnime() {
        try {
            // Здесь указываем путь к вашему JSON-файлу (он должен лежать в той же папке)
            const response = await fetch('anime_rates.json');
            if (!response.ok) throw new Error('Файл anime.json не найден или недоступен');
            const data = await response.json();

            // Если данные приходят в формате, как от API Shikimori:
            // data = [ { anime: { id, name, russian, year, genres, image } }, ... ]
            // Тогда маппинг ниже подойдёт.
            // Если у вас другой формат – адаптируйте return.
            return data.map(item => ({
                id: item.anime.id,
                title: item.anime.name,
                russian: item.anime.russian,
                year: item.anime.year,
                genres: item.anime.genres.map(g => g.name).join(', '),
                poster: item.anime.image?.original || `https://shikimori.one/system/animes/original/${item.anime.id}.jpg`
            }));
        } catch (error) {
            console.error('Ошибка загрузки JSON:', error);
            grid.innerHTML = '<p style="color:#ff6b6b;text-align:center;padding:2rem;">Не удалось загрузить данные. Проверьте файл anime.json.</p>';
            return [];
        }
    }

    // ----- ОТРИСОВКА КАРТОЧЕК (общая для всех страниц) -----
    async function renderAnime() {
        const list = await loadAnime();
        if (list.length === 0) {
            grid.innerHTML = '<p style="color:#a8b2d9;text-align:center;padding:2rem;">Список аниме пуст.</p>';
            return;
        }
        grid.innerHTML = '';
        list.forEach((anime, index) => {
            const url = `https://shikimori.one/animes/${anime.id}`;
            const card = document.createElement('div');
            card.className = 'anime-card';
            card.style.animationDelay = `${index * 0.06}s`;

            const img = document.createElement('img');
            img.src = anime.poster;
            img.alt = anime.title;
            img.loading = 'lazy';
            img.onerror = function () {
                this.style.background = '#2a2a4a';
                this.style.objectFit = 'contain';
                this.style.padding = '1rem';
                this.src = '';
            };

            const info = document.createElement('div');
            info.className = 'anime-info';

            const title = document.createElement('h3');
            title.textContent = anime.russian || anime.title;

            const year = document.createElement('div');
            year.className = 'year';
            year.textContent = anime.year || '—';

            const genre = document.createElement('span');
            genre.className = 'genre';
            genre.textContent = anime.genres || 'Жанр не указан';

            info.appendChild(title);
            info.appendChild(year);
            info.appendChild(genre);

            card.appendChild(img);
            card.appendChild(info);

            card.addEventListener('click', () => window.open(url, '_blank'));

            grid.appendChild(card);
        });
    }

    renderAnime();
});
