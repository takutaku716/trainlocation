# Cloudflare Pages + Functions + Workers KV setup

この構成では、サイト本体はCloudflare Pagesで配信し、`mainte`配下のJSONだけWorkers KVから読み書きします。

## 1. Pages projectを作成

1. Cloudflare dashboardで **Workers & Pages** を開く
2. **Pages** からGitHubリポジトリを接続
3. Build commandは空欄
4. Build output directoryは `/` または未指定

## 2. KV namespaceを作成

1. **Workers & Pages** > **KV** を開く
2. namespaceを作成
3. 名前例: `TRAINLOCATION_MAINTE`

## 3. Pages FunctionsへKVを紐付け

Pages projectの **Settings** > **Functions** > **KV namespace bindings** で追加します。

| Variable name | KV namespace |
| --- | --- |
| `MAINTE_KV` | `TRAINLOCATION_MAINTE` |

## 4. 管理ログイン情報を設定

Pages projectの **Settings** > **Environment variables** に追加します。

| Variable name | Value |
| --- | --- |
| `ADMIN_BASIC_USER` | 管理画面のユーザー名 |
| `ADMIN_BASIC_PASSWORD` | 管理画面のパスワード |

`/admin.html` と `/api/admin/*` はログインフォームとCookieで保護されます。

## 5. 初回データ投入

デプロイ後、次のURLを開きます。

```text
https://<your-pages-domain>/admin.html
```

1. ログイン画面で `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASSWORD` を入力
2. `location_maintenance.json` を読み込み
3. 内容を確認して保存
4. `rosen_maintenance.json` も同じように保存

KVにまだデータが無い場合、管理画面は静的ファイル `./mainte/*.json` を初期値として読み込みます。保存するとKVへ登録されます。

## 6. 公開側の読み込み

Cloudflare Pages上では次を優先して読み込みます。

```text
/api/mainte/location_maintenance.json
/api/mainte/rosen_maintenance.json
```

GitHub Pages上ではCloudflare Pagesの公開APIを読み込みます。

```text
https://trainlocation.pages.dev/api/mainte/location_maintenance.json
https://trainlocation.pages.dev/api/mainte/rosen_maintenance.json
```

ローカル表示では従来通り次へフォールバックします。

```text
./mainte/location_maintenance.json
./mainte/rosen_maintenance.json
```

## 7. 注意

- `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASSWORD` はHTMLやJSへ直接書かないでください。
- ログイン状態はHttpOnly Cookieで保持されます。共有端末では利用後にログアウトしてください。
- 公開APIは30秒キャッシュします。反映を即時確認したい場合はページを再読み込みしてください。
- 公開APIはGitHub Pagesから参照できるようにCORSを許可しています。
