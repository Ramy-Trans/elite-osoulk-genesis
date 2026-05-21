// Supabase client — kept as a thin stub.
// All authentication and data access in this app is handled by the
// Express server at /api/*. This file exists only for legacy imports
// and will not make any real Supabase calls.

const noop = () => Promise.resolve({ data: null, error: null });

export const supabase = {
  auth: {
    getSession: noop,
    getUser: noop,
    signOut: noop,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};
