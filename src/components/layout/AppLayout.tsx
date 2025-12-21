import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, ClipboardList, BarChart3, Calculator, FileText, Settings, Globe, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Administração', href: '/administracao', icon: Users, requiresAdmin: true },
  { name: 'Registro', href: '/registro', icon: ClipboardList },
  { name: 'Registro Global', href: '/registro-global', icon: Globe, requiresGhas: true },
  { name: 'Cálculo', href: '/calculo', icon: Calculator },
  { name: 'Simulador', href: '/simulador', icon: BarChart3 },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { prestador, isResponsavelGhas, isAdmin, loading } = usePrestadorLogado();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-sidebar-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Acelera GHAS</h1>
            <p className="text-xs text-sidebar-foreground/60">2026</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation
            .filter((item) => {
              if (item.requiresAdmin && !isAdmin) return false;
              if (item.requiresGhas && !isResponsavelGhas) return false;
              return true;
            })
            .map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border space-y-2">
          {prestador && (
            <div className="px-4 py-2 text-sm">
              <p className="text-sidebar-foreground/60 text-xs">Logado como</p>
              <p className="text-sidebar-foreground font-medium truncate">{prestador.nome}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        {children}
      </main>
    </div>
  );
}
