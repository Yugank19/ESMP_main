"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import NotificationsBell from "@/components/notifications-bell";
import { Search, Menu } from "lucide-react";
import { globalSearch } from "@/lib/search-api";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "Projects",
  "/dashboard/tasks": "Tasks",
  "/dashboard/teams": "Teams",
  "/dashboard/chat": "Chat",
  "/dashboard/analytics": "Analytics",
  "/dashboard/reports": "Reports",
  "/dashboard/calendar": "Calendar",
  "/dashboard/search": "Search",
  "/dashboard/audit": "Activity Log",
  "/dashboard/settings": "Settings",
  "/dashboard/admin": "Admin Panel",
  "/dashboard/tickets": "Service Requests",
  "/dashboard/approvals": "Approvals",
  "/dashboard/time-tracking": "Time Tracking",
  "/dashboard/bugs": "Bug Tracker",
  "/dashboard/knowledge-base": "Knowledge Base",
  "/dashboard/company-news": "Company News",
  "/dashboard/workload": "Resource Management",
  "/dashboard/my-workspace": "My Workspace",
  "/dashboard/employee-management": "Employee Management",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token) { router.replace("/login"); return; }
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    // Restore sidebar preference
    const pref = localStorage.getItem("esmp_sidebar");
    if (pref !== null) setSidebarOpen(pref === "1");
    setMounted(true);
  }, [router]);

  // On mobile, close sidebar on navigation
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem("esmp_sidebar", next ? "1" : "0");
      return next;
    });
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults(null);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) { setSearchResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await globalSearch(searchQuery);
        setSearchResults(data.results);
      } catch {}
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="h-8 w-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
      </div>
    );
  }

  const allResults = searchResults ? [
    ...(searchResults.tasks || []),
    ...(searchResults.files || []),
    ...(searchResults.announcements || []),
    ...(searchResults.milestones || []),
    ...(searchResults.members || []),
    ...(searchResults.teams || []),
  ].slice(0, 6) : [];

  const pageTitle = Object.entries(PAGE_TITLES)
    .find(([k]) => pathname === k || pathname?.startsWith(k + "/"))?.[1] || "ESMP";

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Sidebar — pushes content on desktop, overlays on mobile */}
      <Sidebar open={sidebarOpen} onClose={() => {
        setSidebarOpen(false);
        localStorage.setItem("esmp_sidebar", "0");
      }} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header
          className="h-14 border-b flex items-center gap-3 px-4 shrink-0 z-30"
          style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--border)" }}
        >
          {/* Hamburger toggle */}
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 group"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-surface-2)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title */}
          <span className="text-base font-semibold hidden sm:block shrink-0 tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            {pageTitle}
          </span>

          <div className="flex-1" />

          {/* Search */}
          <div ref={searchRef} className="relative w-48 sm:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--text-muted)" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] transition-colors"
              style={{ backgroundColor: "var(--bg-surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            {(searching || allResults.length > 0) && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-2xl z-50 overflow-hidden border"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                {searching && (
                  <div className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>Searching...</div>
                )}
                {!searching && allResults.map((item: any, i: number) => (
                  <div key={i}
                    className="px-4 py-3 cursor-pointer border-b last:border-0 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {item.title || item.name || item.body?.slice(0, 60) || item.original_name || "Untitled"}
                    </p>
                    <p className="text-xs capitalize mt-0.5" style={{ color: "var(--text-muted)" }}>{item.type}</p>
                  </div>
                ))}
                {!searching && allResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>No results found</div>
                )}
                {!searching && allResults.length > 0 && (
                  <Link href="/dashboard/search"
                    onClick={() => { setSearchResults(null); setSearchQuery(""); }}
                    className="block px-4 py-2.5 text-xs text-[#1D4ED8] font-semibold text-center hover:underline"
                    style={{ borderTop: "1px solid var(--border)" }}>
                    View all results →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationsBell />
            {user && (
              <div className="flex items-center gap-2.5 pl-1">
                <div className="w-8 h-8 rounded-full bg-[#1D4ED8] flex items-center justify-center shrink-0 ring-2 ring-[#1D4ED8]/20">
                  <span className="text-white text-xs font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold leading-none" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{user.roles?.[0] || "User"}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content — full width, no max-w constraint */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}