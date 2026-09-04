const API_KEY = "c460f7483f7f090ecb7b0ebf0b214d50";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const BACKEND_URL = "/api";

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

function openModal(item) {
    activeItemId = item.id;
    currentMediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    
    if (!movieModal || !modalBody) return;

    const title = item.title || item.name || item.original_title || item.original_name || "Untitled";
    const overview = item.overview || "Tidak ada sinopsis tersedia.";
    const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
    const releaseDate = item.release_date || item.first_air_date || "N/A";

    modalBody.innerHTML = `
        <div class="modal-detail" style="display: flex; flex-direction: column; gap: 15px;">
            <div style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; border-radius: 8px; overflow: hidden;">
                <iframe src="https://vidsrc.xyz/embed/${currentMediaType}?tmdb=${activeItemId}" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                    allowfullscreen>
                </iframe>
            </div>
            <h2>${title}</h2>
            <p style="color: #aaa; font-size: 13px;">Rilis: ${releaseDate} | Rating: &#9733; ${rating}</p>
            <p style="line-height: 1.6; font-size: 14px; color: #ddd;">${overview}</p>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="closeMovieModal()" style="padding: 10px 20px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Tutup</button>
            </div>
        </div>
    `;

    movieModal.style.display = "flex";
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
}); `;
        container.appendChild(card);
    });
}
