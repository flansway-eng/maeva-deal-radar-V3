/** Ordre de navigation principal (sidebar + référence mobile). */
export const APP_NAV_ORDER = [
  { label: "Dashboard", href: "/" },
  { label: "Sourcing Web", href: "/sourcing" },
  { label: "Leads & Shortlist", href: "/leads" },
  { label: "File du Jour", href: "/today" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Messages", href: "/messages" },
  { label: "Copilot", href: "/copilot" },
  { label: "Gouvernance", href: "/governance" },
  { label: "Journal", href: "/journal" },
  { label: "Exports", href: "/exports" },
  { label: "Paramètres", href: "/settings" },
] as const;

/** Onglets barre mobile (sous-ensemble, même ordre relatif). */
export const MOBILE_NAV_ORDER = [
  { label: "Dashboard", href: "/" },
  { label: "Sourcing", href: "/sourcing" },
  { label: "Leads", href: "/leads" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "File du jour", href: "/today" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
