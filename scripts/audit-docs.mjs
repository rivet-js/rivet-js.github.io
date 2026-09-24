import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const rivetRoot = resolve(siteRoot, "../rivet");
const tracked = JSON.parse(await readFile(join(siteRoot, ".nift/tracked.json"), "utf8")).tracked;

const contentFiles = [];
async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.isFile() && entry.name.endsWith(".html")) contentFiles.push(full);
    }
}
await walk(join(siteRoot, "content"));
const content = (await Promise.all(contentFiles.map((file) => readFile(file, "utf8")))).join("\n");
const api = await readFile(join(siteRoot, "content/docs/api.html"), "utf8");
const nav = await readFile(join(siteRoot, "templates/docs-nav.html"), "utf8");
const status = await readFile(join(siteRoot, "content/status.html"), "utf8");

const core = await import(pathToFileURL(join(rivetRoot, "src/core.js")));
const hypermedia = await import(pathToFileURL(join(rivetRoot, "src/hypermedia.js")));
const exports = [...new Set([...Object.keys(core), ...Object.keys(hypermedia)])].sort();
const missingExports = exports.filter((name) => !api.includes(name));
if (missingExports.length) throw new Error(`API page is missing public exports: ${missingExports.join(", ")}`);

for (const item of tracked) {
    if (item.title !== "Rivet") throw new Error(`tracked page ${item.name} does not use title Rivet`);
    const name = item.name === "/" ? "index" : item.name;
    const source = join(siteRoot, "content", `${name}.html`);
    try { await readFile(source, "utf8"); }
    catch { throw new Error(`tracked page ${item.name} is missing ${source}`); }
}

for (const required of ["docs/getting-started", "docs/reactivity", "docs/rendering", "docs/components", "docs/api", "docs/hypermedia", "docs/architecture", "docs/security", "docs/accessibility"]) {
    if (!tracked.some((item) => item.name === required)) throw new Error(`required docs page is not tracked: ${required}`);
    if (!nav.includes(`@path('${required}')`)) throw new Error(`docs navigation is missing ${required}`);
}

for (const phrase of ["Chromium", "Firefox", "WebKit", "Not yet certified"]) {
    if (!status.includes(phrase)) throw new Error(`status page is missing compatibility/limitation text: ${phrase}`);
}
for (const phrase of ["Security", "Accessibility", "AI-DX", "hypermedia", "state(", "RequestError"]) {
    if (!content.includes(phrase)) throw new Error(`documentation corpus is missing required topic: ${phrase}`);
}

console.log(`docs audit: PASS (${exports.length} public exports, ${tracked.length} tracked pages)`);
