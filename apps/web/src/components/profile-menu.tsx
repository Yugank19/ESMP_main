"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, User, Camera, ChevronDown, Shield, Clock, BarChart2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  user: any;
  onAvatarUpdate: (url: string) => void;
}

export default function ProfileMenu({ user, onAvatarUpdate }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API}/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.avatar_url || data.url;
        const fullUrl = url.startsWith('/uploads/') ? `${API}${url}` : url;
        applyAvatar(fullUrl);
        return;
      }
    } catch {}
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      applyAvatar(url);
    };
    reader.readAsDataURL(file);
    setUploading(false);
  }

  function applyAvatar(url: string) {
    const fullUrl = url.startsWith('/uploads/') ? `${API}${url}` : url;
    onAvatarUpdate(fullUrl);
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, avatar_url: fullUrl }));
    setUploading(false);
  }

  async function handleLogout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const role = (user.roles?.[0] || "User").toUpperCase();
  const initials = user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const menuItems = [
    { icon: User, label: "Your profile", href: "/dashboard/settings" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    { icon: Bell, label: "Notifications", href: "/dashboard/settings" },
    { icon: Clock, label: "Personal settings", href: "/dashboard/time-tracking" },
    ...(role === "ADMIN" ? [{ icon: Shield, label: "System administration", href: "/dashboard/admin" }] : []),
  ];

  return (
    <div ref={menuRef} className="relative">
      {/* Photo viewer lightbox */}
      {viewPhoto && user.avatar_url && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
          onClick={() => setViewPhoto(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img src={user.avatar_url} alt={user.name} className="max-w-sm max-h-[80vh] rounded-[3px] object-cover shadow-2xl" />
            <button onClick={() => setViewPhoto(false)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg text-gray-700 hover:bg-gray-100 transition-colors">✕</button>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 p-1 rounded-[3px] transition-colors",
          open ? "bg-[var(--bg-surface-2)]" : "hover:bg-[var(--bg-surface-2)]"
        )}
      >
        <div className="relative shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-[var(--border)]"
              onClick={e => { e.stopPropagation(); setViewPhoto(true); }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-bold flex items-center justify-center border border-white/20">
              {initials}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><div className="w-3 h-3 rounded-full border-2 border-t-transparent border-white animate-spin" /></div>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-[var(--text-muted)] transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--bg-surface)] rounded-[3px] border border-[var(--border)] shadow-2xl z-50 overflow-hidden">
          {/* User Section */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-tight mb-3">Account</p>
            <div className="flex items-center gap-3">
              <div className="relative group shrink-0" onClick={() => fileRef.current?.click()}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white text-sm font-bold flex items-center justify-center">{initials}</div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-tight px-5 py-2">ESMP Management</p>
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { router.push(item.href); setOpen(false); }}
                className="w-full flex items-center gap-3 px-5 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] transition-colors text-left"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Logout Section */}
          <div className="border-t border-[var(--border)] py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-2 text-sm text-red-500 hover:bg-red-50/10 transition-colors text-left font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
