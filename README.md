## Coco Export Management System

スリランカ → 日本向けのココピート輸出における **Order / Shipment / Task / Payment / Documents** を管理する
社内用Webアプリです。Next.js(App Router) + Supabase(Postgres/Auth/Storage) で構成されています。

### 動作環境

- Node.js: `v24.14.0`（`.nvmrc` で固定）
- npm: v11 以上
- Supabase プロジェクト（Postgres + Auth + Storage 有効）

---

## 1. 初期セットアップ

### 1-1. Node.js の準備

```bash
# プロジェクトルート（このREADMEがあるディレクトリ）で
nvm use
```

`.nvmrc` を参照して Node v24.14.0 が有効になります。

**nvm コマンドがない場合**

```bash
# nvm インストール（公式手順の一例）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
source "$HOME/.nvm/nvm.sh"
nvm install 24
cd path/to/coco-export-app
nvm use
```

### 1-2. 依存パッケージのインストール

```bash
npm install
```

---

## 2. Supabase 設定

### 2-1. DB スキーマ反映

1. Supabase ダッシュボードで対象プロジェクトを開く
2. 「SQL Editor」→ `supabase/schema.sql` の内容を貼り付けて実行
   - enum / tables / RLS / Storage 用コメントが一括で作成されます

### 2-2. Storage bucket 作成

- バケット名: `documents-private`
- アクセス権限: `private`

推奨パス:

- `orders/{order_id}/{document_type}/{uuid}_{filename}`
- `shipments/{shipment_id}/{document_type}/{uuid}_{filename}`
- `payments/{payment_id}/receipt/{uuid}_{filename}`

### 2-3. 環境変数（`./.env.local`）

`.env.local.example` をコピーして `.env.local` を作成し、Supabase プロジェクトの値を設定します。

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、次を埋めます。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxx   # 将来のサーバー処理用（現時点では未使用）
```

---

## 3. ローカル起動手順

```bash
cd coco-export-app
nvm use           # 初回は nvm install 24 が必要な場合あり
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

### ログイン

1. Supabase ダッシュボード → Authentication → Users からメール＋パスワードユーザーを作成
2. `profiles` テーブルに同じ `id` の行を追加し、`role` を `admin` または `manager` に設定
3. `/login` でそのメール・パスワードでサインイン

---

## 4. 実装済みの主要機能（MVP）

- **機能A: Order 管理**
  - `/orders`: Order 一覧（Order No / 顧客 / 目的地 / Payment1/2 ステータス / 更新日）
  - `POST /api/orders`:
    - Order 作成時に **Order工程タスク4件**（ORDER_RECEIVED, PO_UPLOADED, AI_EXTRACTED, ORDER_APPROVED）を自動生成
    - Order スコープの **Payment1/Payment2** と、その初期 `payment_revisions` (amount_planned=0) を自動生成
  - `/orders/[id]`:
    - Order工程タイムライン（1-4）表示
    - Order 配下の Shipment 一覧 + 工程進捗バー
    - Payment1/2 の予定金額・入金合計・ステータスを **PaymentWidget** で表示

- **機能B: Shipment 管理**
  - `POST /api/orders/:orderId/shipments`:
    - Shipment 作成時に **Shipment工程タスク6件**（PRODUCTION, LOADING, SHIPPED, TRACKING, ARRIVED, DELIVERED）を自動生成
  - `/shipments/[id]`:
    - Shipment 工程（5-10）の進捗バーとタイムライン
    - Shipment スコープの Payment1/2（分納回収）の予定・入金状況を表示

- **機能C: 支払いレジャー / ステータス自動計算**
  - `GET /api/payments/:id/ledger` および `GET /api/payments/ledger?ids=...`:
    - `payment_revisions` の最新行を使って `planned_total` を計算
    - `payment_transactions` の合計から `paid_total` を計算
    - ルール:
      - `paid_total == 0` → UNPAID
      - `0 < paid_total < planned_total` → PARTIAL
      - `paid_total >= planned_total` → PAID
  - フロントの `PaymentWidget` で最新 planned / paid / status をバッジ表示

※ Documents（書類アップロード）は Storage/DB 設計まで用意済みで、API/画面は将来拡張のための余白としています。

---

## 5. テスト・ビルド

### 5-1. テスト（lint）

```bash
npm test
```

- `package.json` の `test` スクリプトは `npm run lint` を実行します。
- すべての ESLint チェックに通ることを確認済みです。

### 5-2. ビルド

```bash
npm run build
```

Next.js の本番ビルドが通ることを確認してください。

---

## 6. よくあるトラブルと対処

- **nvm / node が見つからない**
  - `command not found: nvm` が出る場合は、nvm をインストールしてから `source "$HOME/.nvm/nvm.sh"` を実行し、シェルを再読み込みします。
  - その後、プロジェクトルートで `nvm use` を実行してください。

- **Supabase URL / ANON KEY が未設定の警告**
  - ターミナルに「Supabase URL / ANON KEY が設定されていません」と警告が出る場合、`.env.local` の値が未設定か、`npm run dev` を再起動していない可能性があります。
  - `.env.local` を保存したあと、一度開発サーバーを停止してから再度 `npm run dev` を実行してください。

- **認証後に 401 エラーになる**
  - Supabase Auth のユーザーIDに対応する `profiles` 行が存在せず、RLS で弾かれている可能性があります。
  - `profiles` テーブルに `id = auth.users.id` の行を作成し、`role` を `manager` 以上に設定してください。

---

## 7. 最終確認チェックリスト

- [ ] `nvm use` で Node v24.14.0 が有効になっている
- [ ] `npm install` が成功する
- [ ] Supabase に `schema.sql` を適用し、`documents-private` bucket を作成した
- [ ] `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定した
- [ ] Supabase でユーザーを作成し、`profiles.role` を `manager` か `admin` にした
- [ ] `npm run dev` で `http://localhost:3000` が開ける
- [ ] `/login` からサインインでき、`/dashboard` / `/orders` / `/orders/[id]` / `/shipments/[id]` が表示できる
- [ ] `npm test`（= `npm run lint`）がエラーなく完了する
- [ ] `npm run build` が成功する

上記を満たせば、このリポジトリは「ココピート管理アプリのMVPとして完成」した状態です。

