"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Customer = { id: string; name: string | null };
type Extracted = {
  order_no?: string | null;
  proforma_no?: string | null;
  order_date?: string | null;
  customer_name?: string | null;
  destination?: string | null;
  incoterms?: string | null;
  currency?: string;
  notes?: string | null;
  addressees?: string | null;
  supplier?: string | null;
  product_name?: string | null;
  product_description?: string | null;
  product_grade?: string | null;
  particle_size?: string | null;
  ec_level?: string | null;
  recovery_volume?: string | null;
  moisture_level?: string | null;
  sieve_method?: string | null;
  container_info?: string | null;
  bales_count?: number | null;
  weight_per_bale?: string | null;
  weight_tolerance?: string | null;
  bag_type?: string | null;
  bales_per_container?: string | number | null;
  container_type?: string | null;
  number_of_containers?: number | null;
  product_specs?: string | null;
  unit_price?: number | string | null;
  price_term?: string | null;
  demurrage_free_days?: number | null;
  requested_eta?: string | null;
  shipment_condition?: string | null;
  phyto_instructions?: string | null;
  origin_requirement?: string | null;
  consignee_name?: string | null;
  consignee_contact?: string | null;
  shipper_name?: string | null;
  [key: string]: unknown;
};

function NewOrderForm() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");

  const [orderNo, setOrderNo] = useState("");
  const [proformaNo, setProformaNo] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [destination, setDestination] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [addressees, setAddressees] = useState("");
  const [supplier, setSupplier] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productGrade, setProductGrade] = useState("");
  const [particleSize, setParticleSize] = useState("");
  const [ecLevel, setEcLevel] = useState("");
  const [recoveryVolume, setRecoveryVolume] = useState("");
  const [moistureLevel, setMoistureLevel] = useState("");
  const [sieveMethod, setSieveMethod] = useState("");
  const [containerInfo, setContainerInfo] = useState("");
  const [balesCount, setBalesCount] = useState("");
  const [weightPerBale, setWeightPerBale] = useState("");
  const [weightTolerance, setWeightTolerance] = useState("");
  const [bagType, setBagType] = useState("");
  const [balesPerContainer, setBalesPerContainer] = useState("");
  const [containerType, setContainerType] = useState("");
  const [numberOfContainers, setNumberOfContainers] = useState("");
  const [productSpecs, setProductSpecs] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [priceTerm, setPriceTerm] = useState("");
  const [demurrageFreeDays, setDemurrageFreeDays] = useState("");
  const [requestedEta, setRequestedEta] = useState("");
  const [shipmentCondition, setShipmentCondition] = useState("");
  const [phytoInstructions, setPhytoInstructions] = useState("");
  const [originRequirement, setOriginRequirement] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeContact, setConsigneeContact] = useState("");
  const [shipperName, setShipperName] = useState("");
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
    if (!draftId) return;
    fetch(`/api/orders/draft-uploads/${draftId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        const ext = (data.extracted_data ?? {}) as Extracted;
        if (ext.order_no) setOrderNo(String(ext.order_no));
        if (ext.proforma_no) setProformaNo(String(ext.proforma_no));
        if (ext.order_date) setOrderDate(String(ext.order_date).slice(0, 10));
        if (ext.customer_name) setCustomerName(String(ext.customer_name));
        if (ext.destination) setDestination(String(ext.destination));
        if (ext.incoterms) setIncoterms(String(ext.incoterms));
        if (ext.currency) setCurrency(String(ext.currency));
        if (ext.notes) setNotes(String(ext.notes));
        if (ext.addressees) setAddressees(String(ext.addressees));
        if (ext.supplier) setSupplier(String(ext.supplier));
        if (ext.product_name) setProductName(String(ext.product_name));
        if (ext.product_description) setProductDescription(String(ext.product_description));
        if (ext.product_grade) setProductGrade(String(ext.product_grade));
        if (ext.particle_size) setParticleSize(String(ext.particle_size));
        if (ext.ec_level) setEcLevel(String(ext.ec_level));
        if (ext.recovery_volume) setRecoveryVolume(String(ext.recovery_volume));
        if (ext.moisture_level) setMoistureLevel(String(ext.moisture_level));
        if (ext.sieve_method) setSieveMethod(String(ext.sieve_method));
        if (ext.container_info) setContainerInfo(String(ext.container_info));
        if (ext.bales_count != null) setBalesCount(String(ext.bales_count));
        if (ext.weight_per_bale) setWeightPerBale(String(ext.weight_per_bale));
        if (ext.weight_tolerance) setWeightTolerance(String(ext.weight_tolerance));
        if (ext.bag_type) setBagType(String(ext.bag_type));
        if (ext.bales_per_container != null) setBalesPerContainer(String(ext.bales_per_container));
        if (ext.container_type) setContainerType(String(ext.container_type));
        if (ext.number_of_containers != null) setNumberOfContainers(String(ext.number_of_containers));
        if (ext.product_specs) setProductSpecs(String(ext.product_specs));
        if (ext.unit_price != null) setUnitPrice(String(ext.unit_price));
        if (ext.price_term) setPriceTerm(String(ext.price_term));
        if (ext.demurrage_free_days != null) setDemurrageFreeDays(String(ext.demurrage_free_days));
        if (ext.requested_eta) setRequestedEta(String(ext.requested_eta));
        if (ext.shipment_condition) setShipmentCondition(String(ext.shipment_condition));
        if (ext.phyto_instructions) setPhytoInstructions(String(ext.phyto_instructions));
        if (ext.origin_requirement) setOriginRequirement(String(ext.origin_requirement));
        if (ext.consignee_name) setConsigneeName(String(ext.consignee_name));
        if (ext.consignee_contact) setConsigneeContact(String(ext.consignee_contact));
        if (ext.shipper_name) setShipperName(String(ext.shipper_name));
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
          proforma_no: proformaNo || null,
          customer_id: customerId || null,
          customer_name: customerId ? undefined : customerName.trim(),
          order_date,
          destination,
          incoterms,
          currency,
          notes: notes || null,
          addressees: addressees || null,
          supplier: supplier || null,
          product_name: productName || null,
          product_description: productDescription || null,
          product_grade: productGrade || null,
          particle_size: particleSize || null,
          ec_level: ecLevel || null,
          recovery_volume: recoveryVolume || null,
          moisture_level: moistureLevel || null,
          sieve_method: sieveMethod || null,
          container_info: containerInfo || null,
          bales_count: balesCount ? Number(balesCount) : null,
          weight_per_bale: weightPerBale || null,
          weight_tolerance: weightTolerance || null,
          bag_type: bagType || null,
          bales_per_container: balesPerContainer || null,
          container_type: containerType || null,
          number_of_containers: numberOfContainers ? Number(numberOfContainers) : null,
          product_specs: productSpecs || null,
          unit_price: unitPrice ? Number(unitPrice) : null,
          price_term: priceTerm || null,
          demurrage_free_days: demurrageFreeDays ? Number(demurrageFreeDays) : null,
          requested_eta: requestedEta || null,
          shipment_condition: shipmentCondition || null,
          phyto_instructions: phytoInstructions || null,
          origin_requirement: originRequirement || null,
          consignee_name: consigneeName || null,
          consignee_contact: consigneeContact || null,
          shipper_name: shipperName || null,
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
        <p className="mt-1 text-sm text-slate-600">Purchase Order No・Buyer・Destination Port 等を入力します。内容を確認のうえ「作成する」を押してください。</p>
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
        <div className="mt-4 grid gap-3">
          <Input label="Purchase Order No" value={orderNo} onChange={setOrderNo} placeholder="例: CO/AR-03-06" required />
          <Input label="プロフォーマ番号 (Proforma No)" value={proformaNo} onChange={setProformaNo} placeholder="例: PF-2024-001" />
          <div>
            <label className="block text-xs font-medium text-slate-700">Order Date</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">Buyer（既存顧客を選択）</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (e.target.value) setCustomerName("");
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="">— 新規で顧客名を入力 —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
              ))}
            </select>
          </div>
          {!customerId && (
            <Input label="Buyer（顧客名・新規）" value={customerName} onChange={setCustomerName} placeholder="例: SAMPLE" />
          )}
          <Input label="Supplier" value={supplier} onChange={setSupplier} placeholder="例: 供給者名" />
          <Input label="Product Name" value={productName} onChange={setProductName} placeholder="例: AGED 3mm 4cf DAI sieving" />
          <Input label="Product Grade" value={productGrade} onChange={setProductGrade} placeholder="例: Grade A" />
          <Input label="Particle Size" value={particleSize} onChange={setParticleSize} placeholder="例: 3mm" />
          <Input label="EC Level" value={ecLevel} onChange={setEcLevel} placeholder="例: 4cf" />
          <Input label="Recovery Volume" value={recoveryVolume} onChange={setRecoveryVolume} placeholder="例: —" />
          <Input label="Moisture Level" value={moistureLevel} onChange={setMoistureLevel} placeholder="例: 50-60%" />
          <Input label="Sieve Method" value={sieveMethod} onChange={setSieveMethod} placeholder="例: DAI sieving" />
          <Input label="Bale Weight" value={weightPerBale} onChange={setWeightPerBale} placeholder="例: 28kg" />
          <Input label="Weight Tolerance" value={weightTolerance} onChange={setWeightTolerance} placeholder="例: ±0.5kg" />
          <Input label="Bag Type" value={bagType} onChange={setBagType} placeholder="例: No Printed P bag" />
          <Input label="Bales per Container" value={balesPerContainer} onChange={setBalesPerContainer} placeholder="例: 225" />
          <Input label="Container Type" value={containerType} onChange={setContainerType} placeholder="例: 40HC" />
          <Input label="Number of Containers" value={numberOfContainers} onChange={setNumberOfContainers} type="number" placeholder="例: 3" />
          <Input label="Total Bales" value={balesCount} onChange={setBalesCount} type="number" placeholder="例: 675" />
          <Input label="Price per Bale" value={unitPrice} onChange={setUnitPrice} type="number" step="0.01" placeholder="例: 10.30" />
          <Input label="Currency" value={currency} onChange={setCurrency} placeholder="例: USD" />
          <Input label="Incoterms" value={incoterms} onChange={setIncoterms} placeholder="例: CIF NAGOYA" />
          <Input label="Destination Port" value={destination} onChange={setDestination} placeholder="例: NAGOYA" />
          <Input label="ETA" value={requestedEta} onChange={setRequestedEta} placeholder="例: 4月第2週 名古屋港" />
          <Input label="Shipment Condition" value={shipmentCondition} onChange={setShipmentCondition} placeholder="例: —" />
          <Input label="Demurrage Free Time（日）" value={demurrageFreeDays} onChange={setDemurrageFreeDays} type="number" placeholder="例: 14" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">Phytosanitary Certificate</label>
            <textarea
              value={phytoInstructions}
              onChange={(e) => setPhytoInstructions(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="例: 原本は港到着時にDIAへ、写しはメールで事前送付 等"
            />
          </div>
          <Input label="Origin Requirement" value={originRequirement} onChange={setOriginRequirement} placeholder="例: —" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">宛先（Dear Mr... Chairman, Director 等）</label>
            <textarea
              value={addressees}
              onChange={(e) => setAddressees(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="例: Dear Mr Asiri Gurusinghe (Chairman), Dear Mr Yanagisawa (Director Japanese Operation)"
            />
          </div>
          <Input label="コンテナ（備考）" value={containerInfo} onChange={setContainerInfo} placeholder="例: 2x40H/C" />
          <Input label="価格条件" value={priceTerm} onChange={setPriceTerm} placeholder="例: CIF NAGOYA US/bale (THC included in Japan)" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">製品仕様（品目・仕様・その他）</label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="例: AGED 3mm 4cf DAI sieving"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">製品仕様（水分・印刷・自社工場等）</label>
            <textarea
              value={productSpecs}
              onChange={(e) => setProductSpecs(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="例: Moisture 50-60%, No Printed P bag, own factory only"
            />
          </div>
          <Input label="Consignee（荷受人）" value={consigneeName} onChange={setConsigneeName} placeholder="例: DIA Corporation" />
          <Input label="Consignee 担当" value={consigneeContact} onChange={setConsigneeContact} placeholder="例: Asei Osawa, President" />
          <Input label="Shipper（積出人）" value={shipperName} onChange={setShipperName} placeholder="契約したShipper名" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">備考（その他）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="その他メモ"
            />
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
