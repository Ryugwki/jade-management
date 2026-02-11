"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Table2, Gem, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { useMemo } from "react";
import { usePermission } from "@/hooks/usePermission";

type NavItem = {
  name: string;
  href: string;
  icon: typeof Home;
  badge?: string;
  description?: string;
};

type SidebarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function Sidebar({ variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  const canViewPermissions = usePermission("permission", "read");

  // Generate nav items using translations
  const navItems: NavItem[] = useMemo(
    () => [
      {
        name: t("nav.dashboard"),
        href: "/dashboard",
        icon: Home,
        description: t("nav.overview"),
      },
      {
        name: t("nav.inventory"),
        href: "/product",
        icon: Table2,
        description: t("nav.products"),
      },
      {
        name: t("nav.permissions"),
        href: "/permission",
        icon: ShieldAlert,
        description: t("nav.accessControl"),
      },
    ],
    [t],
  );

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/permission") return canViewPermissions;
    return true;
  });

  const isActive = (href: string) => pathname === href;

  const isMobile = variant === "mobile";

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border/70 shadow-sm flex-col h-full",
        isMobile ? "flex w-full" : "hidden lg:flex w-72",
      )}
    >
      {/* Logo Section - Enhanced */}
      <div className="border-b border-border/50 p-7">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Gem size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground tracking-tight">
              {t("brand.name")}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              {t("brand.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Enhanced */}
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="space-y-2 px-4">
          {filteredNavItems.map(
            ({ name, href, icon: Icon, badge, description }) => {
              const active = isActive(href);
              return (
                <Link
                  key={name}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group border border-border/60 relative",
                    active
                      ? "bg-primary/10 text-foreground border-primary/30 shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  {/* Active indicator line */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
                  )}

                  <Icon
                    size={20}
                    className={cn(
                      "transition-colors duration-200 shrink-0",
                      active ? "text-primary" : "group-hover:text-foreground",
                    )}
                  />

                  <div className="flex-1 text-left">
                    <p className="font-semibold">{name}</p>
                    {description && (
                      <p
                        className={cn(
                          "text-xs leading-tight",
                          active ? "text-primary/80" : "text-muted-foreground",
                        )}
                      >
                        {description}
                      </p>
                    )}
                  </div>

                  {badge && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-semibold shadow-sm shrink-0">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            },
          )}
        </nav>
      </div>

      {/* Footer Section - Enhanced */}
      <div className="border-t border-border/50 p-6">
        <div className="bg-muted/40 rounded-lg p-4 border border-border/50 space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            {t("nav.currentUser")}
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {user?.name || t("nav.userFallback")}
          </p>
          <p className="text-xs text-muted-foreground">
            {user?.role === "SUPER_ADMIN"
              ? t("role.superAdmin")
              : user?.role === "ADMIN"
                ? t("role.admin")
                : t("role.guest")}
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground/70 mt-4">
          {t("brand.copyright", { year: 2026 })}
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
