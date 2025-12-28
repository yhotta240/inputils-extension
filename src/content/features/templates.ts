import { performFiltering, sortByMatchPosition } from '../utils/filtering';

type TemplateItem = {
  id: string;
  subject: string;
  body: string;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type Template = {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  items: TemplateItem[];
};

type Templates = Record<Template["id"], Template>;

const templatesMeta: Template = {
  id: 'default-templates',
  name: 'Default Templates',
  url: 'https://example.com/default-templates',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  items: [
    {
      id: 'template-001',
      subject: 'お世話になっております。',
      body: 'いつも大変お世話になっております。\n\n以下の件についてご連絡いたします。よろしくお願いいたします。',
      usedCount: 0,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      id: 'template-002',
      subject: 'ご確認のほどよろしくお願いいたします。',
      body: 'ご確認のほどよろしくお願いいたします。何かご不明な点がございましたら、お気軽にお申し付けください。',
      usedCount: 0,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      id: 'template-003',
      subject: 'お疲れ様です。',
      body: 'お疲れ様です。本日の進捗状況を以下にまとめましたので、ご確認ください。引き続きよろしくお願いいたします。',
      usedCount: 0,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    },
  ],
};

/** 定型文データをエクスポート */
export const templates: Templates = {
  [templatesMeta.id]: templatesMeta,
}

/** テンプレートタブを初期化 */
export function initTemplatesTab(iframeDoc: Document): void {
  const templatesListContainer = iframeDoc.querySelector<HTMLElement>('#templates-list');
  const templatesNameContainer = iframeDoc.querySelector<HTMLElement>('#templates-name-container');
  if (!templatesListContainer || !templatesNameContainer) return;

  templatesListContainer.innerHTML = '';
  templatesNameContainer.innerHTML = '';

  // templates から各テンプレートアイテムを生成して追加
  Object.values(templates).forEach(template => {
    // テンプレート名をセレクトボックスに追加
    const option = iframeDoc.createElement('option');
    option.value = template.id;
    option.className = 'bg-custom-dark text-white';
    option.textContent = template.name;
    templatesNameContainer.appendChild(option);

    // 各テンプレートアイテムをリストに追加
    template.items.forEach(item => {
      const templateItem: HTMLButtonElement = iframeDoc.createElement('button');
      templateItem.type = 'button';
      templateItem.className = 'btn text-white-50 flex-shrink-0 p-2 template-item item w-50';
      templateItem.title = item.body;
      templateItem.setAttribute('data-id', item.id);
      templateItem.setAttribute('data-text', item.body);

      const small: HTMLElement = iframeDoc.createElement('small');
      small.className = 'text-custom text-start d-block line-clamp-1';
      small.textContent = item.body;

      templateItem.appendChild(small);
      templatesListContainer.appendChild(templateItem);
    });
  });
}

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