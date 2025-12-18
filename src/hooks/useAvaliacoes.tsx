import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type RegistroGlobal = Tables<'registros_globais'>;
type AvaliacaoMensal = Tables<'avaliacoes_mensais'>;

export function useRegistrosGlobais() {
  return useQuery({
    queryKey: ['registros_globais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registros_globais')
        .select('*')
        .order('mes');

      if (error) throw error;
      return data as RegistroGlobal[];
    },
  });
}

export function useAvaliacoes(prestadorId?: string) {
  return useQuery({
    queryKey: ['avaliacoes', prestadorId],
    queryFn: async () => {
      let query = supabase.from('avaliacoes_mensais').select('*');
      
      if (prestadorId) {
        query = query.eq('prestador_id', prestadorId);
      }

      const { data, error } = await query.order('mes');

      if (error) throw error;
      return data as AvaliacaoMensal[];
    },
    enabled: !!prestadorId || prestadorId === undefined,
  });
}
