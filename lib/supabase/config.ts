import { resolveSupabaseConfiguration } from "./config-policy.ts";

const configuration = resolveSupabaseConfiguration({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  nodeEnv: process.env.NODE_ENV,
});

export const supabaseUrl = configuration.url;
export const supabasePublishableKey = configuration.key;
export const supabaseConfigurationError = configuration.error;
export const isSupabaseConfigured = configuration.configured;
export function assertSupabaseConfigured() {
  if (supabaseConfigurationError) throw new Error(supabaseConfigurationError);
}

// A publishable key is intentionally safe for browser use. Never place a
// Supabase secret/service-role key in this file or in any NEXT_PUBLIC_ variable.
