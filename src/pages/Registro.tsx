import { useState } from 'react';
import { Plus, ClipboardList, AlertCircle, CheckCircle2, Info, Lock, Calendar, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { usePrestadores } from '@/hooks/usePrestadores';
import { useAvaliacoes, useRegistrosGlobais } from '@/hooks/useAvaliacoes';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type AvaliacaoMensal = Tables<'avaliacoes_mensais'>;
type Prestador = Tables<'prestadores'>;

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

export default function Registro() {
  const { data: prestadores = [], isLoading: loadingPrestadores } = usePrestadores();
  const { data: registrosGlobais = [] } = useRegistrosGlobais();
  const { prestador: prestadorLogado, loading: loadingUser } = usePrestadorLogado();
  
  const [selectedPrestador, setSelectedPrestador] = useState<string>('');
  const { data: avaliacoes = [], isLoading: loadingAvaliacoes } = useAvaliacoes(selectedPrestador || undefined);
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAvaliacao, setCurrentAvaliacao] = useState<AvaliacaoMensal | null>(null);
  const [newMes, setNewMes] = useState<string>('');
  const { toast } = useToast();

  // Filtrar prestadores ativos sob responsabilidade do usuário logado
  const prestadoresDisponiveis = prestadores.filter(
    (p) => p.situacao === 'ativo' && p.avaliador_id === prestadorLogado?.id
  );

  const prestadorSelecionado = prestadoresDisponiveis.find((p) => p.id === selectedPrestador);

  // Meses já avaliados
  const mesesAvaliados = avaliacoes.map((a) => a.mes);

  // Meses disponíveis para nova avaliação
  const mesesDisponiveis = MESES_AVALIACAO.filter((m) => !mesesAvaliados.includes(m));

  // Buscar registro global do mês
  const getRegistroGlobal = (mes: string) => {
    return registrosGlobais.find((r) => r.mes === mes);
  };

  const handleCriarAvaliacao = () => {
    if (!selectedPrestador || !newMes) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o prestador e o mês.',
        variant: 'destructive',
      });
      return;
    }

    // Por enquanto, apenas simular criação local
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A criação de avaliações será implementada em breve.',
    });
    setIsNewDialogOpen(false);
    setNewMes('');
  };

  const handleEditarAvaliacao = (avaliacao: AvaliacaoMensal) => {
    setCurrentAvaliacao({ ...avaliacao });
    setIsFormOpen(true);
  };

  const handleSalvarAvaliacao = () => {
    if (!currentAvaliacao) return;

    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A edição de avaliações será implementada em breve.',
    });

    setIsFormOpen(false);
    setCurrentAvaliacao(null);
  };

  const calcularElegibilidade = (avaliacao: AvaliacaoMensal) => {
    return avaliacao.faixa1_ausencias === 0 && avaliacao.faixa1_pendencias === 0;
  };

  const calcularScoreFaixa2 = (avaliacao: AvaliacaoMensal) => {
    const chaveTotal =
      Number(avaliacao.faixa2_chave_comportamento) +
      Number(avaliacao.faixa2_chave_habilidades) +
      Number(avaliacao.faixa2_chave_atitudes) +
      Number(avaliacao.faixa2_chave_valores);
    const chavePercentual = (chaveTotal / 4) * 100;
    return (Number(avaliacao.faixa2_produtividade) * 0.3 + Number(avaliacao.faixa2_qualidade) * 0.3 + chavePercentual * 0.4).toFixed(1);
  };

  const calcularScoreFaixa3 = (avaliacao: AvaliacaoMensal) => {
    return (
      (Number(avaliacao.faixa3_nps_projeto) * 0.4 +
        (100 - Number(avaliacao.faixa3_backlog)) * 0.3 +
        Number(avaliacao.faixa3_prioridades) * 0.3) /
      1
    ).toFixed(1);
  };

  const updateField = (field: keyof AvaliacaoMensal, value: number) => {
    if (!currentAvaliacao) return;
    setCurrentAvaliacao({ ...currentAvaliacao, [field]: value });
  };

  if (loadingPrestadores || loadingUser) {
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
              <h1 className="page-title">Registro de Avaliações</h1>
              <p className="page-subtitle">
                Registre as avaliações mensais dos seus prestadores
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Filtro de Prestador */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-sm">
                <Label className="input-label mb-2 block">Selecione o Prestador</Label>
                <Select value={selectedPrestador} onValueChange={setSelectedPrestador}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um prestador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {prestadoresDisponiveis.map((prestador) => (
                      <SelectItem key={prestador.id} value={prestador.id}>
                        {prestador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPrestador && (
                <Button
                  onClick={() => setIsNewDialogOpen(true)}
                  className="gap-2 mt-6"
                  disabled={mesesDisponiveis.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  Novo Registro de Avaliação
                </Button>
              )}
            </div>

            {prestadoresDisponiveis.length === 0 && (
              <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Você não possui prestadores ativos sob sua responsabilidade.
                </p>
              </div>
            )}
          </div>

          {/* Loading */}
          {loadingAvaliacoes && selectedPrestador && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Lista de Avaliações */}
          {selectedPrestador && !loadingAvaliacoes && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Avaliações de {prestadorSelecionado?.nome}
              </h2>

              {avaliacoes.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhuma avaliação registrada
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Clique em "Novo Registro de Avaliação" para começar.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {avaliacoes.map((avaliacao) => (
                    <div
                      key={avaliacao.id}
                      className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEditarAvaliacao(avaliacao)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ClipboardList className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{avaliacao.mes}</h3>
                            <p className="text-sm text-muted-foreground">
                              Atualizado em{' '}
                              {new Date(avaliacao.atualizado_em).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Elegibilidade</p>
                            <Badge
                              variant={calcularElegibilidade(avaliacao) ? 'success' : 'destructive'}
                            >
                              {calcularElegibilidade(avaliacao) ? 'Elegível' : 'Inelegível'}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Faixa 2</p>
                            <p className="text-lg font-bold text-primary">
                              {calcularScoreFaixa2(avaliacao)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Faixa 3</p>
                            <p className="text-lg font-bold text-primary">
                              {calcularScoreFaixa3(avaliacao)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog Nova Avaliação */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Registro de Avaliação</DialogTitle>
            <DialogDescription>
              Selecione o mês para criar uma nova avaliação.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label className="input-label mb-2 block">Mês de Avaliação</Label>
            <Select value={newMes} onValueChange={setNewMes}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês..." />
              </SelectTrigger>
              <SelectContent>
                {mesesDisponiveis.map((mes) => (
                  <SelectItem key={mes} value={mes}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarAvaliacao}>Criar Avaliação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Formulário de Avaliação (simplificado) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliação - {currentAvaliacao?.mes}</DialogTitle>
            <DialogDescription>
              Visualize os dados da avaliação do prestador.
            </DialogDescription>
          </DialogHeader>

          {currentAvaliacao && (
            <div className="space-y-6 py-4">
              {/* Faixa 1 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">1</span>
                  <div>
                    <h3 className="faixa-title">Elegibilidade</h3>
                    <p className="text-sm text-muted-foreground">
                      Define se o prestador está elegível para premiação
                    </p>
                  </div>
                  <Badge
                    variant={calcularElegibilidade(currentAvaliacao) ? 'success' : 'destructive'}
                    className="ml-auto"
                  >
                    {calcularElegibilidade(currentAvaliacao) ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Elegível</>
                    ) : (
                      <><AlertCircle className="w-3 h-3 mr-1" /> Inelegível</>
                    )}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Ausências</p>
                    <p className="text-2xl font-bold text-foreground">{currentAvaliacao.faixa1_ausencias}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Pendências</p>
                    <p className="text-2xl font-bold text-foreground">{currentAvaliacao.faixa1_pendencias}</p>
                  </div>
                </div>
              </div>

              {/* Faixa 2 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">2</span>
                  <div>
                    <h3 className="faixa-title">Produtividade Individual</h3>
                    <p className="text-sm text-muted-foreground">Peso: 40%</p>
                  </div>
                  <p className="ml-auto text-xl font-bold text-primary">{calcularScoreFaixa2(currentAvaliacao)}%</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Produtividade</p>
                    <p className="text-xl font-bold text-foreground">{Number(currentAvaliacao.faixa2_produtividade)}%</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Qualidade</p>
                    <p className="text-xl font-bold text-foreground">{Number(currentAvaliacao.faixa2_qualidade)}%</p>
                  </div>
                </div>
              </div>

              {/* Faixa 3 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">3</span>
                  <div>
                    <h3 className="faixa-title">Resultado com Cliente e Time</h3>
                    <p className="text-sm text-muted-foreground">Peso: 30%</p>
                  </div>
                  <p className="ml-auto text-xl font-bold text-primary">{calcularScoreFaixa3(currentAvaliacao)}%</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">NPS Projeto</p>
                    <p className="text-xl font-bold text-foreground">{Number(currentAvaliacao.faixa3_nps_projeto)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Backlog</p>
                    <p className="text-xl font-bold text-foreground">{Number(currentAvaliacao.faixa3_backlog)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Prioridades</p>
                    <p className="text-xl font-bold text-foreground">{Number(currentAvaliacao.faixa3_prioridades)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
