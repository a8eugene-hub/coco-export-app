import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase URL / ANON KEY が設定されていません。.env.local を確認してください。");
}

export function createClientBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function createClientServer(cookieStore: {
  getAll: () => { name: string; value: string }[];
}): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // Server Components では Cookie を書けないため未設定。
      // ミドルウェアでセッション更新・書き戻しを行う。
    },
  });
}

export function createServiceClient(): SupabaseClient {
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY または NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。");
  }
  return createClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** API ルート用: リクエストの Cookie から認証ユーザーを取得。未ログインなら null */
export async function getAuthUserFromRequest(req: NextRequest): Promise<User | null> {
  const cookieStore = { getAll: () => req.cookies.getAll() };
  const client = createClientServer(cookieStore);
  const { data: { user } } = await client.auth.getUser();
  return user ?? null;
}

