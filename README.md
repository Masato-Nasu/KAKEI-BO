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


## 日本語OCRが固まる場合（同梱で解決）
環境によっては `tessdata.projectnaptha.com` など外部ドメインの言語データ取得が遅い/ブロックされて **「OCR初期化中（jpn）」のまま**になることがあります。

この版は、まず **同一オリジン（GitHub Pages）内の `traineddata/`** を探します。
以下を1回だけ行うと、日本語OCRがほぼ確実に動くようになります。

1. 次のURLから `jpn.traineddata.gz` をダウンロード  
   - https://tessdata.projectnaptha.com/4.0.0_fast/jpn.traineddata.gz  
2. リポジトリの `traineddata/4.0.0_fast/` に置く  
   - 例: `traineddata/4.0.0_fast/jpn.traineddata.gz`
3. GitHub Pagesを更新 → もう一度OCR

※ 外部CDNに頼らず、GitHub Pagesから直接配信されるため、回線フィルタの影響を受けにくくなります。


## GitHub PagesでOCRがタイムアウトする場合（確実解：OCR資材を同梱）
スクショの通り `英語のみ` でも **OCR初期化がタイムアウト**する場合は、CDNやWASM/Workerの取得が環境側で遅延/ブロックされている可能性が高いです。

この版は **vendor同梱（ローカル優先）** で解決できるようにしてあります。

### 手順
1. `vendor/tesseract/` に以下4ファイルを置く
   - `tesseract.min.js`
   - `worker.min.js`
   - `tesseract-core.wasm.js`
   - `tesseract-core.wasm`

2. （日本語も使うなら）`traineddata/4.0.0_fast/` に
   - `jpn.traineddata.gz`
   - （必要なら）`eng.traineddata.gz`

3. GitHubにpush → Pagesを開き直し

### 追加チェック
画面の **「OCR資材の到達テスト」** を押すと、どのファイルが取得できていないか表示します。

※ Service Worker はキャッシュ混乱を避けるためこのZIPではデフォルトOFFです。PWA化する段階でONに戻します。
