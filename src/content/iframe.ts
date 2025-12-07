export class IframeContent {
  private iframeDoc: Document | null | undefined = null;
  private panel: HTMLDivElement | null = null;
  private preIframeHeight: number = 0;

  constructor() { }

  public async create(): Promise<HTMLIFrameElement> {
    let htmlText = '';

    const iframe = document.createElement('iframe');
    iframe.id = 'inputils-iframe-content';
    iframe.style.cssText = `
      width: 100%;
      height: 80px;
      border: none;
      visibility: hidden;
      transition: height 0.3s ease;
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

  private addEventListeners(): void {
    if (!this.iframeDoc) return;

    // 各種ボタン要素の取得
    const iframe = this.iframeDoc!.defaultView!.frameElement as HTMLIFrameElement;
    const btnArrows = this.iframeDoc.querySelectorAll<HTMLElement>('.btn-arrow');
    const btnContainers = this.iframeDoc.querySelectorAll<HTMLElement>('.btn-container');
    const closeBtn = this.iframeDoc.querySelector<HTMLElement>('#panel-close-icon');
    const expandBtn = this.iframeDoc.querySelector<HTMLElement>('#panel-expand-icon');
    const collapseBtn = this.iframeDoc.querySelector<HTMLElement>('#panel-collapse-icon');

    // 定型文・スニペットのクリックイベント
    this.iframeDoc.querySelectorAll('.template-item').forEach(item => {
      item.addEventListener('click', () => {
        const text = item.getAttribute('data-text') || '';

        window.parent.postMessage({ type: 'insertText', text: text }, '*');
      });
    });

    // パネル内のマウスイベントを親に通知
    this.iframeDoc.addEventListener('mousedown', () => window.parent.postMessage({ type: 'frameMouseDown' }, '*'));
    this.iframeDoc.addEventListener('mouseup', () => window.parent.postMessage({ type: 'frameMouseUp' }, '*'));

    // パネル閉じるボタンのクリックイベント
    if (closeBtn) {
      closeBtn.addEventListener('click', () => window.parent.postMessage({ type: 'closePanel' }, '*'));
    }

    // パネル展開・折りたたみボタンのクリックイベント
    if (expandBtn && collapseBtn && this.panel) {
      expandBtn.addEventListener('click', () => {
        expandBtn.classList.add('d-none');
        collapseBtn.classList.remove('d-none');
        btnArrows.forEach(btn => btn.classList.add('d-none'));
        btnContainers.forEach(container => container.classList.remove('d-flex'));

        this.preIframeHeight = iframe.clientHeight; // 現在の高さを保存 84px
        iframe.style.height = `${400}px`; // 展開後の高さ 400px
        const panelTop = this.panel!.style.top; // 現在の top 値を取得
        this.panel!.style.top = parseInt(panelTop) - (400 - this.preIframeHeight) + 'px'; // top を調整
      });

      collapseBtn.addEventListener('click', () => {
        collapseBtn.classList.add('d-none');
        expandBtn.classList.remove('d-none');
        btnArrows.forEach(btn => btn.classList.remove('d-none'));
        btnContainers.forEach(container => container.classList.add('d-flex'));

        iframe.style.height = `${this.preIframeHeight}px`; // 折りたたみ後の高さに戻す
        const panelTop = this.panel!.style.top; // 現在の top 値を取得
        this.panel!.style.top = parseInt(panelTop) + (400 - this.preIframeHeight) + 'px'; // top を調整
        this.preIframeHeight = 0;
      });
    }
  }

  /** パネル要素を設定するメソッドを追加 */
  public setPanel(panel: HTMLDivElement): void {
    this.panel = panel;
  }
}
