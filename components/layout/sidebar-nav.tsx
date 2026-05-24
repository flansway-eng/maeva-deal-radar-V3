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
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sourcing Web", href: "/sourcing", icon: Search },
  { label: "Leads & Shortlist", href: "/leads", icon: UsersIcon },
  { label: "File du Jour", href: "/today", icon: CheckCheck },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Copilot", href: "/copilot", icon: Bot },
  { label: "Gouvernance", href: "/governance", icon: ShieldCheck },
  { label: "Journal", href: "/journal", icon: History },
  { label: "Exports", href: "/exports", icon: Download },
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
      <div className="p-4 border-b border-[#1F232B] bg-[#0A0B0D]/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F5C518] to-[#5B8DEF] flex items-center justify-center text-[#0A0B0D] font-bold text-xs uppercase shadow-md">
            {userInitials}
          </div>
          <div className="overflow-hidden">
            <span className="block text-xs font-semibold text-[#E8EAED] truncate">
              {userEmail}
            </span>
            <span className="block text-[9px] font-mono text-[#9AA0A6] uppercase tracking-wider">
              Prospectrice active
            </span>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg border transition-all group ${
                active
                  ? "bg-[#16191F] border-[#1F232B] text-[#E8EAED]"
                  : "border-transparent text-[#9AA0A6] hover:text-[#E8EAED] hover:bg-[#16191F] hover:border-[#1F232B]"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  active
                    ? "text-[#F5C518]"
                    : "text-[#9AA0A6] group-hover:text-[#F5C518]"
                }`}
              />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-[#F5C518]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#1F232B] bg-[#0A0B0D]/20 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-[#9AA0A6] hover:text-[#E8EAED] hover:bg-[#16191F] border border-transparent transition-all group"
        >
          <Settings className="w-4 h-4 text-[#9AA0A6] group-hover:text-[#5B8DEF] transition-colors" />
          <span>Paramètres</span>
        </Link>
        <a
          href="/login"
          className="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-[#9AA0A6] hover:text-rose-400 hover:bg-[#16191F] border border-transparent transition-all group cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#9AA0A6] group-hover:text-rose-400 transition-colors" />
          <span>Déconnexion</span>
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
