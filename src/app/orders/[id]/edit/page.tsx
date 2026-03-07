import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer, createServiceClient } from "@/lib/supabaseClient";
import { OrderEditForm } from "@/components/order-edit-form";

type Params = { params: Promise<{ id: string }> };

export default async function OrderEditPage({ params }: Params) {
  const { id } = await params;
  const cookieStore = await cookies();
  const authClient = createClientServer(cookieStore as any);
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const dataClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : authClient;
  const { data: order } = await dataClient
    .from("orders")
    .select("id, order_no, destination, incoterms, currency, notes, order_date")
    .eq("id", id)
    .single();

  if (!order) redirect("/orders");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <Link href={`/orders/${id}`} className="hover:underline">
          ← 注文詳細へ
        </Link>
      </div>
      <OrderEditForm
        orderId={order.id}
        orderNo={order.order_no}
        initial={{
          destination: order.destination ?? "",
          incoterms: order.incoterms ?? "",
          currency: order.currency ?? "USD",
          notes: order.notes ?? "",
          order_date: order.order_date ?? "",
        }}
      />
    </div>
  );
}
