import { useState, useEffect } from 'react';
import { Plus, Globe, AlertCircle, Info, Lock } from 'lucide-react';
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
import { mockRegistrosGlobais, prestadorLogado } from '@/data/mockData';
import { RegistroGlobal, MesAvaliacao, MESES_AVALIACAO } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function RegistroGlobalPage() {
  const [registros, setRegistros] = useState<RegistroGlobal[]>(mockRegistrosGlobais);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentRegistro, setCurrentRegistro] = useState<RegistroGlobal | null>(null);
  const [newMes, setNewMes] = useState<MesAvaliacao | ''>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Verificar se o usuário tem permissão
  useEffect(() => {
    if (!prestadorLogado.responsavel_ghas) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
      navigate('/registro');
    }
  }, [navigate, toast]);

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

    const novoRegistro: RegistroGlobal = {
      id: (registros.length + 1).toString(),
      mes: newMes as MesAvaliacao,
      registrado_por_id: prestadorLogado.id,
      faixa4_nps_global: 0,
      faixa4_churn: 0,
      faixa4_uso_ava: 0,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    setRegistros((prev) => [...prev, novoRegistro]);
    setCurrentRegistro(novoRegistro);
    setIsNewDialogOpen(false);
    setIsFormOpen(true);
    setNewMes('');

    toast({
      title: 'Registro criado',
      description: `Registro global de ${newMes} iniciado.`,
    });
  };

  const handleEditarRegistro = (registro: RegistroGlobal) => {
    setCurrentRegistro({ ...registro });
    setIsFormOpen(true);
  };

  const handleSalvarRegistro = () => {
    if (!currentRegistro) return;

    setRegistros((prev) =>
      prev.map((r) =>
        r.id === currentRegistro.id
          ? { ...currentRegistro, atualizado_em: new Date().toISOString() }
          : r
      )
    );

    toast({
      title: 'Registro salvo',
      description: 'Os indicadores globais foram salvos com sucesso.',
    });

    setIsFormOpen(false);
    setCurrentRegistro(null);
  };

  const updateField = (field: keyof RegistroGlobal, value: number) => {
    if (!currentRegistro) return;
    setCurrentRegistro({ ...currentRegistro, [field]: value });
  };

  if (!prestadorLogado.responsavel_ghas) {
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
                            {registro.faixa4_nps_global}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Churn</p>
                          <p className="text-lg font-bold text-primary">
                            {registro.faixa4_churn}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Uso AVA</p>
                          <p className="text-lg font-bold text-primary">
                            {registro.faixa4_uso_ava}%
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
                        value={[currentRegistro.faixa4_nps_global]}
                        onValueChange={([v]) => updateField('faixa4_nps_global', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentRegistro.faixa4_nps_global}
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
                        value={[currentRegistro.faixa4_churn]}
                        onValueChange={([v]) => updateField('faixa4_churn', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentRegistro.faixa4_churn}%
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
                        value={[currentRegistro.faixa4_uso_ava]}
                        onValueChange={([v]) => updateField('faixa4_uso_ava', v)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {currentRegistro.faixa4_uso_ava}%
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
