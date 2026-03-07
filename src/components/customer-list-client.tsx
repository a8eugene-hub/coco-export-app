"use client";

import Link from "next/link";
import { useState } from "react";
import type { Customer } from "@/app/customers/types";

export function CustomerListClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers] = useState(initialCustomers);
  const [q, setQ] = useState("");

  const filtered = q.trim()
    ? customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(q.toLowerCase()) ||
          c.email?.toLowerCase().includes(q.toLowerCase()) ||
          c.country?.toLowerCase().includes(q.toLowerCase())
      )
    : customers;

  return (
    <div className="mt-3 space-y-3">
      <input
        type="search"
        placeholder="名前・メール・国で検索..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs">
          <thead className="text-[11px] text-slate-500">
            <tr>
              <th className="px-3 py-1">名前</th>
              <th className="px-3 py-1">国</th>
              <th className="px-3 py-1">Email</th>
              <th className="px-3 py-1">電話</th>
              <th className="px-3 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-slate-500">
                  {customers.length === 0 ? "顧客がまだいません。" : "該当する顧客がいません。"}
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="rounded-lg bg-white shadow-sm">
                <td className="px-3 py-2 font-medium text-slate-900">{c.name}</td>
                <td className="px-3 py-2 text-slate-600">{c.country ?? "-"}</td>
                <td className="px-3 py-2 text-slate-600">{c.email ?? "-"}</td>
                <td className="px-3 py-2 text-slate-600">{c.phone ?? "-"}</td>
                <td className="px-3 py-2">
                  <Link href={`/customers/${c.id}/edit`} className="text-slate-600 hover:underline">
                    編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
