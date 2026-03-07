import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceClient();

  // 1) customer: 既存がいれば使う、なければ新規作成
  let customer: { id: string } | null = null;
  const { data: existing } = await supabase.from("customers").select("id").limit(1).maybeSingle();
  if (existing) {
    customer = existing;
  } else {
    const { data: inserted, error: cErr } = await supabase
      .from("customers")
      .insert({
        name: "SAMPLE CUSTOMER",
        country: "Japan",
        email: "sample@example.com",
      })
      .select("id")
      .single();
    if (cErr || !inserted) {
      console.error("seed customer error", cErr);
      const hint =
        process.env.SUPABASE_SERVICE_ROLE_KEY
          ? "Supabase の RLS で customers への書き込みが許可されているか確認してください。"
          : "本番（Vercel）では環境変数 SUPABASE_SERVICE_ROLE_KEY を追加するとデモデータを作成できます。";
      return NextResponse.json(
        { error: `顧客の作成に失敗しました。${hint}` },
        { status: 500 },
      );
    }
    customer = inserted;
  }

  // 2) order（order_no は1日1種だと重複するため、実行ごとに一意な suffix を付与）
  const now = new Date();
  const suffix = Date.now().toString(36).slice(-6);
  const orderNo = `CO/AR-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${suffix}`;

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({
      order_no: orderNo,
      order_date: now.toISOString().slice(0, 10),
      customer_id: customer.id,
      destination: "YOKOHAMA",
      incoterms: "CIF Yokohama",
      currency: "USD",
      notes: "デモデータ",
    })
    .select("*")
    .single();
  if (oErr || !order) {
    console.error("seed order error", oErr);
    const msg = oErr?.code === "23505" ? "注文番号が重複しています。しばらく待って再度お試しください。" : "注文の作成に失敗しました。";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 3) create tasks (order scope)
  await supabase.from("tasks").insert([
    { scope: "ORDER", order_id: order.id, shipment_id: null, task_key: "ORDER_RECEIVED", title: "Order received" },
    { scope: "ORDER", order_id: order.id, shipment_id: null, task_key: "PO_UPLOADED", title: "PO uploaded" },
    { scope: "ORDER", order_id: order.id, shipment_id: null, task_key: "AI_EXTRACTED", title: "AI extracted" },
    { scope: "ORDER", order_id: order.id, shipment_id: null, task_key: "ORDER_APPROVED", title: "Order approved" },
  ]);

  // 4) create payments + revision + a transaction
  const { data: payments } = await supabase
    .from("payments")
    .insert([
      { payment_type: "PAYMENT1", scope: "ORDER", order_id: order.id, shipment_id: null, currency: "USD", due_date: now.toISOString().slice(0, 10) },
      { payment_type: "PAYMENT2", scope: "ORDER", order_id: order.id, shipment_id: null, currency: "USD" },
    ])
    .select("*");

  const p1 = payments?.find((p) => p.payment_type === "PAYMENT1");
  const p2 = payments?.find((p) => p.payment_type === "PAYMENT2");

  if (p1) {
    await supabase.from("payment_revisions").insert({ payment_id: p1.id, amount_planned: 1000, reason: "デモ予定" });
    await supabase.from("payment_transactions").insert({ payment_id: p1.id, paid_date: now.toISOString().slice(0, 10), amount_paid: 300, currency: "USD", memo: "一部入金(デモ)" });
  }
  if (p2) {
    await supabase.from("payment_revisions").insert({ payment_id: p2.id, amount_planned: 200, reason: "デモ予定" });
  }

  // 5) shipment + shipment tasks
  const { data: shipment } = await supabase
    .from("shipments")
    .insert({
      order_id: order.id,
      bl_no: "DEMO-BL-0001",
      etd: addDays(now, 7),
      eta: addDays(now, 21),
      vessel_name: "DEMO VESSEL",
      container_type: "40HC",
      container_count: 1,
    })
    .select("*")
    .single();

  if (shipment) {
    await supabase.from("tasks").insert([
      { scope: "SHIPMENT", order_id: order.id, shipment_id: shipment.id, task_key: "PRODUCTION", title: "Production" },
      { scope: "SHIPMENT", order_id: order.id, shipment_id: shipment.id, task_key: "LOADING", title: "Loading" },
      { scope: "SHIPMENT", order_id: order.id, shipment_id: shipment.id, task_key: "SHIPPED", title: "Shipped" },
      { scope: "SHIPMENT", order_id: order.id, shipment_id: shipment.id, task_key: "TRACKING", title: "Tracking" },
      { scope: "SHIPMENT", order_id: order.id, shipment_id: shipment.id, task_key: "ARRIVED", title: "Arrived" },
      { scope: "SHIPMENT", order_id: order.id, shipment_id: shipment.id, task_key: "DELIVERED", title: "Delivered" },
    ]);
  }

  return NextResponse.json({ ok: true, order_id: order.id, shipment_id: shipment?.id ?? null });
}

function addDays(d: Date, days: number) {
  const dd = new Date(d);
  dd.setDate(dd.getDate() + days);
  return dd.toISOString().slice(0, 10);
}

