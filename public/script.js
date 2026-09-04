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

function addToHistory(item) {
    let history = JSON.parse(localStorage.getItem("movieMatchHistory")) || [];
    history = history.filter(h => h.id !== item.id);
    history.unshift({ ...item, media_type_saved: currentMediaType });
    localStorage.setItem("movieMatchHistory", JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem("movieMatchHistory")) || [];
    if (!historyContainer) return;
    if (history.length === 0) {
        historyContainer.innerHTML = '<div class="loading">Belum ada riwayat tontonan.</div>';
        return;
    }
    displayItems(history, historyContainer, false);
}

function getFavorites() {
    return JSON.parse(localStorage.getItem("movieMatchFavorites")) || [];
}

function toggleFavorite(event, item) {
    event.stopPropagation();
    let favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.id === item.id);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push({ ...item, media_type_saved: currentMediaType });
    }

    localStorage.setItem("movieMatchFavorites", JSON.stringify(favorites));

    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'favorites-page') {
        showFavorites();
    } else {
        const btn = event.currentTarget;
        btn.classList.toggle('active');
        btn.innerHTML = favorites.some(f => f.id === item.id) ? '&#9829;' : '&#9825;';
    }
}

function showFavorites() {
    showPage('favorites-page');
    const favorites = getFavorites();
    if (!favoritesContainer) return;
    favoritesContainer.innerHTML = "";

    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<div class="loading">Belum ada tayangan favorit disimpan.</div>';
        return;
    }
    displayItems(favorites, favoritesContainer, false);
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

function getServerUrl(serverIdx, id, isMovie, season = 1, episode = 1) {
    const s = season;
    const e = episode;
    switch (serverIdx) {
        case 0:
            return isMovie ? `https://vidsrc.cc/v2/embed/movie/${id}?sub=id,en` : `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?sub=id,en`;
        case 1:
            return isMovie ? `https://vidsrc.cc/v2/embed/movie/${id}?sub=id,en` : `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?sub=id,en`;
        case 2:
            return isMovie ? `https://vidlink.pro/movie/${id}?sub=id,en` : `https://vidlink.pro/tv/${id}/${s}/${e}?sub=id,en`;
        case 3:
            return isMovie ? `https://vidsrc.xyz/embed/movie/${id}` : `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`;
        case 4:
            return isMovie ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`;
        case 5:
            return isMovie ? `https://multiembed.mov/?video_id=${id}&tmdb=1` : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
        case 6:
            return isMovie ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`;
        case 7:
            return isMovie ? `https://vidsrc.me/embed/movie/${id}` : `https://vidsrc.me/embed/tv/${id}/${s}/${e}`;
        case 8:
            return isMovie ? `https://embed.smashystream.com/playere.php?tmdb=${id}` : `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`;
        case 9:
            return isMovie ? `https://www.NontonGo.win/embed/movie/${id}` : `https://www.NontonGo.win/embed/tv/${id}/${s}/${e}`;
        case 10:
            return isMovie ? `https://febbox.com/embed/movie/${id}` : `https://febbox.com/embed/tv/${id}/${s}/${e}`;
        case 11:
            return isMovie ? `https://moviee.tv/embed/movie/${id}` : `https://moviee.tv/embed/tv/${id}/${s}/${e}`;
        case 12:
            return isMovie ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${s}/${e}`;
        default:
            return isMovie ? `https://vidsrc.cc/v2/embed/movie/${id}?sub=id,en` : `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?sub=id,en`;
    }
}
    
async function openModal(item) {
    addToHistory(item);

    const type = item.media_type_saved || currentMediaType;
    const isMovie = type === 'movie';
    const title = item.title || item.name || item.original_title || item.original_name || "Untitled";
    const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
    const releaseDate = item.release_date || item.first_air_date || "";
    const year = releaseDate ? releaseDate.substring(0, 4) : "N/A";

    activeItemId = item.id;
    activeSeason = 1;
    activeEpisode = 1;
    activeServerIndex = 0;

    currentOverviewEn = item.overview || "No description available.";
    currentOverviewId = "Sedang mengambil sinopsis...";

    const serverListNames = [
        "Server 1 (zxcstream)", "Server 2 (VidSrc)", "Server 3 (VidLink)", "Server 4 (VidSrc.xyz)", 
        "Server 5 (2Embed)", "Server 6 (SuperEmbed)", "Server 7 (AutoEmbed)", "Server 8 (VidSrc.me)", 
        "Server 9 (Smashy)", "Server 10 (NontonGo)", "Server 11 (Febbox)", "Server 12 (Moviee)", "Server 13 (EmbedSu)"
    ];

    let serverBtns = serverListNames.map((name, idx) => `
        <button onclick="changeServer(${idx})" class="server-btn" id="srv-btn-${idx}" style="padding:6px 12px; font-size:12px; background:${idx === 0 ? '#e50914' : '#2b2b2b'}; color:#fff; border:1px solid #444; border-radius:4px; cursor:pointer;">
            ${name}
        </button>
    `).join("");

    const initialVideoUrl = getServerUrl(0, item.id, isMovie, 1, 1);
    const encodedTitle = encodeURIComponent(title + " " + year + " watch online");

    modalBody.innerHTML = `
        <div class="modal-detail">
            <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin-bottom:15px; border-radius:8px; background:#000;">
                <iframe id="activeVideoIframe" src="${initialVideoUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen allow="autoplay; encrypted-media"></iframe>
            </div>

            <div style="background:#221818; border:1px solid #552222; padding:10px 14px; border-radius:8px; margin-bottom:15px; font-size:12px; color:#ffb3b3; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span>Tips Subtitle/Translate: Gunakan Server 1, 2, atau 3 (VidLink) yang sudah mendukung built-in subtitle multi-bahasa (ID/EN).</span>
                <a href="https://www.google.com/search?q=${encodedTitle}" target="_blank" style="color:#fff; background:#e50914; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:11px;">Cari Alternatif</a>
            </div>

            ${!isMovie ? `
            <div style="background:#111; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #333;">
                <h4 style="margin:0 0 10px 0; color:#e50914; font-size:15px;">Pilih Season & Episode Series:</h4>
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:10px;">
                    <label style="font-size:13px;">Season:</label>
                    <select id="seasonSelect" onchange="onSeasonChange(this.value)" style="padding:6px 10px; background:#222; color:#fff; border:1px solid #444; border-radius:4px; cursor:pointer; min-width:120px;">
                        <option value="1">Loading seasons...</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:13px; display:block; margin-bottom:6px;">Episode:</label>
                    <div id="episodeContainer" style="display:flex; gap:6px; flex-wrap:wrap; max-height:120px; overflow-y:auto; padding:6px; background:#1c1c1c; border-radius:6px; border:1px solid #333;">
                        <span style="font-size:12px; color:#888;">Memuat episode...</span>
                    </div>
                </div>
            </div>
            ` : ''}

            <div style="background:#181818; padding:12px; border-radius:8px; margin-bottom:15px;">
                <p style="margin:0 0 8px 0; font-size:13px; color:#aaa;">Pilih Server Pemutar Alternate:</p>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    ${serverBtns}
                    <button id="btnTrailer" class="server-btn" style="padding:6px 12px; font-size:12px; background:#2b2b2b; color:#fff; border:1px solid #444; border-radius:4px; cursor:not-allowed;" disabled>Loading Trailer...</button>
                </div>
            </div>

            <h2>${title} (${year})</h2>
            <p style="margin-top:8px;"><strong>Rating:</strong> &#9733; ${rating} / 10 | <strong>Kategori:</strong> ${isMovie ? 'Movie' : 'TV Series'}</p>
            
            <div style="margin-top:15px; background:#1f1f1f; padding:12px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="font-size:14px;">Overview / Sinopsis:</strong>
                    <div style="display:flex; gap:5px;">
                        <button id="btnLangId" onclick="switchLanguage('id')" style="padding:4px 8px; font-size:12px; background:#e50914; color:#fff; border:none; border-radius:4px; cursor:pointer;">ID</button>
                        <button id="btnLangEn" onclick="switchLanguage('en')" style="padding:4px 8px; font-size:12px; background:#333; color:#fff; border:none; border-radius:4px; cursor:pointer;">EN</button>
                    </div>
                </div>
                <p id="movieOverviewText" style="font-size:13px; line-height:1.5; color:#ddd; margin:0;">Loading...</p>
            </div>
        </div>
    `;

    movieModal.style.display = "flex";

    if (!isMovie) {
        fetchTVDetails(item.id);
    }

    try {
        const res = await fetch(`${BASE_URL}/${type}/${item.id}?api_key=${API_KEY}&language=id-ID`);
        const data = await res.json();
        currentOverviewId = (data.overview && data.overview.trim() !== "") ? data.overview : currentOverviewEn;
    } catch (err) {
        currentOverviewId = currentOverviewEn;
    }
    switchLanguage('id');

    try {
        const res = await fetch(`${BASE_URL}/${type}/${item.id}/videos?api_key=${API_KEY}&language=en-US`);
        const data = await res.json();
        const trailer = data.results.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
        const btnTrailer = document.getElementById("btnTrailer");

        if (trailer && btnTrailer) {
            btnTrailer.innerHTML = "Watch Trailer";
            btnTrailer.style.cursor = "pointer";
            btnTrailer.disabled = false;
            btnTrailer.onclick = () => {
                const iframe = document.getElementById("activeVideoIframe");
                if (iframe) iframe.src = `https://www.youtube.com/embed/${trailer.key}`;
                document.querySelectorAll(".server-btn").forEach(b => b.style.background = "#2b2b2b");
                btnTrailer.style.background = "#e50914";
            };
        } else if (btnTrailer) {
            btnTrailer.textContent = "Trailer N/A";
        }
    } catch (err) {
        console.error(err);
    }
}

async function fetchTVDetails(seriesId) {
    const seasonSelect = document.getElementById("seasonSelect");
    if (!seasonSelect) return;

    try {
        const res = await fetch(`${BASE_URL}/tv/${seriesId}?api_key=${API_KEY}&language=id-ID`);
        const data = await res.json();

        if (data.seasons && data.seasons.length > 0) {
            seasonSelect.innerHTML = "";
            const validSeasons = data.seasons.filter(s => s.season_number > 0);
            
            if (validSeasons.length === 0) validSeasons.push(data.seasons[0]);

            validSeasons.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.season_number;
                opt.textContent = `${s.name} (${s.episode_count} Eps)`;
                seasonSelect.appendChild(opt);
            });

            activeSeason = validSeasons[0].season_number;
            fetchEpisodes(seriesId, activeSeason);
        } else {
            seasonSelect.innerHTML = '<option value="1">Season 1</option>';
            fetchEpisodes(seriesId, 1);
        }
    } catch (err) {
        seasonSelect.innerHTML = '<option value="1">Season 1</option>';
        renderEpisodeButtons(10);
    }
}

async function fetchEpisodes(seriesId, seasonNum) {
    const epContainer = document.getElementById("episodeContainer");
    if (!epContainer) return;

    epContainer.innerHTML = '<span style="font-size:12px; color:#888;">Memuat episode...</span>';

    try {
        const res = await fetch(`${BASE_URL}/tv/${seriesId}/season/${seasonNum}?api_key=${API_KEY}&language=id-ID`);
        const data = await res.json();

        if (data.episodes && data.episodes.length > 0) {
            renderEpisodeButtons(data.episodes.length);
        } else {
            renderEpisodeButtons(10);
        }
    } catch (err) {
        renderEpisodeButtons(10);
    }
}

function renderEpisodeButtons(totalEpisodes) {
    const epContainer = document.getElementById("episodeContainer");
    if (!epContainer) return;

    epContainer.innerHTML = "";
    for (let i = 1; i <= totalEpisodes; i++) {
        const btn = document.createElement("button");
        btn.textContent = `Eps ${i}`;
        btn.className = "ep-btn";
        btn.style.cssText = `
            padding: 5px 10px;
            font-size: 12px;
            background: ${i === activeEpisode ? '#e50914' : '#2b2b2b'};
            color: #fff;
            border: 1px solid #444;
            border-radius: 4px;
            cursor: pointer;
        `;
        btn.onclick = () => selectEpisode(i);
        epContainer.appendChild(btn);
    }
}

function onSeasonChange(seasonNum) {
    activeSeason = parseInt(seasonNum);
    activeEpisode = 1;
    updatePlayerSource();
    fetchEpisodes(activeItemId, activeSeason);
}

function selectEpisode(epNum) {
    activeEpisode = parseInt(epNum);
    document.querySelectorAll(".ep-btn").forEach((btn, idx) => {
        btn.style.background = (idx + 1 === activeEpisode) ? '#e50914' : '#2b2b2b';
    });
    updatePlayerSource();
}

function changeServer(serverIdx) {
    activeServerIndex = serverIdx;
    document.querySelectorAll(".server-btn").forEach((b, idx) => {
        if (b.id === `srv-btn-${idx}`) {
            b.style.background = (idx === serverIdx) ? '#e50914' : '#2b2b2b';
        }
    });
    updatePlayerSource();
}

function updatePlayerSource() {
    const iframe = document.getElementById("activeVideoIframe");
    if (!iframe) return;

    const isMovie = currentMediaType === 'movie';
    const newUrl = getServerUrl(activeServerIndex, activeItemId, isMovie, activeSeason, activeEpisode);
    iframe.src = newUrl;
}

function switchLanguage(lang) {
    const text = document.getElementById("movieOverviewText");
    const btnId = document.getElementById("btnLangId");
    const btnEn = document.getElementById("btnLangEn");
    if (!text) return;

    if (lang === 'id') {
        text.textContent = currentOverviewId;
        btnId.style.background = "#e50914";
        btnEn.style.background = "#333";
    } else {
        text.textContent = currentOverviewEn;
        btnEn.style.background = "#e50914";
        btnId.style.background = "#333";
    }
}

function closeModal() {
    movieModal.style.display = "none";
    modalBody.innerHTML = "";
}

window.onclick = (e) => { if (e.target === movieModal) closeModal(); };

function displayItems(items, container = movieContainer, showPagination = true) {
    if (!container) return;
    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="loading">Tidak ada data ditemukan.</div>';
        const pElem = document.getElementById("pagination");
        if (pElem && showPagination) pElem.innerHTML = "";
        return;
    }

    const favorites = getFavorites();

    items.forEach(item => {
        const card = document.createElement("article");
        card.className = "movie-card";
        card.onclick = () => openModal(item);

        const poster = item.poster_path 
            ? `${IMAGE_URL}${item.poster
