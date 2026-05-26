"use client";

import {
  Bot,
  CheckCheck,
  Download,
  GitBranch,
  History,
  LayoutDashboard,
  Mail,
  Radio,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/navigation/app-nav";

interface SidebarNavProps {
  userEmail: string;
  userInitials: string;
}

const SIDEBAR_NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sourcing Web", href: "/sourcing", icon: Radio },
  { label: "Leads & Shortlist", href: "/leads", icon: Users },
  { label: "File du Jour", href: "/today", icon: CheckCheck },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Copilot", href: "/copilot", icon: Bot },
  { label: "Gouvernance", href: "/governance", icon: ShieldCheck },
  { label: "Journal", href: "/journal", icon: History },
  { label: "Exports", href: "/exports", icon: Download },
  { label: "Paramètres", href: "/settings", icon: Settings },
] as const;

export function SidebarNav({ userEmail, userInitials }: SidebarNavProps) {
  const pathname = usePathname();
  const mainItems = SIDEBAR_NAV.slice(0, -1);
  const settingsItem = SIDEBAR_NAV[SIDEBAR_NAV.length - 1]!;
  const SettingsIcon = settingsItem.icon;

  return (
    <>
      <div className="p-4 border-b border-[#1A3050] bg-[#07101E]/60">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-[#07101E] font-bold text-xs uppercase shadow-md"
            style={{
              background: "linear-gradient(135deg, #C4974C 0%, #4472AA 100%)",
            }}
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

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
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

      <div className="p-3 border-t border-[#1A3050] bg-[#07101E]/40">
        <Link
          href={settingsItem.href}
          className={`flex items-center gap-3 px-3 py-2 text-[11px] font-medium rounded border transition-all group ${
            isNavActive(pathname, settingsItem.href)
              ? "bg-[#112240] border-[#1A3050] text-[#EDE8DC]"
              : "border-transparent text-[#8899AE] hover:text-[#EDE8DC] hover:bg-[#112240]/70 hover:border-[#1A3050]/60"
          }`}
        >
          <SettingsIcon
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isNavActive(pathname, settingsItem.href)
                ? "text-[#C4974C]"
                : "text-[#8899AE] group-hover:text-[#4472AA]"
            }`}
          />
          <span className="tracking-wide">{settingsItem.label}</span>
        </Link>
      </div>
    </>
  );
}
