import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  Terminal, 
  LayoutDashboard, 
  Server, 
  History, 
  Activity, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/agents", label: "Agents", icon: Server },
    { href: "/commands", label: "Commands", icon: Terminal },
    { href: "/audit-logs", label: "Audit Logs", icon: History },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Activity className="w-6 h-6 text-primary mr-3" />
          <span className="font-mono font-bold tracking-wider text-primary">OPS_CENTER</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">OPERATOR</span>
              <span className="text-sm font-medium">{user?.username}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout" className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center px-6 border-b border-border bg-background/50 backdrop-blur">
          <div className="flex items-center text-sm font-mono text-muted-foreground">
            <span className="text-primary">~</span>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span>{location.split('/').filter(Boolean).join(' / ') || 'home'}</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
