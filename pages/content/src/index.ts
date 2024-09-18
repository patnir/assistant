import { Comment, commentsStorageExtended } from '@extension/storage/lib/exampleThemeStorage';

console.log('content script loaded');

const createComment2 = async (document: Document, comment?: Comment) => {
  const id = comment ? comment.id : Math.random().toString(36).substring(2, 15);

  const commentWrapper = document.createElement('div');
  commentWrapper.style.position = 'absolute';
  commentWrapper.style.zIndex = '10000000';
  commentWrapper.setAttribute('data-comment-id', id);

  const topBanner = document.createElement('div');
  topBanner.style.width = '21px';
  topBanner.style.height = '21px';

  topBanner.style.backgroundColor = 'red';
  topBanner.style.display = 'flex';
  topBanner.style.justifyContent = 'center';
  topBanner.style.alignItems = 'center';
  topBanner.innerHTML = `
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.9 18C8.80858 18.9791 11.0041 19.2442 13.0909 18.7478C15.1777 18.2513 17.0186 17.0258 18.2818 15.2922C19.545 13.5585 20.1474 11.4307 19.9806 9.29216C19.8137 7.15361 18.8886 5.14497 17.3718 3.62819C15.855 2.11142 13.8464 1.18625 11.7078 1.01942C9.56929 0.852582 7.44147 1.45505 5.70782 2.71825C3.97417 3.98145 2.74869 5.82231 2.25222 7.90911C1.75575 9.99592 2.02094 12.1914 3 14.1L1 20L6.9 18Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  commentWrapper.appendChild(topBanner);
  document.body.appendChild(commentWrapper);

  const getElementPath = (element: Element): string => {
    if (element === document.body) return 'body';
    if (!element.parentElement) return '';
    const siblings = Array.from(element.parentElement.children);
    const index = siblings.indexOf(element);
    return `${getElementPath(element.parentElement)} > :nth-child(${index + 1})`;
  };

  const findNearestAnchor = (x: number, y: number): { element: Element; offsetX: number; offsetY: number } => {
    let element = document.elementFromPoint(x, y);
    while (element && element !== document.body) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          element,
          offsetX: x - rect.left,
          offsetY: y - rect.top,
        };
      }
      element = element.parentElement;
    }
    return { element: document.body, offsetX: x, offsetY: y };
  };

  const positionComment = (anchorPath: string, offsetX: number, offsetY: number) => {
    const anchor = document.querySelector(anchorPath);
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      commentWrapper.style.left = `${rect.left + offsetX}px`;
      commentWrapper.style.top = `${rect.top + offsetY}px`;
    }
  };

  if (comment) {
    console.log('on comment anchorPath', comment.anchorPath);

    positionComment(comment.anchorPath, comment.offsetX, comment.offsetY);
  } else {
    const { element, offsetX, offsetY } = findNearestAnchor(10, 10);
    const anchorPath = getElementPath(element);
    positionComment(anchorPath, offsetX, offsetY);
    await commentsStorageExtended.add({
      url: window.location.href,
      anchorPath,
      offsetX,
      offsetY,
      text: 'comment text',
      id,
      createdAt: Number(new Date()),
    });
  }

  let isDragging = false;
  let startX: number, startY: number;

  topBanner.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  document.addEventListener('mousemove', e => {
    if (isDragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      commentWrapper.style.left = `${commentWrapper.offsetLeft + dx}px`;
      commentWrapper.style.top = `${commentWrapper.offsetTop + dy}px`;
      startX = e.clientX;
      startY = e.clientY;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      const rect = commentWrapper.getBoundingClientRect();
      const { element, offsetX, offsetY } = findNearestAnchor(rect.left, rect.top);
      const anchorPath = getElementPath(element);
      positionComment(anchorPath, offsetX, offsetY);

      commentsStorageExtended.update({
        anchorPath,
        offsetX,
        offsetY,
        text: 'comment text',
        id: id,
      });
    }
  });
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('request', request);

  if (request.action === 'createComment') {
    console.log('content script alert');
    await createComment2(document);
  }

  if (request.action === 'loadComments') {
    await loadCommentsFromStorage();
  }
});

const loadCommentsFromStorage = async () => {
  console.log('loading comments from storage');
  const comments = await commentsStorageExtended.getByUrl(window.location.href);
  console.log('comments', comments);

  for (const comment of comments) {
    await createComment2(document, comment);
  }
};

// loadCommentsFromStorage();
