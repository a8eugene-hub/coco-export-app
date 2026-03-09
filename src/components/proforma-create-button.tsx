"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type OrderForProforma = {
  id: string;
  order_no: string;
  proforma_no: string | null;
  order_date: string | null;
  destination: string | null;
  incoterms: string | null;
  bales_count: number | null;
  unit_price: number | null;
  currency: string | null;
  customers?: { name: string | null } | null;
  supplier?: string | null;
};

type ProformaForm = {
  proforma_no: string;
  date: string;
  customer_ref_no: string;
  buyer_name: string;
  consignee: string;
  destination: string;
  mode_of_shipment: string;
  type_fcl_lcl: string;
  container_count: string;
  container_type: string;
  shipment_period: string;
  payment_terms: string;
  sale_terms: string;
  product_description: string;
  quantity_bales: string;
  price_per_bale: string;
  total_amount: string;
  bank_details: string;
};

function buildInitialForm(order: OrderForProforma): ProformaForm {
  const today = new Date().toISOString().slice(0, 10);
  const qty = order.bales_count ?? 0;
  const unitPrice = order.unit_price ?? 0;
  const total = qty && unitPrice ? (qty * unitPrice).toFixed(2) : "";
  return {
    proforma_no: order.proforma_no ?? "",
    date: today,
    customer_ref_no: order.order_no,
    buyer_name: order.customers?.name ?? "",
    consignee: order.customers?.name ?? "",
    destination: order.destination ?? "",
    mode_of_shipment: "SEA",
    type_fcl_lcl: "FCL",
    container_count: "",
    container_type: order.container_type ?? "",
    shipment_period: "",
    payment_terms: "100% Advance payment.",
    sale_terms: order.incoterms ?? "CIF",
    product_description: order.product_name ?? "",
    quantity_bales: qty ? String(qty) : "",
    price_per_bale: order.unit_price != null ? String(order.unit_price) : "",
    total_amount: total,
    bank_details:
      "Bank details:\n" +
      "1) Name Of Beneficiary & Address : ARAVA (PVT) LTD, 1/7, Kariyawasam Place, Kalapaluwawa, Rajagiriya, Sri Lanka.\n" +
      "2) Beneficiary’s Bank & Address : NDB Bank, No. 505, Sri Jayawardanapura Mawatha, Ethul Kotte, Sri Lanka.\n" +
      "3) Bank A/C No. (USD) : 106480004078\n" +
      "4) SWIFT Code : NDBSLKLX",
  };
}

export function ProformaCreateButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderForProforma | null>(null);
  const [form, setForm] = useState<ProformaForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openModal() {
    setError(null);
    setOpen(true);
    if (!order) {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error ?? "注文情報の取得に失敗しました");
          return;
        }
        const minimal: OrderForProforma = {
          id: json.id,
          order_no: json.order_no,
          proforma_no: json.proforma_no ?? null,
          order_date: json.order_date ?? null,
          destination: json.destination ?? null,
          incoterms: json.incoterms ?? null,
          bales_count: json.bales_count ?? null,
          unit_price: json.unit_price ?? null,
          currency: json.currency ?? null,
          customers: json.customers ?? null,
          supplier: json.supplier ?? null,
        };
        setOrder(minimal);
        setForm(buildInitialForm(minimal));
      } catch {
        setError("通信に失敗しました");
      }
    } else if (!form) {
      setForm(buildInitialForm(order));
    }
  }

  function updateField<K extends keyof ProformaForm>(key: K, value: ProformaForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/proforma`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Proforma Invoice の作成に失敗しました");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={openModal}
        className="border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
      >
        プロフォーマインボイスを作成する
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900">Proforma Invoice 情報</h2>
            <p className="mt-1 text-xs text-slate-600">
              注文情報から自動入力しています。内容を確認し、必要に応じて修正してください。
            </p>
            {!form && <p className="mt-4 text-xs text-slate-500">読み込み中...</p>}
            {form && (
              <form onSubmit={handleSubmit} className="mt-3 grid gap-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Proforma No.</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.proforma_no}
                      onChange={(e) => updateField("proforma_no", e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Date</span>
                    <input
                      type="date"
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.date}
                      onChange={(e) => updateField("date", e.target.value)}
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">Customer Ref No. (Order No)</span>
                  <input
                    className="rounded border border-slate-200 px-2 py-1"
                    value={form.customer_ref_no}
                    onChange={(e) => updateField("customer_ref_no", e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Buyer</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.buyer_name}
                      onChange={(e) => updateField("buyer_name", e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Consignee</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.consignee}
                      onChange={(e) => updateField("consignee", e.target.value)}
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">Destination</span>
                  <input
                    className="rounded border border-slate-200 px-2 py-1"
                    value={form.destination}
                    onChange={(e) => updateField("destination", e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Mode of Shipment</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.mode_of_shipment}
                      onChange={(e) => updateField("mode_of_shipment", e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Type (FCL / LCL)</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.type_fcl_lcl}
                      onChange={(e) => updateField("type_fcl_lcl", e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">No of Containers / Type</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={`${form.container_count} ${form.container_type}`.trim()}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateField("container_count", v.split(" ")[0] ?? "");
                        updateField("container_type", v.split(" ").slice(1).join(" "));
                      }}
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">Shipment Period</span>
                  <input
                    className="rounded border border-slate-200 px-2 py-1"
                    value={form.shipment_period}
                    onChange={(e) => updateField("shipment_period", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">Product Description</span>
                  <textarea
                    rows={3}
                    className="rounded border border-slate-200 px-2 py-1"
                    value={form.product_description}
                    onChange={(e) => updateField("product_description", e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Quantity (Bales)</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.quantity_bales}
                      onChange={(e) => updateField("quantity_bales", e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Price per Bale (USD)</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.price_per_bale}
                      onChange={(e) => updateField("price_per_bale", e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Total Amount (USD)</span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1"
                      value={form.total_amount}
                      onChange={(e) => updateField("total_amount", e.target.value)}
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">Sale Terms / Payment Terms</span>
                  <input
                    className="rounded border border-slate-200 px-2 py-1"
                    value={form.sale_terms}
                    onChange={(e) => updateField("sale_terms", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">Payment Terms（文章）</span>
                  <textarea
                    rows={2}
                    className="rounded border border-slate-200 px-2 py-1"
                    value={form.payment_terms}
                    onChange={(e) => updateField("payment_terms", e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">Bank Details</span>
                  <textarea
                    rows={4}
                    className="rounded border border-slate-200 px-2 py-1"
                    value={form.bank_details}
                    onChange={(e) => updateField("bank_details", e.target.value)}
                  />
                </label>
                {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "作成中..." : "PDFを作成"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

