// script.js
document.addEventListener('DOMContentLoaded', function () {
    // ======== НАСТРОЙКИ (измените здесь) ========
    const USER_NICK = 'Miless'; // <-- впишите свой ник
    const STATUS = 'completed'; // или 'watching', 'planned', 'rewatching'
    const LIMIT = 9999;           // максимум аниме для загрузки
    // ============================================

    const grid = document.getElementById('animeGrid');
    const modal = document.getElementById('playerModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const playerContainer = document.getElementById('playerContainer');

    // Закрытие модалки
    function closeModal() {
        modal.style.display = 'none';
        playerContainer.innerHTML = '<p id="loadingMsg">Загрузка видео...</p>';
    }
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    // Функция получения видео через AniLibria
    async function fetchVideoUrl(shikimoriId) {
        try {
            const response = await fetch(`https://api.anilibria.tv/v2/getTitle?shikimori_id=${shikimoriId}`);
            if (!response.ok) throw new Error('API недоступен');
            const data = await response.json();
            if (data.rutube && data.rutube.id) {
                return { embedUrl: `https://rutube.ru/embed/${data.rutube.id}/` };
            }
            if (data.video && data.video.url) {
                return { embedUrl: data.video.url };
            }
            return null;
        } catch (error) {
            console.error('Ошибка получения видео:', error);
            return null;
        }
    }

    // Загрузка списка аниме с Shikimori
    async function loadAnimeFromShikimori() {
        try {
            const url = `https://shikimori.one/api/users/${USER_NICK}/anime_rates?target_type=Anime&status=${STATUS}&limit=${LIMIT}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Не удалось загрузить список');
            const data = await response.json();
            // Преобразуем в нужный формат
            return data.map(item => ({
                id: item.anime.id,
                title: item.anime.name,
                russian: item.anime.russian,
                year: item.anime.year,
                genres: item.anime.genres.map(g => g.name).join(', '),
                poster: item.anime.image?.original || `https://shikimori.one/system/animes/original/${item.anime.id}.jpg`
            }));
        } catch (error) {
            console.error('Ошибка загрузки списка:', error);
            grid.innerHTML = '<p style="color: #ff6b6b; text-align:center; padding:2rem;">Не удалось загрузить список аниме. Проверьте ник и статус.</p>';
            return [];
        }
    }

    // Отрисовка карточек
    async function renderAnime() {
        const animeList = await loadAnimeFromShikimori();
        if (animeList.length === 0) {
            grid.innerHTML = '<p style="color: #a8b2d1; text-align:center; padding:2rem;">Нет аниме в выбранном статусе.</p>';
            return;
        }

        grid.innerHTML = ''; // очищаем

        animeList.forEach(anime => {
            const watchUrlFallback = `https://shikimori.one/animes/${anime.id}/watch`;
            const posterUrl = anime.poster;

            const card = document.createElement('div');
            card.className = 'anime-card';

            const img = document.createElement('img');
            img.src = posterUrl;
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

            card.addEventListener('click', async function () {
                modalTitle.textContent = anime.russian || anime.title;
                modal.style.display = 'block';
                playerContainer.innerHTML = '<p id="loadingMsg">Загружаем видео...</p>';

                const video = await fetchVideoUrl(anime.id);
                if (video) {
                    const iframe = document.createElement('iframe');
                    iframe.src = video.embedUrl;
                    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    iframe.loading = 'lazy';
                    playerContainer.innerHTML = '';
                    playerContainer.appendChild(iframe);
                } else {
                    const confirmOpen = confirm('Видео не найдено. Открыть страницу просмотра на Shikimori?');
                    if (confirmOpen) {
                        window.open(watchUrlFallback, '_blank');
                        closeModal();
                    } else {
                        playerContainer.innerHTML = '<p style="color: #ff6b6b; text-align:center; padding:2rem;">Видео недоступно.</p>';
                    }
                }
            });

            grid.appendChild(card);
        });
    }

    // Запуск
    renderAnime();
});
