import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Prestador = Tables<'prestadores'>;
type PrestadorInsert = TablesInsert<'prestadores'>;
type PrestadorUpdate = TablesUpdate<'prestadores'>;

export function usePrestadores() {
  return useQuery({
    queryKey: ['prestadores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as Prestador[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useCreatePrestador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prestador: PrestadorInsert) => {
      const { data, error } = await supabase
        .from('prestadores')
        .insert(prestador)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestadores'] });
    },
  });
}

export function useUpdatePrestador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...prestador }: PrestadorUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('prestadores')
        .update(prestador)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestadores'] });
    },
  });
}
