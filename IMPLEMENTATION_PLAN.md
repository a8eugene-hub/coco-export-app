# 完成形 実装計画（実装済み）

## 実装済み

1. **認証**: ログアウトボタン、新規登録（/signup）、パスワードリセット（/forgot-password、メール送信）
2. **顧客**: 一覧（/customers）・新規（/customers/new）・編集・削除、注文作成時の「既存顧客を選択」+ プロフォーマ番号
3. **注文**: proforma_no の入力・表示・編集、Order ドキュメントのアップロード・一覧・ダウンロード
4. **Shipment**: コンテナ（container_no, seal_no）の登録・一覧・削除、船名・Voyage No の編集
5. **Payment**: 予定額改定（payment_revisions 追加）、入金一覧の編集・削除
6. **ドキュメント**: Order / Shipment に「書類をアップロードして一覧表示・ダウンロード」（Storage: documents-private）
7. **ダッシュボード・一覧**: 遅延タスク＝今日/今週/期限超過フィルタ、注文一覧＝検索・発注日範囲、Shipment一覧＝ETD範囲
8. **多言語**: ヘッダーで JA / EN / SI 切り替え（ナビ・ログアウト等）、localStorage で保持

## 人間が行う設定

- **Supabase Storage**: ダッシュボードでバケット `documents-private` を private で作成。RLS で service_role または認証ユーザーにアップロード・読み取りを許可すること。
- **Supabase Auth**: メール確認・パスワードリセット用に「Email Templates」やリダイレクトURLの確認を推奨。
