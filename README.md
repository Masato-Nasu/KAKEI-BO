# kakei-bo

レシートを撮るだけで、AIが文字化・整理・保存まで行う家計簿アプリです。

<p align="center">
  <img src="./screenshot.png" alt="kakei-bo screenshot" width="420">
</p>

## URL

https://kakei-bo.pages.dev/

## できること

- レシート画像の撮影 / 選択
- AIによる文字化と整理
- 品目ごとのカテゴリ分類
- ソフトドリンク / お酒 / ノンアル / おかし などの分類対応
- カテゴリ修正の自動保存
- ローカル保存
- JSON書き出し
- パスワード入力による利用開始

## 使い方

1. アプリを開く
2. レシート画像を撮影、または選択する
3. **AIで整理する** を押す
4. 内容を確認し、必要ならカテゴリを修正する
5. 保存して履歴や集計を見る
6. 必要に応じて JSON を書き出す

## 特徴

`kakei-bo` は、レシート全体を1つのカテゴリにまとめるのではなく、**品目の中身**を見て分類します。

例:

- ブレンド → ソフトドリンク
- ブラックサンダー → おかし
- オールフリー → ノンアル

## 技術メモ

- Frontend: HTML / CSS / JavaScript
- Deploy: Cloudflare Pages
- AI: OpenAI API
- 保存: localStorage
