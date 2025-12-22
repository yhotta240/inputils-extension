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

/** ツールアイテムのクリックイベントを設定 */
export function setupToolItemListeners(iframeDoc: Document, targetText: () => string, hasSelection: () => boolean): void {
  const toolItems = iframeDoc.querySelectorAll<HTMLElement>('.tools-item');
  toolItems.forEach(item => {
    item.addEventListener('click', () => handleToolClick(item, targetText().trimStart(), hasSelection()));
  });
}

/** ツールアイテムクリック時の処理 */
function handleToolClick(item: HTMLElement, targetText: string, hasSelection: boolean): void {
  const toolKey = item.getAttribute('data-tool') || '';

  if (targetText.length === 0) {
    console.log("対象テキストがありません");
    return;
  }

  const toolItem: ToolItem | undefined = toolsList.find((t: ToolItem) => t.key === toolKey);
  if (!toolItem) {
    console.log("ツールが見つかりません:", toolKey);
    return;
  }

  // AI生成ツール
  if (toolItem.source === 'ai' && toolItem.systemPrompt) {
    const prompt = `${toolItem.systemPrompt}\n\n${targetText}`;
    generateAndReplace(item, prompt);
    return;
  }

  // ローカル実行のツール
  if (toolItem.source === 'local' && toolItem.function) {
    const result = toolItem.function(targetText);
    window.parent.postMessage({ type: 'insertTool', hasSelection, text: result, preText: targetText }, '*');
    return;
  }

  console.log("未実装のツールです:", toolKey);
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