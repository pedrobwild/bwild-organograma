import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  LogIn,
  LogOut,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/logo-bwild.png";

const NAV_ITEMS = [
  { title: "Organograma", url: "/", icon: Network, adminOnly: false },
  { title: "Dashboard", url: "/dashboard", icon: BarChart3, adminOnly: true },
  { title: "Colaboradores", url: "/admin", icon: Users, adminOnly: true },
  { title: "Pagamentos", url: "/admin/pagamentos", icon: CalendarDays, adminOnly: true },
  { title: "Usuários", url: "/admin/usuarios", icon: ShieldCheck, adminOnly: true },
];

interface AppLayoutProps {
  children: React.ReactNode;
  /** If true, the content area gets a full-screen treatment (e.g. org chart) */
  fullScreen?: boolean;
}

export function AppLayout({ children, fullScreen = false }: AppLayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Public mode: no sidebar, but always show a floating "Entrar" button so
  // the user has a path to authenticate (otherwise the org chart is a dead end).
  if (!user) {
    return (
      <>
        {children}
        <Button
          onClick={() => navigate("/login")}
          size="sm"
          className="fixed top-3 right-4 z-50 gap-1.5 shadow-lg"
        >
          <LogIn className="w-4 h-4" />
          Entrar
        </Button>
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar isAdmin={isAdmin} signOut={signOut} />
        <div className="flex-1 flex flex-col min-w-0">
          {!fullScreen && (
            <header className="sticky top-0 z-30 bg-white border-b border-border h-12 flex items-center px-4 flex-shrink-0">
              <SidebarTrigger className="mr-3" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg overflow-hidden">
                  <img src={logoSrc} alt="Bwild" className="h-full w-full object-cover" />
                </div>
                <span className="font-display text-sm font-bold text-card-foreground">BWild People</span>
              </div>
            </header>
          )}
          {fullScreen && (
            <div className="fixed top-3 left-3 z-40">
              <SidebarTrigger className="h-8 w-8 border border-border bg-card/90 text-foreground hover:bg-accent" />
            </div>
          )}
          <main className={fullScreen ? "flex-1" : "flex-1 overflow-y-auto"}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ isAdmin, signOut }: { isAdmin: boolean; signOut: () => void }) {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-3">
        {/* Logo */}
        <div className="px-3 pb-3 mb-1 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0">
              <img src={logoSrc} alt="Bwild" className="h-full w-full object-cover" />
            </div>
            {!collapsed && (
              <span className="font-display text-sm font-bold text-sidebar-foreground">BWild People</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sign out */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-xs">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
