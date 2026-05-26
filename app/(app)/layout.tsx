import { Command, Search, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShellClient } from "@/components/layout/app-shell-client";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { auth } from "@/lib/auth";
import { getAllTasks } from "@/lib/db/queries/tasks";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await auth();

  if (!user) {
    redirect("/login");
  }

  const userInitials = user.email ? user.email.slice(0, 2).toUpperCase() : "MV";
  const userEmail = user.email ?? "Maeva";
  const paletteTasks = await getAllTasks();

  return (
    <div className="flex min-h-screen bg-[#07101E] text-[#EDE8DC]" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* Sidebar wrapper */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#1A3050] bg-[#0C1A2E] shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[#1A3050] relative">
          {/* Filet d'or Rothschild */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] roth-accent-bar" />
          <Sparkles className="w-4 h-4 text-[#C4974C] shrink-0" />
          <div>
            <span
              className="font-bold tracking-[0.12em] text-[11px] text-[#EDE8DC] uppercase"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              DEAL RADAR
            </span>
            <span className="block text-[8px] font-mono text-[#8899AE] tracking-[0.2em] uppercase mt-px">
              ROOM · PRIVATE
            </span>
          </div>
        </div>

        {/* Client sidebar nav (handles active state via usePathname) */}
        <SidebarNav userEmail={userEmail} userInitials={userInitials} />
      </aside>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header toolbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-[#0C1A2E] border-b border-[#1A3050] z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[#8899AE] bg-[#07101E] px-2.5 py-1 rounded border border-[#1A3050] tracking-wider">
              PARIS / ÎLE-DE-FRANCE
            </span>
          </div>

          {/* Interactive Search Bar / Command Palette */}
          <div className="flex items-center gap-3">
            <button
              id="cmd-k-trigger-btn"
              type="button"
              className="flex items-center gap-5 px-3 py-1.5 bg-[#07101E] border border-[#1A3050] rounded-lg text-[11px] text-[#8899AE] hover:text-[#EDE8DC] hover:border-[#C4974C]/40 transition-all font-mono cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#8899AE]" />
                <span>Rechercher...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#112240] border border-[#1A3050] rounded text-[9px] text-[#8899AE]">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </kbd>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      <AppShellClient tasks={paletteTasks} />
    </div>
  );
}
