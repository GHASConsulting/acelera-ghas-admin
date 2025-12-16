import { Prestador, Usuario, AvaliacaoMensal } from '@/types';

export const mockUsuarios: Usuario[] = [
  { id: '1', nome: 'Carlos Silva', email: 'carlos.silva@ghas.com.br' },
  { id: '2', nome: 'Ana Santos', email: 'ana.santos@ghas.com.br' },
  { id: '3', nome: 'Roberto Lima', email: 'roberto.lima@ghas.com.br' },
];

export const mockPrestadores: Prestador[] = [
  {
    id: '1',
    nome: 'Maria Oliveira',
    email: 'maria.oliveira@email.com',
    senha: '********',
    situacao: 'ativo',
    avaliador_id: '1',
    salario_fixo: 8500,
    criado_em: '2025-12-01T10:00:00Z',
    atualizado_em: '2025-12-01T10:00:00Z',
  },
  {
    id: '2',
    nome: 'João Pereira',
    email: 'joao.pereira@email.com',
    senha: '********',
    situacao: 'ativo',
    avaliador_id: '1',
    salario_fixo: 7200,
    criado_em: '2025-12-02T14:30:00Z',
    atualizado_em: '2025-12-02T14:30:00Z',
  },
  {
    id: '3',
    nome: 'Fernanda Costa',
    email: 'fernanda.costa@email.com',
    senha: '********',
    situacao: 'inativo',
    avaliador_id: '2',
    salario_fixo: 9000,
    criado_em: '2025-11-15T09:00:00Z',
    atualizado_em: '2025-12-10T11:20:00Z',
  },
  {
    id: '4',
    nome: 'Paulo Mendes',
    email: 'paulo.mendes@email.com',
    senha: '********',
    situacao: 'ativo',
    avaliador_id: '2',
    salario_fixo: 6800,
    criado_em: '2025-12-05T16:45:00Z',
    atualizado_em: '2025-12-05T16:45:00Z',
  },
  {
    id: '5',
    nome: 'Lucia Ferreira',
    email: 'lucia.ferreira@email.com',
    senha: '********',
    situacao: 'ativo',
    avaliador_id: '1',
    salario_fixo: 7800,
    criado_em: '2025-12-08T08:15:00Z',
    atualizado_em: '2025-12-08T08:15:00Z',
  },
];

export const mockAvaliacoes: AvaliacaoMensal[] = [
  {
    id: '1',
    prestador_id: '1',
    avaliador_id: '1',
    mes: 'Janeiro/2026',
    faixa1_ausencias: 0,
    faixa1_pendencias: 0,
    faixa2_produtividade: 92,
    faixa2_qualidade: 88,
    faixa2_chave_comportamento: 90,
    faixa2_chave_habilidades: 85,
    faixa2_chave_atitudes: 95,
    faixa2_chave_valores: 92,
    faixa3_nps_projeto: 85,
    faixa3_backlog: 15,
    faixa3_prioridades: 90,
    faixa4_nps_global: 78,
    faixa4_churn: 5,
    faixa4_uso_ava: 82,
    criado_em: '2026-02-01T10:00:00Z',
    atualizado_em: '2026-02-01T10:00:00Z',
  },
];

// Simular usuário logado (para filtro de prestadores)
export const usuarioLogado: Usuario = mockUsuarios[0];
