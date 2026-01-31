# Receipt Book PWA (OCR prototype)

レシートを **撮影/画像選択 → OCR → 確認 → 保存** できる家計簿PWAの「動くプロトタイプ」です。

## できること
- 画像選択（スマホなら撮影も可）
- ブラウザ内でOCR（Tesseract.js v5 / CDN）
- 店名・日付・合計・品目っぽい行の抽出（簡易）
- カテゴリ（食費/外食/飲み代/洋服…）でフィルタ
- ソート（日付/金額/店名/カテゴリ）
- 「店 → カテゴリ」学習（同じ店は次回から提案が強くなる）
- データは端末内（localStorage）。エクスポート/インポートもあり

## 起動方法
### 1) いちばん確実：ローカルWebサーバーで起動
`file://` 直開きだと、ブラウザの制限でOCRが動かない場合があります。
以下のどれかで **http://localhost** 経由で開いてください。

- Python:
  - `python -m http.server 8000`
  - ブラウザで `http://localhost:8000/` を開く
- Node:
  - `npx serve .`

### 2) GitHub Pages などに置く
PWAとしての挙動確認がしやすいです。

## 注意
- 初回OCRは、言語データのダウンロードが走るため時間がかかることがあります。
- 日本語レシートは `日本語+英語` が無難ですが、速度優先なら `英語のみ` にすると軽いです。
- OCR精度は撮影条件に強く依存します（影/傾き/小さい文字）。

## 依存
- Tesseract.js v5 (CDN)
  - https://github.com/naptha/tesseract.js


## GitHub Pages でOCRが動かない場合
- 回線やフィルタで **tessdata（言語データ）取得** がブロックされることがあります。
- この版は `projectnaptha` がダメな場合に `raw.githubusercontent.com` / `cdn.jsdelivr.net` のミラーへ自動フォールバックします。
- それでも失敗する場合は、まずOCR言語を **英語のみ** にして動作確認してください（日本語はデータが大きいです）。
