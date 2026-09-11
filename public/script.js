const API_KEY = "c460f7483f7f090ecb7b0ebf0b214d50";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNDYwZjc0ODNmN2YwOTBlY2I3YjBlYmYwYjIxNGQ1MCIsIm5iZiI6MTc4ODQ3NDYyMi44OTYsInN1YiI6IjZhOTlmNGZlNTZlODkxMjg0OTgzZGRkOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ULTfSl002E5c4EXvAj9uIE4f_tFJMP98SBGGQEdEerE";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const SUPABASE_URL = "https://yratvqvtlixcvyciqrsg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable___KN08wXZeXaPpHU6z-DAQ_JbZXIoyj";
const OPENSUBTITLES_API_KEY = "C3oTYqRkJtvkZFVR4r361m0zFfInJcom";

let supabaseClient = null;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Supabase SDK tidak tersedia. Fitur login/favorit/history akan dinonaktifkan.");
    }
} catch (err) {
    console.error("Gagal inisialisasi Supabase:", err);
}

try {
    if (typeof emailjs !== 'undefined' && emailjs.init) {
        emailjs.init("ZDbFZUevZv9Hfi1xo");
    }
} catch (err) {
    console.warn("EmailJS tidak tersedia:", err);
}

const movieContainer = document.getElementById("movieContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const watchlistContainer = document.getElementById("watchlistContainer");
const historyContainer = document.getElementById("historyContainer");
const movieTitle = document.getElementById("movieTitle");
const catalogTitle = document.getElementById("catalogTitle");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const movieModal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const navAuth = document.getElementById("nav-auth");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");

const companyCache = new Map();
const runtimeCache = new Map();

let currentPage = 1;
let currentMediaType = 'movie';
let currentFilterType = 'category';
let currentFilterParam = 'popular';
let currentGenrePage = 1;
let currentGenreId = '';
let currentGenreName = '';
let activeItemId = null;
let activeSeason = 1;
let activeEpisode = 1;
let activeServerIndex = 0;
let otpEmail = '';
let otpTimer = null;
let isMoodSearch = false;

let currentStudioPage = 1;
let currentStudioId = '';
let currentStudioType = '';
let currentStudioName = '';
let isStudioLoading = false;
let studioTotalPages = 1;

let currentDetailItem = null;
let playerItemId = null;
let playerMediaType = 'movie';
let currentOverviewEn = "";
let currentOverviewId = "";
let isOverviewTranslated = false;

let currentSeasonData = null;
let currentEpisodeData = null;
let playerProgressInterval = null;
let playerCurrentTime = 0;
let playerDuration = 0;
let playerProgress = 0;
let savedProgress = {};

let searchInfinitePage = 1;
let searchInfiniteTotalPages = 1;
let searchInfiniteQuery = '';
let isSearchInfiniteLoading = false;
let searchObserver = null;
let studioObserver = null;

let activeSort = 'default';
let activeLanguage = 'all';
let activeYearFilter = 'all';
let activeRuntimeFilter = 'all';

const ICON_TRANSLATE = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"/></svg>`;
const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`;
const ICON_LOADING = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;animation:spin 1s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>`;

document.addEventListener("DOMContentLoaded", () => {
    loadSavedProgress();
    updateNavAuth();
    loadContent('popular', 1);
    loadNowPlaying();
    loadAiringToday();

    if (searchForm) {
        searchForm.addEventListener("submit", function(e) {
            e.preventDefault();
            if (searchInput && searchInput.value.trim() !== "") {
                searchByQuery(searchInput.value.trim());
            }
        });
    }

    if (supabaseClient) {
        supabaseClient
            .channel('users-channel')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'users' },
                (payload) => { console.log('User baru daftar:', payload.new); }
            )
            .subscribe();
    }

    const otpVerifyBtn = document.getElementById("otpVerifyBtn");
    if (otpVerifyBtn) {
        otpVerifyBtn.addEventListener("click", async function() {
            const code = document.getElementById("otpInput").value.trim();
            if (code.length !== 6) {
                document.getElementById("otpMessage").textContent = "Masukkan kode 6 digit!";
                return;
            }
            const verified = await verifyOTP(otpEmail, code);
            if (verified) {
                document.getElementById("otpMessage").textContent = "Login berhasil!";
                setTimeout(() => showPage('home-page'), 500);
            } else {
                document.getElementById("otpMessage").textContent = "Kode OTP salah atau kadaluarsa!";
            }
        });
    }

    const resendBtn = document.getElementById("resendOtpBtn");
    if (resendBtn) {
        resendBtn.addEventListener("click", async function(e) {
            e.preventDefault();
            const sent = await sendOTP(otpEmail);
            if (sent) {
                document.getElementById("otpMessage").textContent = "Kode OTP telah dikirim ulang!";
                startResendTimer();
            } else {
                document.getElementById("otpMessage").textContent = "Gagal mengirim ulang OTP. Coba lagi.";
            }
        });
    }

    const passInput = document.getElementById("registerPassword");
    if (passInput) {
        passInput.addEventListener("input", function() {
            const strength = checkPasswordStrength(this.value);
            updateStrengthUI(strength);
        });
    }

    const suggestBtn = document.getElementById("suggestPassBtn");
    if (suggestBtn) {
        suggestBtn.addEventListener("click", function() {
            const password = generateStrongPassword();
            if (passInput) {
                passInput.value = password;
                passInput.dispatchEvent(new Event('input'));
            }
        });
    }

    setTimeout(() => {
        loadLandingSlider();
        loadTopTen();
        loadTopRated();
        loadContinueWatching();
    }, 500);

    setupKeyboardShortcuts();
});

const originalFetch = window.fetch;
window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    if (url && (url.includes('ads') || url.includes('doubleclick') || url.includes('googlead'))) {
        console.warn("Ngeblokir fetch iklan:", url);
        return Promise.reject(new Error("Blokir iklan"));
    }
    return originalFetch.call(this, input, init);
};

const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    if (url && (url.includes('ads') || url.includes('doubleclick') || url.includes('googlead'))) {
        console.warn("Ngeblokir XHR iklan:", url);
        return;
    }
    return originalXHROpen.apply(this, arguments);
};

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem("movieMatchCurrentUser")); }
    catch { return null; }
}

function updateNavAuth() {
    const currentUser = getCurrentUser();
    if (navAuth) navAuth.textContent = currentUser ? "Profile" : "Login";
}

function handleAuthClick() {
    getCurrentUser() ? showProfile() : showPage('login-page');
}

function toggleMenu() {
    const menuList = document.getElementById("menuList");
    if (menuList) menuList.classList.toggle("active");
}

function goToCatalog() { showPage('catalog-page'); loadContent('popular', 1); }
function goTosearch() { showPage('search-page'); loadContent('popular', 1); }
function recommendMoodAndGo(mood) { showPage('search-page'); isMoodSearch = true; recommendMood(mood, 1); }

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    if (pageId === 'home-page') {
        currentGenreId = '';
        currentGenreName = '';
        currentGenrePage = 1;
        isMoodSearch = false;
        if (movieTitle) movieTitle.textContent = currentMediaType === 'movie' ? "Popular Movies" : "Popular Series";
        const searchInputEl = document.getElementById("searchInput");
        if (searchInputEl) searchInputEl.value = "";
        setTimeout(() => {
            loadLandingSlider();
            loadTopTen();
            loadTopRated();
            loadContinueWatching();
            loadNowPlaying();
            loadAiringToday();
        }, 300);
    }

    if (pageId === 'search-page') {
        if (!isMoodSearch) {
            if (catalogTitle) catalogTitle.textContent = "Pilih Kategori Tayangan";
            loadContent('popular', 1);
        }
    }

    window.scrollTo(0, 0);
}

function showProfile() {
    const user = getCurrentUser();
    if (!user) { showPage('login-page'); return; }
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
    showToast("Berhasil logout", "success");
    showPage('home-page');
}

function setMediaType(type) {
    currentMediaType = type;
    currentGenreId = '';
    currentGenreName = '';
    currentGenrePage = 1;

    const btnMovie = document.getElementById("typeBtnMovie");
    const btnTv = document.getElementById("typeBtnTv");
    if (btnMovie && btnTv) {
        btnMovie.style.background = type === 'movie' ? "#e50914" : "#222";
        btnMovie.style.color = type === 'movie' ? "#fff" : "#aaa";
        btnTv.style.background = type === 'tv' ? "#e50914" : "#222";
        btnTv.style.color = type === 'tv' ? "#fff" : "#aaa";
    }

    const runtimeSelect = document.getElementById("runtimeSelect");
    if (runtimeSelect) runtimeSelect.style.display = (type === 'tv') ? 'none' : 'block';

    loadContent('popular', 1);
}

function buildDiscoverUrl(baseUrl, page, filterParam) {
    let url = baseUrl;
    let params = [`language=id-ID`, `page=${page}`, `include_adult=false`];

    if (activeLanguage !== 'all') params.push(`with_original_language=${activeLanguage}`);

    if (activeSort !== 'default') {
        params.push(`sort_by=${activeSort}`);
    } else {
        params.push(`sort_by=popularity.desc`);
    }

    if (activeYearFilter !== 'all' && currentMediaType === 'movie') {
        params.push(`primary_release_year=${activeYearFilter}`);
    }

    if (activeRuntimeFilter !== 'all' && currentMediaType === 'movie') {
        if (activeRuntimeFilter === 'short') params.push(`with_runtime.lte=90`);
        else if (activeRuntimeFilter === 'medium') params.push(`with_runtime.gte=90&with_runtime.lte=120`);
        else if (activeRuntimeFilter === 'long') params.push(`with_runtime.gte=120`);
    }

    return `${url}?${params.join('&')}`;
}

async function loadContent(filterParam, page = 1) {
    currentGenreId = '';
    currentGenreName = '';
    currentGenrePage = 1;
    currentFilterParam = filterParam;
    currentPage = page;
    isMoodSearch = false;

    if (catalogTitle) catalogTitle.textContent = "Pilih Kategori Tayangan";

    history.pushState({ category: filterParam, page: page }, "", `?category=${filterParam}&page=${page}`);

    if (movieContainer) showSkeletonLoader(movieContainer, 8);

    let url = `${BASE_URL}/trending/${currentMediaType}/day?page=${page}&language=id-ID`;
    if (filterParam === 'popular') {
        url = buildDiscoverUrl(`${BASE_URL}/discover/${currentMediaType}`, page, filterParam);
    } else if (filterParam === 'top_rated') {
        url = `${BASE_URL}/${currentMediaType}/top_rated?page=${page}&language=id-ID`;
    } else if (filterParam === 'now_playing') {
        url = currentMediaType === 'movie'
            ? `${BASE_URL}/movie/now_playing?page=${page}&language=id-ID`
            : `${BASE_URL}/tv/on_the_air?page=${page}&language=id-ID`;
    } else if (filterParam === 'airing_today') {
        url = `${BASE_URL}/tv/airing_today?page=${page}&language=id-ID`;
    } else if (filterParam === 'trending') {
        url = `${BASE_URL}/trending/${currentMediaType}/week?page=${page}&language=id-ID`;
    }

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        let results = data.results || [];
        results = applyClientFilters(results);
        await displayItems(results, movieContainer, true);
        scrollToMovies();
    } catch (err) {
        console.error("Error:", err);
        if (movieContainer) movieContainer.innerHTML = '<div class="loading">Gagal memuat data film. Coba periksa koneksi.</div>';
    }
}

function applyClientFilters(items) {
    let results = [...items];
    if (activeYearFilter !== 'all') {
        results = results.filter(i => {
            const date = i.release_date || i.first_air_date || "";
            return date.startsWith(String(activeYearFilter));
        });
    }
    return results;
}

async function loadNowPlaying() {
    const container = document.getElementById("nowPlayingContainer");
    if (!container) return;
    try {
        const res = await fetch(`${BASE_URL}/movie/now_playing?page=1&language=id-ID`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        await displayItems((data.results || []).slice(0, 10), container, false);
    } catch (err) { console.error("Error now playing:", err); }
}

async function loadAiringToday() {
    const container = document.getElementById("airingTodayContainer");
    if (!container) return;
    try {
        const res = await fetch(`${BASE_URL}/tv/airing_today?page=1&language=id-ID`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        await displayItems((data.results || []).slice(0, 10), container, false);
    } catch (err) { console.error("Error airing today:", err); }
}

function showSkeletonLoader(container, count = 8) {
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "skeleton";
        skeleton.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
        `;
        container.appendChild(skeleton);
    }
}

async function searchByQuery(query) {
    searchInfiniteQuery = query;
    searchInfinitePage = 1;
    isSearchInfiniteLoading = false;

    if (movieContainer) showSkeletonLoader(movieContainer, 8);
    if (movieTitle) movieTitle.textContent = `Hasil Pencarian: "${query}"`;

    history.pushState({ search: query }, "", `?search=${encodeURIComponent(query)}`);

    let url = `${BASE_URL}/search/${currentMediaType}?query=${encodeURIComponent(query)}&language=id-ID&page=1`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        const data = await res.json();
        searchInfiniteTotalPages = Math.min(data.total_pages || 1, 20);
        await displayItems(data.results, movieContainer, true);
        scrollToMovies();
        setupInfiniteScrollSearch();
    } catch (err) {
        if (movieContainer) movieContainer.innerHTML = '<div class="loading">Terjadi kesalahan saat mencari.</div>';
    }
}

function setupInfiniteScrollSearch() {
    if (searchObserver) { searchObserver.disconnect(); searchObserver = null; }
    const oldSentinel = document.getElementById('infiniteSentinel');
    if (oldSentinel) { oldSentinel.remove(); }

    if (!searchInfiniteQuery) return;
    if (searchInfinitePage >= searchInfiniteTotalPages) return;

    const sentinel = document.getElementById('infiniteSentinel');
    if (!sentinel) return;

    sentinel.style.display = 'flex';
    sentinel.innerHTML = '<div class="loader"></div>';

    searchObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isSearchInfiniteLoading) {
            loadMoreSearchResults();
        }
    }, { rootMargin: '300px' });

    searchObserver.observe(sentinel);
}

async function loadMoreSearchResults() {
    if (isSearchInfiniteLoading) return;
    if (searchInfinitePage >= searchInfiniteTotalPages) return;
    if (!searchInfiniteQuery) return;

    isSearchInfiniteLoading = true;
    searchInfinitePage++;

    const url = `${BASE_URL}/search/${currentMediaType}?query=${encodeURIComponent(searchInfiniteQuery)}&language=id-ID&page=${searchInfinitePage}`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const newItems = await createItemElements(data.results);
            newItems.forEach(item => movieContainer.appendChild(item));
        }
        isSearchInfiniteLoading = false;
        setupInfiniteScrollSearch();
    } catch (err) {
        console.error("Error load more search:", err);
        isSearchInfiniteLoading = false;
    }
}

window.addEventListener("popstate", function(event) {
    if (event.state && event.state.genre) { showPage('home-page'); return; }
    if (event.state && event.state.search) {
        const searchInputEl = document.getElementById("searchInput");
        if (searchInputEl) searchInputEl.value = event.state.search;
        searchByQuery(event.state.search);
        return;
    }
    if (event.state && event.state.category) {
        loadContent(event.state.category, event.state.page || 1);
        return;
    }
    showPage('home-page');
});

function scrollToMovies() {
    const moviesSection = document.getElementById('movies');
    if (moviesSection) {
        setTimeout(() => moviesSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
}

async function displayItems(items, container = movieContainer, showPagination = true) {
    if (!container) return;
    container.innerHTML = "";
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="loading">Tidak ada data ditemukan.</div>';
        return;
    }

    const isFromSupabase = items[0]?.user_email !== undefined;

    for (const item of items) {
        const card = document.createElement("article");
        card.className = "movie-card";
        card.onclick = () => openDetail(item);

        if (!isFromSupabase) {
            if (!companyCache.has(item.id)) {
                const mediaType = item.media_type || currentMediaType;
                fetchMovieDetails(item.id, mediaType).catch(() => {});
            }
        }

        const poster = item.poster_path && item.poster_path.length > 3
            ? `${IMAGE_URL}${item.poster_path}`
            : 'https://via.placeholder.com/300x450?text=No+Image';

        const title = item.title || item.name || "Untitled";
        const originalTitle = item.original_title || item.original_name || "";
        const displaySubTitle = (originalTitle && originalTitle !== title)
            ? `<span style="font-size: 11px; color: #888; display: block; margin-top: 2px;">${escapeHtml(originalTitle)}</span>`
            : "";

        const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
        const releaseDate = item.release_date || item.first_air_date || "";
        const year = releaseDate ? releaseDate.substring(0, 4) : "N/A";

        let countryText = "";
        const lang = item.original_language;
        if (lang === 'ko') countryText = "🇰🇷 Korea";
        else if (lang === 'ja') countryText = "🇯🇵 Jepang";
        else if (lang === 'zh' || lang === 'cn') countryText = "🇨🇳 China";
        else if (lang === 'th') countryText = "🇹🇭 Thailand";
        else if (lang === 'en') countryText = "🇺🇸/🇬🇧 Barat";
        else if (lang === 'id') countryText = "🇮🇩 Indonesia";
        else if (lang === 'fr') countryText = "🇫🇷 Prancis";
        else if (lang === 'es') countryText = "🇪🇸 Spanyol";
        else countryText = lang ? lang.toUpperCase() : "";

        card.innerHTML = `
            <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-info">
                <h3>${escapeHtml(title)}</h3>
                ${displaySubTitle}
                <p style="margin-top: 4px;">${year} ${countryText ? `| ${countryText}` : ""} | &#9733; ${rating}</p>
            </div>
        `;
        container.appendChild(card);
    }
}

function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

async function fetchMovieDetails(itemId, mediaType) {
    if (companyCache.has(itemId)) return companyCache.get(itemId);
    const url = `${BASE_URL}/${mediaType}/${itemId}?language=id-ID`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        const data = await res.json();
        const companies = data.production_companies || [];
        companyCache.set(itemId, companies);
        if (data.runtime) runtimeCache.set(itemId, data.runtime);
        return companies;
    } catch (err) {
        console.error("Error fetch detail:", err);
        return [];
    }
}

async function fetchRuntime(itemId, mediaType) {
    if (runtimeCache.has(itemId)) return runtimeCache.get(itemId);
    try {
        const res = await fetch(`${BASE_URL}/${mediaType}/${itemId}?language=en-US`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        const runtime = data.runtime || (data.episode_run_time && data.episode_run_time[0]) || 0;
        runtimeCache.set(itemId, runtime);
        return runtime;
    } catch { return 0; }
}

function addGenrePagination(totalPages, currentPage) {
    const oldPagination = document.getElementById('genrePagination');
    if (oldPagination) oldPagination.remove();
    if (totalPages <= 1) return;

    const container = movieContainer.parentNode;
    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'genrePagination';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; font-size: 14px; color: #aaa;';

    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '‹';
        prevBtn.style.cssText = 'background: none; border: none; color: #888; font-size: 24px; cursor: pointer; padding: 0 8px;';
        prevBtn.onclick = () => getMoviesByGenre(currentGenreId, currentGenreName, currentPage - 1);
        paginationDiv.appendChild(prevBtn);
    }
    const info = document.createElement('span');
    info.textContent = `${currentPage} / ${totalPages}`;
    info.style.cssText = 'color: #888; font-size: 13px;';
    paginationDiv.appendChild(info);

    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '›';
        nextBtn.style.cssText = 'background: none; border: none; color: #888; font-size: 24px; cursor: pointer; padding: 0 8px;';
        nextBtn.onclick = () => getMoviesByGenre(currentGenreId, currentGenreName, currentPage + 1);
        paginationDiv.appendChild(nextBtn);
    }
    container.appendChild(paginationDiv);
}

async function getMoviesByGenre(genreId, genreName, page = 1) {
    if (!genreId) { loadContent(currentFilterParam, 1); return; }

    currentGenreId = genreId;
    currentGenreName = genreName;
    currentGenrePage = page;

    history.pushState({ genre: genreId, genreName: genreName, page: page }, "", `?genre=${genreId}&page=${page}`);
    if (movieContainer) showSkeletonLoader(movieContainer, 8);

    const moodNames = ['happy', 'scary', 'action', 'sad', 'chill'];
    const isMood = moodNames.includes(genreName.toLowerCase());

    if (movieTitle) {
        if (isMood) {
            const moodDisplay = {
                happy: 'Happy / Senang',
                scary: 'Scary / Takut',
                action: 'Exciting / Seru',
                sad: 'Emotional / Perasaan',
                chill: 'Relaxed / Rileks'
            };
            movieTitle.textContent = `Mood: ${moodDisplay[genreName.toLowerCase()] || genreName} - Halaman ${page}`;
        } else {
            movieTitle.textContent = `Genre: ${genreName} - Halaman ${page}`;
        }
    }

    if (genreId === 'bl' || genreId === 'gl') {
        searchByQuery(genreId === 'bl' ? 'Boys Love' : 'Girls Love');
        return;
    }

    let url = `${BASE_URL}/discover/${currentMediaType}?with_genres=${genreId}&language=id-ID&page=${page}`;
    if (activeSort !== 'default') url += `&sort_by=${activeSort}`;
    if (activeLanguage !== 'all') url += `&with_original_language=${activeLanguage}`;

    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        const data = await res.json();
        let results = applyClientFilters(data.results || []);
        await displayItems(results, movieContainer, true);
        addGenrePagination(data.total_pages, page);
        scrollToMovies();
    } catch (err) {
        if (movieContainer) movieContainer.innerHTML = '<div class="loading">Gagal memuat genre.</div>';
    }
}

function filterByStudio(value) {
    if (value === 'all') { showPage('search-page'); loadContent(currentFilterParam, currentPage); return; }

    const studioData = {
        'netflix': { id: 213, type: 'network', name: 'NETFLIX' },
        'prime': { id: 1024, type: 'network', name: 'PRIME VIDEO' },
        'shudder': { id: 521, type: 'network', name: 'SHUDDER' },
        'amc': { id: 174, type: 'network', name: 'AMC' },
        'cn': { id: 56, type: 'network', name: 'CARTOON NETWORK' },
        'blumhouse': { id: 33, type: 'company', name: 'BLUMHOUSE' },
        'marvel': { id: 420, type: 'company', name: 'MARVEL STUDIOS' },
        'dreamworks': { id: 521, type: 'company', name: 'DREAMWORKS' },
        'pixar': { id: 3, type: 'company', name: 'PIXAR' },
        'a24': { id: 110, type: 'company', name: 'A24' }
    };

    const data = studioData[value];
    if (!data) { showPage('search-page'); loadContent(currentFilterParam, currentPage); return; }

    showPage('search-page');
    currentStudioId = data.id;
    currentStudioType = data.type;
    currentStudioName = data.name;
    currentStudioPage = 1;
    isStudioLoading = false;

    const filterParam = data.type === 'network' ? 'with_networks' : 'with_companies';
    const mediaType = data.type === 'network' ? 'tv' : 'movie';
    const url = `${BASE_URL}/discover/${mediaType}?${filterParam}=${data.id}&language=id-ID&page=1&sort_by=popularity.desc`;

    if (movieContainer) showSkeletonLoader(movieContainer, 8);
    if (movieTitle) movieTitle.textContent = `${data.name} - Exclusive Content`;
    if (catalogTitle) catalogTitle.textContent = `${data.name} - Exclusive Content`;

    fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } })
        .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
        .then(data => {
            if (!data.results || data.results.length === 0) {
                if (movieContainer) movieContainer.innerHTML = '<div class="loading">Tidak ada konten dari platform ini.</div>';
                return;
            }
            studioTotalPages = Math.min(data.total_pages, 20);
            displayItems(data.results, movieContainer, true);
            addStudioInfiniteScroll();
            scrollToMovies();
        })
        .catch(err => {
            console.error("Error:", err);
            if (movieContainer) movieContainer.innerHTML = '<div class="loading">Gagal memuat data: ' + escapeHtml(err.message) + '</div>';
        });
}

function addStudioInfiniteScroll() {
    if (studioObserver) { studioObserver.disconnect(); studioObserver = null; }
    const oldSentinel = document.getElementById('studioSentinel');
    if (oldSentinel) oldSentinel.remove();

    if (currentStudioPage >= studioTotalPages) return;

    const sentinel = document.createElement('div');
    sentinel.id = 'studioSentinel';
    sentinel.style.cssText = 'display: flex; justify-content: center; align-items: center; padding: 20px; width: 100%;';
    sentinel.innerHTML = '<div class="loader" style="width:30px;height:30px;border:3px solid transparent;border-top:3px solid #e50914;border-bottom:3px solid #e50914;border-radius:50%;animation:spin 1s linear infinite;"></div>';
    movieContainer.parentNode.appendChild(sentinel);

    studioObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isStudioLoading) loadMoreStudioContent();
    }, { rootMargin: '200px' });
    studioObserver.observe(sentinel);
}

function loadMoreStudioContent() {
    if (isStudioLoading) return;
    if (currentStudioPage >= studioTotalPages) return;
    isStudioLoading = true;
    currentStudioPage++;

    const filterParam = currentStudioType === 'network' ? 'with_networks' : 'with_companies';
    const mediaType = currentStudioType === 'network' ? 'tv' : 'movie';
    const url = `${BASE_URL}/discover/${mediaType}?${filterParam}=${currentStudioId}&language=id-ID&page=${currentStudioPage}&sort_by=popularity.desc`;

    fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } })
        .then(res => res.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                createItemElements(data.results).then(newItems => {
                    const sentinel = document.getElementById('studioSentinel');
                    if (sentinel) sentinel.remove();
                    newItems.forEach(item => movieContainer.appendChild(item));
                    isStudioLoading = false;
                    addStudioInfiniteScroll();
                });
            } else {
                const sentinel = document.getElementById('studioSentinel');
                if (sentinel) sentinel.remove();
                isStudioLoading = false;
            }
        })
        .catch(err => { console.error("Error loading more studio content:", err); isStudioLoading = false; });
}

async function createItemElements(items) {
    const elements = [];
    for (const item of items) {
        const card = document.createElement("article");
        card.className = "movie-card";
        const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
        const title = item.title || item.name || "Untitled";
        const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
        const year = (item.release_date || item.first_air_date || "").substring(0, 4) || "N/A";
        card.innerHTML = `
            <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-info">
                <h3>${escapeHtml(title)}</h3>
                <p>${year} | &#9733; ${rating}</p>
            </div>
        `;
        card.onclick = () => openDetail(item);
        elements.push(card);
    }
    return elements;
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

    const servers = buildServersList(currentMediaType, activeItemId, 1, 1);

    modalBody.innerHTML = `
        <div class="modal-detail" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <span style="color: #aaa; font-size: 13px; font-weight: bold;">Pilih Server:</span>
                <div id="serverButtons" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 100px; overflow-y: auto; padding: 4px; background: #111; border-radius: 6px; border: 1px solid #333;">
                    ${servers.map((s, index) => `
                        <button onclick="switchServer('${s.url}', this)"
                            class="server-btn"
                            style="padding: 5px 10px; background: ${index === 0 ? '#e50914' : '#222'}; color: #fff; border: 1px solid #444; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                            ${escapeHtml(s.name)}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; border-radius: 8px; overflow: hidden;">
                <iframe id="playerFrame" src="${servers[0].url}"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                    allowfullscreen>
                </iframe>
            </div>
            <h2>${escapeHtml(title)}</h2>
            <p style="color: #aaa; font-size: 13px;">Rilis: ${escapeHtml(releaseDate)} | Rating: &#9733; ${rating}</p>
            <p style="line-height: 1.6; font-size: 14px; color: #ddd; max-height: 90px; overflow-y: auto;">${escapeHtml(overview)}</p>
            <div style="display: flex; gap: 10px; margin-top: 5px;">
                <button onclick='toggleFavoriteCurrent(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="padding: 8px 16px; background: #e50914; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Favorit</button>
                <button onclick="closeMovieModal()" style="padding: 8px 16px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Tutup</button>
            </div>
        </div>
    `;

    movieModal.style.display = "flex";
}

function buildServersList(mediaType, id, season = 1, episode = 1) {
    return [
        { name: "VidSrc XYZ", url: `https://vidsrc.xyz/embed/${mediaType}?tmdb=${id}${mediaType === 'tv' ? `&season=${season}&episode=${episode}` : ''}` },
        { name: "VidSrc ME", url: `https://vidsrc.me/embed/${mediaType}?tmdb=${id}${mediaType === 'tv' ? `&season=${season}&episode=${episode}` : ''}` },
        { name: "Embed SU", url: `https://embed.su/embed/${mediaType}/${id}${mediaType === 'tv' ? `/${season}/${episode}` : ''}` },
        { name: "VidSrc CC", url: `https://vidsrc.cc/v2/embed/${mediaType}/${id}${mediaType === 'tv' ? `/${season}/${episode}` : ''}` },
        { name: "MultiEmbed", url: `https://multiembed.mov/?video_id=${id}&tmdb=1${mediaType === 'tv' ? `&s=${season}&e=${episode}` : ''}` },
        { name: "AutoEmbed", url: `https://player.autoembed.cc/embed/${mediaType}/${id}` },
        { name: "2Embed", url: `https://2embed.cc/embed/${mediaType}/${id}` },
        { name: "MoviesAPI", url: `https://moviesapi.club/movie/${id}` },
        { name: "VidSrc VIP", url: `https://vidsrc.vip/embed/${mediaType}/${id}` },
        { name: "VidSrc NL", url: `https://player.vidsrc.nl/embed/${mediaType}/${id}` },
        { name: "IDSrc TO", url: `https://idsrc.to/embed/${mediaType}/${id}` },
        { name: "VidSrc ICU", url: `https://vidsrc.icu/embed/${mediaType}/${id}` },
        { name: "Main Server 1", url: mediaType === 'movie' ? `https://vidstuck.xyz/embed/movie/${id}?branding=zxcstream&subtitle=english` : `https://vidstuck.xyz/embed/tv/${id}/${season}/${episode}?branding=zxcstream&subtitle=english` },
        { name: "Main Server 2", url: mediaType === 'movie' ? `https://zxcstream.xyz/player/movie/${id}?server=0&subLang=english,indonesian` : `https://zxcstream.xyz/player/tv/${id}/${season}/${episode}?server=0&subLang=english,indonesian` },
        { name: "Server Alpha", url: mediaType === 'movie' ? `https://vidup.to/movie/${id}?autoPlay=true&theme=FF0000` : `https://vidup.to/tv/${id}/${season}/${episode}?autoPlay=true&theme=FF0000` },
        { name: "Server Beta", url: mediaType === 'movie' ? `https://mappletv.uk/watch/movie/${id}` : `https://mappletv.uk/watch/tv/${id}-${season}-${episode}` },
        { name: "Server Delta", url: mediaType === 'movie' ? `https://111movies.com/movie/${id}` : `https://111movies.com/tv/${id}/${season}/${episode}` },
        { name: "Server Zeta", url: mediaType === 'movie' ? `https://vidsrc.xyz/embed/movie/${id}` : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` }
    ];
}

function switchServer(url, clickedBtn) {
    const playerFrame = document.getElementById("playerFrame");
    if (playerFrame) playerFrame.src = url;
    const buttons = document.querySelectorAll("#serverButtons button");
    buttons.forEach(btn => btn.style.background = "#222");
    clickedBtn.style.background = "#e50914";
}

function closeModal() { closeMovieModal(); }
function closeMovieModal() {
    if (movieModal) {
        movieModal.style.display = "none";
        if (modalBody) modalBody.innerHTML = "";
    }
}
window.addEventListener("click", function(event) { if (event.target === movieModal) closeMovieModal(); });

async function getSubtitle(imdbId, lang = 'id') {
    if (!imdbId) return null;
    const url = `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId}&languages=${lang}`;
    try {
        const res = await fetch(url, { headers: { 'Api-Key': OPENSUBTITLES_API_KEY, 'User-Agent': 'MovieMatchApp v1.0' } });
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

async function downloadSubtitle(fileId) {
    if (!fileId) return null;
    try {
        const res = await fetch(`https://api.opensubtitles.com/api/v1/download/${fileId}`, {
            headers: { 'Api-Key': OPENSUBTITLES_API_KEY, 'User-Agent': 'MovieMatchApp v1.0' }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.link;
    } catch { return null; }
}

async function toggleFavoriteCurrent(item) {
    const user = getCurrentUser();
    if (!user) {
        showToast("Silakan login terlebih dahulu untuk menyimpan ke Favorit!", "error");
        showPage('login-page');
        closeMovieModal();
        return;
    }
    if (!supabaseClient) {
        showToast("Server tidak tersedia. Coba lagi nanti.", "error");
        return;
    }

    const movieId = item.id;
    const title = item.title || item.name || "Untitled";
    const posterPath = item.poster_path || "";
    const voteAverage = item.vote_average || 0;
    const releaseDate = item.release_date || item.first_air_date || "";

    const { data: existing } = await supabaseClient
        .from('favorites').select('*').eq('user_email', user.email).eq('movie_id', movieId);

    if (existing && existing.length > 0) {
        await supabaseClient.from('favorites').delete().eq('user_email', user.email).eq('movie_id', movieId);
        showToast("Dihapus dari Favorit.", "info");
    } else {
        const { error } = await supabaseClient.from('favorites').insert([{
            user_email: user.email, movie_id: movieId, title, poster_path: posterPath,
            vote_average: voteAverage, release_date: releaseDate, media_type: currentMediaType
        }]);
        if (!error) showToast("Berhasil ditambahkan ke Favorit!", "success");
        else showToast("Gagal menyimpan favorit.", "error");
    }
}

async function showFavorites() {
    showPage('favorites-page');
    const user = getCurrentUser();
    const container = document.getElementById("favoritesContainer");
    if (!container) return;
    if (!user) { container.innerHTML = '<div class="loading">Silakan login untuk melihat halaman favorites.</div>'; return; }
    if (!supabaseClient) { container.innerHTML = '<div class="loading">Server tidak tersedia.</div>'; return; }
    container.innerHTML = '<div class="loading">Memuat favorites...</div>';
    const { data: favs, error } = await supabaseClient.from('favorites').select('*').eq('user_email', user.email);
    if (error) { container.innerHTML = '<div class="loading">Gagal memuat data dari server.</div>'; return; }
    if (!favs || favs.length === 0) { container.innerHTML = '<div class="loading">Belum ada film favorit.</div>'; return; }
    await displayItems(favs, container, false);
}

function getWatchlist() {
    try { return JSON.parse(localStorage.getItem("movieMatchWatchlist")) || []; }
    catch { return []; }
}
function saveWatchlist(watchlist) { localStorage.setItem("movieMatchWatchlist", JSON.stringify(watchlist)); }

function toggleWatchlist(itemId, mediaType, buttonElement) {
    let watchlist = getWatchlist();
    const exists = watchlist.some(w => w.id === itemId);

    if (exists) {
        watchlist = watchlist.filter(w => w.id !== itemId);
        if (buttonElement) { buttonElement.classList.remove("active"); buttonElement.innerHTML = "☆"; }
        showToast("Dihapus dari Watchlist", "info");
    } else {
        watchlist.push({ id: itemId, media_type: mediaType });
        if (buttonElement) { buttonElement.classList.add("active"); buttonElement.innerHTML = "★"; }
        showToast("Ditambahkan ke Watchlist", "success");
    }
    saveWatchlist(watchlist);
}

function showWatchlist() {
    showPage('watchlist-page');
    const container = document.getElementById('watchlistContainer');
    if (!container) return;
    const watchlist = getWatchlist();
    if (watchlist.length === 0) {
        container.innerHTML = '<div class="loading">Watchlist masih kosong. Tambahkan film atau series dari halaman detail.</div>';
        return;
    }
    container.innerHTML = '<div class="loading">Memuat watchlist...</div>';
    Promise.all(watchlist.map(async (w) => {
        try {
            const res = await fetch(`${BASE_URL}/${w.media_type}/${w.id}?language=id-ID`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            return await res.json();
        } catch { return null; }
    })).then(items => {
        const validItems = items.filter(i => i && i.id);
        if (validItems.length === 0) { container.innerHTML = '<div class="loading">Tidak ada item valid di watchlist.</div>'; return; }
        displayItems(validItems, container, false);
    });
}

function showToast(message, type = "info", duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

function showNotification(message, type = "success") { showToast(message, type); }

async function addToHistory(item) {
    const user = getCurrentUser();
    if (!user || !supabaseClient) return;

    const movieId = item.id;
    const title = item.title || item.name || "Untitled";
    const posterPath = item.poster_path || "";
    const releaseDate = item.release_date || item.first_air_date || "";
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const voteAverage = item.vote_average || 0;

    try {
        const { data: existing } = await supabaseClient
            .from('history').select('id').eq('user_email', user.email).eq('movie_id', movieId).eq('media_type', mediaType);

        if (existing && existing.length > 0) {
            await supabaseClient.from('history').update({
                title, poster_path: posterPath, release_date: releaseDate,
                vote_average: voteAverage, created_at: new Date().toISOString()
            }).eq('id', existing[0].id);
        } else {
            await supabaseClient.from('history').insert([{
                user_email: user.email, movie_id: movieId, title, poster_path: posterPath,
                release_date: releaseDate, media_type: mediaType, vote_average: voteAverage
            }]);
        }
    } catch (err) { console.error("Error addToHistory:", err); }
}

function searchMovies() {
    if (searchInput && searchInput.value.trim() !== "") searchByQuery(searchInput.value.trim());
}
function handleSearch(event) {
    if (event.key === 'Enter') { event.preventDefault(); searchMovies(); }
}

async function loadHistory() {
    const user = getCurrentUser();
    const container = document.getElementById("historyContainer");
    if (!container || !user || !supabaseClient) return;
    container.innerHTML = '<div class="loading">Memuat riwayat...</div>';
    try {
        const { data: historyItems, error } = await supabaseClient
            .from('history').select('*').eq('user_email', user.email).order('created_at', { ascending: false });
        if (error) { container.innerHTML = '<div class="loading">Gagal memuat riwayat tayangan.</div>'; return; }
        if (!historyItems || historyItems.length === 0) { container.innerHTML = '<div class="loading">Belum ada riwayat tayangan.</div>'; return; }
        await displayItems(historyItems, container, false);
    } catch (err) { container.innerHTML = '<div class="loading">Gagal memuat riwayat tayangan.</div>'; }
}

async function sendOTP(email) {
    if (!supabaseClient) return false;
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const { error } = await supabaseClient.from('otp').insert([{
            email: email, code: code, expires_at: new Date(Date.now() + 5 * 60000)
        }]);
        if (error) { console.error("Gagal simpan OTP:", error); return false; }
        if (typeof emailjs !== 'undefined') {
            await emailjs.send("service_m3kjfyn", "template_fbc55ps", { to_email: email, otp_code: code });
        }
        return true;
    } catch (err) { console.error("Error send OTP:", err); return false; }
}

async function verifyOTP(email, code) {
    if (!supabaseClient) return false;
    const { data, error } = await supabaseClient.from('otp').select('*')
        .eq('email', email).eq('code', code).eq('used', false).gt('expires_at', new Date().toISOString());
    if (error || !data || data.length === 0) return false;

    await supabaseClient.from('otp').update({ used: true }).eq('id', data[0].id);

    const { data: users } = await supabaseClient.from('users').select('*').eq('email', email);
    const userData = users && users.length > 0 ? users[0] : { email: email };
    localStorage.setItem("movieMatchCurrentUser", JSON.stringify(userData));
    updateNavAuth();

    currentGenreId = ''; currentGenreName = ''; currentGenrePage = 1;
    showPage('home-page');
    loadContent('popular', 1);
    return true;
}

function startResendTimer() {
    let seconds = 60;
    const btn = document.getElementById("resendOtpBtn");
    if (!btn) return;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.5';
    if (otpTimer) clearInterval(otpTimer);
    otpTimer = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(otpTimer);
            btn.textContent = 'Kirim ulang';
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        } else { btn.textContent = `Kirim ulang (${seconds}s)`; }
    }, 1000);
}

if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        if (!supabaseClient) { document.getElementById("loginMessage").textContent = "Server tidak tersedia."; return; }
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const { data: users, error } = await supabaseClient.from('users').select('*').eq('email', email).eq('password', password);
        if (error || !users || users.length === 0) {
            document.getElementById("loginMessage").textContent = "Email atau password salah!";
            return;
        }
        otpEmail = email;
        const sent = await sendOTP(email);
        if (sent) {
            document.getElementById("loginMessage").textContent = "Kode OTP telah dikirim ke email Anda!";
            showPage('otp-page');
            document.getElementById("otpMessage").textContent = "Kode OTP dikirim ke " + email;
            document.getElementById("otpInput").value = "";
            startResendTimer();
        } else {
            document.getElementById("loginMessage").textContent = "Gagal mengirim OTP. Coba lagi.";
        }
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        if (!supabaseClient) { document.getElementById("registerMessage").textContent = "Server tidak tersedia."; return; }
        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        const { data: existing } = await supabaseClient.from('users').select('*').eq('email', email);
        if (existing && existing.length > 0) {
            document.getElementById("registerMessage").textContent = "Email sudah terdaftar!";
            return;
        }
        const { error } = await supabaseClient.from('users').insert([{ name, email, password }]);
        if (error) { document.getElementById("registerMessage").textContent = "Error: " + error.message; return; }

        otpEmail = email;
        const sent = await sendOTP(email);
        if (sent) {
            document.getElementById("registerMessage").textContent = "Registrasi berhasil! Kode OTP telah dikirim ke email Anda.";
            showPage('otp-page');
            document.getElementById("otpMessage").textContent = "Kode OTP dikirim ke " + email;
            document.getElementById("otpInput").value = "";
            startResendTimer();
        } else {
            document.getElementById("registerMessage").textContent = "Registrasi berhasil, tapi gagal mengirim OTP. Silakan login.";
            showPage('login-page');
        }
    });
}

async function recommendMood(mood, page = 1) {
    const genreMap = {
        happy: [35, 10751, 16], scary: [27, 53], action: [28, 12, 878], sad: [18, 10749], chill: [10751, 35]
    };
    const genreIds = genreMap[mood] || [35, 10751];
    const genreId = genreIds.join(',');

    currentGenreId = genreId;
    currentGenreName = mood;
    currentGenrePage = page;

    history.pushState({ genre: mood, page: page }, "", `?mood=${mood}&page=${page}`);

    const moodNames = { happy: 'Happy / Senang', scary: 'Scary / Takut', action: 'Exciting / Seru', sad: 'Emotional / Perasaan', chill: 'Relaxed / Rileks' };

    if (catalogTitle) catalogTitle.textContent = `Mood: ${moodNames[mood] || mood}`;
    if (movieTitle) movieTitle.textContent = `Mood: ${moodNames[mood] || mood} - Halaman ${page}`;
    if (movieContainer) showSkeletonLoader(movieContainer, 8);

    let url = `${BASE_URL}/discover/${currentMediaType}?with_genres=${genreId}&language=id-ID&page=${page}&sort_by=popularity.desc`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        const data = await res.json();
        await displayItems(data.results, movieContainer, true);
        addGenrePagination(data.total_pages, page);
        scrollToMovies();
    } catch (err) {
        if (movieContainer) movieContainer.innerHTML = '<div class="loading">Gagal memuat rekomendasi mood.</div>';
    }
}

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return Math.min(score, 4);
}

function updateStrengthUI(score) {
    const strBar1 = document.getElementById("strBar1");
    const strBar2 = document.getElementById("strBar2");
    const strBar3 = document.getElementById("strBar3");
    const strBar4 = document.getElementById("strBar4");
    const strText = document.getElementById("strText");
    const bars = [strBar1, strBar2, strBar3, strBar4];
    const labels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];

    bars.forEach((bar, index) => {
        if (bar) bar.style.background = index < score ? colors[score] : '#333';
    });
    if (strText) {
        strText.textContent = labels[score] || 'Ketik password...';
        strText.style.color = colors[score] || '#888';
    }
}

function generateStrongPassword() {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const specials = '!@#$%^&*()_+-=';
    const all = lower + upper + digits + specials;
    let pass = lower[Math.floor(Math.random() * lower.length)] +
               upper[Math.floor(Math.random() * upper.length)] +
               digits[Math.floor(Math.random() * digits.length)] +
               specials[Math.floor(Math.random() * specials.length)];
    for (let i = 4; i < 16; i++) pass += all[Math.floor(Math.random() * all.length)];
    return pass.split('').sort(() => Math.random() - 0.5).join('');
}

document.addEventListener('click', function(event) {
    const iframe = document.getElementById('playerFrame');
    if (iframe && iframe.contains(event.target)) event.stopPropagation();
}, true);

window.open = function(url) { console.warn("Pop-up iklan berhasil ditahan:", url); return null; };

async function filterByYear(value) {
    activeYearFilter = value;
    const cards = document.querySelectorAll('.movie-card');
    if (!cards || cards.length === 0) return;
    if (value === 'all') {
        cards.forEach(card => card.style.display = '');
        return;
    }
    cards.forEach(card => {
        const yearText = card.querySelector('.movie-info p')?.textContent || '';
        const match = yearText.match(/\b(19|20)\d{2}\b/);
        const year = match ? parseInt(match[0]) : 0;
        card.style.display = (year === parseInt(value)) ? '' : 'none';
    });
}

async function filterByRuntime(value) {
    activeRuntimeFilter = value;
    const cards = document.querySelectorAll('.movie-card');
    if (!cards || cards.length === 0) return;
    if (value === 'all') { cards.forEach(card => card.style.display = ''); return; }

    for (const card of cards) {
        card.style.display = 'none';
    }
    showToast("Filter durasi diterapkan di kategori utama. Silakan buka kategori film.", "info");
}

function filterByLanguage(value) {
    activeLanguage = value;
    if (currentGenreId) getMoviesByGenre(currentGenreId, currentGenreName, 1);
    else loadContent(currentFilterParam, 1);
}

function applySort(value) {
    activeSort = value;
    if (currentGenreId) getMoviesByGenre(currentGenreId, currentGenreName, 1);
    else loadContent(currentFilterParam, 1);
}

function shareMovie(title, overview, poster) {
    const url = window.location.href;
    const shareData = { title, text: title + '\n' + overview.substring(0, 100) + '...\n\nWatch on MovieMatch', url };
    if (navigator.share) navigator.share(shareData).catch(() => {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(shareData.text + ' ' + shareData.url), '_blank');
}

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        this.textContent = isLight ? '\u2600' : '\u263E';
        localStorage.setItem('movieMatchTheme', isLight ? 'light' : 'dark');
    });
    const savedTheme = localStorage.getItem('movieMatchTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '\u2600';
    }
}

async function loadLandingSlider() {
    const container = document.getElementById("landingSlider");
    const dotsContainer = document.getElementById("landingDots");
    if (!container) return;
    container.innerHTML = '<div class="loading">Memuat rekomendasi...</div>';

    try {
        const [trendingRes, popularRes] = await Promise.all([
            fetch(`${BASE_URL}/trending/all/week?language=en-US`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } }),
            fetch(`${BASE_URL}/movie/popular?language=en-US&page=1`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } })
        ]);
        const trending = await trendingRes.json();
        const popular = await popularRes.json();
        const allItems = [...(trending.results || []), ...(popular.results || [])];
        const unique = [];
        const seen = new Set();
        for (const item of allItems) {
            if (!seen.has(item.id)) { seen.add(item.id); unique.push(item); }
        }
        const items = unique.slice(0, 6);

        container.innerHTML = "";
        dotsContainer.innerHTML = "";

        let currentIndex = 0;
        let slideInterval;

        items.forEach((item, index) => {
            const slide = document.createElement("div");
            slide.className = "landing-slide";
            slide.style.display = index === 0 ? "flex" : "none";
            slide.dataset.index = index;

            const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";
            const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : poster;
            const title = item.title || item.name || "Untitled";
            const year = (item.release_date || item.first_air_date || "").substring(0, 4) || "N/A";
            const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
            const overview = item.overview || "Tidak ada sinopsis.";
            const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");

            const genreNames = item.genre_ids && item.genre_ids.length > 0
                ? item.genre_ids.slice(0, 2).map(id => {
                    const genres = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 27: "Horror", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller", 10752: "War", 37: "Western" };
                    return genres[id] || "";
                }).filter(Boolean).join(", ") : "";

            slide.innerHTML = `
                <img class="backdrop" src="${backdrop}" alt="${escapeHtml(title)}" loading="lazy">
                <div class="overlay"></div>
                <div class="info">
                    <span class="badge">${mediaType === "tv" ? "TV Series" : "Movie"}</span>
                    <h2>${escapeHtml(title)}</h2>
                    <div class="meta">
                        <span>${year}</span>
                        ${rating !== "N/A" ? `<span>${rating}</span>` : ""}
                        ${genreNames ? `<span>${genreNames}</span>` : ""}
                    </div>
                    <p class="overview">${escapeHtml(overview)}</p>
                    <div class="btn-group">
                        <button class="btn-play" onclick="playNow(${item.id}, '${mediaType}')">Tonton</button>
                        <button class="btn-trailer" onclick="playTrailer(${item.id}, '${mediaType}', this)">Trailer</button>
                        <button class="btn-details" onclick='openDetailFromLanding(${item.id}, "${mediaType}")'>Detail</button>
                    </div>
                </div>
            `;
            container.appendChild(slide);

            const dot = document.createElement("span");
            dot.className = `dot ${index === 0 ? "active" : ""}`;
            dot.dataset.index = index;
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        });

        function goToSlide(index) {
            const slides = container.querySelectorAll(".landing-slide");
            const dots = dotsContainer.querySelectorAll(".dot");
            slides.forEach((s, i) => s.style.display = i === index ? "flex" : "none");
            dots.forEach((d, i) => d.classList.toggle("active", i === index));
            currentIndex = index;
            resetTimer();
        }
        function nextSlide() {
            const slides = container.querySelectorAll(".landing-slide");
            goToSlide((currentIndex + 1) % slides.length);
        }
        function prevSlide() {
            const slides = container.querySelectorAll(".landing-slide");
            goToSlide((currentIndex - 1 + slides.length) % slides.length);
        }
        function resetTimer() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000);
        }

        document.getElementById("landingPrev").onclick = prevSlide;
        document.getElementById("landingNext").onclick = nextSlide;
        resetTimer();

        container.querySelectorAll(".landing-slide .backdrop").forEach(img => {
            if (img.complete) img.classList.add("backdrop-loaded");
            else img.onload = () => img.classList.add("backdrop-loaded");
        });
    } catch (err) {
        console.error("Error loading landing slider:", err);
        container.innerHTML = '<div class="loading">Gagal memuat rekomendasi.</div>';
    }
}

async function openDetailFromLanding(id, mediaType) {
    try {
        const res = await fetch(`${BASE_URL}/${mediaType}/${id}?language=en-US`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const item = await res.json();
        item.media_type = mediaType;
        openDetail(item);
    } catch (err) { console.error("Error:", err); }
}

function playNow(id, mediaType) {
    fetch(`${BASE_URL}/${mediaType}/${id}?language=en-US`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } })
        .then(res => res.json())
        .then(item => { item.media_type = mediaType; openDetail(item); })
        .catch(err => console.error("Error:", err));
}

async function playTrailer(id, mediaType, button) {
    try {
        const res = await fetch(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
        const data = await res.json();
        const trailer = data.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) {
            const trailerUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
            const slide = button.closest(".landing-slide");
            const info = slide.querySelector(".info");
            const existingTrailer = slide.querySelector(".trailer-container");
            if (existingTrailer) { existingTrailer.remove(); info.style.display = "block"; return; }
            info.style.display = "none";
            const trailerContainer = document.createElement("div");
            trailerContainer.className = "trailer-container";
            trailerContainer.style.cssText = `position: relative; z-index: 2; width: 100%; max-width: 800px; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden;`;
            trailerContainer.innerHTML = `
                <iframe src="${trailerUrl}" style="width:100%;height:100%;border:none;" allowfullscreen allow="autoplay; encrypted-media"></iframe>
                <button onclick="closeTrailer(this)" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 12px;border-radius:4px;">X</button>
            `;
            slide.appendChild(trailerContainer);
        } else { showToast("Trailer tidak tersedia", "error"); }
    } catch (err) { showToast("Gagal memuat trailer", "error"); }
}

function closeTrailer(btn) {
    const container = btn.closest(".trailer-container");
    const slide = container.closest(".landing-slide");
    const info = slide.querySelector(".info");
    container.remove();
    info.style.display = "block";
}

async function loadTopTen() {
    const container = document.getElementById("topTenContainer");
    if (!container) return;
    container.innerHTML = '<div class="loading">Memuat Top 10...</div>';
    try {
        const res = await fetch(`${BASE_URL}/trending/all/week?language=en-US`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        const data = await res.json();
        const items = (data.results || []).slice(0, 10);
        container.innerHTML = "";

        for (const [index, item] of items.entries()) {
            const div = document.createElement("div");
            div.className = "top-ten-item";
            const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";
            const title = item.title || item.name || "Untitled";
            const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");

            let director = "Unknown", stars = "No cast data";
            try {
                const detailRes = await fetch(`${BASE_URL}/${mediaType}/${item.id}/credits?language=en-US`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
                const detailData = await detailRes.json();
                const crew = detailData.crew || [];
                const directorObj = crew.find(c => c.job === "Director");
                if (directorObj) director = directorObj.name;
                const cast = detailData.cast || [];
                const topCast = cast.slice(0, 3).map(c => c.name);
                stars = topCast.length > 0 ? topCast.join(", ") : "No cast data";
            } catch (err) { console.warn("Gagal ambil detail credits:", err); }

            div.innerHTML = `
                <span class="number">${index + 1}</span>
                <div class="poster-wrapper">
                    <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy">
                    <div class="info-overlay">
                        <span class="title">${escapeHtml(title)}</span>
                        <span class="director">Director: ${escapeHtml(director)}</span>
                        <span class="stars">Stars: ${escapeHtml(stars)}</span>
                    </div>
                </div>
            `;
            div.onclick = () => {
                fetch(`${BASE_URL}/${mediaType}/${item.id}?language=en-US`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } })
                    .then(res => res.json())
                    .then(fullItem => { fullItem.media_type = mediaType; openDetail(fullItem); })
                    .catch(err => console.error("Error:", err));
            };
            container.appendChild(div);
        }
    } catch (err) {
        console.error("Error loading Top 10:", err);
        container.innerHTML = '<div class="loading">Gagal memuat Top 10.</div>';
    }
}

async function loadTopRated() {
    const container = document.getElementById("topRatedContainer");
    if (!container) return;
    container.innerHTML = '<div class="loading">Memuat Top Rated...</div>';
    try {
        const res = await fetch(`${BASE_URL}/movie/top_rated?language=en-US&page=1`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        const data = await res.json();
        const items = (data.results || []).slice(0, 10);
        container.innerHTML = "";
        items.forEach(item => {
            const div = document.createElement("div");
            div.className = "top-rated-item";
            const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";
            const title = item.title || item.name || "Untitled";
            const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
            div.innerHTML = `
                <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy">
                <div class="info">
                    <span class="title">${escapeHtml(title)}</span>
                    <span class="rating">${rating}</span>
                </div>
            `;
            div.onclick = () => {
                fetch(`${BASE_URL}/movie/${item.id}?language=en-US`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } })
                    .then(res => res.json())
                    .then(fullItem => { fullItem.media_type = "movie"; openDetail(fullItem); })
                    .catch(err => console.error("Error:", err));
            };
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Error loading Top Rated:", err);
        container.innerHTML = '<div class="loading">Gagal memuat Top Rated.</div>';
    }
}

async function loadContinueWatching() {
    const container = document.getElementById("continueWatchingContainer");
    if (!container) return;
    const user = getCurrentUser();
    if (!user || !supabaseClient) {
        container.innerHTML = '<div class="loading">Login untuk melihat riwayat tontonan.</div>';
        return;
    }
    container.innerHTML = '<div class="loading">Memuat riwayat tontonan...</div>';
    try {
        const { data: historyItems, error } = await supabaseClient
            .from('history').select('*').eq('user_email', user.email)
            .order('created_at', { ascending: false }).limit(10);
        if (error) { container.innerHTML = '<div class="loading">Gagal memuat riwayat tontonan.</div>'; return; }
        if (!historyItems || historyItems.length === 0) { container.innerHTML = '<div class="loading">Belum ada riwayat tontonan.</div>'; return; }

        container.innerHTML = "";
        const continueWatchingGrid = document.createElement("div");
        continueWatchingGrid.className = "continue-watching-grid";

        for (const item of historyItems) {
            const card = document.createElement("div");
            card.className = "continue-watching-item";
            const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : "https://via.placeholder.com/300x450?text=No+Image";
            const title = item.title || "Untitled";
            const mediaType = item.media_type || "movie";
            const year = item.release_date ? item.release_date.substring(0, 4) : "N/A";
            const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
            const isTv = mediaType === 'tv';
            const progressKey = `${item.movie_id}_${mediaType}`;
            const progressPct = savedProgress[progressKey] || 30;

            card.innerHTML = `
                <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy">
                <div class="continue-info">
                    <span class="continue-title">${escapeHtml(title)}</span>
                    <span class="continue-meta">${year} ${rating !== "N/A" ? rating : ""}</span>
                    ${isTv ? `<span class="continue-episode">S1E1</span>` : ''}
                    <div class="continue-progress"><div class="progress-bar" style="width: ${progressPct}%;"></div></div>
                    <button class="continue-play-btn" onclick="event.stopPropagation(); playNow(${item.movie_id}, '${mediaType}')">Continue Watching</button>
                </div>
            `;
            card.onclick = () => {
                fetch(`${BASE_URL}/${mediaType}/${item.movie_id}?language=en-US`, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } })
                    .then(res => res.json())
                    .then(fullItem => { fullItem.media_type = mediaType; openDetail(fullItem); })
                    .catch(err => console.error("Error:", err));
            };
            continueWatchingGrid.appendChild(card);
        }
        container.appendChild(continueWatchingGrid);
    } catch (err) {
        container.innerHTML = '<div class="loading">Gagal memuat riwayat tontonan.</div>';
    }
}

function scrollToContinueWatching() {
    showPage('home-page');
    setTimeout(() => {
        const section = document.getElementById('continueWatchingSection');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
}

async function openDetail(item) {
    currentDetailItem = item;
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');

    const res = await fetch(`${BASE_URL}/${mediaType}/${item.id}?language=en-US`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const data = await res.json();

    const poster = data.poster_path ? `${IMAGE_URL}${data.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
    const title = data.title || data.name || 'Untitled';
    const year = (data.release_date || data.first_air_date || '').substring(0, 4) || 'N/A';
    const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
    const runtime = data.runtime ? `${data.runtime}m` : data.episode_run_time ? `${data.episode_run_time[0]}m` : 'N/A';
    const overview = data.overview || 'Tidak ada sinopsis.';
    const genres = data.genres ? data.genres.map(g => g.name).join(', ') : '';

    currentOverviewEn = data.overview || '';
    currentOverviewId = item.id;
    isOverviewTranslated = false;

    document.getElementById('detailsPoster').src = poster;
    document.getElementById('detailsTitle').textContent = title;
    document.getElementById('detailsYear').textContent = year;
    document.getElementById('detailsRating').textContent = rating;
    document.getElementById('detailsRuntime').textContent = runtime;
    document.getElementById('detailsGenre').textContent = genres;
    document.getElementById('detailsOverview').textContent = overview;
    document.getElementById('detailsOverviewText').textContent = overview;

    const translateBtn = document.querySelector('.detailsTranslatebutton');
    if (translateBtn) translateBtn.innerHTML = ICON_TRANSLATE + ' Translate';

    currentDetailItem = { ...item, ...data, mediaType };

    updateBookmarkButton();
    renderRatingBreakdown(data);
    renderSeasonSelector(data, mediaType);
    renderCollection(data, mediaType);
    renderCast(data.id, mediaType);

    showPage('detail-page');
    await addToHistory(item);
}

function updateBookmarkButton() {
    const btn = document.getElementById('bookmarkBtn');
    const text = document.getElementById('bookmarkText');
    if (!btn || !text || !currentDetailItem) return;
    const watchlist = getWatchlist();
    const exists = watchlist.some(w => w.id === currentDetailItem.id);
    if (exists) { btn.classList.add('active'); text.textContent = 'Bookmarked'; }
    else { btn.classList.remove('active'); text.textContent = 'Watchlist'; }
}

function toggleBookmarkCurrent() {
    if (!currentDetailItem) return;
    const mediaType = currentDetailItem.mediaType || currentMediaType;
    toggleWatchlist(currentDetailItem.id, mediaType, null);
    updateBookmarkButton();
}

function renderRatingBreakdown(data) {
    const container = document.getElementById('ratingBreakdown');
    if (!container) return;
    const voteCount = data.vote_count || 0;
    const voteAverage = data.vote_average || 0;
    if (voteCount === 0) { container.style.display = 'none'; return; }

    const percentages = [
        Math.min(100, Math.round((voteAverage / 10) * 100)),
        Math.min(100, Math.round((voteAverage / 10) * 80)),
        Math.min(100, Math.round((voteAverage / 10) * 50)),
        Math.min(100, Math.round((voteAverage / 10) * 20)),
        Math.min(100, Math.round((voteAverage / 10) * 10))
    ];
    container.style.display = 'block';
    container.innerHTML = `
        <h3 class="section-inner-title">Rating Breakdown (${voteCount.toLocaleString()} votes)</h3>
        ${[5,4,3,2,1].map((star, i) => `
            <div class="rating-bar-container">
                <span class="rating-bar-label">${star} ★</span>
                <div class="rating-bar-track"><div class="rating-bar-fill" style="width: ${percentages[i]}%;"></div></div>
                <span class="rating-bar-value">${percentages[i]}%</span>
            </div>
        `).join('')}
    `;
}

async function renderSeasonSelector(data, mediaType) {
    const container = document.getElementById('seasonSelector');
    if (!container) return;
    if (mediaType !== 'tv' || !data.seasons || data.seasons.length === 0) {
        container.style.display = 'none';
        return;
    }
    const validSeasons = data.seasons.filter(s => s.season_number > 0);
    if (validSeasons.length === 0) { container.style.display = 'none'; return; }

    container.style.display = 'block';
    container.innerHTML = `
        <div class="season-selector-title">Pilih Season</div>
        <div class="season-buttons">
            ${validSeasons.map(s => `
                <button class="season-btn ${s.season_number === 1 ? 'active' : ''}"
                    onclick="selectSeason(${s.season_number}, this)">
                    Season ${s.season_number}
                </button>
            `).join('')}
        </div>
    `;
    selectSeason(1, container.querySelector('.season-btn'));
}

async function selectSeason(seasonNumber, btn) {
    document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    activeSeason = seasonNumber;
    currentSeasonData = seasonNumber;

    const container = document.getElementById('episodeList');
    if (!container || !currentDetailItem) return;
    container.style.display = 'block';
    container.innerHTML = '<div class="loading">Memuat episode...</div>';

    try {
        const res = await fetch(`${BASE_URL}/tv/${currentDetailItem.id}/season/${seasonNumber}?language=en-US`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        const episodes = data.episodes || [];
        if (episodes.length === 0) { container.innerHTML = '<div class="loading">Tidak ada episode untuk season ini.</div>'; return; }
        currentEpisodeData = episodes;
        container.innerHTML = `
            <div class="episode-list-title">Episode List - Season ${seasonNumber}</div>
            ${episodes.map(ep => `
                <div class="episode-item" onclick="playEpisode(${ep.episode_number})">
                    <img class="episode-thumb" src="${ep.still_path ? `${IMAGE_URL}${ep.still_path}` : 'https://via.placeholder.com/120x68?text=No+Image'}" alt="${escapeHtml(ep.name || '')}" loading="lazy">
                    <div class="episode-info">
                        <span class="episode-number">Episode ${ep.episode_number}</span>
                        <span class="episode-title">${escapeHtml(ep.name || 'Untitled')}</span>
                        <span class="episode-overview">${escapeHtml(ep.overview || 'Tidak ada sinopsis.')}</span>
                    </div>
                </div>
            `).join('')}
        `;
    } catch (err) {
        container.innerHTML = '<div class="loading">Gagal memuat episode.</div>';
    }
}

function playEpisode(episodeNumber) {
    if (!currentDetailItem) return;
    activeEpisode = episodeNumber;
    document.querySelectorAll('.episode-item').forEach((item, i) => item.classList.toggle('active', i === episodeNumber - 1));
    goToPlayer();
}

async function renderCollection(data, mediaType) {
    const container = document.getElementById('collectionSection');
    if (!container) return;
    if (!data.belongs_to_collection) { container.style.display = 'none'; return; }

    container.style.display = 'block';
    container.innerHTML = '<div class="loading">Memuat koleksi...</div>';

    try {
        const res = await fetch(`${BASE_URL}/collection/${data.belongs_to_collection.id}?language=en-US`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const col = await res.json();
        const parts = (col.parts || []).sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));

        container.innerHTML = `
            <h3 class="section-inner-title">${escapeHtml(col.name || 'Collection')}</h3>
            <div class="collection-grid">
                ${parts.map(p => {
                    const poster = p.poster_path ? `${IMAGE_URL}${p.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
                    const title = p.title || p.name || 'Untitled';
                    const year = (p.release_date || '').substring(0, 4) || 'N/A';
                    return `
                        <div class="collection-card" onclick='openSimilarItem(${JSON.stringify({ id: p.id, media_type: "movie" }).replace(/'/g, "&#39;")})'>
                            <img src="${poster}" loading="lazy" alt="${escapeHtml(title)}">
                            <div class="collection-info">
                                <span class="collection-title">${escapeHtml(title)}</span>
                                <span class="collection-year">${year}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch { container.style.display = 'none'; }
}

async function renderCast(id, mediaType) {
    const container = document.getElementById('castSection');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = '<div class="loading">Memuat cast...</div>';

    try {
        const res = await fetch(`${BASE_URL}/${mediaType}/${id}/credits?language=en-US`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        const cast = (data.cast || []).slice(0, 12);
        if (cast.length === 0) { container.style.display = 'none'; return; }

        container.innerHTML = `
            <h3 class="section-inner-title">Cast & Crew</h3>
            <div class="cast-grid">
                ${cast.map(c => {
                    const photo = c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : 'https://via.placeholder.com/200x300?text=No+Image';
                    return `
                        <div class="cast-card">
                            <img src="${photo}" loading="lazy" alt="${escapeHtml(c.name)}">
                            <div class="cast-info">
                                <span class="cast-name">${escapeHtml(c.name)}</span>
                                <span class="cast-role">${escapeHtml(c.character || '')}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch { container.style.display = 'none'; }
}

function goToPlayer() {
    if (!currentDetailItem) return;
    const id = currentDetailItem.id;
    const mediaType = currentDetailItem.mediaType || currentMediaType;
    const title = currentDetailItem.title || currentDetailItem.name || 'Untitled';
    document.getElementById('playerTitle').textContent = title + (mediaType === 'tv' ? ` - S${activeSeason}E${activeEpisode}` : '');

    const prevBtn = document.getElementById('prevEpisodeBtn');
    const nextBtn = document.getElementById('nextEpisodeBtn');
    if (mediaType === 'tv') {
        prevBtn.style.display = 'inline-block';
        nextBtn.style.display = 'inline-block';
        prevBtn.disabled = activeEpisode <= 1;
        nextBtn.disabled = !currentEpisodeData || activeEpisode >= currentEpisodeData.length;
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }

    setupPlayer(id, mediaType);
    showPage('player-page');
    startProgressTracking(id, mediaType);
}

function playPrevEpisode() {
    if (activeEpisode > 1) { activeEpisode--; goToPlayer(); }
}
function playNextEpisode() {
    if (currentEpisodeData && activeEpisode < currentEpisodeData.length) {
        activeEpisode++;
        goToPlayer();
    } else {
        showToast("Ini episode terakhir di season ini.", "info");
    }
}
function goBackToDetail() {
    stopProgressTracking();
    if (currentDetailItem) showPage('detail-page');
    else showPage('home-page');
}

function setupPlayer(id, mediaType) {
    playerItemId = id;
    playerMediaType = mediaType;

    const servers = buildServersList(mediaType, id, activeSeason, activeEpisode);

    const serversContainer = document.getElementById('playerServers');
    const existingButtons = serversContainer.querySelectorAll('.server-btn');
    existingButtons.forEach(btn => btn.remove());

    servers.forEach((server, index) => {
        const btn = document.createElement('button');
        btn.className = `server-btn ${index === 0 ? 'working' : ''}`;
        btn.textContent = server.name;
        btn.onclick = () => switchPlayerServer(server.url, btn);
        serversContainer.appendChild(btn);
    });

    const iframe = document.getElementById('playerFrame');
    const loader = document.querySelector('#playerSourceContainer .loader');
    iframe.style.display = 'none';
    loader.style.display = 'block';
    iframe.src = servers[0].url;
    iframe.onload = () => { loader.style.display = 'none'; iframe.style.display = 'block'; };

    const sandboxToggle = document.getElementById('sandboxToggle');
    sandboxToggle.onchange = function() {
        if (this.checked) {
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            document.querySelector('.adsLabel').textContent = 'Disable Sandbox';
        } else {
            iframe.removeAttribute('sandbox');
            document.querySelector('.adsLabel').textContent = 'Enable Sandbox';
        }
        const currentSrc = iframe.src;
        iframe.src = 'about:blank';
        setTimeout(() => { iframe.src = currentSrc; }, 100);
    };
}

function switchPlayerServer(url, btn) {
    const iframe = document.getElementById('playerFrame');
    const loader = document.querySelector('#playerSourceContainer .loader');
    document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('working'));
    btn.classList.add('working');
    iframe.style.display = 'none';
    loader.style.display = 'block';
    iframe.src = url;
    iframe.onload = () => { loader.style.display = 'none'; iframe.style.display = 'block'; };
}

function startProgressTracking(id, mediaType) {
    stopProgressTracking();
    const key = `${id}_${mediaType}`;
    playerProgress = savedProgress[key] || 0;
    updateProgressUI(playerProgress);

    playerProgressInterval = setInterval(() => {
        playerProgress += 0.3;
        if (playerProgress > 95) playerProgress = 95;
        updateProgressUI(playerProgress);
        savedProgress[key] = playerProgress;
        saveSavedProgress();
    }, 5000);
}

function stopProgressTracking() {
    if (playerProgressInterval) { clearInterval(playerProgressInterval); playerProgressInterval = null; }
}

function updateProgressUI(progress) {
    const bar = document.getElementById('playerProgressBar');
    const text = document.getElementById('playerProgressText');
    if (bar) {
        bar.innerHTML = `<div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#e50914,#f6121d);border-radius:3px;transition:width 0.3s ease;"></div>`;
    }
    if (text) text.textContent = Math.round(progress) + '%';
}

function loadSavedProgress() {
    try { savedProgress = JSON.parse(localStorage.getItem('movieMatchProgress')) || {}; }
    catch { savedProgress = {}; }
}
function saveSavedProgress() {
    try { localStorage.setItem('movieMatchProgress', JSON.stringify(savedProgress)); } catch {}
}

async function showOverview() {
    if (!currentDetailItem) return;
    const content = document.getElementById('detailsContent');
    const overview = currentOverviewEn || currentDetailItem.overview || 'Tidak ada sinopsis.';
    content.innerHTML = `<p id="detailsOverviewText">${escapeHtml(overview)}</p>`;

    document.querySelectorAll('.detailsButtonWrapper button').forEach(b => b.classList.remove('red'));
    document.querySelector('.detailsOverviewbutton').classList.add('red');

    document.getElementById('ratingBreakdown').style.display = 'none';
    document.getElementById('seasonSelector').style.display = 'none';
    document.getElementById('episodeList').style.display = 'none';
    document.getElementById('collectionSection').style.display = 'none';
    document.getElementById('castSection').style.display = 'none';

    isOverviewTranslated = false;
    const translateBtn = document.querySelector('.detailsTranslatebutton');
    if (translateBtn) translateBtn.innerHTML = ICON_TRANSLATE + ' Translate';
}

async function showTrailer() {
    if (!currentDetailItem) return;
    const id = currentDetailItem.id;
    const mediaType = currentDetailItem.mediaType || 'movie';
    const content = document.getElementById('detailsContent');

    try {
        const res = await fetch(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
        const data = await res.json();
        const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) {
            content.innerHTML = `<div class="detailsTrailer"><iframe src="https://www.youtube.com/embed/${trailer.key}" allowfullscreen></iframe></div>`;
        } else { content.innerHTML = '<p>Trailer tidak tersedia.</p>'; }
    } catch { content.innerHTML = '<p>Gagal memuat trailer.</p>'; }

    document.querySelectorAll('.detailsButtonWrapper button').forEach(b => b.classList.remove('red'));
    document.querySelector('.detailsTrailerbutton').classList.add('red');
    document.getElementById('ratingBreakdown').style.display = 'none';
    document.getElementById('seasonSelector').style.display = 'none';
    document.getElementById('episodeList').style.display = 'none';
    document.getElementById('collectionSection').style.display = 'none';
    document.getElementById('castSection').style.display = 'none';

    isOverviewTranslated = false;
    const translateBtn = document.querySelector('.detailsTranslatebutton');
    if (translateBtn) translateBtn.innerHTML = ICON_TRANSLATE + ' Translate';
}

async function showSimilar() {
    if (!currentDetailItem) return;
    const id = currentDetailItem.id;
    const mediaType = currentDetailItem.mediaType || 'movie';
    const content = document.getElementById('detailsContent');
    content.innerHTML = '<div class="loading">Memuat rekomendasi serupa...</div>';

    document.querySelectorAll('.detailsButtonWrapper button').forEach(b => b.classList.remove('red'));
    document.querySelector('.detailsSimilarbutton').classList.add('red');
    document.getElementById('ratingBreakdown').style.display = 'none';
    document.getElementById('seasonSelector').style.display = 'none';
    document.getElementById('episodeList').style.display = 'none';
    document.getElementById('collectionSection').style.display = 'none';
    document.getElementById('castSection').style.display = 'none';

    try {
        const res = await fetch(`${BASE_URL}/${mediaType}/${id}/similar?language=en-US&page=1`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        const items = (data.results || []).slice(0, 12);
        if (items.length === 0) { content.innerHTML = '<p>Tidak ada rekomendasi serupa.</p>'; return; }

        content.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;">
                ${items.map(item => {
                    const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
                    const title = item.title || item.name || 'Untitled';
                    const year = (item.release_date || item.first_air_date || '').substring(0,4) || 'N/A';
                    const mt = item.media_type || (item.first_air_date ? 'tv' : 'movie');
                    return `
                        <div style="background:#181818;border-radius:8px;overflow:hidden;cursor:pointer;" onclick='openSimilarItem(${JSON.stringify({ id: item.id, media_type: mt, poster_path: item.poster_path, title: item.title, name: item.name, release_date: item.release_date, first_air_date: item.first_air_date, vote_average: item.vote_average, overview: item.overview }).replace(/'/g, "&#39;")})'>
                            <img src="${poster}" style="width:100%;aspect-ratio:2/3;object-fit:cover;display:block;" loading="lazy">
                            <div style="padding:8px;">
                                <div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(title)}</div>
                                <div style="font-size:11px;color:#888;">${year}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch { content.innerHTML = '<p>Gagal memuat rekomendasi serupa.</p>'; }
}

function openSimilarItem(item) {
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    item.media_type = mediaType;
    openDetail(item);
}

async function translateOverview() {
    const content = document.getElementById('detailsContent');
    const translateBtn = document.querySelector('.detailsTranslatebutton');
    const overviewText = document.getElementById('detailsOverviewText');

    if (!currentOverviewEn) {
        content.innerHTML = '<p>Tidak ada sinopsis untuk diterjemahkan.</p>';
        return;
    }
    if (isOverviewTranslated) {
        overviewText.textContent = currentOverviewEn;
        translateBtn.innerHTML = ICON_TRANSLATE + ' Translate';
        translateBtn.classList.remove('red');
        isOverviewTranslated = false;
        return;
    }

    overviewText.textContent = 'Menerjemahkan...';
    translateBtn.innerHTML = ICON_LOADING + ' Loading...';

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(currentOverviewEn)}&langpair=en|id`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.responseData && data.responseData.translatedText) {
            overviewText.textContent = data.responseData.translatedText;
            translateBtn.innerHTML = ICON_CHECK + ' English';
            translateBtn.classList.add('red');
            isOverviewTranslated = true;
        } else {
            overviewText.textContent = 'Gagal menerjemahkan. Coba lagi nanti.';
            translateBtn.innerHTML = ICON_TRANSLATE + ' Translate';
        }
    } catch {
        overviewText.textContent = 'Gagal menerjemahkan. Coba lagi nanti.';
        translateBtn.innerHTML = ICON_TRANSLATE + ' Translate';
    }
}

function showDownload() {
    if (!currentDetailItem) {
        showToast("Pilih film dulu sebelum download", "error");
        return;
    }

    const modal = document.getElementById('downloadModal');
    if (!modal) return;

    const title = currentDetailItem.title || currentDetailItem.name || 'Untitled';
    const mediaType = currentDetailItem.mediaType || currentMediaType;
    const year = (currentDetailItem.release_date || currentDetailItem.first_air_date || '').substring(0, 4);

    document.getElementById('downloadItemTitle').textContent = title + ' (' + year + ') - ' + (mediaType === 'tv' ? 'TV Series' : 'Movie');

    switchDownloadTab('video', document.querySelector('.download-tab'));
    renderDownloadServers();

    const subStatus = document.getElementById('subtitleStatus');
    if (subStatus) {
        subStatus.textContent = '';
        subStatus.className = 'subtitle-status';
    }

    modal.style.display = 'flex';
}

function closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) modal.style.display = 'none';
}

function switchDownloadTab(tabName, btn) {
    document.querySelectorAll('.download-tab-content').forEach(function(el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('.download-tab').forEach(function(el) {
        el.classList.remove('active');
    });

    const target = document.getElementById('downloadTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');
}

function renderDownloadServers() {
    const container = document.getElementById('downloadServerList');
    if (!container || !currentDetailItem) return;

    const id = currentDetailItem.id;
    const mediaType = currentDetailItem.mediaType || currentMediaType;

    const servers = [
        { name: 'VidSrc Download', url: 'https://vidsrc.xyz/embed/' + mediaType + '?tmdb=' + id, badge: 'NEW', badgeClass: 'new' },
        { name: 'VidSrc Me Download', url: 'https://vidsrc.me/embed/' + mediaType + '?tmdb=' + id, badge: 'HD', badgeClass: 'hd' },
        { name: 'Embed SU Download', url: 'https://embed.su/embed/' + mediaType + '/' + id, badge: '', badgeClass: '' },
        { name: 'VidSrc CC Download', url: 'https://vidsrc.cc/v2/embed/' + mediaType + '/' + id, badge: '', badgeClass: '' },
        { name: '2Embed Download', url: 'https://2embed.cc/embed/' + mediaType + '/' + id, badge: '', badgeClass: '' },
        { name: 'MultiEmbed Download', url: 'https://multiembed.mov/?video_id=' + id + '&tmdb=1', badge: '', badgeClass: '' },
        { name: 'VidSrc VIP Download', url: 'https://vidsrc.vip/embed/' + mediaType + '/' + id, badge: '', badgeClass: '' },
        { name: 'VidSrc NL Download', url: 'https://player.vidsrc.nl/embed/' + mediaType + '/' + id, badge: '', badgeClass: '' },
        { name: 'Server Alpha Download', url: mediaType === 'movie' ? 'https://vidup.to/movie/' + id + '?autoPlay=true&theme=FF0000' : 'https://vidup.to/tv/' + id + '/1/1?autoPlay=true&theme=FF0000', badge: '', badgeClass: '' },
        { name: 'Server Delta Download', url: mediaType === 'movie' ? 'https://111movies.com/movie/' + id : 'https://111movies.com/tv/' + id + '/1/1', badge: '', badgeClass: '' }
    ];

    const downloadIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>';

    container.innerHTML = servers.map(function(s) {
        return '<button class="download-server-btn" onclick="openDownloadServer(\'' + s.url + '\', \'' + escapeHtml(s.name) + '\')">' +
            '<span class="server-name">' +
                escapeHtml(s.name) +
                (s.badge ? '<span class="server-badge ' + s.badgeClass + '">' + s.badge + '</span>' : '') +
            '</span>' +
            '<span class="download-arrow">' + downloadIcon + '</span>' +
        '</button>';
    }).join('');
}

function openDownloadServer(url, name) {
    const win = window.open(url, '_blank');

    if (!win) {
        showToast("Pop-up diblokir. Izinkan pop-up untuk download.", "error");
        return;
    }

    showToast("Membuka " + name + "...", "success");
    closeDownloadModal();
}

async function downloadSubtitleFile(lang) {
    const status = document.getElementById('subtitleStatus');
    if (!status) return;

    status.className = 'subtitle-status loading';
    status.textContent = 'Mencari subtitle ' + lang.toUpperCase() + '...';

    let imdbId = currentDetailItem ? currentDetailItem.imdb_id : null;

    if (!imdbId && currentDetailItem) {
        status.textContent = 'Mengambil data film...';
        try {
            const mediaType = currentDetailItem.mediaType || currentMediaType;
            const res = await fetch(BASE_URL + '/' + mediaType + '/' + currentDetailItem.id + '?append_to_response=external_ids', {
                headers: { 'Authorization': 'Bearer ' + ACCESS_TOKEN }
            });
            const data = await res.json();
            imdbId = data.imdb_id || (data.external_ids && data.external_ids.imdb_id);

            if (!imdbId) {
                status.className = 'subtitle-status error';
                status.textContent = 'IMDb ID tidak ditemukan. Subtitle tidak tersedia.';
                return;
            }
        } catch (err) {
            status.className = 'subtitle-status error';
            status.textContent = 'Gagal mengambil data. Coba lagi.';
            return;
        }
    }

    if (!imdbId) {
        status.className = 'subtitle-status error';
        status.textContent = 'Data film tidak valid.';
        return;
    }

    try {
        const searchUrl = 'https://api.opensubtitles.com/api/v1/subtitles?imdb_id=' + imdbId + '&languages=' + lang;
        const res = await fetch(searchUrl, {
            headers: {
                'Api-Key': OPENSUBTITLES_API_KEY,
                'User-Agent': 'MovieMatchApp v1.0'
            }
        });

        if (!res.ok) {
            status.className = 'subtitle-status error';
            status.textContent = 'Subtitle tidak ditemukan untuk bahasa ini.';
            return;
        }

        const data = await res.json();
        const subs = data.data || [];

        if (subs.length === 0) {
            status.className = 'subtitle-status error';
            status.textContent = 'Subtitle tidak tersedia untuk film ini.';
            return;
        }

        const best = subs.sort(function(a, b) {
            return ((b.attributes && b.attributes.download_count) || 0) - ((a.attributes && a.attributes.download_count) || 0);
        })[0];
        const fileId = best.attributes && best.attributes.files && best.attributes.files[0] ? best.attributes.files[0].file_id : null;

        if (!fileId) {
            status.className = 'subtitle-status error';
            status.textContent = 'File subtitle rusak.';
            return;
        }

        status.textContent = 'Mengunduh file subtitle...';

        const downloadRes = await fetch('https://api.opensubtitles.com/api/v1/download', {
            method: 'POST',
            headers: {
                'Api-Key': OPENSUBTITLES_API_KEY,
                'Content-Type': 'application/json',
                'User-Agent': 'MovieMatchApp v1.0'
            },
            body: JSON.stringify({ file_id: fileId })
        });

        if (!downloadRes.ok) {
            status.className = 'subtitle-status error';
            status.textContent = 'Gagal generate download link.';
            return;
        }

        const dlData = await downloadRes.json();
        const downloadLink = dlData.link;

        if (!downloadLink) {
            status.className = 'subtitle-status error';
            status.textContent = 'Link download tidak tersedia.';
            return;
        }

        const title = (currentDetailItem.title || currentDetailItem.name || 'subtitle').replace(/[^\w\s-]/g, '').trim();
        const a = document.createElement('a');
        a.href = downloadLink;
        a.download = title + '.' + lang + '.srt';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        status.className = 'subtitle-status success';
        status.textContent = 'Subtitle ' + lang.toUpperCase() + ' berhasil diunduh.';

        showToast('Subtitle ' + lang.toUpperCase() + ' diunduh', 'success');

    } catch (err) {
        console.error('Subtitle error:', err);
        status.className = 'subtitle-status error';
        status.textContent = 'Terjadi kesalahan. Coba lagi nanti.';
    }
}

window.addEventListener('click', function(event) {
    const modal = document.getElementById('downloadModal');
    if (event.target === modal) closeDownloadModal();
});

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        const playerPage = document.getElementById('player-page');
        const isPlayerActive = playerPage && playerPage.classList.contains('active');

        if (e.key === 'Escape') {
            if (movieModal && movieModal.style.display === 'flex') closeMovieModal();
        }

        if (isPlayerActive) {
            if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) playNextEpisode();
            if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) playPrevEpisode();
        }

        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const si = document.getElementById('searchInput');
            if (si) { showPage('search-page'); si.focus(); }
        }
    });
}
