"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Customer = { id: string; name: string | null };
type Extracted = {
  order_no?: string | null;
  order_date?: string | null;
  customer_name?: string | null;
  supplier?: string | null;
  product_name?: string | null;
  particle_size?: string | null;
  ec_level?: string | null;
  recovery_volume?: string | null;
  weight_per_bale?: string | null;
  moisture_level?: string | null;
  bag_type?: string | null;
  container_type?: string | null;
  number_of_containers?: number | null;
  bales_per_container?: string | number | null;
  bales_count?: number | null;
  unit_price?: number | string | null;
  incoterms?: string | null;
  destination?: string | null;
  demurrage_free_days?: number | null;
  requested_eta?: string | null;
  phyto_instructions?: string | null;
  [key: string]: unknown;
};

function NewOrderForm() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");

  const [orderNo, setOrderNo] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [destination, setDestination] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [supplier, setSupplier] = useState("");
  const [productName, setProductName] = useState("");
  const [particleSize, setParticleSize] = useState("");
  const [ecLevel, setEcLevel] = useState("");
  const [recoveryVolume, setRecoveryVolume] = useState("");
  const [moistureLevel, setMoistureLevel] = useState("");
  const [weightPerBale, setWeightPerBale] = useState("");
  const [bagType, setBagType] = useState("");
  const [balesPerContainer, setBalesPerContainer] = useState("");
  const [containerType, setContainerType] = useState("");
  const [numberOfContainers, setNumberOfContainers] = useState("");
  const [balesCount, setBalesCount] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [demurrageFreeDays, setDemurrageFreeDays] = useState("");
  const [requestedEta, setRequestedEta] = useState("");
  const [phytoInstructions, setPhytoInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draftInfo, setDraftInfo] = useState<{ file_name: string; view_url: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // よく使う値は初期値として入れておく（消せばplaceholderが例として見える）
    setSupplier("ARAVA (PRIVATE) LTD");
    setProductName("AGED 3mm Cocopeat");
    setParticleSize("3mm");
    setEcLevel("Below 0.3 mS/cm");
    setRecoveryVolume("More than 160 Liters");
    setWeightPerBale("28kg");
    setMoistureLevel("50-60%");
    setBagType("No Printed PP bag");
    setContainerType("40HC");
    setBalesPerContainer("675");
    setDemurrageFreeDays("14");
  }, []);

  useEffect(() => {
    if (!draftId) return;
    fetch(`/api/orders/draft-uploads/${draftId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        const ext = (data.extracted_data ?? {}) as Extracted;
        if (ext.order_no) setOrderNo(String(ext.order_no));
        if (ext.order_date) setOrderDate(String(ext.order_date).slice(0, 10));
        if (ext.customer_name) setCustomerName(String(ext.customer_name));
        if (ext.supplier) setSupplier(String(ext.supplier));
        if (ext.product_name) setProductName(String(ext.product_name));
        if (ext.particle_size) setParticleSize(String(ext.particle_size));
        if (ext.ec_level) setEcLevel(String(ext.ec_level));
        if (ext.recovery_volume) setRecoveryVolume(String(ext.recovery_volume));
        if (ext.moisture_level) setMoistureLevel(String(ext.moisture_level));
        if (ext.weight_per_bale) setWeightPerBale(String(ext.weight_per_bale));
        if (ext.bag_type) setBagType(String(ext.bag_type));
        if (ext.bales_per_container != null) setBalesPerContainer(String(ext.bales_per_container));
        if (ext.container_type) setContainerType(String(ext.container_type));
        if (ext.number_of_containers != null) setNumberOfContainers(String(ext.number_of_containers));
        if (ext.bales_count != null) setBalesCount(String(ext.bales_count));
        if (ext.unit_price != null) setUnitPrice(String(ext.unit_price));
        if (ext.incoterms) setIncoterms(String(ext.incoterms));
        if (ext.destination) setDestination(String(ext.destination));
        if (ext.demurrage_free_days != null) setDemurrageFreeDays(String(ext.demurrage_free_days));
        if (ext.requested_eta) setRequestedEta(String(ext.requested_eta));
        if (ext.phyto_instructions) setPhytoInstructions(String(ext.phyto_instructions));
        setDraftInfo({ file_name: data.file_name ?? "", view_url: data.view_url ?? null });
      })
      .catch(() => {});
  }, [draftId]);

  async function submit() {
    if (!customerId && !customerName.trim()) {
      setMessage("既存顧客を選択するか、顧客名を入力してください");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const order_date = orderDate || new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_no: orderNo,
          customer_id: customerId || null,
          customer_name: customerId ? undefined : customerName.trim(),
          order_date,
          incoterms,
          destination,
          currency: "USD",
          supplier: supplier || null,
          product_name: productName || null,
          particle_size: particleSize || null,
          ec_level: ecLevel || null,
          recovery_volume: recoveryVolume || null,
          moisture_level: moistureLevel || null,
          bales_count: balesCount ? Number(balesCount) : null,
          weight_per_bale: weightPerBale || null,
          bag_type: bagType || null,
          bales_per_container: balesPerContainer || null,
          container_type: containerType || null,
          number_of_containers: numberOfContainers ? Number(numberOfContainers) : null,
          unit_price: unitPrice ? Number(unitPrice) : null,
          demurrage_free_days: demurrageFreeDays ? Number(demurrageFreeDays) : null,
          requested_eta: requestedEta || null,
          phyto_instructions: phytoInstructions || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error ?? "作成に失敗しました");
        return;
      }
      window.location.href = "/orders";
    } catch (e) {
      console.error(e);
      setMessage("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <SectionTitle>注文を作成</SectionTitle>
        <p className="mt-1 text-sm text-slate-600">必要な項目だけに絞った注文作成フォームです。内容を確認のうえ「作成する」を押してください。</p>
        {draftInfo && (
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span>読み込み元: {draftInfo.file_name}</span>
            {draftInfo.view_url ? (
              <a href={draftInfo.view_url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 underline hover:no-underline">
                PDFを見る
              </a>
            ) : null}
          </p>
        )}
        <div className="mt-4 grid gap-6">
          <div className="grid gap-3">
            <div className="text-sm font-semibold text-slate-900">基本情報</div>
            <Input label="Purchase Order No / 注文書番号" value={orderNo} onChange={setOrderNo} placeholder="例: CO/AR-08-26" required />
            <div>
              <label className="block text-xs font-medium text-slate-700">Order Date / 注文日</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700">Buyer / 買主（注文者）</label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  if (e.target.value) setCustomerName("");
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">— 新規で Buyer 名を入力 —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? c.id}
                  </option>
                ))}
              </select>
            </div>
            {!customerId && <Input label="Buyer / 買主（新規）" value={customerName} onChange={setCustomerName} placeholder="例: DIA Corporation" />}
            <Input label="Supplier / 供給者（売主）" value={supplier} onChange={setSupplier} placeholder="例: ARAVA (PRIVATE) LTD" />
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-semibold text-slate-900">商品仕様</div>
            <Input label="Product Name / 商品名" value={productName} onChange={setProductName} placeholder="例: AGED 3mm Cocopeat" />
            <Input label="Particle Size / 粒子サイズ" value={particleSize} onChange={setParticleSize} placeholder="例: 3mm" />
            <Input label="EC Level / EC値" value={ecLevel} onChange={setEcLevel} placeholder="例: Below 0.3 mS/cm" />
            <Input label="Recovery Volume / 膨張容量" value={recoveryVolume} onChange={setRecoveryVolume} placeholder="例: More than 160 Liters" />
            <Input label="Bale Weight / ベール重量" value={weightPerBale} onChange={setWeightPerBale} placeholder="例: 28kg" />
            <Input label="Moisture Level / 水分率" value={moistureLevel} onChange={setMoistureLevel} placeholder="例: 50-60%" />
            <Input label="Bag Type / 袋仕様" value={bagType} onChange={setBagType} placeholder="例: No Printed PP bag" />
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-semibold text-slate-900">数量</div>
            <Input label="Container Type / コンテナタイプ" value={containerType} onChange={setContainerType} placeholder="例: 40HC" />
            <Input label="Number of Containers / コンテナ数" value={numberOfContainers} onChange={setNumberOfContainers} type="number" placeholder="例: 2" />
            <Input label="Bales per Container / コンテナあたりベール数" value={balesPerContainer} onChange={setBalesPerContainer} placeholder="例: 675" />
            <Input label="Total Bales / 総ベール数" value={balesCount} onChange={setBalesCount} type="number" placeholder="例: 1350" />
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-semibold text-slate-900">価格</div>
            <Input label="Price per Bale / ベール単価（USD）" value={unitPrice} onChange={setUnitPrice} type="number" step="0.01" placeholder="例: 10.30" />
            <Input label="Incoterms / 取引条件" value={incoterms} onChange={setIncoterms} placeholder="例: CIF NAGOYA" />
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-semibold text-slate-900">出荷条件</div>
            <Input label="Destination Port / 仕向港" value={destination} onChange={setDestination} placeholder="例: NAGOYA" />
            <Input label="ETA / 到着予定" value={requestedEta} onChange={setRequestedEta} placeholder="例: Second week of April" />
            <Input label="Demurrage Free Time / デマレージ無料期間（日）" value={demurrageFreeDays} onChange={setDemurrageFreeDays} type="number" placeholder="例: 14" />
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-semibold text-slate-900">必須書類</div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700">Phytosanitary Certificate / 植物検疫証明書</label>
              <textarea
                value={phytoInstructions}
                onChange={(e) => setPhytoInstructions(e.target.value)}
                rows={3}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="例: Original sent to DIA at port entry, copy emailed in advance"
              />
            </div>
          </div>
        </div>
        {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}
        <div className="mt-5 flex items-center gap-2">
          <Button onClick={submit} disabled={loading}>
            {loading ? "作成中..." : "作成する"}
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = "/orders")} disabled={loading}>
            キャンセル
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-4 text-sm text-slate-500">読み込み中...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}
