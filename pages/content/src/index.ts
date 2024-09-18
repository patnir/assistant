import { Comment, commentsStorageExtended } from '@extension/storage/lib/exampleThemeStorage';

console.log('content script loaded');

const createComment = async (document: Document, comment?: Comment) => {
  const id = comment?.id || Math.random().toString(36).substring(2, 15);
  const commentWrapper = document.createElement('div');
  commentWrapper.id = `comment-${id}`;
  commentWrapper.style.position = 'absolute';
  commentWrapper.style.zIndex = '10000000';
  commentWrapper.innerHTML = `
    <div class="comment-header" style="cursor: move; background-color: red; width: 21px; height: 21px; display: flex; justify-content: center; align-items: center;">
      <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.9 18C8.80858 18.9791 11.0041 19.2442 13.0909 18.7478C15.1777 18.2513 17.0186 17.0258 18.2818 15.2922C19.545 13.5585 20.1474 11.4307 19.9806 9.29216C19.8137 7.15361 18.8886 5.14497 17.3718 3.62819C15.855 2.11142 13.8464 1.18625 11.7078 1.01942C9.56929 0.852582 7.44147 1.45505 5.70782 2.71825C3.97417 3.98145 2.74869 5.82231 2.25222 7.90911C1.75575 9.99592 2.02094 12.1914 3 14.1L1 20L6.9 18Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="comment-body" style="display: none; background-color: white; border: 1px solid black; padding: 5px;">
      <textarea style="width: 200px; height: 100px;">${comment?.text || ''}</textarea>
    </div>
  `;

  document.body.appendChild(commentWrapper);

  const header = commentWrapper.querySelector('.comment-header') as HTMLElement;
  const body = commentWrapper.querySelector('.comment-body') as HTMLElement;
  const textarea = commentWrapper.querySelector('textarea') as HTMLTextAreaElement;

  header.addEventListener('click', () => {
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  });

  let isDragging = false;
  let startX: number, startY: number;

  const startDragging = (e: MouseEvent) => {
    isDragging = true;
    startX = e.clientX - commentWrapper.offsetLeft;
    startY = e.clientY - commentWrapper.offsetTop;
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
  };

  const drag = (e: MouseEvent) => {
    if (isDragging) {
      commentWrapper.style.left = `${e.clientX - startX}px`;
      commentWrapper.style.top = `${e.clientY - startY}px`;
    }
  };

  const stopDragging = () => {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
    saveCommentPosition(id, commentWrapper.offsetLeft, commentWrapper.offsetTop);
  };

  header.addEventListener('mousedown', startDragging);

  textarea.addEventListener('blur', () => {
    saveCommentText(id, textarea.value);
  });

  if (comment) {
    commentWrapper.style.left = `${comment.offsetX}px`;
    commentWrapper.style.top = `${comment.offsetY}px`;
    textarea.value = comment.text;
  } else {
    commentWrapper.style.left = '10px';
    commentWrapper.style.top = '10px';
    await saveNewComment(id, 10, 10, '');
  }

  return commentWrapper;
};

const saveCommentPosition = async (id: string, offsetX: number, offsetY: number) => {
  await commentsStorageExtended.update({ id, offsetX, offsetY } as any);
};

const saveCommentText = async (id: string, text: string) => {
  await commentsStorageExtended.update({ id, text } as any);
};

const saveNewComment = async (id: string, offsetX: number, offsetY: number, text: string) => {
  const newComment: Comment = {
    id,
    text,
    url: window.location.href,
    createdAt: Date.now(),
    offsetX,
    offsetY,
    selector: '',
  };
  await commentsStorageExtended.add(newComment);
};

const loadCommentsFromStorage = async () => {
  console.log('loading comments from storage');
  const comments = await commentsStorageExtended.getByUrl(window.location.href);
  console.log('comments', comments);

  comments.forEach(comment => createComment(document, comment));
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('request', request);

  if (request.action === 'createComment') {
    console.log('creating new comment');
    await createComment(document);
  }

  if (request.action === 'loadComments') {
    await loadCommentsFromStorage();
  }
});

// Load comments when the page loads
window.addEventListener('load', loadCommentsFromStorage);

// Reposition comments on window resize
window.addEventListener('resize', loadCommentsFromStorage);
