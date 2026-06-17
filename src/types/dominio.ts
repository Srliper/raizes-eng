import { CanalAtendimento, StatusPedidoMulticanal } from '@prisma/client';

export interface ItemPedidoEntrada {
  produtoId: string;
  quantidade: number;
  observacoes?: string;
}

export interface CriarPedidoMulticanalEntrada {
  unidadeId: string;
  canal: CanalAtendimento;
  clienteId?: string;
  itens: ItemPedidoEntrada[];
  idempotencyKey: string;
  correlationId: string;
}

export interface PedidoMulticanalResposta {
  publicOrderId: string;
  status: StatusPedidoMulticanal;
  valorTotal: number;
  canal: CanalAtendimento;
  unidadeId: string;
}

export interface WebhookPagamentoEntrada {
  gatewayRef: string;
  status: 'APPROVED' | 'REJECTED';
  assinatura: string;
  correlationId: string;
}

export interface RegistrarConsentimentoEntrada {
  clienteId: string;
  versaoTermo: string;
  aceito: boolean;
  canal: 'APP' | 'TOTEM' | 'BALCAO' | 'WEB';
  finalidades: string[];
  correlationId: string;
}

export interface AnonimizarClienteEntrada {
  clienteId: string;
  solicitanteId: string;
  ipOrigem?: string;
  correlationId: string;
}
