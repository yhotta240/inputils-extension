/**
 * フォーカスされている入力要素を取得する
 * @param target
 * @returns
 */
export function getInputElement(target: HTMLElement): HTMLElement | null {
  if (isInputElement(target)) {
    return target;
  }
  return null;
}

/**
 * 要素が入力要素かどうかを判定する
 * @param element
 * @returns
 */
export function isInputElement(element: HTMLElement): boolean {
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable;
}

/**
 * 指定された要素がテキスト入力要素かどうかを判定する
 * @param element
 * @returns
 */
export function isTextInputElement(element: HTMLElement): boolean {
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA";
}

/**
 * 指定された要素が `contentEditable` 要素かどうかを判定する
 * @param element
 * @returns
 */
export function isContentEditableElement(element: HTMLElement): boolean {
  return element.isContentEditable;
}

/**
 * 指定された要素の `contentEditable` 属性が `true` かどうかを判定する
 * @param element
 * @returns
 */
export function isContentEditableTrue(element: HTMLElement): boolean {
  return element.contentEditable === "true";
}

/**
 * InputElement からテキストを取得する
 * @param element
 * @returns
 */
export function getInputElementText(element: HTMLElement): string {
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    return (element as HTMLInputElement | HTMLTextAreaElement).value;
  } else if (element.isContentEditable) {
    return element.innerText;
  }
  return "";
}

/** フォーカスされている編集可能な要素を取得する */
export function getFocusedEditableElement(): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;

  const node = selection.anchorNode;

  if (!node) return null;

  // テキストノードの場合，親を辿る
  return node.nodeType === Node.ELEMENT_NODE
    ? node as HTMLElement
    : node.parentElement;
}

/** 指定された要素の contentEditable=true の親要素を取得する */
export function getContentEditableParent(element: HTMLElement): HTMLElement | null {
  while (element && element !== document.body) {
    if (element.contentEditable === "true") return element;
    element = element.parentElement || document.body;
  }
  return null;
}

/**
 * 指定された入力要素にテキストを挿入する
 * @param curInput 入力要素
 * @param text 挿入するテキスト
 */
export function insertText(curInput: HTMLElement, text: string): void {
  const commandChar = '/';
  if (curInput instanceof HTMLTextAreaElement || curInput instanceof HTMLInputElement) {
    insertTextForInput(curInput, text, commandChar);
  } else if (curInput.isContentEditable) {
    inputTextForContentEditable(curInput, text, commandChar);
  }
}

/**
 * 指定された入力要素にツールで変換したテキストを挿入する
 * @param curInput 入力要素
 * @param text 挿入するテキスト
 * @param hasSelection 選択範囲モードかどうか
 */
export function insertTool(curInput: HTMLElement, text: string, hasSelection: boolean): void {
  const commandChar = '>';

  if (curInput instanceof HTMLTextAreaElement || curInput instanceof HTMLInputElement) {
    insertTextForInput(curInput, text, commandChar);
  } else if (curInput.isContentEditable) {
    inputTextForContentEditable(curInput, text, commandChar, !hasSelection); // 選択範囲モードでなければ全置換
  }
}

/** 指定された入力要素に絵文字を挿入する */
export function insertEmoji(curInput: HTMLElement, emoji: string): void {
  const commandChar = ':';

  if (curInput instanceof HTMLTextAreaElement || curInput instanceof HTMLInputElement) {
    insertTextForInput(curInput, emoji, commandChar);
  } else if (curInput.isContentEditable) {
    inputTextForContentEditable(curInput, emoji, commandChar);
  }
}

/** 指定された入力要素にユーザ名を挿入する */
export function insertUser(curInput: HTMLElement, user: string): void {
  const commandChar = '@';

  if (curInput instanceof HTMLTextAreaElement || curInput instanceof HTMLInputElement) {
    insertTextForInput(curInput, user, commandChar);
  } else if (curInput.isContentEditable) {
    inputTextForContentEditable(curInput, user, commandChar);
  }
}

/** 指定された入力要素に履歴テキストを挿入する */
export function insertHistory(curInput: HTMLElement, history: string): void {
  const commandChar = '!';

  if (curInput instanceof HTMLTextAreaElement || curInput instanceof HTMLInputElement) {
    insertTextForInput(curInput, history, commandChar);
  } else if (curInput.isContentEditable) {
    inputTextForContentEditable(curInput, history, commandChar);
  }
}

/** input イベントをラップして発火させ，テキストを挿入する */
function pasteInputEventWrapper(element: HTMLElement, text: string): void {
  element.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  }));
}

/** 指定された要素にクリップボードの内容を貼り付ける */
function pasteClipboardData(element: HTMLElement, text: string): void {
  const clipboardData = new DataTransfer();
  clipboardData.setData("text/plain", text);
  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    clipboardData: clipboardData,
  });
  element.dispatchEvent(pasteEvent);
}

/** `input` と `textarea` にテキストを挿入 */
function insertTextForInput(curInput: HTMLInputElement | HTMLTextAreaElement, text: string, commandChar: string): void {
  const start = curInput.selectionStart || 0;
  const end = curInput.selectionEnd || 0;
  const currentValue = curInput.value;

  // 「/」で始まる場合は「/」を削除してから挿入
  const beforeCursor = currentValue.substring(0, start);
  const lastSlashIndex = beforeCursor.lastIndexOf(commandChar);
  const newStart = lastSlashIndex >= 0 ? lastSlashIndex : start;

  const newValue = currentValue.substring(0, newStart) + text + currentValue.substring(end);
  curInput.value = newValue;

  // カーソル位置を更新
  const newCursorPos = newStart + text.length;
  curInput.setSelectionRange(newCursorPos, newCursorPos);

  // inputイベントを発火
  curInput.dispatchEvent(new Event('input', { bubbles: true }));
  curInput.focus();
}

/** contentEditable 要素にテキストを挿入 */
function inputTextForContentEditable(curInput: HTMLElement, text: string, commandChar: string, isAllReplace?: boolean): void {
  curInput.focus();
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    // Selection が存在しない場合は，カーソル位置を最後に設定してから処理
    backspaceTextForContentEditable(commandChar);
    // クリップボード経由で貼り付け
    pasteClipboardData(curInput, text);
    return;
  }

  // 全置換モードの場合はすべてのテキスト全削除してから挿入
  if (isAllReplace) {
    const range = selection.getRangeAt(0);
    range.selectNodeContents(curInput);
    range.deleteContents();
  }

  try {
    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    const cursorOffset = range.startOffset;

    // カーソル位置より前のテキストを取得してコマンドを探す
    const textToSearch = startContainer.textContent?.substring(0, cursorOffset) || '';
    const commandIndex = textToSearch.trim().lastIndexOf(commandChar);

    if (commandIndex >= 0 && 'deleteData' in startContainer) {
      // コマンドが見つかり，deleteDataメソッドが使える場合（Textノード）
      const textNode = startContainer as Text;
      textNode.deleteData(commandIndex, cursorOffset - commandIndex);

      // 範囲をコマンドがあった位置にセット
      range.setStart(textNode, commandIndex);
      range.collapse(true);
    } else if (commandIndex >= 0) {
      // deleteDataが使えない場合は，Range APIで削除
      const deleteRange = document.createRange();
      deleteRange.setStart(startContainer, commandIndex);
      deleteRange.setEnd(startContainer, cursorOffset);
      deleteRange.deleteContents();

      // 範囲をコマンドがあった位置にセット
      range.setStart(startContainer, commandIndex);
      range.collapse(true);
    } else {
      // コマンドが見つからない場合は全消し
      range.deleteContents();
    }

    // 新しいテキストノードを挿入
    const newTextNode = document.createTextNode(text);
    range.insertNode(newTextNode);

    // カーソルを挿入したテキストの後に移動
    range.setStartAfter(newTextNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    curInput.dispatchEvent(new Event('input', { bubbles: true }));
    curInput.focus();
  } catch (error) {
    console.error('テキスト挿入に失敗:', error);
    // エラーが発生した場合は，クリップボード経由で貼り付け
    pasteClipboardData(curInput, text);
  }
}

/** contentEditable 要素から直前の文字を削除 */
function backspaceTextForContentEditable(targetChar: string): void {
  // 編集 root の取得
  const root = document.querySelector<HTMLElement>(
    '[contenteditable="true"]:not([data-content-editable-leaf])'
  );
  if (!root) return;

  root.focus();

  // root 内のテキストノードを全部取得
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null = null;
  let foundNode: Text | null = null;
  let offset = -1;

  while ((node = walker.nextNode() as Text | null)) {
    const idx = node.data.indexOf(targetChar);
    if (idx !== -1) {
      foundNode = node;
      offset = idx + 1; // ← 削除対象文字「の直後」
      break;
    }
  }

  if (!foundNode) {
    console.log("対象の文字が見つかりません:", targetChar);
    return;
  }

  // カーソルをその文字の直後にセット
  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(foundNode, offset);
  range.collapse(true);

  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);

  // Backspace（人間操作と同じ）
  const ev = new KeyboardEvent("keydown", {
    key: "Backspace",
    code: "Backspace",
    keyCode: 8,
    which: 8,
    bubbles: true,
  });
  foundNode.parentElement?.dispatchEvent(ev);
}

/** 選択範囲を削除 */
export function deleteSelectedText(): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  try {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    return true;
  } catch (error) {
    console.log('選択範囲の削除に失敗:', error);
    return false;
  }
}
