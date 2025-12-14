import { InputPanel } from "./content/panel";
import { getContentEditableParent, getFocusedEditableElement, getInputElement, getInputElementText, isContentEditableElement, isContentEditableTrue, isInputElement } from "./content/input";
import { getCommandQuery } from "./content/commands";

class ContentScript {
  private inputPanel: InputPanel;
  private lastProcessedText: string = '';

  constructor() {
    this.inputPanel = new InputPanel();

    // 選択範囲の変更を検知
    document.addEventListener("selectionchange", () => {
      if (isInputElement(document.activeElement as HTMLElement)) {
        this.setInputElement(document.activeElement);
      } else {
        this.inputPanel.hide(); // 入力要素でなければパネルを非表示
      }
    });

    // 入力内容の変更を検知（文字削除・追加時）
    document.addEventListener("input", (e) => {
      if (e.target && isInputElement(e.target as HTMLElement)) {
        this.setInputElement(e.target);
      }
    }, true); // キャプチャフェーズで検知
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
          this.handleInputChange(editableParent);
        }
      } else {
        // フォーカスされている要素が編集可能な要素であれば処理を進める
        this.handleInputChange(focusedElement);
      }
    } else {
      this.handleInputChange(inputElement);
    }
  }

  /** 入力内容の変更を処理 */
  private handleInputChange(targetElement: HTMLElement) {
    const text = getInputElementText(targetElement);
    const selection = window.getSelection();
    const panelIframe = this.inputPanel.getIframe();

    // 重複発火防止
    if (text === this.lastProcessedText) {
      this.lastProcessedText = "";
      return;
    }
    this.lastProcessedText = text;

    const templateQuery = getCommandQuery(text, "templates");
    const emojiQuery = getCommandQuery(text, "emojis");
    const userQuery = getCommandQuery(text, "users");

    if (templateQuery !== null) {
      panelIframe.activeTemplatesTab();
      panelIframe.filterTemplates(templateQuery);
    } else if (selection && selection.toString().length > 0) {
      const selectedText = selection.toString();
      panelIframe.activeToolsTab();
      panelIframe.setSelectedText(selectedText);
    } else if (emojiQuery !== null) {
      panelIframe.activeEmojisTab();
      panelIframe.filterEmojis(emojiQuery);
    } else if (userQuery !== null) {
      panelIframe.activeUsersTab();
      panelIframe.filterUsers(userQuery);
    } else {
      this.inputPanel.hide();
      return;
    }

    this.inputPanel.show(targetElement);
  }
}

new ContentScript();