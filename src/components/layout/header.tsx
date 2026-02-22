"use client";

import { Menu, PanelLeftClose, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUI } from "@/contexts/ui-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { MobileNav } from "./mobile-nav";

interface HeaderProps {
  notificationCount?: number;
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  const { sidebarOpen, toggleSidebar } = useUI();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background px-4 transition-all duration-300",
          sidebarOpen ? "left-64" : "left-16"
        )}
        role="banner"
      >
        {/* Left section */}
        <div className="flex items-center gap-2">
          {/* Desktop toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden md:inline-flex"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
