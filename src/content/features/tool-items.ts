export type ToolItem = {
  key: string;
  name: string;
  description: string;
  icon: string;
  mode: 'insert' | 'replace' | 'delete';
  source: 'local' | 'api' | 'plugin'; // ツールの実装方法 local: ローカル関数，api: API経由（AI生成・外部API），plugin: ユーザー追加プラグイン
  tags?: string[];
  function?: (text: string) => string; // ローカル関数の場合の処理内容
};

/** ツールのリスト */
export const toolsList: ToolItem[] = [
  { key: 'correct', name: '添削', description: '文章を添削します', icon: 'bi bi-file-text', mode: 'insert', source: 'api', tags: ['correct', 'correction', '添削', 'てんさく'] },
  { key: 'translate', name: '翻訳', description: '文章を日本語に翻訳します', icon: 'bi bi-translate', mode: 'insert', source: 'api', tags: ['translate', 'translation', '翻訳', 'ほんやく'] },
  { key: 'keigo', name: '敬語変換', description: '文章を丁寧な敬語に書き換えます', icon: 'bi bi-person-badge', mode: 'insert', source: 'api', tags: ['keigo', '敬語', 'けいご'] },
  { key: 'summarize', name: '要約', description: '文章を要約します', icon: 'bi bi-card-text', mode: 'insert', source: 'api', tags: ['summarize', 'summary', '要約', 'ようやく'] },
  { key: 'expand', name: '文章拡張', description: '文章をより詳細に拡張します', icon: 'bi bi-arrows-angle-expand', mode: 'insert', source: 'api', tags: ['expand', 'expansion', '拡張', 'かくちょう'], },
  { key: 'simplify', name: '簡素化', description: '文章を簡素化します', icon: 'bi bi-text-paragraph', mode: 'insert', source: 'api', tags: ['simplify', 'simplification', '簡素化', 'かんそか'] },
  { key: 'char-between-spaces', name: '文字間に空白挿入', description: '各文字の間に空白を挿入します', icon: 'bi bi-text-indent-left', mode: 'replace', source: 'local', tags: ['char-between-spaces', '文字間に空白挿入', 'もじかんにくうはくそうにゅう'], function: charBetweenSpaces },
  { key: 'delete-space', name: '空白削除', description: '空白を削除します', icon: 'bi bi-backspace', mode: 'delete', source: 'local', tags: ['delete-space', '空白削除', 'くうはくさくじょ'], function: deleteSpace },
  { key: 'space-to-nl', name: '空白を改行に', description: '空白を改行に置換します', icon: 'bi bi-text-wrap', mode: 'replace', source: 'local', tags: ['space-to-nl', '空白を改行に', 'くうはくをかいぎょうに'], function: spaceToNewline },
  { key: 'nl-to-space', name: '改行を空白に', description: '改行を空白に置換します', icon: 'bi bi-text-paragraph', mode: 'replace', source: 'local', tags: ['nl-to-space', '改行を空白に', 'かいぎょうをくうはくに'], function: newlineToSpace },
  { key: 'remove-punctuation', name: '句読点削除', description: '句読点を削除します', icon: 'bi bi-slash-circle', mode: 'delete', source: 'local', tags: ['remove-punctuation', '句読点削除', 'くとうてんさくじょ'], function: removePunctuation },
  { key: 'space-to-underscore', name: '空白をアンダースコアに', description: '空白をアンダースコアに置換します', icon: 'bi bi-dash-circle', mode: 'replace', source: 'local', tags: ['space-to-underscore', '空白をアンダースコアに', 'くうはくをあんだーすこあに'], function: spaceToUnderscore },
  { key: 'underscore-to-space', name: 'アンダースコアを空白に', description: 'アンダースコアを空白に置換します', icon: 'bi bi-text-paragraph', mode: 'replace', source: 'local', tags: ['underscore-to-space', 'アンダースコアを空白に', 'あんだーすこあをくうはくに'], function: underscoreToSpace },
  { key: 'capitalize', name: '大文字化', description: 'テキストを大文字に変換します', icon: 'bi bi-type-bold', mode: 'replace', source: 'local', tags: ['capitalize', '大文字化', 'おおもじか'], function: capitalize },
  { key: 'lowercase', name: '小文字化', description: 'テキストを小文字に変換します', icon: 'bi bi-type', mode: 'replace', source: 'local', tags: ['lowercase', '小文字化', 'こもじか'], function: lowercase },
  { key: 'reverse-text', name: 'テキスト反転', description: 'テキストを反転します', icon: 'bi bi-arrow-repeat', mode: 'replace', source: 'local', tags: ['reverse-text', 'テキスト反転', 'てきすとはんてん'], function: reverseText },
];

/** 文字間に全角スペースを挿入する */
function charBetweenSpaces(text: string): string {
  return text.split('').join('　');
}

/** 空白を削除する */
function deleteSpace(text: string): string {
  return text.replace(/\s+/g, '');
}

/** 空白を改行に置換する */
function spaceToNewline(text: string): string {
  return text.replace(/\s+/g, '\n');
}

/** 改行を空白に置換する */
function newlineToSpace(text: string): string {
  return text.replace(/\n+/g, ' ');
}

/** 句読点を削除する */
function removePunctuation(text: string): string {
  return text.replace(/[、。，．,.\!\?！？；;：:]/g, '');
}

/** 空白をアンダースコアに置換する */
function spaceToUnderscore(text: string): string {
  return text.replace(/\s+/g, '_');
}

/** アンダースコアを空白に置換する */
function underscoreToSpace(text: string): string {
  return text.replace(/_/g, ' ');
}

/** テキストを大文字に変換する */
function capitalize(text: string): string {
  return text.toUpperCase();
}

/** テキストを小文字に変換する */
function lowercase(text: string): string {
  return text.toLowerCase();
}

/** テキストを反転する */
function reverseText(text: string): string {
  return text.split('').reverse().join('');
}
