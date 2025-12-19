import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type RegistroGlobal = Tables<'registros_globais'>;
type RegistroGlobalInsert = TablesInsert<'registros_globais'>;
type RegistroGlobalUpdate = TablesUpdate<'registros_globais'>;
type AvaliacaoMensal = Tables<'avaliacoes_mensais'>;
type AvaliacaoInsert = TablesInsert<'avaliacoes_mensais'>;
type AvaliacaoUpdate = TablesUpdate<'avaliacoes_mensais'>;

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

export function useCreateRegistroGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registro: RegistroGlobalInsert) => {
      const { data, error } = await supabase
        .from('registros_globais')
        .insert(registro)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros_globais'] });
    },
  });
}

export function useUpdateRegistroGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...registro }: RegistroGlobalUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('registros_globais')
        .update(registro)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros_globais'] });
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

export function useCreateAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avaliacao: AvaliacaoInsert) => {
      const { data, error } = await supabase
        .from('avaliacoes_mensais')
        .insert(avaliacao)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes', variables.prestador_id] });
    },
  });
}

export function useUpdateAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...avaliacao }: AvaliacaoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('avaliacoes_mensais')
        .update(avaliacao)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes', data.prestador_id] });
    },
  });
}

export function useDeleteAvaliacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, prestador_id }: { id: string; prestador_id: string }) => {
      const { error } = await supabase
        .from('avaliacoes_mensais')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { prestador_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes', data.prestador_id] });
    },
  });
}

export function useDeleteRegistroGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('registros_globais')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros_globais'] });
    },
  });
}
