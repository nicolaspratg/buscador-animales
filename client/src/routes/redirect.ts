/** Where to go after login: the page the visitor was bounced from, if any. */
export function getRedirectPath(state: unknown): string {
  if (typeof state !== "object" || state === null || !("from" in state)) return "/";
  const { from } = state;
  if (typeof from !== "object" || from === null || !("pathname" in from)) return "/";
  const pathname = typeof from.pathname === "string" ? from.pathname : "/";
  const search = "search" in from && typeof from.search === "string" ? from.search : "";
  return `${pathname}${search}`;
}
