const grid = document.querySelector("#release-list");
const count = document.querySelector("#catalog-count");
const search = document.querySelector("#catalog-search");
const emptyState = document.querySelector("#empty-state");
const languageButtons = [...document.querySelectorAll("[data-language]")];
const translations = {
  id: {
    skip: "Langsung ke lagu",
    follow: "Ikuti eL Utama",
    "hero-kicker": "MUSIK DARI eL UTAMA",
    "hero-title-first": "Musik, punya",
    "hero-title-second": "cerita.",
    "hero-intro": "Temukan lagu eL Utama yang tersedia di ketiga layanan musik ini.",
    "catalog-kicker": "DENGARKAN",
    "catalog-title": "Lagu di semua platform",
    "catalog-description": "Hanya lagu dengan tautan Spotify, YouTube Music, dan Apple Music.",
    "search-label": "Cari lagu",
    "search-placeholder": "Ketik judul lagu",
    loading: "Memuat lagu…",
    empty: "Tidak ada lagu yang cocok.",
    "follow-kicker": "TETAP TERHUBUNG",
    "follow-title": "Ikuti eL Utama",
    "follow-description": "Musik baru dan kabar terbaru ada di sini.",
    "footer-tagline": "Musik untuk menemani harimu.",
    "back-top": "Kembali ke atas",
    count: (visible, total) => visible === total ? `${total} LAGU` : `${visible} DARI ${total} LAGU`,
    songAria: (title) => `Tautan layanan musik untuk ${title}`,
    socialAria: "Ikuti eL Utama",
    unavailable: "Katalog belum tersedia. Coba muat ulang halaman.",
  },
  en: {
    skip: "Skip to songs",
    follow: "Follow eL Utama",
    "hero-kicker": "MUSIC BY eL UTAMA",
    "hero-title-first": "Music with",
    "hero-title-second": "a story.",
    "hero-intro": "Find eL Utama songs available on all three music services.",
    "catalog-kicker": "LISTEN",
    "catalog-title": "Songs on every platform",
    "catalog-description": "Only songs linked on Spotify, YouTube Music, and Apple Music.",
    "search-label": "Search",
    "search-placeholder": "Type a song title",
    loading: "Loading songs…",
    empty: "No matching songs found.",
    "follow-kicker": "STAY CONNECTED",
    "follow-title": "Follow eL Utama",
    "follow-description": "New music and updates are shared here.",
    "footer-tagline": "Music to accompany your day.",
    "back-top": "Back to top",
    count: (visible, total) => visible === total ? `${total} SONG${total === 1 ? "" : "S"}` : `${visible} OF ${total} SONGS`,
    songAria: (title) => `Music services for ${title}`,
    socialAria: "Follow eL Utama",
    unavailable: "The catalog is unavailable. Please reload the page.",
  },
};
const platformNames = [
  { key: "spotify", label: "Spotify", className: "brand-spotify", base: "https://open.spotify.com/track/" },
  { key: "youtube", label: "YouTube Music", className: "brand-youtube", base: "https://music.youtube.com/" },
  { key: "apple", label: "Apple Music", className: "brand-apple", base: "https://music.apple.com/" },
];
let catalog = [];
let language = "id";
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
  return tracks.filter((track) => track.kind === "song" && platformNames.every((platform) => isValidServiceLink(track, platform)));
}

function renderCard(track) {
  const platformLinks = platformNames.map((platform) =>
    `<a class="${platform.className}" href="${escapeHtml(track[platform.key])}" target="_blank" rel="noopener noreferrer">${platform.label}</a>`,
  ).join("");
  const date = track.released
    ? new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${track.released}T00:00:00Z`))
    : "";
  const cover = track.slug === "fokus-untuk-kita" ? "./assets/fokus-cover.jpg" : track.cover;
  const coverMarkup = cover
    ? `<img class="release-cover" src="${escapeHtml(cover)}" alt="" loading="lazy" decoding="async">`
    : `<span class="release-cover" aria-hidden="true"></span>`;
  return `<article class="release-card">
    ${coverMarkup}
    <div class="release-info">
      <h3 class="release-title">${escapeHtml(track.title)}</h3>
      ${date ? `<time class="release-date" datetime="${escapeHtml(track.released)}">${escapeHtml(date)}</time>` : ""}
      <nav class="platform-links" aria-label="${escapeHtml(translations[language].songAria(track.title))}">${platformLinks}</nav>
    </div>
  </article>`;
}

function renderCatalog() {
  const needle = search.value.trim().toLocaleLowerCase(language === "id" ? "id-ID" : "en-US");
  const visibleTracks = catalog.filter((track) => track.title.toLocaleLowerCase(language === "id" ? "id-ID" : "en-US").includes(needle));
  grid.innerHTML = visibleTracks.map(renderCard).join("");
  grid.setAttribute("aria-busy", "false");
  emptyState.hidden = visibleTracks.length !== 0;
  count.textContent = translations[language].count(visibleTracks.length, catalog.length);
}

function updateLanguage(nextLanguage) {
  language = nextLanguage === "en" ? "en" : "id";
  document.documentElement.lang = language;
  document.title = language === "id" ? "eL Utama — Musik & Tautan Resmi" : "eL Utama — Music & Official Links";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const translation = translations[language][element.dataset.i18n];
    if (translation) element.textContent = translation;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = translations[language][element.dataset.i18nPlaceholder];
  });
  document.querySelector(".social-links")?.setAttribute("aria-label", translations[language].socialAria);
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
search.addEventListener("input", renderCatalog);
configureLogo();
updateLanguage(language);

fetch("./catalog.json", { cache: "force-cache" })
  .then((response) => {
    if (!response.ok) throw new Error("Catalog request failed.");
    return response.json();
  })
  .then((tracks) => {
    catalog = eligibleTracks(tracks);
    renderCatalog();
  })
  .catch(() => {
    grid.innerHTML = `<p class="loading-state">${escapeHtml(translations[language].unavailable)}</p>`;
    grid.setAttribute("aria-busy", "false");
    count.textContent = "";
  });
