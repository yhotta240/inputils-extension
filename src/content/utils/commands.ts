import { CONFIG, FeatureKey } from "../../settings";

const features = CONFIG.features;

/** 指定されたコマンド文字を取得 */
export function getCommand(featureKey: FeatureKey): string {
  return features[featureKey].char;
};

/** コマンドに続くクエリ部分を取得 */
export function getCommandQuery(text: string, featureKey: FeatureKey): string | null {
  const command = getCommand(featureKey);
  const position = features[featureKey].position as ('start' | 'end')[];

  // start が許可されていて，先頭にある場合
  if (position.includes('start') && text.startsWith(command)) {
    return text.substring(command.length);
  }

  // end が許可されていて，テキスト内に存在する場合
  if (position.includes('end') && text.lastIndexOf(command) !== -1) {
    const lastIndex = text.lastIndexOf(command);
    return text.substring(lastIndex + command.length);
  }

  return null;
};

/** テキストがコマンドにマッチするかどうかを判定 */
export function matchesCommand(text: string, featureKey: FeatureKey): boolean {
  const command = getCommand(featureKey);
  const position = features[featureKey].position as ('start' | 'end')[];

  // start が許可されていて，先頭にある場合
  if (position.includes('start') && text.startsWith(command)) {
    return true;
  }

  // end が許可されていて，テキスト内に存在する場合
  if (position.includes('end') && text.lastIndexOf(command) !== -1) {
    return true;
  }

  return false;
}

/** テキストが最後から辿って最初に見つかるコマンドの FeatureKey を返す */
export function matchesAnyCommandFromEnd(text: string): FeatureKey | null {
  const featureKeys = Object.keys(features) as FeatureKey[];
  for (let i = text.length - 1; i >= 0; i--) {
    for (const featureKey of featureKeys) {
      const command = getCommand(featureKey);
      if (text.startsWith(command, i)) {
        return featureKey;
      }
    }
  }
  return null;
}

/** テキストが最後から辿って最初に見つかるコマンドにマッチするかどうか */
export function isLastMatchedCommand(text: string, featureKey: FeatureKey): boolean {
  const lastMatchedCommand = matchesAnyCommandFromEnd(text);
  return lastMatchedCommand === featureKey;
}

/** コマンド，クエリ，マッチ情報をまとめて取得 */
export function getCommandInfo(text: string, featureKey: FeatureKey): { command: string; query: string; matches: boolean; lastMatchedCommand: FeatureKey | null; isLastMatched: boolean } {
  const command: string = getCommand(featureKey);
  const query: string | null = getCommandQuery(text, featureKey);
  const matches: boolean = matchesCommand(text, featureKey);
  const lastMatchedCommand: FeatureKey | null = matchesAnyCommandFromEnd(text);
  const isLastMatched: boolean = isLastMatchedCommand(text, featureKey);

  return { command, query: query || '', matches, lastMatchedCommand, isLastMatched };
}
