/** テキストを改行を含めて取得 */
export function getTextWithNewlines(root: HTMLElement): string {
  let result = '';
  let isFirstLine = true;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? '';
      isFirstLine = false;
    } else if (
      (node.nodeName === 'DIV' || node.nodeName === 'P') &&
      !isFirstLine
    ) {
      result += '\n';
    } else if (node.nodeName === 'BR') {
      result += '\n';
      isFirstLine = false;
    }
  }

  return result;
}

/**
 * キャレット情報を計算する
 * @param targetElement HTMLElement
 * @param selection Selection オブジェクト
 * @param text テキスト（省略時は空文字列として扱う）
 * @return 行番号，列番号，選択範囲の長さ，文字数を含むオブジェクト
 **/
export function computeCaretInfo(targetElement: HTMLElement, selection: Selection | null, text?: string) {
  const charCount = (text ?? '').trim().length;
  const selectionLength = selection ? selection.toString().length : 0;

  let lineNumber = 0;
  let columnNumber = 0;

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    const fullRange = document.createRange();
    fullRange.selectNodeContents(targetElement);
    fullRange.setEnd(range.startContainer, range.startOffset);

    const beforeText = getTextWithNewlines(fullRange.cloneContents() as unknown as HTMLElement);

    lineNumber = beforeText.split('\n').length;

    const lastNewLineIndex = beforeText.lastIndexOf('\n');
    columnNumber = lastNewLineIndex === -1
      ? beforeText.length
      : beforeText.length - lastNewLineIndex - 1;
  }

  return { lineNumber, columnNumber, selectionLength, charCount };
}
