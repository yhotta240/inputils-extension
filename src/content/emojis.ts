/** ツールアイテムのクリックイベントを設定 */
export function setupEmojiItemListeners(iframeDoc: Document): void {
  const emojiItems = iframeDoc.querySelectorAll<HTMLElement>('.emoji-item');
  const emojiName = iframeDoc.querySelector('#emoji-name');

  emojiItems.forEach(item => {
    item.addEventListener('click', () => {
      const emoji = item.getAttribute('data-emoji') || '';
      window.parent.postMessage({ type: 'insertEmoji', emoji: emoji }, '*');
    });

    // ホバー時にタイトルを表示
    item.addEventListener('mouseover', () => {
      const title = item.getAttribute('title') || '';
      if (emojiName) {
        emojiName.textContent = title;
        emojiName.classList.remove('d-none');
      }
    });
  });
}