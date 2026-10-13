"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import { Panel } from "../dashboard-ui";

interface Props {
  userEmail: string;
  userId: string;
  role: string;
}

type Preferences = {
  pageSize: number;
  dateFormat: "compact" | "full";
  soundFeedback: boolean;
  compactSidebar: boolean;
};

const storageKey = "itclub.admin.preferences";

export default function AdminSettingsClient({ userEmail, userId, role }: Props) {
  const [prefs, setPrefs] = useState<Preferences>({
    pageSize: 20,
    dateFormat: "compact",
    soundFeedback: true,
    compactSidebar: false,
  });
  const [saved, setSaved] = useState(false);
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resetMessage, setResetMessage] = useState("");

  // In-session password update state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordState, setPasswordState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Preferences>;
          setPrefs((current) => ({ ...current, ...parsed }));
        }
      } catch {
        // Ignore malformed local preference data.
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const savePreferences = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(prefs));
      window.localStorage.setItem("itclub.admin.sidebar.compact", String(prefs.compactSidebar));
    } catch {
      // Ignore storage errors
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sendPasswordReset = async () => {
    setResetState("sending");
    setResetMessage("");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, { redirectTo });

    if (error) {
      setResetState("error");
      setResetMessage("Could not send the password reset email. Check Supabase Auth configuration.");
      return;
    }

    setResetState("sent");
    setResetMessage("Password recovery email sent successfully.");
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordState("error");
      setPasswordMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordState("error");
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordState("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordState("error");
      setPasswordMessage(error.message || "Failed to update password.");
      return;
    }

    setPasswordState("saved");
    setPasswordMessage("Password updated successfully.");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setPasswordState("idle");
      setPasswordMessage("");
    }, 3500);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel title="Account and Profile" description="Verified staff identity from Supabase Auth and the staff role table.">
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3 border border-white/10 bg-[#050708] p-4">
            <ShieldCheck size={19} className="mt-0.5 text-[#00e599]" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{userEmail}</p>
              <p className="mt-1 break-all text-xs text-white/42">User ID: {userId}</p>
              <span className={`mt-3 inline-flex border px-2.5 py-1 text-[11px] font-bold uppercase ${
                role === "owner"
                  ? "border-[#9b7cff]/35 bg-[#9b7cff]/10 text-[#b49dff]"
                  : "border-[#00e599]/35 bg-[#00e599]/10 text-[#00e599]"
              }`}>
                {role}
              </span>
            </div>
          </div>
          <p className="text-xs leading-5 text-white/45">
            Admins cannot change their own privileges from the dashboard. This prevents accidental privilege escalation and keeps the role model server-owned.
          </p>
          <form action="/auth/signout" method="POST" className="border-t border-white/5 pt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 border border-white/10 px-4 py-2.5 text-xs font-bold text-white/72 transition-colors hover:border-white/20 hover:text-white"
            >
              <LogOut size={14} />
              Sign out of this session
            </button>
          </form>
        </div>
      </Panel>

      <Panel title="Security & Credentials" description="Direct in-session password updates and recovery email triggers.">
        <div className="space-y-5 p-5">
          <form onSubmit={handleUpdatePassword} className="space-y-3 border border-white/10 bg-[#050708] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <KeyRound size={15} className="text-[#00e599]" />
              Update Account Password
            </div>
            <p className="text-xs leading-5 text-white/45">
              Change your staff login password directly in your authenticated session.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                  New Password
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-white/10 bg-[#080a0c] px-3 py-2 text-xs text-white focus:border-[#00e599] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Confirm Password
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full border border-white/10 bg-[#080a0c] px-3 py-2 text-xs text-white focus:border-[#00e599] focus:outline-none"
                />
              </label>
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={passwordState === "saving" || !newPassword}
                className="inline-flex items-center gap-2 bg-[#00e599] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#050708] transition-colors hover:bg-[#00c985] disabled:opacity-40"
              >
                {passwordState === "saving" ? "Updating..." : "Update Password"}
              </button>
              {passwordMessage ? (
                <p className={`text-xs ${passwordState === "error" ? "text-rose-400" : "text-[#00e599]"}`}>
                  {passwordMessage}
                </p>
              ) : null}
            </div>
          </form>

          <div className="flex flex-col gap-3 border border-white/10 bg-[#050708] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-white">Password reset email</p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                Sends a recovery email using the configured Supabase Auth email provider.
              </p>
            </div>
            <button
              type="button"
              onClick={sendPasswordReset}
              disabled={resetState === "sending"}
              className="inline-flex items-center justify-center gap-2 border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              <Mail size={14} />
              {resetState === "sending" ? "Sending..." : "Send reset link"}
            </button>
          </div>
          {resetMessage ? (
            <p className={`text-xs ${resetState === "error" ? "text-rose-400" : "text-[#00e599]"}`}>
              {resetMessage}
            </p>
          ) : null}
        </div>
      </Panel>

      <Panel title="Interface Preferences" description="Stored locally in this browser; no server secrets or staff records are changed.">
        <div className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Default application page size
              </span>
              <select
                value={prefs.pageSize}
                onChange={(event) => setPrefs((value) => ({ ...value, pageSize: Number(event.target.value) }))}
                className="w-full border border-white/10 bg-[#050708] px-3 py-2.5 text-sm text-white focus:border-[#00e599] focus:outline-none"
              >
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Date display
              </span>
              <select
                value={prefs.dateFormat}
                onChange={(event) => setPrefs((value) => ({ ...value, dateFormat: event.target.value as Preferences["dateFormat"] }))}
                className="w-full border border-white/10 bg-[#050708] px-3 py-2.5 text-sm text-white focus:border-[#00e599] focus:outline-none"
              >
                <option value="compact">Compact dates</option>
                <option value="full">Full dates</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between border border-white/10 bg-[#050708] p-3">
              <div>
                <p className="text-xs font-bold text-white">Scanner audio feedback</p>
                <p className="text-[11px] text-white/40">Play confirmation tone on QR scan</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.soundFeedback}
                onChange={(e) => setPrefs((v) => ({ ...v, soundFeedback: e.target.checked }))}
                className="h-4 w-4 accent-[#00e599]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between border border-white/10 bg-[#050708] p-3">
              <div>
                <p className="text-xs font-bold text-white">Compact sidebar</p>
                <p className="text-[11px] text-white/40">Default to collapsed desktop navigation</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.compactSidebar}
                onChange={(e) => setPrefs((v) => ({ ...v, compactSidebar: e.target.checked }))}
                className="h-4 w-4 accent-[#00e599]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={savePreferences}
            className="inline-flex items-center gap-2 bg-[#00e599] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[#050708] transition-colors hover:bg-[#00c985]"
          >
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? "Preferences Saved" : "Save preferences"}
          </button>
        </div>
      </Panel>
    </div>
  );
}
