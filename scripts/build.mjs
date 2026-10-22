import { build } from "esbuild";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
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

console.log("Built " + mode + " site in dist/");
