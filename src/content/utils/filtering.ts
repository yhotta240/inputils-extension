/** フィルタリング処理を実行してマッチ情報を返す */
export function performFiltering(
  iframeDoc: Document,
  query: string,
  itemSelector: string
): Array<{ element: HTMLElement; startIndex: number }> {
  if (!iframeDoc) return [];

  const items = iframeDoc.querySelectorAll<HTMLElement>(itemSelector);
  const lowerQuery = query.toLowerCase();
  const matchedItems: Array<{ element: HTMLElement; startIndex: number }> = [];

  items.forEach(item => {
    const text = item.getAttribute('data-text') || '';
    const enText = item.getAttribute('data-text-en') || '';
    const tags = item.getAttribute('data-tags') || '';
    const keywords = item.getAttribute('data-keywords') || '';
    const displayText = item.textContent || '';

    // data-text/data-text-en/data-keywords属性または表示テキストに検索文字列が含まれるかチェック
    const textIndex = text.toLowerCase().indexOf(lowerQuery);
    const enTextIndex = enText.toLowerCase().indexOf(lowerQuery);
    const displayIndex = displayText.toLowerCase().indexOf(lowerQuery);
    const tagsIndex = tags.toLowerCase().indexOf(lowerQuery);
    const keywordsIndex = keywords.toLowerCase().indexOf(lowerQuery);
    const matches = textIndex !== -1 || enTextIndex !== -1 || displayIndex !== -1 || tagsIndex !== -1 || keywordsIndex !== -1;

    if (query === '' || matches) {
      item.style.display = '';
      // マッチ位置を記録（先頭に近いほど優先度が高い）
      // 最も早く見つかったインデックスを使用
      const indices = [textIndex, enTextIndex, displayIndex, keywordsIndex].filter(i => i !== -1);
      const startIndex = indices.length > 0 ? Math.min(...indices) : 0;
      matchedItems.push({ element: item, startIndex });
    } else {
      item.style.display = 'none';
    }
  });

  return matchedItems;
}

/** マッチ位置に基づいてアイテムを並び替え */
export function sortByMatchPosition(
  items: Array<{ element: HTMLElement; startIndex: number }>
): void {
  if (items.length === 0) return;

  // 先頭に近い順にソート
  items.sort((a, b) => a.startIndex - b.startIndex);

  // 親要素を取得
  const container = items[0].element.parentElement;
  if (!container) return;

  // ソート順に再配置
  items.forEach(item => {
    container.appendChild(item.element);
  });
}

/** フィルタリングをリセット */
export function resetFiltering(iframeDoc: Document, itemSelector: string): void {
  if (!iframeDoc) return;
  const items = iframeDoc.querySelectorAll<HTMLElement>(itemSelector);
  items.forEach(item => {
    item.style.display = '';
  });
}

/** 特定のセレクタ以外のフィルタリングをリセット */
export function resetFilteringExcept(iframeDoc: Document, excludeSelector: string): void {
  const itemSelectors: string[] = [".template-item", ".emoji-item", ".tools-item", ".user-item"];
  itemSelectors.forEach(selector => {
    if (selector !== excludeSelector) {
      resetFiltering(iframeDoc, selector);
    }
  });
}