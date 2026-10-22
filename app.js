import { inject } from "@vercel/analytics";

inject();

const list = document.querySelector("#release-list");
const scrollArea = document.querySelector("#catalog-scroll");
const scrollHint = document.querySelector("#scroll-hint");
const count = document.querySelector("#catalog-count");
const search = document.querySelector("#catalog-search");
const searchClear = document.querySelector("#search-clear");
const emptyState = document.querySelector("#empty-state");
const languageButtons = [...document.querySelectorAll("[data-language]")];

const translations = {
  id: {
    skip: "Langsung ke lagu",
    follow: "Ikuti eL Utama",
    "hero-kicker": "Musik dari eL Utama",
    "hero-title-first": "Musik, punya",
    "hero-title-second": "cerita.",
    "catalog-kicker": "Dengarkan",
    "catalog-title": "Lagu di semua platform",
    "search-label": "Cari lagu",
    "search-placeholder": "Cari lagu…",
    "search-clear": "Hapus pencarian",
    "list-label": "Daftar lagu",
    loading: "Memuat lagu…",
    empty: "Tidak ada lagu yang cocok.",
    "scroll-hint": "Geser untuk lihat semua lagu",
    "follow-kicker": "Tetap terhubung",
    "follow-title": "Ikuti eL Utama",
    "follow-description": "Musik baru dan kabar terbaru ada di sini.",
    "footer-tagline": "Musik untuk menemani harimu.",
    "back-top": "Kembali ke atas",
    count: (visible, total) => visible === total ? `${total} lagu` : `${visible} dari ${total} lagu`,
    songAria: (title) => `Tautan lagu ${title}`,
    listenOn: (platform, title) => `Dengarkan ${title} di ${platform}`,
    socialAria: "Ikuti eL Utama",
    unavailable: "Katalog belum tersedia. Coba muat ulang halaman.",
  },
  en: {
    skip: "Skip to songs",
    follow: "Follow eL Utama",
    "hero-kicker": "Music by eL Utama",
    "hero-title-first": "Music with",
    "hero-title-second": "a story.",
    "catalog-kicker": "Listen",
    "catalog-title": "Songs on every platform",
    "search-label": "Search",
    "search-placeholder": "Search songs…",
    "search-clear": "Clear search",
    "list-label": "Song list",
    loading: "Loading songs…",
    empty: "No matching songs found.",
    "scroll-hint": "Scroll to see every song",
    "follow-kicker": "Stay connected",
    "follow-title": "Follow eL Utama",
    "follow-description": "New music and updates are shared here.",
    "footer-tagline": "Music to accompany your day.",
    "back-top": "Back to top",
    count: (visible, total) => visible === total ? `${total} SONG${total === 1 ? "" : "S"}` : `${visible} OF ${total} SONGS`,
    songAria: (title) => `Links for ${title}`,
    listenOn: (platform, title) => `Listen to ${title} on ${platform}`,
    socialAria: "Follow eL Utama",
    unavailable: "The catalog is unavailable. Please reload the page.",
  },
};

const platforms = [
  { key: "spotify", label: "Spotify", symbol: "i-spotify", base: "https://open.spotify.com/track/" },
  { key: "youtube", label: "YouTube Music", symbol: "i-ytmusic", base: "https://music.youtube.com/" },
  { key: "apple", label: "Apple Music", symbol: "i-applemusic", base: "https://music.apple.com/" },
];

let catalog = [];
let language = "id";
let searchTimer;
try { language = localStorage.getItem("el-utama-language") === "en" ? "en" : "id"; } catch {}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function isValidServiceLink(track, platform) {
  if (typeof track[platform.key] !== "string") return false;
  const link = track[platform.key];
  if (!link.startsWith(platform.base)) return false;
  if (platform.key === "youtube" && !link.startsWith("https://music.youtube.com/watch?")) return false;
  return true;
}

function eligibleTracks(tracks) {
  return tracks.filter((track) => track.kind === "song" && platforms.every((platform) => isValidServiceLink(track, platform)));
}

function coverMarkup(track) {
  const cover = track.slug === "fokus-untuk-kita" ? "./assets/fokus-cover.jpg" : track.cover;
  if (!cover) return `<span class="release-cover is-loaded" aria-hidden="true"></span>`;
  return `<img class="release-cover" src="${escapeHtml(cover)}" alt="" width="52" height="52" loading="lazy" decoding="async">`;
}

function renderCard(track) {
  const t = translations[language];
  const links = platforms.map((platform) =>
    `<a class="platform-link" data-platform="${platform.key}" href="${escapeHtml(track[platform.key])}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(t.listenOn(platform.label, track.title))}"><svg class="icon" aria-hidden="true" focusable="false"><use href="#${platform.symbol}"></use></svg></a>`,
  ).join("");
  const date = track.released
    ? new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${track.released}T00:00:00Z`))
    : "";
  return `<article class="release-card">
    ${coverMarkup(track)}
    <div class="release-info">
      <h3 class="release-title">${escapeHtml(track.title)}</h3>
      ${date ? `<time class="release-date" datetime="${escapeHtml(track.released)}">${escapeHtml(date)}</time>` : ""}
    </div>
    <nav class="platform-links" aria-label="${escapeHtml(t.songAria(track.title))}">${links}</nav>
  </article>`;
}

function showCovers() {
  list.querySelectorAll("img.release-cover").forEach((image) => {
    const reveal = () => image.classList.add("is-loaded");
    if (image.complete && image.naturalWidth > 0) reveal();
    else {
      image.addEventListener("load", reveal, { once: true });
      image.addEventListener("error", reveal, { once: true });
    }
  });
}

function updateScrollState() {
  if (!catalog.length || scrollArea.hidden) {
    scrollHint.hidden = true;
    return;
  }
  const max = list.scrollHeight - list.clientHeight;
  const overflow = max > 2;
  const atEnd = !overflow || list.scrollTop >= max - 2;
  scrollHint.hidden = !overflow;
  scrollHint.classList.toggle("is-end", atEnd);
}

function renderCatalog() {
  const t = translations[language];
  const locale = language === "id" ? "id-ID" : "en-US";
  const needle = search.value.trim().toLocaleLowerCase(locale);
  const visibleTracks = catalog.filter((track) => track.title.toLocaleLowerCase(locale).includes(needle));

  list.innerHTML = visibleTracks.map(renderCard).join("");
  list.setAttribute("aria-busy", "false");
  list.scrollTop = 0;
  emptyState.hidden = visibleTracks.length !== 0;
  scrollArea.hidden = visibleTracks.length === 0;
  count.textContent = visibleTracks.length === 0 && !catalog.length ? "" : t.count(visibleTracks.length, catalog.length);
  showCovers();
  requestAnimationFrame(updateScrollState);
}

function syncClearState() {
  searchClear.hidden = search.value.length === 0;
}

function updateLanguage(nextLanguage) {
  language = nextLanguage === "en" ? "en" : "id";
  const t = translations[language];
  document.documentElement.lang = language;
  document.title = language === "id" ? "eL Utama — Musik & Tautan Resmi" : "eL Utama — Music & Official Links";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const translation = t[element.dataset.i18n];
    if (translation) element.textContent = translation;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t[element.dataset.i18nPlaceholder];
  });
  document.querySelector(".social-links")?.setAttribute("aria-label", t.socialAria);
  list.setAttribute("aria-label", t["list-label"]);
  searchClear.setAttribute("aria-label", t["search-clear"]);
  document.querySelectorAll("meta[name='description'], meta[property='og:description'], meta[name='twitter:description']").forEach((element) => {
    element.content = language === "id"
      ? "Temukan lagu eL Utama yang tersedia di Spotify, YouTube Music, dan Apple Music."
      : "Find eL Utama songs available on Spotify, YouTube Music, and Apple Music.";
  });
  languageButtons.forEach((button) => {
    const active = button.dataset.language === language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  try { localStorage.setItem("el-utama-language", language); } catch {}
  if (catalog.length) renderCatalog();
}

function configureLogo() {
  const logoUrl = window.EL_UTAMA_BRANDING?.logoUrl?.trim();
  if (!logoUrl) return;
  const image = document.querySelector("#artist-logo");
  const fallback = document.querySelector("#wordmark-fallback");
  image.addEventListener("load", () => {
    image.hidden = false;
    fallback.hidden = true;
  }, { once: true });
  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  }, { once: true });
  image.src = logoUrl;
}

languageButtons.forEach((button) => button.addEventListener("click", () => updateLanguage(button.dataset.language)));

search.addEventListener("input", () => {
  if (!catalog.length) return;
  syncClearState();
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(renderCatalog, 120);
});

searchClear.addEventListener("click", () => {
  if (!catalog.length) return;
  search.value = "";
  syncClearState();
  renderCatalog();
  search.focus();
});

list.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", () => requestAnimationFrame(updateScrollState));

configureLogo();
updateLanguage(language);

fetch("./catalog.json", { cache: "force-cache" })
  .then((response) => {
    if (!response.ok) throw new Error("Catalog request failed.");
    return response.json();
  })
  .then((tracks) => {
    catalog = eligibleTracks(tracks);
    search.disabled = false;
    renderCatalog();
  })
  .catch(() => {
    list.setAttribute("aria-busy", "false");
    scrollHint.hidden = true;
    search.disabled = true;
    searchClear.hidden = true;
  });

// Expose for ES module / console debugging
window.catalog = catalog;
window.translations = translations;
window.language = language;
window.platforms = platforms;
window.renderCatalog = renderCatalog;
window.updateLanguage = updateLanguage;

// Hero parallax text drift
(function() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  const eyebrow = hero.querySelector('.eyebrow');
  const h1 = hero.querySelector('h1');
  if (!eyebrow && !h1) return;
  
  let ticking = false;
  
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (eyebrow) eyebrow.style.transform = `translateY(${y * 0.15}px)`;
        if (h1) h1.style.transform = `translateY(${y * 0.1}px)`;
        ticking = false;
      });
    }
  };
  
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting || e.intersectionRatio > 0) {
        document.addEventListener('scroll', onScroll, { passive: true });
      } else {
        document.removeEventListener('scroll', onScroll);
      }
    });
  }, { rootMargin: '200px' });
  
  obs.observe(document.querySelector('.hero'));
})();
