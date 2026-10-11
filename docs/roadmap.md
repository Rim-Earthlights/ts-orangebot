# 作業指針 (ロードマップ)

`docs/migration-proposal.md` (フェーズ計画) と `docs/issues.md` (課題一覧) を踏まえ、「すぐ着手できて効果が大きいものから順に片付ける」ための作業順序をまとめる。

## 1. 現状 (2026-10-11 時点)

| 項目 | 状態 |
|---|---|
| Phase 1 モノレポ基盤 | 完了 |
| Phase 2 サービス層 | サービス切り出しは完了。排他制御・エラー型共通化・bot のテストが残り |
| Phase 3〜5 (API / front / Docker・CI) | 未着手 |
| ビルド (`pnpm build`) | 通る。ただし `config.ts` は gitignore 対象のため、新規 clone では `config.template.ts` をコピーしないと失敗する |
| lint (`pnpm lint`) | 通る。対象は全パッケージ (Step 0 で拡大) |
| テスト | shared のユニット 111 件・インテグレーション 16 件 (テスト用 DB が必要) が通る。bot / speak は 0 件 |
| CI | GitHub Actions で build / lint / unit / integration を実行 (Step 0 で追加) |

## 2. 基本方針

1. **Bot の稼働を最優先で守る** — 1 つの変更は 1 つの課題に絞り、小さな PR に分ける
2. **確認してからマージする** — 各 PR で `pnpm build` / `pnpm lint` / `pnpm test` を通し、起動まわりの変更は `pnpm smoke-test` も通す
3. **作り直す予定の箇所には手をかけすぎない** — Express のコントローラ (`packages/bot/src/controller/`) は Phase 3 で Fastify の API に置き換える前提。今は最低限の安全対策にとどめる
4. **直したらドキュメントも直す** — 課題を解決したら同じ PR で `docs/issues.md` の該当項目を更新する

## 3. 作業順序

### Step 0: 作業基盤 — 以降の変更を安全にする ✅ 完了

| 作業 | 内容 |
|---|---|
| CI の追加 | GitHub Actions で install → テンプレートから `config.ts` を生成 → build → lint → unit test |
| lint 対象の拡大 | shared / speak も `pnpm lint` の対象にする (違反が多ければ別 PR で修正) |

### Step 1: 安定性の底上げ — 小さく効果が大きい (bot の `app.ts` 中心) ✅ 完了

| 課題 | 内容 |
|---|---|
| #3 未 await | ready イベント内のサーバー登録ループ・コマンド登録ループを `Promise.all()` で待つ |
| #7 例外処理 | 各イベントハンドラのトップレベルに try/catch を入れる。DB 初期化に失敗したらプロセスを終了する |
| #11 終了処理 | `SIGTERM` / `SIGINT` で `dataSource.destroy()` と `client.destroy()` を実行する |
| #17 設定検証 | 起動時に必須の設定値 (Discord Token、DB 接続情報など) を確認し、不足していれば分かりやすいエラーで終了する |

speak の `app.ts` にも同じ対応を入れた。共通処理は `@orangebot/shared` の `common/process.ts` にまとめている。

### Step 2: 掃除 — 不要物を減らして後続作業を楽にする

| 課題 | 内容 |
|---|---|
| #21 デッドコード | 空ファイル (`bot/request/openai.ts`, `spotify.ts`)、未登録の `spotifyRouter.ts`、未使用の設定キー、呼ばれないハンドラ (`dall` / `custom` / `g3` / `g4`) を削除する |
| #16 依存関係 | 未使用依存を削除し、shared に `mysql2` を追加し、開発用ツールを `devDependencies` へ移す。その後 `shamefully-hoist` の解除を試す |

### Step 3: 設定の集約

| 課題 | 内容 |
|---|---|
| #6 ID 直書き | チャンネル ID / ギルド ID / 読み上げ Bot の ID と URI を設定ファイルに移す。speak 呼び出しの定数は 1 箇所にまとめる |
| #20 環境別設定 | `NODE_ENV` などで開発用と本番用の設定を切り替えられるようにする |

### Step 4: Phase 2 の残り

| 課題 | 内容 |
|---|---|
| #4 bot のテスト | アダプタ層 → ハンドラ層の順にユニットテストを書く |
| エラー型の共通化 | `NotFoundError` などのドメインエラーを shared に定義する |
| DB の排他制御 | ガチャなど同時に書き込まれる処理にトランザクションやロックを入れる |
| #18 / #19 | ソフトデリートの連動、非 FK カラムへのインデックス追加 |

### Step 5: Phase 3 (API サーバー新設) へ進む

認証 (#1)・入力値チェック (#8)・CORS (#9) は、新 API サーバーで根本的に解決する。

## 4. 先に決めておきたいこと

- **HTTP エンドポイント (#1) の暫定対策** — 現在は `0.0.0.0:4000` で待ち受けていて認証も無い。外部から使っていなければ、`127.0.0.1` に限定するだけで当面の危険はほぼ無くなる。外部から使っているなら、簡易な API キーでの認証を入れる
- **デッドコードの扱い** — `dall` / `custom` / `g3` / `g4` / `spotifyRouter` を今後使う予定があるか
- **CI に GitHub Actions を使ってよいか**
