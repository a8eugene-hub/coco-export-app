import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabaseClient";

export default async function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authClient = createClientServer(cookieStore as { getAll: () => { name: string; value: string }[] });
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
