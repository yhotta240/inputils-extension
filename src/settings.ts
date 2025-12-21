import { ToolItem, toolsList } from "./content/features/tool-items";

/** 拡張機能の設定の型定義 */
export type Config = {
  version: number;
  features: Record<FeatureKey, Feature>;
};

export type FeatureKey = "templates" | "tools" | "emojis" | "users" | "history";

export type Feature = {
  type: 'command';
  char: string;
  position: ('start' | 'end')[]
  activation?: ActivationCondition;
  selector?: string;
  toolsList?: ToolItem[]; // ツールのリスト
};

export type ActivationCondition = 'always' | 'withSelection' | 'withoutSelection';

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
      type: 'command',
      char: '>',
      position: ['start'],
      activation: 'withSelection',
      toolsList: toolsList,
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
    history: {
      type: 'command',
      char: '!',
      position: ['start'],
    },
  },
};

/** ユーザ設定の型定義 */
export interface Settings { }

/** ユーザ設定のデフォルト値 */
export const DEFAULT_SETTINGS: Settings = {};
