
import { NavLink } from "react-router-dom";

const items = [
  { label: "Home", path: "/home", icon: "⌂" },
  { label: "Journey", path: "/select-journey", icon: "◒" },
  { label: "Calendar", path: "/appointments", icon: "▦" },
  { label: "Learn", path: "/learn", icon: "✿" },
  { label: "Profile", path: "/settings", icon: "○" },
];

export default function MobileNavigation() {
  return (
    <nav className="mobile-navigation" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/home"}
          className={({ isActive }) =>
            `mobile-nav-item${isActive ? " active" : ""}`
          }
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
