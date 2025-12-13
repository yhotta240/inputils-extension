import { performFiltering, sortByMatchPosition } from './utils/filtering';

/** テンプレートアイテムのクリックリスナーを設定 */
export function setupTemplateItemListeners(iframeDoc: Document): void {
  const templateItems = iframeDoc.querySelectorAll<HTMLElement>('.template-item');

  templateItems.forEach(item => {
    item.addEventListener('click', () => {
      const text = item.getAttribute('data-text') || '';
      window.parent.postMessage({ type: 'insertText', text: text }, '*');
    });
  });
}

/** 定型文アイテムを検索してフィルタリング */
export function filterTemplateItems(iframeDoc: Document, query: string): void {
  const matchedItems = performFiltering(iframeDoc, query, '.template-item');

  // クエリが空でない場合、マッチ位置でソート
  if (query !== '' && matchedItems.length > 0) {
    sortByMatchPosition(matchedItems);
  }
}