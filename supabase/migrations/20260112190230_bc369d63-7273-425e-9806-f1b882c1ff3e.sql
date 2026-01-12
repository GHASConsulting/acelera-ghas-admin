-- Create table for GHAS Feedback
CREATE TABLE public.feedbacks_ghas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  autor_id UUID NOT NULL REFERENCES public.prestadores(id),
  destinatario_id UUID NOT NULL REFERENCES public.prestadores(id),
  mes TEXT NOT NULL,
  feedback_comecar_fazer TEXT,
  feedback_continuar_fazer TEXT,
  feedback_parar_fazer TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_feedback_mes_autor_destinatario UNIQUE (mes, autor_id, destinatario_id)
);

-- Enable Row Level Security
ALTER TABLE public.feedbacks_ghas ENABLE ROW LEVEL SECURITY;

-- Admins can manage all feedbacks
CREATE POLICY "Admins podem gerenciar todos feedbacks" 
ON public.feedbacks_ghas 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Responsavel GHAS can create feedbacks
CREATE POLICY "Responsavel GHAS pode criar feedbacks" 
ON public.feedbacks_ghas 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM prestadores p
  WHERE p.user_id = auth.uid() AND p.responsavel_ghas = true
));

-- Responsavel GHAS can update their own feedbacks
CREATE POLICY "Responsavel GHAS pode atualizar seus feedbacks" 
ON public.feedbacks_ghas 
FOR UPDATE 
USING (
  autor_id = current_prestador_id() AND
  EXISTS (
    SELECT 1 FROM prestadores p
    WHERE p.user_id = auth.uid() AND p.responsavel_ghas = true
  )
);

-- Responsavel GHAS can delete their own feedbacks
CREATE POLICY "Responsavel GHAS pode excluir seus feedbacks" 
ON public.feedbacks_ghas 
FOR DELETE 
USING (
  autor_id = current_prestador_id() AND
  EXISTS (
    SELECT 1 FROM prestadores p
    WHERE p.user_id = auth.uid() AND p.responsavel_ghas = true
  )
);

-- Users can view feedbacks where they are the author or recipient
CREATE POLICY "Usuarios podem ver feedbacks relacionados" 
ON public.feedbacks_ghas 
FOR SELECT 
USING (
  autor_id = current_prestador_id() OR 
  destinatario_id = current_prestador_id()
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feedbacks_ghas_updated_at
BEFORE UPDATE ON public.feedbacks_ghas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();