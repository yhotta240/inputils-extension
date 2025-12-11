/** テンプレートアイテムのクリックリスナーを設定 */
export function setupTemplateItemListeners(iframeDoc: Document): void {
  const templateItems = iframeDoc.querySelectorAll<HTMLElement>('.template-item');

  templateItems.forEach(item => {
    item.addEventListener('click', () => {
      const text = item.getAttribute('data-text') || '';
      window.parent.postMessage({ type: 'insertText', text: text }, '*');
    });
  });
}
