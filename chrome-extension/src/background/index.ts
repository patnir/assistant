import { exampleThemeStorage } from '@extension/storage';
import type { Comment } from '@extension/storage/lib/exampleThemeStorage';
import { commentsStorageExtended, tabIdStorage } from '@extension/storage/lib/exampleThemeStorage';

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

    console.log('tab.url', tab.url);

    commentsStorageExtended?.getByUrl(tab.url).then(comments => {
      for (const comment of comments) {
        console.log('comment', comment);
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: comment => {
            const commentElement = document.createElement('div');
            commentElement.style.position = 'fixed';
            commentElement.style.top = comment.top;
            commentElement.style.left = comment.left;
            commentElement.style.backgroundColor = 'red';
            commentElement.style.zIndex = '10000000';
            commentElement.innerHTML = comment.text;
            document.body.appendChild(commentElement);
          },
          args: [comment],
        });
      }
    });
  }

  // need to check if there are comments stored in storage
});

const openSidePanel = (tabId: number) => {
  console.log('openSidePanel', tabId);
  chrome.sidePanel.open({ tabId });
};

function storeComment(comment: Comment) {
  commentsStorageExtended?.add(comment);
}

function insertReddenButton(tabId: number) {
  const topBanner = document.createElement('div');
  topBanner.style.position = 'fixed';
  topBanner.style.top = '10px';
  topBanner.style.left = '10px';
  topBanner.style.width = '21px';
  topBanner.style.height = '21px';
  topBanner.style.backgroundColor = 'red';
  topBanner.style.zIndex = '10000000';
  topBanner.style.display = 'flex';
  topBanner.style.justifyContent = 'center';
  topBanner.style.alignItems = 'center';
  topBanner.innerHTML = `
      <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.9 18C8.80858 18.9791 11.0041 19.2442 13.0909 18.7478C15.1777 18.2513 17.0186 17.0258 18.2818 15.2922C19.545 13.5585 20.1474 11.4307 19.9806 9.29216C19.8137 7.15361 18.8886 5.14497 17.3718 3.62819C15.855 2.11142 13.8464 1.18625 11.7078 1.01942C9.56929 0.852582 7.44147 1.45505 5.70782 2.71825C3.97417 3.98145 2.74869 5.82231 2.25222 7.90911C1.75575 9.99592 2.02094 12.1914 3 14.1L1 20L6.9 18Z"
        stroke="black"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
  document.body.prepend(topBanner);

  // Draggable functionality
  let isDragging = false;
  const offset = { x: 0, y: 0 };

  topBanner.addEventListener('mousedown', e => {
    isDragging = true;
    offset.x = e.clientX - topBanner.getBoundingClientRect().left;
    offset.y = e.clientY - topBanner.getBoundingClientRect().top;
  });

  document.addEventListener('mousemove', e => {
    if (isDragging) {
      topBanner.style.left = `${e.clientX - offset.x}px`;
      topBanner.style.top = `${e.clientY - offset.y}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    // store position in storage by tabId and url
    const url = new URL(window.location.href);
    console.log('url', url);
    console.log('topBanner', topBanner.style.top, topBanner.style.left);
    // chrome.storage.local.set({ top: topBanner.style.top, left: topBanner.style.left, url: url.hostname });
    console.log('url.hostname', url.href);
    if (chrome.scripting) {
      // {{ edit_1 }}
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: storeComment,
        args: [
          {
            text: 'Hello',
            top: topBanner.style.top,
            left: topBanner.style.left,
            url: url.href,
            id: '1',
            createdAt: Date.now(),
          },
        ],
      });
    } else {
      console.error('chrome.scripting is not available');
    }
  });
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
      args: [request.tabId],
    });
  }

  if (request.action === 'seedRandomComments') {
    const tab = await chrome.tabs.get(request.tabId);
    console.log('tab', tab);
    const url = new URL(tab.url!).href;
    console.log('url', url);
    const randomTop = Math.floor(Math.random() * 1000);
    const randomLeft = Math.floor(Math.random() * 1000);

    const comment = {
      text: 'Hello',
      top: `${randomTop}px`,
      left: `${randomLeft}px`,
      url: url,
      id: '1',
      createdAt: Date.now(),
    };

    console.log('comment', comment);

    await commentsStorageExtended.add(comment);
  }
});
