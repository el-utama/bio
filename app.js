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
    "playlist-kicker": "Spotify",
    "playlist-title": "Dengarkan di Spotify",
    "playlist-badge": "Artist resmi",
    "playlist-meta": "Lagu populer · eL Utama",
    "playlist-description": "Putar lagu populer eL Utama langsung di halaman ini, tanpa pindah tab.",
    "playlist-play": "Putar di sini",
    "playlist-open": "Buka di Spotify",
    "playlist-note": "Pemutar dimuat dari Spotify saat kamu menekan putar.",
    "playlist-loading": "Memuat…",
    "playlist-ready": "Pemutar Spotify siap.",
    "playlist-close": "Tutup pemutar",
    "playlist-iframe-title": "Pemutar Spotify — eL Utama",
    "playlist-error": "Pemutar tidak dapat dimuat. Coba buka di Spotify.",
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
    "playlist-kicker": "Spotify",
    "playlist-title": "Listen on Spotify",
    "playlist-badge": "Official artist",
    "playlist-meta": "Popular tracks · eL Utama",
    "playlist-description": "Play eL Utama's popular tracks right here, without leaving the page.",
    "playlist-play": "Play here",
    "playlist-open": "Open in Spotify",
    "playlist-note": "The player loads from Spotify when you press play.",
    "playlist-loading": "Loading…",
    "playlist-ready": "Spotify player ready.",
    "playlist-close": "Close player",
    "playlist-iframe-title": "Spotify player — eL Utama",
    "playlist-error": "The player couldn't load. Try opening Spotify instead.",
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
let playlistState = "idle";
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
  if (!track.cover) return `<span class="release-cover is-loaded" aria-hidden="true"></span>`;
  return `<img class="release-cover" src="./assets/el-utama_transparent.svg" alt="" width="70" height="70" loading="lazy" decoding="async">`;
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
  syncPlaylistLanguage();
  try { localStorage.setItem("el-utama-language", language); } catch {}
  if (catalog.length) renderCatalog();
}

function syncPlaylistLanguage() {
  const t = translations[language];
  const playButton = document.querySelector("#spotify-play");
  if (!playButton) return;
  playButton.textContent = playlistState === "loading" ? t["playlist-loading"] : t["playlist-play"];
  const closeButton = document.querySelector("#spotify-close");
  if (closeButton) closeButton.textContent = t["playlist-close"];
  const iframe = document.querySelector("#spotify-embed iframe");
  if (iframe) iframe.title = t["playlist-iframe-title"];
  const status = document.querySelector("#spotify-status");
  if (status) {
    if (playlistState === "loading") status.textContent = t["playlist-loading"];
    else if (playlistState === "loaded") status.textContent = t["playlist-ready"];
    else status.textContent = "";
  }
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

function parseSpotifyLink(value) {
  try {
    const url = new URL(value, window.location.href);
    if (url.hostname !== "open.spotify.com") return null;
    const match = url.pathname.match(/^(?:\/intl-[a-z]{2,5})?\/(artist|album|playlist|track)\/([A-Za-z0-9]+)\/?$/i);
    if (!match) return null;
    const type = match[1].toLowerCase();
    const id = match[2];
    return {
      web: `https://open.spotify.com/${type}/${id}`,
      embed: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  } catch {
    return null;
  }
}

const FIREFLY_BEAT_MS = 60000 / 90;

function createFireflyField(canvas, header) {
  if (!canvas || !header) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sprite = createGlowSprite();
  let width = 0;
  let height = 0;
  let zone = { left: 0, right: 0 };
  let particles = [];
  let bursts = [];
  let frameId = 0;
  let running = false;
  let wantPlaying = false;
  let lastFrame = 0;
  let beatOrigin = 0;
  let lastBeat = -1;
  let pointer = null;
  let resizeObserver = null;
  let destroyed = false;

  function createGlowSprite() {
    const size = 64;
    const glow = document.createElement("canvas");
    glow.width = size;
    glow.height = size;
    const glowCtx = glow.getContext("2d");
    const gradient = glowCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(244, 230, 200, 1)");
    gradient.addColorStop(0.14, "rgba(244, 230, 200, .92)");
    gradient.addColorStop(0.4, "rgba(215, 195, 156, .32)");
    gradient.addColorStop(0.72, "rgba(215, 195, 156, .08)");
    gradient.addColorStop(1, "rgba(215, 195, 156, 0)");
    glowCtx.fillStyle = gradient;
    glowCtx.fillRect(0, 0, size, size);
    return glow;
  }

  function seedParticles() {
    const span = Math.max(1, zone.right - zone.left);
    const count = Math.max(6, Math.min(20, Math.round(span / 34)));
    particles = Array.from({ length: count }, () => ({
      x: zone.left + Math.random() * span,
      y: 8 + Math.random() * Math.max(1, height - 16),
      phase: Math.random() * Math.PI * 2,
      driftX: 4 + Math.random() * 9,
      driftY: 2 + Math.random() * 5,
      speedX: 0.35 + Math.random() * 0.5,
      speedY: 0.28 + Math.random() * 0.45,
      size: 8 + Math.random() * 7,
      twinkle: 0.45 + Math.random() * 0.9,
      alpha: 0.32 + Math.random() * 0.3,
      flare: 0,
    }));
    bursts = [];
  }

  function measure() {
    if (destroyed) return;
    const headerRect = header.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const wordmarkRect = header.querySelector(".wordmark")?.getBoundingClientRect();
    const actionsRect = header.querySelector(".header-actions")?.getBoundingClientRect();
    width = Math.max(1, Math.round(canvasRect.width));
    height = Math.max(1, Math.round(canvasRect.height));

    let left = wordmarkRect ? wordmarkRect.right - headerRect.left + 10 : 16;
    let right = actionsRect ? actionsRect.left - headerRect.left - 10 : width - 16;
    if (right - left < 56) {
      left = 16;
      right = width - 16;
    }
    left = Math.max(10, left);
    right = Math.min(width - 10, right);
    if (right <= left + 20) {
      left = 10;
      right = Math.max(11, width - 10);
    }
    zone = { left, right };

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
    if (reducedMotion) drawStatic();
  }

  function drawStatic() {
    if (destroyed || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    particles.slice(0, 3).forEach((particle, index) => {
      const x = particle.x + Math.sin(index * 1.7) * 3;
      const y = particle.y + Math.cos(index * 2.1) * 2;
      const size = particle.size;
      ctx.globalAlpha = 0.34;
      ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "rgba(244, 230, 200, .9)";
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function flareRandom() {
    if (!particles.length) return;
    const count = Math.random() < 0.55 ? 1 : 2;
    for (let index = 0; index < count; index += 1) {
      particles[Math.floor(Math.random() * particles.length)].flare = 1;
    }
  }

  function spawnBurst(x, y) {
    const count = 4 + Math.floor(Math.random() * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 0.7;
      bursts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.12,
        size: 6 + Math.random() * 7,
        life: 0.65 + Math.random() * 0.35,
      });
    }
  }

  function draw(now, delta, beatGlow) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    const flareDecay = Math.pow(0.9, delta / 33);

    for (const particle of particles) {
      const x = particle.x + Math.sin(now * 0.00035 * particle.speedX + particle.phase) * particle.driftX;
      const y = particle.y + Math.cos(now * 0.0003 * particle.speedY + particle.phase * 1.6) * particle.driftY;
      let offsetX = 0;
      let offsetY = 0;
      let proximity = 0;

      if (pointer) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0.1 && distance < 64) {
          const push = (1 - distance / 64) * 5;
          offsetX = (dx / distance) * push;
          offsetY = (dy / distance) * push;
          proximity = 1 - distance / 64;
        }
      }

      particle.flare *= flareDecay;
      const twinkle = 0.5 + 0.5 * Math.sin(now * 0.0011 * particle.twinkle + particle.phase * 2.3);
      const brightness = Math.min(1, particle.alpha * (0.55 + twinkle * 0.45) + proximity * 0.22 + particle.flare * 0.55 + beatGlow * 0.16);
      const size = particle.size * (1 + particle.flare * 0.55 + beatGlow * 0.18) + proximity * 2;
      const px = x + offsetX;
      const py = y + offsetY;

      ctx.globalAlpha = brightness;
      ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
      ctx.globalAlpha = Math.min(1, brightness * 0.95);
      ctx.fillStyle = "rgba(244, 230, 200, .95)";
      ctx.beginPath();
      ctx.arc(px, py, 0.8 + particle.flare * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let index = bursts.length - 1; index >= 0; index -= 1) {
      const burst = bursts[index];
      burst.life -= delta / 720;
      if (burst.life <= 0) {
        bursts.splice(index, 1);
        continue;
      }
      burst.x += burst.vx * (delta / 16);
      burst.y += burst.vy * (delta / 16);
      burst.vy += 0.012;
      const size = burst.size * (0.6 + burst.life * 0.7);
      ctx.globalAlpha = Math.min(0.7, burst.life);
      ctx.drawImage(sprite, burst.x - size / 2, burst.y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    if (!running || destroyed) return;
    frameId = requestAnimationFrame(frame);
    if (now - lastFrame < 32) return;
    const delta = Math.min(50, now - lastFrame);
    lastFrame = now;

    const beat = Math.floor((now - beatOrigin) / FIREFLY_BEAT_MS);
    if (beat !== lastBeat) {
      lastBeat = beat;
      flareRandom();
      if (Math.random() < 0.34) {
        spawnBurst(
          zone.left + Math.random() * Math.max(1, zone.right - zone.left),
          height * (0.3 + Math.random() * 0.4),
        );
      }
    }
    const phase = ((now - beatOrigin) % FIREFLY_BEAT_MS) / FIREFLY_BEAT_MS;
    draw(now, delta, Math.pow(1 - phase, 4));
  }

  function kick() {
    if (destroyed || !wantPlaying || document.hidden || reducedMotion || running) return;
    running = true;
    lastFrame = performance.now();
    frameId = requestAnimationFrame(frame);
  }

  function start(resetBeat = false) {
    if (destroyed) return;
    const wasPlaying = wantPlaying;
    wantPlaying = true;
    header.classList.remove("is-paused");
    header.classList.add("is-playing");
    if (resetBeat || !wasPlaying) {
      beatOrigin = performance.now();
      lastBeat = -1;
    }
    if (reducedMotion) {
      drawStatic();
      return;
    }
    kick();
  }

  function pause() {
    if (destroyed) return;
    wantPlaying = false;
    running = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
    header.classList.remove("is-playing");
    header.classList.add("is-paused");
  }

  function burstCenter() {
    if (destroyed || !wantPlaying) return;
    spawnBurst((zone.left + zone.right) / 2, height / 2);
  }

  function onPointerMove(event) {
    const rect = header.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerLeave() {
    pointer = null;
  }

  function onPointerDown(event) {
    if (!wantPlaying || !(event.target instanceof Element) || event.target.closest("a, button")) return;
    const rect = header.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < zone.left - 16 || x > zone.right + 16 || y < 0 || y > height) return;
    spawnBurst(x, y);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else {
      kick();
    }
  }

  function onResize() {
    measure();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    running = false;
    wantPlaying = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
    resizeObserver?.disconnect();
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    header.removeEventListener("pointermove", onPointerMove);
    header.removeEventListener("pointerleave", onPointerLeave);
    header.removeEventListener("pointerdown", onPointerDown);
    header.classList.remove("is-playing", "is-paused");
    ctx.clearRect(0, 0, width, height);
    particles = [];
    bursts = [];
    pointer = null;
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(header);
    const wordmark = header.querySelector(".wordmark");
    const actions = header.querySelector(".header-actions");
    if (wordmark) resizeObserver.observe(wordmark);
    if (actions) resizeObserver.observe(actions);
  } else {
    window.addEventListener("resize", onResize);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  header.addEventListener("pointermove", onPointerMove, { passive: true });
  header.addEventListener("pointerleave", onPointerLeave, { passive: true });
  header.addEventListener("pointerdown", onPointerDown, { passive: true });
  measure();

  return { start, pause, burstCenter, destroy };
}

function initSpotifyEmbed() {
  const card = document.querySelector("#spotify-card");
  const facade = document.querySelector("#spotify-facade");
  const playButton = document.querySelector("#spotify-play");
  const closeButton = document.querySelector("#spotify-close");
  const openLink = document.querySelector("#spotify-open");
  const status = document.querySelector("#spotify-status");
  const header = document.querySelector(".site-header");
  const canvas = document.querySelector("#fireflies");
  if (!card || !facade || !playButton || !closeButton || !openLink || !status) return;

  const configuredUrl = window.EL_UTAMA_BRANDING?.spotifyArtistUrl?.trim();
  const spotify = parseSpotifyLink(configuredUrl || openLink.href);
  if (!spotify) return;

  openLink.href = spotify.web;
  playButton.hidden = false;

  let preconnected = false;
  const warmUp = () => {
    if (preconnected) return;
    preconnected = true;
    if (navigator.connection?.saveData) return;
    for (const href of ["https://open.spotify.com", "https://embed-cdn.spotifycdn.com"]) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      document.head.append(link);
    }
  };
  playButton.addEventListener("pointerenter", warmUp, { once: true, passive: true });
  playButton.addEventListener("focus", warmUp, { once: true });
  playButton.addEventListener("touchstart", warmUp, { once: true, passive: true });

  let embed = null;
  let controller = null;
  let visualizer = null;
  let loadTimer = 0;
  let apiStatus = "idle";
  let spotifyApi = null;
  let fallbackUsed = false;

  const apiSource = "https://open.spotify.com/embed/iframe-api/v1";
  const t = (key) => translations[language][key];

  function playerFrame() {
    return embed?.querySelector("iframe") || null;
  }

  function syncFrameTitle() {
    const frame = playerFrame();
    if (frame) frame.title = t("playlist-iframe-title");
  }

  function ensureVisualizer() {
    if (visualizer || !canvas || !header) return;
    visualizer = createFireflyField(canvas, header);
  }

  function resetPlayer() {
    window.clearTimeout(loadTimer);
    playlistState = "idle";
    card.setAttribute("aria-busy", "false");
    facade.hidden = false;
    closeButton.hidden = true;
    playButton.disabled = false;
    playButton.removeAttribute("aria-busy");
    playButton.textContent = t("playlist-play");
    visualizer?.destroy();
    visualizer = null;
    controller?.destroy?.();
    controller = null;
    embed?.remove();
    embed = null;
    fallbackUsed = false;
  }

  function revealPlayer() {
    if (playlistState !== "loading" || !embed) return;
    window.clearTimeout(loadTimer);
    loadTimer = 0;
    playlistState = "loaded";
    card.setAttribute("aria-busy", "false");
    embed.classList.add("is-ready");
    facade.hidden = true;
    closeButton.hidden = false;
    status.textContent = t("playlist-ready");
    syncFrameTitle();
    playerFrame()?.focus({ preventScroll: true });
  }

  function onPlaybackStarted() {
    if (playlistState === "idle") return;
    ensureVisualizer();
    visualizer?.start(true);
    visualizer?.burstCenter();
  }

  function onPlaybackUpdate(event) {
    if (playlistState === "idle") return;
    const data = event?.data;
    if (!data) return;
    ensureVisualizer();
    if (data.isPaused) visualizer?.pause();
    else visualizer?.start();
  }

  function onReady() {
    revealPlayer();
  }

  function fallbackToPlainIframe() {
    if (!embed || fallbackUsed || playlistState !== "loading") return;
    fallbackUsed = true;
    window.clearTimeout(loadTimer);
    visualizer?.destroy();
    visualizer = null;
    controller?.destroy?.();
    controller = null;
    embed.replaceChildren();

    const iframe = document.createElement("iframe");
    iframe.src = spotify.embed;
    iframe.title = t("playlist-iframe-title");
    iframe.width = "100%";
    iframe.height = "352";
    iframe.loading = "eager";
    iframe.setAttribute("allow", "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture");
    iframe.setAttribute("frameborder", "0");
    iframe.addEventListener("load", revealPlayer, { once: true });
    embed.append(iframe);

    loadTimer = window.setTimeout(() => {
      if (playlistState !== "loading") return;
      resetPlayer();
      status.textContent = t("playlist-error");
    }, 15000);
  }

  function createController() {
    if (!spotifyApi || !embed || fallbackUsed || playlistState !== "loading") return;
    const target = embed.querySelector("[data-spotify-api]");
    if (!target) {
      fallbackToPlainIframe();
      return;
    }
    try {
      spotifyApi.createController(target, {
        url: spotify.web,
        width: "100%",
        height: 352,
        theme: "dark",
      }, (nextController) => {
        if (fallbackUsed || playlistState !== "loading") {
          nextController?.destroy?.();
          return;
        }
        controller = nextController;
        const apiFrame = embed.querySelector("iframe");
        if (apiFrame) {
          apiFrame.loading = "eager";
          apiFrame.setAttribute("loading", "eager");
        }
        syncFrameTitle();
        controller.addListener("ready", onReady);
        controller.addListener("playback_started", onPlaybackStarted);
        controller.addListener("playback_update", onPlaybackUpdate);
      });
    } catch {
      fallbackToPlainIframe();
    }
  }

  function loadApi() {
    if (apiStatus !== "idle") return;
    apiStatus = "loading";
    window.onSpotifyIframeApiReady = (api) => {
      spotifyApi = api;
      apiStatus = "ready";
      if (playlistState === "loading" && !fallbackUsed) createController();
    };
    const script = document.createElement("script");
    script.src = apiSource;
    script.async = true;
    script.addEventListener("error", () => {
      apiStatus = "failed";
      if (playlistState === "loading") fallbackToPlainIframe();
    }, { once: true });
    document.head.append(script);
  }

  function openPlayer() {
    playlistState = "loading";
    card.setAttribute("aria-busy", "true");
    playButton.disabled = true;
    playButton.setAttribute("aria-busy", "true");
    playButton.textContent = t("playlist-loading");
    status.textContent = t("playlist-loading");
    fallbackUsed = false;

    embed = document.createElement("div");
    embed.className = "playlist-embed";
    embed.id = "spotify-embed";
    const target = document.createElement("div");
    target.dataset.spotifyApi = "";
    target.style.width = "100%";
    target.style.height = "100%";
    embed.append(target);
    card.append(embed);
    ensureVisualizer();

    loadTimer = window.setTimeout(() => {
      if (playlistState === "loading") fallbackToPlainIframe();
    }, 15000);

    if (apiStatus === "ready") createController();
    else if (apiStatus === "loading") return;
    else if (apiStatus === "failed") fallbackToPlainIframe();
    else loadApi();
  }

  playButton.addEventListener("click", () => {
    if (playlistState !== "idle") return;
    warmUp();
    openPlayer();
  });

  closeButton.addEventListener("click", () => {
    resetPlayer();
    status.textContent = "";
    playButton.focus({ preventScroll: true });
  });
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
initSpotifyEmbed();
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
