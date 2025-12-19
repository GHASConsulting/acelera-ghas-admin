import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';
import { Loader2 } from 'lucide-react';

interface ProtectedGhasRouteProps {
  children: ReactNode;
}

export function ProtectedGhasRoute({ children }: ProtectedGhasRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isResponsavelGhas, loading: roleLoading } = usePrestadorLogado();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Apenas Responsáveis GHAS podem acessar
  if (!isResponsavelGhas) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
