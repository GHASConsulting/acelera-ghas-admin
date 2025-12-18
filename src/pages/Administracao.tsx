import { useState } from 'react';
import { Plus, Pencil, Search, UserCheck, UserX } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { mockPrestadores, mockUsuarios } from '@/data/mockData';
import { Prestador, Situacao } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Administracao() {
  const [prestadores, setPrestadores] = useState<Prestador[]>(mockPrestadores);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrestador, setEditingPrestador] = useState<Prestador | null>(null);
  const { toast } = useToast();

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

  const getAvaliadorNome = (avaliadorId: string) => {
    const avaliador = mockUsuarios.find((u) => u.id === avaliadorId);
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
        avaliador_id: prestador.avaliador_id,
        salario_fixo: prestador.salario_fixo.toString(),
        responsavel_ghas: prestador.responsavel_ghas,
        data_inicio_prestacao: prestador.data_inicio_prestacao,
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

  const handleSave = () => {
    if (!formData.nome || !formData.email || !formData.avaliador_id || !formData.salario_fixo || !formData.data_inicio_prestacao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();

    if (editingPrestador) {
      setPrestadores((prev) =>
        prev.map((p) =>
          p.id === editingPrestador.id
            ? {
                ...p,
                ...formData,
                salario_fixo: parseFloat(formData.salario_fixo),
                atualizado_em: now,
              }
            : p
        )
      );
      toast({
        title: 'Prestador atualizado',
        description: `${formData.nome} foi atualizado com sucesso.`,
      });
    } else {
      const newPrestador: Prestador = {
        id: (prestadores.length + 1).toString(),
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha || '********',
        situacao: formData.situacao,
        avaliador_id: formData.avaliador_id,
        salario_fixo: parseFloat(formData.salario_fixo),
        responsavel_ghas: formData.responsavel_ghas,
        data_inicio_prestacao: formData.data_inicio_prestacao,
        criado_em: now,
        atualizado_em: now,
      };
      setPrestadores((prev) => [...prev, newPrestador]);
      toast({
        title: 'Prestador cadastrado',
        description: `${formData.nome} foi cadastrado com sucesso.`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleToggleSituacao = (prestador: Prestador) => {
    const novaSituacao: Situacao = prestador.situacao === 'ativo' ? 'inativo' : 'ativo';
    setPrestadores((prev) =>
      prev.map((p) =>
        p.id === prestador.id
          ? { ...p, situacao: novaSituacao, atualizado_em: new Date().toISOString() }
          : p
      )
    );
    toast({
      title: novaSituacao === 'ativo' ? 'Prestador ativado' : 'Prestador inativado',
      description: `${prestador.nome} está agora ${novaSituacao}.`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Prestador
            </Button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              />
            </div>

            <div className="input-group">
              <Label htmlFor="senha" className="input-label">
                Senha {editingPrestador ? '(deixe vazio para manter)' : '*'}
              </Label>
              <Input
                id="senha"
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                placeholder="••••••••"
              />
            </div>

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
                  Salário Fixo *
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
                Data do Início da Prestação *
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
                Avaliador Responsável *
              </Label>
              <Select
                value={formData.avaliador_id}
                onValueChange={(value) => setFormData({ ...formData, avaliador_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o avaliador" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nome}
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
            <Button onClick={handleSave}>
              {editingPrestador ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
