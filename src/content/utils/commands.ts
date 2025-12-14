import { CONFIG, FeatureKey } from "../../settings";

const features = CONFIG.features;

// 指定されたコマンド文字を取得
export function getCommand(featureKey: FeatureKey): string {
  return features[featureKey].char;
};

// コマンドに続くクエリ部分を取得
export function getCommandQuery(text: string, featureKey: FeatureKey): string | null {
  const command = getCommand(featureKey);
  const position = features[featureKey].position as ('start' | 'end')[];

  // start が許可されていて，先頭にある場合
  if (position.includes('start') && text.startsWith(command)) {
    return text.substring(command.length);
  }

  // end が許可されていて，text 内に存在する場合
  if (position.includes('end')) {
    const lastIndex = text.lastIndexOf(command);
    if (lastIndex !== -1) {
      return text.substring(lastIndex + command.length);
    }
  }

  return null;
};