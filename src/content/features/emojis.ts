import { performFiltering, resetFilteringExcept, sortByMatchPosition } from '../utils/filtering';
import compactEmojisJa from 'emojibase-data/ja/compact.json';
import compactEmojisEn from 'emojibase-data/en/compact.json';
import type { CompactEmoji } from 'emojibase';

/** 絵文字タブを初期化 */
export function initEmojisTab(iframeDoc: Document): void {
  const emojisListContainer = iframeDoc.querySelector<HTMLElement>('#emojis-list');
  if (!emojisListContainer) return;

  emojisListContainer.innerHTML = '';

  // 英語データをマップに変換（hexcodeをキーにする）
  const emojiEnMap = new Map<string, CompactEmoji>();
  compactEmojisEn.forEach(emoji => {
    emojiEnMap.set(emoji.hexcode, emoji);
  });

  // emojibaseのデータから絵文字アイテムを生成
  compactEmojisJa.forEach((emoji: CompactEmoji) => {
    // 地域指標文字（U+1F1E6～U+1F1FF）を除外
    // これらは単体では意味がなく，2つ組み合わせて国旗絵文字になる
    const codePoint = emoji.unicode.codePointAt(0);
    if (codePoint && codePoint >= 0x1F1E6 && codePoint <= 0x1F1FF) {
      return; // 地域指標はスキップ
    }

    const emojiItem: HTMLButtonElement = iframeDoc.createElement('button');
    emojiItem.type = 'button';
    emojiItem.className = 'btn text-white-50 flex-shrink-0 p-1 emoji-item item';

    // 日本語の名前を取得
    const nameJa = emoji.label || '';

    // 英語の名前を取得
    const emojiEn = emojiEnMap.get(emoji.hexcode);
    const nameEn = emojiEn?.label || '';

    // タイトルに日本語名と英語名を設定
    const title = nameEn ? `${nameJa} - ${nameEn}` : nameJa;
    emojiItem.title = title;
    emojiItem.setAttribute('data-emoji', emoji.unicode);
    emojiItem.setAttribute('data-text', nameJa);
    emojiItem.setAttribute('data-text-en', nameEn);

    // キーワードを追加（日本語名，英語名，タグ）
    const keywords: string[] = [nameJa, nameEn];
    if (emoji.tags) {
      keywords.push(...emoji.tags);
    }
    if (emojiEn?.tags) {
      keywords.push(...emojiEn.tags);
    }
    emojiItem.setAttribute('data-keywords', keywords.join(','));

    const span: HTMLElement = iframeDoc.createElement('span');
    span.className = 'text-custom d-block';
    span.textContent = emoji.unicode;

    emojiItem.appendChild(span);
    emojisListContainer.appendChild(emojiItem);
  });
}

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
  resetFilteringExcept(iframeDoc, '.emoji-item');

  const matchedItems = performFiltering(iframeDoc, query, '.emoji-item');

  // クエリが空でない場合，マッチ位置でソート
  if (query !== '' && matchedItems.length > 0) {
    sortByMatchPosition(matchedItems);
  }
}