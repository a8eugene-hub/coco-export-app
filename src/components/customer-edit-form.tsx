"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Customer = {
  id: string;
  name: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export function CustomerEditForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [name, setName] = useState(customer.name ?? "");
  const [country, setCountry] = useState(customer.country ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [address, setAddress] = useState(customer.address ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("顧客名を入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), country: country || null, email: email || null, phone: phone || null, address: address || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "更新に失敗しました");
        return;
      }
      router.push("/customers");
      router.refresh();
    } catch (err) {
      setError("通信に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("この顧客を削除しますか？この操作は取り消せません。")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.error ?? "削除に失敗しました");
        return;
      }
      router.push("/customers");
      router.refresh();
    } catch (err) {
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionTitle>顧客を編集</SectionTitle>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Input label="顧客名" value={name} onChange={setName} required placeholder="例: ABC Corp" />
        <Input label="国" value={country} onChange={setCountry} placeholder="例: Japan" />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <Input label="電話" value={phone} onChange={setPhone} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">住所</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>{loading ? "保存中..." : "保存"}</Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/customers")} disabled={loading}>キャンセル</Button>
          <Button type="button" variant="ghost" onClick={handleDelete} disabled={loading} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">削除</Button>
        </div>
      </form>
    </Card>
  );
}
