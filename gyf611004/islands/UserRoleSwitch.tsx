import { useState, useEffect } from "preact/hooks";
import { User, UserRole } from "../types/index.ts";
import { getUsers, getCurrentUser, setCurrentUser, seedInitialData } from "../utils/storage.ts";

export default function UserRoleSwitch() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    seedInitialData();
    setUsers(getUsers());
    setCurrentUserState(getCurrentUser());
  }, []);

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setCurrentUserState(user);
    setShowDropdown(false);
    window.dispatchEvent(new CustomEvent("userChanged", { detail: user }));
  };

  const roleLabel: Record<UserRole, string> = {
    operator: "操作员",
    curator: "馆长",
    admin: "管理员",
  };

  if (!currentUser) return null;

  return (
    <div style="position: relative;">
      <div
        class="user-info"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div class="user-avatar">
          {currentUser.name.charAt(0)}
        </div>
        <div>
          <div class="user-name">{currentUser.name}</div>
          <div class="user-role">{roleLabel[currentUser.role]}</div>
        </div>
        <span style="font-size: 12px;">▼</span>
      </div>

      {showDropdown && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99,
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              minWidth: "180px",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <div style="padding: 8px 12px; font-size: 12px; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">
              切换角色
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => switchUser(user)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  background: user.id === currentUser.id ? "var(--bg-hover)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    user.id === currentUser.id ? "var(--bg-hover)" : "transparent";
                }}
              >
                <div
                  class="user-avatar"
                  style={{ width: "28px", height: "28px", fontSize: "12px" }}
                >
                  {user.name.charAt(0)}
                </div>
                <div style="flex: 1;">
                  <div style={{ fontWeight: 500 }}>{user.name}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">
                    {roleLabel[user.role]}
                  </div>
                </div>
                {user.id === currentUser.id && (
                  <span style="color: var(--accent-green);">✓</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
