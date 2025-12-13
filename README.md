# Inputils Extension

ウェブ上でテキスト入力を補助するための Chrome 拡張機能

## 主な機能

- 定型文の挿入
- 入力テキストの変換（文章の添削，翻訳，敬語変換など）
- 絵文字の挿入
- 入力の履歴管理（未実装）

## インストール

### Chrome Web Store からインストール

_準備中_

### 手動インストール

1. このリポジトリをクローン

   ```bash
   git clone https://github.com/yhotta240/inputils-extension
   cd inputils-extension
   ```

2. 依存関係をインストール

   ```bash
   npm install
   ```

3. ビルド

   ```bash
   npm run build
   ```

4. Chrome に読み込む
   - Chrome で `chrome://extensions/` を開く
   - 「デベロッパーモード」をオンにする
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `dist/` ディレクトリを選択

## 使い方

1. 任意のテキスト入力フィールドをクリック
2. コマンドを入力するとパネルが表示（例: `/` で定型文タブ，`:` で絵文字タブ）
3. 必要な機能をパネルから選択して使用

## 作者

- yhotta240 (https://github.com/yhotta240)
