# Rive Web Runtime ユーザーマニュアル

基礎から実用パターンまでをまとめたレシピ集。

---

## 目次

### 基礎編

1. [Hello World — 最小構成](#1-hello-world--最小構成)
2. [ファイルの内容を確認する](#2-ファイルの内容を確認する)
3. [アートボードとステートマシンの選択](#3-アートボードとステートマシンの選択)
4. [ViewModel（モデル定義）の取得](#4-viewmodelモデル定義の取得)
5. [ViewModelInstance（実体）の生成](#5-viewmodelinstance実体の生成)
6. [インスタンスのアタッチ（バインド）](#6-インスタンスのアタッチバインド)
7. [プロパティの読み書き](#7-プロパティの読み書き)
8. [起動シーケンスのまとめ](#8-起動シーケンスのまとめ)

### 応用編（レシピ集）

9. [リストにインスタンスを追加する](#9-リストにインスタンスを追加する)
10. [リスト項目のタッチイベントを取得する（VM経由）](#10-リスト項目のタッチイベントを取得するvm経由)
11. [動的な並び替えに強いインデックス管理](#11-動的な並び替えに強いインデックス管理)
12. [プロパティ変更を監視する](#12-プロパティ変更を監視する)
13. [リストの並び替え・削除・走査](#13-リストの並び替え削除走査)
14. [色プロパティの操作](#14-色プロパティの操作)
15. [Enumプロパティの操作](#15-enumプロパティの操作)
16. [ネストされたViewModelへのアクセス](#16-ネストされたviewmodelへのアクセス)
17. [ネストされたViewModelの差し替え](#17-ネストされたviewmodelの差し替え)
18. [画像・アートボードプロパティの差し替え](#18-画像アートボードプロパティの差し替え)
19. [同じ.rivを複数キャンバスで共有する](#19-同じrivを複数キャンバスで共有する)
20. [レスポンシブ対応](#20-レスポンシブ対応)
21. [ライフサイクル管理とクリーンアップ](#21-ライフサイクル管理とクリーンアップ)
22. [カスタムアセットローダ](#22-カスタムアセットローダ)
23. [パフォーマンス最適化](#23-パフォーマンス最適化)
24. [State Machine 入力との併用](#24-state-machine-入力との併用)
25. [テキストRunの動的更新](#25-テキストrunの動的更新)

[付録: よくあるハマりどころ](#付録-よくあるハマりどころ)

---

# 基礎編

## 1. Hello World — 最小構成

```ts
import { Rive, Layout, Fit, Alignment } from "@rive-app/canvas";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const rive = new Rive({
  src: "scene.riv",
  canvas,
  autoplay: true,
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  onLoad: () => {
    rive.resizeDrawingSurfaceToCanvas();
  },
});
```

ポイント:

- `src` で .riv ファイル URL を指定。`buffer: ArrayBuffer` で直接渡すこともできる。
- `canvas` は描画先の `HTMLCanvasElement`（または `OffscreenCanvas`）。
- **`onLoad` でファイル読み込み完了を検知**する。ViewModel・StateMachine・テキストRun などの操作は **すべて `onLoad` 後** に行う。前に呼ぶと `null` が返る。
- `resizeDrawingSurfaceToCanvas()` は DPR を考慮してキャンバスの実描画解像度を上げる定型処理。

---

## 2. ファイルの内容を確認する

何が入っているかを把握しないと操作のしようがない。開発中はまずこれを出力する:

```ts
rive.on(EventType.Load, () => {
  console.log(rive.contents);
  // {
  //   artboards: [
  //     {
  //       name: "Main",
  //       animations: ["idle", "hover"],
  //       stateMachines: [
  //         { name: "State Machine 1", inputs: [{ name: "isHovered", type: 59, ... }] }
  //       ]
  //     }
  //   ]
  // }

  console.log("active artboard:", rive.activeArtboard);
  console.log("animations:",      rive.animationNames);
  console.log("state machines:",  rive.stateMachineNames);

  console.log("VM count:", rive.viewModelCount);
  for (let i = 0; i < rive.viewModelCount; i++) {
    const vm = rive.viewModelByIndex(i)!;
    console.log(`VM[${i}]:`, vm.name, "props:", vm.properties);
  }

  console.log("enums:", rive.enums().map(e => `${e.name} = [${e.values.join(", ")}]`));
});
```

---

## 3. アートボードとステートマシンの選択

### 起動時に指定

```ts
new Rive({
  src: "scene.riv",
  canvas,
  artboard: "Card",                  // アートボード名（省略時はデフォルト）
  stateMachines: "State Machine 1", // 単一名 または string[]
  // または
  // animations: ["idle", "blink"],
  autoplay: true,
});
```

### 後から切り替え

別ファイルを読み込み:

```ts
rive.load({
  src: "other.riv",
  artboard: "OtherArtboard",
  stateMachines: "SM",
  autoplay: true,
});
```

同じファイル内でアートボードだけ切り替え:

```ts
rive.reset({
  artboard: "Card2",
  stateMachines: "SM",
  autoplay: true,
});
```

---

## 4. ViewModel（モデル定義）の取得

ViewModel は **「型の定義」**。これ自体は値を持たない。実体を作るための雛形。

```ts
// (a) 名前で取得（推奨）
const userVM = rive.viewModelByName("User");

// (b) インデックスで取得
const firstVM = rive.viewModelByIndex(0);

// (c) 現在のアートボードに紐づくデフォルトViewModelを取得
const defaultVM = rive.defaultViewModel();
```

ViewModel の情報を見る:

```ts
console.log(userVM?.name);            // "User"
console.log(userVM?.instanceCount);   // エディタ側で定義されたインスタンス数
console.log(userVM?.instanceNames);   // ["Default", "Admin", "Guest"]
console.log(userVM?.properties);      // プロパティ一覧（型情報込み）
```

> 注意: `viewModelByName()` は `onLoad` 完了後に呼ぶ。ファイル読み込み前は `null`。

---

## 5. ViewModelInstance（実体）の生成

ViewModel から実体（インスタンス）を作る方法は4通り:

```ts
// (a) エディタで設定したデフォルトの初期値で生成
const inst = userVM.defaultInstance();

// (b) エディタで作成した名前付きインスタンスを使う（例: "Admin" バリアント）
const adminInst = userVM.instanceByName("Admin");

// (c) インデックスで取得
const inst0 = userVM.instanceByIndex(0);

// (d) 空のインスタンスを新規生成（プロパティはデフォルト値で初期化）
const blank = userVM.instance();
```

使い分けの目安:

| ケース | 推奨メソッド |
|---|---|
| 普通に1つ使いたい | `defaultInstance()` |
| エディタ側で複数バリエーション（Admin/Guest など）を用意している | `instanceByName(name)` |
| 動的にリスト要素を増やす（応用編§9） | `instance()` を毎回呼んで値を設定 |

> `ViewModel` は雛形、`ViewModelInstance` は実体。両者の役割を混同しないこと。

---

## 6. インスタンスのアタッチ（バインド）

生成しただけでは画面に反映されない。**アートボードにバインドして初めて値が反映される。**

### 手動バインド

```ts
const userVM = rive.defaultViewModel()!;
const user   = userVM.defaultInstance()!;

rive.bindViewModelInstance(user);   // ★ ここでアタッチ
```

これ以降、`user` のプロパティを変更するとアートボードに反映される。

バインド解除:

```ts
rive.bindViewModelInstance(null);
```

### 自動バインド（autoBind）

「デフォルトViewModel のデフォルトインスタンスをそのままバインドしたい」場合は `autoBind: true` で1行省略できる:

```ts
new Rive({
  src: "scene.riv",
  canvas,
  autoplay: true,
  autoBind: true,    // ★ デフォルトVMのデフォルトインスタンスを自動でバインド
  onLoad: () => {
    // バインド済みのインスタンスは onLoad 以降取れる
    const inst = rive.viewModelInstance!;
    inst.string("title")!.value = "Hello";
  },
});
```

| パターン | `autoBind` | 用途 |
|---|---|---|
| デフォルトのものを使うだけ | `true` | シンプルなケース |
| 名前付きインスタンス・空インスタンスを使いたい | `false` + 手動 `bindViewModelInstance()` | カスタマイズが必要なケース |

---

## 7. プロパティの読み書き

バインド後は、型ごとのアクセサでプロパティを取得して `.value` で読み書きする。

```ts
const inst = rive.viewModelInstance!;

// String
inst.string("title")!.value = "こんにちは";
console.log(inst.string("title")!.value);

// Number
inst.number("score")!.value = 100;

// Boolean
inst.boolean("isActive")!.value = true;

// Color（詳しくは応用編§14）
inst.color("accent")!.rgb(255, 128, 0);

// Enum
inst.enum("theme")!.value = "dark";

// Trigger（発火）
inst.trigger("doShake")!.trigger();
```

### プロパティ取得メソッド早見表

| メソッド | 戻り値の型 |
|---|---|
| `string(path)` | `ViewModelInstanceString \| null` |
| `number(path)` | `ViewModelInstanceNumber \| null` |
| `boolean(path)` | `ViewModelInstanceBoolean \| null` |
| `color(path)` | `ViewModelInstanceColor \| null` |
| `enum(path)` | `ViewModelInstanceEnum \| null` |
| `trigger(path)` | `ViewModelInstanceTrigger \| null` |
| `list(path)` | `ViewModelInstanceList \| null` |
| `image(path)` | `ViewModelInstanceAssetImage \| null` |
| `artboard(path)` | `ViewModelInstanceArtboard \| null` |
| `viewModel(path)` | `ViewModelInstance \| null`（ネスト） |

### 存在チェック

存在しないプロパティ名を渡すと `null` が返る。開発中は明示的にチェックすると壊れにくい:

```ts
const title = inst.string("title");
if (!title) {
  console.warn("title プロパティが見つかりません");
} else {
  title.value = "新しい値";
}
```

> 型の判定や一覧は `inst.properties` でも取得できる（`{ name, type }[]`）。

---

## 8. 起動シーケンスのまとめ

ここまでをまとめると、典型的なシーケンスは以下:

```ts
import { Rive, Layout, Fit, Alignment, EventType } from "@rive-app/canvas";

const rive = new Rive({
  src: "scene.riv",
  canvas: document.getElementById("canvas") as HTMLCanvasElement,
  autoplay: true,
  stateMachines: "State Machine 1",
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  onLoad: () => {
    // ① 描画サイズ調整
    rive.resizeDrawingSurfaceToCanvas();

    // ② ViewModel取得
    const vm = rive.defaultViewModel()!;

    // ③ インスタンス生成
    const inst = vm.defaultInstance()!;

    // ④ アタッチ
    rive.bindViewModelInstance(inst);

    // ⑤ 初期値設定
    inst.string("title")!.value = "Welcome";
    inst.number("score")!.value = 0;

    // ⑥ イベント購読（VM経由）
    inst.trigger("onSubmit")?.on(() => {
      console.log("submitted, score =", inst.number("score")!.value);
    });
  },
});
```

以降の「応用編」では、すべての例で **`onLoad` 内で実行している前提** とする。

---

# 応用編（レシピ集）

## 9. リストにインスタンスを追加する

各アイテムの ViewModel（例: `ListItem`）の **空インスタンスを生成 → プロパティを設定 → list に追加** の順で行う。

```ts
// ルートVMを取得してバインド（基礎編§6）
const root = rive.defaultViewModel()!.defaultInstance()!;
rive.bindViewModelInstance(root);

// リストプロパティを取得
const list = root.list("items")!;

// アイテム用ViewModel
const itemVM = rive.viewModelByName("ListItem")!;

// 投入するデータ
const data = [
  { title: "Apple",  price: 100, isFavorite: true  },
  { title: "Banana", price: 80,  isFavorite: false },
  { title: "Cherry", price: 300, isFavorite: false },
];

for (const d of data) {
  const item = itemVM.instance();                     // ① 空インスタンス生成
  item.string("title")!.value       = d.title;        // ② パラメータを設定
  item.number("price")!.value       = d.price;
  item.boolean("isFavorite")!.value = d.isFavorite;
  list.addInstance(item);                             // ③ リストに追加
}
```

ポイント:

- `itemVM.instance()` は**空のインスタンス**を返す。`defaultInstance()` を使うとエディタで設定した初期値付きのインスタンスを返すので、ベースを使い回したい場合はそちら。
- パラメータ設定は `addInstance()` の前でも後でも反映されるが、**追加前にやっておくと「初期表示で空のまま一瞬見える」事故を防げる**。
- 特定位置に挿入: `list.addInstanceAt(item, index)`。

---

## 10. リスト項目のタッチイベントを取得する（VM経由）

`rive.on(EventType.RiveEvent, ...)` を使わず、**各アイテムのViewModelに用意したTriggerプロパティ**を購読する方式。

### Rive側の準備（エディタ作業）

1. `ListItem` ViewModel に `tapped: Trigger` プロパティを追加。
2. アイテムのアートボード内に Rive Listener を配置し、`Pointer Down`（または `Click`）で `tapped` トリガーを発火させる。

### JS側の実装

```ts
const list   = root.list("items")!;
const itemVM = rive.viewModelByName("ListItem")!;

const data = [
  { title: "Apple",  price: 100 },
  { title: "Banana", price: 80  },
  { title: "Cherry", price: 300 },
];

data.forEach((d, index) => {
  const item = itemVM.instance();
  item.string("title")!.value = d.title;
  item.number("price")!.value = d.price;

  // ★ Triggerに購読。indexはクロージャで保持
  item.trigger("tapped")?.on(() => {
    console.log(`item ${index} tapped:`, d.title);
    // ここで自前の状態更新やルーティング処理
  });

  list.addInstance(item);
});
```

ポイント:

- `.on()` のコールバックは `(event: Event) => void` だが、トリガー型では発火タイミングだけ知れば十分なので引数は無視してよい。
- **値の取得が必要な場合（Number/String/Booleanの変更通知など）は、コールバック内でプロパティの `.value` を読む**（§12参照）。
- Trigger は発火後リセットされるので、同じトリガーを何度でも受け取れる。

### 解除（アイテム削除時など）

`.on()` で登録したコールバックは `.off(cb)` で個別解除できる。残したい場合はリファレンスを保持しておく:

```ts
const cb = () => { /* ... */ };
item.trigger("tapped")?.on(cb);
// 後で:
item.trigger("tapped")?.off(cb);
```

---

## 11. 動的な並び替えに強いインデックス管理

§10 のクロージャ方式は、**リストの並び替えや途中挿入を行うと「クロージャ内の `index` がズレる」**という弱点がある。実用上は、各アイテムに安定IDを持たせるのが堅い。

### 推奨パターン

`ListItem` VM に `id: Number` プロパティを追加しておく（Riveエディタ側）。

```ts
let nextId = 0;
const idMap = new Map<number, { data: ItemData; cb: () => void }>();

function append(d: ItemData) {
  const id = nextId++;

  const item = itemVM.instance();
  item.number("id")!.value    = id;
  item.string("title")!.value = d.title;
  item.number("price")!.value = d.price;

  const cb = () => {
    const currentIndex = findIndexById(id);
    console.log("tapped id =", id, "currentIndex =", currentIndex, "data =", d);
  };
  item.trigger("tapped")?.on(cb);
  idMap.set(id, { data: d, cb });

  list.addInstance(item);
}

function findIndexById(id: number): number {
  for (let i = 0; i < list.length; i++) {
    if (list.instanceAt(i)?.number("id")?.value === id) return i;
  }
  return -1;
}

function removeById(id: number) {
  const i = findIndexById(id);
  if (i >= 0) list.removeInstanceAt(i);
  idMap.delete(id);
}
```

これなら `list.swap()` や `list.addInstanceAt()` で順序が変わっても、コールバックは常に正しいIDを返す。

---

## 12. プロパティ変更を監視する

Rive側の入力ウィジェット（テキストボックス、スライダー、トグルなど）の値変化をJSで受け取る。

```ts
const name = root.string("userName")!;
name.on(() => {
  // ★ 引数は使わず .value を読む
  console.log("userName changed:", name.value);
});

const volume = root.number("volume")!;
volume.on(() => console.log("volume:", volume.value));

const enabled = root.boolean("enabled")!;
enabled.on(() => console.log("enabled:", enabled.value));
```

Enum の場合も同様:

```ts
const theme = root.enum("theme")!;
theme.on(() => console.log("theme:", theme.value, "/ index:", theme.valueIndex));
```

> コールバックは値が**実際に変化したフレーム**で呼ばれる。同じ値を再設定しても通常は発火しない。

---

## 13. リストの並び替え・削除・走査

```ts
const list = root.list("items")!;

list.length;                  // 件数
list.instanceAt(0);           // インデックスでインスタンス取得
list.addInstance(item);       // 末尾に追加
list.addInstanceAt(item, 0);  // 先頭に挿入
list.swap(0, 2);              // 入れ替え
list.removeInstanceAt(1);     // 位置で削除
list.removeInstance(item);    // 参照で削除

// 全走査
for (let i = 0; i < list.length; i++) {
  const inst = list.instanceAt(i);
  console.log(i, inst?.string("title")?.value);
}
```

---

## 14. 色プロパティの操作

```ts
const accent = root.color("accent")!;

accent.rgb(255, 128, 0);            // R, G, B
accent.rgba(255, 128, 0, 200);      // R, G, B, A (0-255)
accent.argb(255, 0, 128, 255);      // A, R, G, B
accent.alpha(128);                  // αのみ更新 (0-255)
accent.opacity(0.5);                // 不透明度 (0.0-1.0)

console.log(accent.value);          // 数値 (ARGB packed)
```

---

## 15. Enumプロパティの操作

```ts
const theme = root.enum("theme")!;
console.log(theme.values);   // ["light", "dark", "highContrast"]
theme.value = "dark";        // 名前で設定
theme.valueIndex = 1;        // インデックスで設定
```

ファイルに定義されている全 Enum の一覧:

```ts
rive.enums().forEach(e => console.log(e.name, e.values));
```

---

## 16. ネストされたViewModelへのアクセス

スラッシュ区切りで深い階層へ直接アクセスできる。

```ts
root.string("user/profile/name")!.value = "Alice";
root.number("settings/audio/volume")!.value = 0.7;
```

中間ノードのVMを取得して操作することもできる:

```ts
const profile = root.viewModel("user/profile")!;
profile.string("name")!.value  = "Alice";
profile.string("email")!.value = "alice@example.com";
```

---

## 17. ネストされたViewModelの差し替え

ネストされた ViewModel プロパティを、別の ViewModelInstance で丸ごと置き換える。

```ts
const themeVM   = rive.viewModelByName("Theme")!;
const darkTheme = themeVM.instanceByName("Dark")!;

root.replaceViewModel("theme", darkTheme);
```

これでルートにバインドされている `theme` 配下が `Dark` インスタンスの値で一括反映される。

> 用途例: ライト/ダーク切替、ロケール切替、A/Bテストのプリセット切替。

---

## 18. 画像・アートボードプロパティの差し替え

### 画像

```ts
import { decodeImage } from "@rive-app/canvas";

const bytes = new Uint8Array(await fetch("/photo.png").then(r => r.arrayBuffer()));
const image = await decodeImage(bytes);

root.image("avatar")!.value = image;

image.unref(); // ランタイムが内部参照を持つので、JS側の参照は解放してOK
```

### アートボード（コンポーネント差し替え）

```ts
// RiveFile から「バインド可能なアートボード」を取り出す
const cardV2 = riveFile.getBindableArtboard("Card_v2")!;
root.artboard("contentSlot")!.value = cardV2;
```

> `getArtboard()` は非推奨。**必ず `getBindableArtboard()` を使う**。

---

## 19. 同じ.rivを複数キャンバスで共有する

ファイルのパースは重いので、複数の `Rive` インスタンスで共有する。

```ts
import { RiveFile } from "@rive-app/canvas";

const file = new RiveFile({ src: "shared.riv" });
await file.init();

[canvasA, canvasB, canvasC].forEach((canvas) => {
  new Rive({
    riveFile: file,             // ★ src/buffer の代わりに riveFile を渡す
    canvas,
    autoplay: true,
    autoBind: true,
    stateMachines: "State Machine 1",
  });
});

// すべての Rive インスタンスを cleanup した後に
file.cleanup();
```

---

## 20. レスポンシブ対応

```ts
function onResize() {
  rive.resizeDrawingSurfaceToCanvas();
}

window.addEventListener("resize", onResize);

// `Fit.Layout` を使うと、アートボードサイズがキャンバスに追従する
rive.layout = new Layout({ fit: Fit.Layout, alignment: Alignment.Center });
```

> `Fit.Layout` 使用時は `artboardWidth` / `artboardHeight` を手動で設定しないこと（自動で管理される）。

---

## 21. ライフサイクル管理とクリーンアップ

SPA でビューを離脱するときは必ず破棄する。漏れるとWasm側のメモリがリークする。

```ts
function destroy() {
  window.removeEventListener("resize", onResize);

  // 個別に登録したVM購読を解除（残しておくとリーク）
  trigger.off(cb);
  numberProp.off(numberCb);

  // 必要なら ViewModelInstance も明示的に解放
  root.cleanup();

  // Rive 全体を破棄
  rive.cleanup();
}
```

注意:

- `rive.cleanup()` 後は同じインスタンスを再利用できない。再描画したい場合は **`new Rive(...)`** で作り直す。
- 一時的に画面外に行くだけなら `rive.stopRendering()` のほうが軽い。

---

## 22. カスタムアセットローダ

CDN を切って自前で画像・フォント・音声を供給する。

```ts
new Rive({
  src: "scene.riv",
  canvas,
  enableRiveAssetCDN: false,        // ★ CDNを無効化
  assetLoader: (asset, bytes) => {
    if (asset.isImage && asset.name === "hero.png") {
      fetch(`/my-cdn/${asset.name}`).then(async (res) => {
        const buf = new Uint8Array(await res.arrayBuffer());
        const img = await decodeImage(buf);
        (asset as any).setRenderImage(img);
        img.unref();
      });
      return true;   // このアセットは自分が処理する
    }
    return false;    // それ以外は埋め込みデフォルトを使う
  },
});
```

---

## 23. パフォーマンス最適化

```ts
import { DrawOptimizationOptions } from "@rive-app/canvas";

new Rive({
  // ...
  drawingOptions: DrawOptimizationOptions.DrawOnChanged, // 変更時のみ描画
  enablePerfMarks: true,                                  // performance.mark を出力
});

// 画面外に出たら停止
const io = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) rive.startRendering();
  else                  rive.stopRendering();
});
io.observe(canvas);
```

`enablePerfMarks: true` を有効化すると、Chrome DevTools の Performance タブで Rive の初期化・初期数フレームの計測ができる。

---

## 24. State Machine 入力との併用

VM とは別に、従来の SM 入力も使える。

```ts
const inputs = rive.stateMachineInputs("State Machine 1");
const isHover = inputs.find((i) => i.name === "isHovered")!;
isHover.value = true;

const doShake = inputs.find((i) => i.name === "doShake")!;
doShake.fire();
```

ネストされた SM 入力（ネストアートボードの中など）にはパス指定でアクセス:

```ts
rive.setBooleanStateAtPath("isOpen", true,  "card/menu");
rive.setNumberStateAtPath ("level",  3,     "stats");
rive.fireStateAtPath      ("doShake",       "header");
```

---

## 25. テキストRunの動的更新

VM を使わないシンプルなテキスト差し替え。

```ts
rive.setTextRunValue("greeting", "こんにちは、Alice");
const cur = rive.getTextRunValue("greeting");

// ネストアートボードの中のテキスト
rive.setTextRunValueAtPath("title", "新しいタイトル", "card/header");
const t = rive.getTextRunValueAtPath("title", "card/header");
```

---

## 付録: よくあるハマりどころ

| 症状 | 原因と対策 |
|---|---|
| `viewModelByName()` が `null` | `onLoad` 完了前に呼んでいる。読み込み完了後に実行する。 |
| `root.list("items")` が `null` | プロパティ名のタイポか、`bindViewModelInstance()` を呼ぶ前。 |
| 値を設定したのに画面が変わらない | インスタンスを `bindViewModelInstance()` でアタッチしていない。バインドしていないインスタンスへの変更はどこにも反映されない。 |
| Trigger の `.on()` が発火しない | アートボード側でTriggerが本当に発火しているか、Rive Listener の設定を確認。`rive.on(EventType.RiveEvent, ...)` で全イベントを覗くと診断しやすい。 |
| リストの index がズレる | 並び替え・挿入があるなら、index ではなく**安定IDをVMプロパティに格納**して走査検索する（§11）。 |
| メモリリーク | `.on()` で登録したコールバック、`window.addEventListener` のリスナー、`rive.cleanup()` の呼び忘れがないか確認。 |
| 画像が `image.unref()` 後に黒くなる | `setRenderImage()` 等にセットする**前**に unref している。セット後に unref する。 |
| 複数Riveでファイル使い回したい | `RiveFile` を使う（§19）。`src` を毎回渡すとパースが何度も走る。 |
| `autoBind: true` なのに `viewModelInstance` が `null` | `onLoad` 完了前に参照している。`onLoad` の中で取得する。 |
