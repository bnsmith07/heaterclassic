import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
      "(in .env.local for local dev, or in Vercel project settings for production)."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE = "app_storage";

/*
 * The scoring app was written against the Claude artifact `window.storage` API.
 * Rather than rewrite every call site, we provide the same shape here backed by Supabase.
 *
 * IMPORTANT CONTRACT: `get` must THROW when a key is missing. The app relies on
 * catching that to fall back to its built-in defaults (roster, rounds, empty scores).
 * Returning null instead would break first-load setup.
 */
const storage = {
  async get(key) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Key not found: ${key}`);
    return { key, value: data.value, shared: true };
  },

  async set(key, value) {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) throw error;
    return { key, value, shared: true };
  },

  async delete(key) {
    const { error } = await supabase.from(TABLE).delete().eq("key", key);
    if (error) throw error;
    return { key, deleted: true, shared: true };
  },

  async list(prefix = "") {
    let query = supabase.from(TABLE).select("key");
    if (prefix) query = query.like("key", `${prefix}%`);
    const { data, error } = await query;
    if (error) throw error;
    return { keys: (data || []).map((r) => r.key), prefix, shared: true };
  },
};

if (typeof window !== "undefined") {
  window.storage = storage;
}

export default storage;
