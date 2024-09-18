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
  id: string;
  url: string;
  createdAt: number;
  anchorPath: string;
  offsetX: number;
  offsetY: number;
};

export type CommentUpdate = {
  id: string;
  text: string;
  anchorPath: string;
  offsetX: number;
  offsetY: number;
};

export const commentsStorage = createStorage<Comment[]>('comments-storage-key', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const commentsStorageExtended = {
  ...commentsStorage,
  add: async (comment: Comment) => {
    await commentsStorage.set(comments => [...comments, comment]);
  },
  update: async (comment: CommentUpdate) => {
    await commentsStorage.set(comments => {
      const commentIndex = comments.findIndex(c => c.id === comment.id);
      if (commentIndex === -1) {
        return comments;
      }
      comments[commentIndex] = { ...comments[commentIndex], ...comment };
      return comments;
    });
  },
  remove: async (id: string) => {
    await commentsStorage.set(comments => comments.filter(comment => comment.id !== id));
  },
  getByUrl: async (url: string) => {
    const comments = await commentsStorage.get();
    return comments.filter(comment => comment.url === url);
  },
  getAll: async () => {
    return await commentsStorage.get();
  },
};
