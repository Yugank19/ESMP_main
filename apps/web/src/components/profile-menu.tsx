"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, User, Camera, ChevronDown, Shield, Clock, BarChart2, Bell } from "lucide-react";

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
      // Try API upload first
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
        // Prepend API base if relative path
        const fullUrl = url.startsWith('/uploads/') ? `${API}${url}` : url;
        applyAvatar(fullUrl);
        return;
      }
    } catch {}
    // Fallback: base64 local storage
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      applyAvatar(url);
    };
    reader.readAsDataURL(file);
    setUploading(false);
  }

  function applyAvatar(url: string) {
    // If it's a relative path from the API, prepend the API base URL
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
    { icon: User, label: "View Profile", href: "/dashboard/settings" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    { icon: Bell, label: "Notifications", href: "/dashboard/settings" },
    { icon: Clock, label: "Time Tracking", href: "/dashboard/time-tracking" },
    { icon: BarChart2, label: "Analytics", href: "/dashboard/analytics" },
    ...(role === "ADMIN" ? [{ icon: Shield, label: "Admin Panel", href: "/dashboard/admin" }] : []),
  ];

  return (
    <div ref={menuRef} className="relative">
      {/* Photo viewer lightbox */}
      {viewPhoto && user.avatar_url && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
          onClick={() => setViewPhoto(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img
              src={user.avatar_url}
              alt={user.name}
              className="max-w-sm max-h-[80vh] rounded-2xl object-cover shadow-2xl"
            />
            <button
              onClick={() => setViewPhoto(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg text-gray-700 hover:bg-gray-100 transition-colors">
              ✕
            </button>
            <button
              onClick={() => { setViewPhoto(false); fileRef.current?.click(); }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-colors"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
              <Camera className="h-3.5 w-3.5" /> Change Photo
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-150"
        style={{ background: open ? "var(--bg-surface-2)" : "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-surface-2)")}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}>

        {/* Avatar — click to view, dropdown opens on name */}
        <div className="relative shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              style={{ border: "2px solid var(--primary)", opacity: uploading ? 0.6 : 1 }}
              onClick={e => { e.stopPropagation(); setViewPhoto(true); }}
              title="Click to view photo"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", border: "2px solid rgba(37,99,235,0.3)" }}>
              {initials}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-white animate-spin" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="hidden lg:block text-left">
          <p className="text-sm font-semibold leading-none" style={{ color: "var(--text-primary)" }}>
            {user.name}
          </p>
          <p className="text-[10px] mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>
            {role.toLowerCase()}
          </p>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 hidden lg:block transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl z-50 overflow-hidden border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            boxShadow: "0 20px 48px rgba(15,23,42,0.15), 0 4px 12px rgba(15,23,42,0.08)",
          }}>

          {/* Profile header */}
          <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)" }}>
            <div className="flex items-center gap-3 mb-3">
              {/* Clickable avatar */}
              <div
                className="relative group/av cursor-pointer shrink-0"
                onClick={() => fileRef.current?.click()}
                title="Click to change photo">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                    style={{ border: "2px solid var(--primary)" }}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", border: "2px solid rgba(37,99,235,0.3)" }}>
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {user.name}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {user.email}
                </p>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                  style={{ background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>
                  {role.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Change photo button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "var(--bg-surface-3)", color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-surface)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-surface-3)")}>
              <Camera className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Change Profile Photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={() => { router.push(item.href); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--bg-surface-2)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Divider + Logout */}
          <div className="border-t py-1.5" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
              style={{ color: "#dc2626" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}>
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
