import { build } from "esbuild";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist");
const mode = process.argv[2] === "development" ? "development" : "production";
const excluded = new Set([".DS_Store", ".git", ".gitignore", "dist", "node_modules", "package-lock.json", "package.json", "scripts", "vercel.json"]);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
for (const entry of await readdir(projectRoot, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  await cp(path.join(projectRoot, entry.name), path.join(outputDirectory, entry.name), { recursive: true });
}

const platforms = [
  { key: "spotify", label: "Spotify", symbol: "i-spotify", base: "https://open.spotify.com/track/" },
  { key: "youtube", label: "YouTube Music", symbol: "i-ytmusic", base: "https://music.youtube.com/" },
  { key: "apple", label: "Apple Music", symbol: "i-applemusic", base: "https://music.apple.com/" },
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function hasValidLinks(track) {
  return platforms.every((platform) => {
    const link = track[platform.key];
    if (typeof link !== "string" || !link.startsWith(platform.base)) return false;
    return platform.key !== "youtube" || link.startsWith("https://music.youtube.com/watch?");
  });
}

function renderCard(track) {
  const cover = track.slug === "fokus-untuk-kita" ? "./assets/fokus-cover.jpg" : track.cover;
  const coverMarkup = cover
    ? `<img class="release-cover" src="${escapeHtml(cover)}" alt="" width="52" height="52" loading="lazy" decoding="async">`
    : '<span class="release-cover is-loaded" aria-hidden="true"></span>';
  const links = platforms.map((platform) =>
    `<a class="platform-link" data-platform="${platform.key}" href="${escapeHtml(track[platform.key])}" target="_blank" rel="noopener noreferrer" aria-label="Dengarkan ${escapeHtml(track.title)} di ${platform.label}"><svg class="icon" aria-hidden="true" focusable="false"><use href="#${platform.symbol}"></use></svg></a>`,
  ).join("");
  const date = track.released
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${track.released}T00:00:00Z`))
    : "";
  return `<article class="release-card">
    ${coverMarkup}
    <div class="release-info">
      <h3 class="release-title">${escapeHtml(track.title)}</h3>
      ${date ? `<time class="release-date" datetime="${escapeHtml(track.released)}">${escapeHtml(date)}</time>` : ""}
    </div>
    <nav class="platform-links" aria-label="Tautan lagu ${escapeHtml(track.title)}">${links}</nav>
  </article>`;
}

const catalog = JSON.parse(await readFile(path.join(projectRoot, "catalog.json"), "utf8"));
const prerenderedTracks = catalog.filter((track) => track.kind === "song" && hasValidLinks(track));
const indexPath = path.join(outputDirectory, "index.html");
const indexHtml = await readFile(indexPath, "utf8");
if (!indexHtml.includes("<!-- CATALOG_COUNT -->") || !indexHtml.includes("<!-- CATALOG_ITEMS -->")) {
  throw new Error("Catalog prerender markers are missing from index.html.");
}
await writeFile(indexPath, indexHtml
  .replace("<!-- CATALOG_COUNT -->", `${prerenderedTracks.length} lagu`)
  .replace("<!-- CATALOG_ITEMS -->", prerenderedTracks.map(renderCard).join("\n")));

await build({
  entryPoints: [path.join(projectRoot, "app.js")],
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["es2020"],
  outfile: path.join(outputDirectory, "app.js"),
  minify: mode === "production",
  define: { "process.env.NODE_ENV": JSON.stringify(mode) },
});

console.log(`Built ${mode} site in dist/ with ${prerenderedTracks.length} prerendered songs.`);
