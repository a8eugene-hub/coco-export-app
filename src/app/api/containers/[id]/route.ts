import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("containers").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/containers/:id error", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
