import { performFiltering, sortByMatchPosition } from './utils/filtering';

/** ツールアイテムのクリックイベントを設定 */
export function setupEmojiItemListeners(iframeDoc: Document): void {
  const emojiItems = iframeDoc.querySelectorAll<HTMLElement>('.emoji-item');
  const emojiName = iframeDoc.querySelector('#emoji-name');

  emojiItems.forEach(item => {
    item.addEventListener('click', () => {
      const emoji = item.getAttribute('data-emoji') || '';
      window.parent.postMessage({ type: 'insertEmoji', emoji: emoji }, '*');
    });

    // ホバー時にタイトルを表示
    item.addEventListener('mouseover', () => {
      const title = item.getAttribute('title') || '';
      if (emojiName) {
        emojiName.textContent = title;
        emojiName.classList.remove('d-none');
      }
    });
  });
}

/** 絵文字アイテムを検索してフィルタリング */
export function filterEmojiItems(iframeDoc: Document, query: string): void {
  const matchedItems = performFiltering(iframeDoc, query, '.emoji-item');

  // クエリが空でない場合、マッチ位置でソート
  if (query !== '' && matchedItems.length > 0) {
    sortByMatchPosition(matchedItems);
  }
}