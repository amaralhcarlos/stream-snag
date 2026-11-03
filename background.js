// Tracks detected .m3u8 URLs per tab.
// `browser` is native (promise-based) on Firefox; Chrome only exposes
// `chrome`, whose MV3 APIs also support promises when no callback is given.
const api = globalThis.browser ?? globalThis.chrome;

const detectedUrls = new Map(); // tabId -> Set<string>

const BADGE_COLOR = "#e53e3e";

function addUrl(tabId, url) {
  if (!detectedUrls.has(tabId)) {
    detectedUrls.set(tabId, new Set());
  }
  const urls = detectedUrls.get(tabId);
  const sizeBefore = urls.size;
  urls.add(url);
  if (urls.size !== sizeBefore) {
    updateBadge(tabId, urls.size);
  }
}

function updateBadge(tabId, count) {
  api.action.setBadgeBackgroundColor({ color: BADGE_COLOR, tabId });
  api.action.setBadgeText({
    text: count > 0 ? String(count) : "",
    tabId,
  });
}

function clearTab(tabId) {
  detectedUrls.delete(tabId);
  api.action.setBadgeText({ text: "", tabId });
}

api.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) {
      return;
    }
    if (details.url.includes(".m3u8")) {
      addUrl(details.tabId, details.url);
    }
  },
  { urls: ["<all_urls>"] }
);

api.tabs.onRemoved.addListener((tabId) => {
  clearTab(tabId);
});

api.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    clearTab(tabId);
  }
});

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_URLS") {
    const urls = Array.from(detectedUrls.get(message.tabId) ?? []);
    sendResponse(urls);
  } else if (message.type === "CLEAR_URLS") {
    clearTab(message.tabId);
    sendResponse(true);
  } else if (message.type === "CONTENT_URLS" && sender.tab) {
    for (const url of message.urls) {
      addUrl(sender.tab.id, url);
    }
  }
});
