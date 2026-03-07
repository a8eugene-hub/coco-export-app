# DIA注文-読み込み ができない場合

「通信に失敗しました」や「読み込みに失敗しました」と出る場合、次を確認してください。

## 1. 本番（Vercel）で必要な Supabase 設定

### order_draft_uploads テーブル

DIA注文のPDFを保管するために **order_draft_uploads** テーブルが必要です。

1. [Supabase Dashboard](https://app.supabase.com) → 対象プロジェクト → **SQL Editor**
2. 次の SQL を実行してください。

```sql
create table if not exists public.order_draft_uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_bucket text not null default 'documents-private',
  storage_path text not null,
  extracted_data jsonb,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz default now()
);
alter table public.order_draft_uploads enable row level security;
create policy if not exists order_draft_uploads_select on public.order_draft_uploads for select using (true);
create policy if not exists order_draft_uploads_insert on public.order_draft_uploads for insert with check (auth.uid() is not null);
```

### Storage バケット

- 既存の **documents-private** バケットに **order-drafts/** というパスでPDFを保存します。
- ドキュメントアップロードが動いていれば、同じバケットで問題ありません。新規の場合は Supabase → Storage で **documents-private** バケットを作成し、認証済みユーザーがアップロード・読み取りできるようにポリシーを設定してください。

## 2. エラー表示の改善

- 画面上では、サーバーが返したエラー文言や「登録に失敗しました。Supabase で order_draft_uploads テーブルを…」のような案内が表示されるようにしています。
- まだ「通信に失敗しました」とだけ出る場合は、ブラウザの開発者ツール（F12）→ ネットワークタブで **draft-upload** のレスポンス（ステータスコード・本文）を確認すると原因を特定しやすくなります。
