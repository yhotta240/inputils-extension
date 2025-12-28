import { performFiltering, resetFilteringExcept, sortByMatchPosition } from '../utils/filtering';

type UserItem = {
  id: string;
  name: string;
  email?: string;
  color?: string;
  iconUrl?: string; // アイコン画像のURL
  works?: string[]; // 職業
  tags?: string[]; // タグ
  relations?: string[]; // 関係性（友人,同僚,上司など）
};

const defaultUsers: UserItem[] = [
  { id: 'user-1', name: '山田 太郎', color: 'color-blue', iconUrl: 'https://pbs.twimg.com/profile_images/1845492619574669312/1COBmhxd_400x400.jpg', works: ['Developer'], tags: ['Developer', '同僚'], relations: ['同僚'] },
  { id: 'user-2', name: '佐藤 花子', color: 'color-pink', iconUrl: '', works: ['Project Manager'], tags: ['Project Manager', '上司'], relations: ['上司'] },
  { id: 'user-3', name: 'John Doe', color: 'color-teal', iconUrl: '', works: ['Operations'], tags: ['Operations', '友人'], relations: ['友人'] },
  { id: 'user-4', name: 'Alice', color: 'color-purple', iconUrl: '', works: ['Designer'], tags: ['Designer', '同僚'], relations: ['同僚'] },
];

/** ユーザタブを初期化 */
export function initUsersTab(iframeDoc: Document): void {
  const usersListContainer = iframeDoc.querySelector<HTMLElement>('#users-list');
  if (!usersListContainer) return;

  usersListContainer.innerHTML = '';

  // デフォルトユーザからアイテム生成
  defaultUsers.forEach(user => {
    const userItem: HTMLButtonElement = iframeDoc.createElement('button');
    userItem.type = 'button';
    userItem.className = `btn text-white-50 flex-shrink-0 p-1 user-item item d-flex align-items-center ${user.color || 'color-gray'}`;
    userItem.title = user.name;
    userItem.setAttribute('data-user', user.name);
    userItem.setAttribute('data-text', user.name);
    userItem.setAttribute('data-tags', (user.tags || []).join(','));

    // ユーザアイコン
    if (user.iconUrl) {
      // const iconSpan: HTMLElement = iframeDoc.createElement('span');
      // iconSpan.className = `user-icon rounded-circle  ${user.color || 'color-gray'}`;
      const img: HTMLImageElement = iframeDoc.createElement('img');
      img.src = user.iconUrl;
      img.alt = user.name;
      img.className = 'user-icon rounded-circle me-1';
      img.width = 24;
      img.height = 24;
      userItem.appendChild(img);
      // iconSpan.appendChild(img);
      // userItem.appendChild(iconSpan);
    }

    // ユーザ名
    const span: HTMLElement = iframeDoc.createElement('span');
    span.className = 'text-custom d-block line-clamp-1';
    span.textContent = user.name;

    userItem.appendChild(span);
    usersListContainer.appendChild(userItem);
  });
}

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
  // 他のセレクタのフィルタリングをリセット
  resetFilteringExcept(iframeDoc, '.user-item');

  const matchedItems = performFiltering(iframeDoc, query, '.user-item');

  // クエリが空でない場合，マッチ位置でソート
  if (query !== '' && matchedItems.length > 0) {
    sortByMatchPosition(matchedItems);
  }
}