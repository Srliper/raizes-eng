import { AppError } from '../utils/AppError';
import { PedidoMulticanalRepository } from '../repositories/PedidoMulticanalRepository';
import { TransacaoPagamentoRepository } from '../repositories/TransacaoPagamentoRepository';
import { LogAuditoriaRepository } from '../repositories/LogAuditoriaRepository';
import { GatewayPagamentoMockService } from './GatewayPagamentoMockService';
import { WebhookPagamentoEntrada } from '../types/dominio';
import { StatusPedidoMulticanal } from '@prisma/client';

export class ProcessarWebhookPagamentoService {
  constructor(
    private readonly transacaoRepository = new TransacaoPagamentoRepository(),
    private readonly pedidoRepository = new PedidoMulticanalRepository(),
    private readonly logAuditoriaRepository = new LogAuditoriaRepository(),
    private readonly gatewayMockService = new GatewayPagamentoMockService(),
  ) {}

  async executar(entrada: WebhookPagamentoEntrada): Promise<{ reconhecido: boolean }> {
    const assinaturaValida = this.gatewayMockService.validarAssinatura(
      entrada.gatewayRef,
      entrada.status,
      entrada.assinatura,
    );

    if (!assinaturaValida) {
      throw new AppError('Assinatura HMAC do webhook inválida', 401);
    }

    const transacao = await this.transacaoRepository.buscarPorGatewayRef(entrada.gatewayRef);
    if (!transacao) {
      throw new AppError('Transação de pagamento não encontrada', 404);
    }

    if (transacao.status !== 'PENDING') {
      return { reconhecido: false };
    }

    const statusTransacao = entrada.status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    const transacaoAtualizada = await this.transacaoRepository.atualizarStatusPorGatewayRef(
      entrada.gatewayRef,
      statusTransacao,
    );

    const novoStatusPedido =
      statusTransacao === 'APPROVED'
        ? StatusPedidoMulticanal.PREPARING
        : StatusPedidoMulticanal.PAYMENT_FAILED;

    await this.pedidoRepository.atualizarStatus(transacaoAtualizada.pedidoId, novoStatusPedido);

    await this.logAuditoriaRepository.registrar({
      correlationId: entrada.correlationId,
      severidade: 'INFO',
      autorTipo: 'INTEGRATION',
      operacao: 'WEBHOOK_PAYMENT',
      recurso: 'transacoes_pagamento',
      recursoId: entrada.gatewayRef,
      payloadResumo: { status: statusTransacao },
      lgpdMetadados: {
        legalBasis: 'contract_execution',
        purpose: 'confirmacao_pagamento',
        containsPII: false,
      },
    });

    return { reconhecido: true };
  }
}
