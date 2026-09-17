import { useEffect, useState } from "react";

export type NavSection = "overview" | "contests" | "user-stats" | "compare";

const sectionMap: Record<string, NavSection> = {
  overview: "overview",
  contests: "contests",
  "user-stats": "user-stats",
  "user-analytics": "user-stats",
  compare: "compare",
};

const BOTTOM_ACTIVATION_OFFSET = 48;

function sectionFromHash(): NavSection {
  return sectionMap[window.location.hash.slice(1)] || "overview";
}

export function useActiveSection(hasAnalytics: boolean) {
  const [activeSection, setActiveSection] = useState<NavSection>(sectionFromHash);

  useEffect(() => {
    const syncFromHash = () => setActiveSection(sectionFromHash());
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    const orderedIds = [
      "overview",
      "user-stats",
      "contests",
      ...(hasAnalytics ? ["user-analytics"] : []),
      "compare",
    ];
    let animationFrame = 0;

    const syncFromViewport = () => {
      animationFrame = 0;
      const pageHeight = document.documentElement.scrollHeight;
      if (pageHeight <= window.innerHeight) return;

      if (window.scrollY + window.innerHeight >= pageHeight - BOTTOM_ACTIVATION_OFFSET) {
        setActiveSection("compare");
        return;
      }

      if (window.scrollY < 32) {
        if (!window.location.hash) setActiveSection("overview");
        return;
      }

      const headerHeight = document.querySelector<HTMLElement>(".app-header")?.offsetHeight || 0;
      const activationLine = headerHeight + 36;
      const visibleIds = orderedIds.filter((id) => {
        const element = document.getElementById(id);
        if (!element) return false;
        const bounds = element.getBoundingClientRect();
        return bounds.top <= activationLine && bounds.bottom > activationLine;
      });
      if (!visibleIds.length) return;

      const hashSection = sectionFromHash();
      const hashMatchesVisibleSection = window.location.hash
        && visibleIds.some((id) => sectionMap[id] === hashSection);
      const currentId = hashMatchesVisibleSection ? undefined : visibleIds.at(-1);
      setActiveSection(hashMatchesVisibleSection ? hashSection : sectionMap[currentId || ""] || "overview");
    };

    const scheduleSync = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(syncFromViewport);
    };

    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    scheduleSync();
    return () => {
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [hasAnalytics]);

  return { activeSection, setActiveSection };
}
