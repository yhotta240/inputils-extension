import { IframeContent } from "./iframe";
import { insertText } from "./input";

const TOP_MARGIN: number = 26; // パネルと入力欄の間のマージン
const BOTTOM_MARGIN: number = 8; // パネルと入力欄の間のマージン

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

    const panelHeight = this.panel.offsetHeight > 0 ? this.panel.offsetHeight : 84;
    const inputRect = input.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // 入力欄の上下のスペースを計算
    const spaceAbove = inputRect.top;
    const spaceBelow = viewportHeight - inputRect.bottom;

    let calculatedTop = 0;
    let shouldPlaceAbove = false;

    // 上に十分なスペースがあるか確認
    if (spaceAbove >= panelHeight + TOP_MARGIN) {
      // 上に配置
      calculatedTop = inputRect.top - panelHeight - TOP_MARGIN;
      shouldPlaceAbove = true;
    } else if (spaceBelow >= panelHeight + BOTTOM_MARGIN) {
      // 下に配置
      calculatedTop = inputRect.bottom + BOTTOM_MARGIN;
      shouldPlaceAbove = false;
    } else {
      // どちらにも収まらない場合は広い方に配置
      if (spaceAbove > spaceBelow) {
        // 上に配置（高さを調整）
        calculatedTop = TOP_MARGIN;
        shouldPlaceAbove = true;
      } else {
        // 下に配置
        calculatedTop = inputRect.bottom + BOTTOM_MARGIN;
        shouldPlaceAbove = false;
      }
    }

    this.panel.style.top = `${calculatedTop}px`;
    this.panel.style.left = `${inputRect.left}px`;
    this.panel.style.width = `${Math.min(inputRect.width, 600)}px`;
    this.panel.style.maxWidth = '90vw';
    this.panel.style.backgroundColor = '#18181b';
  }

  private createFloatingPanel(input: HTMLElement): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'inputils-floating-panel';
    const inputRect = input.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // 初期パネル高さを仮定（iframe の初期高さ + padding）
    const estimatedPanelHeight = 84;
    const spaceAbove = inputRect.top;
    const spaceBelow = viewportHeight - inputRect.bottom;

    // 上下どちらに配置するか判断
    let top = 0;
    if (spaceAbove >= estimatedPanelHeight + TOP_MARGIN) {
      // 上に配置
      top = inputRect.top - estimatedPanelHeight - TOP_MARGIN;
    } else if (spaceBelow >= estimatedPanelHeight + BOTTOM_MARGIN) {
      // 下に配置
      top = inputRect.bottom + BOTTOM_MARGIN;
    } else {
      // 広い方に配置
      top = spaceAbove > spaceBelow
        ? TOP_MARGIN
        : inputRect.bottom + BOTTOM_MARGIN;
    }

    // スタイル設定
    Object.assign(panel.style, {
      position: "fixed",
      top: `${top}px`,
      left: `${inputRect.left}px`,
      width: `${Math.min(inputRect.width, 600)}px`,
      maxWidth: '90vw',
      height: 'fit-content',
      backgroundColor: '#18181b',
      borderRadius: '12px',
      zIndex: '100000',
      overflow: 'hidden',
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
      } else if (event.data.type === 'expandPanel' && this.input) {
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