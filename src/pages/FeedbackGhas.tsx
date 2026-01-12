import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Loader2, Trash2, Save, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFeedbacksGhas, useCreateFeedbackGhas, useUpdateFeedbackGhas, useDeleteFeedbackGhas } from '@/hooks/useFeedbacksGhas';
import { usePrestadores } from '@/hooks/usePrestadores';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';
import { useToast } from '@/hooks/use-toast';

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
  autor?: { id: string; nome: string };
  destinatario?: { id: string; nome: string };
}

const MESES_AVALIACAO = [
  'Janeiro/2026',
  'Fevereiro/2026',
  'Março/2026',
  'Abril/2026',
  'Maio/2026',
  'Junho/2026',
  'Julho/2026',
  'Agosto/2026',
  'Setembro/2026',
  'Outubro/2026',
  'Novembro/2026',
  'Dezembro/2026',
];

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

export default function FeedbackGhasPage() {
  const { data: feedbacks = [], isLoading } = useFeedbacksGhas();
  const { data: prestadores = [] } = usePrestadores();
  const { prestador, isResponsavelGhas, isAdmin, loading: loadingUser } = usePrestadorLogado();
  const createFeedback = useCreateFeedbackGhas();
  const updateFeedback = useUpdateFeedbackGhas();
  const deleteFeedback = useDeleteFeedbackGhas();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackGhas | null>(null);
  const [newMes, setNewMes] = useState<string>('');
  const [newDestinatario, setNewDestinatario] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Verificar se o usuário tem permissão
  useEffect(() => {
    if (!loadingUser && !isResponsavelGhas && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
      navigate('/registro');
    }
  }, [loadingUser, isResponsavelGhas, isAdmin, navigate, toast]);

  // Prestadores ativos disponíveis como destinatários
  const prestadoresAtivos = prestadores.filter((p) => p.situacao === 'ativo');

  const handleCriarFeedback = async () => {
    if (!newMes || !newDestinatario) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o mês e o destinatário.',
        variant: 'destructive',
      });
      return;
    }

    if (!prestador) {
      toast({
        title: 'Erro',
        description: 'Usuário não identificado.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se já existe feedback para esse mês/destinatário
    const feedbackExistente = feedbacks.find(
      (f) => f.mes === newMes && f.destinatario_id === newDestinatario && f.autor_id === prestador.id
    );

    if (feedbackExistente) {
      toast({
        title: 'Feedback já existe',
        description: `Já existe um feedback para este destinatário em ${newMes}.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const novoFeedback = await createFeedback.mutateAsync({
        mes: newMes,
        autor_id: prestador.id,
        destinatario_id: newDestinatario,
      });

      toast({
        title: 'Feedback criado',
        description: `Feedback para ${newMes} foi criado com sucesso.`,
      });
      setIsNewDialogOpen(false);
      setNewMes('');
      setNewDestinatario('');

      // Buscar o feedback completo com relações
      const destinatarioNome = prestadoresAtivos.find((p) => p.id === newDestinatario)?.nome || '';
      setCurrentFeedback({
        ...novoFeedback,
        autor: { id: prestador.id, nome: prestador.nome },
        destinatario: { id: newDestinatario, nome: destinatarioNome },
      });
      setIsFormOpen(true);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar feedback',
        description: error.message || 'Ocorreu um erro ao criar o feedback.',
        variant: 'destructive',
      });
    }
  };

  const handleEditarFeedback = (feedback: FeedbackGhas) => {
    setCurrentFeedback({ ...feedback });
    setIsFormOpen(true);
  };

  const handleSalvarFeedback = async () => {
    if (!currentFeedback) return;

    try {
      await updateFeedback.mutateAsync({
        id: currentFeedback.id,
        feedback_comecar_fazer: currentFeedback.feedback_comecar_fazer,
        feedback_continuar_fazer: currentFeedback.feedback_continuar_fazer,
        feedback_parar_fazer: currentFeedback.feedback_parar_fazer,
      });

      toast({
        title: 'Feedback salvo',
        description: 'O feedback foi atualizado com sucesso.',
      });
      setIsFormOpen(false);
      setCurrentFeedback(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o feedback.',
        variant: 'destructive',
      });
    }
  };

  const updateField = (field: keyof FeedbackGhas, value: string | null) => {
    if (!currentFeedback) return;
    setCurrentFeedback({ ...currentFeedback, [field]: value });
  };

  const handleDeleteFeedback = async () => {
    if (!currentFeedback) return;

    try {
      await deleteFeedback.mutateAsync(currentFeedback.id);
      toast({
        title: 'Feedback excluído',
        description: `Feedback de ${currentFeedback.mes} foi excluído com sucesso.`,
      });
      setIsDeleteDialogOpen(false);
      setIsFormOpen(false);
      setCurrentFeedback(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Ocorreu um erro ao excluir o feedback.',
        variant: 'destructive',
      });
    }
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

  if (!isResponsavelGhas && !isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Feedback GHAS</h1>
              <p className="page-subtitle">
                Registre feedbacks de desenvolvimento para os prestadores
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Botão Novo Feedback */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Feedback e Desenvolvimento</p>
                  <p className="text-sm text-muted-foreground">
                    Reflexões para melhoria contínua dos prestadores
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsNewDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Feedback
              </Button>
            </div>
          </div>

          {/* Lista de Feedbacks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Feedbacks Registrados
            </h2>

            {feedbacks.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum feedback registrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Clique em "Novo Feedback" para começar.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {ordenarPorMes(feedbacks).map((feedback) => (
                  <div
                    key={feedback.id}
                    className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEditarFeedback(feedback)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{feedback.mes}</h3>
                          <p className="text-sm text-muted-foreground">
                            Destinatário: {feedback.destinatario?.nome || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Autor</p>
                          <p className="text-sm font-medium text-foreground">
                            {feedback.autor?.nome || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Atualizado em</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(feedback.atualizado_em).toLocaleDateString('pt-BR')}
                          </p>
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

      {/* Dialog Novo Feedback */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Feedback</DialogTitle>
            <DialogDescription>
              Selecione o mês e o destinatário para criar um novo feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Autor (somente leitura) */}
            <div>
              <Label className="input-label mb-2 block">Autor</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{prestador?.nome || 'N/A'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                O autor é automaticamente definido como o usuário logado
              </p>
            </div>

            {/* Destinatário */}
            <div>
              <Label className="input-label mb-2 block">Destinatário</Label>
              <Select value={newDestinatario} onValueChange={setNewDestinatario}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destinatário..." />
                </SelectTrigger>
                <SelectContent>
                  {prestadoresAtivos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mês */}
            <div>
              <Label className="input-label mb-2 block">Mês de Avaliação</Label>
              <Select value={newMes} onValueChange={setNewMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês..." />
                </SelectTrigger>
                <SelectContent>
                  {MESES_AVALIACAO.map((mes) => (
                    <SelectItem key={mes} value={mes}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarFeedback} disabled={createFeedback.isPending}>
              {createFeedback.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Criar Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Formulário de Feedback */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback - {currentFeedback?.mes}</DialogTitle>
            <DialogDescription>
              Preencha os campos de feedback e desenvolvimento.
            </DialogDescription>
          </DialogHeader>

          {currentFeedback && (
            <div className="space-y-6 py-4">
              {/* Info do Autor e Destinatário */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Autor</Label>
                  <p className="font-medium">{currentFeedback.autor?.nome || prestador?.nome || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destinatário</Label>
                  <p className="font-medium">{currentFeedback.destinatario?.nome || 'N/A'}</p>
                </div>
              </div>

              {/* Campos de Feedback */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">📝</span>
                  <div>
                    <h3 className="faixa-title">Feedback e Desenvolvimento</h3>
                    <p className="text-sm text-muted-foreground">Reflexões para melhoria contínua</p>
                  </div>
                </div>

                <div className="space-y-6 mt-4">
                  <div>
                    <Label className="input-label">O que devo Começar a Fazer</Label>
                    <Textarea 
                      placeholder="Descreva novas ações ou comportamentos que você deve começar a adotar..."
                      className="mt-2 min-h-[100px]"
                      value={currentFeedback.feedback_comecar_fazer || ''}
                      onChange={(e) => updateField('feedback_comecar_fazer', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="input-label">O que devo Continuar a Fazer</Label>
                    <Textarea 
                      placeholder="Descreva ações ou comportamentos positivos que você deve manter..."
                      className="mt-2 min-h-[100px]"
                      value={currentFeedback.feedback_continuar_fazer || ''}
                      onChange={(e) => updateField('feedback_continuar_fazer', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="input-label">O que devo Parar de Fazer</Label>
                    <Textarea 
                      placeholder="Descreva ações ou comportamentos que você deve eliminar..."
                      className="mt-2 min-h-[100px]"
                      value={currentFeedback.feedback_parar_fazer || ''}
                      onChange={(e) => updateField('feedback_parar_fazer', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvarFeedback} 
                disabled={updateFeedback.isPending}
                className="gap-2"
              >
                {updateFeedback.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Confirmar Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o feedback de <strong>{currentFeedback?.mes}</strong> para{' '}
              <strong>{currentFeedback?.destinatario?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFeedback}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
