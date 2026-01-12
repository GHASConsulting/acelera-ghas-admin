import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackGhas {
  id: string;
  autor_id: string;
  destinatario_id: string;
  mes: string;
  feedback_comecar_fazer: string | null;
  feedback_continuar_fazer: string | null;
  feedback_parar_fazer: string | null;
  criado_em: string;
  atualizado_em: string;
}

interface FeedbackGhasWithRelations extends FeedbackGhas {
  autor?: { id: string; nome: string };
  destinatario?: { id: string; nome: string };
}

export function useFeedbacksGhas() {
  return useQuery({
    queryKey: ['feedbacks-ghas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedbacks_ghas')
        .select(`
          *,
          autor:prestadores!feedbacks_ghas_autor_id_fkey(id, nome),
          destinatario:prestadores!feedbacks_ghas_destinatario_id_fkey(id, nome)
        `)
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data as FeedbackGhasWithRelations[];
    },
  });
}

export function useCreateFeedbackGhas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (feedback: {
      autor_id: string;
      destinatario_id: string;
      mes: string;
      feedback_comecar_fazer?: string | null;
      feedback_continuar_fazer?: string | null;
      feedback_parar_fazer?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('feedbacks_ghas')
        .insert(feedback)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks-ghas'] });
    },
  });
}

export function useUpdateFeedbackGhas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (feedback: {
      id: string;
      feedback_comecar_fazer?: string | null;
      feedback_continuar_fazer?: string | null;
      feedback_parar_fazer?: string | null;
    }) => {
      const { id, ...updates } = feedback;
      const { data, error } = await supabase
        .from('feedbacks_ghas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks-ghas'] });
    },
  });
}

export function useDeleteFeedbackGhas() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feedbacks_ghas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks-ghas'] });
    },
  });
}
