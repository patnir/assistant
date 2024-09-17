import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { tabIdStorage } from '@extension/storage/lib/exampleThemeStorage';
import '@src/SidePanel.css';

const SidePanel = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';

  const getTabInfo = async () => {
    const tabId = await tabIdStorage.get();
    const response = chrome.runtime.sendMessage({ action: 'getTabInfo', tabId }, {}, response => {
      console.log('response', response);
    });
    console.log(response);
  };

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <button className="bg-blue-500 text-white p-2 rounded" onClick={getTabInfo}>
        Get Tab Info
      </button>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
