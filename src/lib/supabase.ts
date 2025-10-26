import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let _supabase: any;

if (!supabaseUrl || !supabaseKey) {
  // Warn and provide a safe stub so the app doesn't crash during development
  // when env vars aren't set. The stub implements the small subset of the
  // Supabase client API used by this app.
  // eslint-disable-next-line no-console
  console.warn("VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Supabase will be non-functional.");

  const makeEmptyQuery = () => {
    const q: any = {
      select() {
        return q;
      },
      order() {
        return q;
      },
      eq() {
        return q;
      },
      or() {
        return q;
      },
      insert() {
        return Promise.resolve({ data: null, error: new Error("Supabase not configured") });
      },
      // make awaitable
      then(onFulfilled: any, onRejected: any) {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
      },
    };
    return q;
  };

  _supabase = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: null, subscription: { unsubscribe: () => {} } }),
      signInWithOtp: async () => ({ data: null, error: new Error("Supabase not configured") }),
      signOut: async () => ({ error: null }),
    },
    from: () => makeEmptyQuery(),
  };
} else {
  _supabase = createClient(supabaseUrl, supabaseKey);
}

export const supabase = _supabase;


