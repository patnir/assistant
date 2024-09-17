import { createStorage } from './base';
import { StorageEnum } from './enums';
import type { Theme, ThemeStorage } from './types';

const storage = createStorage<Theme>('theme-storage-key', 'light', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

// You can extend it with your own methods
export const exampleThemeStorage: ThemeStorage = {
  ...storage,
  toggle: async () => {
    await storage.set(currentTheme => {
      return currentTheme === 'light' ? 'dark' : 'light';
    });
  },
};

export const tabIdStorage = createStorage<number>('tabId-storage-key', 0, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export type Comment = {
  text: string;
  top: number;
  left: number;
  id: string;
  url: string;
  createdAt: number;
};

export const commentsStorage = createStorage<Comment[]>('comments-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});
