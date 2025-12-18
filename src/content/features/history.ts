import { performFiltering, resetFilteringExcept, sortByMatchPosition } from '../utils/filtering';

/** 履歴アイテムのクリックイベントを設定 */
export function setupHistoryItemListeners(iframeDoc: Document): void {
  const historyItems = iframeDoc.querySelectorAll<HTMLElement>('.history-item');
  const historyName = iframeDoc.querySelector('#history-name');

  historyItems.forEach(item => {
    item.addEventListener('click', () => {
      const history = item.getAttribute('data-history') || '';
      window.parent.postMessage({ type: 'insertHistory', history: history }, '*');
    });

    // ホバー時にタイトルを表示
    item.addEventListener('mouseover', () => {
      const title = item.getAttribute('title') || '';
      if (historyName) {
        historyName.textContent = title;
        historyName.classList.remove('d-none');
      }
    });
  });
}

/** 履歴アイテムを検索してフィルタリング */
export function filterHistoryItems(iframeDoc: Document, query: string): void {
  // 他のセレクタのフィルタリングをリセット
  resetFilteringExcept(iframeDoc, '.history-item');

  const matchedItems = performFiltering(iframeDoc, query, '.history-item');

  // クエリが空でない場合，マッチ位置でソート
  if (query !== '' && matchedItems.length > 0) {
    sortByMatchPosition(matchedItems);
  }
}