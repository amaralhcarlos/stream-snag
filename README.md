# StreamSnag

Chrome/Firefox extension (Manifest V3) that detects `.m3u8` HLS video streams
on the active tab and generates ready-to-use `ffmpeg` download commands.

## How it works

- `background.js` — a background script (service worker on Chrome, event
  page on Firefox) that watches network requests via the `webRequest` API,
  flags URLs containing `.m3u8`, and tracks them per tab.
- `content.js` — a content script that scans the page's DOM and inline
  scripts for `.m3u8` URLs that may not surface as a distinct network
  request (e.g. URLs only ever assigned to element attributes).
- `popup.html` / `popup.css` / `popup.js` — the extension popup, listing
  every detected URL for the active tab with one-click buttons to copy the
  raw URL or a ready `ffmpeg -i "<url>" -c copy output.mp4` command.

All three scripts call the extension APIs through `const api = globalThis.browser ?? globalThis.chrome;`
so the same source runs unmodified on both browsers (Firefox's native
`browser.*` is promise-based; Chrome's `chrome.*` also supports promises in
MV3 when no callback is passed).

## Manifest layout

Chrome and Firefox need slightly different `background` keys and Firefox
additionally needs a `browser_specific_settings.gecko.id`. Instead of one
manifest with both, the source of truth is split:

- `manifest.base.json` — fields shared by both browsers.
- `manifest.chrome.json` — Chrome-only overlay (`background.service_worker`).
- `manifest.firefox.json` — Firefox-only overlay (`background.scripts` +
  `browser_specific_settings`).

`scripts/build.js` merges the base manifest with a browser overlay and
copies the shared source files into an unpacked, load-ready folder.

## Building

```sh
npm run build:chrome   # -> dist/chrome/
npm run build:firefox  # -> dist/firefox/
npm run build          # both
```

## Installing locally (unpacked)

**Chrome:**

1. Run `npm run build:chrome`.
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select `dist/chrome`.

**Firefox:**

1. Run `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `dist/firefox/manifest.json`.

## Branching

- `develop` — all development work happens here.
- `main` — production/release branch. Pushing to `main` (typically via a
  merged pull request from `develop`) triggers the release workflow.

## Release workflow

`.github/workflows/release.yml` runs on every push to `main`, with one
pipeline per browser:

1. `validate` — checks `manifest.base.json` (required fields,
   `manifest_version: 3`) and reads the version.
2. `build-chrome` — builds `dist/chrome` and zips it into
   `streamsnag-chrome-v<version>.zip`, the format expected by the Chrome Web
   Store.
3. `build-firefox` — builds `dist/firefox`, lints it and packages it with
   Mozilla's `web-ext` CLI into `streamsnag-firefox-v<version>.zip`, ready
   for Firefox Add-ons (AMO) or self-distribution.
4. `release` — once both packages are built, creates (or skips, if the tag
   already exists) a GitHub Release with both zips attached.

## Requirements

- `ffmpeg` installed and available on your `PATH` to run the generated
  download commands.
- Node.js (for `npm run build:*` and the Firefox `web-ext` tooling).
