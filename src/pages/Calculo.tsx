import { useState, useMemo } from 'react';
import { Calculator, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePrestadores } from '@/hooks/usePrestadores';
import { useAvaliacoes, useRegistrosGlobais } from '@/hooks/useAvaliacoes';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';
import { Tables } from '@/integrations/supabase/types';
import { Progress } from '@/components/ui/progress';

type Prestador = Tables<'prestadores'>;
type AvaliacaoMensal = Tables<'avaliacoes_mensais'>;
type MesAvaliacao = string;

type Periodo = 'mensal' | 'semestral_1' | 'semestral_2';
type StatusCalculo = 'em_aberto' | 'simulado' | 'fechado';

interface ResultadoCalculo {
  elegivel: boolean;
  elegibilidade_percentual: number;
  score_faixa2: number;
  score_faixa3: number;
  multiplicador_faixa4: number;
  premio_percentual: number;
  premio_valor: number;
  salario_base: number;
  status: StatusCalculo;
  detalhes: {
    faixa1: {
      ausencias: number;
      pendencias: number;
      reducao_ausencias: number;
      reducao_pendencias: number;
    };
    faixa2: {
      produtividade: number;
      qualidade: number;
      chave_media: number;
    };
    faixa3: {
      nps_projeto: number;
      backlog: number;
      prioridades: number;
      atingiu_minimo: boolean;
    };
    faixa4: {
      nps_global: number;
      churn: number;
      uso_ava: number;
    };
  };
}

const SEMESTRE_1_MESES: string[] = [
  'Janeiro/2026', 'Fevereiro/2026', 'Março/2026', 'Abril/2026', 'Maio/2026', 'Junho/2026'
];

const SEMESTRE_2_MESES: string[] = [
  'Julho/2026', 'Agosto/2026', 'Setembro/2026', 'Outubro/2026', 'Novembro/2026', 'Dezembro/2026'
];

export default function Calculo() {
  const [selectedPrestador, setSelectedPrestador] = useState<string>('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo>('mensal');
  const [selectedMes, setSelectedMes] = useState<MesAvaliacao | ''>('');

  const { prestador: prestadorLogado, isAdmin, isAvaliador, loading: loadingUser } = usePrestadorLogado();
  const { data: prestadores = [], isLoading: loadingPrestadores } = usePrestadores();
  const { data: avaliacoes = [], isLoading: loadingAvaliacoes } = useAvaliacoes(selectedPrestador || undefined);
  const { data: registrosGlobais = [] } = useRegistrosGlobais();

  // Filtrar prestadores com base no papel do usuário
  const prestadoresFiltrados = useMemo(() => {
    const ativos = prestadores.filter((p) => p.situacao === 'ativo');
    
    if (isAdmin) {
      return ativos;
    }
    
    if (isAvaliador && prestadorLogado) {
      // Avaliador vê apenas seus avaliados
      return ativos.filter((p) => p.avaliador_id === prestadorLogado.id);
    }
    
    if (prestadorLogado) {
      // Prestador comum vê apenas ele mesmo
      return ativos.filter((p) => p.id === prestadorLogado.id);
    }
    
    return [];
  }, [prestadores, isAdmin, isAvaliador, prestadorLogado]);

  const prestadorSelecionado = prestadoresFiltrados.find((p) => p.id === selectedPrestador);

  // Avaliações do prestador selecionado
  const avaliacoesPrestador = avaliacoes;

  // Avaliações filtradas pelo período
  const avaliacoesFiltradas = useMemo(() => {
    if (selectedPeriodo === 'mensal' && selectedMes) {
      return avaliacoesPrestador.filter((a) => a.mes === selectedMes);
    } else if (selectedPeriodo === 'semestral_1') {
      return avaliacoesPrestador.filter((a) => SEMESTRE_1_MESES.includes(a.mes));
    } else if (selectedPeriodo === 'semestral_2') {
      return avaliacoesPrestador.filter((a) => SEMESTRE_2_MESES.includes(a.mes));
    }
    return [];
  }, [avaliacoesPrestador, selectedPeriodo, selectedMes]);

  // Calcular resultado
  const resultado = useMemo((): ResultadoCalculo | null => {
    if (avaliacoesFiltradas.length === 0 || !prestadorSelecionado) return null;

    // Agregar dados (média para semestral)
    const totalAusencias = avaliacoesFiltradas.reduce((sum, a) => sum + a.faixa1_ausencias, 0);
    const totalPendencias = avaliacoesFiltradas.reduce((sum, a) => sum + a.faixa1_pendencias, 0);

    const avgProdutividade = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_produtividade), 0) / avaliacoesFiltradas.length;
    const avgQualidade = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_qualidade), 0) / avaliacoesFiltradas.length;
    const avgChaveComportamento = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_chave_comportamento), 0) / avaliacoesFiltradas.length;
    const avgChaveHabilidades = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_chave_habilidades), 0) / avaliacoesFiltradas.length;
    const avgChaveAtitudes = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_chave_atitudes), 0) / avaliacoesFiltradas.length;
    const avgChaveValores = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_chave_valores), 0) / avaliacoesFiltradas.length;

    const avgNpsProjeto = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa3_nps_projeto), 0) / avaliacoesFiltradas.length;
    const avgBacklog = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa3_backlog), 0) / avaliacoesFiltradas.length;
    const avgPrioridades = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa3_prioridades), 0) / avaliacoesFiltradas.length;

    // Usar dados da tabela registros_globais para Faixa 4
    const mesesDoFiltro = avaliacoesFiltradas.map(a => a.mes);
    const registrosGlobaisFiltrados = registrosGlobais.filter(r => mesesDoFiltro.includes(r.mes));
    
    let avgNpsGlobal = 0;
    let avgChurn = 0;
    let avgUsoAva = 0;
    
    if (registrosGlobaisFiltrados.length > 0) {
      avgNpsGlobal = registrosGlobaisFiltrados.reduce((sum, r) => sum + Number(r.faixa4_nps_global), 0) / registrosGlobaisFiltrados.length;
      avgChurn = registrosGlobaisFiltrados.reduce((sum, r) => sum + Number(r.faixa4_churn), 0) / registrosGlobaisFiltrados.length;
      avgUsoAva = registrosGlobaisFiltrados.reduce((sum, r) => sum + Number(r.faixa4_uso_ava), 0) / registrosGlobaisFiltrados.length;
    }

    // FAIXA 1 - Elegibilidade
    let reducaoAusencias = 0;
    if (totalAusencias === 1) reducaoAusencias = 30;
    else if (totalAusencias === 2) reducaoAusencias = 70;
    else if (totalAusencias >= 3) reducaoAusencias = 100;

    const reducaoPendencias = totalPendencias * 10;
    const elegibilidade_percentual = Math.max(0, 100 - reducaoAusencias - reducaoPendencias);
    const elegivel = elegibilidade_percentual > 0;

    // FAIXA 2 - Produtividade Individual (40% do total)
    const chave_media = (avgChaveComportamento + avgChaveHabilidades + avgChaveAtitudes + avgChaveValores) / 4;
    const score_faixa2_raw = (avgProdutividade * 0.30) + (avgQualidade * 0.30) + (chave_media * 0.40);
    const score_faixa2 = score_faixa2_raw * 0.40;

    // FAIXA 3 - Resultado com Cliente e Time (30% do total)
    const nps_score = avgNpsProjeto >= 75 ? avgNpsProjeto : avgNpsProjeto * 0.5;
    const backlog_score = avgBacklog <= 15 ? 100 : Math.max(0, 100 - (avgBacklog - 15) * 2);
    const prioridades_score = avgPrioridades >= 95 ? 100 : avgPrioridades;
    
    const score_faixa3_raw = (nps_score * 0.40) + (backlog_score * 0.30) + (prioridades_score * 0.30);
    const atingiu_minimo_faixa3 = score_faixa3_raw >= 85;
    const score_faixa3 = (atingiu_minimo_faixa3 ? score_faixa3_raw : score_faixa3_raw * 0.7) * 0.30;

    // FAIXA 4 - Multiplicador
    let multiplicador_faixa4 = 1.0;
    const atingiu_nps = avgNpsGlobal >= 75;
    const atingiu_churn = avgChurn <= 10;
    const atingiu_ava = avgUsoAva >= 50;

    const criterios_atingidos = [atingiu_nps, atingiu_churn, atingiu_ava].filter(Boolean).length;
    if (criterios_atingidos === 3) {
      multiplicador_faixa4 = 1.3;
    } else if (criterios_atingidos >= 2) {
      multiplicador_faixa4 = 1.2;
    } else if (criterios_atingidos >= 1) {
      multiplicador_faixa4 = 1.1;
    }

    // Cálculo Final
    const soma_faixas = score_faixa2 + score_faixa3;
    const premio_percentual = elegivel ? (soma_faixas * (elegibilidade_percentual / 100) * multiplicador_faixa4) : 0;
    const premio_valor = (Number(prestadorSelecionado.salario_fixo) * premio_percentual) / 100;

    return {
      elegivel,
      elegibilidade_percentual,
      score_faixa2,
      score_faixa3,
      multiplicador_faixa4,
      premio_percentual,
      premio_valor,
      salario_base: Number(prestadorSelecionado.salario_fixo),
      status: 'em_aberto',
      detalhes: {
        faixa1: {
          ausencias: totalAusencias,
          pendencias: totalPendencias,
          reducao_ausencias: reducaoAusencias,
          reducao_pendencias: reducaoPendencias,
        },
        faixa2: {
          produtividade: avgProdutividade,
          qualidade: avgQualidade,
          chave_media,
        },
        faixa3: {
          nps_projeto: avgNpsProjeto,
          backlog: avgBacklog,
          prioridades: avgPrioridades,
          atingiu_minimo: atingiu_minimo_faixa3,
        },
        faixa4: {
          nps_global: avgNpsGlobal,
          churn: avgChurn,
          uso_ava: avgUsoAva,
        },
      },
    } as ResultadoCalculo;
  }, [avaliacoesFiltradas, prestadorSelecionado]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
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
              <h1 className="page-title">Cálculo Acelera GHAS 2026</h1>
              <p className="page-subtitle">
                Visualização e auditoria do cálculo oficial de premiação
              </p>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <FileText className="w-3 h-3" />
              Somente Leitura
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Filtros */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="input-label mb-2 block">Prestador</Label>
                <Select value={selectedPrestador} onValueChange={setSelectedPrestador}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um prestador..." />
                  </SelectTrigger>
                <SelectContent>
                    {prestadoresFiltrados.map((prestador) => (
                      <SelectItem key={prestador.id} value={prestador.id}>
                        {prestador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="input-label mb-2 block">Período</Label>
                <Select value={selectedPeriodo} onValueChange={(v) => setSelectedPeriodo(v as Periodo)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal (Visualização)</SelectItem>
                    <SelectItem value="semestral_1">1º Semestre (Jan-Jun)</SelectItem>
                    <SelectItem value="semestral_2">2º Semestre (Jul-Dez)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPeriodo === 'mensal' && (
                <div>
                  <Label className="input-label mb-2 block">Mês</Label>
                  <Select value={selectedMes} onValueChange={(v) => setSelectedMes(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês..." />
                    </SelectTrigger>
                    <SelectContent>
                      {avaliacoesPrestador.map((a) => (
                        <SelectItem key={a.mes} value={a.mes}>
                          {a.mes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Loading */}
          {loadingAvaliacoes && selectedPrestador && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Resultado */}
          {resultado ? (
            <div className="space-y-6">
              {/* Status Geral */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${resultado.elegivel ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      {resultado.elegivel ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        {prestadorSelecionado?.nome}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedPeriodo === 'mensal' ? selectedMes : selectedPeriodo === 'semestral_1' ? '1º Semestre 2026' : '2º Semestre 2026'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={resultado.elegivel ? 'success' : 'destructive'}>
                      {resultado.elegivel ? 'Elegível' : 'Inelegível'}
                    </Badge>
                    <Badge variant="outline">
                      Em Aberto
                    </Badge>
                  </div>
                </div>

                {/* Cards de Resultado */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Elegibilidade</p>
                    <p className="text-2xl font-bold text-foreground">{formatPercent(resultado.elegibilidade_percentual)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Score Faixa 2+3</p>
                    <p className="text-2xl font-bold text-primary">{formatPercent(resultado.score_faixa2 + resultado.score_faixa3)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Multiplicador</p>
                    <p className="text-2xl font-bold text-foreground">×{resultado.multiplicador_faixa4.toFixed(1)}</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Prêmio Final</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(resultado.premio_valor)}</p>
                  </div>
                </div>
              </div>

              {/* Faixa 1 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number bg-amber-100 text-amber-700">🥉</span>
                  <div>
                    <h3 className="faixa-title">Faixa 1 – Existir e Ser Confiável</h3>
                    <p className="text-sm text-muted-foreground">Elegibilidade (eliminatória)</p>
                  </div>
                  <Badge variant={resultado.elegivel ? 'success' : 'destructive'} className="ml-auto">
                    {formatPercent(resultado.elegibilidade_percentual)} Elegibilidade
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Ausências sem acordo</p>
                    <p className="text-xl font-semibold text-foreground">{resultado.detalhes.faixa1.ausencias} dias</p>
                    {resultado.detalhes.faixa1.reducao_ausencias > 0 && (
                      <p className="text-xs text-destructive">-{resultado.detalhes.faixa1.reducao_ausencias}%</p>
                    )}
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Pendências Admin/Fiscal</p>
                    <p className="text-xl font-semibold text-foreground">{resultado.detalhes.faixa1.pendencias}</p>
                    {resultado.detalhes.faixa1.reducao_pendencias > 0 && (
                      <p className="text-xs text-destructive">-{resultado.detalhes.faixa1.reducao_pendencias}%</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Faixa 2 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number bg-slate-100 text-slate-700">🥈</span>
                  <div>
                    <h3 className="faixa-title">Faixa 2 – Produtividade Individual</h3>
                    <p className="text-sm text-muted-foreground">Peso: 40% do total</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-xl font-bold text-primary">{formatPercent(resultado.score_faixa2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Produtividade (30%)</p>
                      <p className="text-sm font-medium">{formatPercent(resultado.detalhes.faixa2.produtividade)}</p>
                    </div>
                    <Progress value={resultado.detalhes.faixa2.produtividade} className="h-2" />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Qualidade (30%)</p>
                      <p className="text-sm font-medium">{formatPercent(resultado.detalhes.faixa2.qualidade)}</p>
                    </div>
                    <Progress value={resultado.detalhes.faixa2.qualidade} className="h-2" />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Chave (40%)</p>
                      <p className="text-sm font-medium">{formatPercent(resultado.detalhes.faixa2.chave_media * 100)}</p>
                    </div>
                    <Progress value={resultado.detalhes.faixa2.chave_media * 100} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Faixa 3 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number bg-yellow-100 text-yellow-700">🥇</span>
                  <div>
                    <h3 className="faixa-title">Faixa 3 – Resultado com Cliente e Time</h3>
                    <p className="text-sm text-muted-foreground">Peso: 30% do total</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-xl font-bold text-primary">{formatPercent(resultado.score_faixa3)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">NPS Projeto (40%)</p>
                      <p className="text-sm font-medium">{resultado.detalhes.faixa3.nps_projeto.toFixed(0)}</p>
                    </div>
                    <Progress value={resultado.detalhes.faixa3.nps_projeto} className="h-2" />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Backlog (30%)</p>
                      <p className="text-sm font-medium">{resultado.detalhes.faixa3.backlog.toFixed(0)} tasks</p>
                    </div>
                    <Progress value={Math.max(0, 100 - resultado.detalhes.faixa3.backlog)} className="h-2" />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Prioridades (30%)</p>
                      <p className="text-sm font-medium">{formatPercent(resultado.detalhes.faixa3.prioridades)}</p>
                    </div>
                    <Progress value={resultado.detalhes.faixa3.prioridades} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Faixa 4 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number bg-purple-100 text-purple-700">🏆</span>
                  <div>
                    <h3 className="faixa-title">Faixa 4 – Resultado Empresa</h3>
                    <p className="text-sm text-muted-foreground">Multiplicador</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Multiplicador</p>
                    <p className="text-xl font-bold text-primary">×{resultado.multiplicador_faixa4.toFixed(1)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">NPS Global</p>
                    <p className="text-xl font-semibold text-foreground">{resultado.detalhes.faixa4.nps_global.toFixed(0)}</p>
                    <p className={`text-xs ${resultado.detalhes.faixa4.nps_global >= 75 ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa4.nps_global >= 75 ? '✓ Meta atingida' : '✗ Abaixo da meta'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Churn</p>
                    <p className="text-xl font-semibold text-foreground">{resultado.detalhes.faixa4.churn.toFixed(1)}%</p>
                    <p className={`text-xs ${resultado.detalhes.faixa4.churn <= 10 ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa4.churn <= 10 ? '✓ Meta atingida' : '✗ Acima da meta'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Uso AVA</p>
                    <p className="text-xl font-semibold text-foreground">{resultado.detalhes.faixa4.uso_ava.toFixed(0)}%</p>
                    <p className={`text-xs ${resultado.detalhes.faixa4.uso_ava >= 50 ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa4.uso_ava >= 50 ? '✓ Meta atingida' : '✗ Abaixo da meta'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedPrestador && !loadingAvaliacoes && (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma avaliação encontrada
              </h3>
              <p className="text-muted-foreground">
                Selecione um período com avaliações registradas.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
