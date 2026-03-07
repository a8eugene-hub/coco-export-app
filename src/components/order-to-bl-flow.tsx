"use client";

import Link from "next/link";
import { Card } from "@/components/ui";

type Shipment = { id: string; bl_no: string | null };

export function OrderToBLFlow({
  orderId,
  shipments,
}: {
  orderId: string;
  shipments: Shipment[];
}) {
  const hasShipments = shipments.length > 0;
  const allHaveBl = hasShipments && shipments.every((s) => s.bl_no?.trim());

  const step2Done = hasShipments;
  const step3Label = "コンテナ・船名・BL書類";

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">注文からB/Lまでの流れ</h2>
      <ol className="mt-3 space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
            1
          </span>
          <span className="text-slate-700">注文</span>
          <span className="text-xs text-emerald-600">済</span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
              step2Done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            2
          </span>
          <span className="text-slate-700">積み荷の追加・B/L番号の入力</span>
          {step2Done ? (
            allHaveBl ? (
              <span className="text-xs text-emerald-600">済</span>
            ) : (
              <span className="text-xs text-amber-600">B/L番号を入力してください</span>
            )
          ) : (
            <span className="text-xs text-slate-500">未</span>
          )}
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
            3
          </span>
          <span className="text-slate-700">{step3Label}</span>
          <span className="text-xs text-slate-500">積み荷詳細で入力</span>
        </li>
      </ol>
      <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {!hasShipments ? (
          <>
            <strong>次のステップ:</strong> 下の「+ Shipmentを追加」から積み荷を登録し、B/L番号・ETD・ETA を入力してください。
          </>
        ) : !allHaveBl ? (
          <>
            <strong>次のステップ:</strong> B/L番号が未入力の積み荷があります。
            {shipments.filter((s) => !s.bl_no?.trim()).length > 0 && (
              <>
                {" "}
                <Link href={`/shipments/${shipments.find((s) => !s.bl_no?.trim())?.id}`} className="font-medium text-slate-900 underline hover:no-underline">
                  積み荷詳細
                </Link>
                で入力してください。
              </>
            )}
          </>
        ) : (
          <>
            <strong>次のステップ:</strong> 各積み荷でコンテナ番号・船名・Voyage No の入力と、必要に応じてBL書類のアップロードを
            <Link href={`/shipments/${shipments[0].id}`} className="ml-1 font-medium text-slate-900 underline hover:no-underline">
              積み荷詳細
            </Link>
            から行えます。
          </>
        )}
      </div>
    </Card>
  );
}
