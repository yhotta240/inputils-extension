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

    document.addEventListener("input", (event) => {
      this.setInputElement(event.target)
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

    if (text.length > 0) {
      if (text.startsWith("/")) {
        this.inputPanel.show(targetElement);
      } else if (text.includes("/")) {
        this.inputPanel.show(targetElement);
        const panel = this.inputPanel.getPanel();
        let panelTop = panel?.style.top;
        if (!panel || !panelTop) return;
        const topValue = parseFloat(panelTop);

        // パネルが画面外に出ている場合のみ位置を調整
        if (topValue >= window.innerHeight) {
          panel.style.top = "10px";
        }
      }
    } else {
      this.inputPanel.hide();
    }
  };
}

new ContentScript();