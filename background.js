let targetDomain = "mydomain.com";
let manualOverrides = {}; // map: domain → true/false
let originalUA = null;

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return "";
  }
}

function isTargetDomain(domain) {
  return domain === targetDomain || domain.endsWith("." + targetDomain);
}

function getActiveState(domain) {
  if (domain in manualOverrides) {
    return manualOverrides[domain];
  }
  return isTargetDomain(domain);
}

function updateIcon(tabId, url) {
  const domain = getDomain(url);
  const active = getActiveState(domain);
  const iconPath = active ? "icon-green.png" : "icon-gray.png";
  browser.browserAction.setIcon({ path: iconPath, tabId });
}

browser.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    const domain = getDomain(details.url);
    const active = getActiveState(domain);

    if (!active) return;

    for (let header of details.requestHeaders) {
      if (header.name.toLowerCase() === "user-agent") {
        if (!originalUA) originalUA = header.value;
        header.value = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
      }
    }
    return { requestHeaders: details.requestHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);

// Click to switch of status for the current domain
browser.browserAction.onClicked.addListener((tab) => {
  const domain = getDomain(tab.url);
  const current = getActiveState(domain);
  manualOverrides[domain] = !current;
  updateIcon(tab.id, tab.url);
});

// Update icon when panel is activated
browser.tabs.onActivated.addListener(({ tabId }) => {
  browser.tabs.get(tabId).then(tab => {
    updateIcon(tabId, tab.url);
  });
});

// Update icon when URL is changed
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    updateIcon(tabId, changeInfo.url);
  }
});

