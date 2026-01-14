import { useState, useEffect } from 'react';
import { Plus, Globe, Info, Loader2, Trash2, Lock, Save } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRegistrosGlobais, useCreateRegistroGlobal, useUpdateRegistroGlobal, useDeleteRegistroGlobal, RegistroGlobalComPrestador } from '@/hooks/useAvaliacoes';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';
import { useToast } from '@/hooks/use-toast';

type RegistroGlobal = RegistroGlobalComPrestador;

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

export default function RegistroGlobalPage() {
  const { data: registros = [], isLoading } = useRegistrosGlobais();
  const { prestador, isResponsavelGhas, isAdmin, loading: loadingUser } = usePrestadorLogado();
  const createRegistro = useCreateRegistroGlobal();
  const updateRegistro = useUpdateRegistroGlobal();
  const deleteRegistro = useDeleteRegistroGlobal();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [currentRegistro, setCurrentRegistro] = useState<RegistroGlobal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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

  const handleCriarRegistro = async () => {
    if (!newMes) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione o mês.',
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

    try {
      await createRegistro.mutateAsync({
        mes: newMes,
        registrado_por_id: prestador.id,
        faixa4_nps_global: 0,
        faixa4_churn: 0,
        faixa4_uso_ava: 0,
      });

      toast({
        title: 'Registro criado',
        description: `Registro global para ${newMes} foi criado com sucesso.`,
      });
      setIsNewDialogOpen(false);
      setNewMes('');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar registro',
        description: error.message || 'Ocorreu um erro ao criar o registro.',
        variant: 'destructive',
      });
    }
  };

  const handleEditarRegistro = (registro: RegistroGlobal) => {
    setCurrentRegistro({ ...registro });
    const isLiberado = !!registro.liberado_em;
    setIsEditing(!isLiberado);
    setIsFormOpen(true);
  };

  const handleSalvarRegistro = async (liberar: boolean = false) => {
    if (!currentRegistro) return;

    try {
      await updateRegistro.mutateAsync({
        id: currentRegistro.id,
        faixa4_nps_global: currentRegistro.faixa4_nps_global,
        faixa4_churn: currentRegistro.faixa4_churn,
        faixa4_uso_ava: currentRegistro.faixa4_uso_ava,
        ...(liberar ? { liberado_em: new Date().toISOString() } : {}),
      });

      toast({
        title: liberar ? 'Registro liberado' : 'Registro salvo',
        description: liberar 
          ? 'O registro foi liberado e não poderá mais ser editado.' 
          : 'Indicadores globais foram atualizados com sucesso.',
      });
      setIsFormOpen(false);
      setCurrentRegistro(null);
      setIsEditing(false);
      setIsReleaseDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o registro.',
        variant: 'destructive',
      });
    }
  };

  const handleClickSalvar = () => {
    if (!currentRegistro?.liberado_em) {
      setIsReleaseDialogOpen(true);
    } else {
      handleSalvarRegistro(false);
    }
  };

  const updateField = (field: keyof RegistroGlobal, value: number) => {
    if (!currentRegistro) return;
    setCurrentRegistro({ ...currentRegistro, [field]: value });
  };

  const handleDeleteRegistro = async () => {
    if (!currentRegistro) return;

    try {
      await deleteRegistro.mutateAsync(currentRegistro.id);
      toast({
        title: 'Registro excluído',
        description: `Registro global de ${currentRegistro.mes} foi excluído com sucesso.`,
      });
      setIsDeleteDialogOpen(false);
      setIsFormOpen(false);
      setCurrentRegistro(null);
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Ocorreu um erro ao excluir o registro.',
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
              <h1 className="page-title">Acelera GHAS Global</h1>
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
                {ordenarPorMes(registros).map((registro) => (
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
                          {registro.liberado_em && (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="w-3 h-3" />
                              Liberado
                            </Badge>
                          )}
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">NPS Global ≥75</p>
                            <p className="text-lg font-bold text-primary">
                              {Number(registro.faixa4_nps_global) === 1 ? 'Sim' : 'Não'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Churn ≥1</p>
                            <p className="text-lg font-bold text-primary">
                              {Number(registro.faixa4_churn) === 1 ? 'Sim' : 'Não'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Uso AVA &gt;50%</p>
                            <p className="text-lg font-bold text-primary">
                              {Number(registro.faixa4_uso_ava) === 1 ? 'Sim' : 'Não'}
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
                    <h3 className="faixa-title">Resultado Empresa (Peso 20%)</h3>
                    <p className="text-sm text-muted-foreground">
                      Indicadores globais aplicados a todas as avaliações
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* NPS Global */}
                  <div className="input-group">
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="input-label">O Score mensal do NPS Global da GHAS ficou igual ou superior a 75? (Peso 40%)</Label>
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
                    <RadioGroup
                      value={String(currentRegistro.faixa4_nps_global)}
                      onValueChange={(v) => updateField('faixa4_nps_global', Number(v))}
                      className="flex gap-4"
                      disabled={!isEditing}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="nps-sim" disabled={!isEditing} />
                        <Label htmlFor="nps-sim" className={isEditing ? "cursor-pointer" : "cursor-default text-muted-foreground"}>Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="nps-nao" disabled={!isEditing} />
                        <Label htmlFor="nps-nao" className={isEditing ? "cursor-pointer" : "cursor-default text-muted-foreground"}>Não</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Churn */}
                  <div className="input-group">
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="input-label">O Churn da GHAS foi menor que 1? (Peso 30%)</Label>
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
                    <RadioGroup
                      value={String(currentRegistro.faixa4_churn)}
                      onValueChange={(v) => updateField('faixa4_churn', Number(v))}
                      className="flex gap-4"
                      disabled={!isEditing}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="churn-sim" disabled={!isEditing} />
                        <Label htmlFor="churn-sim" className={isEditing ? "cursor-pointer" : "cursor-default text-muted-foreground"}>Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="churn-nao" disabled={!isEditing} />
                        <Label htmlFor="churn-nao" className={isEditing ? "cursor-pointer" : "cursor-default text-muted-foreground"}>Não</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Uso AVA */}
                  <div className="input-group">
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="input-label">Tivemos mais de 50% de uso da AVA no mês? (Peso 30%)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm text-sm" side="right">
                            <p>Tivemos mais de <strong>50%</strong> de uso da AVA no mês?</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <RadioGroup
                      value={String(currentRegistro.faixa4_uso_ava)}
                      onValueChange={(v) => updateField('faixa4_uso_ava', Number(v))}
                      className="flex gap-4"
                      disabled={!isEditing}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="ava-sim" disabled={!isEditing} />
                        <Label htmlFor="ava-sim" className={isEditing ? "cursor-pointer" : "cursor-default text-muted-foreground"}>Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="ava-nao" disabled={!isEditing} />
                        <Label htmlFor="ava-nao" className={isEditing ? "cursor-pointer" : "cursor-default text-muted-foreground"}>Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            {isEditing && !currentRegistro?.liberado_em && (
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </Button>
            )}
            {currentRegistro?.liberado_em && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span className="text-sm">
                  Liberado em {new Date(currentRegistro.liberado_em).toLocaleDateString('pt-BR')}
                  {currentRegistro.registrado_por?.nome && ` por ${currentRegistro.registrado_por.nome}`}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                {currentRegistro?.liberado_em ? 'Fechar' : 'Cancelar'}
              </Button>
              {isEditing && !currentRegistro?.liberado_em && (
                <Button 
                  onClick={handleClickSalvar} 
                  disabled={updateRegistro.isPending}
                  className="gap-2"
                >
                  {updateRegistro.isPending ? (
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
              Tem certeza que deseja excluir o registro global de <strong>{currentRegistro?.mes}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRegistro}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Liberar Registro */}
      <AlertDialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liberar Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja liberar o registro global de <strong>{currentRegistro?.mes}</strong>?
              <br /><br />
              <strong>Atenção:</strong> Após a liberação, o registro não poderá mais ser editado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={() => {
                handleSalvarRegistro(false);
                setIsReleaseDialogOpen(false);
              }}
            >
              Salvar sem Liberar
            </Button>
            <AlertDialogAction 
              onClick={() => handleSalvarRegistro(true)}
            >
              Liberar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
