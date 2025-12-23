import { reloadExtension } from "../scripts/reload";
import { reloadTargetTabs } from "./utils/reload-tabs";

// ターゲットURLパターン（テスト）
const targetUrls = ["https://gemini.google.com/*", "https://www.notion.so/*"];
console.log("ターゲットURLパターン（テスト）:", targetUrls);

/**
 * Background Script を初期化
 */
function initialize(): void {
  console.log("現在の環境：", process.env.NODE_ENV);

  if (process.env.NODE_ENV === "development") {
    reloadExtension();
  }
  // 拡張機能起動時にターゲットタブをリロード
  reloadTargetTabs(targetUrls);
}

initialize();