"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users, UserPlus, Download, Search, Filter,
  Shield, AlertTriangle, ShieldOff, Eye, ChevronRight,
  CheckCircle, XCircle, Clock,
} from "lucide-react";
import { formatDate, formatRelative, getInitials, cn } from "@/lib/utils";
import { suspendUser, resetUserMFA } from "./actions";

const TABS = ["All Users", "Invited", "Suspended", "MFA Status", "Activity"] as const;
type Tab = typeof TABS[number];

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  is_platform_admin: boolean | null;
  is_suspended: boolean | null;
  mfa_enabled: boolean | null;
  workspace_memberships: any[];
}

interface Props {
  users: User[];
  error: string | null;
}

export function AdminUsersClient({ users, error }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("All Users");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (activeTab === "Suspended") return !!u.is_suspended;
    if (activeTab === "MFA Status") return true;
    if (activeTab === "Invited") return !u.last_sign_in_at;
    return true;
  });

  async function handleSuspend(userId: string, currentState: boolean) {
    startTransition(async () => {
      const result = await suspendUser(userId, !currentState);
      setActionMsg(result.error ?? `User ${currentState ? "unsuspended" : "suspended"} successfully`);
      router.refresh();
    });
  }

  async function handleResetMFA(userId: string) {
    startTransition(async () => {
      const result = await resetUserMFA(userId);
      setActionMsg(result.error ?? "MFA reset successfully");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>User Management</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {users.length} registered accounts
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Invite user modal – coming soon")}>
            <UserPlus size={14} /> Invite User
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting users CSV...")}>
            <Download size={14} /> Export Users
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ margin: "12px 24px 0", padding: "10px 14px", background: "var(--success-bg)", color: "var(--success-text)", borderRadius: "var(--radius)", fontSize: 13 }}>
          {actionMsg}
          <button style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit" }} onClick={() => setActionMsg(null)}>×</button>
        </div>
      )}

      <div className="tab-bar" style={{ marginTop: 16 }}>
        {TABS.map((t) => (
          <button key={t} className={`tab-item${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="page-content">
        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary btn-sm">
            <Filter size={14} /> Filter
          </button>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "var(--danger-bg)", color: "var(--danger-text)", borderRadius: "var(--radius)", fontSize: 13, marginBottom: 16 }}>
            Error loading users: {error}
          </div>
        )}

        {activeTab === "MFA Status" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            <div className="kpi-card">
              <div className="kpi-label">MFA Enabled</div>
              <div className="kpi-value">{users.filter((u) => u.mfa_enabled).length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">MFA Disabled</div>
              <div className="kpi-value">{users.filter((u) => !u.mfa_enabled).length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Coverage</div>
              <div className="kpi-value">
                {users.length > 0 ? Math.round((users.filter((u) => u.mfa_enabled).length / users.length) * 100) : 0}%
              </div>
            </div>
          </div>
        ) : null}

        <div className="card" style={{ overflow: "hidden", marginTop: activeTab === "MFA Status" ? 16 : 0 }}>
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Users size={20} /></div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No users found</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {search ? "Try a different search term" : "No users match this filter"}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Workspace</th>
                    <th>Plan</th>
                    <th>MFA</th>
                    <th>Last Login</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const primaryWs = user.workspace_memberships?.[0];
                    const ws = primaryWs?.workspaces;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 9999,
                              background: "var(--primary-light)", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700, color: "var(--primary)", flexShrink: 0
                            }}>
                              {getInitials(user.full_name ?? user.email)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{user.full_name ?? "—"}</div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>{ws?.name ?? "—"}</td>
                        <td>
                          {ws?.plan ? (
                            <span className="badge chip-info">{ws.plan}</span>
                          ) : "—"}
                        </td>
                        <td>
                          {user.mfa_enabled ? (
                            <CheckCircle size={15} style={{ color: "var(--success)" }} />
                          ) : (
                            <XCircle size={15} style={{ color: "var(--danger)" }} />
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {user.last_sign_in_at ? formatRelative(user.last_sign_in_at) : "Never"}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {formatDate(user.created_at)}
                        </td>
                        <td>
                          {user.is_suspended ? (
                            <span className="badge chip-danger">Suspended</span>
                          ) : user.is_platform_admin ? (
                            <span className="badge chip-violet">Platform Admin</span>
                          ) : (
                            <span className="badge chip-success">Active</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="View Details"
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title={user.is_suspended ? "Unsuspend" : "Suspend"}
                              onClick={() => handleSuspend(user.id, !!user.is_suspended)}
                              disabled={isPending}
                            >
                              {user.is_suspended ? <Shield size={13} /> : <ShieldOff size={13} />}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="Reset MFA"
                              onClick={() => {
                                if (confirm(`Reset MFA for ${user.full_name ?? user.email}?`)) {
                                  handleResetMFA(user.id);
                                }
                              }}
                              disabled={isPending}
                            >
                              <AlertTriangle size={13} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="View Details"
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
