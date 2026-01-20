import { MessageSquare, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  liberado_em?: string | null;
  autor?: { id: string; nome: string };
  destinatario?: { id: string; nome: string };
}

interface FeedbackCardProps {
  feedback: FeedbackGhas;
  onClick: (feedback: FeedbackGhas) => void;
  variant: 'recebido' | 'enviado';
}

export function FeedbackCard({ feedback, onClick, variant }: FeedbackCardProps) {
  return (
    <div
      className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(feedback)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{feedback.mes}</h3>
            <p className="text-sm text-muted-foreground">
              {variant === 'recebido' 
                ? `De: ${feedback.autor?.nome || 'N/A'}`
                : `Para: ${feedback.destinatario?.nome || 'N/A'}`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {feedback.liberado_em && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" />
              Liberado
            </Badge>
          )}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Atualizado em</p>
            <p className="text-sm text-muted-foreground">
              {new Date(feedback.atualizado_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
