import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../app/providers";

const JOURNEY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  menstrual: { label: "Menstrual", icon: "🌸", color: "#C77D88" },
  maternity: { label: "Maternity", icon: "🌿", color: "#8C9B83" },
  menopause: { label: "Menopause", icon: "🪻", color: "#B69BC8" },
};

export default function ProfileSocket() {
  const {
    activeProfile,
    profiles,
    selectProfile,
    clearActiveProfile,
    loginAsDemoPersona,
  } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleSwitchProfile(id: string) {
    selectProfile(id);
    setIsOpen(false);
    const target = profiles.find((p) => p.id === id);
    if (target?.journey) {
      navigate(`/${target.journey}`);
    } else {
      navigate("/home");
    }
  }

  async function handleDemoSwitch(persona: "menstrual" | "maternity" | "menopause") {
    setLoadingDemo(true);
    try {
      await loginAsDemoPersona(persona);
      setIsOpen(false);
      if (persona === "menstrual") {
        navigate("/menstrual");
      } else if (persona === "maternity") {
        navigate("/maternity");
      } else {
        navigate("/menopause");
      }
    } finally {
      setLoadingDemo(false);
    }
  }

  function handleEject() {
    clearActiveProfile();
    setIsOpen(false);
    navigate("/profiles");
  }

  if (!activeProfile) {
    return (
      <Link
        to="/profiles"
        className="button button-primary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          fontSize: "0.85rem",
          borderRadius: 999,
        }}
        aria-label="Plug in a profile socket"
      >
        <span aria-hidden="true">🔌</span>
        <span>Plug in Profile</span>
      </Link>
    );
  }

  const journeyMeta =
    (activeProfile.journey && JOURNEY_LABELS[activeProfile.journey]) || {
      label: "General",
      icon: "✨",
      color: "var(--color-primary, #6b8e23)",
    };

  return (
    <div
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Trigger: Profile Socket Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="profile-chip"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px 4px 6px",
          borderRadius: 999,
          border: isOpen ? "1px solid var(--color-primary, #4a6741)" : "1px solid var(--border, #d8dfd5)",
          background: "var(--surface, #ffffff)",
          cursor: "pointer",
          boxShadow: isOpen ? "0 0 0 2px rgba(74, 103, 65, 0.2)" : "none",
          transition: "all 0.15s ease",
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Profile socket: ${activeProfile.nickname}. Click to switch.`}
      >
        {/* Connection status indicator */}
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#10b981", // vibrant connected green
            boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)",
            marginLeft: 2,
          }}
          title="Profile Socket Connected"
        />

        {/* Profile Avatar */}
        <span
          className="avatar avatar-small"
          style={{
            backgroundColor: activeProfile.avatarColor || "#C77D88",
            width: 24,
            height: 24,
            fontSize: "0.75rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            color: "#fff",
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          {activeProfile.nickname.charAt(0).toUpperCase()}
        </span>

        {/* Profile Details */}
        <div style={{ textAlign: "left", lineHeight: 1.1 }}>
          <span
            className="profile-chip-name"
            style={{ display: "block", fontSize: "0.82rem", fontWeight: 700 }}
          >
            {activeProfile.nickname}
          </span>
          <small
            style={{
              fontSize: "0.7rem",
              color: journeyMeta.color,
              fontWeight: 600,
            }}
          >
            {journeyMeta.icon} {journeyMeta.label}
          </small>
        </div>

        {/* Dropdown chevron */}
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--color-muted-foreground, #777)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Profile Socket Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxWidth: "90vw",
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--border, #d8dfd5)",
            borderRadius: 14,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              paddingBottom: 12,
              marginBottom: 12,
              borderBottom: "1px solid var(--border, #e5eae3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "0.68rem",
                  letterSpacing: "0.08em",
                  fontWeight: 800,
                  color: "var(--color-primary, #4a6741)",
                  textTransform: "uppercase",
                }}
              >
                PROFILE SOCKET • ACTIVE
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  fontWeight: 600,
                }}
              >
                ● Connected
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 8,
              }}
            >
              <span
                className="avatar"
                style={{
                  backgroundColor: activeProfile.avatarColor || "#C77D88",
                  width: 38,
                  height: 38,
                  fontSize: "1.1rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {activeProfile.nickname.charAt(0).toUpperCase()}
              </span>
              <div>
                <strong style={{ fontSize: "0.95rem", display: "block" }}>
                  {activeProfile.nickname}
                </strong>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-muted-foreground, #666)",
                  }}
                >
                  {journeyMeta.icon} {journeyMeta.label} Journey
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: "0.73rem",
                color: "var(--color-muted-foreground, #777)",
                margin: "8px 0 0 0",
                lineHeight: 1.3,
              }}
            >
              🛡️ Encrypted &amp; saved only in this browser. Only your profile is
              required to use FEMORA.
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "var(--color-muted-foreground, #777)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Switch Demo Persona Socket
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <button
                type="button"
                onClick={() => handleDemoSwitch("menstrual")}
                disabled={loadingDemo}
                style={{
                  padding: "6px 4px",
                  borderRadius: 8,
                  border: "1px solid #e2ccd2",
                  background: activeProfile.journey === "menstrual" && activeProfile.isSample ? "#faeef0" : "#fff",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <span style={{ display: "block", fontSize: "0.9rem" }}>🌸</span>
                <strong>Priya</strong>
                <span style={{ display: "block", fontSize: "0.65rem", color: "#C77D88" }}>Menstrual</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSwitch("maternity")}
                disabled={loadingDemo}
                style={{
                  padding: "6px 4px",
                  borderRadius: 8,
                  border: "1px solid #d4ded0",
                  background: activeProfile.journey === "maternity" && activeProfile.isSample ? "#f0f5ee" : "#fff",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <span style={{ display: "block", fontSize: "0.9rem" }}>🌿</span>
                <strong>Aria</strong>
                <span style={{ display: "block", fontSize: "0.65rem", color: "#8C9B83" }}>Maternity</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSwitch("menopause")}
                disabled={loadingDemo}
                style={{
                  padding: "6px 4px",
                  borderRadius: 8,
                  border: "1px solid #ded4e8",
                  background: activeProfile.journey === "menopause" && activeProfile.isSample ? "#f6f1fa" : "#fff",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <span style={{ display: "block", fontSize: "0.9rem" }}>🪻</span>
                <strong>Elena</strong>
                <span style={{ display: "block", fontSize: "0.65rem", color: "#B69BC8" }}>Menopause</span>
              </button>
            </div>
          </div>

          {/* User's Other Local Profiles (if any) */}
          {profiles.filter((p) => p.id !== activeProfile.id).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "var(--color-muted-foreground, #777)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Your Other Profiles
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {profiles
                  .filter((p) => p.id !== activeProfile.id)
                  .slice(0, 3)
                  .map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleSwitchProfile(p.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: "1px solid var(--border, #e5eae3)",
                        background: "#fff",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: p.avatarColor || "#999",
                          color: "#fff",
                          fontSize: "0.65rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {p.nickname.charAt(0).toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.8rem", flex: 1, fontWeight: 600 }}>
                        {p.nickname}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-primary, #4a6741)" }}>
                        Plug in →
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Action Links */}
          <div
            style={{
              paddingTop: 8,
              borderTop: "1px solid var(--border, #e5eae3)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <Link
              to="/profiles/new"
              onClick={() => setIsOpen(false)}
              style={{
                display: "block",
                padding: "6px 8px",
                fontSize: "0.78rem",
                color: "var(--text, #333)",
                textDecoration: "none",
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              ＋ New Profile Socket
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              style={{
                display: "block",
                padding: "6px 8px",
                fontSize: "0.78rem",
                color: "var(--text, #333)",
                textDecoration: "none",
                borderRadius: 6,
              }}
            >
              ⚙️ Settings &amp; Data Vault
            </Link>

            <button
              type="button"
              onClick={handleEject}
              style={{
                display: "block",
                width: "100%",
                padding: "6px 8px",
                fontSize: "0.78rem",
                color: "#dc2626",
                background: "transparent",
                border: "none",
                borderRadius: 6,
                textAlign: "left",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ⏏️ Eject Profile (Log out)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
