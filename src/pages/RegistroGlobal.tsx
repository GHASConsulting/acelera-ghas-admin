import { useState, useEffect } from 'react';
import { Plus, Globe, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Slider } from '@/components/ui/slider';
import { useRegistrosGlobais } from '@/hooks/useAvaliacoes';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type RegistroGlobal = Tables<'registros_globais'>;

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

export default function RegistroGlobalPage() {
  const { data: registros = [], isLoading } = useRegistrosGlobais();
  const { prestador, isResponsavelGhas, isAdmin, loading: loadingUser } = usePrestadorLogado();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentRegistro, setCurrentRegistro] = useState<RegistroGlobal | null>(null);
  const [newMes, setNewMes] = useState<string>('');
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

  // Meses já registrados
  const mesesRegistrados = registros.map((r) => r.mes);

  // Meses disponíveis para novo registro
  const mesesDisponiveis = MESES_AVALIACAO.filter((m) => !mesesRegistrados.includes(m));

  const handleCriarRegistro = () => {
    if (!newMes) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione o mês.',
        variant: 'destructive',
      });
      return;
    }

    // Por enquanto, apenas simular criação local
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A criação de registros globais será implementada em breve.',
    });
    setIsNewDialogOpen(false);
    setNewMes('');
  };

  const handleEditarRegistro = (registro: RegistroGlobal) => {
    setCurrentRegistro({ ...registro });
    setIsFormOpen(true);
  };

  const handleSalvarRegistro = () => {
    if (!currentRegistro) return;

    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A edição de registros globais será implementada em breve.',
    });

    setIsFormOpen(false);
    setCurrentRegistro(null);
  };

  const updateField = (field: keyof RegistroGlobal, value: number) => {
    if (!currentRegistro) return;
    setCurrentRegistro({ ...currentRegistro, [field]: value });
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
              <h1 className="page-title">Registro Global</h1>
              <p className="page-subtitle">
                Registre os indicadores globais da Faixa 4 (Resultado Empresa)
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Botão Novo Registro */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Indicadores Globais da Empresa</p>
                  <p className="text-sm text-muted-foreground">
                    Estes indicadores serão aplicados a todas as avaliações do mês
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsNewDialogOpen(true)}
                className="gap-2"
                disabled={mesesDisponiveis.length === 0}
              >
                <Plus className="w-4 h-4" />
                Novo Registro de Avaliação
              </Button>
            </div>
          </div>

          {/* Lista de Registros */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Registros Globais
            </h2>

            {registros.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum registro global
                </h3>
                <p className="text-muted-foreground mb-4">
                  Clique em "Novo Registro de Avaliação" para começar.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {registros.map((registro) => (
                  <div
                    key={registro.id}
                    className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEditarRegistro(registro)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{registro.mes}</h3>
                          <p className="text-sm text-muted-foreground">
                            Atualizado em{' '}
                            {new Date(registro.atualizado_em).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">NPS Global</p>
                          <p className="text-lg font-bold text-primary">
                            {Number(registro.faixa4_nps_global)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Churn</p>
                          <p className="text-lg font-bold text-primary">
                            {Number(registro.faixa4_churn)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Uso AVA</p>
                          <p className="text-lg font-bold text-primary">
                            {Number(registro.faixa4_uso_ava)}%
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

      {/* Dialog Novo Registro */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Registro Global</DialogTitle>
            <DialogDescription>
              Selecione o mês para criar um novo registro de indicadores globais.
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
            <Button onClick={handleCriarRegistro}>Criar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Formulário de Registro Global */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Indicadores Globais - {currentRegistro?.mes}</DialogTitle>
            <DialogDescription>
              Preencha os indicadores da Faixa 4 (Resultado Empresa).
            </DialogDescription>
          </DialogHeader>

          {currentRegistro && (
            <div className="space-y-6 py-4">
              {/* Faixa 4 */}
              <div className="faixa-card">
                <div className="faixa-header">
                  <span className="faixa-number">4</span>
                  <div>
                    <h3 className="faixa-title">Resultado Empresa (Peso 30%)</h3>
                    <p className="text-sm text-muted-foreground">
                      Indicadores globais aplicados a todas as avaliações
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="input-group">
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="input-label">NPS Global GHAS (Peso 40%)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm text-sm" side="right">
                            <p>NPS Mensal da GHAS deve estar com score mensal <strong>igual ou superior a 75</strong>.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[Number(currentRegistro.faixa4_nps_global)]}
                        onValueChange={([v]) => updateField('faixa4_nps_global', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {Number(currentRegistro.faixa4_nps_global)}
                      </span>
                    </div>
                  </div>

                  <div className="input-group">
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="input-label">Churn (Peso 30%)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm text-sm" side="right">
                            <p>O Churn da GHAS foi <strong>igual ou superior a 1</strong>?</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[Number(currentRegistro.faixa4_churn)]}
                        onValueChange={([v]) => updateField('faixa4_churn', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {Number(currentRegistro.faixa4_churn)}%
                      </span>
                    </div>
                  </div>

                  <div className="input-group">
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="input-label">Uso da AVA (Peso 30%)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm text-sm" side="right">
                            <p>Uso da AVA</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[Number(currentRegistro.faixa4_uso_ava)]}
                        onValueChange={([v]) => updateField('faixa4_uso_ava', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {Number(currentRegistro.faixa4_uso_ava)}%
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
            <Button onClick={handleSalvarRegistro}>Salvar Indicadores</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
