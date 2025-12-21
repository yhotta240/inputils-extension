import { performFiltering, resetFilteringExcept, sortByMatchPosition } from "../../content/utils/filtering";
import { generateText } from "../../services/gemini";
import { deleteSelectedText } from "../input";
import { ToolItem, toolsList } from "./tool-items";

/** ツールタブの初期化 */
export function initToolsTab(iframeDoc: Document): void {
  const toolsListContainer = iframeDoc.querySelector<HTMLElement>('#tools-list');
  if (!toolsListContainer) return;

  // 既存のツールアイテムをクリア
  toolsListContainer.innerHTML = '';

  // toolsListから各ツールアイテムを生成して追加
  toolsList.forEach((tool: ToolItem) => {
    const toolItem: HTMLButtonElement = iframeDoc.createElement('button');
    toolItem.className = 'btn btn-sm btn-dark text-white-50 flex-shrink-0 tools-item item';
    toolItem.title = tool.description;
    toolItem.setAttribute('data-tool', tool.key);
    toolItem.setAttribute('data-tags', tool.tags ? tool.tags.join(',') : '');

    const icon: HTMLElement = iframeDoc.createElement('i');
    icon.className = `${tool.icon} me-1`;
    toolItem.prepend(icon);

    const small: HTMLElement = iframeDoc.createElement('small');
    small.className = 'text-custom ';
    small.textContent = tool.name;
    toolItem.appendChild(small);

    toolsListContainer.appendChild(toolItem);
  });
}

// ツールとプロンプト生成関数のマップ
const toolPromptMap: Record<string, (text: string) => string> = {
  correct: (text) => `次の文章を添削してください：\n\n${text}`,
  translate: (text) => `次の文章を日本語に翻訳してください：\n\n${text}`,
  keigo: (text) => `次の文章を丁寧な敬語に書き換えてください：\n\n${text}`
};

/** ツールアイテムのクリックイベントを設定 */
export function setupToolItemListeners(iframeDoc: Document, setTargetText: () => string): void {
  const toolItems = iframeDoc.querySelectorAll<HTMLElement>('.tools-item');
  toolItems.forEach(item => {
    item.addEventListener('click', () => handleToolClick(item, setTargetText()));
  });
}

/** ツールアイテムクリック時の処理 */
function handleToolClick(item: HTMLElement, targetText: string): void {
  const tool = item.getAttribute('data-tool') || '';

  if (targetText.length === 0) {
    console.log("対象テキストがありません");
    return;
  }

  const promptGenerator: ((text: string) => string) | undefined = toolPromptMap[tool];
  if (promptGenerator) {
    const prompt = promptGenerator(targetText);
    generateAndReplace(item, prompt);
  } else {
    const toolItem: ToolItem | undefined = toolsList.find((t: ToolItem) => t.key === tool);
    if (!toolItem || !toolItem.function) {
      console.log("未実装のツールです:", tool);
      return;
    }
    const result = toolItem.function(targetText);
    window.parent.postMessage({ type: 'insertText', text: result }, '*');
  }
}

/** AI生成を実行して選択範囲を置換 */
function generateAndReplace(item: HTMLElement, prompt: string): void {
  // 処理中は要素を無効化して連続クリックを防止
  item.style.pointerEvents = 'none';
  item.style.opacity = '0.6';

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
      alert('申し訳ございません．処理中にエラーが発生しました．もう一度お試しください．');
    })
    .finally(() => {
      // 要素を再度有効化
      item.style.pointerEvents = '';
      item.style.opacity = '';
    });
}

/** ツール対象テキストの表示を更新 */
export function updateToolTargetText(iframeDoc: Document, text: string): void {
  const targetTextElem = iframeDoc.querySelector('#tools-target-text') as HTMLElement;
  const isNoText: boolean = text.trim().length === 0;
  targetTextElem.classList.toggle('d-none', isNoText);
  targetTextElem.textContent = isNoText ? '' : `target: ${text}`;
  targetTextElem.title = text;

  const noTargetTextElem = iframeDoc.querySelector('#tools-no-target-text') as HTMLElement;
  noTargetTextElem.classList.toggle('d-none', !isNoText);
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