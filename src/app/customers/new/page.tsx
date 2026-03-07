"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
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
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), country: country || null, email: email || null, phone: phone || null, address: address || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "作成に失敗しました");
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link href="/customers" className="text-sm text-slate-600 hover:underline">← 顧客一覧</Link>
      </div>
      <Card>
        <SectionTitle>顧客を新規作成</SectionTitle>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <Input label="顧客名" value={name} onChange={setName} required placeholder="例: ABC Corp" />
          <Input label="国" value={country} onChange={setCountry} placeholder="例: Japan" />
          <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="例: contact@example.com" />
          <Input label="電話" value={phone} onChange={setPhone} placeholder="例: +81-3-1234-5678" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">住所</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? "作成中..." : "作成する"}</Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/customers")} disabled={loading}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
