import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export function createClient() {
  assertSupabaseConfigured();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
