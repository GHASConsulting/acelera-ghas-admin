import { useState } from 'react';
import { Plus, Pencil, Search, UserCheck, UserX, Loader2, KeyRound } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { usePrestadores, useUpdatePrestador } from '@/hooks/usePrestadores';
import { usePrestadorLogado } from '@/hooks/usePrestadorLogado';
import { Tables, Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type Prestador = Tables<'prestadores'>;
type Situacao = Database['public']['Enums']['situacao_type'];

export default function Administracao() {
  const { data: prestadores = [], isLoading } = usePrestadores();
  const updatePrestador = useUpdatePrestador();
  const { isAdmin, loading: loadingUser } = usePrestadorLogado();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrestador, setEditingPrestador] = useState<Prestador | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [prestadorToResetPassword, setPrestadorToResetPassword] = useState<Prestador | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    situacao: 'ativo' as Situacao,
    avaliador_id: '',
    salario_fixo: '',
    responsavel_ghas: false,
    data_inicio_prestacao: '',
  });

  const filteredPrestadores = prestadores.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvaliadorNome = (avaliadorId: string | null) => {
    if (!avaliadorId) return 'Não definido';
    const avaliador = prestadores.find((p) => p.id === avaliadorId);
    return avaliador?.nome || 'Não definido';
  };

  const handleOpenDialog = (prestador?: Prestador) => {
    if (prestador) {
      setEditingPrestador(prestador);
      setFormData({
        nome: prestador.nome,
        email: prestador.email,
        senha: '',
        situacao: prestador.situacao,
        avaliador_id: prestador.avaliador_id || '',
        salario_fixo: prestador.salario_fixo.toString(),
        responsavel_ghas: prestador.responsavel_ghas,
        data_inicio_prestacao: prestador.data_inicio_prestacao || '',
      });
    } else {
      setEditingPrestador(null);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        situacao: 'ativo',
        avaliador_id: '',
        salario_fixo: '',
        responsavel_ghas: false,
        data_inicio_prestacao: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.email || !formData.salario_fixo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome, email e salário fixo.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    if (editingPrestador) {
      // Atualizar prestador existente
      try {
        await updatePrestador.mutateAsync({
          id: editingPrestador.id,
          nome: formData.nome,
          email: formData.email,
          situacao: formData.situacao,
          avaliador_id: formData.avaliador_id || null,
          salario_fixo: parseFloat(formData.salario_fixo),
          responsavel_ghas: formData.responsavel_ghas,
          data_inicio_prestacao: formData.data_inicio_prestacao || null,
        });

        // Sincronizar role admin baseado no responsavel_ghas
        if (formData.responsavel_ghas !== editingPrestador.responsavel_ghas) {
          const { error: syncError } = await supabase.functions.invoke('sync-user-role', {
            body: {
              target_user_id: editingPrestador.user_id,
              responsavel_ghas: formData.responsavel_ghas,
            },
          });

          if (syncError) {
            console.error('Erro ao sincronizar role:', syncError);
          }
        }

        toast({
          title: 'Prestador atualizado',
          description: `${formData.nome} foi atualizado com sucesso.`,
        });
        setIsDialogOpen(false);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o prestador.',
          variant: 'destructive',
        });
      }
    } else {
      // Criar novo prestador via Edge Function
      if (!formData.senha || formData.senha.length < 6) {
        toast({
          title: 'Senha obrigatória',
          description: 'A senha deve ter no mínimo 6 caracteres.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const response = await supabase.functions.invoke('create-prestador', {
          body: {
            email: formData.email,
            password: formData.senha,
            nome: formData.nome,
            salario_fixo: parseFloat(formData.salario_fixo),
            data_inicio_prestacao: formData.data_inicio_prestacao || null,
            avaliador_id: formData.avaliador_id || null,
            responsavel_ghas: formData.responsavel_ghas,
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        toast({
          title: 'Prestador criado',
          description: `${formData.nome} foi cadastrado com sucesso.`,
        });
        
        // Refresh the list
        queryClient.invalidateQueries({ queryKey: ['prestadores'] });
        setIsDialogOpen(false);
      } catch (error: any) {
        toast({
          title: 'Erro ao criar prestador',
          description: error.message || 'Não foi possível criar o prestador.',
          variant: 'destructive',
        });
      }
    }

    setIsSaving(false);
  };

  const handleToggleSituacao = async (prestador: Prestador) => {
    const novaSituacao: Situacao = prestador.situacao === 'ativo' ? 'inativo' : 'ativo';
    try {
      await updatePrestador.mutateAsync({
        id: prestador.id,
        situacao: novaSituacao,
      });
      toast({
        title: novaSituacao === 'ativo' ? 'Prestador ativado' : 'Prestador inativado',
        description: `${prestador.nome} está agora ${novaSituacao}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a situação.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenResetPasswordDialog = (prestador: Prestador) => {
    setPrestadorToResetPassword(prestador);
    setNewPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!prestadorToResetPassword) return;

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      // Chamar edge function para resetar a senha (requer service_role)
      const response = await supabase.functions.invoke('reset-password', {
        body: {
          user_id: prestadorToResetPassword.user_id,
          new_password: newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Limpar a data de alteração de senha para forçar primeiro acesso
      await supabase
        .from('prestadores')
        .update({ senha_alterada_em: null })
        .eq('id', prestadorToResetPassword.id);

      toast({
        title: 'Senha resetada',
        description: `A senha de ${prestadorToResetPassword.nome} foi resetada. O usuário precisará alterá-la no próximo login.`,
      });

      queryClient.invalidateQueries({ queryKey: ['prestadores'] });
      setIsResetPasswordDialogOpen(false);
      setPrestadorToResetPassword(null);
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro ao resetar senha',
        description: error.message || 'Não foi possível resetar a senha.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading || loadingUser) {
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
              <h1 className="page-title">Administração</h1>
              <p className="page-subtitle">
                Gerencie os prestadores do programa Acelera GHAS 2026
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Prestador
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground">Total de Prestadores</p>
              <p className="text-3xl font-bold text-foreground mt-1">{prestadores.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-3xl font-bold text-success mt-1">
                {prestadores.filter((p) => p.situacao === 'ativo').length}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground">Inativos</p>
              <p className="text-3xl font-bold text-muted-foreground mt-1">
                {prestadores.filter((p) => p.situacao === 'inativo').length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {filteredPrestadores.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Nenhum prestador cadastrado ainda.</p>
                {isAdmin && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Novo Prestador" para cadastrar.
                  </p>
                )}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Situação</th>
                    <th>Avaliador</th>
                    <th>Salário Fixo</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrestadores.map((prestador) => (
                    <tr key={prestador.id} className="animate-slide-up">
                      <td className="font-medium text-foreground">{prestador.nome}</td>
                      <td className="text-muted-foreground">{prestador.email}</td>
                      <td>
                        <Badge variant={prestador.situacao === 'ativo' ? 'success' : 'inactive'}>
                          {prestador.situacao === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground">
                        {getAvaliadorNome(prestador.avaliador_id)}
                      </td>
                      <td className="font-medium">{formatCurrency(prestador.salario_fixo)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(prestador)}
                                className="gap-1.5"
                              >
                                <Pencil className="w-4 h-4" />
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleSituacao(prestador)}
                                className={
                                  prestador.situacao === 'ativo'
                                    ? 'text-muted-foreground hover:text-destructive'
                                    : 'text-success hover:text-success'
                                }
                              >
                                {prestador.situacao === 'ativo' ? (
                                  <>
                                    <UserX className="w-4 h-4 mr-1.5" />
                                    Inativar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-1.5" />
                                    Ativar
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenResetPasswordDialog(prestador)}
                                className="text-warning hover:text-warning gap-1.5"
                              >
                                <KeyRound className="w-4 h-4" />
                                Resetar Senha
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrestador ? 'Editar Prestador' : 'Novo Prestador'}
            </DialogTitle>
            <DialogDescription>
              {editingPrestador
                ? 'Atualize as informações do prestador.'
                : 'Cadastre um novo prestador no programa.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="input-group">
              <Label htmlFor="nome" className="input-label">
                Nome da Pessoa *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo do prestador"
              />
            </div>

            <div className="input-group">
              <Label htmlFor="email" className="input-label">
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={!!editingPrestador}
              />
            </div>

            {!editingPrestador && (
              <div className="input-group">
                <Label htmlFor="senha" className="input-label">
                  Senha *
                </Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <Label htmlFor="situacao" className="input-label">
                  Situação *
                </Label>
                <Select
                  value={formData.situacao}
                  onValueChange={(value: Situacao) =>
                    setFormData({ ...formData, situacao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="input-group">
                <Label htmlFor="salario" className="input-label">
                  Vencimentos *
                </Label>
                <Input
                  id="salario"
                  type="number"
                  value={formData.salario_fixo}
                  onChange={(e) => setFormData({ ...formData, salario_fixo: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="input-group">
              <Label htmlFor="data_inicio" className="input-label">
                Data do Início da Prestação
              </Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio_prestacao}
                onChange={(e) => setFormData({ ...formData, data_inicio_prestacao: e.target.value })}
              />
            </div>

            <div className="input-group">
              <Label htmlFor="avaliador" className="input-label">
                Avaliador Responsável
              </Label>
              <Select
                value={formData.avaliador_id}
                onValueChange={(value) => setFormData({ ...formData, avaliador_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o avaliador" />
                </SelectTrigger>
                <SelectContent>
                  {prestadores
                    .filter((p) => p.id !== editingPrestador?.id)
                    .map((prestador) => (
                      <SelectItem key={prestador.id} value={prestador.id}>
                        {prestador.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="responsavel_ghas"
                checked={formData.responsavel_ghas}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, responsavel_ghas: checked === true })
                }
              />
              <Label htmlFor="responsavel_ghas" className="text-sm font-medium cursor-pointer">
                Responsável GHAS
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingPrestador ? 'Salvar Alterações' : 'Cadastrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Resetar Senha */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Defina uma nova senha temporária para <strong>{prestadorToResetPassword?.nome}</strong>.
              <br /><br />
              O usuário será obrigado a alterar a senha no próximo login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="new-password" className="input-label">
              Nova Senha Temporária
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPrestadorToResetPassword(null);
              setNewPassword('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <Button onClick={handleResetPassword} disabled={isResettingPassword}>
              {isResettingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                'Resetar Senha'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
