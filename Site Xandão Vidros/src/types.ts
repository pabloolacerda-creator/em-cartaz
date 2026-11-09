export type Perfil = {
  id: string
  nome: string
  is_admin: boolean
  pode_materia_prima: boolean
  pode_estoque: boolean
  pode_clientes: boolean
  pode_pedidos: boolean
  pode_produtos: boolean
  pode_financeiro: boolean
  pode_leads: boolean
  ativo: boolean
  // Dados cadastrais (opcionais)
  cpf?: string | null
  telefone?: string | null
  cargo?: string | null
  data_admissao?: string | null
  email?: string | null
}

export type Modulo = 'materia_prima' | 'estoque' | 'clientes' | 'pedidos' | 'produtos' | 'financeiro' | 'leads' | 'funcionarios'

export type ContaFinanceira = {
  id: string
  nome: string
  tipo: 'banco' | 'caixa'
  saldo_inicial: number
  ativo: boolean
  saldo?: number // vem da view saldo_contas
}

export type TipoLancamento = 'receita' | 'despesa'

export type Lancamento = {
  id: string
  tipo: TipoLancamento
  descricao: string
  valor: number
  vencimento: string
  pago_em?: string | null
  conta_id?: string | null
  categoria?: string | null
  fornecedor?: string | null
  cliente_id?: string | null
  pedido_id?: string | null
  obs?: string | null
  usuario_id?: string | null
  created_at?: string
}

export type Produto = {
  id: string
  nome: string
  unidade: string
  valor_venda: number
  descricao?: string | null
  ativo: boolean
}

export type Material = {
  id: string
  nome: string
  unidade: string
  estoque_minimo: number | null
  ativo: boolean
  // Número automático gerado pelo sistema (código sequencial)
  codigo?: number | null
  // Campos técnicos (opcionais)
  forma?: string | null
  norma_tecnica?: string | null
  grau_liga?: string | null
  espessura?: number | null
  largura?: number | null
  comprimento?: number | null
  diametro_externo?: number | null
  espessura_parede?: number | null
  acabamento?: string | null
  propriedades?: string | null
}

export type Movimentacao = {
  id: string
  material_id: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  data: string
  obs: string | null
  usuario_id: string | null
  unidade?: string | null
}

export type Cliente = {
  id: string
  nome: string
  documento: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  obs: string | null
  ativo: boolean
}

export type StatusLead = 'novo' | 'contatado' | 'ganho' | 'perdido'

export type Lead = {
  id: string
  criado_em: string
  nome: string
  whatsapp: string
  documento: string | null
  capacidade_litros: number | null
  bacia_contencao: boolean | null
  cidade: string | null
  status: StatusLead
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  obs: string | null
}

export type StatusPedido = 'emitido' | 'aprovado' | 'reprovado' | 'faturado'

export type Pedido = {
  id: string
  cliente_id: string
  data: string
  obs: string | null
  usuario_id: string | null
  status?: StatusPedido
  faturado_em?: string | null
  // Numeração nativa do sistema (imutável)
  numero?: number | null
  fatura_numero?: number | null
  // Ordem de Serviço (número gerado ao emitir a OS) e observação interna de produção
  os_numero?: number | null
  obs_producao?: string | null
  // Desconto do orçamento/pedido
  desconto?: number | null
  desconto_tipo?: 'valor' | 'percentual' | null
  // Informações adicionais (bloco 3)
  prazo_entrega?: string | null
  forma_pagamento?: string | null
  // Dados do cliente (bloco 1) — vindos do cadastro de clientes via join
  cliente_nome?: string | null
  cliente_documento?: string | null
  cliente_endereco?: string | null
  cliente_telefone?: string | null
  cliente_email?: string | null
}

export type PedidoItem = {
  id: string
  pedido_id: string
  descricao: string
  quantidade: number
  valor_unitario: number
  obs?: string | null
  // Item de produto/serviço (preço de sistema + cálculo por medida)
  produto_id?: string | null
  unidade?: string | null
  largura?: number | null
  altura?: number | null
  descricao_adicional?: string | null
  valor_total?: number | null
}
