const FEATURED_TRACK_SLUG = "fokus-untuk-kita";

const grid = document.querySelector("#release-grid");
const count = document.querySelector("#catalog-count");
const search = document.querySelector("#catalog-search");
const emptyState = document.querySelector("#empty-state");
const featuredSpotify = document.querySelector("#featured-spotify");
const featuredYoutube = document.querySelector("#featured-youtube");
const featuredApple = document.querySelector("#featured-apple");
const featuredLink = document.querySelector("#featured-link");
const featuredCover = document.querySelector("#featured-cover");
const featuredTitle = document.querySelector("#featured-title");
const featuredTitleInline = document.querySelector("#featured-title-inline");
const featuredKicker = document.querySelector("#featured-kicker");
let catalog = [];

const gradients = [
  "linear-gradient(145deg, #bdd960, #385a55 58%, #282c41)",
  "linear-gradient(145deg, #ee9b7e, #a84c58 58%, #362848)",
  "linear-gradient(145deg, #91b8ba, #536675 58%, #28293c)",
  "linear-gradient(145deg, #f0ca72, #ae7855 58%, #454052)",
  "linear-gradient(145deg, #bb9be0, #775e9d 58%, #333048)",
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function colorFor(slug) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return gradients[Math.abs(hash) % gradients.length];
}

function initials(title) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0] || "eL").slice(0, 2).toUpperCase();
}

function renderCard(track) {
  const href = track.spotify || track.youtube;
  const platform = track.spotify ? "SPOTIFY" : "YOUTUBE";
  const dateLabel = track.released
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${track.released}T00:00:00Z`))
    : "VIDEO";
  const art = track.cover
    ? `<img src="${escapeHtml(track.cover)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`
    : `<span class="art-fallback" aria-hidden="true">${escapeHtml(initials(track.title))}</span>`;
  return `<article class="release-card">
    <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="Dengarkan ${escapeHtml(track.title)} di ${platform === "SPOTIFY" ? "Spotify" : "YouTube"}">
      <div class="release-artwork" style="--card-gradient:${colorFor(track.slug)}">
        ${art}<span class="release-platform">${platform}</span>
      </div>
      <div class="release-info">
        <div><h3 class="release-title">${escapeHtml(track.title)}</h3><time class="release-date"${track.released ? ` datetime="${track.released}"` : ""}>${dateLabel}</time></div>
        <span class="release-arrow" aria-hidden="true">↗</span>
      </div>
    </a>
  </article>`;
}

function renderCatalog(query = "") {
  const needle = query.trim().toLocaleLowerCase("id-ID");
  const filtered = catalog.filter((track) => track.title.toLocaleLowerCase("id-ID").includes(needle));
  grid.innerHTML = filtered.map(renderCard).join("");
  grid.setAttribute("aria-busy", "false");
  emptyState.hidden = filtered.length !== 0;
  count.textContent = needle ? `${filtered.length} DARI ${catalog.length} RILISAN` : `${catalog.length} RILISAN`;
}

fetch("./catalog.json", { cache: "force-cache" })
  .then((response) => {
    if (!response.ok) throw new Error("Katalog tidak dapat dimuat.");
    return response.json();
  })
  .then((tracks) => {
    catalog = tracks;
    const featured = catalog.find((track) => track.slug === FEATURED_TRACK_SLUG);
    if (featured) {
      if (featured.spotify) {
        featuredSpotify.href = featured.spotify;
        featuredLink.href = featured.spotify;
      }
      const youtubeLink = featured.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${featured.title} eL Utama`)}`;
      featuredYoutube.href = youtubeLink;
      featuredApple.href = featured.apple || `https://music.apple.com/us/search?term=${encodeURIComponent(`${featured.title} eL Utama`)}`;
      featuredTitle.textContent = featured.title;
      featuredTitleInline.textContent = featured.title;
      featuredLink.setAttribute("aria-label", `Buka ${featured.title} di Spotify`);
      featuredCover.alt = `Sampul ${featured.title} oleh eL Utama`;
      if (featured.cover) featuredCover.src = featured.cover;
      else featuredCover.removeAttribute("src");
      featuredKicker.textContent = `RILISAN · ${featured.released ? featured.released.slice(0, 4) : "eL UTAMA"}`;
    }
    renderCatalog(search.value);
  })
  .catch(() => {
    grid.innerHTML = '<p class="loading-state">Katalog belum tersedia. Coba muat ulang halaman.</p>';
    grid.setAttribute("aria-busy", "false");
  });

search.addEventListener("input", () => renderCatalog(search.value));
