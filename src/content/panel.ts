import { IframeContent } from "./iframe";
import { insertText } from "./input";

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

  /** パネルを表示 */
  public async show(input: HTMLElement): Promise<void> {
    this.input = input;

    if (this.panel) {
      this.updatePosition(input);
      this.panel.style.display = 'flex';
      return;
    }

    this.panel = this.createFloatingPanel(input);
    const iframe = await this.iframeContent.create();
    this.panel.appendChild(iframe);

    document.body.appendChild(this.panel);
  }

  /** パネルを非表示 */
  public hide(): void {
    if (this.panel) {
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
    const top = inputRect.top - 120 > 0 ? inputRect.top - 120 : inputRect.bottom + 8;
    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${inputRect.left}px`;
    this.panel.style.width = `${Math.min(inputRect.width, 600)}px`;
    this.panel.style.maxWidth = '90vw';
    this.panel.style.backgroundColor = '#18181b';
  }

  private createFloatingPanel(input: HTMLElement): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'inputils-floating-panel';
    const inputRect = input.getBoundingClientRect();
    const top = inputRect.top - 120 > 0 ? inputRect.top - 120 : inputRect.bottom + 8;
    // スタイル設定 - 入力欄の上部に配置
    Object.assign(panel.style, {
      position: "fixed",
      top: `${top}px`, // 入力欄の上に配置（パネル高さ + マージン）
      left: `${inputRect.left}px`,
      width: `${Math.min(inputRect.width, 600)}px`, // 入力欄の幅に合わせる（最大600px）
      maxWidth: '90vw',
      height: 'fit-content', // 高さは内容に合わせて自動調整
      backgroundColor: '#18181b',
      borderRadius: '12px',
      zIndex: '100000',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
    });

    return panel;
  }

  private addEventListeners(): void {
    // iframeからのメッセージを受信
    window.addEventListener('message', (event) => {
      if (event.data.type === 'insertText' && this.input) {
        insertText(this.input, event.data.text);
        this.hide();
      } else if (event.data.type === 'closePanel') {
        this.hide();
      } else if (event.data.type === 'frameMouseDown') {
        this.isClickingPanel = true;
      } else if (event.data.type === 'frameMouseUp') {
        this.isClickingPanel = false;
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
  }
}