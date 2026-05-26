"use client";

import {
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  Radio,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/navigation/app-nav";

const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sourcing", href: "/sourcing", icon: Radio },
  { label: "Leads", href: "/leads", icon: Target },
  { label: "Pipeline", href: "/pipeline", icon: ListTodo },
  { label: "File du jour", href: "/today", icon: CalendarDays },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#1F232B] bg-[#0A0B0D]/95 backdrop-blur supports-[padding:max(0px)]:pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <ul className="grid grid-cols-5 h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`h-full flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  active ? "text-[#F5C518]" : "text-[#9AA0A6]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
