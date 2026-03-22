# ShareCost

姉妹2人暮らし向けの共同生活費管理Webアプリです。  
Next.js + TypeScript + Tailwind CSS + Supabase で構成しています。

## 1. セットアップ

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` に Supabase の URL と Anon Key を設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Supabase SQL Editor で [supabase/schema.sql](./supabase/schema.sql) を実行します。

## 2. 開発サーバー起動

```bash
npm run dev
```

`http://localhost:3000` を開きます。

## 3. MVP機能

- 支出追加
- 支出一覧（編集・削除）
- 月別フィルタ
- 月次精算結果の自動計算
- スマホ向け下部ナビゲーション
- 新規登録時の支払者名設定（支払者表示に反映）
- DB接続チェック画面（`/settings`）
- 月次精算の確定 / 解除（確定月は編集ロック）
- 支出一覧CSVエクスポート
- Supabase Auth（ログイン / 新規登録）

## 4. 画面

- `/` ダッシュボード
- `/expenses/add` 支出追加
- `/expenses` 支出一覧
- `/settlement` 月次精算
- `/settings` 設定・DB接続確認
- `/auth` ログイン/新規登録

## 5. 精算ロジック

1. `is_settlement_target = true` の支出のみ集計対象
2. 合計を2人で均等割り
3. 各自の支払額との差分を算出
4. 差分に応じて「誰が誰にいくら払うか」を表示

## 6. 追加手順（Step 9〜13）

1. Supabase SQL Editor で `supabase/schema.sql` を再実行（`monthly_settlements` / `profiles` 追加 + 旧anon許可ポリシー削除）
2. `/auth` で2人分のメールアカウントを作成し、各ユーザーの「支払者名」を設定（支払者区分は自動割り当て）
3. ログイン後、`/settings` で DB接続チェックを実行
4. `/settlement` で月次精算を確定すると、その月は `/expenses` で編集・削除できなくなります
5. `/expenses` の CSV出力ボタンで月次データをダウンロードできます
