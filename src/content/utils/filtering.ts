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
    const text = item.getAttribute('data-text') || item.getAttribute('data-emoji') || '';
    const displayText = item.textContent || '';
    const lowerText = text.toLowerCase();
    const lowerDisplayText = displayText.toLowerCase();

    // data-text/data-emoji属性または表示テキストに検索文字列が含まれるかチェック
    const textIndex = lowerText.indexOf(lowerQuery);
    const displayIndex = lowerDisplayText.indexOf(lowerQuery);
    const matches = textIndex !== -1 || displayIndex !== -1;

    if (query === '' || matches) {
      item.style.display = '';
      // マッチ位置を記録（先頭に近いほど優先度が高い）
      const startIndex = textIndex !== -1 ? textIndex : displayIndex;
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
