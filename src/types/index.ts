export type Situacao = 'ativo' | 'inativo';

export interface Prestador {
  id: string;
  nome: string;
  email: string;
  senha: string;
  situacao: Situacao;
  avaliador_id: string;
  salario_fixo: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export type MesAvaliacao = 
  | 'Janeiro/2026'
  | 'Fevereiro/2026'
  | 'Março/2026'
  | 'Abril/2026'
  | 'Maio/2026'
  | 'Junho/2026'
  | 'Julho/2026'
  | 'Agosto/2026'
  | 'Setembro/2026'
  | 'Outubro/2026'
  | 'Novembro/2026'
  | 'Dezembro/2026';

export interface AvaliacaoMensal {
  id: string;
  prestador_id: string;
  avaliador_id: string;
  mes: MesAvaliacao;
  
  // Faixa 1 - Elegibilidade
  faixa1_ausencias: number;
  faixa1_pendencias: number;
  
  // Faixa 2 - Produtividade Individual
  faixa2_produtividade: number;
  faixa2_qualidade: number;
  faixa2_chave_comportamento: number;
  faixa2_chave_habilidades: number;
  faixa2_chave_atitudes: number;
  faixa2_chave_valores: number;
  
  // Faixa 3 - Resultado com Cliente e Time
  faixa3_nps_projeto: number;
  faixa3_sla: number;
  faixa3_backlog: number;
  faixa3_prioridades: number;
  
  // Faixa 4 - Resultado Empresa
  faixa4_nps_global: number;
  faixa4_churn: number;
  faixa4_uso_ava: number;
  
  criado_em: string;
  atualizado_em: string;
}

export const MESES_AVALIACAO: MesAvaliacao[] = [
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
