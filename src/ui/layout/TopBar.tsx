import { Link } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "../../lib/constants";
import { useAppContext } from "../../app/providers";
import ProfileSocket from "../common/ProfileSocket";

export default function TopBar() {
  const { theme, setTheme } = useAppContext();

  return (
    <header className="topbar">
      <Link className="brand" to="/home" aria-label={`${APP_NAME} home`}>
        <img
          className="brand-logo"
          src="/assets/logo/femora-mark.png"
          alt=""
          width={42}
          height={42}
        />

        <span className="brand-copy">
          <strong>{APP_NAME}</strong>
          <small>{APP_TAGLINE}</small>
        </span>
      </Link>

      <div className="topbar-actions">
        <button
          className="icon-button"
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title="Toggle theme"
        >
          <span aria-hidden="true">{theme === "dark" ? "☼" : "☾"}</span>
        </button>

        {/* Profile Socket: The only credential required in FEMORA */}
        <ProfileSocket />
      </div>
    </header>
  );
}
