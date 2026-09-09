const API_KEY = "c460f7483f7f090ecb7b0ebf0b214d50";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNDYwZjc0ODNmN2YwOTBlY2I3YjBlYmYwYjIxNGQ1MCIsIm5iZiI6MTc4ODQ3NDYyMi44OTYsInN1YiI6IjZhOTlmNGZlNTZlODkxMjg0OTgzZGRkOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ULTfSl002E5c4EXvAj9uIE4f_tFJMP98SBGGQEdEerE";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const SUPABASE_URL = "https://yratvqvtlixcvyciqrsg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable___KN08wXZeXaPpHU6z-DAQ_JbZXIoyj";
const OPENSUBTITLES_API_KEY = "C3oTYqRkJtvkZFVR4r361m0zFfInJcom";

emailjs.init("ZDbFZUevZv9Hfi1xo");
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
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");

const companyCache = new Map();

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
let currentOverviewEn = "";
let currentOverviewId = "";
let otpEmail = '';
let otpTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    updateNavAuth();
    loadContent('popular', 1);

    if (searchForm) {
        searchForm.addEventListener("submit", function(e) {
            e.preventDefault();
            if (searchInput && searchInput.value.trim() !== "") {
                searchByQuery(searchInput.value.trim());
            }
        });
    }

    const subscription = supabaseClient
        .channel('users-channel')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'users' },
            (payload) => {
                console.log('User baru daftar:', payload.new);
            }
        )
        .subscribe();

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
    const strBar1 = document.getElementById("strBar1");
    const strBar2 = document.getElementById("strBar2");
    const strBar3 = document.getElementById("strBar3");
    const strBar4 = document.getElementById("strBar4");
    const strText = document.getElementById("strText");

    if (passInput) {
        passInput.addEventListener("input", function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
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
    }, 500);
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
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    if (pageId === 'home-page') {
        currentGenreId = '';
        currentGenreName = '';
        currentGenrePage = 1;
        
        if (movieTitle) {
            movieTitle.textContent = currentMediaType === 'movie' ? "Popular Movies" : "Popular Series";
        }
        
        const searchInputEl = document.getElementById("searchInput");
        if (searchInputEl) {
            searchInputEl.value = "";
        }
        
        loadContent('popular', 1);
    }

    window.scrollTo(0, 0);
}

function scrollToSection(sectionId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const homePage = document.getElementById('home-page');
    if (homePage) {
        homePage.classList.add('active');
    }

    loadContent('popular', 1).then(() => {
        setTimeout(() => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);
    });
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
    currentGenreId = '';
    currentGenreName = '';
    currentGenrePage = 1;
    
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
    currentGenreId = '';
    currentGenreName = '';
    currentGenrePage = 1;
    currentFilterParam = filterParam;
    currentPage = page;

    history.pushState({ category: filterParam, page: page }, "", `?category=${filterParam}&page=${page}`);
    
    if (movieContainer) {
        movieContainer.innerHTML = '<div class="loading">Loading content...</div>';
    }

    let url = `${BASE_URL}/trending/${currentMediaType}/day?page=${page}&language=id-ID`;
    if (filterParam === 'popular') {
        url = `${BASE_URL}/${currentMediaType}/popular?page=${page}&language=id-ID`;
    } else if (filterParam === 'top_rated') {
        url = `${BASE_URL}/${currentMediaType}/top_rated?page=${page}&language=id-ID`;
    }

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        console.log("Response status:", res.status);
        const data = await res.json();
        console.log("Data:", data);
        await displayItems(data.results, movieContainer, true); 
        scrollToMovies();
    } catch (err) {
        console.error("Error:", err);
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Gagal memuat data film. Coba periksa koneksi.</div>';
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

    history.pushState({ search: query }, "", `?search=${encodeURIComponent(query)}`);

    let url = `${BASE_URL}/search/${currentMediaType}?query=${encodeURIComponent(query)}&language=id-ID`;
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        const data = await res.json();
        await displayItems(data.results, movieContainer, true);
        scrollToMovies();
    } catch (err) {
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Terjadi kesalahan saat mencari.</div>';
        }
    }
}

window.addEventListener("popstate", function(event) {
    if (event.state && event.state.genre) {
        showPage('home-page');
        return;
    }

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
        setTimeout(() => {
            moviesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
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
        card.onclick = () => openModal(item);

        let companies = [];
        if (!isFromSupabase) {
            if (companyCache.has(item.id)) {
                companies = companyCache.get(item.id);
            } else {
                companies = item.production_companies || [];
                if (!companies || companies.length === 0) {
                    const mediaType = item.media_type || currentMediaType;
                    companies = await fetchMovieDetails(item.id, mediaType);
                }
                companyCache.set(item.id, companies);
            }
        }
        
        const companyNames = companies.map(c => c.name.toLowerCase()).join(',');
        card.dataset.companies = companyNames;

        const poster = item.poster_path && item.poster_path.length > 3
            ? `${IMAGE_URL}${item.poster_path}` 
            : 'https://via.placeholder.com/300x450?text=No+Image';
        
        const title = item.title || item.name || "Untitled";
        const originalTitle = item.original_title || item.original_name || "";
        
        const displaySubTitle = (originalTitle && originalTitle !== title) 
            ? `<span style="font-size: 11px; color: #888; display: block; margin-top: 2px;">${originalTitle}</span>` 
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
            <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-info">
                <h3>${title}</h3>
                ${displaySubTitle}
                <p style="margin-top: 4px;">${year} ${countryText ? `| ${countryText}` : ""} | &#9733; ${rating}</p>
            </div>
        `;
        container.appendChild(card);
    }
}

async function fetchMovieDetails(itemId, mediaType) {
    if (companyCache.has(itemId)) {
        return companyCache.get(itemId);
    }

    const url = `${BASE_URL}/${mediaType}/${itemId}?language=id-ID`;
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        const data = await res.json();
        const companies = data.production_companies || [];
        companyCache.set(itemId, companies);
        return companies;
    } catch (err) {
        console.error("Error fetch detail:", err);
        return [];
    }
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
        prevBtn.style.cssText = 'background: none; border: none; color: #888; font-size: 24px; cursor: pointer; padding: 0 8px; transition: 0.2s;';
        prevBtn.onmouseover = () => prevBtn.style.color = '#fff';
        prevBtn.onmouseout = () => prevBtn.style.color = '#888';
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
        nextBtn.style.cssText = 'background: none; border: none; color: #888; font-size: 24px; cursor: pointer; padding: 0 8px; transition: 0.2s;';
        nextBtn.onmouseover = () => nextBtn.style.color = '#fff';
        nextBtn.onmouseout = () => nextBtn.style.color = '#888';
        nextBtn.onclick = () => getMoviesByGenre(currentGenreId, currentGenreName, currentPage + 1);
        paginationDiv.appendChild(nextBtn);
    }

    container.appendChild(paginationDiv);
}

async function getMoviesByGenre(genreId, genreName, page = 1) {
    if (!genreId) {
        loadContent(currentFilterParam, 1);
        return;
    }

    currentGenreId = genreId;
    currentGenreName = genreName;
    currentGenrePage = page;

    history.pushState({ genre: genreId, genreName: genreName, page: page }, "", `?genre=${genreId}&page=${page}`);

    if (movieContainer) {
        movieContainer.innerHTML = '<div class="loading">Memuat genre...</div>';
    }

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
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        const data = await res.json();
        await displayItems(data.results, movieContainer, true);
        addGenrePagination(data.total_pages, page);
        scrollToMovies();
    } catch (err) {
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Gagal memuat genre.</div>';
        }
    }
}

function filterByStudio(value) {
    if (value === 'all') {
        loadContent(currentFilterParam, currentPage);
        return;
    }

    const studioData = {
        'netflix': { id: 213, type: 'network' },
        'prime': { id: 1024, type: 'network' },
        'shudder': { id: 521, type: 'network' },
        'amc': { id: 174, type: 'network' },
        'cn': { id: 56, type: 'network' },
        'blumhouse': { id: 33, type: 'company' },
        'marvel': { id: 420, type: 'company' },
        'dreamworks': { id: 521, type: 'company' },
        'pixar': { id: 3, type: 'company' },
        'a24': { id: 110, type: 'company' }
    };

    const data = studioData[value];
    if (!data) {
        loadContent(currentFilterParam, currentPage);
        return;
    }

    const filterParam = data.type === 'network' ? 'with_networks' : 'with_companies';
    const mediaType = data.type === 'network' ? 'tv' : 'movie';
    const url = `${BASE_URL}/discover/${mediaType}?${filterParam}=${data.id}&language=id-ID&page=1&sort_by=popularity.desc`;
    
    movieContainer.innerHTML = '<div class="loading">Memuat konten dari platform...</div>';
    
    const displayName = {
        'netflix': 'NETFLIX',
        'prime': 'Prime Video',
        'shudder': 'SHUDDER',
        'amc': 'AMC',
        'cn': 'Cartoon Network',
        'blumhouse': 'BLUMHOUSE PRODUCTIONS',
        'marvel': 'MARVEL STUDIOS',
        'dreamworks': 'DREAMWORKS PICTURES',
        'pixar': 'PIXAR',
        'a24': 'A24'
    };
    
    if (movieTitle) {
        movieTitle.textContent = `${displayName[value] || value} - Exclusive Content`;
    }

    fetch(url, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (!data.results || data.results.length === 0) {
            movieContainer.innerHTML = '<div class="loading">Tidak ada konten dari platform ini.</div>';
            return;
        }
        displayItems(data.results, movieContainer, true);
        
        if (data.total_pages > 1) {
            fetchMorePages(url, 2, data.total_pages);
        }
    })
    .catch(err => {
        console.error("Error:", err);
        movieContainer.innerHTML = '<div class="loading">Gagal memuat data: ' + err.message + '</div>';
    });
}

async function fetchMorePages(baseUrl, currentPage, totalPages) {
    if (currentPage > totalPages || currentPage > 3) return;
    
    try {
        const url = baseUrl.replace('&page=1', `&page=${currentPage}`);
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
            const existingItems = movieContainer.querySelectorAll('.movie-card');
            const newItems = await createItemElements(data.results);
            
            newItems.forEach(item => {
                movieContainer.appendChild(item);
            });
        }
        
        if (currentPage < totalPages && currentPage < 3) {
            fetchMorePages(baseUrl, currentPage + 1, totalPages);
        }
    } catch (err) {
        console.error("Error fetching more pages:", err);
    }
}

async function createItemElements(items) {
    const elements = [];
    const container = document.createElement('div');
    
    for (const item of items) {
        const card = document.createElement("article");
        card.className = "movie-card";
        
        const poster = item.poster_path 
            ? `${IMAGE_URL}${item.poster_path}` 
            : 'https://via.placeholder.com/300x450?text=No+Image';
        
        const title = item.title || item.name || "Untitled";
        const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
        const year = (item.release_date || item.first_air_date || "").substring(0, 4) || "N/A";

        card.innerHTML = `
            <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-info">
                <h3>${title}</h3>
                <p>${year} | &#9733; ${rating}</p>
            </div>
        `;
        card.onclick = () => openModal(item);
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

    const servers = [
        { name: "VidSrc XYZ", url: `https://vidsrc.xyz/embed/${currentMediaType}?tmdb=${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "VidSrc ME", url: `https://vidsrc.me/embed/${currentMediaType}?tmdb=${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "Embed SU", url: `https://embed.su/embed/${currentMediaType}/${activeItemId}?subtitle=id,en&subtitle-source=opensubtitles` },
        { name: "VidSrc CC", url: `https://vidsrc.cc/v2/embed/${currentMediaType}/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "MultiEmbed", url: `https://multiembed.mov/?video_id=${activeItemId}&tmdb=1${currentMediaType === 'tv' ? '&s=1&e=1' : ''}&sub=id,en&sub-source=opensubtitles` },
        { name: "AutoEmbed", url: `https://player.autoembed.cc/embed/${currentMediaType}/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "2Embed", url: `https://2embed.cc/embed/${currentMediaType}/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "MoviesAPI", url: `https://moviesapi.club/movie/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "VidSrc VIP", url: `https://vidsrc.vip/embed/${currentMediaType}/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "Anime-KKI", url: `https://anime-kki.herokuapp.com/embed/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "VidSrc NL", url: `https://player.vidsrc.nl/embed/${currentMediaType}/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "IDSrc TO", url: `https://idsrc.to/embed/${currentMediaType}/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "VidSrc ICU", url: `https://vidsrc.icu/embed/${currentMediaType}/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "Main Server 1", url: currentMediaType === 'movie' ? `https://vidstuck.xyz/embed/movie/${activeItemId}?branding=zxcstream&subtitle=english` : `https://vidstuck.xyz/embed/tv/${activeItemId}/1/1?branding=zxcstream&subtitle=english` },
        { name: "Main Server 2", url: currentMediaType === 'movie' ? `https://zxcstream.xyz/player/movie/${activeItemId}?server=0&subLang=english,indonesian` : `https://zxcstream.xyz/player/tv/${activeItemId}/1/1?server=0&subLang=english,indonesian` },
        { name: "Server Alpha", url: currentMediaType === 'movie' ? `https://vidup.to/movie/${activeItemId}?autoPlay=true&theme=FF0000` : `https://vidup.to/tv/${activeItemId}/1/1?autoPlay=true&theme=FF0000` },
        { name: "Server Beta", url: currentMediaType === 'movie' ? `https://mappletv.uk/watch/movie/${activeItemId}` : `https://mappletv.uk/watch/tv/${activeItemId}-1-1` },
        { name: "Server Delta", url: currentMediaType === 'movie' ? `https://111movies.com/movie/${activeItemId}` : `https://111movies.com/tv/${activeItemId}/1/1` },
        { name: "Server Zeta", url: currentMediaType === 'movie' ? `https://vidsrc.xyz/embed/movie/${activeItemId}` : `https://vidsrc.xyz/embed/tv?tmdb=${activeItemId}&season=1&episode=1` }
    ];

    modalBody.innerHTML = `
        <div class="modal-detail" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
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

    const imdbId = item.imdb_id;
    if (imdbId) {
        try {
            const subData = await getSubtitle(imdbId);
            if (subData && subData.data && subData.data.length > 0) {
                const firstSub = subData.data[0];
                const subFileId = firstSub.attributes.files[0].file_id;
                const subLink = await downloadSubtitle(subFileId);
                if (subLink) {
                    console.log("Subtitle siap:", subLink);
                    const playerWrapper = document.querySelector('#playerFrame')?.parentElement;
                    if (playerWrapper) {
                        const subElement = document.createElement('div');
                        subElement.style.cssText = 'color: #aaa; font-size: 12px; margin-top: 8px; text-align: center;';
                        subElement.textContent = `Subtitle tersedia: ${firstSub.attributes.language}`;
                        playerWrapper.parentElement.insertBefore(subElement, playerWrapper.nextSibling);
                    }
                }
            }
        } catch (err) {
            console.warn("Gagal ambil subtitle:", err);
        }
    }

    movieModal.style.display = "flex";

    const modalDetail = document.querySelector(".modal-detail");
    if (modalDetail) {
        const watchlistBtn = document.createElement("button");
        const watchlist = getWatchlist();
        const exists = watchlist.some(w => w.id === item.id);
        
        watchlistBtn.className = `watchlist-btn ${exists ? "active" : ""}`;
        watchlistBtn.innerHTML = exists ? "★" : "☆";
        watchlistBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 50px;
            background: rgba(0,0,0,0.7);
            border: none;
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.3s;
            z-index: 5;
        `;
        watchlistBtn.onclick = () => {
            toggleWatchlist(item.id, item.media_type || currentMediaType, watchlistBtn);
        };
        
        const titleElement = modalDetail.querySelector("h2");
        if (titleElement) {
            const wrapper = document.createElement("div");
            wrapper.style.cssText = "display: flex; align-items: center; gap: 12px;";
            titleElement.parentNode.insertBefore(wrapper, titleElement);
            wrapper.appendChild(titleElement);
            wrapper.appendChild(watchlistBtn);
        }
    }
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

function closeModal() {
    closeMovieModal();
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

async function getSubtitle(imdbId, lang = 'id') {
    if (!imdbId) return null;
    const url = `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId}&languages=${lang}`;
    try {
        const res = await fetch(url, {
            headers: {
                'Api-Key': OPENSUBTITLES_API_KEY,
                'User-Agent': 'MovieMatchApp v1.0'
            }
        });
        if (!res.ok) {
            console.warn("Gagal ambil subtitle:", res.status);
            return null;
        }
        const data = await res.json();
        return data;
    } catch (err) {
        console.warn("Error subtitle:", err);
        return null;
    }
}

async function downloadSubtitle(fileId) {
    if (!fileId) return null;
    const url = `https://api.opensubtitles.com/api/v1/download/${fileId}`;
    try {
        const res = await fetch(url, {
            headers: {
                'Api-Key': OPENSUBTITLES_API_KEY,
                'User-Agent': 'MovieMatchApp v1.0'
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.link;
    } catch (err) {
        console.warn("Error download subtitle:", err);
        return null;
    }
}

async function toggleFavoriteCurrent(item) {
    const user = getCurrentUser();
    if (!user) {
        alert("Silakan login ter dahulu untuk menyimpan ke Favorit!");
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
    await displayItems(favs, container, false);
}

async function addToHistory(item) {
    const user = getCurrentUser();
    if (!user) return;
    
    const movieId = item.id;
    const title = item.title || item.name || "Untitled";
    const posterPath = item.poster_path || "";
    const releaseDate = item.release_date || item.first_air_date || "";
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const voteAverage = item.vote_average || 0;
    
    console.log("Menyimpan ke history:", { movieId, title, mediaType });
    
    try {
        await supabaseClient
            .from('history')
            .delete()
            .eq('user_email', user.email)
            .eq('movie_id', movieId);

        const { error } = await supabaseClient
            .from('history')
            .insert([{
                user_email: user.email,
                movie_id: movieId,
                title: title,
                poster_path: posterPath,
                release_date: releaseDate,
                media_type: mediaType,
                vote_average: voteAverage
            }]);
        
        if (error) {
            console.error("Error insert history:", error);
        } else {
            console.log("History berhasil disimpan");
        }
    } catch (err) {
        console.error("Error addToHistory:", err);
    }
}

function searchMovies() {
    if (searchInput && searchInput.value.trim() !== "") {
        searchByQuery(searchInput.value.trim());
    }
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchMovies();
    }
}

async function loadHistory() {
    const user = getCurrentUser();
    const container = document.getElementById("historyContainer");
    if (!container || !user) {
        console.log("Tidak ada user atau container");
        return;
    }
    
    container.innerHTML = '<div class="loading">Memuat riwayat...</div>';
    
    try {
        const { data: historyItems, error } = await supabaseClient
            .from('history')
            .select('*')
            .eq('user_email', user.email)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Supabase error:", error);
            container.innerHTML = '<div class="loading">Gagal memuat riwayat tayangan: ' + error.message + '</div>';
            return;
        }
        
        console.log("History items:", historyItems); 
        
        if (!historyItems || historyItems.length === 0) {
            container.innerHTML = '<div class="loading">Belum ada riwayat tayangan.</div>';
            return;
        }
        
        if (historyItems[0].media_type) {
            currentMediaType = historyItems[0].media_type;
        }
        
        await displayItems(historyItems, container, false);
        
    } catch (err) {
        console.error("Error loadHistory:", err);
        container.innerHTML = '<div class="loading">Gagal memuat riwayat tayangan: ' + err.message + '</div>';
    }
}

async function sendOTP(email) {
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const { error } = await supabaseClient
            .from('otp')
            .insert([{
                email: email,
                code: code,
                expires_at: new Date(Date.now() + 5 * 60000)
            }]);
        if (error) {
            console.error("Gagal simpan OTP:", error);
            return false;
        }
        await emailjs.send("service_m3kjfyn", "template_fbc55ps", {
            to_email: email,
            otp_code: code
        });
        return true;
    } catch (err) {
        console.error("Error send OTP:", err);
        return false;
    }
}

async function verifyOTP(email, code) {
    const { data, error } = await supabaseClient
        .from('otp')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString());
    
    if (error || !data || data.length === 0) {
        return false;
    }

    await supabaseClient
        .from('otp')
        .update({ used: true })
        .eq('id', data[0].id);

    const { data: users } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email);
    
    const userData = users && users.length > 0 ? users[0] : { email: email };
    
    localStorage.setItem("movieMatchCurrentUser", JSON.stringify(userData));
    updateNavAuth();

    currentGenreId = '';
    currentGenreName = '';
    currentGenrePage = 1;

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
        } else {
            btn.textContent = `Kirim ulang (${seconds}s)`;
        }
    }, 1000);
}

if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const { data: users, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password);
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
        
        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        const { data: existing } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email);
        
        if (existing && existing.length > 0) {
            document.getElementById("registerMessage").textContent = "Email sudah terdaftar!";
            return;
        }

        const { error } = await supabaseClient
            .from('users')
            .insert([{ name, email, password }]);
        
        if (error) {
            document.getElementById("registerMessage").textContent = "Error: " + error.message;
            return;
        }

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
        happy: [35, 10751, 16],
        scary: [27, 53],
        action: [28, 12, 878],
        sad: [18, 10749],
        chill: [10751, 35]
    };

    const genreIds = genreMap[mood] || [35, 10751];
    const genreId = genreIds.join(',');

    currentGenreId = genreId;
    currentGenreName = mood;
    currentGenrePage = page;

    history.pushState({ genre: mood, page: page }, "", `?mood=${mood}&page=${page}`);

    if (movieTitle) {
        const moodNames = {
            happy: 'Happy / Senang',
            scary: 'Scary / Takut',
            action: 'Exciting / Seru',
            sad: 'Emotional / Perasaan',
            chill: 'Relaxed / Rileks'
        };
        movieTitle.textContent = `Mood: ${moodNames[mood] || mood} - Halaman ${page}`;
    }

    if (movieContainer) {
        movieContainer.innerHTML = '<div class="loading">Memuat rekomendasi...</div>';
    }

    let url = `${BASE_URL}/discover/${currentMediaType}?with_genres=${genreId}&language=id-ID&page=${page}&sort_by=popularity.desc`;

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        const data = await res.json();
        await displayItems(data.results, movieContainer, true);
        addGenrePagination(data.total_pages, page);
        scrollToMovies();
    } catch (err) {
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Gagal memuat rekomendasi mood.</div>';
        }
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
    const bars = [strBar1, strBar2, strBar3, strBar4];
    const labels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];
    
    bars.forEach((bar, index) => {
        if (index < score) {
            bar.style.background = colors[score];
        } else {
            bar.style.background = '#333';
        }
    });
    
    strText.textContent = labels[score] || 'Ketik password...';
    strText.style.color = colors[score] || '#888';
}

function generateStrongPassword() {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const specials = '!@#$%^&*()_+-=';
    const all = lower + upper + digits + specials;
    
    let pass = '';
    pass += lower[Math.floor(Math.random() * lower.length)];
    pass += upper[Math.floor(Math.random() * upper.length)];
    pass += digits[Math.floor(Math.random() * digits.length)];
    pass += specials[Math.floor(Math.random() * specials.length)];
    
    for (let i = 4; i < 16; i++) {
        pass += all[Math.floor(Math.random() * all.length)];
    }
    
    return pass.split('').sort(() => Math.random() - 0.5).join('');
}

document.addEventListener('click', function(event) {
    const iframe = document.getElementById('playerFrame');
    if (iframe && iframe.contains(event.target)) {
        event.stopPropagation();
    }
}, true);

window.open = function(url) {
    console.warn("Pop-up iklan berhasil ditahan:", url);
    return null;
};

function filterByYear(value) {
    const cards = document.querySelectorAll('.movie-card');
    if (!cards || cards.length === 0) {
        loadContent(currentFilterParam, currentPage);
        setTimeout(function() { filterByYear(value); }, 500);
        return;
    }
    cards.forEach(function(card) {
        card.style.display = '';
    });
    if (value === 'all') return;
    cards.forEach(function(card) {
        const yearText = card.querySelector('.movie-info p')?.textContent || '';
        const match = yearText.match(/\b(19|20)\d{2}\b/);
        const year = match ? parseInt(match[0]) : 0;
        if (year !== parseInt(value)) {
            card.style.display = 'none';
        }
    });
}

function shareMovie(title, overview, poster) {
    const url = window.location.href;
    const shareData = {
        title: title,
        text: title + '\n' + overview.substring(0, 100) + '...\n\nWatch on MovieMatch',
        url: url
    };
    if (navigator.share) {
        navigator.share(shareData).catch(function() {});
    } else {
        const shareUrl = 'https://wa.me/?text=' + encodeURIComponent(shareData.text + ' ' + shareData.url);
        window.open(shareUrl, '_blank');
    }
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

document.addEventListener('click', function(e) {
    if (e.target.textContent === 'Watch Trailer') {
        const container = document.getElementById('trailerContainer');
        if (container) {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
        }
    }
});

function getWatchlist() {
    return JSON.parse(localStorage.getItem("movieMatchWatchlist")) || [];
}

function saveWatchlist(watchlist) {
    localStorage.setItem("movieMatchWatchlist", JSON.stringify(watchlist));
}

function toggleWatchlist(itemId, mediaType, buttonElement) {
    let watchlist = getWatchlist();
    const exists = watchlist.some(w => w.id === itemId);
    
    if (exists) {
        watchlist = watchlist.filter(w => w.id !== itemId);
        if (buttonElement) {
            buttonElement.classList.remove("active");
            buttonElement.innerHTML = "☆";
        }
        showNotification("Dihapus dari Watchlist", "error");
    } else {
        watchlist.push({ id: itemId, media_type: mediaType });
        if (buttonElement) {
            buttonElement.classList.add("active");
            buttonElement.innerHTML = "★";
        }
        showNotification("Ditambahkan ke Watchlist", "success");
    }
    
    saveWatchlist(watchlist);
}

function showNotification(message, type = "success") {
    const oldNotif = document.querySelector(".notification");
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement("div");
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add("show"), 10);
    
    setTimeout(() => {
        notif.classList.remove("show");
        setTimeout(() => notif.remove(), 400);
    }, 2500);
}

async function loadLandingSlider() {
    const container = document.getElementById("landingSlider");
    const dotsContainer = document.getElementById("landingDots");
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Memuat rekomendasi...</div>';
    
    try {
        const [trendingRes, popularRes] = await Promise.all([
            fetch(`${BASE_URL}/trending/all/week?language=en-US`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            }),
            fetch(`${BASE_URL}/movie/popular?language=en-US&page=1`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            })
        ]);
        
        const trending = await trendingRes.json();
        const popular = await popularRes.json();
        
        const allItems = [...(trending.results || []), ...(popular.results || [])];
        const unique = [];
        const seen = new Set();
        for (const item of allItems) {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                unique.push(item);
            }
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
            
            const poster = item.poster_path 
                ? `${IMAGE_URL}${item.poster_path}` 
                : "https://via.placeholder.com/300x450?text=No+Image";
            const backdrop = item.backdrop_path 
                ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` 
                : poster;
            
            const title = item.title || item.name || "Untitled";
            const year = (item.release_date || item.first_air_date || "").substring(0, 4) || "N/A";
            const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
            const overview = item.overview || "Tidak ada sinopsis.";
            const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");
            
            const genreNames = item.genre_ids && item.genre_ids.length > 0
                ? item.genre_ids.slice(0, 2).map(id => {
                    const genres = {
                        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
                        80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
                        14: "Fantasy", 27: "Horror", 10749: "Romance", 878: "Sci-Fi",
                        53: "Thriller", 10752: "War", 37: "Western"
                    };
                    return genres[id] || "";
                }).filter(Boolean).join(", ")
                : "";
            
            slide.innerHTML = `
                <img class="backdrop" src="${backdrop}" alt="${title}" loading="lazy">
                <div class="overlay"></div>
                <div class="info">
                    <span class="badge">${mediaType === "tv" ? "TV Series" : "Movie"}</span>
                    <h2>${title}</h2>
                    <div class="meta">
                        <span>${year}</span>
                        ${rating !== "N/A" ? `<span>⭐ ${rating}</span>` : ""}
                        ${genreNames ? `<span>${genreNames}</span>` : ""}
                    </div>
                    <p class="overview">${overview}</p>
                    <div class="btn-group">
                        <button class="btn-play" onclick="playNow(${item.id}, '${mediaType}')">▶ Tonton</button>
                        <button class="btn-trailer" onclick="playTrailer(${item.id}, '${mediaType}', this)">▶ Trailer</button>
                        <button class="btn-details" onclick="openModal(${JSON.stringify(item).replace(/'/g, "&#39;")})">Detail</button>
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
            
            slides.forEach((s, i) => {
                s.style.display = i === index ? "flex" : "none";
            });
            dots.forEach((d, i) => {
                d.classList.toggle("active", i === index);
            });
            
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
            if (img.complete) {
                img.classList.add("backdrop-loaded");
            } else {
                img.onload = () => img.classList.add("backdrop-loaded");
            }
        });
        
    } catch (err) {
        console.error("Error loading landing slider:", err);
        container.innerHTML = '<div class="loading">Gagal memuat rekomendasi.</div>';
    }
}

function playNow(id, mediaType) {
    const watchlist = getWatchlist();
    const exists = watchlist.some(w => w.id === id);
    
    fetch(`${BASE_URL}/${mediaType}/${id}?language=en-US`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    })
    .then(res => res.json())
    .then(item => {
        item.media_type = mediaType;
        openModal(item);
    })
    .catch(err => console.error("Error:", err));
}

async function playTrailer(id, mediaType, button) {
    try {
        const url = `${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        
        const trailer = data.results?.find(v => 
            v.type === "Trailer" && v.site === "YouTube"
        );
        
        if (trailer) {
            const trailerUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
            const slide = button.closest(".landing-slide");
            const info = slide.querySelector(".info");
            
            const existingTrailer = slide.querySelector(".trailer-container");
            if (existingTrailer) {
                existingTrailer.remove();
                info.style.display = "block";
                return;
            }
            
            info.style.display = "none";
            const trailerContainer = document.createElement("div");
            trailerContainer.className = "trailer-container";
            trailerContainer.style.cssText = `
                position: relative;
                z-index: 2;
                width: 100%;
                max-width: 800px;
                aspect-ratio: 16/9;
                border-radius: 8px;
                overflow: hidden;
            `;
            trailerContainer.innerHTML = `
                <iframe src="${trailerUrl}" 
                    style="width:100%;height:100%;border:none;" 
                    allowfullscreen 
                    allow="autoplay; encrypted-media">
                </iframe>
                <button onclick="closeTrailer(this)" 
                    style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 12px;border-radius:4px;">
                    ✕
                </button>
            `;
            slide.appendChild(trailerContainer);
        } else {
            showNotification("Trailer tidak tersedia", "error");
        }
    } catch (err) {
        console.error("Error loading trailer:", err);
        showNotification("Gagal memuat trailer", "error");
    }
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
        const res = await fetch(`${BASE_URL}/trending/all/week?language=en-US`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        const items = (data.results || []).slice(0, 10);
        
        container.innerHTML = "";
        
        items.forEach((item, index) => {
            const div = document.createElement("div");
            div.className = "top-ten-item";
            
            const poster = item.poster_path 
                ? `${IMAGE_URL}${item.poster_path}` 
                : "https://via.placeholder.com/300x450?text=No+Image";
            
            const title = item.title || item.name || "Untitled";
            const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");
            
            div.innerHTML = `
                <span class="number">${index + 1}</span>
                <img src="${poster}" alt="${title}" loading="lazy">
                <div class="title-overlay">
                    <span>${title}</span>
                </div>
            `;
            
            div.onclick = () => {
                fetch(`${BASE_URL}/${mediaType}/${item.id}?language=en-US`, {
                    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
                })
                .then(res => res.json())
                .then(fullItem => {
                    fullItem.media_type = mediaType;
                    openModal(fullItem);
                })
                .catch(err => console.error("Error:", err));
            };
            
            container.appendChild(div);
        });
        
    } catch (err) {
        console.error("Error loading Top 10:", err);
        container.innerHTML = '<div class="loading">Gagal memuat Top 10.</div>';
    }
}
