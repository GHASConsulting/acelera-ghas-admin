import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type Prestador = Tables<'prestadores'>;
type AppRole = 'admin' | 'avaliador' | 'prestador';

export function usePrestadorLogado() {
  const { user } = useAuth();
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPrestador(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchPrestador = async () => {
      setLoading(true);
      
      // Fetch prestador
      const { data: prestadorData } = await supabase
        .from('prestadores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prestadorData) {
        setPrestador(prestadorData);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesData) {
        setRoles(rolesData.map((r) => r.role));
      }

      setLoading(false);
    };

    fetchPrestador();
  }, [user]);

  const isAdmin = roles.includes('admin');
  const isAvaliador = roles.includes('avaliador');
  const isResponsavelGhas = prestador?.responsavel_ghas ?? false;

  return { prestador, roles, loading, isAdmin, isAvaliador, isResponsavelGhas };
}
