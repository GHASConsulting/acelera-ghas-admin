import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type Prestador = Tables<'prestadores'>;
type AppRole = 'admin' | 'avaliador' | 'prestador';

interface PrestadorLogadoData {
  prestador: Prestador | null;
  roles: AppRole[];
}

export function usePrestadorLogado() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['prestador-logado', user?.id],
    queryFn: async (): Promise<PrestadorLogadoData> => {
      if (!user) {
        return { prestador: null, roles: [] };
      }

      // Fetch prestador and roles in parallel
      const [prestadorResult, rolesResult] = await Promise.all([
        supabase
          .from('prestadores')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id),
      ]);

      return {
        prestador: prestadorResult.data,
        roles: rolesResult.data?.map((r) => r.role) || [],
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (anteriormente cacheTime)
  });

  const prestador = data?.prestador ?? null;
  const roles = data?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isAvaliador = roles.includes('avaliador');
  const isResponsavelGhas = prestador?.responsavel_ghas ?? false;

  return { prestador, roles, loading: isLoading, isAdmin, isAvaliador, isResponsavelGhas };
}
