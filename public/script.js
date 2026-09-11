const API_KEY = "c460f7483f7f090ecb7b0ebf0b214d50";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNDYwZjc0ODNmN2YwOTBlY2I3YjBlYmYwYjIxNGQ1MCIsIm5iZiI6MTc4ODQ3NDYyMi44OTYsInN1YiI6IjZhOTlmNGZlNTZlODkxMjg0OTgzZGRkOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ULTfSl002E5c4EXvAj9uIE4f_tFJMP98SBGGQEdEerE";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const SUPABASE_URL = "https://yratvqvtlixcvyciqrsg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable___KN08wXZeXaPpHU6z-DAQ_JbZXIoyj";
const OPENSUBTITLES_API_KEY = "C3oTYqRkJtvkZFVR4r361m0zFfInJcom";
const SUB_PARAMS = "&sub=id,en&sub-source=opensubtitles";

let supabaseClient = null;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Supabase SDK tidak tersedia.");
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

let currentUserRating = 0;
let trailerAutoPlayTimer = null;
let currentTrailerPlaying = false;

let currentSubtitleOffset = 0;
let subtitleOffsetSaved = {};
let actorSearchDebounceTimer = null;
let currentActorFilter = null;
let detailTrailerTimer = null;
let detailTrailerActive = false;

let playbackSpeedIndex = 0;
let currentBrightness = 100;
let currentQuality = 'auto';
let currentAudioTrack = 'default';
let currentWatchlistFolder = 'default';
let watchlistFolders = {};
let manualSubtitleUrl = null;
let moodHistory = {};
let userProfile = {};
let isPremiumUser = false;
let selectedPremiumPlan = null;
let currentReviewRating = 0;

const ICON_TRANSLATE = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"/></svg>`;
const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`;
const ICON_LOADING = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:4px;animation:spin 1s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>`;
const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.5, 0.75];

const TRANSLATIONS = {
    id: {
        'nav.home': 'Home', 'nav.search': 'Search', 'nav.favorites': 'Favorites', 'nav.watchlist': 'Watchlist', 'nav.continue': 'Continue',
        'hero.label': 'REKOMENDASI FILM & TV', 'hero.title': 'Temukan tayangan yang', 'hero.titleAccent': 'cocok dengan anda.',
        'hero.description': 'Temukan film dan series berdasarkan mood, genre, dan preferensi kamu.', 'hero.button': 'Cari Konten',
        'topten.label': 'TRENDING', 'topten.title': 'Top 10 Minggu Ini', 'topten.description': 'Film dan series paling populer saat ini.',
        'recommend.label': 'UNTUKMU', 'recommend.title': 'Rekomendasi Untukmu', 'recommend.description': 'Berdasarkan film yang kamu tonton.',
        'toprated.label': 'RATING TERTINGGI', 'toprated.title': 'Rating Tertinggi', 'toprated.description': 'Film dan series dengan rating terbaik dari pengguna.',
        'continue.label': 'LANJUTKAN', 'continue.title': 'Lanjutkan Nonton', 'continue.description': 'Lanjutkan tontonan yang belum selesai.',
        'nowplaying.label': 'SEDANG TAYANG', 'nowplaying.title': 'Sedang Tayang', 'nowplaying.description': 'Film yang sedang tayang di bioskop.',
        'airing.label': 'TAYANG HARI INI', 'airing.title': 'Tayang Hari Ini', 'airing.description': 'Series yang tayang hari ini.',
        'mood.label': 'MOODMATCH', 'mood.title': 'Apa yang kamu rasakan hari ini?', 'mood.description': 'Pilih suasana yang sedang kamu rasakan.',
        'mood.happy': 'Happy / Senang', 'mood.happyDesc': 'Comedy and animation',
        'mood.scary': 'Scary / Takut', 'mood.scaryDesc': 'Horror and thriller',
        'mood.action': 'Exciting / Seru', 'mood.actionDesc': 'Action and adventure',
        'mood.sad': 'Emotional / Perasaan', 'mood.sadDesc': 'Drama and romance',
        'mood.chill': 'Relaxed / Rileks', 'mood.chillDesc': 'Family and comedy',
        'platform.label': 'PLATFORM STREAMING', 'platform.title': 'Tersedia di Platform', 'platform.description': 'Klik logo untuk melihat konten eksklusif dari platform tersebut.',
        'detail.play': 'Tonton', 'detail.download': 'Unduh', 'detail.watchlist': 'Watchlist', 'detail.bookmarked': 'Tersimpan',
        'detail.overview': 'Sinopsis', 'detail.trailer': 'Trailer', 'detail.similar': 'Mirip', 'detail.translate': 'Terjemahkan',
        'player.back': 'Kembali', 'player.disableAds': 'Matikan iklan', 'player.subtitleOffset': 'Delay Subtitle:', 'player.reset': 'Reset',
        'search.label': 'JELAJAHI & CARI', 'search.title': 'Pilih Kategori Tayangan', 'search.recent': 'Pencarian Terakhir:',
        'search.clear': 'Hapus', 'search.placeholder': 'Cari judul...', 'search.button': 'Cari',
        'search.actorPlaceholder': 'Cari aktor/sutradara...', 'search.actorBtn': 'Cari', 'search.filteringBy': 'Filter berdasarkan:',
        'catalog.label': 'KATALOG', 'favorites.label': 'DAFTAR TERSIMPAN', 'favorites.title': 'Favorit Kamu',
        'watchlist.label': 'BOOKMARK', 'watchlist.title': 'Watchlist Kamu',
        'profile.label': 'PROFIL PENGGUNA', 'profile.logout': 'Logout', 'profile.history': 'Riwayat Tayangan Dilihat',
        'auth.loginTitle': 'Selamat Datang', 'auth.loginDesc': 'Login untuk melanjutkan ke MovieMatch.',
        'auth.email': 'Email', 'auth.password': 'Password', 'auth.login': 'Login',
        'auth.noAccount': 'Belum punya akun?', 'auth.register': 'Daftar',
        'auth.registerTitle': 'Buat Akun', 'auth.registerDesc': 'Buat akun untuk pengalaman MovieMatch.',
        'auth.name': 'Nama', 'auth.create': 'Buat Akun', 'auth.hasAccount': 'Sudah punya akun?',
        'auth.typePassword': 'Ketik password...', 'auth.suggest': 'Saran Password Kuat',
        'otp.title': 'Verifikasi OTP', 'otp.description': 'Masukkan kode OTP yang telah dikirim ke email Anda.',
        'otp.label': 'Kode OTP', 'otp.verify': 'Verifikasi', 'otp.noCode': 'Belum dapat kode?',
        'otp.resend': 'Kirim ulang', 'otp.backLogin': 'Kembali ke Login',
        'download.title': 'Unduh', 'download.video': 'Video', 'download.subtitle': 'Subtitle', 'download.info': 'Info',
        'download.hint': 'Pilih server untuk mengunduh film atau series.',
        'download.subtitleHint': 'Pilih bahasa subtitle untuk diunduh sebagai file .srt',
        'download.howTo': 'Cara Download', 'download.step1': 'Pilih server dari tab Video',
        'download.step2': 'Jika muncul halaman baru, klik tombol download', 'download.step3': 'Pilih kualitas jika tersedia',
        'download.step4': 'Tunggu hingga file terunduh', 'download.tips': 'Tips',
        'download.tip1': 'Gunakan WiFi untuk download file besar', 'download.tip2': 'Beberapa server butuh VPN',
        'download.tip3': 'Kalau server mati, coba server lain', 'download.tip4': 'Subtitle bisa di-load manual',
        'download.note': 'Catatan', 'download.noteText': 'Fitur download hanya untuk penggunaan pribadi.',
        'cat.popular': 'Populer', 'cat.trending': 'Trending Minggu Ini', 'cat.toprated': 'Rating Tertinggi',
        'cat.nowplaying': 'Sedang Tayang', 'cat.airing': 'Tayang Hari Ini',
        'filter.movies': 'FILM', 'filter.series': 'SERI',
        'genre.all': 'Semua Genre', 'runtime.all': 'Semua Durasi', 'runtime.short': 'Singkat (< 90 Menit)',
        'runtime.medium': 'Sedang (90 - 120 Menit)', 'runtime.long': 'Panjang (> 120 Menit)',
        'year.all': 'Semua Tahun', 'studio.all': 'Semua Studio',
        'sort.default': 'Urut: Default', 'sort.popDesc': 'Populer (Tertinggi)', 'sort.popAsc': 'Populer (Terendah)',
        'sort.ratingDesc': 'Rating (Tertinggi)', 'sort.ratingAsc': 'Rating (Terendah)',
        'sort.newest': 'Rilis Terbaru', 'sort.oldest': 'Rilis Terlama', 'sort.az': 'Judul A-Z',
        'lang.all': 'Semua Bahasa',
        'notif.title': 'Notifikasi Episode Baru'
    },
    en: {
        'nav.home': 'Home', 'nav.search': 'Search', 'nav.favorites': 'Favorites', 'nav.watchlist': 'Watchlist', 'nav.continue': 'Continue',
        'hero.label': 'MOVIE & TV RECOMMENDATION', 'hero.title': 'Find shows that', 'hero.titleAccent': 'match your taste.',
        'hero.description': 'Find movies and series based on your mood, genre, and preferences.', 'hero.button': 'Find My Content',
        'topten.label': 'TRENDING', 'topten.title': 'Top 10 This Week', 'topten.description': 'Most popular movies and series right now.',
        'recommend.label': 'FOR YOU', 'recommend.title': 'Recommended For You', 'recommend.description': 'Based on what you have watched.',
        'toprated.label': 'TOP RATED', 'toprated.title': 'Highest Rated', 'toprated.description': 'Movies and series with best user ratings.',
        'continue.label': 'CONTINUE WATCHING', 'continue.title': 'Continue Watching', 'continue.description': 'Continue your unfinished shows.',
        'nowplaying.label': 'NOW PLAYING', 'nowplaying.title': 'Now Playing', 'nowplaying.description': 'Movies currently in theaters.',
        'airing.label': 'AIRING TODAY', 'airing.title': 'Airing Today', 'airing.description': 'Series airing today.',
        'mood.label': 'MOODMATCH', 'mood.title': 'How are you feeling today?', 'mood.description': 'Pick your current mood.',
        'mood.happy': 'Happy', 'mood.happyDesc': 'Comedy and animation',
        'mood.scary': 'Scary', 'mood.scaryDesc': 'Horror and thriller',
        'mood.action': 'Exciting', 'mood.actionDesc': 'Action and adventure',
        'mood.sad': 'Emotional', 'mood.sadDesc': 'Drama and romance',
        'mood.chill': 'Relaxed', 'mood.chillDesc': 'Family and comedy',
        'platform.label': 'STREAMING PLATFORMS', 'platform.title': 'Available On', 'platform.description': 'Click a logo to see exclusive content.',
        'detail.play': 'Play Now', 'detail.download': 'Download', 'detail.watchlist': 'Watchlist', 'detail.bookmarked': 'Bookmarked',
        'detail.overview': 'Overview', 'detail.trailer': 'Trailer', 'detail.similar': 'Similar', 'detail.translate': 'Translate',
        'player.back': 'Back', 'player.disableAds': 'Disable ads', 'player.subtitleOffset': 'Subtitle Delay:', 'player.reset': 'Reset',
        'search.label': 'EXPLORE & SEARCH', 'search.title': 'Pick a Category', 'search.recent': 'Recent Searches:',
        'search.clear': 'Clear', 'search.placeholder': 'Search title...', 'search.button': 'Search',
        'search.actorPlaceholder': 'Search actor/director...', 'search.actorBtn': 'Search', 'search.filteringBy': 'Filtering by:',
        'catalog.label': 'CATALOG', 'favorites.label': 'SAVED LIST', 'favorites.title': 'Your Favorites',
        'watchlist.label': 'BOOKMARK', 'watchlist.title': 'Your Watchlist',
        'profile.label': 'USER PROFILE', 'profile.logout': 'Logout', 'profile.history': 'Watch History',
        'auth.loginTitle': 'Welcome Back', 'auth.loginDesc': 'Login to continue to MovieMatch.',
        'auth.email': 'Email', 'auth.password': 'Password', 'auth.login': 'Login',
        'auth.noAccount': "Don't have an account?", 'auth.register': 'Register',
        'auth.registerTitle': 'Create an Account', 'auth.registerDesc': 'Create an account for the MovieMatch experience.',
        'auth.name': 'Name', 'auth.create': 'Create Account', 'auth.hasAccount': 'Already have an account?',
        'auth.typePassword': 'Type password...', 'auth.suggest': 'Suggest Strong Password',
        'otp.title': 'OTP Verification', 'otp.description': 'Enter the OTP code sent to your email.',
        'otp.label': 'OTP Code', 'otp.verify': 'Verify', 'otp.noCode': "Didn't get a code?",
        'otp.resend': 'Resend', 'otp.backLogin': 'Back to Login',
        'download.title': 'Download', 'download.video': 'Video', 'download.subtitle': 'Subtitle', 'download.info': 'Info',
        'download.hint': 'Pick a server to download the movie or series.',
        'download.subtitleHint': 'Pick a subtitle language to download as .srt',
        'download.howTo': 'How to Download', 'download.step1': 'Pick a server from the Video tab',
        'download.step2': 'If a new page opens, click download', 'download.step3': 'Pick quality if available',
        'download.step4': 'Wait until the file finishes', 'download.tips': 'Tips',
        'download.tip1': 'Use WiFi for large files', 'download.tip2': 'Some servers need a VPN',
        'download.tip3': 'If a server is down, try another', 'download.tip4': 'Subtitles can be loaded manually',
        'download.note': 'Note', 'download.noteText': 'Download is for personal use only.',
        'cat.popular': 'Popular', 'cat.trending': 'Trending Week', 'cat.toprated': 'Top Rated',
        'cat.nowplaying': 'Now Playing', 'cat.airing': 'Airing Today',
        'filter.movies': 'MOVIES', 'filter.series': 'SERIES',
        'genre.all': 'All Genres', 'runtime.all': 'All Runtimes', 'runtime.short': 'Short (< 90 min)',
        'runtime.medium': 'Medium (90 - 120 min)', 'runtime.long': 'Long (> 120 min)',
        'year.all': 'All Years', 'studio.all': 'All Studios',
        'sort.default': 'Sort: Default', 'sort.popDesc': 'Popularity (High)', 'sort.popAsc': 'Popularity (Low)',
        'sort.ratingDesc': 'Rating (High)', 'sort.ratingAsc': 'Rating (Low)',
        'sort.newest': 'Newest Release', 'sort.oldest': 'Oldest Release', 'sort.az': 'Title A-Z',
        'lang.all': 'All Languages',
        'notif.title': 'New Episode Notification'
    }
};

const QUALITIES = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: '1080p' },
    { label: '720p', value: '720p' },
    { label: '480p', value: '480p' },
    { label: '360p', value: '360p' }
];

const AUDIO_TRACKS = [
    { label: 'Original', value: 'default' },
    { label: 'English', value: 'en' },
    { label: 'Indonesian', value: 'id' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Korean', value: 'ko' }
];

const COUNTRY_NAMES = {
    ID: 'Indonesia',
    US: 'Amerika',
    KR: 'Korea',
    JP: 'Jepang',
    GB: 'Inggris',
    IN: 'India',
    TH: 'Thailand',
    CN: 'China'
};

let currentLang = localStorage.getItem('movieMatchLang') || 'id';

function applyLanguage() {
    const t = TRANSLATIONS[currentLang];
    if (!t) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
    const langBtn = document.getElementById('langToggle');
    if (langBtn) langBtn.textContent = currentLang.toUpperCase();
    document.documentElement.lang = currentLang;
    updateNavAuth();
}

function toggleLanguage() {
    currentLang = currentLang === 'id' ? 'en' : 'id';
    localStorage.setItem('movieMatchLang', currentLang);
    applyLanguage();
    showToast(currentLang === 'id' ? 'Bahasa diubah ke Indonesia' : 'Language changed to English', 'success');
}

function getSearchHistory() {
    try { return JSON.parse(localStorage.getItem('movieMatchSearchHistory')) || []; }
    catch { return []; }
}

function saveSearchHistory(history) {
    localStorage.setItem('movieMatchSearchHistory', JSON.stringify(history.slice(0, 10)));
}

function addToSearchHistory(query) {
    if (!query || query.trim().length < 2) return;
    let history = getSearchHistory();
    history = history.filter(h => h.toLowerCase() !== query.toLowerCase());
    history.unshift(query.trim());
    saveSearchHistory(history);
    renderSearchHistory();
}

function removeFromSearchHistory(query) {
    let history = getSearchHistory();
    history = history.filter(h => h !== query);
    saveSearchHistory(history);
    renderSearchHistory();
}

function clearSearchHistory() {
    localStorage.removeItem('movieMatchSearchHistory');
    renderSearchHistory();
    showToast('Riwayat pencarian dihapus', 'info');
}

function renderSearchHistory() {
    const container = document.getElementById('searchHistoryContainer');
    const chips = document.getElementById('searchHistoryChips');
    if (!container || !chips) return;
    const history = getSearchHistory();
    if (history.length === 0) {
        container.classList.remove('visible');
        return;
    }
    container.classList.add('visible');
    chips.innerHTML = history.map(h => `
        <span class="search-history-chip" onclick="searchFromHistory('${escapeHtml(h).replace(/'/g, "&#39;")}')">
            ${escapeHtml(h)}
            <span class="chip-remove" onclick="event.stopPropagation(); removeFromSearchHistory('${escapeHtml(h).replace(/'/g, "&#39;")}')">&times;</span>
        </span>
    `).join('');
}

function searchFromHistory(query) {
    if (searchInput) searchInput.value = query;
    searchByQuery(query);
}

function getUserRatings() {
    try { return JSON.parse(localStorage.getItem('movieMatchUserRatings')) || {}; }
    catch { return {}; }
}

function saveUserRatings(ratings) {
    localStorage.setItem('movieMatchUserRatings', JSON.stringify(ratings));
}

function setUserRating(value) {
    if (!currentDetailItem) return;
    const key = `${currentDetailItem.id}_${currentDetailItem.mediaType || currentMediaType}`;
    const ratings = getUserRatings();
    ratings[key] = value;
    saveUserRatings(ratings);
    currentUserRating = value;
    updateUserRatingUI();
    showToast(`Rating: ${value}/10`, 'success');
}

function updateUserRatingUI() {
    const stars = document.querySelectorAll('.user-star');
    const valueEl = document.getElementById('userRatingValue');
    stars.forEach((star, index) => {
        const val = index + 1;
        star.classList.toggle('filled', val <= currentUserRating);
    });
    if (valueEl) {
        if (currentUserRating > 0) valueEl.textContent = `${currentUserRating}/10`;
        else valueEl.textContent = currentLang === 'id' ? 'Belum ada rating' : 'No rating yet';
    }
}

function loadUserRating() {
    if (!currentDetailItem) return;
    const key = `${currentDetailItem.id}_${currentDetailItem.mediaType || currentMediaType}`;
    const ratings = getUserRatings();
    currentUserRating = ratings[key] || 0;
    updateUserRatingUI();
    setupStarHover();
}

function setupStarHover() {
    const stars = document.querySelectorAll('.user-star');
    stars.forEach(star => {
        star.addEventListener('mouseenter', function() {
            const val = parseInt(this.dataset.value);
            stars.forEach((s, i) => s.classList.toggle('hovered', i < val));
        });
        star.addEventListener('mouseleave', function() {
            stars.forEach(s => s.classList.remove('hovered'));
        });
    });
}

function loadSubtitleOffsets() {
    try {
        subtitleOffsetSaved = JSON.parse(localStorage.getItem('movieMatchSubtitleOffsets')) || {};
    } catch {
        subtitleOffsetSaved = {};
    }
}

function saveSubtitleOffsets() {
    try {
        localStorage.setItem('movieMatchSubtitleOffsets', JSON.stringify(subtitleOffsetSaved));
    } catch (e) {
        console.warn('Gagal simpan offset subtitle:', e);
    }
}

function getSubtitleOffsetKey() {
    if (!currentDetailItem) return null;
    const id = currentDetailItem.id;
    const mediaType = currentDetailItem.mediaType || currentMediaType;
    if (mediaType === 'tv') {
        return `${id}_${mediaType}_s${activeSeason}e${activeEpisode}`;
    }
    return `${id}_${mediaType}`;
}

function adjustSubtitleOffset(seconds) {
    currentSubtitleOffset += seconds;
    if (currentSubtitleOffset > 60) currentSubtitleOffset = 60;
    if (currentSubtitleOffset < -60) currentSubtitleOffset = -60;

    const key = getSubtitleOffsetKey();
    if (key) {
        subtitleOffsetSaved[key] = currentSubtitleOffset;
        saveSubtitleOffsets();
    }

    updateSubtitleOffsetUI();

    const displayValue = currentSubtitleOffset >= 0 ? `+${currentSubtitleOffset}s` : `${currentSubtitleOffset}s`;
    showToast(`Subtitle delay: ${displayValue}`, 'info', 1500);

    applySubtitleOffsetToIframe();
}

function resetSubtitleOffset() {
    currentSubtitleOffset = 0;
    const key = getSubtitleOffsetKey();
    if (key) {
        delete subtitleOffsetSaved[key];
        saveSubtitleOffsets();
    }
    updateSubtitleOffsetUI();
    showToast('Subtitle delay direset ke 0s', 'success', 1500);
    applySubtitleOffsetToIframe();
}

function updateSubtitleOffsetUI() {
    const valueEl = document.getElementById('subtitleOffsetValue');
    if (!valueEl) return;
    const displayValue = currentSubtitleOffset >= 0 ? `+${currentSubtitleOffset}s` : `${currentSubtitleOffset}s`;
    valueEl.textContent = currentSubtitleOffset === 0 ? '0s' : displayValue;
    valueEl.style.color = currentSubtitleOffset === 0 ? '#888' : '#f1c40f';
}

function loadSubtitleOffsetForCurrent() {
    const key = getSubtitleOffsetKey();
    if (key && subtitleOffsetSaved[key] !== undefined) {
        currentSubtitleOffset = subtitleOffsetSaved[key];
    } else {
        currentSubtitleOffset = 0;
    }
    updateSubtitleOffsetUI();
}

function applySubtitleOffsetToIframe() {
    const iframe = document.getElementById('playerFrame');
    if (!iframe || !iframe.src) return;

    try {
        const url = new URL(iframe.src);
        if (currentSubtitleOffset !== 0) {
            url.searchParams.set('sub_offset', currentSubtitleOffset);
            url.searchParams.set('sub_delay', currentSubtitleOffset);
            url.searchParams.set('subtitle_offset', currentSubtitleOffset);
        } else {
            url.searchParams.delete('sub_offset');
            url.searchParams.delete('sub_delay');
            url.searchParams.delete('subtitle_offset');
        }
        iframe.src = url.toString();
    } catch (e) {
        console.warn('Tidak bisa apply offset ke iframe:', e);
    }
}

async function loadRecommendations() {
    const container = document.getElementById('recommendationContainer');
    if (!container) return;

    const user = getCurrentUser();
    if (!user || !supabaseClient) {
        container.innerHTML = '<div class="loading">Login untuk melihat rekomendasi personal.</div>';
        return;
    }

    container.innerHTML = '<div class="loading">Memuat rekomendasi...</div>';

    try {
        const { data: history } = await supabaseClient
            .from('history')
            .select('*')
            .eq('user_email', user.email)
            .order('created_at', { ascending: false })
            .limit(5);

        if (!history || history.length === 0) {
            container.innerHTML = '<div class="loading">Tonton beberapa film dulu untuk mendapatkan rekomendasi.</div>';
            return;
        }

        const seedIds = new Set(history.map(h => h.movie_id));
        const recommendationPromises = history.slice(0, 3).map(h => {
            const mt = h.media_type || 'movie';
            return fetch(`${BASE_URL}/${mt}/${h.movie_id}/recommendations?language=id-ID&page=1`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            }).then(r => r.json()).catch(() => ({ results: [] }));
        });

        const results = await Promise.all(recommendationPromises);
        const allRecs = [];
        const seen = new Set();
        results.forEach(r => {
            (r.results || []).forEach(item => {
                if (!seedIds.has(item.id) && !seen.has(item.id)) {
                    seen.add(item.id);
                    allRecs.push(item);
                }
            });
        });

        const topRecs = allRecs.slice(0, 12);
        if (topRecs.length === 0) {
            container.innerHTML = '<div class="loading">Belum cukup data untuk rekomendasi.</div>';
            return;
        }

        await displayItems(topRecs, container, false);
    } catch (err) {
        console.error('Recommendation error:', err);
        container.innerHTML = '<div class="loading">Gagal memuat rekomendasi.</div>';
    }
}

async function filterByPerson(personId, personName) {
    showPage('search-page');
    if (movieTitle) movieTitle.textContent = `${personName}`;
    if (catalogTitle) catalogTitle.textContent = `Filmography: ${personName}`;
    if (movieContainer) showSkeletonLoader(movieContainer, 8);

    try {
        const url = `${BASE_URL}/discover/movie?with_cast=${personId}&language=id-ID&page=1&sort_by=popularity.desc`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        await displayItems(data.results, movieContainer, true);
        scrollToMovies();
    } catch (err) {
        if (movieContainer) movieContainer.innerHTML = '<div class="loading">Gagal memuat filmografi.</div>';
    }
}

function handleActorSearchKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchActorByName();
    }
}

async function searchActorByName() {
    const input = document.getElementById('actorSearchInput');
    if (!input) return;

    const query = input.value.trim();
    if (query.length < 2) {
        showToast('Minimal 2 karakter untuk mencari', 'error');
        return;
    }

    const resultsContainer = document.getElementById('actorSearchResults');
    if (!resultsContainer) return;

    resultsContainer.classList.add('visible');
    resultsContainer.innerHTML = '<div class="loading" style="padding: 12px;">Mencari...</div>';

    try {
        const url = `${BASE_URL}/search/person?query=${encodeURIComponent(query)}&language=en-US&page=1`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        const people = (data.results || []).slice(0, 12);

        if (people.length === 0) {
            resultsContainer.innerHTML = '<div class="loading" style="padding: 12px;">Tidak ada hasil ditemukan.</div>';
            return;
        }

        resultsContainer.innerHTML = people.map(person => {
            const photo = person.profile_path
                ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                : 'https://via.placeholder.com/100x100?text=?';
            const dept = person.known_for_department || 'Acting';
            return `
                <div class="actor-result-card" onclick="selectActorFilter(${person.id}, '${escapeHtml(person.name).replace(/'/g, "&#39;")}', '${dept}')">
                    <img class="actor-result-photo" src="${photo}" alt="${escapeHtml(person.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/100x100?text=?'">
                    <div class="actor-result-info">
                        <span class="actor-result-name">${escapeHtml(person.name)}</span>
                        <span class="actor-result-dept">${dept}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Actor search error:', err);
        resultsContainer.innerHTML = '<div class="loading" style="padding: 12px;">Gagal mencari. Coba lagi.</div>';
    }
}

function selectActorFilter(personId, personName, department) {
    currentActorFilter = { id: personId, name: personName, department };

    const resultsContainer = document.getElementById('actorSearchResults');
    if (resultsContainer) {
        resultsContainer.classList.remove('visible');
        resultsContainer.innerHTML = '';
    }

    const input = document.getElementById('actorSearchInput');
    if (input) input.value = '';

    const filterBadge = document.getElementById('activeActorFilter');
    const nameEl = document.getElementById('activeActorName');
    if (filterBadge && nameEl) {
        filterBadge.style.display = 'flex';
        nameEl.textContent = personName;
    }

    filterByActor(personId, personName, department);
}

async function filterByActor(personId, personName, department) {
    showPage('search-page');
    if (movieTitle) movieTitle.textContent = `Film oleh ${personName}`;
    if (catalogTitle) catalogTitle.textContent = `${department}: ${personName}`;
    if (movieContainer) showSkeletonLoader(movieContainer, 8);

    try {
        const param = department === 'Directing' ? 'with_crew' : 'with_cast';
        const url = `${BASE_URL}/discover/movie?${param}=${personId}&language=id-ID&page=1&sort_by=popularity.desc`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            if (movieContainer) {
                movieContainer.innerHTML = `<div class="loading">Tidak ada film ditemukan untuk ${escapeHtml(personName)}.</div>`;
            }
            return;
        }

        currentActorFilter = { id: personId, name: personName, department, page: 1, totalPages: Math.min(data.total_pages, 20) };
        await displayItems(data.results, movieContainer, true);
        scrollToMovies();
    } catch (err) {
        console.error('Filter by actor error:', err);
        if (movieContainer) movieContainer.innerHTML = '<div class="loading">Gagal memuat film.</div>';
    }
}

function clearActorFilter() {
    currentActorFilter = null;

    const filterBadge = document.getElementById('activeActorFilter');
    if (filterBadge) filterBadge.style.display = 'none';

    const resultsContainer = document.getElementById('actorSearchResults');
    if (resultsContainer) {
        resultsContainer.classList.remove('visible');
        resultsContainer.innerHTML = '';
    }

    const input = document.getElementById('actorSearchInput');
    if (input) input.value = '';

    showToast('Filter actor dibersihkan', 'info', 1500);
    loadContent('popular', 1);
}

function setupActorSearch() {
    const input = document.getElementById('actorSearchInput');
    if (input && !input.dataset.bound) {
        input.dataset.bound = 'true';
        input.addEventListener('input', function () {
            clearTimeout(actorSearchDebounceTimer);
            const value = this.value.trim();
            if (value.length === 0) {
                const resultsContainer = document.getElementById('actorSearchResults');
                if (resultsContainer) {
                    resultsContainer.classList.remove('visible');
                    resultsContainer.innerHTML = '';
                }
            }
        });
    }
}

function initAutoTheme() {
    const savedTheme = localStorage.getItem('movieMatchTheme');
    if (savedTheme) {
        if (savedTheme === 'light') document.body.classList.add('light-mode');
        updateThemeIcon();
        return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!prefersDark) document.body.classList.add('light-mode');
    updateThemeIcon();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('movieMatchTheme')) {
            document.body.classList.toggle('light-mode', !e.matches);
            updateThemeIcon();
        }
    });
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isLight = document.body.classList.contains('light-mode');
    btn.textContent = isLight ? '\u2600' : '\u263E';
}

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

function showInstallButton() {
    if (document.getElementById('installBtn')) return;
    const nav = document.getElementById('menuList');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.id = 'installBtn';
    btn.className = 'install-btn';
    btn.textContent = 'Install App';
    btn.onclick = installPWA;
    nav.appendChild(btn);
}

async function installPWA() {
    if (!deferredPrompt) {
        showToast('Aplikasi sudah terinstall atau belum tersedia.', 'info');
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        showToast('Aplikasi berhasil diinstall!', 'success');
    }
    deferredPrompt = null;
    const btn = document.getElementById('installBtn');
    if (btn) btn.remove();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(err => {
            console.warn('Service Worker gagal:', err);
        });
    });
}

function scheduleTrailerAutoPlay(slide, itemId, mediaType) {
    clearTrailerTimer();
    if (currentTrailerPlaying) return;

    trailerAutoPlayTimer = setTimeout(async () => {
        try {
            const res = await fetch(`${BASE_URL}/${mediaType}/${itemId}/videos?api_key=${API_KEY}`);
            const data = await res.json();
            const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            if (!trailer) return;

            const info = slide.querySelector('.info');
            const backdrop = slide.querySelector('.backdrop');
            if (!info) return;

            currentTrailerPlaying = true;
            info.style.display = 'none';
            if (backdrop) backdrop.style.opacity = '0.2';

            const trailerContainer = document.createElement('div');
            trailerContainer.className = 'trailer-autoplay';
            trailerContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:3;';
            trailerContainer.innerHTML = `
                <iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1"
                    style="width:100%;height:100%;border:none;pointer-events:none;"
                    allow="autoplay; encrypted-media"
                    allowfullscreen></iframe>
                <button onclick="stopAutoTrailer(this)" style="position:absolute;top:20px;right:20px;background:rgba(0,0,0,0.7);border:none;color:#fff;font-size:14px;cursor:pointer;padding:8px 14px;border-radius:6px;z-index:4;">Close Trailer</button>
            `;
            slide.appendChild(trailerContainer);
        } catch (err) {
            console.warn('Auto trailer error:', err);
        }
    }, 4000);
}

function clearTrailerTimer() {
    if (trailerAutoPlayTimer) {
        clearTimeout(trailerAutoPlayTimer);
        trailerAutoPlayTimer = null;
    }
}

function stopAutoTrailer(btn) {
    const container = btn.closest('.trailer-autoplay');
    if (!container) return;
    const slide = container.closest('.landing-slide');
    const info = slide.querySelector('.info');
    const backdrop = slide.querySelector('.backdrop');
    container.remove();
    if (info) info.style.display = 'block';
    if (backdrop) backdrop.style.opacity = '';
    currentTrailerPlaying = false;
    clearTrailerTimer();
}

function scheduleDetailTrailerAutoPlay() {
    clearDetailTrailerTimer();
    if (detailTrailerActive) return;
    if (!currentDetailItem) return;

    detailTrailerTimer = setTimeout(async () => {
        if (detailTrailerActive) return;
        if (!currentDetailItem) return;
        if (!document.getElementById('detail-page').classList.contains('active')) return;

        const content = document.getElementById('detailsContent');
        if (!content) return;

        const overviewBtn = document.querySelector('.detailsOverviewbutton');
        if (!overviewBtn || !overviewBtn.classList.contains('red')) return;

        try {
            const id = currentDetailItem.id;
            const mediaType = currentDetailItem.mediaType || 'movie';
            const res = await fetch(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
            const data = await res.json();
            const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            if (!trailer) return;

            detailTrailerActive = true;

            content.innerHTML = `
                <div class="detailsAutoTrailer">
                    <iframe
                        src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0"
                        allow="autoplay; encrypted-media"
                        allowfullscreen>
                    </iframe>
                    <button class="trailer-close-btn" onclick="closeDetailTrailer()">Tutup Trailer</button>
                </div>
            `;
        } catch (err) {
            console.warn('Auto trailer error:', err);
        }
    }, 5000);
}

function clearDetailTrailerTimer() {
    if (detailTrailerTimer) {
        clearTimeout(detailTrailerTimer);
        detailTrailerTimer = null;
    }
}

function closeDetailTrailer() {
    detailTrailerActive = false;
    clearDetailTrailerTimer();

    if (currentDetailItem) {
        const overview = currentOverviewEn || currentDetailItem.overview || 'Tidak ada sinopsis.';
        const content = document.getElementById('detailsContent');
        if (content) {
            content.innerHTML = `<p id="detailsOverviewText">${escapeHtml(overview)}</p>`;
        }
    }
}

function checkForNewEpisodes() {
    const user = getCurrentUser();
    if (!user || !supabaseClient) return;

    supabaseClient
        .from('history')
        .select('*')
        .eq('user_email', user.email)
        .eq('media_type', 'tv')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data: historyItems, error }) => {
            if (error || !historyItems || historyItems.length === 0) return;

            Promise.all(historyItems.map(async (item) => {
                try {
                    const res = await fetch(`${BASE_URL}/tv/${item.movie_id}?language=en-US`, {
                        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
                    });
                    const data = await res.json();

                    const lastAirDate = data.last_air_date;
                    const status = data.status;

                    if (status === 'Returning Series' && lastAirDate) {
                        const daysSince = Math.floor((Date.now() - new Date(lastAirDate).getTime()) / (1000 * 60 * 60 * 24));
                        if (daysSince >= 0 && daysSince <= 30) {
                            return {
                                title: item.title,
                                lastAirDate: lastAirDate,
                                daysSince: daysSince,
                                nextEpisode: data.next_episode_to_air
                            };
                        }
                    }
                    return null;
                } catch {
                    return null;
                }
            })).then(activeShows => {
                const validShows = activeShows.filter(s => s !== null);
                if (validShows.length === 0) return;

                const lastCheckKey = 'movieMatchLastEpisodeCheck';
                const lastCheck = localStorage.getItem(lastCheckKey);
                const todayKey = new Date().toDateString();

                if (lastCheck === todayKey) return;
                localStorage.setItem(lastCheckKey, todayKey);

                const show = validShows[0];
                let message = '';
                if (show.nextEpisode && show.nextEpisode.air_date) {
                    const airDate = new Date(show.nextEpisode.air_date);
                    const daysUntil = Math.floor((airDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysUntil > 0) {
                        message = `${show.title}: Episode baru "${show.nextEpisode.name}" tayang dalam ${daysUntil} hari.`;
                    } else if (daysUntil === 0) {
                        message = `${show.title}: Episode baru "${show.nextEpisode.name}" tayang hari ini!`;
                    } else {
                        message = `${show.title}: Episode baru sudah tersedia!`;
                    }
                } else {
                    message = `${show.title}: Cek episode baru sekarang!`;
                }

                showNotificationBanner(message);

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('MovieMatch - Episode Baru', {
                        body: message,
                        icon: 'icons/icon-192.png',
                        badge: 'icons/icon-192.png',
                        tag: 'episode-notif'
                    });
                }
            });
        });
}

function showNotificationBanner(message) {
    const banner = document.getElementById('notificationBanner');
    const messageEl = document.getElementById('notificationMessage');
    if (!banner || !messageEl) return;

    messageEl.textContent = message;
    banner.style.display = 'block';

    setTimeout(() => {
        closeNotificationBanner();
    }, 10000);
}

function closeNotificationBanner() {
    const banner = document.getElementById('notificationBanner');
    if (banner) banner.style.display = 'none';
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        const activeTag = document.activeElement.tagName;
        const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement.isContentEditable;

        const playerPage = document.getElementById('player-page');
        const isPlayerActive = playerPage && playerPage.classList.contains('active');

        if (e.key === 'Escape') {
            if (movieModal && movieModal.style.display === 'flex') { closeMovieModal(); return; }
            const dlModal = document.getElementById('downloadModal');
            if (dlModal && dlModal.style.display === 'flex') { closeDownloadModal(); return; }
            const scModal = document.getElementById('shortcutsModal');
            if (scModal && scModal.classList.contains('active')) { closeShortcuts(); return; }
            return;
        }

        if (isTyping) return;

        if (e.key === '/' && !isPlayerActive) {
            e.preventDefault();
            if (!document.getElementById('search-page').classList.contains('active')) showPage('search-page');
            setTimeout(() => searchInput && searchInput.focus(), 100);
            return;
        }

        if (e.key === '?') {
            e.preventDefault();
            openShortcuts();
            return;
        }

        if (isPlayerActive) {
            if (e.key === 'ArrowRight') { playNextEpisode(); return; }
            if (e.key === 'ArrowLeft') { playPrevEpisode(); return; }
            if (e.key === 'f' || e.key === 'F') {
                const iframe = document.getElementById('playerFrame');
                if (iframe && iframe.requestFullscreen) iframe.requestFullscreen();
                return;
            }
        }

        switch (e.key.toLowerCase()) {
            case 'h': if (!isTyping) showPage('home-page'); break;
            case 's': if (!isTyping) showPage('search-page'); break;
            case 'f': if (!isTyping && !isPlayerActive) showFavorites(); break;
            case 'w': if (!isTyping && !isPlayerActive) showWatchlist(); break;
            case 't': if (!isTyping) { const btn = document.getElementById('themeToggle'); if (btn) btn.click(); } break;
            case 'l': if (!isTyping) toggleLanguage(); break;
        }
    });
}

function openShortcuts() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.classList.add('active');
}

function closeShortcuts() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.classList.remove('active');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
});

document.addEventListener("DOMContentLoaded", () => {
    loadSavedProgress();
    loadSubtitleOffsets();
    initAutoTheme();
    applyLanguage();
    updateNavAuth();
    renderSearchHistory();
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

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('movieMatchTheme', isLight ? 'light' : 'dark');
            updateThemeIcon();
        });
    }

    setTimeout(() => {
        loadLandingSlider();
        loadTopTen();
        loadRecommendations();
        loadTopRated();
        loadContinueWatching();
        setupActorSearch();
        requestNotificationPermission();
        setTimeout(checkForNewEpisodes, 3000);
    }, 500);

    setupKeyboardShortcuts();
});

const originalFetch = window.fetch;
window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    if (url && (url.includes('ads') || url.includes('doubleclick') || url.includes('googlead'))) {
        return Promise.reject(new Error("Blokir iklan"));
    }
    return originalFetch.call(this, input, init);
};

const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    if (url && (url.includes('ads') || url.includes('doubleclick') || url.includes('googlead'))) {
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

    if (pageId !== 'detail-page') {
        clearDetailTrailerTimer();
        detailTrailerActive = false;
    }

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
            loadRecommendations();
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
        setTimeout(() => { setupActorSearch(); }, 200);
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
    if (user.isAdmin) loadAdminStats();
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
    addToSearchHistory(query);
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
            if (!companyCache.has(item.id) && item.id > 1000) {
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
        if (lang === 'ko') countryText = "Korea";
        else if (lang === 'ja') countryText = "Jepang";
        else if (lang === 'zh' || lang === 'cn') countryText = "China";
        else if (lang === 'th') countryText = "Thailand";
        else if (lang === 'en') countryText = "Barat";
        else if (lang === 'id') countryText = "Indonesia";
        else if (lang === 'fr') countryText = "Prancis";
        else if (lang === 'es') countryText = "Spanyol";
        else countryText = lang ? lang.toUpperCase() : "";

        card.innerHTML = `
            <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-info">
                <h3>${escapeHtml(title)}</h3>
                ${displaySubTitle}
                <p style="margin-top: 4px;">${year} ${countryText ? `| ${countryText}` : ""} | ${rating}</p>
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
                <p>${year} | ${rating}</p>
            </div>
        `;
        card.onclick = () => openDetail(item);
        elements.push(card);
    }
    return elements;
}

function buildServersList(mediaType, id, season = 1, episode = 1) {
    const tvParams = mediaType === 'tv' ? `&season=${season}&episode=${episode}` : '';

    return [
        { name: "VidSrc XYZ", url: `https://vidsrc.xyz/embed/${mediaType}?tmdb=${id}${tvParams}${SUB_PARAMS}` },
        { name: "VidSrc ME", url: `https://vidsrc.me/embed/${mediaType}?tmdb=${id}${tvParams}${SUB_PARAMS}` },
        { name: "Embed SU", url: `https://embed.su/embed/${mediaType}/${id}${mediaType === 'tv' ? `/${season}/${episode}` : ''}?subtitle=id,en&subtitle-source=opensubtitles` },
        { name: "VidSrc CC", url: `https://vidsrc.cc/v2/embed/${mediaType}/${id}${mediaType === 'tv' ? `/${season}/${episode}` : ''}${SUB_PARAMS}` },
        { name: "MultiEmbed", url: `https://multiembed.mov/?video_id=${id}&tmdb=1${mediaType === 'tv' ? `&s=${season}&e=${episode}` : ''}${SUB_PARAMS}` },
        { name: "AutoEmbed", url: `https://player.autoembed.cc/embed/${mediaType}/${id}${SUB_PARAMS}` },
        { name: "2Embed", url: `https://2embed.cc/embed/${mediaType}/${id}${SUB_PARAMS}` },
        { name: "MoviesAPI", url: `https://moviesapi.club/movie/${id}${SUB_PARAMS}` },
        { name: "VidSrc VIP", url: `https://vidsrc.vip/embed/${mediaType}/${id}${SUB_PARAMS}` },
        { name: "VidSrc NL", url: `https://player.vidsrc.nl/embed/${mediaType}/${id}${SUB_PARAMS}` },
        { name: "IDSrc TO", url: `https://idsrc.to/embed/${mediaType}/${id}${SUB_PARAMS}` },
        { name: "VidSrc ICU", url: `https://vidsrc.icu/embed/${mediaType}/${id}${SUB_PARAMS}` },
        { name: "Anime-KKI", url: `https://anime-kki.herokuapp.com/embed/${id}${SUB_PARAMS}` },
        { name: "Main Server 1", url: mediaType === 'movie'
            ? `https://vidstuck.xyz/embed/movie/${id}?branding=zxcstream&subtitle=english,indonesian`
            : `https://vidstuck.xyz/embed/tv/${id}/${season}/${episode}?branding=zxcstream&subtitle=english,indonesian` },
        { name: "Main Server 2", url: mediaType === 'movie'
            ? `https://zxcstream.xyz/player/movie/${id}?server=0&subLang=english,indonesian`
            : `https://zxcstream.xyz/player/tv/${id}/${season}/${episode}?server=0&subLang=english,indonesian` },
        { name: "Server Alpha", url: mediaType === 'movie'
            ? `https://vidup.to/movie/${id}?autoPlay=true&theme=FF0000${SUB_PARAMS}`
            : `https://vidup.to/tv/${id}/${season}/${episode}?autoPlay=true&theme=FF0000${SUB_PARAMS}` },
        { name: "Server Beta", url: mediaType === 'movie'
            ? `https://mappletv.uk/watch/movie/${id}?${SUB_PARAMS.substring(1)}`
            : `https://mappletv.uk/watch/tv/${id}-${season}-${episode}?${SUB_PARAMS.substring(1)}` },
        { name: "Server Delta", url: mediaType === 'movie'
            ? `https://111movies.com/movie/${id}?${SUB_PARAMS.substring(1)}`
            : `https://111movies.com/tv/${id}/${season}/${episode}?${SUB_PARAMS.substring(1)}` },
        { name: "Server Zeta", url: mediaType === 'movie'
            ? `https://vidsrc.xyz/embed/movie/${id}?${SUB_PARAMS.substring(1)}`
            : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}${SUB_PARAMS}` }
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
        showToast("Silakan login terlebih dahulu!", "error");
        showPage('login-page');
        closeMovieModal();
        return;
    }
    if (!supabaseClient) { showToast("Server tidak tersedia.", "error"); return; }

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
        if (!error) showToast("Berhasil ditambahkan!", "success");
    }
}

async function showFavorites() {
    showPage('favorites-page');
    const user = getCurrentUser();
    const container = document.getElementById("favoritesContainer");
    if (!container) return;
    if (!user) { container.innerHTML = '<div class="loading">Silakan login.</div>'; return; }
    if (!supabaseClient) { container.innerHTML = '<div class="loading">Server tidak tersedia.</div>'; return; }
    container.innerHTML = '<div class="loading">Memuat...</div>';
    const { data: favs, error } = await supabaseClient.from('favorites').select('*').eq('user_email', user.email);
    if (error) { container.innerHTML = '<div class="loading">Gagal memuat.</div>'; return; }
    if (!favs || favs.length === 0) { container.innerHTML = '<div class="loading">Belum ada favorit.</div>'; return; }
    await displayItems(favs, container, false);
}

function getWatchlist() {
    try { return JSON.parse(localStorage.getItem("movieMatchWatchlist")) || []; }
    catch { return []; }
}
function saveWatchlist(w) { localStorage.setItem("movieMatchWatchlist", JSON.stringify(w)); }

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
        container.innerHTML = '<div class="loading">Watchlist masih kosong.</div>';
        return;
    }
    container.innerHTML = '<div class="loading">Memuat...</div>';
    Promise.all(watchlist.map(async (w) => {
        try {
            const res = await fetch(`${BASE_URL}/${w.media_type}/${w.id}?language=id-ID`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            return await res.json();
        } catch { return null; }
    })).then(items => {
        const validItems = items.filter(i => i && i.id);
        if (validItems.length === 0) { container.innerHTML = '<div class="loading">Tidak ada item valid.</div>'; return; }
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
        loadRecommendations();
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
    container.innerHTML = '<div class="loading">Memuat...</div>';
    try {
        const { data: historyItems, error } = await supabaseClient
            .from('history').select('*').eq('user_email', user.email).order('created_at', { ascending: false });
        if (error) { container.innerHTML = '<div class="loading">Gagal memuat.</div>'; return; }
        if (!historyItems || historyItems.length === 0) { container.innerHTML = '<div class="loading">Belum ada riwayat.</div>'; return; }
        await displayItems(historyItems, container, false);
    } catch (err) { container.innerHTML = '<div class="loading">Gagal memuat.</div>'; }
}

async function sendOTP(email) {
    if (!supabaseClient) return false;
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const { error } = await supabaseClient.from('otp').insert([{
            email: email, code: code, expires_at: new Date(Date.now() + 5 * 60000)
        }]);
        if (error) return false;
        if (typeof emailjs !== 'undefined') {
            await emailjs.send("service_m3kjfyn", "template_fbc55ps", { to_email: email, otp_code: code });
        }
        return true;
    } catch (err) { return false; }
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
        if (!supabaseClient) return;
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
            showPage('otp-page');
            document.getElementById("otpMessage").textContent = "Kode OTP dikirim ke " + email;
            document.getElementById("otpInput").value = "";
            startResendTimer();
        } else {
            document.getElementById("loginMessage").textContent = "Gagal mengirim OTP.";
        }
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        if (!supabaseClient) return;
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
            showPage('otp-page');
            document.getElementById("otpMessage").textContent = "Kode OTP dikirim ke " + email;
            document.getElementById("otpInput").value = "";
            startResendTimer();
        } else {
            document.getElementById("registerMessage").textContent = "Registrasi berhasil, gagal kirim OTP.";
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
        if (movieContainer) movieContainer.innerHTML = '<div class="loading">Gagal memuat.</div>';
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
    const bars = [
        document.getElementById("strBar1"),
        document.getElementById("strBar2"),
        document.getElementById("strBar3"),
        document.getElementById("strBar4")
    ];
    const strText = document.getElementById("strText");
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

window.open = function(url) { console.warn("Pop-up iklan ditahan:", url); return null; };

async function filterByYear(value) {
    activeYearFilter = value;
    const cards = document.querySelectorAll('.movie-card');
    if (!cards || cards.length === 0) return;
    if (value === 'all') { cards.forEach(card => card.style.display = ''); return; }
    cards.forEach(card => {
        const yearText = card.querySelector('.movie-info p')?.textContent || '';
        const match = yearText.match(/\b(19|20)\d{2}\b/);
        const year = match ? parseInt(match[0]) : 0;
        card.style.display = (year === parseInt(value)) ? '' : 'none';
    });
}

async function filterByRuntime(value) {
    activeRuntimeFilter = value;
    if (currentGenreId) getMoviesByGenre(currentGenreId, currentGenreName, 1);
    else loadContent(currentFilterParam, 1);
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

            slide.innerHTML = `
                <img class="backdrop" src="${backdrop}" alt="${escapeHtml(title)}" loading="lazy">
                <div class="overlay"></div>
                <div class="info">
                    <span class="badge">${mediaType === "tv" ? "TV Series" : "Movie"}</span>
                    <h2>${escapeHtml(title)}</h2>
                    <div class="meta">
                        <span>${year}</span>
                        ${rating !== "N/A" ? `<span>${rating}</span>` : ""}
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

            if (index === 0) scheduleTrailerAutoPlay(slide, item.id, mediaType);

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

            const activeSlide = slides[index];
            const oldTrailer = container.querySelector('.trailer-autoplay');
            if (oldTrailer) stopAutoTrailer(oldTrailer.querySelector('button'));
            if (activeSlide) {
                const playBtn = activeSlide.querySelector('.btn-play');
                if (playBtn) {
                    const match = playBtn.getAttribute('onclick').match(/playNow\((\d+),\s*'(\w+)'\)/);
                    if (match) scheduleTrailerAutoPlay(activeSlide, match[1], match[2]);
                }
            }
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
            slideInterval = setInterval(nextSlide, 8000);
        }

        document.getElementById("landingPrev").onclick = prevSlide;
        document.getElementById("landingNext").onclick = nextSlide;
        resetTimer();
    } catch (err) {
        console.error("Error landing slider:", err);
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
            const existingTrailer = slide.querySelector(".trailer-autoplay");
            if (existingTrailer) { existingTrailer.remove(); info.style.display = "block"; return; }
            info.style.display = "none";
            const trailerContainer = document.createElement("div");
            trailerContainer.className = "trailer-autoplay";
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
    const container = btn.closest(".trailer-autoplay");
    if (!container) return;
    const slide = container.closest(".landing-slide");
    const info = slide.querySelector(".info");
    const backdrop = slide.querySelector(".backdrop");
    container.remove();
    if (info) info.style.display = "block";
    if (backdrop) backdrop.style.opacity = "";
    currentTrailerPlaying = false;
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
            } catch (err) { console.warn("Gagal credits:", err); }

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
        console.error("Error Top 10:", err);
        container.innerHTML = '<div class="loading">Gagal memuat Top 10.</div>';
    }
}

async function loadTopRated() {
    const container = document.getElementById("topRatedContainer");
    if (!container) return;
    container.innerHTML = '<div class="loading">Memuat...</div>';
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
        console.error("Error Top Rated:", err);
        container.innerHTML = '<div class="loading">Gagal memuat.</div>';
    }
}

async function loadContinueWatching() {
    const container = document.getElementById("continueWatchingContainer");
    if (!container) return;
    const user = getCurrentUser();
    if (!user || !supabaseClient) {
        container.innerHTML = '<div class="loading">Login untuk melihat riwayat.</div>';
        return;
    }
    container.innerHTML = '<div class="loading">Memuat...</div>';
    try {
        const { data: historyItems, error } = await supabaseClient
            .from('history').select('*').eq('user_email', user.email)
            .order('created_at', { ascending: false }).limit(10);
        if (error) { container.innerHTML = '<div class="loading">Gagal memuat.</div>'; return; }
        if (!historyItems || historyItems.length === 0) { container.innerHTML = '<div class="loading">Belum ada riwayat.</div>'; return; }

        container.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "continue-watching-grid";

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
            grid.appendChild(card);
        }
        container.appendChild(grid);
    } catch (err) {
        container.innerHTML = '<div class="loading">Gagal memuat.</div>';
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
    loadUserRating();
    renderRatingBreakdown(data);
    renderSeasonSelector(data, mediaType);
    renderCollection(data, mediaType);
    renderCast(data.id, mediaType);

    clearDetailTrailerTimer();
    detailTrailerActive = false;

    showPage('detail-page');
    await addToHistory(item);

    scheduleDetailTrailerAutoPlay();
}

function updateBookmarkButton() {
    const btn = document.getElementById('bookmarkBtn');
    const text = document.getElementById('bookmarkText');
    if (!btn || !text || !currentDetailItem) return;
    const watchlist = getWatchlist();
    const exists = watchlist.some(w => w.id === currentDetailItem.id);
    const t = TRANSLATIONS[currentLang];
    if (exists) { btn.classList.add('active'); text.textContent = t['detail.bookmarked'] || 'Bookmarked'; }
    else { btn.classList.remove('active'); text.textContent = t['detail.watchlist'] || 'Watchlist'; }
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
        if (episodes.length === 0) { container.innerHTML = '<div class="loading">Tidak ada episode.</div>'; return; }
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
                        <div class="cast-card" onclick="filterByPerson(${c.id}, '${escapeHtml(c.name).replace(/'/g, "&#39;")}')">
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
    clearDetailTrailerTimer();
    detailTrailerActive = false;

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

    setTimeout(() => {
        loadSubtitleOffsetForCurrent();
    }, 100);
}

function playPrevEpisode() {
    if (activeEpisode > 1) { activeEpisode--; goToPlayer(); }
}
function playNextEpisode() {
    if (currentEpisodeData && activeEpisode < currentEpisodeData.length) {
        activeEpisode++;
        goToPlayer();
    } else {
        showToast("Ini episode terakhir.", "info");
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

    setTimeout(() => {
        applySubtitleOffsetToIframe();
    }, 500);
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

    scheduleDetailTrailerAutoPlay();
}

async function showTrailer() {
    if (!currentDetailItem) return;
    clearDetailTrailerTimer();
    detailTrailerActive = false;

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
    clearDetailTrailerTimer();
    detailTrailerActive = false;

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
            overviewText.textContent = 'Gagal menerjemahkan.';
            translateBtn.innerHTML = ICON_TRANSLATE + ' Translate';
        }
    } catch {
        overviewText.textContent = 'Gagal menerjemahkan.';
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
    if (subStatus) { subStatus.textContent = ''; subStatus.className = 'subtitle-status'; }
    modal.style.display = 'flex';
}

function closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) modal.style.display = 'none';
}

function switchDownloadTab(tabName, btn) {
    document.querySelectorAll('.download-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.download-tab').forEach(el => el.classList.remove('active'));
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
        { name: 'VidSrc XYZ Download', url: 'https://vidsrc.xyz/embed/' + mediaType + '?tmdb=' + id + SUB_PARAMS, badge: 'NEW', badgeClass: 'new' },
        { name: 'VidSrc Me Download', url: 'https://vidsrc.me/embed/' + mediaType + '?tmdb=' + id + SUB_PARAMS, badge: 'HD', badgeClass: 'hd' },
        { name: 'Embed SU Download', url: 'https://embed.su/embed/' + mediaType + '/' + id + '?subtitle=id,en&subtitle-source=opensubtitles' },
        { name: 'VidSrc CC Download', url: 'https://vidsrc.cc/v2/embed/' + mediaType + '/' + id + SUB_PARAMS },
        { name: '2Embed Download', url: 'https://2embed.cc/embed/' + mediaType + '/' + id + SUB_PARAMS },
        { name: 'MultiEmbed Download', url: 'https://multiembed.mov/?video_id=' + id + '&tmdb=1' + SUB_PARAMS },
        { name: 'VidSrc VIP Download', url: 'https://vidsrc.vip/embed/' + mediaType + '/' + id + SUB_PARAMS },
        { name: 'VidSrc NL Download', url: 'https://player.vidsrc.nl/embed/' + mediaType + '/' + id + SUB_PARAMS },
        { name: 'Server Alpha', url: mediaType === 'movie' ? 'https://vidup.to/movie/' + id + '?autoPlay=true&theme=FF0000' + SUB_PARAMS : 'https://vidup.to/tv/' + id + '/1/1?autoPlay=true&theme=FF0000' + SUB_PARAMS },
        { name: 'Server Delta', url: mediaType === 'movie' ? 'https://111movies.com/movie/' + id + '?' + SUB_PARAMS.substring(1) : 'https://111movies.com/tv/' + id + '/1/1?' + SUB_PARAMS.substring(1) }
    ];

    const downloadIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>';

    container.innerHTML = servers.map(s => `
        <button class="download-server-btn" onclick="openDownloadServer('${s.url}', '${escapeHtml(s.name)}')">
            <span class="server-name">
                ${escapeHtml(s.name)}
                ${s.badge ? `<span class="server-badge ${s.badgeClass || ''}">${s.badge}</span>` : ''}
            </span>
            <span class="download-arrow">${downloadIcon}</span>
        </button>
    `).join('');
}

function openDownloadServer(url, name) {
    const win = window.open(url, '_blank');
    if (!win) { showToast("Pop-up diblokir. Izinkan pop-up untuk download.", "error"); return; }
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
        try {
            const mediaType = currentDetailItem.mediaType || currentMediaType;
            const res = await fetch(BASE_URL + '/' + mediaType + '/' + currentDetailItem.id + '?append_to_response=external_ids', {
                headers: { 'Authorization': 'Bearer ' + ACCESS_TOKEN }
            });
            const data = await res.json();
            imdbId = data.imdb_id || (data.external_ids && data.external_ids.imdb_id);
            if (!imdbId) {
                status.className = 'subtitle-status error';
                status.textContent = 'IMDb ID tidak ditemukan.';
                return;
            }
        } catch (err) {
            status.className = 'subtitle-status error';
            status.textContent = 'Gagal mengambil data.';
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
            headers: { 'Api-Key': OPENSUBTITLES_API_KEY, 'User-Agent': 'MovieMatchApp v1.0' }
        });

        if (!res.ok) {
            status.className = 'subtitle-status error';
            status.textContent = 'Subtitle tidak ditemukan.';
            return;
        }

        const data = await res.json();
        const subs = data.data || [];

        if (subs.length === 0) {
            status.className = 'subtitle-status error';
            status.textContent = 'Subtitle tidak tersedia.';
            return;
        }

        const best = subs.sort((a, b) => ((b.attributes?.download_count || 0) - (a.attributes?.download_count || 0)))[0];
        const fileId = best.attributes?.files?.[0]?.file_id;

        if (!fileId) {
            status.className = 'subtitle-status error';
            status.textContent = 'File subtitle rusak.';
            return;
        }

        status.textContent = 'Mengunduh...';

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
            status.textContent = 'Gagal generate link.';
            return;
        }

        const dlData = await downloadRes.json();
        const downloadLink = dlData.link;

        if (!downloadLink) {
            status.className = 'subtitle-status error';
            status.textContent = 'Link tidak tersedia.';
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
        status.textContent = 'Subtitle ' + lang.toUpperCase() + ' berhasil diunduh!';
        showToast('Subtitle diunduh', 'success');
    } catch (err) {
        console.error('Subtitle error:', err);
        status.className = 'subtitle-status error';
        status.textContent = 'Terjadi kesalahan.';
    }
}

function cyclePlaybackSpeed() {
    playbackSpeedIndex = (playbackSpeedIndex + 1) % PLAYBACK_SPEEDS.length;
    const speed = PLAYBACK_SPEEDS[playbackSpeedIndex];
    const label = document.getElementById('speedLabel');
    if (label) label.textContent = speed + 'x';
    showToast(`Kecepatan: ${speed}x`, 'info', 1500);
    applyPlaybackSpeed(speed);
}

function applyPlaybackSpeed(speed) {
    const iframe = document.getElementById('playerFrame');
    if (!iframe || !iframe.src) return;
    try {
        const url = new URL(iframe.src);
        if (speed !== 1) {
            url.searchParams.set('speed', speed);
            url.searchParams.set('playback_rate', speed);
        } else {
            url.searchParams.delete('speed');
            url.searchParams.delete('playback_rate');
        }
        iframe.src = url.toString();
    } catch (e) {}
}

function toggleQualitySelector() {
    const container = document.getElementById('qualitySelector');
    if (!container) return;
    if (container.style.display === 'none') {
        container.innerHTML = QUALITIES.map(q => `
            <button class="selector-item ${q.value === currentQuality ? 'active' : ''}" onclick="setQuality('${q.value}', '${q.label}')">
                ${q.label}
            </button>
        `).join('');
        container.style.display = 'flex';
        const audioSel = document.getElementById('audioSelector');
        if (audioSel) audioSel.style.display = 'none';
    } else {
        container.style.display = 'none';
    }
}

function setQuality(value, label) {
    currentQuality = value;
    showToast(`Kualitas: ${label}`, 'success', 1500);
    const container = document.getElementById('qualitySelector');
    if (container) container.style.display = 'none';
    const iframe = document.getElementById('playerFrame');
    if (iframe && iframe.src) {
        try {
            const url = new URL(iframe.src);
            if (value !== 'auto') url.searchParams.set('quality', value);
            else url.searchParams.delete('quality');
            iframe.src = url.toString();
        } catch (e) {}
    }
}

function toggleAudioSelector() {
    const container = document.getElementById('audioSelector');
    if (!container) return;
    if (container.style.display === 'none') {
        container.innerHTML = AUDIO_TRACKS.map(a => `
            <button class="selector-item ${a.value === currentAudioTrack ? 'active' : ''}" onclick="setAudioTrack('${a.value}', '${a.label}')">
                ${a.label}
            </button>
        `).join('');
        container.style.display = 'flex';
        const qualitySel = document.getElementById('qualitySelector');
        if (qualitySel) qualitySel.style.display = 'none';
    } else {
        container.style.display = 'none';
    }
}

function setAudioTrack(value, label) {
    currentAudioTrack = value;
    showToast(`Audio: ${label}`, 'success', 1500);
    const container = document.getElementById('audioSelector');
    if (container) container.style.display = 'none';
    const iframe = document.getElementById('playerFrame');
    if (iframe && iframe.src) {
        try {
            const url = new URL(iframe.src);
            if (value !== 'default') url.searchParams.set('audio', value);
            else url.searchParams.delete('audio');
            iframe.src = url.toString();
        } catch (e) {}
    }
}

function changeBrightness(value) {
    currentBrightness = value;
    const iframe = document.getElementById('playerFrame');
    const wrapper = iframe ? iframe.parentElement : null;
    if (wrapper) wrapper.style.filter = `brightness(${value}%)`;
    try { localStorage.setItem('movieMatchBrightness', value); } catch (e) {}
}

function loadBrightness() {
    try {
        const saved = localStorage.getItem('movieMatchBrightness');
        if (saved) {
            currentBrightness = parseInt(saved);
            const slider = document.getElementById('brightnessSlider');
            if (slider) slider.value = currentBrightness;
        }
    } catch (e) {}
}

function enterPiP() {
    const iframe = document.getElementById('playerFrame');
    if (!iframe) {
        showToast('Player tidak tersedia', 'error');
        return;
    }
    try {
        if (iframe.requestPictureInPicture) {
            iframe.requestPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
            showToast('PiP tidak didukung untuk iframe ini', 'error');
        } else {
            showToast('Browser tidak mendukung PiP', 'error');
        }
    } catch (e) {
        showToast('PiP tidak didukung', 'error');
    }
}

function showSubtitleUploadModal() {
    const modal = document.getElementById('subtitleUploadModal');
    if (modal) modal.style.display = 'flex';
}

function toggleSubtitleUpload() {
    showSubtitleUploadModal();
}

function closeSubtitleUploadModal() {
    const modal = document.getElementById('subtitleUploadModal');
    if (modal) modal.style.display = 'none';
    const status = document.getElementById('subtitleUploadStatus');
    if (status) status.textContent = '';
}

function handleSubtitleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const status = document.getElementById('subtitleUploadStatus');
    if (!status) return;
    if (file.size > 5 * 1024 * 1024) {
        status.style.color = '#e50914';
        status.textContent = 'File terlalu besar (max 5MB)';
        return;
    }
    const allowedExts = ['.srt', '.vtt', '.ass'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
        status.style.color = '#e50914';
        status.textContent = 'Format harus .srt, .vtt, atau .ass';
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            localStorage.setItem('movieMatchManualSubtitle', content);
            localStorage.setItem('movieMatchManualSubtitleName', file.name);
            manualSubtitleUrl = URL.createObjectURL(file);
            status.style.color = '#2ecc71';
            status.textContent = `Subtitle "${file.name}" berhasil dimuat!`;
            showToast('Subtitle manual dimuat', 'success');
            setTimeout(() => {
                closeSubtitleUploadModal();
                applyManualSubtitleToIframe();
            }, 1500);
        } catch (err) {
            status.style.color = '#e50914';
            status.textContent = 'Gagal membaca file';
        }
    };
    reader.readAsText(file);
}

function applyManualSubtitleToIframe() {
    const iframe = document.getElementById('playerFrame');
    if (!iframe || !iframe.src || !manualSubtitleUrl) return;
    try {
        const url = new URL(iframe.src);
        url.searchParams.set('sub_url', encodeURIComponent(manualSubtitleUrl));
        url.searchParams.set('manual_sub', '1');
        iframe.src = url.toString();
    } catch (e) {}
}

async function loadTrendingByCountry(countryCode, btn) {
    document.querySelectorAll('.country-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const container = document.getElementById('trendingCountryContainer');
    if (!container) return;
    showSkeletonLoader(container, 8);
    try {
        const url = `${BASE_URL}/discover/movie?with_origin_country=${countryCode}&language=id-ID&page=1&sort_by=popularity.desc`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        const data = await res.json();
        if (!data.results || data.results.length === 0) {
            container.innerHTML = `<div class="loading">Tidak ada konten trending dari ${COUNTRY_NAMES[countryCode] || countryCode}.</div>`;
            return;
        }
        await displayItems(data.results.slice(0, 10), container, false);
    } catch (err) {
        container.innerHTML = '<div class="loading">Gagal memuat.</div>';
    }
}

async function renderWatchProviders(id, mediaType) {
    const container = document.getElementById('watchProvidersSection');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '<h3 class="section-inner-title">Tersedia di</h3><div class="loading">Memuat provider...</div>';
    try {
        const res = await fetch(`${BASE_URL}/${mediaType}/${id}/watch/providers`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        const providers = data.results?.ID || data.results?.US || null;
        if (!providers || (!providers.flatrate && !providers.rent && !providers.buy)) {
            container.innerHTML = '<h3 class="section-inner-title">Tersedia di</h3><p style="color:#888;font-size:13px;">Tidak ada informasi provider untuk film ini.</p>';
            return;
        }
        const allProviders = [
            ...(providers.flatrate || []).map(p => ({ ...p, type: 'Streaming' })),
            ...(providers.rent || []).map(p => ({ ...p, type: 'Rent' })),
            ...(providers.buy || []).map(p => ({ ...p, type: 'Buy' }))
        ];
        const uniqueProviders = [];
        const seen = new Set();
        for (const p of allProviders) {
            if (!seen.has(p.provider_id)) {
                seen.add(p.provider_id);
                uniqueProviders.push(p);
            }
        }
        container.innerHTML = `
            <h3 class="section-inner-title">Tersedia di</h3>
            <div class="watch-providers-grid">
                ${uniqueProviders.slice(0, 12).map(p => `
                    <div class="provider-item" title="${escapeHtml(p.provider_name)} (${p.type})">
                        <img src="https://image.tmdb.org/t/p/w92${p.logo_path}" alt="${escapeHtml(p.provider_name)}" loading="lazy">
                        <span>${escapeHtml(p.provider_name)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<h3 class="section-inner-title">Tersedia di</h3><p style="color:#888;font-size:13px;">Gagal memuat provider.</p>';
    }
}

async function renderBoxOffice(id, mediaType) {
    const container = document.getElementById('boxOfficeSection');
    if (!container || mediaType !== 'movie') {
        if (container) container.style.display = 'none';
        return;
    }
    try {
        const res = await fetch(`${BASE_URL}/movie/${id}?language=en-US`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const data = await res.json();
        if (!data.budget && !data.revenue) {
            container.style.display = 'none';
            return;
        }
        const formatMoney = (num) => {
            if (!num || num === 0) return 'N/A';
            if (num >= 1000000000) return '$' + (num / 1000000000).toFixed(2) + 'B';
            if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
            if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'K';
            return '$' + num;
        };
        const profit = (data.revenue || 0) - (data.budget || 0);
        const roi = data.budget ? ((profit / data.budget) * 100).toFixed(1) : 'N/A';
        container.style.display = 'block';
        container.innerHTML = `
            <h3 class="section-inner-title">Box Office</h3>
            <div class="box-office-grid">
                <div class="box-office-card">
                    <div class="box-office-label">BUDGET</div>
                    <div class="box-office-value">${formatMoney(data.budget)}</div>
                </div>
                <div class="box-office-card">
                    <div class="box-office-label">REVENUE</div>
                    <div class="box-office-value">${formatMoney(data.revenue)}</div>
                </div>
                <div class="box-office-card">
                    <div class="box-office-label">PROFIT</div>
                    <div class="box-office-value" style="color:${profit >= 0 ? '#2ecc71' : '#e50914'}">${formatMoney(profit)}</div>
                </div>
                <div class="box-office-card">
                    <div class="box-office-label">ROI</div>
                    <div class="box-office-value">${roi !== 'N/A' ? roi + '%' : 'N/A'}</div>
                </div>
            </div>
        `;
    } catch (err) {
        container.style.display = 'none';
    }
}

async function renderReviews(id, mediaType) {
    const container = document.getElementById('reviewsSection');
    if (!container) return;
    container.style.display = 'block';
    const user = getCurrentUser();
    container.innerHTML = `
        <h3 class="section-inner-title">Review & Komentar</h3>
        ${user ? `
            <div class="review-form">
                <textarea id="reviewTextInput" placeholder="Tulis review kamu tentang film ini..." maxlength="500"></textarea>
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:12px;color:#888;">Rating:</span>
                    <div class="user-stars" id="reviewStars">
                        ${[1,2,3,4,5,6,7,8,9,10].map(n => `<span class="user-star" data-value="${n}" onclick="selectReviewRating(${n})">★</span>`).join('')}
                    </div>
                    <span style="font-size:12px;color:#f1c40f;" id="reviewRatingValue">0/10</span>
                </div>
                <button onclick="submitReview(${id}, '${mediaType}')">Kirim Review</button>
            </div>
        ` : '<p style="color:#888;font-size:13px;margin-bottom:16px;">Login untuk menulis review.</p>'}
        <div class="review-list" id="reviewList">
            <div class="loading">Memuat review...</div>
        </div>
    `;
    loadReviewsList(id, mediaType);
}

function selectReviewRating(value) {
    currentReviewRating = value;
    const stars = document.querySelectorAll('#reviewStars .user-star');
    stars.forEach((s, i) => s.classList.toggle('filled', i < value));
    const valueEl = document.getElementById('reviewRatingValue');
    if (valueEl) valueEl.textContent = value + '/10';
}

async function submitReview(itemId, mediaType) {
    const user = getCurrentUser();
    if (!user || !supabaseClient) {
        showToast('Login dulu untuk review', 'error');
        return;
    }
    const textInput = document.getElementById('reviewTextInput');
    const text = textInput ? textInput.value.trim() : '';
    if (text.length < 5) {
        showToast('Review minimal 5 karakter', 'error');
        return;
    }
    if (currentReviewRating === 0) {
        showToast('Pilih rating dulu', 'error');
        return;
    }
    try {
        const { error } = await supabaseClient.from('reviews').insert([{
            user_email: user.email,
            user_name: user.name || 'User',
            movie_id: itemId,
            media_type: mediaType,
            rating: currentReviewRating,
            review_text: text,
            created_at: new Date().toISOString()
        }]);
        if (error) {
            showToast('Gagal kirim review: ' + error.message, 'error');
            return;
        }
        showToast('Review berhasil dikirim!', 'success');
        if (textInput) textInput.value = '';
        currentReviewRating = 0;
        const valueEl = document.getElementById('reviewRatingValue');
        if (valueEl) valueEl.textContent = '0/10';
        const stars = document.querySelectorAll('#reviewStars .user-star');
        stars.forEach(s => s.classList.remove('filled'));
        loadReviewsList(itemId, mediaType);
    } catch (err) {
        showToast('Terjadi kesalahan', 'error');
    }
}

async function loadReviewsList(itemId, mediaType) {
    const listContainer = document.getElementById('reviewList');
    if (!listContainer || !supabaseClient) {
        if (listContainer) listContainer.innerHTML = '<p style="color:#888;font-size:13px;">Server tidak tersedia.</p>';
        return;
    }
    try {
        const { data: reviews, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('movie_id', itemId)
            .eq('media_type', mediaType)
            .order('created_at', { ascending: false })
            .limit(20);
        if (error) {
            listContainer.innerHTML = '<p style="color:#888;font-size:13px;">Gagal memuat review.</p>';
            return;
        }
        if (!reviews || reviews.length === 0) {
            listContainer.innerHTML = '<p style="color:#888;font-size:13px;">Belum ada review. Jadi yang pertama!</p>';
            return;
        }
        listContainer.innerHTML = reviews.map(r => {
            const date = new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            return `
                <div class="review-item">
                    <div class="review-header">
                        <img class="review-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(r.user_name)}&background=e50914&color=fff" alt="${escapeHtml(r.user_name)}">
                        <span class="review-author">${escapeHtml(r.user_name)}</span>
                        <span class="review-date">${date}</span>
                    </div>
                    <div class="review-rating">${'★'.repeat(Math.round(r.rating / 2))} ${r.rating}/10</div>
                    <div class="review-text">${escapeHtml(r.review_text)}</div>
                </div>
            `;
        }).join('');
    } catch (err) {
        listContainer.innerHTML = '<p style="color:#888;font-size:13px;">Gagal memuat review.</p>';
    }
}

async function openFilmography(personId) {
    showPage('filmography-page');
    const container = document.getElementById('filmographyContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading">Memuat profil...</div>';
    try {
        const [personRes, creditsRes] = await Promise.all([
            fetch(`${BASE_URL}/person/${personId}?language=en-US`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            }),
            fetch(`${BASE_URL}/person/${personId}/combined_credits?language=en-US`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            })
        ]);
        const person = await personRes.json();
        const credits = await creditsRes.json();
        const photo = person.profile_path
            ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
            : 'https://via.placeholder.com/300x450?text=No+Photo';
        const knownFor = person.known_for_department || 'Acting';
        const birthday = person.birthday || 'N/A';
        const placeOfBirth = person.place_of_birth || 'N/A';
        const bio = person.biography || 'Tidak ada biografi tersedia.';
        const cast = (credits.cast || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 30);
        container.innerHTML = `
            <div class="filmography-hero">
                <div class="filmography-photo">
                    <img src="${photo}" alt="${escapeHtml(person.name)}" loading="lazy">
                </div>
                <div class="filmography-info">
                    <h1>${escapeHtml(person.name)}</h1>
                    <div class="filmography-meta">
                        <span>${knownFor}</span>
                        <span>Lahir: ${birthday}</span>
                        <span>${placeOfBirth}</span>
                    </div>
                    <p class="filmography-bio">${escapeHtml(bio)}</p>
                </div>
            </div>
            <section class="movies-section">
                <div class="section-header">
                    <div>
                        <p class="label">FILMOGRAFI</p>
                        <h2>Karya Populer</h2>
                    </div>
                </div>
                <div id="filmographyContainer" class="movie-container"></div>
            </section>
        `;
        const moviesContainer = container.querySelector('#filmographyContainer');
        if (moviesContainer) {
            await displayItems(cast, moviesContainer, false);
        }
    } catch (err) {
        container.innerHTML = '<div class="loading">Gagal memuat profil.</div>';
    }
}

function openTrailerModal(trailerKey) {
    let modal = document.getElementById('trailerPopupModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'trailerPopupModal';
        modal.className = 'trailer-popup-modal';
        modal.innerHTML = `
            <div class="trailer-popup-content">
                <button class="trailer-popup-close" onclick="closeTrailerModal()">&times;</button>
                <iframe id="trailerPopupIframe" allowfullscreen allow="autoplay; encrypted-media"></iframe>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeTrailerModal();
        });
    }
    const iframe = document.getElementById('trailerPopupIframe');
    if (iframe) iframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`;
    modal.classList.add('active');
}

function closeTrailerModal() {
    const modal = document.getElementById('trailerPopupModal');
    const iframe = document.getElementById('trailerPopupIframe');
    if (iframe) iframe.src = '';
    if (modal) modal.classList.remove('active');
}

function promptNewFolder() {
    const name = prompt('Nama folder baru:');
    if (!name || name.trim().length < 2) return;
    const folderId = 'folder_' + Date.now();
    if (!watchlistFolders[folderId]) {
        watchlistFolders[folderId] = { name: name.trim(), items: [] };
        saveWatchlistFolders();
        renderWatchlistFolders();
        showToast(`Folder "${name}" dibuat`, 'success');
    }
}

function deleteFolder(folderId) {
    if (folderId === 'default') {
        showToast('Tidak bisa hapus folder default', 'error');
        return;
    }
    if (!confirm('Hapus folder ini? Semua item di dalamnya akan pindah ke folder default.')) return;
    const folder = watchlistFolders[folderId];
    if (folder) {
        watchlistFolders['default'].items = [
            ...(watchlistFolders['default'].items || []),
            ...(folder.items || [])
        ];
        delete watchlistFolders[folderId];
        saveWatchlistFolders();
        renderWatchlistFolders();
        showWatchlist();
        showToast('Folder dihapus', 'info');
    }
}

function saveWatchlistFolders() {
    try { localStorage.setItem('movieMatchWatchlistFolders', JSON.stringify(watchlistFolders)); } catch (e) {}
}

function loadWatchlistFolders() {
    try {
        const saved = localStorage.getItem('movieMatchWatchlistFolders');
        if (saved) watchlistFolders = JSON.parse(saved);
        else watchlistFolders = { default: { name: 'Semua', items: [] } };
    } catch (e) {
        watchlistFolders = { default: { name: 'Semua', items: [] } };
    }
}

function renderWatchlistFolders() {
    const container = document.getElementById('watchlistFolders');
    if (!container) return;
    container.innerHTML = Object.entries(watchlistFolders).map(([id, folder]) => `
        <button class="folder-tab ${id === currentWatchlistFolder ? 'active' : ''}" onclick="switchWatchlistFolder('${id}')">
            ${escapeHtml(folder.name)}
            <span class="folder-count">${(folder.items || []).length}</span>
            ${id !== 'default' ? `<span class="folder-delete" onclick="event.stopPropagation(); deleteFolder('${id}')">&times;</span>` : ''}
        </button>
    `).join('');
}

function switchWatchlistFolder(folderId) {
    currentWatchlistFolder = folderId;
    renderWatchlistFolders();
    showWatchlist();
}

function loadMoodHistory() {
    try { moodHistory = JSON.parse(localStorage.getItem('movieMatchMoodHistory')) || {}; }
    catch { moodHistory = {}; }
}

function saveMoodHistory() {
    try { localStorage.setItem('movieMatchMoodHistory', JSON.stringify(moodHistory)); } catch (e) {}
}

function recordMoodSelection(mood) {
    if (!moodHistory[mood]) moodHistory[mood] = 0;
    moodHistory[mood]++;
    saveMoodHistory();
}

function getTopMoods(limit = 3) {
    return Object.entries(moodHistory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(m => m[0]);
}

function loadUserProfile() {
    const user = getCurrentUser();
    if (!user) return;
    try {
        const saved = localStorage.getItem(`movieMatchProfile_${user.email}`);
        if (saved) userProfile = JSON.parse(saved);
        else userProfile = { displayName: user.name, bio: '', avatar: '', favoriteGenres: [] };
    } catch (e) {
        userProfile = { displayName: user.name, bio: '', avatar: '', favoriteGenres: [] };
    }
    
    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
        if (userProfile.avatar) {
            avatarImg.src = userProfile.avatar;
        } else {
            const userName = userProfile.displayName || 'User';
            avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=e50914&color=fff&size=100`;
        }
    }
    
    const nameInput = document.getElementById('profileDisplayName');
    if (nameInput) nameInput.value = userProfile.displayName || '';

    const bioInput = document.getElementById('profileBio');
    if (bioInput) bioInput.value = userProfile.bio || '';
    
    document.querySelectorAll('.genre-chip').forEach(chip => {
        const genre = chip.dataset.genre;
        if ((userProfile.favoriteGenres || []).includes(genre)) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });

    isPremiumUser = user.isPremium || false;
    updatePremiumUI();
}

function toggleFavoriteGenre(btn) {
    if (!userProfile.favoriteGenres) userProfile.favoriteGenres = [];
    const genre = btn.dataset.genre;
    if (userProfile.favoriteGenres.includes(genre)) {
        userProfile.favoriteGenres = userProfile.favoriteGenres.filter(g => g !== genre);
        btn.classList.remove('active');
    } else {
        userProfile.favoriteGenres.push(genre);
        btn.classList.add('active');
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showToast('Foto max 2MB', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        userProfile.avatar = dataUrl;
        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg) avatarImg.src = dataUrl;
    };
    reader.readAsDataURL(file);
}

function saveProfileCustomization() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Login dulu', 'error');
        return;
    }
    const nameInput = document.getElementById('profileDisplayName');
    const bioInput = document.getElementById('profileBio');
    userProfile.displayName = nameInput ? nameInput.value.trim() : '';
    userProfile.bio = bioInput ? bioInput.value.trim() : '';
    try {
        localStorage.setItem(`movieMatchProfile_${user.email}`, JSON.stringify(userProfile));
        showToast('Profil disimpan!', 'success');
        const msg = document.getElementById('profileSaveMessage');
        if (msg) {
            msg.textContent = 'Profil berhasil disimpan!';
            msg.style.color = '#2ecc71';
            setTimeout(() => { msg.textContent = ''; }, 3000);
        }
    } catch (e) {
        showToast('Gagal simpan profil', 'error');
    }
}

function togglePremiumStatus() {
    const PREMIUM_PLANS = {
    monthly: { name: 'Premium Bulanan', price: 20000, days: 30 },
    yearly: { name: 'Premium Tahunan', price: 150000, days: 365 },
    lifetime: { name: 'Premium Lifetime', price: 500000, days: 36500 }
};

const ADMIN_WHATSAPP = "6288901419668";
const ADMIN_TELEGRAM = "OwnerMovieMatch";

function openPremiumModal() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Login dulu untuk upgrade premium', 'error');
        showPage('login-page');
        return;
    }
    
    const modal = document.getElementById('premiumModal');
    if (modal) modal.style.display = 'flex';
    
    selectedPremiumPlan = null;
    document.querySelectorAll('.premium-plan-card').forEach(c => c.classList.remove('selected'));
    
    const orderInfo = document.getElementById('premiumOrderInfo');
    if (orderInfo) orderInfo.style.display = 'none';
}

function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) modal.style.display = 'none';
}

function selectPremiumPlan(plan, card) {
    selectedPremiumPlan = plan;
    document.querySelectorAll('.premium-plan-card').forEach(c => c.classList.remove('selected'));
    if (card) card.classList.add('selected');
}

async function upgradeViaWhatsApp() {
    await processPremiumUpgrade('whatsapp');
}

async function upgradeViaTelegram() {
    await processPremiumUpgrade('telegram');
}

async function processPremiumUpgrade(method) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Login dulu', 'error');
        return;
    }
    
    if (!selectedPremiumPlan) {
        showToast('Pilih paket dulu', 'error');
        return;
    }
    
    const plan = PREMIUM_PLANS[selectedPremiumPlan];
    const orderId = 'MM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    try {
        await supabaseClient.from('subscriptions').insert([{
            user_email: user.email,
            user_name: user.name || 'User',
            plan: selectedPremiumPlan,
            amount: plan.price,
            payment_method: method,
            status: 'pending',
            transaction_id: orderId,
            created_at: new Date().toISOString()
        }]);
        
        const orderInfo = document.getElementById('premiumOrderInfo');
        const orderIdEl = document.getElementById('premiumOrderId');
        if (orderInfo && orderIdEl) {
            orderIdEl.textContent = orderId;
            orderInfo.style.display = 'block';
        }
        
        const message = 
            'Halo Admin MovieMatch!' + '\n\n' +
            'Saya ingin upgrade ke Premium.' + '\n\n' +
            'Email: ' + user.email + '\n' +
            'Nama: ' + (user.name || 'User') + '\n' +
            'Paket: ' + plan.name + '\n' +
            'Harga: Rp ' + plan.price.toLocaleString('id-ID') + '\n' +
            'Order ID: ' + orderId + '\n\n' +
            'Mohon info cara pembayaran. Terima kasih!';
        
        const encodedMsg = encodeURIComponent(message);
        
        if (method === 'whatsapp') {
            window.open('https://wa.me/' + ADMIN_WHATSAPP + '?text=' + encodedMsg, '_blank');
        } else {
            window.open('https://t.me/' + ADMIN_TELEGRAM + '?text=' + encodedMsg, '_blank');
        }
        
        showToast('Order dibuat! Silakan chat Admin untuk pembayaran.', 'success');
        
    } catch (err) {
        console.error('Premium order error:', err);
        showToast('Gagal membuat order: ' + err.message, 'error');
    }
}

function closePremiumActivatedModal() {
    const modal = document.getElementById('premiumActivatedModal');
    if (modal) modal.style.display = 'none';
}

async function checkPremiumStatus() {
    const user = getCurrentUser();
    if (!user || !supabaseClient) return;
    
    try {
        const { data: users } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', user.email)
            .limit(1);
        
        if (users && users.length > 0) {
            const dbUser = users[0];
            
            if (dbUser.isPremium && !user.isPremium) {
                localStorage.setItem('movieMatchCurrentUser', JSON.stringify(dbUser));
                const modal = document.getElementById('premiumActivatedModal');
                if (modal) modal.style.display = 'flex';
                showToast('Selamat! Akun kamu sudah Premium!', 'success');
                setTimeout(() => { showProfile(); }, 2000);
                return;
            }
            
            if (dbUser.isPremium !== user.isPremium || 
                dbUser.premium_expires_at !== user.premium_expires_at) {
                localStorage.setItem('movieMatchCurrentUser', JSON.stringify(dbUser));
                updatePremiumUI();
            }
        }
    } catch (err) {
        console.error('Check premium status error:', err);
    }
}

function updatePremiumUI() {
    const user = getCurrentUser();
    const statusText = document.getElementById('premiumStatusText');
    const upgradeBtn = document.getElementById('premiumUpgradeBtn');
    const statusBadge = document.getElementById('premiumStatusInfo');
    const planBadge = document.getElementById('premiumPlanBadge');
    const expiryInfo = document.getElementById('premiumExpiryInfo');
    
    if (!user) return;
    
    isPremiumUser = user.isPremium || false;
    
    if (isPremiumUser) {
        if (statusText) statusText.textContent = 'Kamu Premium Member';
        if (upgradeBtn) {
            upgradeBtn.textContent = 'Perpanjang Premium';
            upgradeBtn.style.background = 'linear-gradient(135deg, #f1c40f, #d4ac0d)';
            upgradeBtn.style.color = '#000';
        }
        
        if (statusBadge) statusBadge.style.display = 'block';
        
        if (planBadge) {
            const planNames = { monthly: 'Bulanan', yearly: 'Tahunan', lifetime: 'Lifetime' };
            planBadge.textContent = (planNames[user.premium_plan] || 'Premium Member');
        }
        
        if (expiryInfo && user.premium_expires_at) {
            const expiry = new Date(user.premium_expires_at);
            const now = new Date();
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            
            if (daysLeft > 365 * 10) {
                expiryInfo.textContent = 'Selamanya';
            } else if (daysLeft > 0) {
                expiryInfo.textContent = daysLeft + ' hari lagi';
            } else {
                expiryInfo.textContent = 'Kadaluarsa';
            }
        } else if (expiryInfo) {
            expiryInfo.textContent = 'Aktif';
        }
    } else {
        if (statusText) statusText.textContent = 'Upgrade untuk pengalaman tanpa batas';
        if (upgradeBtn) {
            upgradeBtn.textContent = 'Upgrade ke Premium';
            upgradeBtn.style.background = 'linear-gradient(135deg, #f1c40f, #d4ac0d)';
            upgradeBtn.style.color = '#000';
        }
        
        if (statusBadge) statusBadge.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const user = getCurrentUser();
        if (user && user.isPremium) {
            const expiry = user.premium_expires_at ? new Date(user.premium_expires_at) : null;
            if (expiry && expiry < new Date()) {
                user.isPremium = false;
                localStorage.setItem('movieMatchCurrentUser', JSON.stringify(user));
            }
        }
    }, 500);
});
    
async function loadAdminStats() {
    const container = document.getElementById('adminStats');
    if (!container) return;
    const user = getCurrentUser();
    if (!user || !user.isAdmin) {
        const section = document.getElementById('adminSection');
        if (section) section.style.display = 'none';
        return;
    }
    const section = document.getElementById('adminSection');
    if (section) section.style.display = 'block';
    container.innerHTML = '<div class="loading">Memuat statistik...</div>';
    try {
        const [usersRes, favsRes, historyRes, reviewsRes] = await Promise.all([
            supabaseClient.from('users').select('*', { count: 'exact', head: true }),
            supabaseClient.from('favorites').select('*', { count: 'exact', head: true }),
            supabaseClient.from('history').select('*', { count: 'exact', head: true }),
            supabaseClient.from('reviews').select('*', { count: 'exact', head: true })
        ]);
        container.innerHTML = `
            <div class="admin-stat-card">
                <div class="admin-stat-label">TOTAL USERS</div>
                <div class="admin-stat-value">${usersRes.count || 0}</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-label">TOTAL FAVORITES</div>
                <div class="admin-stat-value">${favsRes.count || 0}</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-label">WATCH HISTORY</div>
                <div class="admin-stat-value">${historyRes.count || 0}</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-label">TOTAL REVIEWS</div>
                <div class="admin-stat-value">${reviewsRes.count || 0}</div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<div class="loading">Gagal memuat statistik.</div>';
    }
}

function enhanceOpenDetail() {
    const original = window.openDetail;
    if (typeof original !== 'function') return;
    window.openDetail = async function(item) {
        await original(item);
        const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        renderWatchProviders(item.id, mediaType);
        renderBoxOffice(item.id, mediaType);
        renderReviews(item.id, mediaType);
        recordMoodSelectionIfAny();
    };
}

function recordMoodSelectionIfAny() {
    const params = new URLSearchParams(window.location.search);
    const mood = params.get('mood');
    if (mood) recordMoodSelection(mood);
}

function enhanceFilterByPerson() {
    const original = window.filterByPerson;
    if (typeof original !== 'function') return;
    window.filterByPerson = function(personId, personName) {
        openFilmography(personId);
    };
}

function enhanceShowWatchlist() {
    const original = window.showWatchlist;
    if (typeof original !== 'function') return;
    window.showWatchlist = function() {
        showPage('watchlist-page');
        renderWatchlistFolders();
        const container = document.getElementById('watchlistContainer');
        if (!container) return;
        const folder = watchlistFolders[currentWatchlistFolder] || watchlistFolders.default;
        const items = folder.items || [];
        if (items.length === 0) {
            container.innerHTML = '<div class="loading">Folder ini masih kosong.</div>';
            return;
        }
        container.innerHTML = '<div class="loading">Memuat...</div>';
        Promise.all(items.map(async (w) => {
            try {
                const res = await fetch(`${BASE_URL}/${w.media_type}/${w.id}?language=id-ID`, {
                    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
                });
                return await res.json();
            } catch { return null; }
        })).then(loaded => {
            const valid = loaded.filter(i => i && i.id);
            if (valid.length === 0) {
                container.innerHTML = '<div class="loading">Tidak ada item valid.</div>';
                return;
            }
            displayItems(valid, container, false);
        });
    };
}

function enhanceToggleWatchlist() {
    const original = window.toggleWatchlist;
    if (typeof original !== 'function') return;
    window.toggleWatchlist = function(itemId, mediaType, buttonElement) {
        if (!watchlistFolders[currentWatchlistFolder]) {
            watchlistFolders[currentWatchlistFolder] = { name: 'Default', items: [] };
        }
        const folder = watchlistFolders[currentWatchlistFolder];
        const exists = folder.items.findIndex(w => w.id === itemId);
        if (exists >= 0) {
            folder.items.splice(exists, 1);
            if (buttonElement) {
                buttonElement.classList.remove("active");
                buttonElement.innerHTML = "☆";
            }
            showToast("Dihapus dari Watchlist", "info");
        } else {
            folder.items.push({ id: itemId, media_type: mediaType });
            if (buttonElement) {
                buttonElement.classList.add("active");
                buttonElement.innerHTML = "★";
            }
            showToast("Ditambahkan ke Watchlist", "success");
        }
        saveWatchlistFolders();
        const watchlistPage = document.getElementById('watchlist-page');
        if (watchlistPage && watchlistPage.classList.contains('active')) {
            renderWatchlistFolders();
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadSubtitleOffsets();
    loadBrightness();
    loadWatchlistFolders();
    loadMoodHistory();
    enhanceOpenDetail();
    enhanceFilterByPerson();
    enhanceShowWatchlist();
    enhanceToggleWatchlist();
    setTimeout(() => {
        loadUserProfile();
        const user = getCurrentUser();
        if (user && user.isAdmin) loadAdminStats();
        loadTrendingByCountry('ID', document.querySelector('.country-tab.active'));
    }, 1500);
});

window.addEventListener('click', (e) => {
    const qualitySel = document.getElementById('qualitySelector');
    const audioSel = document.getElementById('audioSelector');
    if (qualitySel && qualitySel.style.display === 'flex' && !e.target.closest('#qualitySelector') && !e.target.closest('[onclick*="toggleQualitySelector"]')) {
        qualitySel.style.display = 'none';
    }
    if (audioSel && audioSel.style.display === 'flex' && !e.target.closest('#audioSelector') && !e.target.closest('[onclick*="toggleAudioSelector"]')) {
        audioSel.style.display = 'none';
    }
    const subModal = document.getElementById('subtitleUploadModal');
    if (subModal && e.target === subModal) closeSubtitleUploadModal();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTrailerModal();
        closeSubtitleUploadModal();
        const qualitySel = document.getElementById('qualitySelector');
        const audioSel = document.getElementById('audioSelector');
        if (qualitySel) qualitySel.style.display = 'none';
        if (audioSel) audioSel.style.display = 'none';
    }
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('downloadModal');
    if (event.target === modal) closeDownloadModal();
});
