import { Comment, commentsStorageExtended } from '@extension/storage/lib/exampleThemeStorage';

console.log('content script loaded');

const createComment = async (document: Document, comment?: Comment) => {
  const id = comment ? comment.id : Math.random().toString(36).substring(2, 15);

  const topBanner = document.createElement('div');

  topBanner.style.position = 'fixed';
  topBanner.style.top = comment ? comment.top : '10px';
  topBanner.style.left = comment ? comment.left : '10px';
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

  if (!comment) {
    await commentsStorageExtended.add({
      url: window.location.href,
      top: topBanner.style.top,
      left: topBanner.style.left,
      text: 'comment text',
      id,
      createdAt: Number(new Date()),
    });
  }

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

    const url = new URL(window.location.href);
    console.log('url', url);
    console.log('topBanner', topBanner.style.top, topBanner.style.left);

    console.log('url.hostname', url.href);
    console.log('update comment', {
      top: topBanner.style.top,
      left: topBanner.style.left,
      text: 'comment text',
      id: id,
    });
    commentsStorageExtended.update({
      top: topBanner.style.top,
      left: topBanner.style.left,
      text: 'comment text',
      id: id,
    });
  });
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('request', request);

  if (request.action === 'createComment') {
    console.log('content script alert');
    await createComment(document);
  }

  if (request.action === 'loadComments') {
    const comments = await commentsStorageExtended.getByUrl(window.location.href);
    console.log('comments', comments);

    for (const comment of comments) {
      await createComment(document, comment);
    }
  }
});
