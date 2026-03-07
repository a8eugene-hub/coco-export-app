import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer, createServiceClient } from "@/lib/supabaseClient";
import { CustomerEditForm } from "@/components/customer-edit-form";

type Params = { params: Promise<{ id: string }> };

export default async function CustomerEditPage({ params }: Params) {
  const { id } = await params;
  const cookieStore = await cookies();
  const authClient = createClientServer(cookieStore as any);
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const dataClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : authClient;
  const { data: customer } = await dataClient.from("customers").select("*").eq("id", id).single();
  if (!customer) redirect("/customers");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/customers" className="text-sm text-slate-600 hover:underline">← 顧客一覧</Link>
      </div>
      <CustomerEditForm customer={customer} />
    </div>
  );
}
