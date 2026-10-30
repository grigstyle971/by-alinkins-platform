import { redirect } from "next/navigation";
import ProfileEditor from "@/components/ProfileEditor";
import ProfileHeader from "@/components/ProfileHeader";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("email,first_name,last_name,age").eq("id", user.id).maybeSingle();
  return <><ProfileHeader /><ProfileEditor initialProfile={{ email: user.email ?? profile?.email ?? "", first_name: profile?.first_name ?? "", last_name: profile?.last_name ?? "", age: profile?.age ?? null }} /></>;
}
