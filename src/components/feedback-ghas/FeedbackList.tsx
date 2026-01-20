import { FeedbackCard } from './FeedbackCard';
import { FeedbackEmptyState } from './FeedbackEmptyState';

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

// Função para extrair índice do mês (1-12)
const getMesIndex = (mes: string): number => {
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const mesNome = mes.split('/')[0];
  return mesesNomes.indexOf(mesNome);
};

// Função para ordenar por mês (1-12)
const ordenarPorMes = <T extends { mes: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => getMesIndex(a.mes) - getMesIndex(b.mes));
};

interface FeedbackListProps {
  feedbacks: FeedbackGhas[];
  onClickFeedback: (feedback: FeedbackGhas) => void;
  variant: 'recebido' | 'enviado';
}

export function FeedbackList({ feedbacks, onClickFeedback, variant }: FeedbackListProps) {
  if (feedbacks.length === 0) {
    return <FeedbackEmptyState variant={variant} />;
  }

  return (
    <div className="grid gap-4">
      {ordenarPorMes(feedbacks).map((feedback) => (
        <FeedbackCard
          key={feedback.id}
          feedback={feedback}
          onClick={onClickFeedback}
          variant={variant}
        />
      ))}
    </div>
  );
}
