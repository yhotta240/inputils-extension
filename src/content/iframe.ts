const DEFAULT_EXPANDED_HEIGHT: number = 400;

export class IframeContent {
  private iframeDoc: Document | null | undefined = null;
  private panel: HTMLDivElement | null = null;
  private preIframeHeight: number = 0;
  private expandedHeight: number = 0; // 展開時の実際の高さ
  private isCollapsed: boolean = false; // 折りたたみ状態
  private wasBelowInput: boolean = false; // 展開時にパネルが入力欄の下にあったか

  constructor() { }

  public async create(): Promise<HTMLIFrameElement> {
    let htmlText = '';

    const iframe = document.createElement('iframe');
    iframe.id = 'inputils-iframe-content';
    iframe.style.cssText = `
      width: 100%;
      height: 84px;
      border: none;
      visibility: hidden;
    `;

    // iframe.html を取得して Blob URL として返す
    try {
      const htmlURL = chrome.runtime.getURL('iframe.html');
      const res = await fetch(htmlURL);
      htmlText = await res.text();

      // srcdoc より互換性の高い Blob URL を使用
      const blob = new Blob([htmlText], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      iframe.src = blobUrl;

      // iframe のロード完了で UI 初期化
      this.setupIframeOnLoad(iframe);

      iframe.addEventListener('load', () => {
        this.iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!this.iframeDoc) return;
        this.addEventListeners();

        const finalize = () => {
          const height = this.iframeDoc!.body.scrollHeight;
          iframe.style.height = `${Math.min(height, 85)}px`;
          iframe.style.visibility = 'visible';
        };

        requestAnimationFrame(() => {
          setTimeout(() => {
            finalize();
            URL.revokeObjectURL(blobUrl);
          }, 160);
        });
      },
        { once: true }
      );
    } catch (error) {
      console.log("Error fetching iframe.html:", error);
    }

    return iframe;
  }

  private setupIframeOnLoad(iframe: HTMLIFrameElement): void {
    // 要素作成ヘルパー（CSS/JS リソース）
    const makeLink = (href: string) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      return l;
    };
    const makeScript = (src: string) => {
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      return s;
    };

    const bootstrapLink = makeLink(chrome.runtime.getURL('bootstrap.css'));
    const bootstrapScript = makeScript(chrome.runtime.getURL('bootstrap.js'));
    const bootstrapIconsLink = makeLink(chrome.runtime.getURL('bootstrap-icons.css'));

    // iframe 内にスタイルとスクリプトを注入
    iframe.addEventListener('load', () => {
      if (!iframe.contentDocument) return;
      const head = iframe.contentDocument.head;
      const body = iframe.contentDocument.body;
      head.appendChild(bootstrapLink);
      head.appendChild(bootstrapIconsLink);
      body.appendChild(bootstrapScript);
    }, { once: true });
  }

  /** パネル要素を設定するメソッドを追加 */
  public setPanel(panel: HTMLDivElement): void {
    this.panel = panel;
  }

  /** パネルが折りたたみ状態かどうかを返す */
  public isCollapsedState(): boolean {
    return this.isCollapsed;
  }

  /** パネルが入力欄の下にあるかどうかを判定 */
  public isPanelBelowInput(inputBottom: number): boolean {
    if (!this.panel) return false;
    const panelTop = parseInt(this.panel.style.top);
    return panelTop >= inputBottom;
  }

  private addEventListeners(): void {
    if (!this.iframeDoc) return;

    this.setupTemplateItemListeners();
    this.setupMouseEventListeners();
    this.setupPanelControlListeners();
    this.setupArrowScrollListeners();
  }

  /** 定型文アイテムのクリックイベントを設定 */
  private setupTemplateItemListeners(): void {
    const templateItems = this.iframeDoc!.querySelectorAll<HTMLElement>('.template-item');

    templateItems.forEach(item => {
      item.addEventListener('click', () => {
        const text = item.getAttribute('data-text') || '';
        window.parent.postMessage({ type: 'insertText', text: text }, '*');
      });
    });
  }

  /** マウスイベントのリスナーを設定 */
  private setupMouseEventListeners(): void {
    this.iframeDoc!.addEventListener('mousedown', () => {
      window.parent.postMessage({ type: 'frameMouseDown' }, '*');
    });

    this.iframeDoc!.addEventListener('mouseup', () => {
      window.parent.postMessage({ type: 'frameMouseUp' }, '*');
    });
  }

  /** パネル制御ボタン（閉じる・展開・折りたたみ）のイベントを設定 */
  private setupPanelControlListeners(): void {
    const closeBtn = this.iframeDoc!.querySelector<HTMLElement>('#panel-close-icon');
    const expandBtn = this.iframeDoc!.querySelector<HTMLElement>('#panel-expand-icon');
    const collapseBtn = this.iframeDoc!.querySelector<HTMLElement>('#panel-collapse-icon');

    // 閉じるボタン
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.parent.postMessage({ type: 'closePanel' }, '*');
      });
    }

    // 展開・折りたたみボタン
    if (expandBtn && collapseBtn) {
      expandBtn.addEventListener('click', () => {
        // パネル位置は親ウィンドウから渡される
        window.parent.postMessage({ type: 'expandPanel' }, '*');
      });

      collapseBtn.addEventListener('click', () => {
        this.toggleExpandCollapse(false);
      });
    }
  }

  /** パネルの展開・折りたたみを切り替え */
  public toggleExpandCollapse(expand: boolean, isBelowInput: boolean = false): void {
    if (!this.iframeDoc || !this.panel) return;

    const iframe = this.iframeDoc.defaultView!.frameElement as HTMLIFrameElement;
    const expandBtn = this.iframeDoc.querySelector<HTMLElement>('#panel-expand-icon');
    const collapseBtn = this.iframeDoc.querySelector<HTMLElement>('#panel-collapse-icon');
    const btnArrows = this.iframeDoc.querySelectorAll<HTMLElement>('.btn-arrow');
    const btnContainers = this.iframeDoc.querySelectorAll<HTMLElement>('.btn-container');

    if (!expandBtn || !collapseBtn) return;

    // UI状態の切り替え
    if (expand) {
      expandBtn.classList.add('d-none');
      collapseBtn.classList.remove('d-none');
      btnArrows.forEach(btn => btn.classList.add('d-none'));
      btnContainers.forEach(container => container.classList.remove('d-flex'));
    } else {
      collapseBtn.classList.add('d-none');
      expandBtn.classList.remove('d-none');
      btnArrows.forEach(btn => btn.classList.remove('d-none'));
      btnContainers.forEach(container => container.classList.add('d-flex'));
    }

    // サイズと位置の更新
    if (expand) {
      this.expandPanel(iframe, isBelowInput);
    } else {
      this.collapsePanel(iframe);
    }
  }

  /** パネルを展開 */
  private expandPanel(iframe: HTMLIFrameElement, isBelowInput: boolean): void {
    this.preIframeHeight = iframe.clientHeight;
    const currentTop = parseInt(this.panel!.style.top);
    let height = DEFAULT_EXPANDED_HEIGHT;
    let top = currentTop;

    if (isBelowInput) {
      // 下配置: topを固定、画面下端までの高さを制限
      const availableHeight = window.innerHeight - currentTop - 20;
      height = Math.min(DEFAULT_EXPANDED_HEIGHT, availableHeight);
    } else {
      // 上配置: 下端を固定して上に伸ばす
      const minTopMargin = 26;
      const heightDiff = height - this.preIframeHeight;
      top = currentTop - heightDiff;

      if (top < minTopMargin) {
        height -= (minTopMargin - top);
        top = minTopMargin;
      }
    }

    iframe.style.height = `${height}px`;
    this.panel!.style.top = `${top}px`;
    this.expandedHeight = height;
    this.wasBelowInput = isBelowInput;
    this.isCollapsed = false;
  }

  /** パネルを折りたたみ */
  private collapsePanel(iframe: HTMLIFrameElement): void {
    iframe.style.height = `${this.preIframeHeight}px`;

    // 上配置の場合のみtopを調整
    if (!this.wasBelowInput) {
      const currentTop = parseInt(this.panel!.style.top);
      this.panel!.style.top = `${currentTop + (this.expandedHeight - this.preIframeHeight)}px`;
    }

    this.preIframeHeight = 0;
    this.expandedHeight = 0;
    this.wasBelowInput = false;
    this.isCollapsed = true;
  }

  /** 矢印ボタンのスクロールイベントを設定 */
  private setupArrowScrollListeners(): void {
    this.setupArrowScroll('templates-left-arrow', 'templates-right-arrow');
    this.setupArrowScroll('history-left-arrow', 'history-right-arrow');
  }

  /** 矢印ボタンでコンテナをスクロールする機能を設定 */
  private setupArrowScroll(leftArrowId: string, rightArrowId: string, containerId?: string): void {
    const leftArrow = this.iframeDoc!.querySelector<HTMLElement>(`#${leftArrowId}`);
    const rightArrow = this.iframeDoc!.querySelector<HTMLElement>(`#${rightArrowId}`);

    if (!leftArrow || !rightArrow) return;

    // コンテナを取得
    let container: HTMLElement | null = null;
    if (containerId) {
      container = this.iframeDoc!.querySelector<HTMLElement>(`#${containerId}`);
    } else {
      container = leftArrow.nextElementSibling as HTMLElement;
    }

    if (!container) return;

    leftArrow.addEventListener('click', () => {
      const scrollAmount = this.calculateScrollAmount(container!);
      container!.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    rightArrow.addEventListener('click', () => {
      const scrollAmount = this.calculateScrollAmount(container!);
      container!.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  /** スクロール量を計算 */
  private calculateScrollAmount(container: HTMLElement): number {
    const containerWidth = container.clientWidth;
    const firstButton = container.querySelector<HTMLElement>('.template-item, button');

    if (firstButton) {
      const buttonWidth = firstButton.offsetWidth;
      const gap = 8; // 0.5rem
      const visibleButtons = Math.floor(containerWidth / (buttonWidth + gap));
      return visibleButtons * (buttonWidth + gap);
    }

    // デフォルトはコンテナ幅の80%
    return containerWidth * 0.8;
  }
}
