import { MessageSquare } from 'lucide-react';

interface FeedbackEmptyStateProps {
  variant: 'recebido' | 'enviado';
}

export function FeedbackEmptyState({ variant }: FeedbackEmptyStateProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-12 text-center">
      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {variant === 'recebido' 
          ? 'Nenhum feedback recebido' 
          : 'Nenhum feedback enviado'
        }
      </h3>
      <p className="text-muted-foreground">
        {variant === 'recebido'
          ? 'Você ainda não recebeu feedbacks de desenvolvimento.'
          : 'Você ainda não enviou feedbacks. Clique em "Novo Feedback" para começar.'
        }
      </p>
    </div>
  );
}
