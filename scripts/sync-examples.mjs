import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const rivetRoot = resolve(root, "..", "rivet");
const sourcePath = resolve(rivetRoot, "examples", "counter.js");
const outputPath = resolve(root, "snippets", "counter.html");
const check = process.argv.includes("--check");

const source = await readFile(sourcePath, "utf8");
const component = source.replace(/^import[^\n]+\n\n/, "").trim();
const example = `import { html, render, state } from "rivet";\n\n${component}\n\ndocument.querySelector("#app").append(render(Counter()));`;
const escaped = example
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const generated = `<pre data-example-source="rivet/examples/counter.js"><code>${escaped}</code></pre>\n`;

if (check) {
    let current = "";
    try { current = await readFile(outputPath, "utf8"); } catch {}
    if (current !== generated) {
        console.error("Counter documentation snippet is stale. Run: npm run docs:sync");
        process.exit(1);
    }
    console.log("Documentation examples are synchronized.");
} else {
    await writeFile(outputPath, generated);
    console.log("Synchronized Counter documentation snippet.");
}
