export type ComparisonHandles = { user1: string; user2: string };

export function readComparisonHandles(search: string): ComparisonHandles | null {
  const params = new URLSearchParams(search);
  const user1 = params.get("user1")?.trim() || "";
  const user2 = params.get("user2")?.trim() || "";
  return user1 && user2 ? { user1, user2 } : null;
}

export function buildComparisonUrl(baseUrl: string, user1: string, user2: string) {
  const url = new URL(baseUrl);
  url.searchParams.set("user1", user1.trim());
  url.searchParams.set("user2", user2.trim());
  url.hash = "compare";
  return url;
}
