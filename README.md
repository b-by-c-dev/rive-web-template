# rive-web-template

[Rive](https://rive.app) ランタイムを使った Web アプリの最小テンプレート。

- Vite + TypeScript
- [`@rive-app/webgl2`](https://www.npmjs.com/package/@rive-app/webgl2) (WebGL2 ランタイム)
- Vercel デプロイ設定済み（`.riv` の `Content-Type` ヘッダ含む）

## 使い方

このリポジトリの「Use this template」ボタンから新しいリポジトリを作成してください。

```bash
git clone https://github.com/<your-name>/<your-repo>.git
cd <your-repo>
npm install
npm run dev
```

`http://localhost:5173` で起動します。

## ファイル構成

```
.
├── index.html
├── public/
│   ├── favicon.svg
│   └── sample.riv      ← 自分の .riv に差し替える
├── src/
│   ├── main.ts         ← Rive の初期化コード
│   └── style.css
├── package.json
├── tsconfig.json
└── vercel.json
```

## 自分の Rive ファイルに差し替える

1. `public/` に `.riv` を置く
2. `src/main.ts` の `src: "sample.riv"` と `stateMachines: "State Machine 1"` を自分のファイルに合わせて書き換える

## ViewModel を使う場合

`@rive-app/webgl2` から `Layout, Fit, Alignment` に加えて `ViewModelInstance` などをインポートして、`onLoad` 内で `rive.viewModelByName(...)` から取得します。詳細は [Rive Web Runtime ドキュメント](https://rive.app/docs/runtimes/web/web-js)を参照。

## デプロイ

`vercel.json` が同梱されているので、Vercel に接続すればそのままデプロイできます。
