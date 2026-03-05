import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function PATCH(req: NextRequest, context: any) {
  const { id } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("PATCH /api/tasks/:id error", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }

  return NextResponse.json(data);
}

