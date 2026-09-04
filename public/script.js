const API_KEY = "c460f7483f7f090ecb7b0ebf0b214d50";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const SUPABASE_URL = "https://yratvqvtlixcvyciqrsg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable___KN08wXZeXaPpHU6z-DAQ_JbZXIoyj";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const movieContainer = document.getElementById("movieContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const historyContainer = document.getElementById("historyContainer");
const movieTitle = document.getElementById("movieTitle");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const movieModal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const navAuth = document.getElementById("nav-auth");

let currentPage = 1;
let currentMediaType = 'movie';
let currentFilterType = 'category';
let currentFilterParam = 'popular';

let activeItemId = null;
let activeSeason = 1;
let activeEpisode = 1;
let activeServerIndex = 0;

let currentOverviewEn = "";
let currentOverviewId = "";

document.addEventListener("DOMContentLoaded", () => {
    updateNavAuth();
    loadContent('popular', 1);
});

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("movieMatchCurrentUser"));
}

function updateNavAuth() {
    const currentUser = getCurrentUser();
    if (navAuth) {
        navAuth.textContent = currentUser ? "Profile" : "Login";
    }
}

function handleAuthClick() {
    getCurrentUser() ? showProfile() : showPage('login-page');
}

function toggleMenu() {
    const menuList = document.getElementById("menuList");
    if (menuList) {
        menuList.classList.toggle("active");
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo(0, 0);
}

function scrollToSection(sectionId) {
    showPage('home-page');
    setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function showProfile() {
    const user = getCurrentUser();
    if (!user) {
        showPage('login-page');
        return;
    }
    document.getElementById("profileWelcome").textContent = `Welcome, ${user.name}`;
    
    const statusBadge = document.getElementById("userStatusBadge");
    if (statusBadge) {
        const isPremium = user.isPremium || false; 
        statusBadge.textContent = isPremium ? "Status: Premium Member" : "Status: Free Member (Standar)";
        statusBadge.style.color = isPremium ? "#46f846" : "#aaa";
    }

    showPage('profile-page');
    loadHistory();
}

function logout() {
    localStorage.removeItem("movieMatchCurrentUser");
    updateNavAuth();
    showPage('home-page');
}

function setMediaType(type) {
    currentMediaType = type;
    
    const btnMovie = document.getElementById("typeBtnMovie");
    const btnTv = document.getElementById("typeBtnTv");

    if (btnMovie && btnTv) {
        if (type === 'movie') {
            btnMovie.style.background = "#e50914";
            btnMovie.style.color = "#fff";
            btnTv.style.background = "#222";
            btnTv.style.color = "#aaa";
        } else {
            btnTv.style.background = "#e50914";
            btnTv.style.color = "#fff";
            btnMovie.style.background = "#222";
            btnMovie.style.color = "#aaa";
        }
    }

    const runtimeSelect = document.getElementById("runtimeSelect");
    if (runtimeSelect) {
        runtimeSelect.style.display = (type === 'tv') ? 'none' : 'block';
    }

    loadContent('popular', 1);
}

async function loadContent(filterParam, page = 1) {
    currentFilterParam = filterParam;
    currentPage = page;
    if (movieContainer) {
        movieContainer.innerHTML = '<div class="loading">Loading content...</div>';
    }

    let url = `${BASE_URL}/trending/${currentMediaType}/day?api_key=${API_KEY}&page=${page}&language=id-ID`;
    if (filterParam === 'popular') {
        url = `${BASE_URL}/${currentMediaType}/popular?api_key=${API_KEY}&page=${page}&language=id-ID`;
    } else if (filterParam === 'top_rated') {
        url = `${BASE_URL}/${currentMediaType}/top_rated?api_key=${API_KEY}&page=${page}&language=id-ID`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        displayItems(data.results, movieContainer, true);
    } catch (err) {
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Gagal memuat data film. Coba periksa koneksi.</div>';
        }
    }
}

async function getMoviesByGenre(genreId, genreName) {
    if (!genreId) {
        loadContent(currentFilterParam, 1);
        return;
    }

    if (movieContainer) {
        movieContainer.innerHTML = '<div class="loading">Memuat genre...</div>';
    }
    if (movieTitle) {
        movieTitle.textContent = `Genre: ${genreName}`;
    }

    if (genreId === 'bl' || genreId === 'gl') {
        searchByQuery(genreId === 'bl' ? 'Boys Love' : 'Girls Love');
        return;
    }

    let url = `${BASE_URL}/discover/${currentMediaType}?api_key=${API_KEY}&with_genres=${genreId}&language=id-ID&page=1`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        displayItems(data.results, movieContainer, true);
    } catch (err) {
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Gagal memuat genre.</div>';
        }
    }
}

async function searchByQuery(query) {
    if (movieContainer) {
        movieContainer.innerHTML = '<div class="loading">Mencari...</div>';
    }
    if (movieTitle) {
        movieTitle.textContent = `Hasil Pencarian: "${query}"`;
    }

    let url = `${BASE_URL}/search/${currentMediaType}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=id-ID`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        displayItems(data.results, movieContainer, true);
    } catch (err) {
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Terjadi kesalahan saat mencari.</div>';
        }
    }
}

function displayItems(items, container = movieContainer, showPagination = true) {
    if (!container) return;
    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="loading">Tidak ada data ditemukan.</div>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement("article");
        card.className = "movie-card";
        card.onclick = () => openModal(item);

        const poster = item.poster_path 
            ? `${IMAGE_URL}${item.poster_path}` 
            : 'https://via.placeholder.com/300x450?text=No+Image';
        const title = item.title || item.name || item.original_title || item.original_name || "Untitled";
        const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
        const releaseDate = item.release_date || item.first_air_date || "";
        const year = releaseDate ? releaseDate.substring(0, 4) : "N/A";

        card.innerHTML = `
            <img src="${poster}" alt="${title}" loading="lazy">
            <div class="movie-info">
                <h3>${title}</h3>
                <p>${year} | &#9733; ${rating}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

async function openModal(item) {
    activeItemId = item.id;
    currentMediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    
    if (!movieModal || !modalBody) return;

    await addToHistory(item);

    const title = item.title || item.name || item.original_title || item.original_name || "Untitled";
    const overview = item.overview || "Tidak ada sinopsis tersedia.";
    const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
    const releaseDate = item.release_date || item.first_air_date || "N/A";

    const servers = [
        { name: "Zxcstream", url: `https://zxcstream.xyz/embed/${currentMediaType}/${activeItemId}` },
        { name: "VidSrc XYZ", url: `https://vidsrc.xyz/embed/${currentMediaType}?tmdb=${activeItemId}` },
        { name: "VidSrc ME", url: `https://vidsrc.me/embed/${currentMediaType}?tmdb=${activeItemId}` },
        { name: "Embed SU", url: `https://embed.su/embed/${currentMediaType}/${activeItemId}` },
        { name: "VidSrc CC", url: `https://vidsrc.cc/v2/embed/${currentMediaType}/${activeItemId}` },
        { name: "MultiEmbed", url: `https://multiembed.mov/?video_id=${activeItemId}&tmdb=1${currentMediaType === 'tv' ? '&s=1&e=1' : ''}` },
        { name: "AutoEmbed", url: `https://player.autoembed.cc/embed/${currentMediaType}/${activeItemId}` },
        { name: "2Embed", url: `https://2embed.cc/embed/${currentMediaType}/${activeItemId}` },
        { name: "MoviesAPI", url: `https://moviesapi.club/movie/${activeItemId}` },
        { name: "VidSrc VIP", url: `https://vidsrc.vip/embed/${currentMediaType}/${activeItemId}` },
        { name: "Anime-KKI", url: `https://anime-kki.herokuapp.com/embed/${activeItemId}` },
        { name: "VidSrc NL", url: `https://player.vidsrc.nl/embed/${currentMediaType}/${activeItemId}` },
        { name: "IDSrc TO", url: `https://idsrc.to/embed/${currentMediaType}/${activeItemId}` },
        { name: "VidSrc ICU", url: `https://vidsrc.icu/embed/${currentMediaType}/${activeItemId}` }
    ];

    modalBody.innerHTML = `
        <div class="modal-detail" style="display: flex; flex-direction: column; gap: 12px; position: relative;">
            <!-- Tombol Close (X) di pojok kanan atas -->
            <button onclick="closeMovieModal()" style="position: absolute; top: -5px; right: 0; background: #222; color: #fff; border: 1px solid #444; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">&times;</button>

            <!-- Tombol Pilihan Server -->
            <div style="display: flex; flex-direction: column; gap: 6px; padding-right: 35px;">
                <span style="color: #aaa; font-size: 13px; font-weight: bold;">Pilih Server:</span>
                <div id="serverButtons" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 100px; overflow-y: auto; padding: 4px; background: #111; border-radius: 6px; border: 1px solid #333;">
                    ${servers.map((s, index) => `
                        <button onclick="switchServer('${s.url}', this)" 
                            class="server-btn" 
                            style="padding: 5px 10px; background: ${index === 0 ? '#e50914' : '#222'}; color: #fff; border: 1px solid #444; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                            ${s.name}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; border-radius: 8px; overflow: hidden;">
                <iframe id="playerFrame" src="${servers[0].url}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allowfullscreen>
                </iframe>
            </div>

            <h2>${title}</h2>
            <p style="color: #aaa; font-size: 13px;">Rilis: ${releaseDate} | Rating: &#9733; ${rating}</p>
            <p style="line-height: 1.6; font-size: 14px; color: #ddd; max-height: 90px; overflow-y: auto;">${overview}</p>
            
            <div style="display: flex; gap: 10px; margin-top: 5px;">
                <button onclick='toggleFavoriteCurrent(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="padding: 8px 16px; background: #e50914; color: #fff; border: none; border-radius: 5px; cursor: pointer;">❤️ Favorit</button>
                <button onclick="closeMovieModal()" style="padding: 8px 16px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Tutup</button>
            </div>
        </div>
    `;

    movieModal.style.display = "flex";
}

function switchServer(url, clickedBtn) {
    const playerFrame = document.getElementById("playerFrame");
    if (playerFrame) {
        playerFrame.src = url;
    }

    const buttons = document.querySelectorAll("#serverButtons button");
    buttons.forEach(btn => {
        btn.style.background = "#222";
    });
    clickedBtn.style.background = "#e50914";
}

function closeMovieModal() {
    if (movieModal) {
        movieModal.style.display = "none";
        if (modalBody) modalBody.innerHTML = ""; 
    }
}

window.addEventListener("click", function(event) {
    if (event.target === movieModal) {
        closeMovieModal();
    }
});

async function toggleFavoriteCurrent(item) {
    const user = getCurrentUser();
    if (!user) {
        alert("Silakan login terlebih dahulu untuk menyimpan ke Favorit!");
        showPage('login-page');
        closeMovieModal();
        return;
    }

    const movieId = item.id;
    const title = item.title || item.name || "Untitled";
    const posterPath = item.poster_path || "";
    const voteAverage = item.vote_average || 0;
    const releaseDate = item.release_date || item.first_air_date || "";

    const { data: existing } = await supabaseClient
        .from('favorites')
        .select('*')
        .eq('user_email', user.email)
        .eq('movie_id', movieId);

    if (existing && existing.length > 0) {
        await supabaseClient
            .from('favorites')
            .delete()
            .eq('user_email', user.email)
            .eq('movie_id', movieId);
        alert("Dihapus dari Favorit.");
    } else {
        const { error } = await supabaseClient
            .from('favorites')
            .insert([{ 
                user_email: user.email, 
                movie_id: movieId, 
                title: title, 
                poster_path: posterPath,
                vote_average: voteAverage,
                release_date: releaseDate,
                media_type: currentMediaType
            }]);
        
        if (!error) {
            alert("Berhasil ditambahkan ke Favorit!");
        }
    }
}

async function showFavorites() {
    showPage('favorites-page');
    const user = getCurrentUser();
    const container = document.getElementById("favoritesContainer");
    
    if (!user) {
        if (container) container.innerHTML = '<div class="loading">Silakan login untuk melihat halaman favorites.</div>';
        return;
    }

    if (container) container.innerHTML = '<div class="loading">Memuat favorites...</div>';

    const { data: favs, error } = await supabaseClient
        .from('favorites')
        .select('*')
        .eq('user_email', user.email);

    if (error) {
        if (container) container.innerHTML = '<div class="loading">Gagal memuat data dari server.</div>';
        return;
    }

    displayItems(favs, container, false);
}

async function addToHistory(item) {
    const user = getCurrentUser();
    if (!user) return;

    const movieId = item.id;
    const title = item.title || item.name || "Untitled";
    const posterPath = item.poster_path || "";
    const releaseDate = item.release_date || item.first_air_date || "";

    await supabaseClient
        .from('history')
        .delete()
        .eq('user_email', user.email)
        .eq('movie_id', movieId);

    await supabaseClient
        .from('history')
        .insert([{
            user_email: user.email,
            movie_id: movieId,
            title: title,
            poster_path: posterPath,
            release_date: releaseDate,
            media_type: currentMediaType
        }]);
}

async function loadHistory() {
    const user = getCurrentUser();
    const container = document.getElementById("historyContainer");
    if (!container || !user) return;

    container.innerHTML = '<div class="loading">Memuat riwayat...</div>';

    const { data: historyItems, error } = await supabaseClient
        .from('history')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = '<div class="loading">Gagal memuat riwayat tayangan.</div>';
        return;
    }

    displayItems(historyItems, container, false);
}
