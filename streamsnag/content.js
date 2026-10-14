// Complements network-level detection by scanning the page's DOM and inline
// scripts for .m3u8 URLs that may not trigger a network request Chrome
// exposes to webRequest (e.g. URLs only ever assigned to element attributes).

const M3U8_PATTERN = /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g;

function findUrlsInText(text) {
  return text.match(M3U8_PATTERN) ?? [];
}

function scanPage() {
  const found = new Set();

  for (const el of document.querySelectorAll("video, source")) {
    const src = el.src || el.getAttribute("src");
    if (src && src.includes(".m3u8")) {
      found.add(src);
    }
  }

  for (const script of document.querySelectorAll("script:not([src])")) {
    for (const url of findUrlsInText(script.textContent)) {
      found.add(url);
    }
  }

  if (found.size > 0) {
    chrome.runtime.sendMessage({ type: "CONTENT_URLS", urls: Array.from(found) });
  }
}

scanPage();

let scanTimeout = null;
function scheduleScan() {
  if (scanTimeout) {
    return;
  }
  scanTimeout = setTimeout(() => {
    scanTimeout = null;
    scanPage();
  }, 500);
}

const observer = new MutationObserver(scheduleScan);
observer.observe(document.documentElement, { childList: true, subtree: true });
