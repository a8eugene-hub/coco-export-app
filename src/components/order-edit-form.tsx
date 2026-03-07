"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Props = {
  orderId: string;
  orderNo: string;
  initial: {
    proforma_no: string;
    destination: string;
    incoterms: string;
    currency: string;
    notes: string;
    order_date: string;
    addressees: string;
    product_description: string;
    container_info: string;
    bales_count: number | null;
    weight_per_bale: string;
    product_specs: string;
    unit_price: number | null;
    price_term: string;
    demurrage_free_days: number | null;
    requested_eta: string;
    phyto_instructions: string;
    consignee_name: string;
    consignee_contact: string;
    shipper_name: string;
  };
};

export function OrderEditForm({ orderId, orderNo, initial }: Props) {
  const router = useRouter();
  const [proformaNo, setProformaNo] = useState(initial.proforma_no ?? "");
  const [destination, setDestination] = useState(initial.destination ?? "");
  const [incoterms, setIncoterms] = useState(initial.incoterms ?? "");
  const [currency, setCurrency] = useState(initial.currency ?? "USD");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [orderDate, setOrderDate] = useState(initial.order_date?.slice(0, 10) ?? "");
  const [addressees, setAddressees] = useState(initial.addressees ?? "");
  const [productDescription, setProductDescription] = useState(initial.product_description ?? "");
  const [containerInfo, setContainerInfo] = useState(initial.container_info ?? "");
  const [balesCount, setBalesCount] = useState(initial.bales_count != null ? String(initial.bales_count) : "");
  const [weightPerBale, setWeightPerBale] = useState(initial.weight_per_bale ?? "");
  const [productSpecs, setProductSpecs] = useState(initial.product_specs ?? "");
  const [unitPrice, setUnitPrice] = useState(initial.unit_price != null ? String(initial.unit_price) : "");
  const [priceTerm, setPriceTerm] = useState(initial.price_term ?? "");
  const [demurrageFreeDays, setDemurrageFreeDays] = useState(initial.demurrage_free_days != null ? String(initial.demurrage_free_days) : "");
  const [requestedEta, setRequestedEta] = useState(initial.requested_eta ?? "");
  const [phytoInstructions, setPhytoInstructions] = useState(initial.phyto_instructions ?? "");
  const [consigneeName, setConsigneeName] = useState(initial.consignee_name ?? "");
  const [consigneeContact, setConsigneeContact] = useState(initial.consignee_contact ?? "");
  const [shipperName, setShipperName] = useState(initial.shipper_name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proforma_no: proformaNo || null,
          destination: destination || null,
          incoterms: incoterms || null,
          currency: currency || "USD",
          notes: notes || null,
          order_date: orderDate || null,
          addressees: addressees || null,
          product_description: productDescription || null,
          container_info: containerInfo || null,
          bales_count: balesCount ? Number(balesCount) : null,
          weight_per_bale: weightPerBale || null,
          product_specs: productSpecs || null,
          unit_price: unitPrice ? Number(unitPrice) : null,
          price_term: priceTerm || null,
          demurrage_free_days: demurrageFreeDays ? Number(demurrageFreeDays) : null,
          requested_eta: requestedEta || null,
          phyto_instructions: phytoInstructions || null,
          consignee_name: consigneeName || null,
          consignee_contact: consigneeContact || null,
          shipper_name: shipperName || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "更新に失敗しました");
        return;
      }
      router.push(`/orders/${orderId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionTitle>注文を編集</SectionTitle>
      <p className="mt-1 text-xs text-slate-500">Order No: {orderNo}（変更不可）</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Input label="発注日" value={orderDate} onChange={setOrderDate} type="date" />
        <Input label="プロフォーマ番号" value={proformaNo} onChange={setProformaNo} placeholder="例: PF-2024-001" />
        <Input label="目的地" value={destination} onChange={setDestination} placeholder="例: YOKOHAMA" />
        <Input label="Incoterms" value={incoterms} onChange={setIncoterms} placeholder="例: CIF Yokohama" />
        <Input label="通貨" value={currency} onChange={setCurrency} placeholder="USD" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">宛先</label>
          <textarea value={addressees} onChange={(e) => setAddressees(e.target.value)} rows={2} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        <Input label="品目・仕様" value={productDescription} onChange={setProductDescription} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="コンテナ" value={containerInfo} onChange={setContainerInfo} />
          <Input label="バール数" value={balesCount} onChange={setBalesCount} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="バールあたり重量" value={weightPerBale} onChange={setWeightPerBale} />
          <Input label="単価 (USD)" value={unitPrice} onChange={setUnitPrice} type="number" step="0.01" />
        </div>
        <Input label="価格条件" value={priceTerm} onChange={setPriceTerm} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">製品仕様</label>
          <textarea value={productSpecs} onChange={(e) => setProductSpecs(e.target.value)} rows={2} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="デマレージ Free (日)" value={demurrageFreeDays} onChange={setDemurrageFreeDays} type="number" />
          <Input label="希望 ETA" value={requestedEta} onChange={setRequestedEta} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">Phytosanitary 要領</label>
          <textarea value={phytoInstructions} onChange={(e) => setPhytoInstructions(e.target.value)} rows={2} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        <Input label="Consignee" value={consigneeName} onChange={setConsigneeName} />
        <Input label="Consignee 担当" value={consigneeContact} onChange={setConsigneeContact} />
        <Input label="Shipper" value={shipperName} onChange={setShipperName} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">備考</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "保存中..." : "保存"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
            キャンセル
          </Button>
        </div>
      </form>
    </Card>
  );
}
