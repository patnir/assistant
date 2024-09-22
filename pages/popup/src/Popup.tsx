import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { tabIdStorage } from '@extension/storage/lib/exampleThemeStorage';
import '@src/Popup.css';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  // const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';

  const injectContentScript = async () => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

    if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
      chrome.notifications.create('inject-error', notificationOptions);
    }

    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id! },
        files: ['/content-runtime/index.iife.js'],
      })
      .catch(err => {
        // Handling errors related to other paths
        if (err.message.includes('Cannot access a chrome:// URL')) {
          chrome.notifications.create('inject-error', notificationOptions);
        }
      });
  };

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={async () => chrome.runtime.sendMessage({ action: 'reddenPage', tabId: await tabIdStorage.get() })}>
          Redden
        </button>
        <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={async () =>
            chrome.runtime.sendMessage({ action: 'openSidePanel', tabId: await tabIdStorage.get() })
          }>
          Generatssse Summary
        </button>
        <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={async () =>
            chrome.runtime.sendMessage({ action: 'seedRandomComments', tabId: await tabIdStorage.get() })
          }>
          Seed Comments
        </button>
        <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={async () => {
            // await injectContentScript();
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log(tab);
            if (tab.id) {
              await tabIdStorage.set(tab.id);
              console.log('sending tab id message', tab.id);
              chrome.tabs.sendMessage(
                tab.id,
                {
                  action: 'createComment',
                },
                response => {
                  console.log(response);
                },
              );
            } else {
              console.error('Tab id not found');
            }
          }}>
          Content Script Alert
        </button>
        <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={() => {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
              const tab = tabs[0];
              console.log('please');
              if (tab.id) {
                chrome.tabs.sendMessage(
                  tab.id,
                  {
                    action: 'shareComments',
                  },
                  function (response) {
                    console.log('share commments response', response);
                  },
                );
              } else {
                console.error('Tab id not found');
              }
            });
          }}>
          Share Comments
        </button>
        <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id) {
              chrome.tabs.sendMessage(
                tab.id,
                {
                  action: 'loadComments',
                },
                response => {
                  console.log('get comments response', response);
                  console.log(response);
                },
              );
            } else {
              console.error('Tab id not found');
            }
          }}>
          Load Comments
        </button>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
