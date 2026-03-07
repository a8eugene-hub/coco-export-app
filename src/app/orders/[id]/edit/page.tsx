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
    .select("id, order_no, proforma_no, destination, incoterms, currency, notes, order_date, addressees, product_description, container_info, bales_count, weight_per_bale, product_specs, unit_price, price_term, demurrage_free_days, requested_eta, phyto_instructions, consignee_name, consignee_contact, shipper_name")
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
          proforma_no: order.proforma_no ?? "",
          destination: order.destination ?? "",
          incoterms: order.incoterms ?? "",
          currency: order.currency ?? "USD",
          notes: order.notes ?? "",
          order_date: order.order_date ?? "",
          addressees: order.addressees ?? "",
          product_description: order.product_description ?? "",
          container_info: order.container_info ?? "",
          bales_count: order.bales_count ?? null,
          weight_per_bale: order.weight_per_bale ?? "",
          product_specs: order.product_specs ?? "",
          unit_price: order.unit_price ?? null,
          price_term: order.price_term ?? "",
          demurrage_free_days: order.demurrage_free_days ?? null,
          requested_eta: order.requested_eta ?? "",
          phyto_instructions: order.phyto_instructions ?? "",
          consignee_name: order.consignee_name ?? "",
          consignee_contact: order.consignee_contact ?? "",
          shipper_name: order.shipper_name ?? "",
        }}
      />
    </div>
  );
}
