import { filterEmojiItems, setupEmojiItemListeners } from "./features/emojis";
import { filterHistoryItems, setupHistoryItemListeners } from "./features/history";
import { filterTemplateItems, setupTemplateItemListeners } from "./features/templates";
import { filterToolItems, initToolsTab, setupToolItemListeners, updateToolTargetText } from "./features/tools";
import { filterUserItems, setupUserItemListeners } from "./features/users";

const DEFAULT_EXPANDED_HEIGHT: number = 250;

export class IframeContent {
  private iframeDoc: Document | null | undefined = null;
  private panel: HTMLDivElement | null = null;
  private preIframeHeight: number = 0;
  private expandedHeight: number = 0; // 展開時の実際の高さ
  private isExpanded: boolean = false; // 展開状態
  private wasBelowInput: boolean = false; // 展開時にパネルが入力欄の下にあったか
  private targetText: string = '';
  private listenersInitialized: boolean = false;

  constructor() { }

  public async create(): Promise<HTMLIFrameElement> {
    let htmlText = '';

    const iframe = document.createElement('iframe');
    iframe.id = 'inputils-iframe-content';
    iframe.style.cssText = `
      width: 100%;
      height: 84px;
      max-height: ${DEFAULT_EXPANDED_HEIGHT}px;
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

        // タブの初期化とイベントリスナーの追加
        this.initTabs();
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

  // iframe のロード完了時の設定
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
  public isExpandedState(): boolean {
    return this.isExpanded;
  }

  /** パネルが入力欄の下にあるかどうかを判定 */
  public isPanelBelowInput(inputBottom: number): boolean {
    if (!this.panel) return false;
    const panelTop = parseInt(this.panel.style.top);
    return panelTop >= inputBottom;
  }

  /** 選択されたテキストを設定 */
  public setTargetText(text: string): void {
    this.targetText = text;
    if (this.iframeDoc) {
      updateToolTargetText(this.iframeDoc, text);
    }
  }

  /** 定型文タブをアクティブにする */
  public activeTemplatesTab(): void {
    this.activateTab('#templates-tab');
  }

  /** ツールタブをアクティブにする */
  public activeToolsTab(): void {
    this.activateTab('#tools-tab');
  }

  /** 絵文字タブをアクティブにする */
  public activeEmojisTab(): void {
    this.activateTab('#emojis-tab');
  }

  /** ユーザタブをアクティブにする */
  public activeUsersTab(): void {
    this.activateTab('#users-tab');
  }

  /** 履歴タブをアクティブにする */
  public activeHistoryTab(): void {
    this.activateTab('#history-tab');
  }

  /** 任意のタブをアクティブにする（iframeDoc が null の間は自動リトライ） */
  private activateTab(tabId: string): void {
    const interval = setInterval(() => {
      if (!this.iframeDoc) {
        // iframe がまだ読み込まれていない
        return;
      }

      const tab = this.iframeDoc.querySelector<HTMLElement>(tabId);
      if (tab) {
        tab.click();
        // タブクリック後、コンテナの表示/非表示を更新
        const dataBsTarget = tab.getAttribute('data-bs-target');
        this.updateContainerVisibility(dataBsTarget || '');
        clearInterval(interval);
      }
    }, 100);
  }

  /** 定型文を検索してフィルタリング */
  public filterTemplates(query: string): void {
    filterTemplateItems(this.iframeDoc!, query);
  }

  /** ツールを検索してフィルタリング */
  public filterTools(query: string): void {
    // 遅延実行で iframeDoc の準備を待つ
    filterToolItems(this.iframeDoc!, query);
  }

  /** 絵文字を検索してフィルタリング */
  public filterEmojis(query: string): void {
    filterEmojiItems(this.iframeDoc!, query);
  }

  /** ユーザを検索してフィルタリング */
  public filterUsers(query: string): void {
    // 遅延実行で iframeDoc の準備を待つ
    filterUserItems(this.iframeDoc!, query);
  }

  /** 履歴を検索してフィルタリング */
  public filterHistory(query: string): void {
    // 履歴アイテムのフィルタリング処理をここに実装
    filterHistoryItems(this.iframeDoc!, query);
  }

  /** タブの初期化 */
  private initTabs(): void {
    if (!this.iframeDoc) return;
    initToolsTab(this.iframeDoc);
  }

  /** 各種イベントリスナーの追加 */
  private addEventListeners(): void {
    if (!this.iframeDoc || this.listenersInitialized) return;

    setupTemplateItemListeners(this.iframeDoc);
    setupToolItemListeners(this.iframeDoc, () => this.targetText);
    setupEmojiItemListeners(this.iframeDoc);
    setupUserItemListeners(this.iframeDoc);
    setupHistoryItemListeners(this.iframeDoc);
    this.setupMouseEventListeners();
    this.setupPanelControlListeners();
    this.setupArrowScrollListeners();
    this.resizeIframeHeightListeners();
    this.setupNameContainerListener();

    this.listenersInitialized = true;
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
    expandBtn.classList.toggle('d-none', expand);
    collapseBtn.classList.toggle('d-none', !expand);
    btnArrows.forEach(btn => btn.classList.toggle('d-none', expand));
    btnContainers.forEach(container => container.classList.toggle('d-flex', !expand));

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
    this.isExpanded = true;
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
    this.isExpanded = false;
  }

  /** 矢印ボタンのスクロールイベントを設定 */
  private setupArrowScrollListeners(): void {
    this.setupArrowScroll('templates-left-arrow', 'templates-right-arrow');
    this.setupArrowScroll('history-left-arrow', 'history-right-arrow');
    this.setupArrowScroll('tools-left-arrow', 'tools-right-arrow', 'tools-list');
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
    const firstButton = container.querySelector<HTMLElement>('.item, button');

    if (firstButton) {
      const buttonWidth = firstButton.offsetWidth;
      const gap = 8; // 0.5rem
      const visibleButtons = Math.floor(containerWidth / (buttonWidth + gap));
      return visibleButtons * (buttonWidth + gap);
    }

    // デフォルトはコンテナ幅の80%
    return containerWidth * 0.8;
  }

  /** iframe の高さをコンテンツに合わせて調整するリスナーを設定 */
  private resizeIframeHeightListeners(): void {
    const navItems = this.iframeDoc!.querySelectorAll<HTMLElement>('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (this.isExpanded) return;

        setTimeout(() => {
          const doc = this.iframeDoc;
          if (!doc) return;

          const iframe = doc.defaultView?.frameElement as HTMLIFrameElement | null;
          if (!iframe) return;

          const maxHeight = 85;
          const height = doc.body.scrollHeight;

          iframe.style.height = `${Math.min(height, maxHeight)}px`;
        }, 100);
      });
    });
  }

  /** セット名選択コンテナのリスナーを設定 */
  private setupNameContainerListener(): void {
    const navItems = this.iframeDoc!.querySelectorAll<HTMLElement>('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const button = (e.target as HTMLElement).closest('button');
        if (!button || !this.iframeDoc) return;

        const dataBsTarget = button.getAttribute('data-bs-target');
        this.updateContainerVisibility(dataBsTarget || '');
      });
    });
  }

  /** タブIDに応じてコンテナの表示/非表示を更新 */
  private updateContainerVisibility(dataBsTarget: string): void {
    // すべてのコンテナを非表示にする
    this.iframeDoc!.querySelectorAll<HTMLElement>('[id$="-name-container"]').forEach(el => el.classList.add('d-none'));

    // 対応するコンテナを表示する（#を除いたIDに-name-containerを追加）
    if (dataBsTarget) {
      this.iframeDoc!.querySelector<HTMLElement>(`${dataBsTarget}-name-container`)?.classList.remove('d-none');
    }
  }

  /** 追加情報表示エリアの内容を変更 */
  public changeExtraContent(
    charCount: string | number,
    selectionLength: string | number,
    lineNumber: string | number,
    columnNumber: string | number
  ): void {
    if (!this.iframeDoc) {
      // iframeDoc がまだ用意されていない場合は少し遅らせて再実行
      setTimeout(() => this.changeExtraContent(charCount, selectionLength, lineNumber, columnNumber), 100);
      return;
    }

    const charCountElement = this.iframeDoc.querySelector<HTMLElement>('#char-count');
    const selectionLengthElement = this.iframeDoc.querySelector<HTMLElement>('#selection-length');
    const lineNumberElement = this.iframeDoc.querySelector<HTMLElement>('#line-number');
    const columnNumberElement = this.iframeDoc.querySelector<HTMLElement>('#column-number');

    if (charCountElement) {
      charCountElement.textContent = charCount.toString();
    }

    if (selectionLengthElement) {
      selectionLengthElement.textContent = selectionLength.toString();
    }

    if (lineNumberElement) {
      lineNumberElement.textContent = lineNumber.toString();
    }

    if (columnNumberElement) {
      columnNumberElement.textContent = columnNumber.toString();
    }
  }
}