import { useState } from 'react';
import { Plus, ClipboardList, AlertCircle, CheckCircle2, Info, Lock, Calendar, Loader2, Save, Trash2 } from 'lucide-react';
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
    return (avaliacao.faixa1_ausencias ?? 0) === 0 && (avaliacao.faixa1_pendencias ?? 0) === 0;
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
        (100 - Number(avaliacao.faixa3_backlog ?? 0)) * 0.3 +
        Number(avaliacao.faixa3_prioridades ?? 0) * 0.3) /
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
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Elegível</>
                    ) : (
                      <><AlertCircle className="w-3 h-3 mr-1" /> Inelegível</>
                    )}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <Label className="input-label">Ausências</Label>
                    <Input
                      type="number"
                      min={0}
                      value={currentAvaliacao.faixa1_ausencias ?? 0}
                      onChange={(e) => updateField('faixa1_ausencias', parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label className="input-label">Pendências</Label>
                    <Input
                      type="number"
                      min={0}
                      value={currentAvaliacao.faixa1_pendencias ?? 0}
                      onChange={(e) => updateField('faixa1_pendencias', parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Faixa 2 - Produtividade Individual */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">2</span>
                  <div>
                    <h3 className="faixa-title">Produtividade Individual</h3>
                    <p className="text-sm text-muted-foreground">Peso: 40%</p>
                  </div>
                  <p className="ml-auto text-xl font-bold text-primary">{calcularScoreFaixa2(currentAvaliacao)}%</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <Label className="input-label">Produtividade (%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[Number(currentAvaliacao.faixa2_produtividade ?? 0)]}
                        onValueChange={([val]) => updateField('faixa2_produtividade', val)}
                        max={100}
                        step={1}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">{currentAvaliacao.faixa2_produtividade ?? 0}%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="input-label">Qualidade (%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[Number(currentAvaliacao.faixa2_qualidade ?? 0)]}
                        onValueChange={([val]) => updateField('faixa2_qualidade', val)}
                        max={100}
                        step={1}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">{currentAvaliacao.faixa2_qualidade ?? 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="input-label mb-2 block">Competências-Chave (0 a 1)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Comportamento</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Number(currentAvaliacao.faixa2_chave_comportamento ?? 0)]}
                          onValueChange={([val]) => updateField('faixa2_chave_comportamento', val)}
                          max={1}
                          step={0.1}
                          disabled={!isEditing}
                          className="flex-1"
                        />
                        <span className="w-8 text-right text-sm">{Number(currentAvaliacao.faixa2_chave_comportamento ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Habilidades</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Number(currentAvaliacao.faixa2_chave_habilidades ?? 0)]}
                          onValueChange={([val]) => updateField('faixa2_chave_habilidades', val)}
                          max={1}
                          step={0.1}
                          disabled={!isEditing}
                          className="flex-1"
                        />
                        <span className="w-8 text-right text-sm">{Number(currentAvaliacao.faixa2_chave_habilidades ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Atitudes</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Number(currentAvaliacao.faixa2_chave_atitudes ?? 0)]}
                          onValueChange={([val]) => updateField('faixa2_chave_atitudes', val)}
                          max={1}
                          step={0.1}
                          disabled={!isEditing}
                          className="flex-1"
                        />
                        <span className="w-8 text-right text-sm">{Number(currentAvaliacao.faixa2_chave_atitudes ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Valores</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[Number(currentAvaliacao.faixa2_chave_valores ?? 0)]}
                          onValueChange={([val]) => updateField('faixa2_chave_valores', val)}
                          max={1}
                          step={0.1}
                          disabled={!isEditing}
                          className="flex-1"
                        />
                        <span className="w-8 text-right text-sm">{Number(currentAvaliacao.faixa2_chave_valores ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faixa 3 - Resultado com Cliente e Time */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">3</span>
                  <div>
                    <h3 className="faixa-title">Resultado com Cliente e Time</h3>
                    <p className="text-sm text-muted-foreground">Peso: 30%</p>
                  </div>
                  <p className="ml-auto text-xl font-bold text-primary">{calcularScoreFaixa3(currentAvaliacao)}%</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                  <div>
                    <Label className="input-label">NPS Projeto</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[Number(currentAvaliacao.faixa3_nps_projeto ?? 0)]}
                        onValueChange={([val]) => updateField('faixa3_nps_projeto', val)}
                        max={100}
                        step={1}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      <span className="w-10 text-right text-sm">{currentAvaliacao.faixa3_nps_projeto ?? 0}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="input-label">Backlog</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[Number(currentAvaliacao.faixa3_backlog ?? 0)]}
                        onValueChange={([val]) => updateField('faixa3_backlog', val)}
                        max={100}
                        step={1}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      <span className="w-10 text-right text-sm">{currentAvaliacao.faixa3_backlog ?? 0}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="input-label">Prioridades (%)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[Number(currentAvaliacao.faixa3_prioridades ?? 0)]}
                        onValueChange={([val]) => updateField('faixa3_prioridades', val)}
                        max={100}
                        step={1}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      <span className="w-10 text-right text-sm">{currentAvaliacao.faixa3_prioridades ?? 0}%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="input-label">SLA (%)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[Number(currentAvaliacao.faixa3_sla ?? 0)]}
                        onValueChange={([val]) => updateField('faixa3_sla', val)}
                        max={100}
                        step={1}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      <span className="w-10 text-right text-sm">{currentAvaliacao.faixa3_sla ?? 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faixa 4 - Resultado Global (somente leitura) */}
              {(() => {
                const registroGlobal = getRegistroGlobal(currentAvaliacao.mes || '');
                return (
                  <div className="faixa-card">
                    <div className="faixa-header">
                      <span className="faixa-number">4</span>
                      <div>
                        <h3 className="faixa-title">Resultado Global</h3>
                        <p className="text-sm text-muted-foreground">Peso: 30%</p>
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
                            Uso AVA (%)
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </Label>
                          <Input
                            type="number"
                            value={registroGlobal.faixa4_uso_ava}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div>
                          <Label className="input-label flex items-center gap-2">
                            Churn (%)
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
                            NPS Global
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </Label>
                          <Input
                            type="number"
                            value={registroGlobal.faixa4_nps_global}
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
