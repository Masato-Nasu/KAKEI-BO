# kakei-bo

レシートを撮影すると、AIが店名・日付・合計・品目・カテゴリを抽出し、ローカル保存できる最小構成アプリです。

## できること

- レシート画像の撮影 / 選択
- AIによる文字読み取り + 構造化
- 店名 / 日付 / 合計 / 品目 / カテゴリの自動入力
- 履歴のローカル保存
- 月別合計 / カテゴリ別集計
- PWAとしてホーム画面に追加

## 構成

- フロント: 静的HTML / CSS / JavaScript
- サーバー: Cloudflare Pages Functions
- AI: OpenAI API
- 保存: LocalStorage

## デプロイ前に必要なもの

- Cloudflare Pages プロジェクト
- OpenAI API Key

## Cloudflare Pages での使い方

### 1. ファイルをアップロード

このフォルダ一式を Cloudflare Pages にアップロードするか、GitHub 連携でデプロイしてください。

### 2. 環境変数を設定

Cloudflare Pages のプロジェクト設定で、以下を追加してください。

- `OPENAI_API_KEY` = あなたの OpenAI API キー
- `OPENAI_MODEL` = `gpt-4.1-mini` （任意。未設定でも既定値で動作）

### 3. 再デプロイ

環境変数設定後に再デプロイしてください。

## ローカルで確認する場合

```bash
npm install -g wrangler
npx wrangler pages dev .
```

ローカル秘密情報は `.dev.vars` に記述できます。

```txt
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

## 使い方

1. レシートを撮影または選択
2. 「AIで整理する」を押す
3. 抽出結果を必要に応じて修正
4. 「保存する」を押す

## 注意

- 画像や履歴は端末のローカルストレージに保存されます。
- レシートの印字状態や傾きによって精度は変動します。
- 完全自動ではなく、保存前の軽い確認を前提にしています。

## 改良候補

- 店名の表記ゆれ統一
- 品目からのカテゴリ推定強化
- 月別グラフ
- CSV出力
- クラウド保存
