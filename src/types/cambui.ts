export type PerfilUsuario = 'admin' | 'operador'

export interface Usuario {
  id: string
  email: string
  nome: string
  perfil: PerfilUsuario
  telefone?: string | null
  ativo: boolean
  criado_em?: string
}

export interface Funcionario {
  id: string
  usuario_id?: string | null
  nome: string | null
  telefone?: string | null
  funcao: string | null
  valor_hora?: number | null
  ativo: boolean
}

export interface Cliente {
  id: string
  nome: string | null
  cpf_cnpj?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  endereco?: string | null
  observacoes?: string | null
  ativo: boolean
}

export interface Obra {
  id: string
  cliente_id: string | null
  nome: string | null
  endereco?: string | null
  latitude?: number | null
  longitude?: number | null
  data_inicio: string
  status: 'em_andamento' | 'concluida' | 'pausada'
  cliente?: Cliente
}

export type CategoriaMaquina = 'maquina' | 'veiculo'

export interface Maquina {
  id: string
  categoria?: CategoriaMaquina
  tipo: string | null
  modelo: string | null
  placa_identificacao: string | null
  horimetro_atual: number
  valor_hora_padrao: number
  intervalo_troca_oleo: number
  horimetro_ultima_troca: number
  status: 'ativa' | 'em_manutencao' | 'parada'
}

export interface TipoServico {
  id: string
  nome: string
  ativo: boolean
}

export interface PrecoCliente {
  id: string
  cliente_id: string
  obra_id?: string | null
  maquina_id: string
  valor_hora: number
}

export interface Apontamento {
  id: string
  data: string
  funcionario_id: string | null
  maquina_id: string | null
  cliente_id: string | null
  obra_id: string | null
  horimetro_inicial: number | null
  horimetro_final: number | null
  horas_trabalhadas: number | null
  horas_paradas?: number | null
  motivo_parada?: string | null
  quantidade_viagens?: number | null
  descricao?: string | null
  status: 'pendente' | 'aprovado' | 'devolvido' | 'rascunho_foto'
  motivo_devolucao?: string | null
  valor_hora_aplicado?: number | null
  valor_total?: number | null
  cobranca_id?: string | null
  foto_folha_url?: string | null
  origem_foto?: boolean
  criado_por?: string | null
  atualizado_por?: string | null
  criado_em?: string
  is_offline?: boolean

  // Joined fields
  funcionario?: Funcionario
  maquina?: Maquina
  cliente?: Cliente
  obra?: Obra
  servicos?: TipoServico[]
  fotos?: Foto[]
}

export interface Foto {
  id: string
  apontamento_id?: string | null
  abastecimento_id?: string | null
  manutencao_id?: string | null
  url: string
  legenda?: string | null
  tipo_arquivo?: 'foto' | 'pdf'
}

export interface Abastecimento {
  id: string
  data: string
  maquina_id: string | null
  funcionario_id: string | null
  horimetro_momento?: number | null
  tipo_combustivel: 'diesel' | 'gasolina' | 'ARLA'
  litros: number | null
  valor_por_litro?: number | null
  valor_total?: number | null
  posto_local?: string | null
  foto_cupom_url?: string | null
  criado_por?: string | null
  criado_em?: string
  maquina?: Maquina
  funcionario?: Funcionario
  is_offline?: boolean
}

export interface Manutencao {
  id: string
  data: string
  maquina_id: string
  horimetro: number
  tipo:
    | 'troca de óleo do motor'
    | 'óleo hidráulico'
    | 'filtros'
    | 'graxa/lubrificação'
    | 'pneus'
    | 'peças'
    | 'conserto'
    | 'revisão'
  descricao: string
  custo: number
  oficina_responsavel?: string | null
  fotos?: string[]
  criado_por?: string | null
  criado_em?: string
  maquina?: Maquina
  is_offline?: boolean
}

export interface Cobranca {
  id: string
  numero: string
  cliente_id: string
  obra_id?: string | null
  periodo_inicio: string
  periodo_fim: string
  horas_totais: number
  valor_total: number
  valor_pago: number
  data_vencimento: string
  status: 'em_aberto' | 'pago_parcial' | 'pago' | 'atrasado'
  observacoes?: string | null
  criado_em?: string
  cliente?: Cliente
  obra?: Obra
  pagamentos?: Pagamento[]
}

export interface Pagamento {
  id: string
  cobranca_id: string
  data: string
  valor: number
  forma_pagamento: 'Pix' | 'dinheiro' | 'boleto' | 'transferência' | 'cheque'
  comprovante_url?: string | null
  observacao?: string | null
  criado_em?: string
}
