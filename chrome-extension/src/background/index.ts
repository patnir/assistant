import { exampleThemeStorage } from '@extension/storage';
import { tabIdStorage } from '@extension/storage/lib/exampleThemeStorage';
import 'webextension-polyfill';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const matchUrls = ['github.com', 'twitter.com', 'stackoverflow.com'];
  if (tab.url && matchUrls.some(url => tab.url && tab.url.includes(url))) {
    chrome.action.openPopup();
    tabIdStorage.set(tabId).then(() => {
      console.log('tabId set', tabId);
    });
  }
});

const openSidePanel = (tabId: number) => {
  console.log('openSidePanel', tabId);
  chrome.sidePanel.open({ tabId });
};

function reddenPage() {
  document.body.style.backgroundColor = 'red';
}

function insertReddenButton() {
  console.log('insertReddenButton');
  document.body.style.backgroundColor = 'red';

  const topBanner = document.createElement('div');
  topBanner.style.position = 'fixed';
  topBanner.style.top = '0';
  topBanner.style.left = '0';
  topBanner.style.width = '100%';
  topBanner.style.backgroundColor = 'red';
  topBanner.style.zIndex = '10000000';
  topBanner.style.height = '50px';
  topBanner.style.display = 'flex';
  topBanner.style.justifyContent = 'center';
  topBanner.style.alignItems = 'center';
  topBanner.textContent = 'Reddened Page';
  document.body.prepend(topBanner);
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    openSidePanel(request.tabId);
  }

  if (request.action === 'getTabInfo') {
    const tab = await chrome.tabs.get(request.tabId);
    console.log('tab', tab);
    sendResponse({ tab: tab.url });
  }

  if (request.action === 'reddenPage') {
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      func: insertReddenButton,
    });
  }
});
