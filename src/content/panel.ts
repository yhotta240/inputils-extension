import { IframeContent } from "./iframe";
import { insertEmoji, insertText, insertTool, insertUser } from "./input";

const TOP_MARGIN: number = 26; // パネルと入力欄の間のマージン
const BOTTOM_MARGIN: number = 8; // パネルと入力欄の間のマージン
const DEFAULT_PANEL_HEIGHT: number = 84;

export class InputPanel {
  private panel: HTMLDivElement | null = null;
  private iframeContent: IframeContent;
  private input: HTMLElement | null = null;
  private isClickingPanel: boolean = false;

  constructor() {
    this.iframeContent = new IframeContent();
    this.addEventListeners();
  }

  /** パネルとやり取りしているかどうかを返す */
  public isInteractingWithPanel(): boolean {
    return this.isClickingPanel;
  }

  /** iframeContent インスタンスを取得 */
  public getIframe(): IframeContent {
    return this.iframeContent;
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
    this.iframeContent.setPanel(this.panel); // パネルを iframeContent に渡す
    const iframe = await this.iframeContent.create();
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

    const inputRect = input.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // left が画面外に出ないように調整
    const left = Math.min(inputRect.left, viewportWidth - Math.min(inputRect.width, 600) - 5);

    let top = this.calculatedTop(inputRect, DEFAULT_PANEL_HEIGHT);

    // 最終位置の適用
    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
    this.panel.style.width = `${Math.min(inputRect.width, 600)}px`;
    this.panel.style.backgroundColor = '#18181b';
  }

  private createFloatingPanel(input: HTMLElement): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'inputils-floating-panel';
    const inputRect = input.getBoundingClientRect();

    let top = this.calculatedTop(inputRect, DEFAULT_PANEL_HEIGHT);

    // スタイル設定
    Object.assign(panel.style, {
      position: "fixed",
      top: `${top}px`,
      left: `${inputRect.left}px`,
      width: `${Math.min(inputRect.width, 600)}px`,
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
      } else if (dataType === 'closePanel') {
        this.hide();
      } else if (dataType === 'frameMouseDown') {
        this.isClickingPanel = true;
      } else if (dataType === 'frameMouseUp') {
        this.isClickingPanel = false;
      } else if (dataType === 'expandPanel' && this.input) {
        // パネルが入力欄の下にあるか判定
        const inputRect = this.input.getBoundingClientRect();
        const isBelowInput = this.iframeContent.isPanelBelowInput(inputRect.bottom);
        // パネルを展開
        this.iframeContent.toggleExpandCollapse(true, isBelowInput);
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