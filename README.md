# StreamSnag

Chrome/Firefox extension (Manifest V3) that detects `.m3u8` HLS video streams
on the active tab and generates ready-to-use `ffmpeg` download commands.

## How it works

- `background.js` — a service worker that watches network requests via the
  `webRequest` API, flags URLs containing `.m3u8`, and tracks them per tab.
- `content.js` — a content script that scans the page's DOM and inline
  scripts for `.m3u8` URLs that may not surface as a distinct network
  request (e.g. URLs only ever assigned to element attributes).
- `popup.html` / `popup.css` / `popup.js` — the extension popup, listing
  every detected URL for the active tab with one-click buttons to copy the
  raw URL or a ready `ffmpeg -i "<url>" -c copy output.mp4` command.

## Installing locally (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this repository's root folder.

## Branching

- `develop` — all development work happens here.
- `main` — production/release branch. Pushing to `main` (typically via a
  merged pull request from `develop`) triggers the release workflow.

## Release workflow

`.github/workflows/release.yml` runs on every push to `main`:

1. Validates `manifest.json` (required fields, `manifest_version: 3`).
2. Packages the extension into `streamsnag-v<version>.zip`.
3. Uploads the zip as a build artifact, ready for upload to the Chrome Web
   Store or Firefox Add-ons.

## Requirements

- `ffmpeg` installed and available on your `PATH` to run the generated
  download commands.
