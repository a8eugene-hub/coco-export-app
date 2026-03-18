import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabaseClient";
import { MessagesTool } from "@/components/messages-tool";

export default async function MessagesPage() {
  const cookieStore = await cookies();
  const authClient = createClientServer(cookieStore as any);
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  return <MessagesTool />;
}

