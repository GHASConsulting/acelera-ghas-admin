import { useState } from 'react';
import { Plus, ClipboardList, AlertCircle, CheckCircle2, Info, Lock, Calendar, Loader2, Save, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePrestadores } from '@/hooks/usePrestadores';
import { useAvaliacoes, useRegistrosGlobais, useCreateAvaliacao, useUpdateAvaliacao, useDeleteAvaliacao } from '@/hooks/useAvaliacoes';
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

// Componente de tooltip de informação usando HoverCard para melhor visualização
const InfoTooltip = ({ content, preferSide = "top" }: { content: React.ReactNode; preferSide?: "top" | "bottom" | "left" | "right" }) => (
  <HoverCard openDelay={100} closeDelay={100}>
    <HoverCardTrigger asChild>
      <button type="button" className="inline-flex items-center justify-center ml-1.5 focus:outline-none">
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
          <Info className="w-3 h-3 text-primary" />
        </div>
      </button>
    </HoverCardTrigger>
    <HoverCardContent 
      className="w-72 max-w-[85vw] p-4 text-sm z-[100]" 
      side={preferSide}
      align="center"
      sideOffset={8}
      collisionPadding={20}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Info className="w-4 h-4" />
          <span>Instruções de Preenchimento</span>
        </div>
        <div className="text-muted-foreground whitespace-pre-line leading-relaxed text-xs">
          {content}
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);

// Textos de ajuda para cada campo
const TOOLTIPS = {
  ausencias: `• 1 dia de Ausência: reduz 30% do valor total
• 2 dias (consecutivos ou não): reduz 70% do valor total
• 3 dias ou mais: reduz 100% do valor total

Não é considerada Ausência:
• Ausências acordadas com 60 dias de antecedência
• Ausência acordada com 7 dias por motivos de saúde
• Ausência por urgência de saúde

É considerada Ausência:
• Não presença física em clientes (agenda presencial)
• Ausência sem justificativa prévia em reuniões`,
  
  pendencias: `• 1 Notificação: reduz 100% do valor total
• Cada pendência: reduz 10% no pagamento total

Pendências administrativas:
• Não registro do RAT (relatório semanal)
• Não registro do Diário GHAS
• Não entrega de NF até 2 dias úteis após faturamento
• Falta de assinatura de contratos/aditivos
• Falta de assinatura de documentos GHAS
• Não entrega de Gestão de Viagens (15 dias para ônibus, 30 dias para avião)`,
  
  notificacoes: `Quantidade de notificações formais ao prestador no mês.
• 0: Nenhuma notificação
• 1 ou mais: Prestador recebeu notificação formal`,
  
  produtividade: `O prestador atingiu a produtividade mínima exigida para sua função?
• Sim: Atingiu a meta mínima
• Não: Não atingiu a meta mínima`,
  
  qualidade: `O prestador atingiu a qualidade mínima exigida?
Avaliação por amostragem mínima de 6 chamados mensais.
• Sim: Atingiu a qualidade mínima
• Não: Não atingiu a qualidade mínima`,
  
  chave: `Avaliação mensal do Prestador Líder sobre diretrizes da CHAVE GHAS:

• Comportamento conforme CHAVE GHAS?
• Habilidades conforme CHAVE GHAS?
• Atitudes conforme CHAVE GHAS?
• Alinhamento com os Valores conforme CHAVE GHAS?`,
  
  nps_projeto: `O Score mensal do NPS do cliente ficou igual ou superior a 75?`,
  
  sla: `Acima de 90% dos chamados abertos no mês foram realizados o primeiro atendimento em até 1 hora?`,
  
  prioridades: `Prestador Líder garantiu 95% ou mais das atividades da Lista de Prioridade em dia?`,
  
  backlog: `Prestador Líder garantiu backlog menor que 15% em relação aos chamados abertos no encerramento do mês e que não tenha chamados abertos a mais de 90 dias, que não estão na Lista de Prioridade?`,
  
  nps_global: `NPS Mensal da GHAS deve estar com score mensal igual ou superior a 75.`,
  
  churn: `O Churn da GHAS foi igual ou superior a 1?`,
  
  uso_ava: `Percentual de uso da AVA pelos prestadores.`,
};

export default function Registro() {
  const { data: prestadores = [], isLoading: loadingPrestadores } = usePrestadores();
  const { data: registrosGlobais = [] } = useRegistrosGlobais();
  const { prestador: prestadorLogado, loading: loadingUser, isAdmin } = usePrestadorLogado();
  
  const [selectedPrestador, setSelectedPrestador] = useState<string>('');
  const { data: avaliacoes = [], isLoading: loadingAvaliacoes } = useAvaliacoes(selectedPrestador || undefined);
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAvaliacao, setCurrentAvaliacao] = useState<Partial<AvaliacaoMensal> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newMes, setNewMes] = useState<string>('');
  const { toast } = useToast();

  const createAvaliacao = useCreateAvaliacao();
  const updateAvaliacao = useUpdateAvaliacao();
  const deleteAvaliacao = useDeleteAvaliacao();

  // Filtrar prestadores ativos sob responsabilidade do usuário logado (ou todos se admin)
  const prestadoresDisponiveis = prestadores.filter(
    (p) => p.situacao === 'ativo' && (isAdmin || p.avaliador_id === prestadorLogado?.id)
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

  const handleCriarAvaliacao = async () => {
    if (!selectedPrestador || !newMes || !prestadorLogado) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o prestador e o mês.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const novaAvaliacao = await createAvaliacao.mutateAsync({
        prestador_id: selectedPrestador,
        avaliador_id: prestadorLogado.id,
        mes: newMes,
      });

      toast({
        title: 'Avaliação criada',
        description: `Avaliação de ${newMes} criada com sucesso.`,
      });

      setIsNewDialogOpen(false);
      setNewMes('');
      
      // Abrir formulário para edição
      setCurrentAvaliacao(novaAvaliacao);
      setIsEditing(true);
      setIsFormOpen(true);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar avaliação',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const handleEditarAvaliacao = (avaliacao: AvaliacaoMensal) => {
    setCurrentAvaliacao({ ...avaliacao });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleSalvarAvaliacao = async () => {
    if (!currentAvaliacao || !currentAvaliacao.id) return;

    try {
      await updateAvaliacao.mutateAsync({
        id: currentAvaliacao.id,
        faixa1_ausencias: currentAvaliacao.faixa1_ausencias,
        faixa1_pendencias: currentAvaliacao.faixa1_pendencias,
        faixa2_produtividade: currentAvaliacao.faixa2_produtividade,
        faixa2_qualidade: currentAvaliacao.faixa2_qualidade,
        faixa2_chave_comportamento: currentAvaliacao.faixa2_chave_comportamento,
        faixa2_chave_habilidades: currentAvaliacao.faixa2_chave_habilidades,
        faixa2_chave_atitudes: currentAvaliacao.faixa2_chave_atitudes,
        faixa2_chave_valores: currentAvaliacao.faixa2_chave_valores,
        faixa3_nps_projeto: currentAvaliacao.faixa3_nps_projeto,
        faixa3_backlog: currentAvaliacao.faixa3_backlog,
        faixa3_prioridades: currentAvaliacao.faixa3_prioridades,
        faixa3_sla: currentAvaliacao.faixa3_sla,
      });

      toast({
        title: 'Avaliação salva',
        description: 'As alterações foram salvas com sucesso.',
      });

      setIsFormOpen(false);
      setCurrentAvaliacao(null);
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAvaliacao = async () => {
    if (!currentAvaliacao?.id || !currentAvaliacao?.prestador_id) return;

    try {
      await deleteAvaliacao.mutateAsync({ 
        id: currentAvaliacao.id, 
        prestador_id: currentAvaliacao.prestador_id 
      });
      toast({
        title: 'Avaliação excluída',
        description: `Avaliação de ${currentAvaliacao.mes} foi excluída com sucesso.`,
      });
      setIsDeleteDialogOpen(false);
      setIsFormOpen(false);
      setCurrentAvaliacao(null);
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Ocorreu um erro ao excluir a avaliação.',
        variant: 'destructive',
      });
    }
  };

  const calcularElegibilidade = (avaliacao: Partial<AvaliacaoMensal>) => {
    const ausencias = avaliacao.faixa1_ausencias ?? 0;
    const pendencias = avaliacao.faixa1_pendencias ?? 0;
    
    // Ausências: 3+ dias = inelegível (100% redução)
    // Pendências: 1+ = inelegível (100% redução)
    const inelegivelPorAusencias = ausencias >= 3;
    const inelegivelPorPendencias = pendencias >= 1;
    
    return !inelegivelPorAusencias && !inelegivelPorPendencias;
  };

  const calcularReducaoElegibilidade = (avaliacao: Partial<AvaliacaoMensal>) => {
    const ausencias = avaliacao.faixa1_ausencias ?? 0;
    const pendencias = avaliacao.faixa1_pendencias ?? 0;
    
    // Ausências: 1 dia = -30%, 2 dias = -70%, 3+ dias = -100%
    let reducaoAusencias = 0;
    if (ausencias === 1) reducaoAusencias = 30;
    else if (ausencias === 2) reducaoAusencias = 70;
    else if (ausencias >= 3) reducaoAusencias = 100;
    
    // Pendências: 1+ = -100%
    const reducaoPendencias = pendencias >= 1 ? 100 : 0;
    
    return Math.min(100, reducaoAusencias + reducaoPendencias);
  };

  const calcularScoreFaixa2 = (avaliacao: Partial<AvaliacaoMensal>) => {
    const chaveTotal =
      Number(avaliacao.faixa2_chave_comportamento ?? 0) +
      Number(avaliacao.faixa2_chave_habilidades ?? 0) +
      Number(avaliacao.faixa2_chave_atitudes ?? 0) +
      Number(avaliacao.faixa2_chave_valores ?? 0);
    const chavePercentual = (chaveTotal / 4) * 100;
    return (Number(avaliacao.faixa2_produtividade ?? 0) * 0.3 + Number(avaliacao.faixa2_qualidade ?? 0) * 0.3 + chavePercentual * 0.4).toFixed(1);
  };

  const calcularScoreFaixa3 = (avaliacao: Partial<AvaliacaoMensal>) => {
    return (
      (Number(avaliacao.faixa3_nps_projeto ?? 0) * 0.4 +
        Number(avaliacao.faixa3_backlog ?? 0) * 0.3 +
        Number(avaliacao.faixa3_prioridades ?? 0) * 0.3)
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
                              {calcularElegibilidade(avaliacao) 
                                ? `Elegível${calcularReducaoElegibilidade(avaliacao) > 0 ? ` (-${calcularReducaoElegibilidade(avaliacao)}%)` : ''}`
                                : 'Inelegível'}
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

      {/* Dialog Formulário de Avaliação */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) {
          setIsFormOpen(false);
          setCurrentAvaliacao(null);
          setIsEditing(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliação - {currentAvaliacao?.mes}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Edite os dados da avaliação do prestador.' : 'Visualize os dados da avaliação do prestador.'}
            </DialogDescription>
          </DialogHeader>

          {currentAvaliacao && (
            <div className="space-y-6 py-4">
              {/* Faixa 1 - Elegibilidade */}
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
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> 
                        Elegível{calcularReducaoElegibilidade(currentAvaliacao) > 0 ? ` (-${calcularReducaoElegibilidade(currentAvaliacao)}%)` : ''}
                      </>
                    ) : (
                      <><AlertCircle className="w-3 h-3 mr-1" /> Inelegível</>
                    )}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-4">
                  <div>
                    <Label className="input-label mb-2 flex items-center">
                      Ausências sem acordo prévio
                      <InfoTooltip content={TOOLTIPS.ausencias} />
                    </Label>
                    <RadioGroup
                      value={String(currentAvaliacao.faixa1_ausencias ?? 0)}
                      onValueChange={(val) => updateField('faixa1_ausencias', parseInt(val))}
                      disabled={!isEditing}
                      className="flex flex-wrap gap-3"
                    >
                      {[0, 1, 2, 3].map((num) => (
                        <div key={num} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(num)} id={`ausencias-${num}`} disabled={!isEditing} />
                          <Label htmlFor={`ausencias-${num}`} className="text-sm cursor-pointer">
                            {num === 3 ? '3 ou mais' : num}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="input-label mb-2 flex items-center">
                      Pendências administrativas/fiscais
                      <InfoTooltip content={TOOLTIPS.pendencias} />
                    </Label>
                    <RadioGroup
                      value={String(currentAvaliacao.faixa1_pendencias ?? 0)}
                      onValueChange={(val) => updateField('faixa1_pendencias', parseInt(val))}
                      disabled={!isEditing}
                      className="flex flex-wrap gap-3"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <div key={num} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(num)} id={`pendencias-${num}`} disabled={!isEditing} />
                          <Label htmlFor={`pendencias-${num}`} className="text-sm cursor-pointer">
                            {num === 10 ? '10 ou mais' : num}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="input-label mb-2 flex items-center">
                      Quantidade de Notificação ao Prestador
                      <InfoTooltip content={TOOLTIPS.notificacoes} />
                    </Label>
                    <RadioGroup
                      value={String((currentAvaliacao as any).faixa1_notificacoes ?? 0)}
                      onValueChange={(val) => updateField('faixa1_notificacoes' as any, parseInt(val))}
                      disabled={!isEditing}
                      className="flex flex-wrap gap-3"
                    >
                      {[0, 1].map((num) => (
                        <div key={num} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(num)} id={`notificacoes-${num}`} disabled={!isEditing} />
                          <Label htmlFor={`notificacoes-${num}`} className="text-sm cursor-pointer">
                            {num === 1 ? '1 ou mais' : '0'}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Faixa 2 - Produtividade Individual */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">2</span>
                  <div>
                    <h3 className="faixa-title">Produtividade Individual (Peso 40%)</h3>
                    <p className="text-sm text-muted-foreground">Desempenho individual do prestador</p>
                  </div>
                  <p className="ml-auto text-xl font-bold text-primary">{calcularScoreFaixa2(currentAvaliacao)}%</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <Label className="input-label flex items-center mb-2">Prestador atingiu produtividade mínima exigida? (Peso 30%)<InfoTooltip content={TOOLTIPS.produtividade} /></Label>
                    <RadioGroup
                      value={Number(currentAvaliacao.faixa2_produtividade ?? 0) >= 50 ? 'sim' : 'nao'}
                      onValueChange={(val) => updateField('faixa2_produtividade', val === 'sim' ? 100 : 0)}
                      disabled={!isEditing}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="produtividade-sim" disabled={!isEditing} />
                        <Label htmlFor="produtividade-sim" className="text-sm cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="produtividade-nao" disabled={!isEditing} />
                        <Label htmlFor="produtividade-nao" className="text-sm cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="input-label flex items-center mb-2">Prestador atingiu qualidade mínima exigida? (Peso 30%)<InfoTooltip content={TOOLTIPS.qualidade} /></Label>
                    <RadioGroup
                      value={Number(currentAvaliacao.faixa2_qualidade ?? 0) >= 50 ? 'sim' : 'nao'}
                      onValueChange={(val) => updateField('faixa2_qualidade', val === 'sim' ? 100 : 0)}
                      disabled={!isEditing}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="qualidade-sim" disabled={!isEditing} />
                        <Label htmlFor="qualidade-sim" className="text-sm cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="qualidade-nao" disabled={!isEditing} />
                        <Label htmlFor="qualidade-nao" className="text-sm cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="input-label mb-2 flex items-center">CHAVE GHAS (Peso 40%)<InfoTooltip content={TOOLTIPS.chave} /></Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Comportamento</Label>
                      <RadioGroup
                        value={Number(currentAvaliacao.faixa2_chave_comportamento ?? 0) >= 0.5 ? 'sim' : 'nao'}
                        onValueChange={(val) => updateField('faixa2_chave_comportamento', val === 'sim' ? 1 : 0)}
                        disabled={!isEditing}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="comportamento-sim" disabled={!isEditing} />
                          <Label htmlFor="comportamento-sim" className="text-sm cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="comportamento-nao" disabled={!isEditing} />
                          <Label htmlFor="comportamento-nao" className="text-sm cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Habilidades</Label>
                      <RadioGroup
                        value={Number(currentAvaliacao.faixa2_chave_habilidades ?? 0) >= 0.5 ? 'sim' : 'nao'}
                        onValueChange={(val) => updateField('faixa2_chave_habilidades', val === 'sim' ? 1 : 0)}
                        disabled={!isEditing}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="habilidades-sim" disabled={!isEditing} />
                          <Label htmlFor="habilidades-sim" className="text-sm cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="habilidades-nao" disabled={!isEditing} />
                          <Label htmlFor="habilidades-nao" className="text-sm cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Atitudes</Label>
                      <RadioGroup
                        value={Number(currentAvaliacao.faixa2_chave_atitudes ?? 0) >= 0.5 ? 'sim' : 'nao'}
                        onValueChange={(val) => updateField('faixa2_chave_atitudes', val === 'sim' ? 1 : 0)}
                        disabled={!isEditing}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="atitudes-sim" disabled={!isEditing} />
                          <Label htmlFor="atitudes-sim" className="text-sm cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="atitudes-nao" disabled={!isEditing} />
                          <Label htmlFor="atitudes-nao" className="text-sm cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Valores</Label>
                      <RadioGroup
                        value={Number(currentAvaliacao.faixa2_chave_valores ?? 0) >= 0.5 ? 'sim' : 'nao'}
                        onValueChange={(val) => updateField('faixa2_chave_valores', val === 'sim' ? 1 : 0)}
                        disabled={!isEditing}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="valores-sim" disabled={!isEditing} />
                          <Label htmlFor="valores-sim" className="text-sm cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="valores-nao" disabled={!isEditing} />
                          <Label htmlFor="valores-nao" className="text-sm cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faixa 3 - Resultado com Cliente e Time */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">3</span>
                  <div>
                    <h3 className="faixa-title">Resultado com Cliente e Time (Peso 30%)</h3>
                    <p className="text-sm text-muted-foreground">Desempenho com cliente e equipe</p>
                  </div>
                  <p className="ml-auto text-xl font-bold text-primary">{calcularScoreFaixa3(currentAvaliacao)}%</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <Label className="input-label flex items-center mb-2">O Score mensal do NPS do cliente ficou igual ou superior a 75? (Peso 40%)<InfoTooltip content={TOOLTIPS.nps_projeto} /></Label>
                    <RadioGroup
                      value={Number(currentAvaliacao.faixa3_nps_projeto ?? 0) >= 50 ? 'sim' : 'nao'}
                      onValueChange={(val) => updateField('faixa3_nps_projeto', val === 'sim' ? 100 : 0)}
                      disabled={!isEditing}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="nps-projeto-sim" disabled={!isEditing} />
                        <Label htmlFor="nps-projeto-sim" className="text-sm cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="nps-projeto-nao" disabled={!isEditing} />
                        <Label htmlFor="nps-projeto-nao" className="text-sm cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="input-label flex items-center mb-2">Prestador Líder garantiu backlog menor que 15% em relação aos chamados abertos no encerramento do mês e que não tenha chamados abertos a mais de 90 dias, que não estão na Lista de Prioridade? (Peso 30%)<InfoTooltip content={TOOLTIPS.backlog} /></Label>
                    <RadioGroup
                      value={Number(currentAvaliacao.faixa3_backlog ?? 0) >= 50 ? 'sim' : 'nao'}
                      onValueChange={(val) => updateField('faixa3_backlog', val === 'sim' ? 100 : 0)}
                      disabled={!isEditing}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="backlog-sim" disabled={!isEditing} />
                        <Label htmlFor="backlog-sim" className="text-sm cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="backlog-nao" disabled={!isEditing} />
                        <Label htmlFor="backlog-nao" className="text-sm cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <Label className="input-label flex items-center mb-2">Prestador Líder garantiu 95% ou mais das atividades da Lista de Prioridade em dia? (Peso 30%)<InfoTooltip content={TOOLTIPS.prioridades} /></Label>
                    <RadioGroup
                      value={Number(currentAvaliacao.faixa3_prioridades ?? 0) >= 50 ? 'sim' : 'nao'}
                      onValueChange={(val) => updateField('faixa3_prioridades', val === 'sim' ? 100 : 0)}
                      disabled={!isEditing}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="prioridades-sim" disabled={!isEditing} />
                        <Label htmlFor="prioridades-sim" className="text-sm cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="prioridades-nao" disabled={!isEditing} />
                        <Label htmlFor="prioridades-nao" className="text-sm cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="input-label flex items-center mb-2">Acima de 90% dos chamados abertos no mês foram realizados o primeiro atendimento em até 1 hora? (Peso 0%)<InfoTooltip content={TOOLTIPS.sla} /></Label>
                    <RadioGroup
                      value={Number(currentAvaliacao.faixa3_sla ?? 0) >= 50 ? 'sim' : 'nao'}
                      onValueChange={(val) => updateField('faixa3_sla', val === 'sim' ? 100 : 0)}
                      disabled={!isEditing}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="sla-sim" disabled={!isEditing} />
                        <Label htmlFor="sla-sim" className="text-sm cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="sla-nao" disabled={!isEditing} />
                        <Label htmlFor="sla-nao" className="text-sm cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Faixa 4 - Resultado Empresa (somente leitura) */}
              {(() => {
                const registroGlobal = getRegistroGlobal(currentAvaliacao.mes || '');
                return (
                  <div className="faixa-card">
                    <div className="faixa-header">
                      <span className="faixa-number">4</span>
                      <div>
                        <h3 className="faixa-title">Resultado Empresa (Peso 30%)</h3>
                        <p className="text-sm text-muted-foreground">Indicadores globais da empresa</p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="ml-auto flex items-center gap-2 text-muted-foreground">
                              <Lock className="w-4 h-4" />
                              <span className="text-xs">Somente leitura</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Dados importados do Registro Global</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {registroGlobal ? (
                      <div className="grid grid-cols-3 gap-6 mt-4">
                        <div>
                          <Label className="input-label flex items-center gap-2">
                            NPS Global GHAS (Peso 40%)
                            <InfoTooltip content={TOOLTIPS.nps_global} />
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </Label>
                          <Input
                            type="number"
                            value={registroGlobal.faixa4_nps_global}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div>
                          <Label className="input-label flex items-center gap-2">
                            Churn (Peso 30%)
                            <InfoTooltip content={TOOLTIPS.churn} />
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </Label>
                          <Input
                            type="number"
                            value={registroGlobal.faixa4_churn}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div>
                          <Label className="input-label flex items-center gap-2">
                            Uso da AVA (Peso 30%)
                            <InfoTooltip content={TOOLTIPS.uso_ava} />
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </Label>
                          <Input
                            type="number"
                            value={registroGlobal.faixa4_uso_ava}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
                        <p className="text-sm text-warning flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Registro global não encontrado para {currentAvaliacao.mes}. Cadastre os dados na aba "Registro Global".
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            {isEditing && (
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              {isEditing && (
                <Button 
                  onClick={handleSalvarAvaliacao} 
                  disabled={updateAvaliacao.isPending}
                  className="gap-2"
                >
                  {updateAvaliacao.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar
                </Button>
              )}
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
              Tem certeza que deseja excluir a avaliação de <strong>{currentAvaliacao?.mes}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAvaliacao}
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
