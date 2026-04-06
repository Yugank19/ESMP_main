"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import NotificationsBell from "@/components/notifications-bell";
import ProfileMenu from "@/components/profile-menu";
import { Search, Menu, ChevronRight, Bell, HelpCircle } from "lucide-react";
import { globalSearch } from "@/lib/search-api";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  "/dashboard/client-management": "Client Management",
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
    setMounted(true);
  }, [router]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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

  if (!mounted) return null;

  const allResults = searchResults ? [
    ...(searchResults.tasks || []),
    ...(searchResults.files || []),
    ...(searchResults.announcements || []),
    ...(searchResults.milestones || []),
    ...(searchResults.members || []),
    ...(searchResults.teams || []),
  ].slice(0, 6) : [];

  const pathSegments = pathname?.split("/").filter(Boolean) || [];
  
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header (Jira Style) */}
        <header className="h-14 border-b border-[var(--border)] bg-[var(--header-bg)] flex items-center px-4 shrink-0 z-30 justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 rounded hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm font-medium text-[var(--text-secondary)]">
              <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">ESMP</Link>
              {pathSegments.slice(1).map((seg, idx) => (
                <div key={idx} className="flex items-center uppercase tracking-wider text-[10px] ml-2">
                  <ChevronRight className="h-3 w-3 mx-1 text-[var(--text-muted)]" />
                  <span className={cn(idx === pathSegments.length - 2 ? "text-[var(--text-primary)] font-bold" : "")}>
                    {seg.replace(/-/g, " ")}
                  </span>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div ref={searchRef} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-48 lg:w-64 h-8 pl-9 pr-3 rounded-[3px] border-2 border-[var(--border)] bg-[var(--input-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all"
              />
              {(searching || allResults.length > 0) && (
                <div className="absolute top-full right-0 mt-2 w-80 rounded-[3px] shadow-2xl z-50 overflow-hidden border border-[var(--border)] bg-[var(--bg-surface)]">
                  {searching && <div className="px-4 py-3 text-xs text-[var(--text-muted)]">Searching...</div>}
                  {!searching && allResults.map((item: any, i: number) => (
                    <div key={i} className="px-4 py-2.5 cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)]">
                      <p className="text-xs font-semibold truncate text-[var(--text-primary)]">
                        {item.title || item.name || item.body?.slice(0, 40) || "Untitled"}
                      </p>
                      <p className="text-[10px] uppercase text-[var(--text-muted)] mt-0.5">{item.type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1 border-l border-[var(--border)] pl-3 ml-1">
              <NotificationsBell />
              <button className="p-1.5 rounded hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
                <HelpCircle className="h-5 w-5" />
              </button>
              {user && <ProfileMenu user={user} onAvatarUpdate={(url: string) => setUser((u: any) => ({ ...u, avatar_url: url }))} />}
            </div>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}