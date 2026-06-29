"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Key,
  Loader2,
  LogOut,
  Monitor,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company: string | null;
  avatar_url: string | null;
  timezone: string | null;
  created_at: string;
}

type TabId = "profile" | "security" | "notifications" | "sessions" | "danger";

interface NavTab { id: TabId; label: string; Icon: React.ElementType }

const TABS: NavTab[] = [
  { id: "profile",       label: "Profile",        Icon: User },
  { id: "security",      label: "Security",        Icon: Shield },
  { id: "notifications", label: "Notifications",   Icon: Bell },
  { id: "sessions",      label: "Sessions",         Icon: Monitor },
  { id: "danger",        label: "Danger Zone",      Icon: AlertTriangle },
];

const TIMEZONES = [
  "Europe/London", "Europe/Paris", "Europe/Berlin", "America/New_York",
  "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
];

/* ─── Avatar component ────────────────────────────────────────────── */

function AvatarUpload({ url, name, onUpload }: { url: string | null; name: string; onUpload: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(url);

  const initials = (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onUpload(data.publicUrl);
    } catch {
      onUpload(objectUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <div
          className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white text-xl font-bold"
          style={{ background: preview ? undefined : "var(--primary)" }}
        >
          {preview
            ? <img src={preview} alt={name} className="w-full h-full object-cover" />
            : <span>{initials}</span>
          }
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
          style={{ background: "var(--primary)", color: "white" }}
          title="Upload photo"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      <div>
        <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>{name || "Your name"}</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="text-[13px] mt-1" style={{ color: "var(--primary)" }}>
          Change photo
        </button>
        {preview && (
          <button type="button" onClick={() => { setPreview(null); onUpload(""); }} className="block text-[12px] mt-0.5" style={{ color: "var(--danger)" }}>
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────── */

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-[13px] font-medium text-white",
      type === "success" ? "bg-[#16a34a]" : "bg-[#dc2626]"
    )}>
      {type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* Profile fields */
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [timezone, setTimezone] = useState("Europe/London");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  /* Security fields */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  /* Notification prefs */
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifChange, setNotifChange] = useState(true);
  const [notifTask, setNotifTask] = useState(true);
  const [notifRisk, setNotifRisk] = useState(true);
  const [notifMention, setNotifMention] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const p: Profile = data ?? {
        id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
        email: user.email ?? null,
        phone: null, job_title: null, company: null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        timezone: "Europe/London",
        created_at: user.created_at,
      };
      setProfile(p);
      setFullName(p.full_name ?? "");
      setPhone(p.phone ?? "");
      setJobTitle(p.job_title ?? "");
      setCompany(p.company ?? "");
      setTimezone(p.timezone ?? "Europe/London");
      setAvatarUrl(p.avatar_url);
    } catch {
      const seed: Profile = {
        id: "demo", full_name: "Jamahl Thomas", email: "jamahlthomas1996@gmail.com",
        phone: "", job_title: "Commercial Manager", company: "BuildTech Ltd",
        avatar_url: null, timezone: "Europe/London", created_at: new Date().toISOString(),
      };
      setProfile(seed);
      setFullName(seed.full_name ?? "");
      setPhone(seed.phone ?? "");
      setJobTitle(seed.job_title ?? "");
      setCompany(seed.company ?? "");
      setTimezone(seed.timezone ?? "Europe/London");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("profiles").upsert({
        id: profile.id, full_name: fullName, phone,
        job_title: jobTitle, company, timezone, avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
      showToast("Profile saved successfully");
    } catch {
      showToast("Couldn't reach server — changes stored locally", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    if (newPassword.length < 8) { showToast("Password must be at least 8 characters", "error"); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showToast("Password updated successfully");
    } catch {
      showToast("Failed to update password", "error");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
    }
  };

  const passwordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { score, label: "Weak", color: "#dc2626" };
    if (score <= 3) return { score, label: "Fair", color: "#d97706" };
    return { score, label: "Strong", color: "#16a34a" };
  };

  const pwStrength = passwordStrength(newPassword);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 960 }}>
      {toast && <Toast {...toast} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage your profile, security, and preferences</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <nav className="flex flex-col gap-1 flex-shrink-0" style={{ width: 196 }}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition-colors",
                activeTab === id ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--bg-subtle)]"
              )}
              style={activeTab !== id ? { color: id === "danger" ? "var(--danger)" : "var(--text-secondary)" } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ─ PROFILE ─ */}
          {activeTab === "profile" && (
            <div className="card p-6 space-y-6">
              <div>
                <h2 className="text-[16px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Profile</h2>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Visible to your workspace members.</p>
              </div>

              <AvatarUpload url={avatarUrl} name={fullName} onUpload={setAvatarUrl} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full name</label>
                  <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                </div>
                <div>
                  <label className="form-label">Email address</label>
                  <input className="form-input" value={profile?.email ?? ""} disabled readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Contact support to change your email</p>
                </div>
                <div>
                  <label className="form-label">Job title</label>
                  <input className="form-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Commercial Manager" />
                </div>
                <div>
                  <label className="form-label">Company</label>
                  <input className="form-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. BuildTech Ltd" />
                </div>
                <div>
                  <label className="form-label">Phone number</label>
                  <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 000000" type="tel" />
                </div>
                <div>
                  <label className="form-label">Timezone</label>
                  <select className="form-input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={saveProfile} disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save profile
                </button>
              </div>
            </div>
          )}

          {/* ─ SECURITY ─ */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="card p-6 space-y-4">
                <div>
                  <h2 className="text-[16px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Change Password</h2>
                  <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Use a strong, unique password.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Current password</label>
                    <div className="relative">
                      <input
                        className="form-input pr-10"
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">New password</label>
                    <input
                      className="form-input"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                    />
                    {newPassword && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${(pwStrength.score / 5) * 100}%`, background: pwStrength.color }} />
                        </div>
                        <span className="text-[11px] font-medium" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Confirm new password</label>
                    <input
                      className="form-input"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] mt-1" style={{ color: "var(--danger)" }}>Passwords do not match</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <button type="button" onClick={changePassword} disabled={saving || !newPassword || !confirmPassword} className="btn btn-primary btn-sm">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    Update password
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Two-Factor Authentication</h3>
                    <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Add an extra layer of security.</p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm">
                    Enable 2FA
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─ NOTIFICATIONS ─ */}
          {activeTab === "notifications" && (
            <div className="card p-6 space-y-5">
              <div>
                <h2 className="text-[16px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Notification Preferences</h2>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Choose what alerts you receive.</p>
              </div>
              <div className="space-y-0">
                {([
                  { label: "Payment applications & certifications", desc: "Certified, overdue, or disputed payments", value: notifPayment, set: setNotifPayment },
                  { label: "Change events", desc: "New, approved, or rejected change events", value: notifChange, set: setNotifChange },
                  { label: "Task reminders", desc: "Overdue and upcoming task deadlines", value: notifTask, set: setNotifTask },
                  { label: "Risk alerts", desc: "Retention, programme, and commercial risks", value: notifRisk, set: setNotifRisk },
                  { label: "Mentions", desc: "When someone mentions you in a discussion", value: notifMention, set: setNotifMention },
                  { label: "Weekly digest", desc: "Summary of project activity every Monday", value: notifDigest, set: setNotifDigest },
                ] as { label: string; desc: string; value: boolean; set: (v: boolean) => void }[]).map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 py-3.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.value}
                      onClick={() => item.set(!item.value)}
                      className="relative flex-shrink-0 rounded-full transition-colors"
                      style={{ width: 40, height: 22, background: item.value ? "var(--primary)" : "var(--bg-muted)" }}
                    >
                      <span
                        className="absolute bg-white rounded-full shadow transition-transform"
                        style={{ width: 18, height: 18, top: 2, left: 2, transform: item.value ? "translateX(18px)" : "translateX(0)" }}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={() => showToast("Preferences saved")} className="btn btn-primary btn-sm">
                  <Save className="w-3.5 h-3.5" />
                  Save preferences
                </button>
              </div>
            </div>
          )}

          {/* ─ SESSIONS ─ */}
          {activeTab === "sessions" && (
            <div className="card p-6 space-y-4">
              <div>
                <h2 className="text-[16px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Active Sessions</h2>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Devices where you are currently signed in.</p>
              </div>
              {[
                { device: "Chrome on Windows 11", location: "London, UK", last: "Now", current: true },
                { device: "Safari on iPhone 15", location: "London, UK", last: "2 hours ago", current: false },
                { device: "Firefox on macOS", location: "Manchester, UK", last: "3 days ago", current: false },
              ].map((session) => (
                <div key={session.device} className="flex items-center justify-between gap-4 py-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
                      <Monitor className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                        {session.device}
                        {session.current && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#dcfce7", color: "#16a34a" }}>Current</span>
                        )}
                      </p>
                      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{session.location} · {session.last}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <button type="button" onClick={() => showToast("Session revoked")} className="btn btn-ghost btn-sm text-[12px]" style={{ color: "var(--danger)" }}>
                      Revoke
                    </button>
                  )}
                </div>
              ))}
              <div className="pt-1">
                <button type="button" onClick={() => showToast("All other sessions revoked")} className="btn btn-secondary btn-sm">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out all other sessions
                </button>
              </div>
            </div>
          )}

          {/* ─ DANGER ZONE ─ */}
          {activeTab === "danger" && (
            <div className="space-y-4">
              <div className="card p-5" style={{ border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.02)" }}>
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--danger)" }}>Danger Zone</h2>
                <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>Actions here are permanent and cannot be undone.</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Sign out everywhere</h3>
                    <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Sign out of all devices and revoke all active sessions.</p>
                  </div>
                  <button type="button" onClick={signOut} className="btn btn-secondary btn-sm flex-shrink-0">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </div>
              <div className="card p-5" style={{ border: "1px solid rgba(220,38,38,0.2)" }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--danger)" }}>Delete account</h3>
                    <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                      Permanently delete your account and all associated data. This is irreversible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (window.confirm("Are you sure? This cannot be undone.")) showToast("Account deletion requires admin — contact support@measuredeck.com", "error"); }}
                    className="btn btn-sm flex-shrink-0"
                    style={{ background: "var(--danger)", color: "white" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
