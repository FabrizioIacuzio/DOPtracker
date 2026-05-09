import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Globe, User, Menu, CalendarDays, ClipboardList, BarChart3, FlaskConical, FileText, Home, RefreshCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { titleKey: "nav.home" as const, url: "/home", icon: Home },
  { titleKey: "nav.calendar" as const, url: "/calendar", icon: CalendarDays },
  { titleKey: "nav.batch" as const, url: "/batch/new", icon: ClipboardList },
  { titleKey: "nav.dashboard" as const, url: "/dashboard", icon: BarChart3 },
  { titleKey: "nav.labReports" as const, url: "/lab-reports", icon: FlaskConical },
  { titleKey: "nav.documents" as const, url: "/documents", icon: FileText },
];

export default function AppLayout() {
  const { toggleLang, lang, t } = useLanguage();
  const { companyInfo, onboardingComplete, setOnboardingComplete } = useAppData();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  const returnToOnboarding = () => {
    setOnboardingComplete(false);
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Menu className="h-5 w-5 text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {navItems.map((item) => (
                <DropdownMenuItem
                  key={item.url}
                  onClick={() => navigate(item.url)}
                  className={`gap-3 cursor-pointer ${pathname === item.url || (item.url === "/batch/new" && pathname.startsWith("/batch")) ? "bg-primary/10 text-primary font-medium" : ""}`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.titleKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div>
            <span className="text-lg font-bold text-primary">DOP</span>
            <span className="text-lg font-bold">Comply</span>
          </div>
          {companyInfo && (
            <span className="text-sm text-muted-foreground hidden sm:inline ml-2">
              {companyInfo.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={returnToOnboarding} className="gap-1.5">
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Cambia prodotto</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5">
            <Globe className="h-4 w-4" />
            {lang === "it" ? "EN" : "IT"}
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
