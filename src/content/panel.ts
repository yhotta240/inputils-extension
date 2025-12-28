import { IframeContent } from "./iframe";
import { insertText, insertTool, insertEmoji, insertUser, insertHistory } from "./input";

const TOP_MARGIN: number = 26; // パネルと入力欄の間のマージン
const BOTTOM_MARGIN: number = 8; // パネルと入力欄の間のマージン
const DEFAULT_PANEL_HEIGHT: number = 84;

export class InputPanel {
  private panel: HTMLDivElement | null = null;
  private iframe: IframeContent;
  private input: HTMLElement | null = null;
  private isClickingPanel: boolean = false;

  constructor() {
    this.iframe = new IframeContent();
    this.addEventListeners();
  }

  /** パネルとやり取りしているかどうかを返す */
  public isInteractingWithPanel(): boolean {
    return this.isClickingPanel;
  }

  /** iframe インスタンスを取得 */
  public getIframe(): IframeContent {
    return this.iframe;
  }

  /** パネルを表示 */
  public async show(input: HTMLElement): Promise<void> {
    this.input = input;

    if (this.panel) {
      this.panel.style.display = 'flex';
      this.updatePosition(input);
      return;
    }

    this.panel = this.createFloatingPanel(input);
    this.iframe.setPanel(this.panel); // パネルを iframe に渡す
    const iframe = await this.iframe.create();
    this.panel.appendChild(iframe);

    document.body.appendChild(this.panel);
  }

  /** パネルを非表示 */
  public hide(): void {
    if (this.panel && !this.isInteractingWithPanel()) {
      this.panel.style.display = 'none';
    }
  }

  /** パネルの HTMLElement を取得 */
  public getPanel(): HTMLDivElement | null {
    return this.panel;
  }

  private updatePosition(input: HTMLElement): void {
    if (!this.panel) return;

    const inputRect: DOMRect = input.getBoundingClientRect();
    const panelRect: DOMRect = this.panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    const isIframeExpanded = this.iframe.isExpandedState();
    const panelHeight = isIframeExpanded ? this.iframe.getExpandedHeight() : DEFAULT_PANEL_HEIGHT;

    const top: number = this.calculatedTop(inputRect, panelHeight);
    const left: number = Math.min(inputRect.left, viewportWidth - panelRect.width - 10);
    const width: number = Math.min(inputRect.width, 600);

    // 最終位置の適用
    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
    this.panel.style.width = `${width}px`;
    this.panel.style.backgroundColor = '#030303ff';
  }

  private createFloatingPanel(input: HTMLElement): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'inputils-floating-panel';

    const inputRect: DOMRect = input.getBoundingClientRect();

    const top: number = this.calculatedTop(inputRect, DEFAULT_PANEL_HEIGHT);
    const width: number = Math.min(inputRect.width, 600);

    // スタイル設定
    Object.assign(panel.style, {
      position: "fixed",
      top: `${top}px`,
      left: `${inputRect.left}px`,
      width: `${width}px`,
      minWidth: '380px',
      height: 'fit-content',
      backgroundColor: '#18181b',
      borderRadius: '12px',
      zIndex: '100000',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
    });

    return panel;
  }

  private calculatedTop(inputRect: DOMRect, panelHeight: number): number {
    // 入力欄の上下のスペースを計算
    const spaceAbove = inputRect.top;
    const spaceBelow = window.innerHeight - inputRect.bottom;

    let top: number = 0;

    if (spaceAbove > spaceBelow) {
      top = spaceAbove - panelHeight - TOP_MARGIN;
    } else {
      top = inputRect.bottom + BOTTOM_MARGIN;
    }

    return top;
  }

  private addEventListeners(): void {
    // iframeからのメッセージを受信
    window.addEventListener('message', (event: MessageEvent<any>) => {
      const eventData = event.data;
      const dataType: string = eventData.type;

      if (dataType === 'insertText' && this.input) {
        insertText(this.input, eventData.text);
        this.hide();
      } else if (dataType === 'insertTool' && this.input) {
        insertTool(this.input, eventData.text, eventData.hasSelection);
        this.hide();
      } else if (dataType === 'insertEmoji' && this.input) {
        insertEmoji(this.input, eventData.emoji);
      } else if (dataType === 'insertUser' && this.input) {
        insertUser(this.input, eventData.user);
      } else if (dataType === 'insertHistory' && this.input) {
        insertHistory(this.input, eventData.history);
        this.hide();
      } else if (dataType === 'closePanel') {
        this.hide();
      } else if (dataType === 'frameMouseDown') {
        this.isClickingPanel = true;
      } else if (dataType === 'frameMouseUp') {
        this.isClickingPanel = false;
      } else if (dataType === 'expandPanel' && this.input) {
        // パネルが入力欄の下にあるか判定
        const inputRect = this.input.getBoundingClientRect();
        const isBelowInput = this.iframe.isPanelBelowInput(inputRect.bottom);
        // パネルを展開
        this.iframe.toggleExpandCollapse(true, isBelowInput);
      }
    });

    // パネル内のクリックを検知（iframe外の部分）
    document.addEventListener('mousedown', (event) => {
      if (this.panel && this.panel.contains(event.target as Node)) {
        this.isClickingPanel = true;
      }
    });

    document.addEventListener('mouseup', () => {
      this.isClickingPanel = false;
    });

    window.addEventListener('resize', () => {
      if (this.input) {
        this.updatePosition(this.input);
      }
    });
  }
}