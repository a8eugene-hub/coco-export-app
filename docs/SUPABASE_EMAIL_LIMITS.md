# Supabase メール送信の上限と確認方法

## 1. 送信上限の確認場所（ダッシュボード）

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. **対象プロジェクト**を選択
3. 左メニュー **Authentication** → **Rate Limits**  
   - 直リンク: `https://app.supabase.com/dashboard/project/<プロジェクトID>/auth/rate-limits`
4. ここで「メール送信」まわりのレート制限の状態・設定を確認できます。

※ 組み込み SMTP を使っている場合、**送信したメールの通数そのものをダッシュボードで「何通送った」と数値で見る機能はありません**。  
「レート制限に達した」かどうかは、アプリ側で「email rate limit exceeded」などのエラーが出るかどうかで判断することになります。

---

## 2. 無料プラン（組み込み SMTP）の制限

- **送信先**: **プロジェクトのチームメンバー（Organization の Team）に登録されているメールアドレスにしか送れません**。  
  - 未登録のアドレスには送れず、その場合は "Email address not authorized" などのエラーになります。  
  - チーム管理: [Organization の Team タブ](https://app.supabase.com/dashboard/org/_/team)
- **送信数**: ドキュメント上は **「1時間あたりごく少数」（目安: 2〜4通/時間）** とされています。  
  - 新規登録・パスワードリセット・メール変更など、**メールを送る処理はすべて合算**でこの制限にかかります。
- そのため、**初めてのメールアドレス**でも、直前に何通か送っていると「送信回数が上限に達しました」となり、新規登録ができなくなります。

---

## 3. 本番・まともに使う場合の推奨（カスタム SMTP）

- 組み込み SMTP は「お試し・開発用」であり、本番では **カスタム SMTP** の利用が推奨されています。
- カスタム SMTP を設定すると:
  - **チームメンバー以外**の任意のメールアドレスにも送信できる
  - 1時間あたりの制限が緩和される（例: 30通/時間など、設定で調整可能）
- 設定場所: **Authentication** → **SMTP Settings**  
  - 直リンク: `https://app.supabase.com/dashboard/project/<プロジェクトID>/auth/smtp`
- 利用例: SendGrid, AWS SES, Brevo, Resend, Postmark, ZeptoMail など。

---

## 4. いま「送信上限に達した」と言われている場合の確認チェックリスト

- [ ] **Rate Limits**: 上記 **Authentication → Rate Limits** で、メール関連の制限が有効になっていないか確認
- [ ] **送信先の許可**: 組み込み SMTP のままなら、登録しようとしているメールアドレスが **Organization の Team に追加されているか** を [Team タブ](https://app.supabase.com/dashboard/org/_/team) で確認
- [ ] **直近1時間の利用**: パスワードリセット・新規登録・別アドレスでの登録などを連続で行っていないか確認（**1時間ほど何も送らず待ってから**再度試す）
- [ ] **本番運用**: 本番で使う予定なら、**カスタム SMTP** を設定してから再度送信・新規登録を試す

---

## 参考リンク

- [Rate limits \| Supabase Docs](https://supabase.com/docs/guides/auth/rate-limits)
- [Send emails with custom SMTP \| Supabase Docs](https://supabase.com/docs/guides/auth/auth-smtp)
