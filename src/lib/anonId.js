// A stable, browser-local id for signed-out visitors.
//
// The wager resolves identity from auth on the server, so this is never used
// to decide who wins the pot — it only keeps a signed-out person's guesses
// from being collapsed into one another in the field.
const KEY = "jejak_anon_id_v1";

export function getAnonId() {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "anonymous";
  }
}
