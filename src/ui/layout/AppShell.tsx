
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import MobileNavigation from "./MobileNavigation";

export default function AppShell() {
  return (
    <div className="app-shell">
      <TopBar />

      <div
        className="app-layout"
        style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
      >
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
