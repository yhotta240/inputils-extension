/** 拡張機能の設定の型定義 */
export type Config = {
  version: number;
  features: Record<FeatureKey, Feature>;
};

export type FeatureKey = "templates" | "tools" | "emojis" | "users";

export type Feature = {
  type: 'command' | 'select';
  char: string;
  position: ('start' | 'end')[];
};

/** 内部で使用する設定 */
export const CONFIG: Config = {
  version: 1,
  features: {
    templates: {
      type: 'command',
      char: '/',
      position: ['start'],
    },
    tools: {
      type: 'select',
      char: '',
      position: [],
    },
    emojis: {
      type: 'command',
      char: ':',
      position: ['start', 'end'],
    },
    users: {
      type: 'command',
      char: '@',
      position: ['start', 'end'],
    },
  },
};

/** ユーザ設定の型定義 */
export interface Settings { }

/** ユーザ設定のデフォルト値 */
export const DEFAULT_SETTINGS: Settings = {};
