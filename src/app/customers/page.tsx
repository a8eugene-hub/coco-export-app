import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer, createServiceClient } from "@/lib/supabaseClient";
import { Card, SectionTitle } from "@/components/ui";
import { CustomerListClient } from "@/components/customer-list-client";

export default async function CustomersPage() {
  const cookieStore = await cookies();
  const authClient = createClientServer(cookieStore as any);
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const dataClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : authClient;
  const { data: customers } = await dataClient
    .from("customers")
    .select("id, name, country, email, phone, address")
    .order("name", { ascending: true })
    .limit(500);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">顧客一覧</h1>
          <p className="text-sm text-slate-600">名前・国・メール等で管理します。</p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          新規作成
        </Link>
      </header>
      <Card>
        <SectionTitle>Customers</SectionTitle>
        <CustomerListClient initialCustomers={customers ?? []} />
      </Card>
    </div>
  );
}
