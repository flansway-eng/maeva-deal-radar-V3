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
    <div className="flex min-h-screen bg-[#0A0B0D] text-[#E8EAED] font-sans">
      {/* Sidebar wrapper */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#1F232B] bg-[#111317] shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[#1F232B] relative">
          {/* Accent Gold/Blue visual bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#F5C518] to-[#5B8DEF]" />
          <Sparkles className="w-5 h-5 text-[#F5C518]" />
          <div>
            <span className="font-extrabold tracking-tight text-sm text-[#E8EAED]">
              DEAL RADAR
            </span>
            <span className="block text-[9px] font-mono text-[#9AA0A6] tracking-widest uppercase">
              ROOM v2.0
            </span>
          </div>
        </div>

        {/* Client sidebar nav (handles active state via usePathname) */}
        <SidebarNav userEmail={userEmail} userInitials={userInitials} />
      </aside>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header toolbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-[#111317] border-b border-[#1F232B] z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#9AA0A6] bg-[#0A0B0D] px-2.5 py-1 rounded border border-[#1F232B]">
              PARIS / ÎLE-DE-FRANCE
            </span>
          </div>

          {/* Interactive Search Bar / Command Palette placeholder */}
          <div className="flex items-center gap-3">
            <button
              id="cmd-k-trigger-btn"
              type="button"
              className="flex items-center gap-5 px-3 py-1.5 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs text-[#9AA0A6] hover:text-[#E8EAED] hover:border-[#9AA0A6]/30 transition-all font-mono cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#9AA0A6]" />
                <span>Rechercher...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#16191F] border border-[#1F232B] rounded text-[10px] text-[#9AA0A6]">
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
