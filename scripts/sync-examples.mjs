import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const rivetRoot = resolve(root, "..", "rivet");
const check = process.argv.includes("--check");

const examples = [
    {
        source: "counter.js",
        output: "counter.html",
        importLine: 'import { html, render, state } from "rivet";',
        trailer: 'document.querySelector("#app").append(render(Counter()));'
    },
    {
        source: "dynamic-ui.js",
        output: "dynamic-ui.html",
        importLine: 'import { html, key, mount, state } from "rivet";',
        trailer: 'mount("#app", DynamicList());'
    }
];

function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

let stale = false;
for (const example of examples) {
    const sourcePath = resolve(rivetRoot, "examples", example.source);
    const outputPath = resolve(root, "snippets", example.output);
    const source = await readFile(sourcePath, "utf8");
    const component = source.replace(/^import[^\n]+\n\n/, "").trim();
    const body = `${example.importLine}\n\n${component}\n\n${example.trailer}`;
    const generated = `<pre data-example-source="rivet/examples/${example.source}"><code>${escapeHtml(body)}</code></pre>\n`;

    if (check) {
        let current = "";
        try { current = await readFile(outputPath, "utf8"); } catch {}
        if (current !== generated) {
            console.error(`${example.source} documentation snippet is stale. Run: npm run docs:sync`);
            stale = true;
        }
    } else {
        await writeFile(outputPath, generated);
        console.log(`Synchronized ${example.source} documentation snippet.`);
    }
}

if (stale) process.exit(1);
if (check) console.log("Documentation examples are synchronized.");
