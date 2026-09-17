import { describe, expect, it } from "vitest";

import { formatCountdown, formatDuration, formatImageUrl, rankColor } from "./formatters";

describe("formatters", () => {
  it("formats contest timing and profile values", () => {
    expect(formatDuration(8_100)).toBe("2h 15m");
    expect(formatCountdown(10_800, 0)).toBe("3h 0m");
    expect(formatImageUrl("//userpic.codeforces.org/avatar.png")).toBe(
      "https://userpic.codeforces.org/avatar.png",
    );
    expect(rankColor(2_500)).toBe("#f57c00");
  });
});
