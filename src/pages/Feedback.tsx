import { useState } from 'react';
import { MessageSquare, Loader2, Eye, Lock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useFeedbacksGhas } from '@/hooks/useFeedbacksGhas';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';

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

export default function FeedbackPage() {
  const { data: feedbacks = [], isLoading } = useFeedbacksGhas();
  const { prestador, loading: loadingUser } = usePrestadorLogado();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackGhas | null>(null);

  // Filtrar apenas feedbacks onde o usuário logado é o destinatário
  const meusFeedbacks = feedbacks.filter(
    (f) => f.destinatario_id === prestador?.id
  );

  const handleVisualizarFeedback = (feedback: FeedbackGhas) => {
    setCurrentFeedback(feedback);
    setIsViewOpen(true);
  };

  if (loadingUser || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Meus Feedbacks</h1>
              <p className="page-subtitle">
                Visualize os feedbacks de desenvolvimento recebidos
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info Card */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Feedback e Desenvolvimento</p>
                <p className="text-sm text-muted-foreground">
                  Reflexões enviadas pelo seu avaliador para sua melhoria contínua
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Feedbacks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Feedbacks Recebidos
            </h2>

            {meusFeedbacks.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum feedback recebido
                </h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não recebeu feedbacks de desenvolvimento.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {ordenarPorMes(meusFeedbacks).map((feedback) => (
                  <div
                    key={feedback.id}
                    className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleVisualizarFeedback(feedback)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{feedback.mes}</h3>
                          <p className="text-sm text-muted-foreground">
                            De: {feedback.autor?.nome || 'N/A'}
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
                            <p className="text-xs text-muted-foreground">Recebido em</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(feedback.criado_em).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Visualizar Feedback */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback - {currentFeedback?.mes}</DialogTitle>
            <DialogDescription>
              Feedback de desenvolvimento enviado por {currentFeedback?.autor?.nome || 'N/A'}
            </DialogDescription>
          </DialogHeader>

          {currentFeedback && (
            <div className="space-y-6 py-4">
              {/* Info do Autor */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Enviado por</Label>
                    <p className="font-medium">{currentFeedback.autor?.nome || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data</Label>
                    <p className="font-medium">
                      {new Date(currentFeedback.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Campos de Feedback (somente leitura) */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">📝</span>
                  <div>
                    <h3 className="faixa-title">Feedback e Desenvolvimento</h3>
                    <p className="text-sm text-muted-foreground">Reflexões para sua melhoria contínua</p>
                  </div>
                </div>

                <div className="space-y-6 mt-4">
                  <div>
                    <Label className="input-label">O que devo Começar a Fazer</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md min-h-[80px]">
                      <p className="text-sm whitespace-pre-wrap">
                        {currentFeedback.feedback_comecar_fazer || 
                          <span className="text-muted-foreground italic">Nenhum feedback informado</span>
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="input-label">O que devo Continuar a Fazer</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md min-h-[80px]">
                      <p className="text-sm whitespace-pre-wrap">
                        {currentFeedback.feedback_continuar_fazer || 
                          <span className="text-muted-foreground italic">Nenhum feedback informado</span>
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="input-label">O que devo Parar de Fazer</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md min-h-[80px]">
                      <p className="text-sm whitespace-pre-wrap">
                        {currentFeedback.feedback_parar_fazer || 
                          <span className="text-muted-foreground italic">Nenhum feedback informado</span>
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
