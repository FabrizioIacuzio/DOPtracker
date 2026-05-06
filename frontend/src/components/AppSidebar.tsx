import { NavLink, useLocation } from "react-router-dom";
import { CalendarDays, ClipboardList, BarChart3, FlaskConical, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { titleKey: "nav.calendar" as const, url: "/calendar", icon: CalendarDays },
  { titleKey: "nav.batch" as const, url: "/batch/new", icon: ClipboardList },
  { titleKey: "nav.dashboard" as const, url: "/dashboard", icon: BarChart3 },
  { titleKey: "nav.labReports" as const, url: "/lab-reports", icon: FlaskConical },
  { titleKey: "nav.documents" as const, url: "/documents", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    if (path === "/batch/new") return pathname.startsWith("/batch");
    return pathname === path;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {!collapsed && (
          <div className="px-4 pb-4 mb-2 border-b border-sidebar-border">
            <span className="text-lg font-bold text-sidebar-primary">DOP</span>
            <span className="text-lg font-bold text-sidebar-foreground">Comply</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center pb-4 mb-2 border-b border-sidebar-border">
            <span className="text-lg font-bold text-sidebar-primary">D</span>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{t(item.titleKey)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
