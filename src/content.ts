import { InputPanel } from "./content/panel";
import { getContentEditableParent, getFocusedEditableElement, getInputElement, getInputElementText, isContentEditableElement, isContentEditableTrue, isInputElement } from "./content/input";

class ContentScript {
  private inputPanel: InputPanel;

  constructor() {
    this.inputPanel = new InputPanel();

    document.addEventListener("selectionchange", () => {
      if (isInputElement(document.activeElement as HTMLElement)) {
        this.setInputElement(document.activeElement);
      } else {
        this.inputPanel.hide(); // 入力要素でなければパネルを非表示
      }
    });
  }

  /** 初期化処理 */
  private setInputElement(targetElement: EventTarget | null): void {
    if (!(targetElement instanceof HTMLElement)) return;

    const inputElement = getInputElement(targetElement);
    const isEditableElement = isContentEditableElement(targetElement);

    // 入力元が存在しない場合は何もしない
    if (!inputElement) return;

    if (isEditableElement) {
      const focusedElement = getFocusedEditableElement();
      if (!focusedElement) return;

      // contentEditable=true でない場合は親要素を探す
      if (!isContentEditableTrue(focusedElement)) {
        const editableParent = getContentEditableParent(focusedElement);
        if (editableParent && isContentEditableTrue(editableParent)) {
          this.handleSelectionChange(editableParent);
        }
      } else {
        // フォーカスされている要素が編集可能な要素であれば処理を進める
        this.handleSelectionChange(focusedElement);
      }
    } else {
      this.handleSelectionChange(inputElement);
    }
  }

  /** 選択範囲が変更されたときの処理 */
  private handleSelectionChange(targetElement: HTMLElement) {
    const text = getInputElementText(targetElement);
    const selection = window.getSelection();

    if (text.length > 0) {
      if (text.startsWith("/")) {
        this.inputPanel.getIframe().activeTemplatesTab();
        this.inputPanel.show(targetElement);
      } else if (selection && selection.toString().length > 0) {
        //input要素内でテキストが選択されたとき
        const selectedText = selection.toString();
        this.inputPanel.getIframe().activeToolsTab();
        this.inputPanel.show(targetElement);
        this.inputPanel.getIframe().setSelectedText(selectedText);
      } else {
        this.inputPanel.hide();
      }
    } else {
      this.inputPanel.hide();
    }
  };
}

new ContentScript();