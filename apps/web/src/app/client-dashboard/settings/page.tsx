"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Building2, Save, Check, Eye, EyeOff } from "lucide-react";
import { updateClientProfile } from "@/lib/client-portal-api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ClientSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"profile" | "security">("profile");
  const [form, setForm] = useState({ name: "", phone: "", organization: "", bio: "" });
  const [pwForm, setPwForm] = useState({ current: "", newPass: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setForm({ name: u.name || "", phone: u.phone || "", organization: u.organization || "", bio: u.bio || "" });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const updated = await updateClientProfile(form);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));
      setUser((u: any) => ({ ...u, ...updated }));
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (pwForm.newPass !== pwForm.confirm) { setError("Passwords do not match"); return; }
    if (pwForm.newPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/profile/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPass }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setPwForm({ current: "", newPass: "", confirm: "" });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("avatar", file);
      const res = await fetch(`${API}/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      const data = await res.json();
      if (data.avatar_url) {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, avatar_url: data.avatar_url }));
        setUser((u: any) => ({ ...u, avatar_url: data.avatar_url }));
      }
    } catch {}
    setUploading(false);
  }

  if (!user) return null;
  const initials = user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "C";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and account security</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(["profile", "security"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {saved && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">
          <Check className="h-4 w-4" /> Changes saved successfully
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {tab === "profile" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>
                {user.avatar_url ? <img src={user.avatar_url} className="w-16 h-16 rounded-full object-cover" alt="" /> : initials}
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-400">{user.email}</p>
              <label className="mt-2 inline-block cursor-pointer text-xs font-semibold text-blue-600 hover:underline">
                {uploading ? "Uploading..." : "Change photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Company / Organization</label>
              <input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Bio</label>
              <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-500 transition-colors" />
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {tab === "security" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {(["current", "newPass", "confirm"] as const).map((field, i) => (
              <div key={field}>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">
                  {field === "current" ? "Current Password" : field === "newPass" ? "New Password" : "Confirm New Password"}
                </label>
                <div className="relative">
                  <input type={showPw[field === "newPass" ? "new" : field] ? "text" : "password"}
                    value={pwForm[field]} onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors pr-10" />
                  <button type="button" onClick={() => setShowPw(s => ({ ...s, [field === "newPass" ? "new" : field]: !s[field === "newPass" ? "new" : field] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw[field === "newPass" ? "new" : field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
              <Lock className="h-4 w-4" /> {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
