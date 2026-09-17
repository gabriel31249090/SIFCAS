export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://xqhilujzacwebeexljaf.supabase.co";

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_IMK_myXuxS82TdiqJumEJw_dTWI8e-h";

// A publishable key is intentionally safe for browser use. Never place a
// Supabase secret/service-role key in this file or in any NEXT_PUBLIC_ variable.
