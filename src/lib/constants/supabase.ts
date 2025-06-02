import { createClient } from "@supabase/supabase-js";
const supabaseUrl =
  process.env.PUBLIC_SUPABASE_URL || "https://ynlqjvrpsjkvtluvhmrc.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);
