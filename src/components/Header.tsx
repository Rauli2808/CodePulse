import type { NavSection } from "../hooks/useActiveSection";

type HeaderProps = {
  theme: "light" | "dark";
  activeSection: NavSection;
  userStatsHref: "#user-stats" | "#user-analytics";
  onToggleTheme: () => void;
  onNavigate: (section: NavSection) => void;
};

const navItems: Array<{ label: string; section: NavSection; href: string }> = [
  { label: "Overview", section: "overview", href: "#overview" },
  { label: "User stats", section: "user-stats", href: "#user-stats" },
  { label: "Contests", section: "contests", href: "#contests" },
  { label: "Compare", section: "compare", href: "#compare" },
];

export function Header({
  theme,
  activeSection,
  userStatsHref,
  onToggleTheme,
  onNavigate,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <a className="logo" href="#overview" aria-label="CodePulse home" onClick={() => onNavigate("overview")}>
          Code<span>Pulse</span>
          <i aria-hidden="true" />
        </a>
        <nav aria-label="Main navigation">
          {navItems.map((item) => {
            const active = activeSection === item.section;
            const href = item.section === "user-stats" ? userStatsHref : item.href;
            return (
              <a
                key={item.section}
                className={active ? "nav-active" : undefined}
                href={href}
                aria-current={active ? "location" : undefined}
                onClick={() => onNavigate(item.section)}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-pressed={theme === "dark"}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>
        <a className="header-link" href="https://codeforces.com" target="_blank" rel="noreferrer">
          Codeforces ↗
        </a>
      </div>
    </header>
  );
}
