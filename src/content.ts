import { InputPanel } from "./content/panel";
import { getContentEditableParent, getFocusedEditableElement, getInputElement, getInputElementText, isContentEditableElement, isContentEditableTrue, isInputElement } from "./content/input";

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

    // 重複発火防止
    if (text === this.lastProcessedText) {
      this.lastProcessedText = "";
      return;
    }
    this.lastProcessedText = text;

    if (text.length > 0) {
      if (text.startsWith("/")) {
        // テンプレートコマンドが入力されたとき
        const searchQuery = text.substring(1); // "/"以降の文字列を取得
        this.inputPanel.getIframe().activeTemplatesTab();
        this.inputPanel.getIframe().filterTemplates(searchQuery);
        this.inputPanel.show(targetElement);
      } else if (selection && selection.toString().length > 0) {
        //input要素内でテキストが選択されたとき
        const selectedText = selection.toString();
        this.inputPanel.getIframe().activeToolsTab();
        this.inputPanel.show(targetElement);
        this.inputPanel.getIframe().setSelectedText(selectedText);
      } else if (text.startsWith(':') || text.includes(':')) {
        // 絵文字コマンドが入力されたとき
        const emojiQuery = () => {
          if (text.startsWith(':')) {
            return text.substring(1);
          } else {
            const lastColonIndex = text.lastIndexOf(':');
            return text.substring(lastColonIndex + 1);
          }
        };
        this.inputPanel.getIframe().activeEmojisTab();
        this.inputPanel.getIframe().filterEmojis(emojiQuery());
        this.inputPanel.show(targetElement);
      } else {
        this.inputPanel.hide();
      }
    } else {
      this.inputPanel.hide();
    }
  };
}

new ContentScript();