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
    const afterCommand: string = text.substring(command.length).trim();

    // ツールコマンドの場合，コマンド名とクエリを分離
    // [>query target] の形式を想定
    if (featureKey === 'tools') {
      const firstSpaceIndex = afterCommand.indexOf(' ');
      if (firstSpaceIndex !== -1) {
        return afterCommand.substring(0, firstSpaceIndex).trim();
      }
    }

    return afterCommand;
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

/**
 * コマンドとクエリに続くターゲットテキストを取得する．
 * 例えば featureKey が tools の場合，">translate Hello world" というテキストであれば "Hello world" を返す．
 * /query や :emoji_name など，ターゲットテキストを持たない場合は空文字を返す．
 */
export function getTargetText(command: string, query: string | null, text: string, featureKey: FeatureKey): string {
  const position = features[featureKey].position as ('start' | 'end')[];
  let commandIndex = -1;

  if (position.includes('start') && text.startsWith(command)) {
    commandIndex = command.length;
  } else if (position.includes('end') && text.lastIndexOf(command) !== -1) {
    const last = text.lastIndexOf(command);
    commandIndex = last + command.length;
  }

  if (commandIndex === -1) return '';

  return text.substring(commandIndex + (query ? query.length : 0));
}

/** コマンド，クエリ，マッチ情報をまとめて取得 */
export function getCommandInfo(text: string, featureKey: FeatureKey): { command: string; query: string; matches: boolean; lastMatchedCommand: FeatureKey | null; isLastMatched: boolean, target: string } {
  const command: string = getCommand(featureKey);
  const query: string | null = getCommandQuery(text, featureKey);
  const matches: boolean = matchesCommand(text, featureKey);
  const lastMatchedCommand: FeatureKey | null = matchesAnyCommandFromEnd(text);
  const isLastMatched: boolean = isLastMatchedCommand(text, featureKey);
  const target: string = getTargetText(command, query, text, featureKey);

  return { command, query: query || '', matches, lastMatchedCommand, isLastMatched, target };
}
