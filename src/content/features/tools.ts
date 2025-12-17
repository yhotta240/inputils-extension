import { performFiltering, resetFilteringExcept, sortByMatchPosition } from "../../content/utils/filtering";
import { generateText } from "../../services/gemini";
import { deleteSelectedText } from "../input";

// ツールとプロンプト生成関数のマップ
const toolPromptMap: Record<string, (text: string) => string> = {
  proofread: (text) => `次の文章を添削してください：\n\n${text}`,
  translate: (text) => `次の文章を日本語に翻訳してください：\n\n${text}`,
  keigo: (text) => `次の文章を丁寧な敬語に書き換えてください：\n\n${text}`
};

/** ツールアイテムのクリックイベントを設定 */
export function setupToolItemListeners(iframeDoc: Document, getSelectedText: () => string): void {
  const toolItems = iframeDoc.querySelectorAll<HTMLElement>('.tools-item');
  toolItems.forEach(item => {
    item.addEventListener('click', () => handleToolClick(item, getSelectedText));
  });
}

/** ツールアイテムクリック時の処理 */
function handleToolClick(item: HTMLElement, getSelectedText: () => string): void {
  const tool = item.getAttribute('data-tool') || '';
  const text = getSelectedText();

  if (text.length === 0) {
    console.warn("選択されたテキストがありません");
    return;
  }

  const promptGenerator = toolPromptMap[tool];
  if (!promptGenerator) {
    console.warn("対応していないツールです:", tool);
    return;
  }

  // 処理中は要素を無効化して連続クリックを防止
  item.style.pointerEvents = 'none';
  item.style.opacity = '0.6';

  const prompt = promptGenerator(text);

  generateText(prompt)
    .then((result) => {
      console.log("AI生成結果:", result);
      // 選択範囲を削除
      const deleted = deleteSelectedText();
      if (deleted) {
        window.parent.postMessage({ type: 'insertText', text: result }, '*');
      }
    })
    .catch((error) => {
      console.error("AI生成エラー:", error);
      // エラーメッセージを表示
      alert('申し訳ございません。処理中にエラーが発生しました。もう一度お試しください。');
    })
    .finally(() => {
      // 要素を再度有効化
      item.style.pointerEvents = '';
      item.style.opacity = '';
    });
}

/** ツールアイテムを検索してフィルタリング */
export function filterToolItems(iframeDoc: Document, query: string): void {
  resetFilteringExcept(iframeDoc, '.tools-item');

  const matchedItems = performFiltering(iframeDoc, query, '.tools-item');

  // クエリが空でない場合、マッチ位置でソート
  if (query !== '' && matchedItems.length > 0) {
    sortByMatchPosition(matchedItems);
  }
}