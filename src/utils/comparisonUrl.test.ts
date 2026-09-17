import { describe, expect, it } from "vitest";

import { buildComparisonUrl, readComparisonHandles } from "./comparisonUrl";

describe("comparison URLs", () => {
  it("round-trips both handles through query parameters", () => {
    const url = buildComparisonUrl("https://example.com/dashboard?keep=yes", "tourist", "Benq");
    expect(url.searchParams.get("keep")).toBe("yes");
    expect(readComparisonHandles(url.search)).toEqual({ user1: "tourist", user2: "Benq" });
    expect(url.hash).toBe("#compare");
  });
});
