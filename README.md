# 実家じまい診断アプリ (House Closing Diagnosis MVP)

このフォルダには、「3 分でわかる 実家じまい診断」Web アプリケーションのソースコードが含まれています。

## ファイル構成

- `index.html`: アプリの本体です。これをブラウザで開くと診断が始まります。
- `diagnosis_data.js`: 診断の質問、スコアリングルール、結果テキスト（アドバイス・画像パスなど）が格納されたデータファイルです。文言の修正はこちらを行ってください。
- `logic.js`: 診断の進行、計算ロジック、画面表示を制御するプログラムです。
- `assets/images/`: 診断結果に表示されるイラスト画像が格納されています。

## Web への公開方法（GitHub & Vercel）

このフォルダは既に Git リポジトリとして初期化されています。以下の手順で公開してください。

### 1. GitHub へのアップロード

コマンドライン（ターミナル/PowerShell）で以下を実行してください。
※GitHub CLI (`gh`) がインストールされている前提です。

```bash
# GitHubリポジトリの作成（公開設定: Public）
gh repo create household-liquidation-diagnosis --public --source=. --remote=origin

# GitHubへプッシュ
git push -u origin master
```

### 2. Vercel へのデプロイ

Vercel CLI (`vercel`) がインストールされている場合：

```bash
# Vercelへデプロイ（初回はログインや設定が問われます。すべてEnterでOKです）
vercel
```

Vercel CLI がない場合は、[Vercel のダッシュボード](https://vercel.com/new)から、アップロードした GitHub リポジトリ (`household-liquidation-diagnosis`) をインポートしてください。設定なしで自動的にデプロイされます。

## カスタマイズ

テキストや診断ロジックを変更したい場合は、`diagnosis_data.js` をテキストエディタで開き、該当箇所を編集して保存してください。
画像を変更したい場合は、`assets/images` フォルダ内の画像を差し替えるか、`diagnosis_data.js` 内のパスを書き換えてください。
