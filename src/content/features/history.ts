import { performFiltering, resetFilteringExcept, sortByMatchPosition } from '../utils/filtering';

type HistoryItem = {
  id: string;
  text: string;
  timestamp: Date;
};

const defaultHistory: HistoryItem[] = [
  {
    id: 'history-1',
    text: 'お世話になっております。\n\n以下の件について確認させていただきたく、ご連絡いたしました。',
    timestamp: new Date('2024-06-01T10:00:00Z'),
  },
  {
    id: 'history-2',
    text: 'ご確認のほどよろしくお願いいたします。\n\n何かご不明な点がございましたら、お気軽にお申し付けください。',
    timestamp: new Date('2024-06-02T10:00:00Z'),
  },
  {
    id: 'history-3',
    text: 'お疲れ様です。\n\n進捗状況について共有させていただきます。',
    timestamp: new Date('2024-06-03T10:00:00Z'),
  },
  {
    id: 'history-4',
    text: 'ありがとうございます。\n\n承知いたしました。対応させていただきます。',
    timestamp: new Date('2024-06-04T10:00:00Z'),
  },
  {
    id: 'history-5',
    text: '申し訳ございません。\n\n再度確認の上、ご連絡させていただきます。',
    timestamp: new Date('2024-06-05T10:00:00Z'),
  }
];

/** 履歴タブを初期化 */
export function initHistoryTab(iframeDoc: Document): void {
  const historyListContainer = iframeDoc.querySelector<HTMLElement>('#history-list');
  if (!historyListContainer) return;

  historyListContainer.innerHTML = '';

  // タイムスタンプ順にソート（新しい順）
  defaultHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  defaultHistory.forEach(item => {
    const historyItem: HTMLButtonElement = iframeDoc.createElement('button');
    historyItem.type = 'button';
    historyItem.className = 'btn text-white-50 flex-shrink-0 p-2 history-item item w-50';
    historyItem.title = item.text;
    historyItem.setAttribute('data-text', item.text);

    const preview: HTMLElement = iframeDoc.createElement('small');
    preview.className = 'text-custom text-start d-block line-clamp-1';
    preview.textContent = item.text;

    historyItem.appendChild(preview);
    historyListContainer.appendChild(historyItem);
  });
}

/** 履歴アイテムのクリックイベントを設定 */
export function setupHistoryItemListeners(iframeDoc: Document): void {
  const historyItems = iframeDoc.querySelectorAll<HTMLElement>('.history-item');
  const historyName = iframeDoc.querySelector('#history-name');

  historyItems.forEach(item => {
    item.addEventListener('click', () => {
      const history = item.getAttribute('data-text') || '';
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