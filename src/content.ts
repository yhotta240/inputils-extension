import { InputPanel } from "./content/panel";
import { getContentEditableParent, getFocusedEditableElement, getInputElement, getInputElementText, isContentEditableElement, isContentEditableTrue, isInputElement } from "./content/input";
import { getCommandInfo } from "./content/utils/commands";
import { computeCaretInfo } from "./content/utils/text";

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

    const templates = getCommandInfo(text, "templates");
    const tools = getCommandInfo(text, "tools");
    const emojis = getCommandInfo(text, "emojis");
    const users = getCommandInfo(text, "users");

    if (templates.matches && templates.isLastMatched) {
      panelIframe.activeTemplatesTab();
      panelIframe.filterTemplates(templates.query);
    } else if (selection && selection.toString().length > 0 || (tools.matches && tools.isLastMatched)) {
      const selectedText = selection && selection.toString().length > 0 ? selection.toString() : "";
      panelIframe.activeToolsTab();
      if (tools.matches && tools.isLastMatched) {
        panelIframe.filterTools(tools.query);
      } else {
        panelIframe.setSelectedText(selectedText);
      }
    } else if (emojis.matches && emojis.isLastMatched) {
      panelIframe.activeEmojisTab();
      panelIframe.filterEmojis(emojis.query);
    } else if (users.matches && users.isLastMatched) {
      panelIframe.activeUsersTab();
      panelIframe.filterUsers(users.query);
    } else {
      this.inputPanel.hide();
      return;
    }

    this.inputPanel.show(targetElement);

    const info = computeCaretInfo(targetElement, selection, text);

    // 追加情報を iframe に送信
    panelIframe.changeExtraContent(info.charCount, info.selectionLength, info.lineNumber, info.columnNumber);
  }
}

new ContentScript();