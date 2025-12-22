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
  premio_maximo: number;
  valor_faixa2: number;
  valor_faixa3: number;
  valor_faixa4: number;
  premio_valor: number;
  salario_base: number;
  status: StatusCalculo;
  detalhes: {
    faixa1: {
      ausencias: number;
      pendencias: number;
      notificacoes: number;
    };
    faixa2: {
      produtividade: boolean;
      qualidade: boolean;
      comportamento: boolean;
      habilidades: boolean;
      atitudes: boolean;
      valores: boolean;
      percentual: number;
    };
    faixa3: {
      nps_projeto: boolean;
      backlog: boolean;
      prioridades: boolean;
      sla: boolean;
      percentual: number;
    };
    faixa4: {
      nps_global: boolean;
      churn: boolean;
      uso_ava: boolean;
      percentual: number;
    };
  };
}

const SEMESTRE_1_MESES: string[] = [
  'Janeiro/2026', 'Fevereiro/2026', 'Março/2026', 'Abril/2026', 'Maio/2026', 'Junho/2026'
];

const SEMESTRE_2_MESES: string[] = [
  'Julho/2026', 'Agosto/2026', 'Setembro/2026', 'Outubro/2026', 'Novembro/2026', 'Dezembro/2026'
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

    const salario_base = Number(prestadorSelecionado.salario_fixo);
    
    // Passo 1 - Prêmio Máximo: 80% do salário
    const premio_maximo = salario_base * 0.8;

    // Passo 2 - Distribuição por Faixa
    const faixa2_max = premio_maximo * 0.4; // 40%
    const faixa3_max = premio_maximo * 0.4; // 40%
    const faixa4_max = premio_maximo * 0.2; // 20%

    // Agregar dados (para semestral usa média, valores são binários 0 ou 1)
    const totalAusencias = avaliacoesFiltradas.reduce((sum, a) => sum + a.faixa1_ausencias, 0);
    const totalPendencias = avaliacoesFiltradas.reduce((sum, a) => sum + a.faixa1_pendencias, 0);
    const totalNotificacoes = avaliacoesFiltradas.reduce((sum, a) => sum + a.faixa1_notificacoes, 0);

    // FAIXA 1 - Elegibilidade (não gera valor, apenas verifica)
    // Ausências >= 3 ou Pendências >= 1 ou Notificações >= 1 = inelegível
    const elegivel = totalAusencias < 3 && totalPendencias === 0 && totalNotificacoes === 0;

    // FAIXA 2 - Produtividade Individual (valores binários)
    // Para semestral: considera "Sim" se a média >= 0.5 (maioria dos meses foi Sim)
    const avgProdutividade = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_produtividade), 0) / avaliacoesFiltradas.length;
    const avgQualidade = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_qualidade), 0) / avaliacoesFiltradas.length;
    const avgChaveComportamento = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_chave_comportamento), 0) / avaliacoesFiltradas.length;
    const avgChaveHabilidades = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_chave_habilidades), 0) / avaliacoesFiltradas.length;
    const avgChaveAtitudes = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_chave_atitudes), 0) / avaliacoesFiltradas.length;
    const avgChaveValores = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa2_chave_valores), 0) / avaliacoesFiltradas.length;

    const produtividade_sim = avgProdutividade >= 0.5;
    const qualidade_sim = avgQualidade >= 0.5;
    const comportamento_sim = avgChaveComportamento >= 0.5;
    const habilidades_sim = avgChaveHabilidades >= 0.5;
    const atitudes_sim = avgChaveAtitudes >= 0.5;
    const valores_sim = avgChaveValores >= 0.5;

    const percentual_faixa2 = 
      (produtividade_sim ? 0.30 : 0) +
      (qualidade_sim ? 0.30 : 0) +
      (comportamento_sim ? 0.10 : 0) +
      (habilidades_sim ? 0.10 : 0) +
      (atitudes_sim ? 0.10 : 0) +
      (valores_sim ? 0.10 : 0);

    // FAIXA 3 - Resultado Cliente/Projeto (valores binários)
    const avgNpsProjeto = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa3_nps_projeto), 0) / avaliacoesFiltradas.length;
    const avgBacklog = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa3_backlog), 0) / avaliacoesFiltradas.length;
    const avgPrioridades = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa3_prioridades), 0) / avaliacoesFiltradas.length;
    const avgSla = avaliacoesFiltradas.reduce((sum, a) => sum + Number(a.faixa3_sla), 0) / avaliacoesFiltradas.length;

    const nps_projeto_sim = avgNpsProjeto >= 0.5;
    const backlog_sim = avgBacklog >= 0.5;
    const prioridades_sim = avgPrioridades >= 0.5;
    const sla_sim = avgSla >= 0.5;

    const percentual_faixa3 = 
      (nps_projeto_sim ? 0.40 : 0) +
      (prioridades_sim ? 0.30 : 0) +
      (backlog_sim ? 0.30 : 0);
    // SLA é informativo (0%)

    // FAIXA 4 - Resultado Empresa (dados da tabela registros_globais)
    const mesesDoFiltro = avaliacoesFiltradas.map(a => a.mes);
    const registrosGlobaisFiltrados = registrosGlobais.filter(r => mesesDoFiltro.includes(r.mes));
    
    let nps_global_sim = false;
    let churn_sim = false;
    let uso_ava_sim = false;
    
    if (registrosGlobaisFiltrados.length > 0) {
      const avgNpsGlobal = registrosGlobaisFiltrados.reduce((sum, r) => sum + Number(r.faixa4_nps_global), 0) / registrosGlobaisFiltrados.length;
      const avgChurn = registrosGlobaisFiltrados.reduce((sum, r) => sum + Number(r.faixa4_churn), 0) / registrosGlobaisFiltrados.length;
      const avgUsoAva = registrosGlobaisFiltrados.reduce((sum, r) => sum + Number(r.faixa4_uso_ava), 0) / registrosGlobaisFiltrados.length;
      
      nps_global_sim = avgNpsGlobal >= 0.5;
      churn_sim = avgChurn >= 0.5;
      uso_ava_sim = avgUsoAva >= 0.5;
    }

    const percentual_faixa4 = 
      (nps_global_sim ? 0.40 : 0) +
      (churn_sim ? 0.30 : 0) +
      (uso_ava_sim ? 0.30 : 0);

    // Passo 4 - Valor Financeiro por Faixa
    const valor_faixa2 = faixa2_max * percentual_faixa2;
    const valor_faixa3 = faixa3_max * percentual_faixa3;
    const valor_faixa4 = faixa4_max * percentual_faixa4;

    // Passo 5 - Prêmio Final
    const premio_valor = elegivel ? (valor_faixa2 + valor_faixa3 + valor_faixa4) : 0;

    return {
      elegivel,
      premio_maximo,
      valor_faixa2,
      valor_faixa3,
      valor_faixa4,
      premio_valor,
      salario_base,
      status: 'em_aberto',
      detalhes: {
        faixa1: {
          ausencias: totalAusencias,
          pendencias: totalPendencias,
          notificacoes: totalNotificacoes,
        },
        faixa2: {
          produtividade: produtividade_sim,
          qualidade: qualidade_sim,
          comportamento: comportamento_sim,
          habilidades: habilidades_sim,
          atitudes: atitudes_sim,
          valores: valores_sim,
          percentual: percentual_faixa2 * 100,
        },
        faixa3: {
          nps_projeto: nps_projeto_sim,
          backlog: backlog_sim,
          prioridades: prioridades_sim,
          sla: sla_sim,
          percentual: percentual_faixa3 * 100,
        },
        faixa4: {
          nps_global: nps_global_sim,
          churn: churn_sim,
          uso_ava: uso_ava_sim,
          percentual: percentual_faixa4 * 100,
        },
      },
    } as ResultadoCalculo;
  }, [avaliacoesFiltradas, prestadorSelecionado, registrosGlobais]);

  // Fator de divisão: quando mensal, divide por 6
  const divisor = selectedPeriodo === 'mensal' ? 6 : 1;

  // Valores exibidos (divididos por 6 quando mensal)
  const valoresExibidos = useMemo(() => {
    if (!resultado) return null;
    return {
      premio_final: resultado.premio_valor / divisor,
      valor_faixa2: resultado.valor_faixa2 / divisor,
      valor_faixa3: resultado.valor_faixa3 / divisor,
      valor_faixa4: resultado.valor_faixa4 / divisor,
    };
  }, [resultado, divisor]);

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

              {selectedPeriodo === 'mensal' && selectedPrestador && (
                <div>
                  <Label className="input-label mb-2 block">Mês</Label>
                  <Select value={selectedMes} onValueChange={(v) => setSelectedMes(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ordenarPorMes(avaliacoesPrestador).map((a) => (
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
                    <p className="text-xs text-muted-foreground mb-1">Prêmio Máximo</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(resultado.premio_maximo)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Faixa 2 (40%){selectedPeriodo === 'mensal' && ' /6'}</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(valoresExibidos!.valor_faixa2)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Faixa 3 (40%){selectedPeriodo === 'mensal' && ' /6'}</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(valoresExibidos!.valor_faixa3)}</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Prêmio Final{selectedPeriodo === 'mensal' && ' /6'}</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(valoresExibidos!.premio_final)}</p>
                  </div>
                </div>
              </div>

              {/* Faixa 1 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number bg-amber-100 text-amber-700">🥉</span>
                  <div>
                    <h3 className="faixa-title">Faixa 1 – Existir e Ser Confiável</h3>
                    <p className="text-sm text-muted-foreground">Elegibilidade (eliminatória - não gera valor)</p>
                  </div>
                  <Badge variant={resultado.elegivel ? 'success' : 'destructive'} className="ml-auto">
                    {resultado.elegivel ? 'Elegível' : 'Inelegível'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Ausências sem acordo</p>
                    <p className="text-xl font-semibold text-foreground">{resultado.detalhes.faixa1.ausencias} dias</p>
                    <p className={`text-xs ${resultado.detalhes.faixa1.ausencias < 3 ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa1.ausencias < 3 ? '✓ OK' : '✗ Inelegível (≥3 dias)'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Pendências Admin/Fiscal</p>
                    <p className="text-xl font-semibold text-foreground">{resultado.detalhes.faixa1.pendencias}</p>
                    <p className={`text-xs ${resultado.detalhes.faixa1.pendencias === 0 ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa1.pendencias === 0 ? '✓ OK' : '✗ Inelegível'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Notificações</p>
                    <p className="text-xl font-semibold text-foreground">{resultado.detalhes.faixa1.notificacoes}</p>
                    <p className={`text-xs ${resultado.detalhes.faixa1.notificacoes === 0 ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa1.notificacoes === 0 ? '✓ OK' : '✗ Inelegível'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Faixa 2 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number bg-slate-100 text-slate-700">🥈</span>
                  <div>
                    <h3 className="faixa-title">Faixa 2 – Produtividade Individual</h3>
                    <p className="text-sm text-muted-foreground">Peso: 40% do prêmio máximo</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Valor{selectedPeriodo === 'mensal' && ' /6'}</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(valoresExibidos!.valor_faixa2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Produtividade mínima (30%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa2.produtividade ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa2.produtividade ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Qualidade mínima (30%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa2.qualidade ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa2.qualidade ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Comportamento (10%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa2.comportamento ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa2.comportamento ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Habilidades (10%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa2.habilidades ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa2.habilidades ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Atitudes (10%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa2.atitudes ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa2.atitudes ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Valores (10%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa2.valores ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa2.valores ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Percentual atingido: <span className="font-semibold text-foreground">{formatPercent(resultado.detalhes.faixa2.percentual)}</span>
                  </p>
                </div>
              </div>

              {/* Faixa 3 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number bg-yellow-100 text-yellow-700">🥇</span>
                  <div>
                    <h3 className="faixa-title">Faixa 3 – Resultado com Cliente e Time</h3>
                    <p className="text-sm text-muted-foreground">Peso: 40% do prêmio máximo</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Valor{selectedPeriodo === 'mensal' && ' /6'}</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(valoresExibidos!.valor_faixa3)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">NPS Projeto ≥75 (40%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa3.nps_projeto ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa3.nps_projeto ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Prioridades em dia (30%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa3.prioridades ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa3.prioridades ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Backlog &lt;15% (30%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa3.backlog ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa3.backlog ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">SLA 1ª hora (0% - info)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa3.sla ? 'text-success' : 'text-muted-foreground'}`}>
                      {resultado.detalhes.faixa3.sla ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Percentual atingido: <span className="font-semibold text-foreground">{formatPercent(resultado.detalhes.faixa3.percentual)}</span>
                  </p>
                </div>
              </div>

              {/* Faixa 4 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number bg-purple-100 text-purple-700">🏆</span>
                  <div>
                    <h3 className="faixa-title">Faixa 4 – Resultado Empresa</h3>
                    <p className="text-sm text-muted-foreground">Peso: 20% do prêmio máximo</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Valor{selectedPeriodo === 'mensal' && ' /6'}</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(valoresExibidos!.valor_faixa4)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">NPS Global ≥75 (40%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa4.nps_global ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa4.nps_global ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Churn ≥1 (30%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa4.churn ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa4.churn ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Uso AVA &gt;50% (30%)</p>
                    <p className={`text-xl font-semibold ${resultado.detalhes.faixa4.uso_ava ? 'text-success' : 'text-destructive'}`}>
                      {resultado.detalhes.faixa4.uso_ava ? 'Sim' : 'Não'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Percentual atingido: <span className="font-semibold text-foreground">{formatPercent(resultado.detalhes.faixa4.percentual)}</span>
                  </p>
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
