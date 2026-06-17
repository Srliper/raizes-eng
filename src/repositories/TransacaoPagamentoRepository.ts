import { prismaCliente } from '../config/prisma';
import { TransacaoPagamento, StatusTransacaoPagamento } from '@prisma/client';

export class TransacaoPagamentoRepository {
  async buscarPorGatewayRef(gatewayRef: string): Promise<TransacaoPagamento | null> {
    return prismaCliente.transacaoPagamento.findUnique({
      where: { gatewayRef },
      include: { pedido: true },
    });
  }

  async atualizarStatusPorGatewayRef(
    gatewayRef: string,
    status: StatusTransacaoPagamento,
  ): Promise<TransacaoPagamento> {
    return prismaCliente.transacaoPagamento.update({
      where: { gatewayRef },
      data: {
        status,
        webhookRecebidoEm: new Date(),
      },
      include: { pedido: true },
    });
  }
}
