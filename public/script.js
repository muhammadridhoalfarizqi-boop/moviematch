const API_KEY = "c460f7483f7f090ecb7b0ebf0b214d50";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const SUPABASE_URL = "https://yratvqvtlixcvyciqrsg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable___KN08wXZeXaPpHU6z-DAQ_JbZXIoyj";
const OPENSUBTITLES_API_KEY = "C3oTYqRkJtvkZFVR4r361m0zFfInJcom";

const supabaseClient = window.supabase.createClient("https://yratvqvtlixcvyciqrsg.supabase.co", "sb_publishable___KN08wXZeXaPpHU6z-DAQ_JbZXIoyj");

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
});

window.open = function(url, name, features) {
    console.warn("Ngeblokir bukaan tab baru:", url);
    return null;
};

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
        scrollToMovies();
    } catch (err) {
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

    let url = `${BASE_URL}/search/${currentMediaType}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=id-ID`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        displayItems(data.results, movieContainer, true);
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

        const poster = item.poster_path && item.poster_path.length > 3
            ? `${IMAGE_URL}${item.poster_path}` 
            : 'https://via.placeholder.com/300x450?text=No+Image';
        
        const title = item.title || item.name || "Untitled";
        const originalTitle = item.original_title || item.original_name || "";
        
        const displaySubTitle = (originalTitle && originalTitle !== title) ? `<span style="font-size: 11px; color: #888; display: block; margin-top: 2px;">${originalTitle}</span>` : "";

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
    });
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

    let url = `${BASE_URL}/discover/${currentMediaType}?api_key=${API_KEY}&with_genres=${genreId}&language=id-ID&page=${page}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        displayItems(data.results, movieContainer, true);
        addGenrePagination(data.total_pages, page);
        scrollToMovies();
    } catch (err) {
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Gagal memuat genre.</div>';
        }
    }
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
        { name: "Zxcstream", url: `https://zxcstream.xyz/embed/${currentMediaType}/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
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
        { name: "Dailymotion", url: `https://www.dailymotion.com/embed/video/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "Rumble", url: `https://rumble.com/embed/${activeItemId}/&sub=id,en&sub-source=opensubtitles` },
        { name: "Ok.ru", url: `https://ok.ru/videoembed/${activeItemId}&sub=id,en&sub-source=opensubtitles` },
        { name: "Bstation", url: `https://player.bilibili.com/player.html?bvid=${activeItemId}&high_quality=1&danmaku=0` }
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
                'Api-Key': C3oTYqRkJtvkZFVR4r361m0zFfInJcom,
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
        await emailjs.send("service_m3kjfyn", "template_fbc5!", {
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

    let url = `${BASE_URL}/discover/${currentMediaType}?api_key=${API_KEY}&with_genres=${genreId}&language=id-ID&page=${page}&sort_by=popularity.desc`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        displayItems(data.results, movieContainer, true);
        addGenrePagination(data.total_pages, page);
        scrollToMovies();
    } catch (err) {
        if (movieContainer) {
            movieContainer.innerHTML = '<div class="loading">Gagal memuat rekomendasi mood.</div>';
        }
    }
}
