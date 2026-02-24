"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Clock,
  LayoutDashboard,
  Calendar,
  ArrowLeftRight,
  ArrowDownToLine,
  Users,
  ClipboardList,
  BarChart3,
  MapPin,
  LogOut,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useUI } from "@/contexts/ui-context";
import { useAuth } from "@/contexts/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const getDashboardNavItems = (role: UserRole): NavItem[] => {
  const staffOnlyItems: NavItem[] = [
    {
      label: "My Schedule",
      href: ROUTES.STAFF_SCHEDULE,
      icon: Calendar,
      roles: ["STAFF"],
    },
    {
      label: "My Availability",
      href: ROUTES.STAFF_AVAILABILITY,
      icon: Clock,
      roles: ["STAFF"],
    },
    {
      label: "Shift Swaps",
      href: ROUTES.STAFF_SWAPS,
      icon: ArrowLeftRight,
      roles: ["STAFF"],
    },
    {
      label: "Shift Drops",
      href: ROUTES.STAFF_DROPS,
      icon: ArrowDownToLine,
      roles: ["STAFF"],
    },
  ];

  // Add role-specific items based on user's role
  switch (role) {
    case "ADMIN":
      return [
        {
          label: "Dashboard",
          href: ROUTES.ADMIN,
          icon: LayoutDashboard,
          roles: ["ADMIN"],
        },
        {
          label: "Analytics",
          href: ROUTES.ADMIN_ANALYTICS,
          icon: BarChart3,
          roles: ["ADMIN"],
        },
        {
          label: "Staff Management",
          href: ROUTES.ADMIN_STAFF,
          icon: Users,
          roles: ["ADMIN"],
        },
        {
          label: "Location Management",
          href: ROUTES.ADMIN_LOCATIONS,
          icon: MapPin,
          roles: ["ADMIN"],
        },
        {
          label: "Schedule Management",
          href: ROUTES.ADMIN_SCHEDULE,
          icon: Calendar,
          roles: ["ADMIN"],
        },
        {
          label: "Request Management",
          href: ROUTES.ADMIN_REQUESTS,
          icon: ClipboardList,
          roles: ["ADMIN"],
        },
      ];

    case "MANAGER":
      return [
        {
          label: "Dashboard",
          href: ROUTES.MANAGER,
          icon: LayoutDashboard,
          roles: ["MANAGER"],
        },
        {
          label: "Staff Management",
          href: ROUTES.MANAGER_STAFF,
          icon: Users,
          roles: ["MANAGER"],
        },
        {
          label: "Location Management",
          href: ROUTES.MANAGER_LOCATIONS,
          icon: MapPin,
          roles: ["MANAGER"],
        },
        {
          label: "Schedule Management",
          href: ROUTES.MANAGER_SCHEDULE,
          icon: Calendar,
          roles: ["MANAGER"],
        },
        {
          label: "Request Management",
          href: ROUTES.MANAGER_REQUESTS,
          icon: ClipboardList,
          roles: ["MANAGER"],
        },
      ];

    case "STAFF":
    default:
      return [
        {
          label: "Dashboard",
          href: ROUTES.STAFF,
          icon: LayoutDashboard,
          roles: ["STAFF"],
        },
        ...staffOnlyItems,
      ];
  }
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useUI();
  const { user } = useAuth();

  const role = (user?.role ?? "STAFF") as UserRole;
  const navItems = getDashboardNavItems(role);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16",
      )}
      aria-label="Main navigation"
    >
      {/* Branding */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <Clock className="h-6 w-6 shrink-0 text-primary" />
        {sidebarOpen && (
          <span className="text-lg font-semibold tracking-tight">
            ShiftSync
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Sidebar">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70",
                    !sidebarOpen && "justify-center px-0",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-3",
            !sidebarOpen && "justify-center",
          )}
        >
          <Avatar size="sm" fallback={initials} alt={user?.name ?? "User"} />
          {sidebarOpen && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {user?.name ?? "User"}
              </span>
              <Badge variant="secondary" className="mt-0.5 w-fit text-[10px]">
                {role}
              </Badge>
            </div>
          )}
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}
              aria-label="Sign out"
              className="shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
