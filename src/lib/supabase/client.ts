import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  return createBrowserClient(env.url, env.key);
}