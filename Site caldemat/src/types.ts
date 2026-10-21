export type Perfil = {
  id: string
  nome: string
  is_admin: boolean
  pode_materia_prima: boolean
  pode_estoque: boolean
  pode_clientes: boolean
  pode_pedidos: boolean
  ativo: boolean
  // Dados cadastrais (opcionais)
  cpf?: string | null
  telefone?: string | null
  cargo?: string | null
  data_admissao?: string | null
  email?: string | null
}

export type Modulo = 'materia_prima' | 'estoque' | 'clientes' | 'pedidos' | 'funcionarios'

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

export type StatusPedido = 'emitido' | 'aprovado' | 'reprovado' | 'faturado'

export type Pedido = {
  id: string
  cliente_id: string
  data: string
  obs: string | null
  usuario_id: string | null
  status?: StatusPedido
  faturado_em?: string | null
  cliente_nome?: string | null
}

export type PedidoItem = {
  id: string
  pedido_id: string
  descricao: string
  quantidade: number
  valor_unitario: number
}
