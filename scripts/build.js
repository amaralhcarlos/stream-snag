#!/usr/bin/env node
"use strict";

// Assembles an unpacked, load-ready extension folder per browser under
// dist/<target>/, merging the shared manifest.base.json with the
// browser-specific overlay (manifest.<target>.json).

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SHARED_FILES = ["background.js", "content.js", "popup.html", "popup.css", "popup.js", "icons"];
const TARGETS = ["chrome", "firefox"];

function mergeManifest(target) {
  const base = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.base.json"), "utf8"));
  const overlay = JSON.parse(fs.readFileSync(path.join(ROOT, `manifest.${target}.json`), "utf8"));
  return { ...base, ...overlay };
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (entry.endsWith(".ps1")) {
        continue;
      }
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.copyFileSync(src, dest);
}

function build(target) {
  const outDir = path.join(ROOT, "dist", target);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const file of SHARED_FILES) {
    copyRecursive(path.join(ROOT, file), path.join(outDir, file));
  }

  const manifest = mergeManifest(target);
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`Built ${target} -> dist/${target}`);
}

const requested = process.argv[2];
const targets = !requested || requested === "all" ? TARGETS : [requested];

for (const target of targets) {
  if (!TARGETS.includes(target)) {
    console.error(`Unknown target "${target}". Expected one of: ${TARGETS.join(", ")}, or "all".`);
    process.exit(1);
  }
  build(target);
}
