"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useUI } from "@/contexts/ui-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useUI();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <Header />

      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          sidebarOpen ? "md:ml-64" : "md:ml-16"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
