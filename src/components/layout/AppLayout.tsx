import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, ClipboardList, BarChart3, Calculator, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Administração', href: '/administracao', icon: Users },
  { name: 'Registro', href: '/registro', icon: ClipboardList },
  { name: 'Cálculo', href: '/calculo', icon: Calculator },
  { name: 'Simulador', href: '/simulador', icon: BarChart3 },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Acelera GHAS</h1>
            <p className="text-xs text-sidebar-foreground/60">2026</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Link
            to="/configuracoes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <Settings className="w-5 h-5" />
            Configurações
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        {children}
      </main>
    </div>
  );
}
