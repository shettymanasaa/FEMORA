
import { NavLink, useLocation } from "react-router-dom";
import { useAppContext } from "../../app/providers";
import { journeyHome } from "../../lib/routes";

export default function MobileNavigation() {
  const { activeProfile } = useAppContext();
  const location = useLocation();

  const journeyPath = activeProfile?.journey
    ? journeyHome(activeProfile.journey)
    : "/select-journey";

  const items = [
    { label: "Home", path: "/home", icon: "⌂" },
    { label: "Journey", path: journeyPath, icon: "◒" },
    { label: "Calendar", path: "/appointments", icon: "▦" },
    { label: "Learn", path: "/learn", icon: "✿" },
    { label: "Profile", path: "/settings", icon: "○" },
  ];

  return (
    <nav className="mobile-navigation" aria-label="Main navigation">
      {items.map((item) => {
        const isJourneyItem = item.label === "Journey";

        const isActive = isJourneyItem
          ? location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`)
          : undefined;

        return (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/home" || isJourneyItem}
            className={({ isActive: linkIsActive }) =>
              `mobile-nav-item${
                (isJourneyItem ? isActive : linkIsActive) ? " active" : ""
              }`
            }
          >
            <span className="mobile-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
