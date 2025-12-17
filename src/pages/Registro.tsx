import { useState } from 'react';
import { Plus, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { mockPrestadores, mockAvaliacoes, usuarioLogado } from '@/data/mockData';
import { AvaliacaoMensal, MesAvaliacao, MESES_AVALIACAO } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Registro() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoMensal[]>(mockAvaliacoes);
  const [selectedPrestador, setSelectedPrestador] = useState<string>('');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAvaliacao, setCurrentAvaliacao] = useState<AvaliacaoMensal | null>(null);
  const [newMes, setNewMes] = useState<MesAvaliacao | ''>('');
  const { toast } = useToast();

  // Filtrar prestadores ativos sob responsabilidade do usuário logado
  const prestadoresDisponiveis = mockPrestadores.filter(
    (p) => p.situacao === 'ativo' && p.avaliador_id === usuarioLogado.id
  );

  const prestadorSelecionado = prestadoresDisponiveis.find((p) => p.id === selectedPrestador);

  // Avaliações do prestador selecionado
  const avaliacoesPrestador = avaliacoes.filter((a) => a.prestador_id === selectedPrestador);

  // Meses já avaliados
  const mesesAvaliados = avaliacoesPrestador.map((a) => a.mes);

  // Meses disponíveis para nova avaliação
  const mesesDisponiveis = MESES_AVALIACAO.filter((m) => !mesesAvaliados.includes(m));

  const handleCriarAvaliacao = () => {
    if (!selectedPrestador || !newMes) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o prestador e o mês.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar duplicidade
    const existe = avaliacoes.some(
      (a) => a.prestador_id === selectedPrestador && a.mes === newMes
    );

    if (existe) {
      toast({
        title: 'Avaliação já existe',
        description: `Já existe uma avaliação para ${newMes}.`,
        variant: 'destructive',
      });
      return;
    }

    const novaAvaliacao: AvaliacaoMensal = {
      id: (avaliacoes.length + 1).toString(),
      prestador_id: selectedPrestador,
      avaliador_id: usuarioLogado.id,
      mes: newMes as MesAvaliacao,
      faixa1_ausencias: 0,
      faixa1_pendencias: 0,
      faixa2_produtividade: 0,
      faixa2_qualidade: 0,
      faixa2_chave_comportamento: 0,
      faixa2_chave_habilidades: 0,
      faixa2_chave_atitudes: 0,
      faixa2_chave_valores: 0,
      faixa3_nps_projeto: 0,
      faixa3_sla: 0,
      faixa3_backlog: 0,
      faixa3_prioridades: 0,
      faixa4_nps_global: 0,
      faixa4_churn: 0,
      faixa4_uso_ava: 0,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    setAvaliacoes((prev) => [...prev, novaAvaliacao]);
    setCurrentAvaliacao(novaAvaliacao);
    setIsNewDialogOpen(false);
    setIsFormOpen(true);
    setNewMes('');

    toast({
      title: 'Avaliação criada',
      description: `Avaliação de ${newMes} iniciada.`,
    });
  };

  const handleEditarAvaliacao = (avaliacao: AvaliacaoMensal) => {
    setCurrentAvaliacao({ ...avaliacao });
    setIsFormOpen(true);
  };

  const handleSalvarAvaliacao = () => {
    if (!currentAvaliacao) return;

    setAvaliacoes((prev) =>
      prev.map((a) =>
        a.id === currentAvaliacao.id
          ? { ...currentAvaliacao, atualizado_em: new Date().toISOString() }
          : a
      )
    );

    toast({
      title: 'Avaliação salva',
      description: 'As alterações foram salvas com sucesso.',
    });

    setIsFormOpen(false);
    setCurrentAvaliacao(null);
  };

  const calcularElegibilidade = (avaliacao: AvaliacaoMensal) => {
    return avaliacao.faixa1_ausencias === 0 && avaliacao.faixa1_pendencias === 0;
  };

  const calcularScoreFaixa2 = (avaliacao: AvaliacaoMensal) => {
    const chaveTotal =
      avaliacao.faixa2_chave_comportamento +
      avaliacao.faixa2_chave_habilidades +
      avaliacao.faixa2_chave_atitudes +
      avaliacao.faixa2_chave_valores;
    const chavePercentual = (chaveTotal / 4) * 100;
    return (avaliacao.faixa2_produtividade * 0.3 + avaliacao.faixa2_qualidade * 0.3 + chavePercentual * 0.4).toFixed(1);
  };

  const calcularScoreFaixa3 = (avaliacao: AvaliacaoMensal) => {
    return (
      (avaliacao.faixa3_nps_projeto * 0.4 +
        (100 - avaliacao.faixa3_backlog) * 0.3 +
        avaliacao.faixa3_prioridades * 0.3) /
      1
    ).toFixed(1);
  };

  const updateField = (field: keyof AvaliacaoMensal, value: number) => {
    if (!currentAvaliacao) return;
    setCurrentAvaliacao({ ...currentAvaliacao, [field]: value });
  };

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

          {/* Lista de Avaliações */}
          {selectedPrestador && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Avaliações de {prestadorSelecionado?.nome}
              </h2>

              {avaliacoesPrestador.length === 0 ? (
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
                  {avaliacoesPrestador.map((avaliacao) => (
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
            <Select value={newMes} onValueChange={(v) => setNewMes(v as MesAvaliacao)}>
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliação - {currentAvaliacao?.mes}</DialogTitle>
            <DialogDescription>
              Preencha as faixas de avaliação do prestador.
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

                <div className="grid grid-cols-2 gap-6">
                  <div className="input-group">
                    <Label className="input-label">Ausências sem acordo prévio</Label>
                    <RadioGroup
                      value={currentAvaliacao.faixa1_ausencias.toString()}
                      onValueChange={(v) => updateField('faixa1_ausencias', parseInt(v))}
                      className="flex flex-wrap gap-4 mt-2"
                    >
                      {[0, 1, 2, 3].map((val) => (
                        <div key={val} className="flex items-center space-x-2">
                          <RadioGroupItem value={val.toString()} id={`ausencias-${val}`} />
                          <Label htmlFor={`ausencias-${val}`} className="cursor-pointer">
                            {val === 3 ? '3 ou mais' : val}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Pendências administrativas/fiscais</Label>
                    <RadioGroup
                      value={currentAvaliacao.faixa1_pendencias.toString()}
                      onValueChange={(v) => updateField('faixa1_pendencias', parseInt(v))}
                      className="flex flex-wrap gap-3 mt-2"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                        <div key={val} className="flex items-center space-x-2">
                          <RadioGroupItem value={val.toString()} id={`pendencias-${val}`} />
                          <Label htmlFor={`pendencias-${val}`} className="cursor-pointer">
                            {val === 10 ? '10 ou mais' : val}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Faixa 2 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">2</span>
                  <div>
                    <h3 className="faixa-title">Produtividade Individual (Peso 40%)</h3>
                    <p className="text-sm text-muted-foreground">
                      Avaliação de desempenho e competências
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-xl font-bold text-primary">
                      {calcularScoreFaixa2(currentAvaliacao)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="input-group">
                    <Label className="input-label">Produtividade (Peso 30%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa2_produtividade]}
                        onValueChange={([v]) => updateField('faixa2_produtividade', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa2_produtividade}%
                      </span>
                    </div>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Qualidade de Registros (Peso 30%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa2_qualidade]}
                        onValueChange={([v]) => updateField('faixa2_qualidade', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa2_qualidade}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-4">CHAVE GHAS (Peso 40%)</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="input-group">
                      <Label className="input-label">Comportamento</Label>
                      <RadioGroup
                        value={currentAvaliacao.faixa2_chave_comportamento.toString()}
                        onValueChange={(v) => updateField('faixa2_chave_comportamento', parseInt(v))}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id="comportamento-sim" />
                          <Label htmlFor="comportamento-sim" className="cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="0" id="comportamento-nao" />
                          <Label htmlFor="comportamento-nao" className="cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="input-group">
                      <Label className="input-label">Habilidades</Label>
                      <RadioGroup
                        value={currentAvaliacao.faixa2_chave_habilidades.toString()}
                        onValueChange={(v) => updateField('faixa2_chave_habilidades', parseInt(v))}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id="habilidades-sim" />
                          <Label htmlFor="habilidades-sim" className="cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="0" id="habilidades-nao" />
                          <Label htmlFor="habilidades-nao" className="cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="input-group">
                      <Label className="input-label">Atitudes</Label>
                      <RadioGroup
                        value={currentAvaliacao.faixa2_chave_atitudes.toString()}
                        onValueChange={(v) => updateField('faixa2_chave_atitudes', parseInt(v))}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id="atitudes-sim" />
                          <Label htmlFor="atitudes-sim" className="cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="0" id="atitudes-nao" />
                          <Label htmlFor="atitudes-nao" className="cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="input-group">
                      <Label className="input-label">Valores</Label>
                      <RadioGroup
                        value={currentAvaliacao.faixa2_chave_valores.toString()}
                        onValueChange={(v) => updateField('faixa2_chave_valores', parseInt(v))}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id="valores-sim" />
                          <Label htmlFor="valores-sim" className="cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="0" id="valores-nao" />
                          <Label htmlFor="valores-nao" className="cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faixa 3 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">3</span>
                  <div>
                    <h3 className="faixa-title">Resultado com Cliente e Time (Peso 30%)</h3>
                    <p className="text-sm text-muted-foreground">
                      Métricas de satisfação e entrega
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-xl font-bold text-primary">
                      {calcularScoreFaixa3(currentAvaliacao)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="input-group">
                    <Label className="input-label">NPS do Projeto (Peso 40%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa3_nps_projeto]}
                        onValueChange={([v]) => updateField('faixa3_nps_projeto', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa3_nps_projeto}
                      </span>
                    </div>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">% de SLA Primeiro Atendimento (Peso 0%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa3_sla]}
                        onValueChange={([v]) => updateField('faixa3_sla', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa3_sla}%
                      </span>
                    </div>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Backlog (Peso 30%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa3_backlog]}
                        onValueChange={([v]) => updateField('faixa3_backlog', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa3_backlog}%
                      </span>
                    </div>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Prioridades em Dia (Peso 30%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa3_prioridades]}
                        onValueChange={([v]) => updateField('faixa3_prioridades', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa3_prioridades}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faixa 4 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">4</span>
                  <div>
                    <h3 className="faixa-title">Resultado Empresa (Peso 30%)</h3>
                    <p className="text-sm text-muted-foreground">
                      Indicadores globais (multiplicador)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="input-group">
                    <Label className="input-label">NPS Global GHAS (Peso 40%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa4_nps_global]}
                        onValueChange={([v]) => updateField('faixa4_nps_global', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa4_nps_global}
                      </span>
                    </div>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Churn (Peso 30%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa4_churn]}
                        onValueChange={([v]) => updateField('faixa4_churn', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa4_churn}%
                      </span>
                    </div>
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Uso da AVA (Peso 30%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentAvaliacao.faixa4_uso_ava]}
                        onValueChange={([v]) => updateField('faixa4_uso_ava', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentAvaliacao.faixa4_uso_ava}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarAvaliacao}>Salvar Avaliação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
