import { performFiltering, sortByMatchPosition } from '../utils/filtering';

/** アイテムのクリックイベントを設定 */
export function setupUserItemListeners(iframeDoc: Document): void {
  const userItems = iframeDoc.querySelectorAll<HTMLElement>('.user-item');

  userItems.forEach(item => {
    item.addEventListener('click', () => {
      const user = item.getAttribute('data-user') || '';
      window.parent.postMessage({ type: 'insertUser', user: user }, '*');
    });
  });
}

/** ユーザアイテムを検索してフィルタリング */
export function filterUserItems(iframeDoc: Document, query: string): void {
  const matchedItems = performFiltering(iframeDoc, query, '.user-item');

  // クエリが空でない場合、マッチ位置でソート
  if (query !== '' && matchedItems.length > 0) {
    sortByMatchPosition(matchedItems);
  }
}