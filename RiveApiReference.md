# Rive Web Runtime APIリファレンス

TypeScript型定義ファイルから抽出した、Rive Webランタイムの完全なAPIリファレンス。

---

## 目次

1. [概要](#概要)
2. [基本的な使い方](#基本的な使い方)
3. [メインクラス](#メインクラス)
   - [Rive](#class-rive)
   - [RiveFile](#class-rivefile)
   - [RuntimeLoader](#class-runtimeloader)
   - [Layout](#class-layout)
4. [State Machine 関連](#state-machine-関連)
5. [View Model（データバインディング）](#view-modelデータバインディング)
6. [Enum 一覧](#enum-一覧)
7. [主要な型・インターフェース](#主要な型インターフェース)
8. [ユーティリティ関数](#ユーティリティ関数)

---

## 概要

このランタイムは、Riveアニメーションファイル（.riv）をHTMLCanvas上で再生するためのAPIを提供する。アニメーション再生、ステートマシン、データバインディング（View Model）、アセット読み込み、レイアウト制御などをサポートする。

---

## 基本的な使い方

```ts
import { Rive, Layout, Fit, Alignment } from "@rive-app/canvas";

const rive = new Rive({
  src: "animation.riv",
  canvas: document.getElementById("canvas") as HTMLCanvasElement,
  autoplay: true,
  stateMachines: "State Machine 1",
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  onLoad: () => {
    rive.resizeDrawingSurfaceToCanvas();
  },
});
```

---

## メインクラス

### `class Rive`

Riveアニメーション再生のメインクラス。コンストラクタまたは `Rive.new()` で生成する。

#### コンストラクタ

```ts
constructor(params: RiveParameters)
static new(params: RiveParameters): Rive
```

#### 再生制御

| メソッド | 説明 |
|---|---|
| `play(animationNames?, autoplay?)` | アニメーション/ステートマシンの再生開始 |
| `pause(animationNames?)` | 一時停止 |
| `stop(animationNames?)` | 停止 |
| `scrub(animationNames?, value?)` | 指定時刻にシーク |
| `reset(params?: RiveResetParameters)` | アートボード・アニメーションをリセット |
| `load(params: RiveLoadParameters)` | 別の.rivファイルを読み込み |

#### レンダリング制御

| メソッド/プロパティ | 説明 |
|---|---|
| `drawFrame()` | 1フレーム手動描画 |
| `stopRendering()` | 描画ループを停止（状態は維持） |
| `startRendering()` | 描画ループを再開 |
| `resizeToCanvas()` | レイアウト境界をキャンバスサイズに合わせる |
| `resizeDrawingSurfaceToCanvas(customDevicePixelRatio?)` | DPRを考慮してキャンバス描画面をリサイズ |
| `get/set layout: Layout` | 現在のレイアウト |
| `get/set devicePixelRatioUsed: number` | 使用中のDPR |
| `drawOptimization` | 描画最適化モード（`DrawOptimizationOptions` 参照） |

#### アートボード関連

| プロパティ/メソッド | 説明 |
|---|---|
| `get activeArtboard: string` | 現在のアートボード名 |
| `get bounds: Bounds` | アートボードの境界 |
| `get/set artboardWidth: number` | アートボード幅 |
| `get/set artboardHeight: number` | アートボード高さ |
| `resetArtboardSize()` | アートボードサイズを元に戻す |
| `getArtboard(name)` ⚠️非推奨 | アートボード取得 |
| `getBindableArtboard(name)` | バインド可能アートボードを取得 |
| `getDefaultBindableArtboard()` | デフォルトのバインド可能アートボードを取得 |

#### コンテンツ取得

| プロパティ/メソッド | 説明 |
|---|---|
| `get contents: RiveFileContents` | ファイル内のアートボード/アニメーション/SM一覧 |
| `get animationNames: string[]` | アニメーション名一覧 |
| `get stateMachineNames: string[]` | ステートマシン名一覧 |
| `get playingAnimationNames` / `pausedAnimationNames` | 再生中/一時停止中のアニメーション名 |
| `get playingStateMachineNames` / `pausedStateMachineNames` | 同様にステートマシン名 |
| `get isPlaying` / `isPaused` / `isStopped: boolean` | 再生状態 |
| `get source: string` | 読み込み元URL |

#### テキストRun

| メソッド | 説明 |
|---|---|
| `getTextRunValue(textRunName)` | テキストRunの値を取得 |
| `setTextRunValue(textRunName, value)` | テキストRunの値を設定 |
| `getTextRunValueAtPath(textName, path)` | ネストされたアートボード内のテキストを取得 |
| `setTextRunValueAtPath(textName, value, path)` | 同上、設定 |

> `path` は `"artboard1"` や `"group/nestedGroup"` のようにスラッシュ区切りで指定する。

#### ステートマシン入力

| メソッド | 説明 |
|---|---|
| `stateMachineInputs(name): StateMachineInput[]` | 指定SMの入力一覧 |
| `setBooleanStateAtPath(inputName, value, path)` | ネストされたパス上のboolean入力を設定 |
| `setNumberStateAtPath(inputName, value, path)` | 同、number入力 |
| `fireStateAtPath(inputName, path)` | 同、trigger発火 |

#### View Model / データバインディング

| プロパティ/メソッド | 説明 |
|---|---|
| `get viewModelCount: number` | ファイル内のViewModel数 |
| `viewModelByIndex(index): ViewModel \| null` | インデックスで取得 |
| `viewModelByName(name): ViewModel \| null` | 名前で取得 |
| `defaultViewModel(): ViewModel \| null` | デフォルトViewModel |
| `enums(): DataEnum[]` | ファイル内のデータEnum一覧 |
| `bindViewModelInstance(instance)` | ViewModelInstanceをアートボードにバインド |
| `get viewModelInstance: ViewModelInstance \| null` | 現在バインド中のインスタンス |

#### イベント

| メソッド | 説明 |
|---|---|
| `on(type: EventType, callback: EventCallback)` | イベント購読 |
| `off(type, callback)` | 購読解除 |
| `removeAllRiveEventListeners(type?)` | 全リスナー削除 |
| `unsubscribe(type, callback)` ⚠️非推奨 | `off()`を使う |
| `unsubscribeAll(type?)` ⚠️非推奨 | `removeAllRiveEventListeners()`を使う |

#### リスナー（Rive Listeners）

| メソッド | 説明 |
|---|---|
| `setupRiveListeners(options?)` | キャンバス上のRive Listenerを有効化 |
| `removeRiveListeners()` | 無効化 |
| `isTouchScrollEnabled: boolean` | タッチ時のスクロール許可 |

#### オーディオ

| プロパティ | 説明 |
|---|---|
| `get/set volume: number` | アートボードの音量 |

#### FPSデバッグ

| メソッド/プロパティ | 説明 |
|---|---|
| `enableFPSCounter(fpsCallback?)` | FPS表示・コールバック |
| `disableFPSCounter()` | 無効化 |
| `get fps: number` | 現在のFPS |
| `get frameTime: string \| 0` | フレーム時間 |
| `durations`, `frameTimes`, `frameCount` | プロファイリング用配列 |

#### クリーンアップ

| メソッド | 説明 |
|---|---|
| `cleanup()` | 全Wasmオブジェクトの破棄。再利用には新規インスタンス生成が必要 |
| `cleanupInstances()` | アートボード/アニメーション/SMインスタンスのみ破棄 |
| `deleteRiveRenderer()` | レンダラーのみ破棄 |

---

### `class RiveFile`

`.riv` ファイル本体を表すクラス。同じファイルを複数の `Rive` インスタンスで共有するときに使う。

#### コンストラクタ

```ts
constructor(params: RiveFileParameters)
```

#### 主要メソッド

| メソッド | 説明 |
|---|---|
| `init(): Promise<void>` | 読み込み開始 |
| `on(type, callback)` / `off(type, callback)` | イベント購読・解除 |
| `removeAllRiveEventListeners(type?)` | 全リスナー削除 |
| `cleanup()` | 参照カウントを減らし、不要なら破棄 |
| `destroyIfUnused()` | 使われていなければ破棄 |
| `getInstance(): rc.File` | 低レベルのFileインスタンスを取得 |
| `getArtboard(name)` ⚠️非推奨 | アートボード取得 |
| `getBindableArtboard(name)` | バインド可能アートボードを取得 |
| `getDefaultBindableArtboard()` | デフォルトのバインド可能アートボード |
| `viewModelByName(name)` | ViewModel取得 |

#### 用途例

複数のキャンバスで同じ.rivを表示する場合、`RiveFile` を一度生成して、各 `Rive` インスタンスの `riveFile` パラメータに渡すことでパースを共有できる。

---

### `class RuntimeLoader`

WASMランタイムのロードを管理する静的クラス。

| メソッド/プロパティ | 説明 |
|---|---|
| `static getInstance(callback)` | ランタイム取得（コールバック方式） |
| `static awaitInstance(): Promise<RiveCanvas>` | Promiseで取得 |
| `static setWasmUrl(url)` | WASMファイルのURLを上書き |
| `static getWasmUrl(): string` | 現在のWASM URL |
| `static enablePerfMarks: boolean` | `performance.mark` を出力（プロファイリング用） |

---

### `class Layout`

アートボードのフィット方法と整列を定義するイミュータブルなクラス。

```ts
new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
  layoutScaleFactor: 1,
  minX: 0, minY: 0, maxX: 0, maxY: 0,
});
```

| メンバ | 説明 |
|---|---|
| `fit: Fit` | フィット方式 |
| `alignment: Alignment` | 整列方式 |
| `layoutScaleFactor: number` | レイアウトスケール係数 |
| `minX, minY, maxX, maxY: number` | カスタム境界 |
| `copyWith(params): Layout` | 一部だけ変更した複製を返す |
| `static new(params): Layout` | ファクトリ |
| `runtimeFit(rive)` / `runtimeAlignment(rive)` | WASM向け値を返す（通常は内部利用） |

> `Layout` はイミュータブル。変更したい場合は新規インスタンスを `rive.layout = ...` に代入する。

---

## State Machine 関連

### `class StateMachineInput`

ステートマシンの入力（Boolean / Number / Trigger）を表す。

| メンバ | 説明 |
|---|---|
| `type: StateMachineInputType` | 入力の型 |
| `name: string` | 入力名 |
| `value: number \| boolean` | 値（Triggerでは無効） |
| `fire()` | Triggerを発火（NumberとBooleanでは何もしない） |
| `delete()` | 入力を破棄 |

```ts
const inputs = rive.stateMachineInputs("State Machine 1");
const hover = inputs.find((i) => i.name === "isHovered");
if (hover) hover.value = true;
```

---

## View Model（データバインディング）

Rive Web Runtimeのデータバインディング機構。View Modelをアートボードにバインドし、プロパティを動的に変更する。

### `class ViewModel`

ViewModelの定義（型）を表す。インスタンスを生成して使う。

| メンバ | 説明 |
|---|---|
| `name: string` | ViewModel名 |
| `instanceCount: number` | 定義済みインスタンス数 |
| `instanceNames: string[]` | インスタンス名一覧 |
| `properties: ViewModelProperty[]` | プロパティ一覧 |
| `instanceByIndex(index)` | インデックスでインスタンス取得 |
| `instanceByName(name)` | 名前でインスタンス取得 |
| `defaultInstance()` | デフォルトインスタンス取得 |
| `instance()` | 新規空インスタンスを生成 |

### `class ViewModelInstance`

ViewModelの実体。アートボードにバインドして使う。プロパティはパス文字列で取得する。

```ts
const vm = rive.defaultViewModel();
const instance = vm?.defaultInstance();
if (instance) {
  rive.bindViewModelInstance(instance);
  instance.string("title")!.value = "Hello";
  instance.number("count")!.value = 42;
  instance.boolean("isActive")!.value = true;
}
```

#### プロパティアクセスメソッド

| メソッド | 戻り値 |
|---|---|
| `number(path)` | `ViewModelInstanceNumber \| null` |
| `string(path)` | `ViewModelInstanceString \| null` |
| `boolean(path)` | `ViewModelInstanceBoolean \| null` |
| `color(path)` | `ViewModelInstanceColor \| null` |
| `trigger(path)` | `ViewModelInstanceTrigger \| null` |
| `enum(path)` | `ViewModelInstanceEnum \| null` |
| `list(path)` | `ViewModelInstanceList \| null` |
| `image(path)` | `ViewModelInstanceAssetImage \| null` |
| `artboard(path)` | `ViewModelInstanceArtboard \| null` |
| `viewModel(path)` | `ViewModelInstance \| null`（ネスト） |

> パスはスラッシュ区切りで階層指定可能（例：`"header/title"`）。

#### その他

| メンバ | 説明 |
|---|---|
| `viewModelName: string` | このインスタンスの元となったViewModel定義名 |
| `properties: ViewModelProperty[]` | プロパティ一覧 |
| `replaceViewModel(path, value)` | ネストされたViewModelプロパティを差し替え |
| `incrementReferenceCount()` / `decrementReferenceCount()` | 参照カウント管理 |
| `cleanup()` | リソース解放 |

### `class ViewModelInstanceValue`（基底）

各プロパティ値の基底クラス。

| メンバ | 説明 |
|---|---|
| `name: string` | プロパティ名 |
| `on(callback)` | 値変更時のコールバック登録 |
| `off(callback?)` | コールバック解除（引数なしで全解除） |

### プロパティ型ごとのクラス

| クラス | `value` の型 | 追加メソッド |
|---|---|---|
| `ViewModelInstanceString` | `string` | — |
| `ViewModelInstanceNumber` | `number` | — |
| `ViewModelInstanceBoolean` | `boolean` | — |
| `ViewModelInstanceTrigger` | — | `trigger()` で発火 |
| `ViewModelInstanceEnum` | `string` | `valueIndex`, `values: string[]` |
| `ViewModelInstanceColor` | `number` (ARGB) | `rgb()`, `rgba()`, `argb()`, `alpha()`, `opacity()` |
| `ViewModelInstanceList` | — | `length`, `addInstance()`, `addInstanceAt()`, `removeInstance()`, `removeInstanceAt()`, `instanceAt()`, `swap()` |
| `ViewModelInstanceAssetImage` | `rc.Image \| null`（writeのみ） | — |
| `ViewModelInstanceArtboard` | `BaseArtboard \| null`（writeのみ） | — |

### `class DataEnum`

ファイル内で定義されたカスタムEnum。

| メンバ | 説明 |
|---|---|
| `name: string` | Enum名 |
| `values: string[]` | 値一覧 |

---

## Enum 一覧

### `Fit`
アートボードのフィット方式。

| 値 | 文字列 |
|---|---|
| `Cover` | `"cover"` |
| `Contain` | `"contain"` |
| `Fill` | `"fill"` |
| `FitWidth` | `"fitWidth"` |
| `FitHeight` | `"fitHeight"` |
| `None` | `"none"` |
| `ScaleDown` | `"scaleDown"` |
| `Layout` | `"layout"` |

### `Alignment`
9通りの整列。`Center`, `TopLeft`, `TopCenter`, `TopRight`, `CenterLeft`, `CenterRight`, `BottomLeft`, `BottomCenter`, `BottomRight`。

### `DrawOptimizationOptions`
- `AlwaysDraw` — 毎フレーム描画
- `DrawOnChanged` — 変更時のみ描画

### `StateMachineInputType`
- `Number = 56`
- `Trigger = 58`
- `Boolean = 59`

### `RiveEventType`
- `General = 128`
- `OpenUrl = 131`

### `EventType`
ランタイムが発火するイベント種別。

| 値 | 説明 |
|---|---|
| `Load` | ファイル読み込み完了 |
| `LoadError` | 読み込みエラー |
| `Play` / `Pause` / `Stop` / `Loop` | 再生関連 |
| `Draw` | 描画完了 |
| `Advance` | アニメーション進行 |
| `StateChange` | ステート遷移 |
| `RiveEvent` | カスタムRiveイベント |
| `AudioStatusChange` | オーディオ状態変化 |

### `LoopType`
- `OneShot`（一度きり）
- `Loop`（ループ）
- `PingPong`（往復）

### `DataType`
View Modelのプロパティ型。`none`, `string`, `number`, `boolean`, `color`, `list`, `enumType`, `trigger`, `viewModel`, `integer`, `listIndex`, `image`, `artboard`。

---

## 主要な型・インターフェース

### `RiveParameters`

`new Rive()` に渡すパラメータ。代表的なもの:

| プロパティ | 型 | 説明 |
|---|---|---|
| `canvas` | `HTMLCanvasElement \| OffscreenCanvas` | 描画先（必須） |
| `src` | `string` | .rivファイルのURL |
| `buffer` | `ArrayBuffer` | .rivファイルのバイナリ |
| `riveFile` | `RiveFile` | 共有用 |
| `artboard` | `string` | 使用するアートボード名 |
| `animations` | `string \| string[]` | 再生するアニメーション |
| `stateMachines` | `string \| string[]` | 再生するステートマシン |
| `layout` | `Layout` | レイアウト設定 |
| `autoplay` | `boolean` | 自動再生 |
| `autoBind` | `boolean` | デフォルトVM自動バインド |
| `useOffscreenRenderer` | `boolean` | OffscreenCanvasレンダラー使用 |
| `enableRiveAssetCDN` | `boolean` | Rive CDNからアセット自動取得（デフォルト有効） |
| `shouldDisableRiveListeners` | `boolean` | Rive Listenerを無効化 |
| `isTouchScrollEnabled` | `boolean` | タッチ時のスクロール許可 |
| `automaticallyHandleEvents` | `boolean` | OpenUrl等のイベントを自動処理（デフォルトfalse） |
| `dispatchPointerExit` | `boolean` | キャンバス離脱時にpointer exit発行 |
| `enableMultiTouch` | `boolean` | マルチタッチ対応 |
| `drawingOptions` | `DrawOptimizationOptions` | 描画最適化モード |
| `enablePerfMarks` | `boolean` | `performance.mark` 出力 |
| `assetLoader` | `AssetLoadCallback` | カスタムアセットローダー |
| `onLoad`, `onLoadError`, `onPlay`, `onPause`, `onStop`, `onLoop`, `onStateChange`, `onAdvance` | `EventCallback` | 各種コールバック |

> 小文字版コールバック（`onload` 等）は非推奨。キャメルケースの `onLoad` を使う。

### `RiveLoadParameters`

`rive.load()` 用。`src`, `buffer`, `riveFile`, `autoplay`, `autoBind`, `artboard`, `animations`, `stateMachines`, `useOffscreenRenderer`, `shouldDisableRiveListeners`。

### `RiveResetParameters`

`rive.reset()` 用。`artboard`, `animations`, `stateMachines`, `autoplay`, `autoBind`。

### `RiveFileParameters`

`new RiveFile()` 用。`src`, `buffer`, `assetLoader`, `enableRiveAssetCDN`, `onLoad`, `onLoadError`, `enablePerfMarks`。

### `LayoutParameters`

`fit`, `alignment`, `layoutScaleFactor`, `minX`, `minY`, `maxX`, `maxY`（すべて省略可）。

### `Event` / `LoopEvent`

```ts
interface Event {
  type: EventType;
  data?: string | string[] | LoopEvent | number | RiveEventPayload | RiveFile;
}
interface LoopEvent {
  animation: string;
  type: LoopType;
}
```

### コールバック型

```ts
type EventCallback = (event: Event) => void;
type AssetLoadCallback = (asset: FileAsset, bytes: Uint8Array) => Boolean;
type FPSCallback = (fps: number) => void;
type VoidCallback = () => void;
type RuntimeCallback = (rive: RiveCanvas) => void;
type Bounds = rc.AABB;
type RiveEventPayload = rc.RiveEvent | rc.OpenUrlEvent;
```

### ファイル内容構造

```ts
interface RiveFileContents {
  artboards?: ArtboardContents[];
}
interface ArtboardContents {
  name: string;
  animations: string[];
  stateMachines: StateMachineContents[];
}
interface StateMachineContents {
  name: string;
  inputs: StateMachineInputContents[];
}
interface StateMachineInputContents {
  name: string;
  type: StateMachineInputType;
  initialValue?: boolean | number;
}
```

---

## ユーティリティ関数

ランタイムが管理するアセットを手動でデコードする関数。返ったオブジェクトは使用後 `.unref()` を呼んで解放する必要がある。

```ts
const decodeAudio: (bytes: Uint8Array) => Promise<rc.Audio>;
const decodeImage: (bytes: Uint8Array) => Promise<rc.Image>;
const decodeFont:  (bytes: Uint8Array) => Promise<rc.Font>;
```

例：

```ts
import { decodeImage } from "@rive-app/canvas";

const bytes = new Uint8Array(await fetch("/img.png").then(r => r.arrayBuffer()));
const image = await decodeImage(bytes);
// ...使用後...
image.unref();
```

---

## アセットローダーの利用例

`enableRiveAssetCDN: false` に設定して、CDNではなく自前でアセットを供給する場合:

```ts
const rive = new Rive({
  src: "scene.riv",
  canvas,
  enableRiveAssetCDN: false,
  assetLoader: (asset, bytes) => {
    if (asset.isImage) {
      fetch(`/assets/${asset.name}`).then(async (res) => {
        const buf = new Uint8Array(await res.arrayBuffer());
        const image = await decodeImage(buf);
        (asset as any).setRenderImage(image);
        image.unref();
      });
      return true; // ローダーが処理することを示す
    }
    return false;
  },
});
```

---

## イベント購読パターン

```ts
import { EventType } from "@rive-app/canvas";

rive.on(EventType.Load, () => console.log("loaded"));
rive.on(EventType.StateChange, (e) => console.log("state:", e.data));
rive.on(EventType.RiveEvent, (e) => {
  const payload = e.data as RiveEventPayload;
  // payload.name, payload.properties など
});
```

---

## 注意点・ベストプラクティス

- `getArtboard()` は非推奨。安定性とメモリ管理のため `getBindableArtboard()` を使う。
- 小文字コールバック（`onload` 等）は非推奨。キャメルケース（`onLoad`）を使う。
- `cleanup()` 呼び出し後、同じ `Rive` インスタンスは再利用できない。新規生成が必要。
- `Layout` はイミュータブル。差し替えは新インスタンスを生成して `rive.layout` に代入する。
- WASMのURLは `RuntimeLoader.setWasmUrl()` で上書き可能（オフライン環境やセルフホスト時）。
- `resizeDrawingSurfaceToCanvas()` を使用する場合は `artboardWidth` / `artboardHeight` / `devicePixelRatioUsed` を手動設定しない（自動管理される）。
- 複数キャンバスで同一.rivを共有する場合は `RiveFile` を使い、各 `Rive` の `riveFile` パラメータに渡す。

---

## テスト用エクスポート

```ts
export const Testing: {
  EventManager: typeof EventManager;
  TaskQueueManager: typeof TaskQueueManager;
};
```

内部クラスへのアクセスを提供（テスト用途）。
