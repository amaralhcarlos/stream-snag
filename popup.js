const emptyState = document.getElementById("empty-state");
const urlList = document.getElementById("url-list");
const clearBtn = document.getElementById("clear-btn");

let activeTabId = null;

function ffmpegCommand(url) {
  return `ffmpeg -i "${url}" -c copy output.mp4`;
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function flashCopied(button) {
  const originalText = button.textContent;
  button.textContent = "Copiado!";
  button.disabled = true;
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 1500);
}

function createUrlItem(url) {
  const li = document.createElement("li");
  li.className = "url-item";

  const urlText = document.createElement("span");
  urlText.className = "url-text";
  urlText.textContent = url;
  urlText.title = url;

  const actions = document.createElement("div");
  actions.className = "url-actions";

  const copyUrlBtn = document.createElement("button");
  copyUrlBtn.className = "action-btn copy-url-btn";
  copyUrlBtn.textContent = "Copiar URL";
  copyUrlBtn.addEventListener("click", async () => {
    await copyToClipboard(url);
    flashCopied(copyUrlBtn);
  });

  const copyFfmpegBtn = document.createElement("button");
  copyFfmpegBtn.className = "action-btn copy-ffmpeg-btn";
  copyFfmpegBtn.textContent = "Copiar ffmpeg";
  copyFfmpegBtn.addEventListener("click", async () => {
    await copyToClipboard(ffmpegCommand(url));
    flashCopied(copyFfmpegBtn);
  });

  actions.appendChild(copyUrlBtn);
  actions.appendChild(copyFfmpegBtn);

  li.appendChild(urlText);
  li.appendChild(actions);

  return li;
}

function render(urls) {
  urlList.textContent = "";

  if (urls.length === 0) {
    emptyState.style.display = "block";
    urlList.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  urlList.style.display = "flex";

  for (const url of urls) {
    urlList.appendChild(createUrlItem(url));
  }
}

async function loadUrls() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    render([]);
    return;
  }
  activeTabId = tab.id;
  const urls = await chrome.runtime.sendMessage({ type: "GET_URLS", tabId: activeTabId });
  render(urls ?? []);
}

clearBtn.addEventListener("click", async () => {
  if (activeTabId === null) {
    return;
  }
  await chrome.runtime.sendMessage({ type: "CLEAR_URLS", tabId: activeTabId });
  render([]);
});

loadUrls();
