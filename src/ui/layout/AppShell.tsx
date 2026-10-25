
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import MobileNavigation from "./MobileNavigation";

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;

  const getBackPath = (): string => {
    // Menstrual journey
    if (
      path.startsWith("/menstrual/") &&
      path !== "/menstrual/profile"
    ) {
      return "/menstrual";
    }

    // Maternity journey
    if (
      path.startsWith("/maternity/") &&
      path !== "/maternity/profile" &&
      path !== "/maternity/dashboard"
    ) {
      return "/maternity";
    }

    // Menopause journey
    if (
      path.startsWith("/menopause/") &&
      path !== "/menopause/profile" &&
      path !== "/menopause/dashboard"
    ) {
      return "/menopause";
    }

    // Settings pages
    if (path === "/settings/privacy") {
      return "/settings";
    }

    if (path === "/profile/health-history") {
      return "/home";
    }

    // General protected pages
    if (path === "/settings" || path === "/appointments" || path === "/learn") {
      return "/home";
    }

    if (path === "/select-journey" || path === "/onboarding") {
      return "/home";
    }

    // Journey dashboards return to the home page
    if (
      path === "/menstrual" ||
      path === "/maternity" ||
      path === "/menopause"
    ) {
      return "/home";
    }

    return "/home";
  };

  const backPath = getBackPath();

  return (
    <div className="app-shell">
      <TopBar />

      <div
        className="app-layout"
        style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
      >
        <main id="main-content" className="main-content">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            aria-label="Go back"
            title="Go back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              margin: "0 0 12px 0",
              padding: 0,
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: "50%",
              background: "var(--card, #ffffff)",
              color: "var(--foreground, #374151)",
              cursor: "pointer",
              fontSize: "22px",
              lineHeight: 1,
            }}
          >
            ←
          </button>

          <Outlet />
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
