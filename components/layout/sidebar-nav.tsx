"use client";

import {
  Bot,
  CheckCheck,
  Download,
  GitBranch,
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarNavProps {
  userEmail: string;
  userInitials: string;
}

const NAV_ITEMS = [
  { label: "Dashboard",       href: "/",          icon: LayoutDashboard },
  { label: "Sourcing Web",    href: "/sourcing",   icon: Search },
  { label: "Leads & Shortlist", href: "/leads",   icon: UsersIcon },
  { label: "File du Jour",    href: "/today",      icon: CheckCheck },
  { label: "Pipeline",        href: "/pipeline",   icon: GitBranch },
  { label: "Messages",        href: "/messages",   icon: Mail },
  { label: "Copilot",         href: "/copilot",    icon: Bot },
  { label: "Gouvernance",     href: "/governance", icon: ShieldCheck },
  { label: "Journal",         href: "/journal",    icon: History },
  { label: "Exports",         href: "/exports",    icon: Download },
];

export function SidebarNav({ userEmail, userInitials }: SidebarNavProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* User Card */}
      <div className="p-4 border-b border-[#1A3050] bg-[#07101E]/60">
        <div className="flex items-center gap-3">
          {/* Avatar — dégradé or/acier Rothschild */}
          <div className="w-8 h-8 rounded flex items-center justify-center text-[#07101E] font-bold text-xs uppercase shadow-md"
            style={{ background: "linear-gradient(135deg, #C4974C 0%, #4472AA 100%)" }}
          >
            {userInitials}
          </div>
          <div className="overflow-hidden">
            <span className="block text-xs font-semibold text-[#EDE8DC] truncate">
              {userEmail}
            </span>
            <span className="block text-[8px] font-mono text-[#8899AE] uppercase tracking-[0.15em]">
              Prospectrice · M&A
            </span>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-[11px] font-medium rounded border transition-all group ${
                active
                  ? "bg-[#112240] border-[#1A3050] text-[#EDE8DC]"
                  : "border-transparent text-[#8899AE] hover:text-[#EDE8DC] hover:bg-[#112240]/70 hover:border-[#1A3050]/60"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  active
                    ? "text-[#C4974C]"
                    : "text-[#8899AE] group-hover:text-[#C4974C]"
                }`}
              />
              <span className="tracking-wide">{item.label}</span>
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-[#C4974C]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#1A3050] bg-[#07101E]/40 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 text-[11px] font-medium rounded text-[#8899AE] hover:text-[#EDE8DC] hover:bg-[#112240]/70 border border-transparent transition-all group"
        >
          <Settings className="w-3.5 h-3.5 text-[#8899AE] group-hover:text-[#4472AA] transition-colors" />
          <span className="tracking-wide">Paramètres</span>
        </Link>
        <a
          href="/login"
          className="flex items-center gap-3 px-3 py-2 text-[11px] font-medium rounded text-[#8899AE] hover:text-rose-300 hover:bg-[#112240]/70 border border-transparent transition-all group cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-[#8899AE] group-hover:text-rose-300 transition-colors" />
          <span className="tracking-wide">Déconnexion</span>
        </a>
      </div>
    </>
  );
}

// Inline UsersIcon to avoid external dependency in foundation phase
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>Users</title>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
