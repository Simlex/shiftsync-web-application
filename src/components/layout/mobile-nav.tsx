"use client";

import { useEffect } from "react";
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
  X,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
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

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar-background text-sidebar-foreground shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">
              ShiftSync
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-2 py-4"
          aria-label="Mobile sidebar"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3">
            <Avatar size="sm" fallback={initials} alt={user?.name ?? "User"} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {user?.name ?? "User"}
              </span>
              <Badge variant="secondary" className="mt-0.5 w-fit text-[10px]">
                {role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: ROUTES.LOGIN })}
              aria-label="Sign out"
              className="shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
