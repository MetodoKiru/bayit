import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HouseholdDashboard from "@/components/household-dashboard";

export default async function AppHome() {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  return <HouseholdDashboard email={user.email??""}/>;
}
